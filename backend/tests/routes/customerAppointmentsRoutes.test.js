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

const app = require("../../src/server");
const {
  listCustomerAppointmentOptions,
  listCustomerAppointmentProviders,
  listCustomerAppointmentsView,
  createCustomerAppointment,
  confirmCustomerAppointment,
  rescheduleCustomerAppointment,
  cancelCustomerAppointment,
} = require("../../src/services/customer/customerAppointmentsService");

describe("customer appointment routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = {
      id: 1,
      email: "customer@example.test",
      role: "customer",
      status: "active",
      fullName: "Nguyen Van Minh",
      customerId: 10,
    };
  });

  test("GET /api/customer/appointment-options maps service options for the authenticated customer", async () => {
    // Arrange
    const options = {
      services: [{ id: 501, name: "Kham tong quat", serviceType: "Khám bệnh" }],
      pets: [{ id: 100, name: "Milo" }],
    };
    listCustomerAppointmentOptions.mockResolvedValueOnce(options);

    // Act
    const response = await request(app).get("/api/customer/appointment-options");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, options });
    expect(listCustomerAppointmentOptions).toHaveBeenCalledWith(mockAuthUser.customerId);
  });

  test("POST /api/customer/appointment-provider-options passes request body to provider lookup", async () => {
    // Arrange
    const input = { serviceId: 501, date: "2099-07-20", time: "09:00" };
    const providers = [{ role: "doctor", id: 300, name: "Dr. Nguyen", scheduleId: 400 }];
    listCustomerAppointmentProviders.mockResolvedValueOnce(providers);

    // Act
    const response = await request(app)
      .post("/api/customer/appointment-provider-options")
      .send(input);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, providers });
    expect(listCustomerAppointmentProviders).toHaveBeenCalledWith(input, mockAuthUser.customerId);
  });

  test("GET /api/customer/appointments forwards filters and pagination to the view service", async () => {
    // Arrange
    const result = {
      appointments: [{ appointmentId: 200, status: "PENDING" }],
      summary: { total: 1, filtered: 1 },
      pagination: { page: 2, pageSize: 5, total: 1 },
    };
    listCustomerAppointmentsView.mockResolvedValueOnce(result);

    // Act
    const response = await request(app)
      .get("/api/customer/appointments")
      .query({ status: "upcoming", pet: "Milo", serviceType: "Khám bệnh", page: "2", pageSize: "5" });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, ...result });
    expect(listCustomerAppointmentsView).toHaveBeenCalledWith(mockAuthUser.customerId, {
      status: "upcoming",
      pet: "Milo",
      serviceType: "Khám bệnh",
      page: "2",
      pageSize: "5",
    });
  });

  test("POST /api/customer/appointments creates an appointment and returns 201", async () => {
    // Arrange
    const input = {
      petId: 100,
      serviceId: 501,
      date: "2099-07-20",
      time: "09:00",
      providerRole: "doctor",
      providerId: 300,
    };
    const appointment = { appointmentId: 200, status: "PENDING" };
    createCustomerAppointment.mockResolvedValueOnce(appointment);

    // Act
    const response = await request(app)
      .post("/api/customer/appointments")
      .send(input);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ ok: true, appointment });
    expect(createCustomerAppointment).toHaveBeenCalledWith(input, mockAuthUser.customerId);
  });

  test("PATCH /api/customer/appointments/:appointmentId/confirm maps appointment id to the service", async () => {
    // Arrange
    const appointment = { appointmentId: 200, status: "CONFIRMED" };
    confirmCustomerAppointment.mockResolvedValueOnce(appointment);

    // Act
    const response = await request(app).patch("/api/customer/appointments/APT-000200/confirm");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, appointment });
    expect(confirmCustomerAppointment).toHaveBeenCalledWith("APT-000200", mockAuthUser.customerId);
  });

  test("PATCH /api/customer/appointments/:appointmentId/reschedule passes body and customer id", async () => {
    // Arrange
    const input = { date: "2099-07-21", time: "10:00", reason: "Change time" };
    const appointment = { appointmentId: 200, time: "10:00" };
    rescheduleCustomerAppointment.mockResolvedValueOnce(appointment);

    // Act
    const response = await request(app)
      .patch("/api/customer/appointments/APT-000200/reschedule")
      .send(input);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, appointment });
    expect(rescheduleCustomerAppointment).toHaveBeenCalledWith("APT-000200", input, mockAuthUser.customerId);
  });

  test("PATCH /api/customer/appointments/:appointmentId/cancel passes body and customer id", async () => {
    // Arrange
    const input = { reason: "Busy day" };
    const appointment = { appointmentId: 200, status: "CANCELLED" };
    cancelCustomerAppointment.mockResolvedValueOnce(appointment);

    // Act
    const response = await request(app)
      .patch("/api/customer/appointments/APT-000200/cancel")
      .send(input);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, appointment });
    expect(cancelCustomerAppointment).toHaveBeenCalledWith("APT-000200", input, mockAuthUser.customerId);
  });

  test("maps service errors to route status codes and response body", async () => {
    // Arrange
    const error = new Error("Ca khám vừa được đặt");
    error.statusCode = 409;
    createCustomerAppointment.mockRejectedValueOnce(error);

    // Act
    const response = await request(app)
      .post("/api/customer/appointments")
      .send({ petId: 100 });

    // Assert
    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      ok: false,
      message: "Ca khám vừa được đặt",
    });
  });

  test("rejects appointment routes when authenticated user is not a customer", async () => {
    // Arrange
    mockAuthUser = {
      ...mockAuthUser,
      role: "staff",
      customerId: undefined,
    };

    // Act
    const response = await request(app).get("/api/customer/appointments");

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: false,
      }),
    );
    expect(listCustomerAppointmentsView).not.toHaveBeenCalled();
  });
});
