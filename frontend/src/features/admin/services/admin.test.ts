import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockAuthSession } from "../../../tests/mocks/auth.mock";
import {
  mockAdminAppointment,
  mockAdminAppointmentSummary,
  mockAdminCustomer,
  mockAdminDashboard,
  mockAdminDoctor,
  mockAdminReports,
  mockAdminService,
  mockAdminServicePayload,
  mockAdminServiceSummary,
  mockAdminSettings,
  mockAdminStaffMember,
  mockAdminStaffSummary,
  mockAdminStaffUser,
  mockAdminUsersSummary,
} from "../../../tests/mocks/adminOperations.mock";
import { writeStorage } from "../../../utils/authSession";
import { adminService } from "./admin";

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

describe("adminService", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
    writeStorage(localStorage, mockAuthSession);
  });

  test("fetches dashboard with auth headers", async () => {
    // Arrange
    mockFetchJson({ ok: true, dashboard: mockAdminDashboard });

    // Act
    const result = await adminService.getDashboard();

    // Assert
    expect(result.dashboard).toEqual(mockAdminDashboard);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/admin/dashboard",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockAuthSession.token}`,
        }),
      }),
    );
  });

  test("lists users with trimmed search query and updates lock status", async () => {
    // Arrange
    mockFetchJson({
      ok: true,
      customers: [mockAdminCustomer],
      doctors: [mockAdminDoctor],
      staff: [mockAdminStaffUser],
      summary: mockAdminUsersSummary,
      user: { id: "C101", role: "customer", locked: true },
    });

    // Act
    const users = await adminService.listUsers({ role: "customers", search: "  milo  " });
    await adminService.updateUserLock("customer", "C101", true);

    // Assert
    expect(users.customers).toEqual([mockAdminCustomer]);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5050/api/admin/users?role=customers&search=milo",
      expect.any(Object),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5050/api/admin/users/customer/C101/lock",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ locked: true }),
      }),
    );
  });

  test("uses correct service CRUD endpoints and payloads", async () => {
    // Arrange
    mockFetchJson({
      ok: true,
      services: [mockAdminService],
      summary: mockAdminServiceSummary,
      service: mockAdminService,
      id: "SV-701",
    });

    // Act
    const list = await adminService.listServices({ category: "clinic", status: "active", search: " exam " });
    await adminService.createService(mockAdminServicePayload);
    await adminService.updateService("SV-701", mockAdminServicePayload);
    await adminService.updateServiceStatus("SV-701", "inactive");
    await adminService.deleteService("SV-701");

    // Assert
    expect(list.services).toEqual([mockAdminService]);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5050/api/admin/services?category=clinic&status=active&search=exam",
      expect.any(Object),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5050/api/admin/services",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(mockAdminServicePayload),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      4,
      "http://localhost:5050/api/admin/services/SV-701/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "inactive" }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      5,
      "http://localhost:5050/api/admin/services/SV-701",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  test("lists appointments and updates appointment status", async () => {
    // Arrange
    mockFetchJson({
      ok: true,
      appointments: [mockAdminAppointment],
      summary: mockAdminAppointmentSummary,
      appointment: mockAdminAppointment,
    });

    // Act
    const result = await adminService.listAppointments({ status: "completed", search: " milo " });
    await adminService.updateAppointmentStatus("APT-501", "cancelled");

    // Assert
    expect(result.summary).toEqual(mockAdminAppointmentSummary);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5050/api/admin/appointments?status=completed&search=milo",
      expect.any(Object),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5050/api/admin/appointments/APT-501/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled" }),
      }),
    );
  });

  test("uses staff management endpoints with encoded ids", async () => {
    // Arrange
    mockFetchJson({
      ok: true,
      staff: [mockAdminStaffMember],
      summary: mockAdminStaffSummary,
      user: { id: "NV-C201", role: "doctor", locked: true },
      member: { userId: "u-new", name: "New Staff", email: "new@example.test", role: "staff" },
    });

    // Act
    const result = await adminService.listStaff({ department: "clinic", status: "active", search: " le " });
    await adminService.updateStaffLock("NV-C201", true);
    await adminService.updateStaffProfile("NV-C201", { name: "Dr Le An", room: "Room 3" });
    await adminService.createStaff({ name: "New Staff", email: "new@example.test", password: "secret123" });

    // Assert
    expect(result.staff).toEqual([mockAdminStaffMember]);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5050/api/admin/staff?department=clinic&status=active&search=le",
      expect.any(Object),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5050/api/admin/staff/NV-C201/lock",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      4,
      "http://localhost:5050/api/admin/staff",
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("uses schedule, reports, health trends and settings endpoints", async () => {
    // Arrange
    const scheduleRow = { date: "2099-07-20", from: "08:00", to: "10:00", roomName: "Room 2", on: true };
    mockFetchJson({
      ok: true,
      doctors: [{ id: 201, name: "Dr Le An", room: "Room 2" }],
      schedules: [],
      weekStart: "2099-07-19",
      weekEnd: "2099-07-25",
      message: "saved",
      slotCount: 4,
      reports: mockAdminReports,
      trends: { summary: { totalPets: 1 } },
      settings: mockAdminSettings,
    });

    // Act
    await adminService.getDoctorWeekSchedules("2099-07-19");
    await adminService.saveDoctorSchedule("201", [scheduleRow]);
    const reports = await adminService.getReports();
    await adminService.getHealthTrends();
    const settings = await adminService.getSettings();
    await adminService.updateSettings(settings.settings);

    // Assert
    expect(reports.reports).toEqual(mockAdminReports);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5050/api/admin/doctors/schedules?weekStart=2099-07-19",
      expect.any(Object),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5050/api/admin/doctors/201/schedules",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ rows: [scheduleRow], slotDuration: 30 }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      6,
      "http://localhost:5050/api/admin/settings",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(mockAdminSettings),
      }),
    );
  });
});
