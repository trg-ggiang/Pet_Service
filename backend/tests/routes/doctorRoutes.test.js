const request = require("supertest");

let mockAuthUser = {
  id: 30,
  email: "doctor@example.test",
  role: "doctor",
  doctorId: 300,
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

jest.mock("../../src/services/doctor/doctorAppointmentService", () => ({
  listDoctorAppointmentsForPortal: jest.fn(),
}));

jest.mock("../../src/services/doctor/doctorService", () => ({
  getDoctorExamContext: jest.fn(),
  getDoctorSettings: jest.fn(),
  getDoctorStats: jest.fn(),
  listDoctorRecords: jest.fn(),
  saveDoctorSettings: jest.fn(),
}));

const app = require("../../src/server");
const { listDoctorAppointmentsForPortal } = require("../../src/services/doctor/doctorAppointmentService");
const {
  getDoctorExamContext,
  getDoctorSettings,
  getDoctorStats,
  listDoctorRecords,
  saveDoctorSettings,
} = require("../../src/services/doctor/doctorService");

describe("doctor routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = {
      id: 30,
      email: "doctor@example.test",
      role: "doctor",
      doctorId: 300,
    };
  });

  test("GET /api/doctor/appointments maps portal appointment payload", async () => {
    // Arrange
    const payload = {
      appointments: [{ appointmentId: 501 }],
      summary: { total: 1 },
      meta: { roomLabel: "Room 2" },
    };
    listDoctorAppointmentsForPortal.mockResolvedValueOnce(payload);

    // Act
    const response = await request(app).get("/api/doctor/appointments");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, ...payload });
    expect(listDoctorAppointmentsForPortal).toHaveBeenCalledWith(mockAuthUser.doctorId);
  });

  test("GET /api/doctor/appointments returns 403 when doctor profile is missing", async () => {
    // Arrange
    mockAuthUser = { ...mockAuthUser, doctorId: undefined };

    // Act
    const response = await request(app).get("/api/doctor/appointments");

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toEqual(expect.objectContaining({ ok: false }));
    expect(listDoctorAppointmentsForPortal).not.toHaveBeenCalled();
  });

  test("GET /api/doctor/stats calls doctor stats service with doctor id", async () => {
    // Arrange
    const stats = { month: { kpis: { total: 1 } } };
    getDoctorStats.mockResolvedValueOnce(stats);

    // Act
    const response = await request(app).get("/api/doctor/stats");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, stats });
    expect(getDoctorStats).toHaveBeenCalledWith(mockAuthUser.doctorId);
  });

  test("GET /api/doctor/records forwards filters to doctor record service", async () => {
    // Arrange
    const records = [{ id: "MR-000001", pet: "Milo" }];
    listDoctorRecords.mockResolvedValueOnce(records);

    // Act
    const response = await request(app)
      .get("/api/doctor/records")
      .query({ search: "milo", species: "Dog" });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, records });
    expect(listDoctorRecords).toHaveBeenCalledWith(mockAuthUser.doctorId, {
      search: "milo",
      species: "Dog",
    });
  });

  test("GET /api/doctor/exam/:appointmentId returns exam context", async () => {
    // Arrange
    const context = { appointment: { id: 502 }, pet: { name: "Milo" } };
    getDoctorExamContext.mockResolvedValueOnce(context);

    // Act
    const response = await request(app).get("/api/doctor/exam/502");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, context });
    expect(getDoctorExamContext).toHaveBeenCalledWith(mockAuthUser.doctorId, "502");
  });

  test("GET /api/doctor/settings passes user agent to settings service", async () => {
    // Arrange
    const settings = { profile: { id: 300 } };
    getDoctorSettings.mockResolvedValueOnce(settings);

    // Act
    const response = await request(app)
      .get("/api/doctor/settings")
      .set("User-Agent", "Vitest Doctor Browser");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, settings });
    expect(getDoctorSettings).toHaveBeenCalledWith(mockAuthUser.doctorId, "Vitest Doctor Browser");
  });

  test("PUT /api/doctor/settings saves notification and security patch", async () => {
    // Arrange
    saveDoctorSettings.mockResolvedValueOnce();
    const input = {
      notifications: { aptEmail: true },
      security: { twoFa: true },
    };

    // Act
    const response = await request(app)
      .put("/api/doctor/settings")
      .send(input);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ ok: true }));
    expect(saveDoctorSettings).toHaveBeenCalledWith(mockAuthUser.doctorId, input);
  });
});
