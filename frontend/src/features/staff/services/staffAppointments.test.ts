import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockAuthSession } from "../../../tests/mocks/auth.mock";
import {
  mockBoardingStatus,
  mockPayment,
  mockStaffAppointment,
  mockStaffProfile,
  mockStaffSummary,
} from "../../../tests/mocks/staffOperations.mock";
import { writeStorage } from "../../../utils/authSession";
import { staffAppointmentsService } from "./staffAppointments";

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

describe("staffAppointmentsService", () => {
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
    const action = () => staffAppointmentsService.fetchProfile();

    // Assert
    await expect(action()).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("fetches staff profile with auth headers", async () => {
    // Arrange
    mockFetchJson({ ok: true, profile: mockStaffProfile });

    // Act
    const profile = await staffAppointmentsService.fetchProfile();

    // Assert
    expect(profile).toEqual(mockStaffProfile);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/staff/profile",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockAuthSession.token}`,
        }),
      }),
    );
  });

  test("fetches staff portal summary", async () => {
    // Arrange
    mockFetchJson({ ok: true, summary: mockStaffSummary });

    // Act
    const summary = await staffAppointmentsService.fetchSummary();

    // Assert
    expect(summary).toEqual(mockStaffSummary);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/staff/summary",
      expect.any(Object),
    );
  });

  test("fetches pending appointments and defaults autoConfirmedCount", async () => {
    // Arrange
    mockFetchJson({ ok: true, appointments: [mockStaffAppointment] });

    // Act
    const result = await staffAppointmentsService.fetchPendingAppointments();

    // Assert
    expect(result).toEqual({ appointments: [mockStaffAppointment], autoConfirmedCount: 0 });
  });

  test("confirms and checks in appointments with PUT requests", async () => {
    // Arrange
    mockFetchJson({ ok: true, message: "ok" });

    // Act
    await staffAppointmentsService.confirmAppointment(300);
    await staffAppointmentsService.checkInAppointment(300);

    // Assert
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5050/api/staff/appointments/300/confirm",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5050/api/staff/appointments/300/checkin",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  test("updates grooming status with PATCH payload", async () => {
    // Arrange
    mockFetchJson({ ok: true, message: "ok" });

    // Act
    await staffAppointmentsService.updateGroomingStatus(900, "IN_PROGRESS");

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/staff/grooming/900/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      }),
    );
  });

  test("updates boarding daily status with note and image options", async () => {
    // Arrange
    mockFetchJson({ ok: true, message: "ok" });

    // Act
    await staffAppointmentsService.updateBoardingDailyStatus(700, mockBoardingStatus, {
      dailyNote: "Ate well",
      imageDataUrl: "data:image/png;base64,abc",
    });

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/staff/boarding/700/daily-status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          todayStatus: mockBoardingStatus,
          dailyNote: "Ate well",
          imageDataUrl: "data:image/png;base64,abc",
        }),
      }),
    );
  });

  test("fetches payments and marks one invoice paid", async () => {
    // Arrange
    mockFetchJson({ ok: true, payments: [mockPayment] });

    // Act
    const payments = await staffAppointmentsService.fetchPayments();
    await staffAppointmentsService.markPaymentPaid(1000, "transfer");

    // Assert
    expect(payments).toEqual([mockPayment]);
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5050/api/staff/payments/1000/pay",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ method: "transfer" }),
      }),
    );
  });
});
