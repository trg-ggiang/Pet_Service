import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockAuthSession } from "../../../tests/mocks/auth.mock";
import {
  mockDoctorAppointment,
  mockDoctorExamDetail,
  mockDoctorExamRecord,
  mockDoctorMeta,
  mockDoctorNotification,
  mockDoctorSummary,
  mockServiceOrder,
  mockSpecialistService,
} from "../../../tests/mocks/doctorOperations.mock";
import { writeStorage } from "../../../utils/authSession";
import { doctorAppointmentsService } from "./doctorAppointments";

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

describe("doctorAppointmentsService", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
    writeStorage(localStorage, mockAuthSession);
  });

  test("throws before fetching when auth session is missing", async () => {
    // Arrange
    localStorage.clear();
    sessionStorage.clear();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    // Act
    const action = () => doctorAppointmentsService.fetchAppointments();

    // Assert
    await expect(action()).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("fetches doctor appointments with auth headers and server metadata", async () => {
    // Arrange
    mockFetchJson({
      ok: true,
      appointments: [mockDoctorAppointment],
      summary: mockDoctorSummary,
      meta: mockDoctorMeta,
    });

    // Act
    const result = await doctorAppointmentsService.fetchAppointments();

    // Assert
    expect(result).toEqual({
      appointments: [mockDoctorAppointment],
      summary: mockDoctorSummary,
      meta: mockDoctorMeta,
    });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/doctor/appointments",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockAuthSession.token}`,
        }),
      }),
    );
  });

  test("defaults appointment summary and metadata when response omits them", async () => {
    // Arrange
    mockFetchJson({ ok: true, appointments: [mockDoctorAppointment] });

    // Act
    const result = await doctorAppointmentsService.fetchAppointments();

    // Assert
    expect(result.summary).toEqual({
      total: 1,
      completed: 0,
      inProgress: 0,
      scheduled: 1,
    });
    expect(result.meta.roomLabel).toBe("Phòng 1");
  });

  test("fetches notifications and marks them read with PATCH requests", async () => {
    // Arrange
    mockFetchJson({
      ok: true,
      notifications: [mockDoctorNotification],
      summary: { total: 1, unreadCount: 1 },
    });

    // Act
    const payload = await doctorAppointmentsService.fetchNotifications();
    await doctorAppointmentsService.markNotificationRead(mockDoctorNotification.id);
    await doctorAppointmentsService.markAllNotificationsRead();

    // Assert
    expect(payload.notifications).toEqual([mockDoctorNotification]);
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5050/api/doctor/appointments/notifications/7001/read",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      "http://localhost:5050/api/doctor/appointments/notifications/read-all",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  test("starts and completes an exam with PUT requests", async () => {
    // Arrange
    mockFetchJson({ ok: true, message: "ok" });

    // Act
    await doctorAppointmentsService.startExam(502);
    await doctorAppointmentsService.completeExam(502);

    // Assert
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5050/api/doctor/appointments/502/start",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5050/api/doctor/appointments/502/complete",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  test("fetches exam detail and sends draft/complete record payloads", async () => {
    // Arrange
    mockFetchJson({ ok: true, detail: mockDoctorExamDetail, message: "saved" });

    // Act
    const detail = await doctorAppointmentsService.fetchExamDetail(502);
    const draftMessage = await doctorAppointmentsService.saveExamDraft(502, mockDoctorExamRecord);
    const completeMessage = await doctorAppointmentsService.completeExamWithRecord(502, mockDoctorExamRecord);

    // Assert
    expect(detail).toEqual(mockDoctorExamDetail);
    expect(draftMessage).toBe("saved");
    expect(completeMessage).toBe("saved");
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5050/api/doctor/appointments/502/exam-draft",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ record: mockDoctorExamRecord }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      "http://localhost:5050/api/doctor/appointments/502/exam-complete",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ record: mockDoctorExamRecord }),
      }),
    );
  });

  test("handles urgent alerts and specialist service orders", async () => {
    // Arrange
    mockFetchJson({
      ok: true,
      message: "sent",
      services: [mockSpecialistService],
      serviceOrders: [mockServiceOrder],
      serviceOrder: mockServiceOrder,
    });

    // Act
    const alertMessage = await doctorAppointmentsService.sendUrgentAlert(502, "Needs support");
    const services = await doctorAppointmentsService.listSpecialistServices();
    const orders = await doctorAppointmentsService.listServiceOrders(502);
    const order = await doctorAppointmentsService.createServiceOrder(502, 401, "Chest view");
    await doctorAppointmentsService.cancelServiceOrder(901);

    // Assert
    expect(alertMessage).toBe("sent");
    expect(services).toEqual([mockSpecialistService]);
    expect(orders).toEqual([mockServiceOrder]);
    expect(order).toEqual(mockServiceOrder);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5050/api/doctor/appointments/502/urgent-alert",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "Needs support" }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      4,
      "http://localhost:5050/api/doctor/appointments/502/service-orders",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ serviceId: 401, note: "Chest view" }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      5,
      "http://localhost:5050/api/doctor/appointments/service-orders/901",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
