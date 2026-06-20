const request = require("supertest");
const { createSupabaseQuery } = require("../helpers/supabaseQuery");

const mockFrom = jest.fn();
let tableResults = {};
let queries = [];

jest.mock("../../src/lib/supabaseClient", () => ({
  isSupabaseConfigured: true,
  supabase: { from: (...args) => mockFrom(...args) },
}));

jest.mock("../../src/middleware/authMiddleware", () => {
  const actual = jest.requireActual("../../src/middleware/authMiddleware");
  return {
    ...actual,
    authMiddleware: jest.fn((req, _res, next) => {
      req.auth = {
        user: { id: 30, role: "doctor", doctorId: 300 },
        rawUser: { id: 30 },
      };
      next();
    }),
  };
});

jest.mock("../../src/services/emailService", () => ({
  sendAppointmentEventEmail: jest.fn().mockResolvedValue(null),
}));

jest.mock("../../src/services/doctorScheduleService", () => ({
  ensureDoctorScheduleSlot: jest.fn(),
  reserveDoctorScheduleSlot: jest.fn(),
  setDoctorScheduleSlotStatus: jest.fn(),
}));

const app = require("../../src/server");

function queueTable(table, ...results) {
  tableResults[table] = results;
}

function ownedAppointment(overrides = {}) {
  return {
    id: 501,
    doctor_id: 300,
    status: "IN_PROGRESS",
    pets: {
      name: "Milo",
      customers: { user_id: 601 },
    },
    ...overrides,
  };
}

describe("doctor specialist and urgent routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tableResults = {};
    queries = [];
    mockFrom.mockImplementation((table) => {
      const result = tableResults[table]?.shift() ?? { data: null, error: null };
      const query = createSupabaseQuery(result);
      queries.push({ table, query });
      return query;
    });
  });

  test("GET /api/doctor/appointments/specialist-services lists active specialist services", async () => {
    // Arrange
    const services = [
      { id: 41, name: "Ultrasound", specialist_room_type: "ULTRASOUND" },
    ];
    queueTable("services", { data: services, error: null });

    // Act
    const response = await request(app).get("/api/doctor/appointments/specialist-services");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, services });
    const serviceQuery = queries.find(({ table }) => table === "services").query;
    expect(serviceQuery.eq).toHaveBeenCalledWith("is_active", true);
    expect(serviceQuery.not).toHaveBeenCalledWith("specialist_room_type", "is", null);
  });

  test("POST /api/doctor/appointments/:id/service-orders creates a specialist order", async () => {
    // Arrange
    const service = {
      id: 41,
      name: "Ultrasound",
      price: 350000,
      specialist_room_type: "ULTRASOUND",
      is_active: true,
    };
    const inserted = { id: 701, service_id: service.id, status: "PENDING" };
    queueTable("appointments", { data: ownedAppointment(), error: null });
    queueTable("services", { data: service, error: null });
    queueTable("appointment_services", { data: inserted, error: null });

    // Act
    const response = await request(app)
      .post("/api/doctor/appointments/501/service-orders")
      .send({ serviceId: service.id, note: "Check abdomen" });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ ok: true, serviceOrder: inserted }));
    const insertQuery = queries.find(({ table }) => table === "appointment_services").query;
    expect(insertQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      appointment_id: 501,
      service_id: service.id,
      ordered_by_doctor_id: 30,
      status: "PENDING",
    }));
  });

  test("POST /api/doctor/appointments/:id/service-orders rejects a non-specialist service", async () => {
    // Arrange
    queueTable("appointments", { data: ownedAppointment(), error: null });
    queueTable("services", {
      data: { id: 40, name: "General exam", is_active: true, specialist_room_type: null },
      error: null,
    });

    // Act
    const response = await request(app)
      .post("/api/doctor/appointments/501/service-orders")
      .send({ serviceId: 40 });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(queries.some(({ table }) => table === "appointment_services")).toBe(false);
  });

  test("DELETE /api/doctor/appointments/service-orders/:id blocks a different ordering doctor", async () => {
    // Arrange
    queueTable("appointment_services", {
      data: { id: 701, status: "PENDING", ordered_by_doctor_id: 99, appointment_id: 501 },
      error: null,
    });

    // Act
    const response = await request(app).delete("/api/doctor/appointments/service-orders/701");

    // Assert
    expect(response.status).toBe(403);
    expect(response.body.ok).toBe(false);
    expect(queries).toHaveLength(1);
  });

  test("POST /api/doctor/appointments/:id/urgent-alert rejects an empty message", async () => {
    // Arrange
    queueTable("appointments", { data: ownedAppointment(), error: null });

    // Act
    const response = await request(app)
      .post("/api/doctor/appointments/501/urgent-alert")
      .send({ message: "   " });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(queries.some(({ table }) => table === "notifications")).toBe(false);
  });

  test("POST /api/doctor/appointments/:id/urgent-alert notifies the pet owner", async () => {
    // Arrange
    queueTable("appointments", { data: ownedAppointment(), error: null });
    queueTable("notifications", { data: null, error: null });

    // Act
    const response = await request(app)
      .post("/api/doctor/appointments/501/urgent-alert")
      .send({ message: "Please return to the clinic immediately" });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    const notificationQuery = queries.find(({ table }) => table === "notifications").query;
    expect(notificationQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 601,
      type: "SYSTEM",
      is_read: false,
    }));
  });
});
