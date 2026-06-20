import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  cancelCustomerAppointment,
  createCustomerAppointment,
  rescheduleCustomerAppointment,
} from "../../services/customer/customerAppointmentsApi";
import { fetchCustomerServiceHistory } from "../../services/customer/customerServiceHistoryApi";
import { doctorAppointmentsService } from "../../features/doctor/services/doctorAppointments";
import { staffAppointmentsService } from "../../features/staff/services/staffAppointments";
import { mockAuthSession } from "../mocks/auth.mock";
import { mockDoctorExamRecord } from "../mocks/doctorOperations.mock";
import { writeStorage } from "../../utils/authSession";

function mockFetchJson(payload: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: vi.fn().mockResolvedValue(payload),
    }),
  );
}

describe("cross-feature critical frontend flows", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
    writeStorage(localStorage, mockAuthSession);
  });

  test("keeps the medical journey API contract across customer, staff, doctor and history clients", async () => {
    // Arrange
    mockFetchJson({
      ok: true,
      message: "ok",
      appointment: { id: "APT-30", appointmentId: 30 },
      history: [{ appointmentId: 30, invoiceId: 90, status: "completed", type: "medical" }],
      summary: { total: 1, filtered: 1 },
    });

    // Act
    await createCustomerAppointment({
      petId: 20,
      serviceType: "MEDICAL",
      serviceId: 60,
      providerId: 40,
      date: "2099-07-20",
      time: "09:00",
      note: "Coughing",
    } as never);
    await staffAppointmentsService.confirmAppointment(30);
    await staffAppointmentsService.checkInAppointment(30);
    await doctorAppointmentsService.saveExamDraft(30, mockDoctorExamRecord);
    await doctorAppointmentsService.completeExamWithRecord(30, mockDoctorExamRecord);
    await staffAppointmentsService.markPaymentPaid(90, "cash");
    const history = await fetchCustomerServiceHistory({ type: "medical" });

    // Assert
    expect(history.summary).toEqual({ total: 1, filtered: 1 });
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5050/api/customer/appointments",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          petId: 20,
          serviceType: "MEDICAL",
          serviceId: 60,
          providerId: 40,
          date: "2099-07-20",
          time: "09:00",
          note: "Coughing",
        }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5050/api/staff/appointments/30/confirm",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      "http://localhost:5050/api/staff/appointments/30/checkin",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      4,
      "http://localhost:5050/api/doctor/appointments/30/exam-draft",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ record: mockDoctorExamRecord }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      5,
      "http://localhost:5050/api/doctor/appointments/30/exam-complete",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ record: mockDoctorExamRecord }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      6,
      "http://localhost:5050/api/staff/payments/90/pay",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ method: "cash" }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      7,
      "http://localhost:5050/api/customer/service-history?type=medical",
      expect.any(Object),
    );
  });

  test("keeps grooming, boarding and reschedule/cancel journey endpoints aligned", async () => {
    // Arrange
    const dailyStatus = {
      breakfast: true,
      lunch: true,
      dinner: true,
      cleaned: true,
      exercised: true,
      healthCheck: true,
    };
    mockFetchJson({
      ok: true,
      message: "ok",
      appointment: { id: "APT-31", appointmentId: 31 },
      invoiceId: 91,
      nights: 3,
      roomFee: 540000,
      foodFee: 60000,
      serviceFee: 0,
      total: 600000,
    });

    // Act
    await staffAppointmentsService.completeGroomingAppointment(31);
    await staffAppointmentsService.markPaymentPaid(91, "transfer");
    await staffAppointmentsService.approveBoardingBooking(120);
    await staffAppointmentsService.checkInBoarding(120);
    await staffAppointmentsService.updateBoardingDailyStatus(120, dailyStatus, { dailyNote: "Ate well" });
    const checkout = await staffAppointmentsService.checkOutBoarding(120, { foodFeePerDay: 20000, paymentMethod: "cash" });
    await rescheduleCustomerAppointment("APT-31", { date: "2099-07-21", time: "10:00" } as never);
    await cancelCustomerAppointment("APT-31", { reason: "Customer request" });

    // Assert
    expect(checkout).toEqual({
      invoiceId: 91,
      nights: 3,
      roomFee: 540000,
      foodFee: 60000,
      serviceFee: 0,
      total: 600000,
    });
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5050/api/staff/appointments/31/complete-grooming",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5050/api/staff/payments/91/pay",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ method: "transfer" }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      "http://localhost:5050/api/staff/boarding/120/approve",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      5,
      "http://localhost:5050/api/staff/boarding/120/daily-status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ todayStatus: dailyStatus, dailyNote: "Ate well" }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      6,
      "http://localhost:5050/api/staff/boarding/120/checkout",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ foodFeePerDay: 20000, paymentMethod: "cash" }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      7,
      "http://localhost:5050/api/customer/appointments/APT-31/reschedule",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ date: "2099-07-21", time: "10:00" }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      8,
      "http://localhost:5050/api/customer/appointments/APT-31/cancel",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ reason: "Customer request" }),
      }),
    );
  });
});
