const request = require("supertest");

let mockAuthUser = {
  id: 99,
  email: "admin@example.test",
  role: "admin",
  status: "active",
  fullName: "Admin User",
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
}));

jest.mock("../../src/services/emailService", () => ({
  getEmailTemplates: jest.fn(),
  updateEmailTemplates: jest.fn(),
  sendCustomEmail: jest.fn(),
}));

jest.mock("../../src/services/doctorScheduleService", () => ({
  saveDoctorScheduleSlots: jest.fn(),
}));

jest.mock("../../src/services/adminAuditService", () => ({
  recordAdminAudit: jest.fn().mockResolvedValue(null),
}));

const app = require("../../src/server");
const {
  getAdminDashboard,
  getAdminHealthTrends,
  getAdminSettings,
  updateAdminSettings,
  createAdminService,
  createAdminStaffMember,
  deleteAdminService,
  listAdminServices,
  updateAdminService,
  updateAdminUserProfile,
} = require("../../src/services/adminService");
const {
  getEmailTemplates,
  updateEmailTemplates,
  sendCustomEmail,
} = require("../../src/services/emailService");
const { saveDoctorScheduleSlots } = require("../../src/services/doctorScheduleService");
const { recordAdminAudit } = require("../../src/services/adminAuditService");

describe("admin routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = {
      id: 99,
      email: "admin@example.test",
      role: "admin",
      status: "active",
      fullName: "Admin User",
    };
  });

  test("GET /api/admin/dashboard returns dashboard data for an admin", async () => {
    // Arrange
    const dashboard = { totals: { users: 12, appointments: 4 } };
    getAdminDashboard.mockResolvedValueOnce(dashboard);

    // Act
    const response = await request(app).get("/api/admin/dashboard");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, dashboard });
    expect(getAdminDashboard).toHaveBeenCalledTimes(1);
  });

  test("GET /api/admin/services forwards filter query to service listing", async () => {
    // Arrange
    const result = {
      services: [{ id: "SV-701", name: "Annual Exam" }],
      summary: { total: 1 },
    };
    listAdminServices.mockResolvedValueOnce(result);

    // Act
    const response = await request(app)
      .get("/api/admin/services")
      .query({ category: "clinic", status: "active", search: "exam" });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, ...result });
    expect(listAdminServices).toHaveBeenCalledWith({
      category: "clinic",
      status: "active",
      search: "exam",
    });
  });

  test("POST /api/admin/services creates a service and returns 201", async () => {
    // Arrange
    const input = {
      name: "Dental Cleaning",
      category: "clinic",
      price: 350000,
      duration: 45,
    };
    const service = { id: "SV-702", ...input, status: "active" };
    createAdminService.mockResolvedValueOnce(service);

    // Act
    const response = await request(app)
      .post("/api/admin/services")
      .send(input);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ ok: true, service });
    expect(createAdminService).toHaveBeenCalledWith(input);
  });

  test("PATCH /api/admin/services/:id updates a service by display id", async () => {
    // Arrange
    const input = { price: 420000, status: "inactive" };
    const service = { id: "SV-702", name: "Dental Cleaning", ...input };
    updateAdminService.mockResolvedValueOnce(service);

    // Act
    const response = await request(app)
      .patch("/api/admin/services/SV-702")
      .send(input);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, service });
    expect(updateAdminService).toHaveBeenCalledWith("SV-702", input);
  });

  test("DELETE /api/admin/services/:id deletes a service by display id", async () => {
    // Arrange
    deleteAdminService.mockResolvedValueOnce({ deleted: true });

    // Act
    const response = await request(app).delete("/api/admin/services/SV-702");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, deleted: true });
    expect(deleteAdminService).toHaveBeenCalledWith("SV-702");
    expect(recordAdminAudit).toHaveBeenCalledWith({
      actor: mockAuthUser,
      action: "DELETE_SERVICE",
      targetType: "service",
      targetId: "SV-702",
    });
  });

  test("GET /api/admin/health-trends returns aggregated health trends", async () => {
    // Arrange
    const trends = {
      ageGroups: [{ label: "Adult", count: 8 }],
      species: [{ label: "Dog", count: 5 }],
      diseases: [{ name: "Dermatitis", count: 2 }],
    };
    getAdminHealthTrends.mockResolvedValueOnce(trends);

    // Act
    const response = await request(app).get("/api/admin/health-trends");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, trends });
    expect(getAdminHealthTrends).toHaveBeenCalledTimes(1);
  });

  test("GET /api/admin/settings passes authenticated admin to settings service", async () => {
    // Arrange
    const settings = {
      profile: { email: "admin@example.test" },
      notifications: { email: true },
    };
    getAdminSettings.mockResolvedValueOnce(settings);

    // Act
    const response = await request(app).get("/api/admin/settings");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, settings });
    expect(getAdminSettings).toHaveBeenCalledWith(mockAuthUser);
  });

  test("PUT /api/admin/settings persists settings patch for authenticated admin", async () => {
    // Arrange
    const input = { notifications: { appointmentAlerts: false } };
    const settings = { notifications: { appointmentAlerts: false } };
    updateAdminSettings.mockResolvedValueOnce(settings);

    // Act
    const response = await request(app)
      .put("/api/admin/settings")
      .send(input);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, settings });
    expect(updateAdminSettings).toHaveBeenCalledWith(input, mockAuthUser);
  });

  test("POST /api/admin/staff creates a staff member and returns 201", async () => {
    // Arrange
    const input = {
      fullName: "Tran Thi Staff",
      email: "staff@example.test",
      role: "staff",
      department: "Front desk",
    };
    const member = { id: "NV-S-010", ...input, status: "active" };
    createAdminStaffMember.mockResolvedValueOnce(member);

    // Act
    const response = await request(app)
      .post("/api/admin/staff")
      .send(input);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ ok: true, member });
    expect(createAdminStaffMember).toHaveBeenCalledWith(input);
  });

  test("PATCH /api/admin/staff/:id/profile maps staff id to staff profile update", async () => {
    // Arrange
    const input = { phone: "0909000000", fullName: "Tran Thi Staff" };
    const result = { user: { id: "NV-S-010", ...input } };
    updateAdminUserProfile.mockResolvedValueOnce(result);

    // Act
    const response = await request(app)
      .patch("/api/admin/staff/NV-S-010/profile")
      .send(input);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, ...result });
    expect(updateAdminUserProfile).toHaveBeenCalledWith("staff", "NV-S-010", input);
  });

  test("blocks non-admin users before calling admin services", async () => {
    // Arrange
    mockAuthUser = {
      ...mockAuthUser,
      role: "doctor",
      doctorId: 30,
    };

    // Act
    const response = await request(app).get("/api/admin/dashboard");

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toEqual(expect.objectContaining({ ok: false }));
    expect(getAdminDashboard).not.toHaveBeenCalled();
  });

  test("GET /api/admin/email-templates returns configured templates", async () => {
    // Arrange
    const templates = { appointment_confirmation: { subject: "Appointment" } };
    getEmailTemplates.mockResolvedValueOnce(templates);

    // Act
    const response = await request(app).get("/api/admin/email-templates");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, templates });
    expect(getEmailTemplates).toHaveBeenCalledTimes(1);
  });

  test("PUT /api/admin/email-templates persists only the templates payload", async () => {
    // Arrange
    const templates = { custom: { subject: "Clinic update", heading: "Hello", message: "News" } };
    updateEmailTemplates.mockResolvedValueOnce(templates);

    // Act
    const response = await request(app)
      .put("/api/admin/email-templates")
      .send({ templates, ignored: "value" });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, templates });
    expect(updateEmailTemplates).toHaveBeenCalledWith(templates);
  });

  test("POST /api/admin/email-templates/test forwards a custom email request", async () => {
    // Arrange
    sendCustomEmail.mockResolvedValueOnce({ sent: true, messageId: "test-message" });
    const payload = {
      to: "recipient@example.test",
      subject: "SMTP check",
      heading: "Test",
      message: "It works",
    };

    // Act
    const response = await request(app)
      .post("/api/admin/email-templates/test")
      .send(payload);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, sent: true, messageId: "test-message" });
    expect(sendCustomEmail).toHaveBeenCalledWith(payload);
  });

  test("POST /api/admin/email-templates/test maps delivery errors to 400", async () => {
    // Arrange
    sendCustomEmail.mockRejectedValueOnce(new Error("SMTP unavailable"));

    // Act
    const response = await request(app)
      .post("/api/admin/email-templates/test")
      .send({ to: "recipient@example.test" });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ ok: false, message: "SMTP unavailable" });
  });

  test("PUT /api/admin/doctors/:id/schedules saves normalized doctor slots", async () => {
    // Arrange
    const rows = [{ date: "2099-08-01", from: "08:00", to: "10:00" }];
    saveDoctorScheduleSlots.mockResolvedValueOnce({ scheduleCount: 1, slotCount: 4 });

    // Act
    const response = await request(app)
      .put("/api/admin/doctors/DOC-300/schedules")
      .send({ rows, slotDuration: 30 });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ ok: true, scheduleCount: 1, slotCount: 4 }));
    expect(saveDoctorScheduleSlots).toHaveBeenCalledWith(300, rows, { slotDuration: 30 });
  });
});
