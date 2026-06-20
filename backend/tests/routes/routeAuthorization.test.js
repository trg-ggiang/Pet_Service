const request = require("supertest");

let mockAuthUser = {
  id: 1,
  email: "customer@example.test",
  role: "customer",
  status: "active",
  fullName: "Nguyen Van Minh",
  customerId: 10,
};

jest.mock("../../src/middleware/authMiddleware", () => {
  const actual = jest.requireActual("../../src/middleware/authMiddleware");
  return {
    ...actual,
    authMiddleware: jest.fn((req, res, next) => {
      req.auth = {
        user: mockAuthUser,
        rawUser: { id: mockAuthUser.id },
      };
      next();
    }),
  };
});

jest.mock("../../src/services/customer/customerAppointmentsService", () => ({
  listCustomerAppointmentOptions: jest.fn(),
  listCustomerAppointmentProviders: jest.fn(),
  listCustomerAppointments: jest.fn(),
  listCustomerAppointmentsView: jest.fn(),
  createCustomerAppointment: jest.fn(),
  confirmCustomerAppointment: jest.fn(),
  rescheduleCustomerAppointment: jest.fn(),
  cancelCustomerAppointment: jest.fn(),
}));

jest.mock("../../src/services/staff/staffPortalService", () => ({
  getStaffProfile: jest.fn(),
  listStaffAppointments: jest.fn(),
  confirmAppointment: jest.fn(),
  checkInAppointment: jest.fn(),
  approveAppointmentRequest: jest.fn(),
  completeGroomingAppointment: jest.fn(),
  listGroomingTasks: jest.fn(),
  updateGroomingStatus: jest.fn(),
  listBoardingGuests: jest.fn(),
  updateBoardingDailyStatus: jest.fn(),
  listPayments: jest.fn(),
  markPaymentPaid: jest.fn(),
  getStaffPortalSummary: jest.fn(),
  createWalkInAppointment: jest.fn(),
}));

jest.mock("../../src/services/doctor/doctorAppointmentService", () => ({
  listDoctorAppointmentsForPortal: jest.fn(),
}));

jest.mock("../../src/services/adminService", () => ({
  getAdminDashboard: jest.fn(),
  getAdminHealthTrends: jest.fn(),
  getAdminReports: jest.fn(),
  getAdminSettings: jest.fn(),
  updateAdminSettings: jest.fn(),
  createAdminService: jest.fn(),
  createAdminStaffMember: jest.fn(),
  deleteAdminService: jest.fn(),
  listAdminAppointments: jest.fn(),
  listAdminServices: jest.fn(),
  listAdminStaff: jest.fn(),
  listAdminUsers: jest.fn(),
  updateAdminAppointmentStatus: jest.fn(),
  updateAdminService: jest.fn(),
  updateAdminServiceStatus: jest.fn(),
  updateAdminUserLock: jest.fn(),
  updateAdminUserProfile: jest.fn(),
  submitRating: jest.fn(),
}));

const app = require("../../src/server");
const { listCustomerAppointmentsView } = require("../../src/services/customer/customerAppointmentsService");
const { listStaffAppointments } = require("../../src/services/staff/staffPortalService");
const { listDoctorAppointmentsForPortal } = require("../../src/services/doctor/doctorAppointmentService");
const { getAdminDashboard } = require("../../src/services/adminService");

function setAuthUser(role, overrides = {}) {
  mockAuthUser = {
    id: 1,
    email: `${role}@example.test`,
    role,
    status: "active",
    fullName: `${role} user`,
    customerId: role === "customer" ? 10 : undefined,
    staffId: role === "staff" ? 20 : undefined,
    doctorId: role === "doctor" ? 30 : undefined,
    ...overrides,
  };
}

describe("route authorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAuthUser("customer");
  });

  test("allows a customer to access customer appointment routes", async () => {
    // Arrange
    setAuthUser("customer", { customerId: 10 });
    listCustomerAppointmentsView.mockResolvedValueOnce({
      appointments: [],
      summary: { total: 0 },
      pagination: { page: 1, total: 0 },
    });

    // Act
    const response = await request(app).get("/api/customer/appointments");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: true,
        appointments: [],
      }),
    );
    expect(listCustomerAppointmentsView).toHaveBeenCalledWith(10, expect.any(Object));
  });

  test("blocks staff users from customer-only appointment routes", async () => {
    // Arrange
    setAuthUser("staff", { staffId: 20 });

    // Act
    const response = await request(app).get("/api/customer/appointments");

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toEqual(expect.objectContaining({ ok: false }));
    expect(listCustomerAppointmentsView).not.toHaveBeenCalled();
  });

  test("allows staff users to access staff appointment routes", async () => {
    // Arrange
    setAuthUser("staff", { staffId: 20 });
    listStaffAppointments.mockResolvedValueOnce({
      appointments: [],
      autoConfirmedCount: 0,
    });

    // Act
    const response = await request(app).get("/api/staff/appointments");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      appointments: [],
      autoConfirmedCount: 0,
    });
    expect(listStaffAppointments).toHaveBeenCalledWith(20);
  });

  test("blocks customer users from staff-only appointment routes", async () => {
    // Arrange
    setAuthUser("customer", { customerId: 10 });

    // Act
    const response = await request(app).get("/api/staff/appointments");

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toEqual(expect.objectContaining({ ok: false }));
    expect(listStaffAppointments).not.toHaveBeenCalled();
  });

  test("allows doctor users with a doctor profile to access doctor appointment routes", async () => {
    // Arrange
    setAuthUser("doctor", { doctorId: 30 });
    listDoctorAppointmentsForPortal.mockResolvedValueOnce({
      appointments: [],
      summary: { total: 0 },
    });

    // Act
    const response = await request(app).get("/api/doctor/appointments");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: true,
        appointments: [],
      }),
    );
    expect(listDoctorAppointmentsForPortal).toHaveBeenCalledWith(30);
  });

  test("blocks admin users from doctor-only appointment routes", async () => {
    // Arrange
    setAuthUser("admin");

    // Act
    const response = await request(app).get("/api/doctor/appointments");

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toEqual(expect.objectContaining({ ok: false }));
    expect(listDoctorAppointmentsForPortal).not.toHaveBeenCalled();
  });

  test("allows admin users to access admin dashboard routes", async () => {
    // Arrange
    setAuthUser("admin");
    getAdminDashboard.mockResolvedValueOnce({ totals: { users: 0 } });

    // Act
    const response = await request(app).get("/api/admin/dashboard");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      dashboard: { totals: { users: 0 } },
    });
    expect(getAdminDashboard).toHaveBeenCalledTimes(1);
  });

  test("blocks doctor users from admin-only dashboard routes", async () => {
    // Arrange
    setAuthUser("doctor", { doctorId: 30 });

    // Act
    const response = await request(app).get("/api/admin/dashboard");

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toEqual(expect.objectContaining({ ok: false }));
    expect(getAdminDashboard).not.toHaveBeenCalled();
  });
});
