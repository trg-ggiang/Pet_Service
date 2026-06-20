const request = require("supertest");

let mockAuthUser = { id: 20, role: "staff", staffId: 200 };

jest.mock("../../src/middleware/authMiddleware", () => {
  const actual = jest.requireActual("../../src/middleware/authMiddleware");
  return {
    ...actual,
    authMiddleware: jest.fn((req, _res, next) => {
      req.auth = { user: mockAuthUser, rawUser: { id: mockAuthUser.id } };
      next();
    }),
  };
});

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

jest.mock("../../src/services/boardingService", () => ({
  listPendingBoardings: jest.fn(),
  listConfirmedBoardings: jest.fn(),
  approveBoardingBooking: jest.fn(),
  checkInBoarding: jest.fn(),
  checkOutBoarding: jest.fn(),
  listAllRoomsForStaff: jest.fn(),
  createCage: jest.fn(),
  updateCage: jest.fn(),
  deleteCage: jest.fn(),
}));

jest.mock("../../src/services/settingsService", () => ({
  getStoredSetting: jest.fn(),
  saveStoredSetting: jest.fn(),
}));

const app = require("../../src/server");
const staffService = require("../../src/services/staff/staffPortalService");
const boardingService = require("../../src/services/boardingService");

describe("staff routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = { id: 20, role: "staff", staffId: 200 };
  });

  test("POST /api/staff/appointments/walk-in creates a confirmed walk-in", async () => {
    // Arrange
    const input = { customerId: 7, petId: 8, doctorId: 9, note: "Walk-in" };
    staffService.createWalkInAppointment.mockResolvedValueOnce({
      appointmentId: 501,
      petName: "Milo",
      doctorName: "Dr Test",
    });

    // Act
    const response = await request(app).post("/api/staff/appointments/walk-in").send(input);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toEqual(expect.objectContaining({ ok: true, appointmentId: 501 }));
    expect(staffService.createWalkInAppointment).toHaveBeenCalledWith(200, input);
  });

  test("PUT /api/staff/appointments/:id/checkin passes the authenticated staff id", async () => {
    // Arrange
    staffService.checkInAppointment.mockResolvedValueOnce();

    // Act
    const response = await request(app).put("/api/staff/appointments/APT-000501/checkin");

    // Assert
    expect(response.status).toBe(200);
    expect(staffService.checkInAppointment).toHaveBeenCalledWith("APT-000501", 200);
  });

  test("PUT /api/staff/appointments/:id/complete-grooming completes invoice flow", async () => {
    // Arrange
    staffService.completeGroomingAppointment.mockResolvedValueOnce();

    // Act
    const response = await request(app).put("/api/staff/appointments/501/complete-grooming");

    // Assert
    expect(response.status).toBe(200);
    expect(staffService.completeGroomingAppointment).toHaveBeenCalledWith("501", 200);
  });

  test("PATCH /api/staff/boarding/:id/daily-status forwards photo-capable payload", async () => {
    // Arrange
    const input = {
      todayStatus: { breakfast: true, lunch: true, dinner: false },
      note: "Milo is active",
      imageDataUrl: "data:image/png;base64,dGVzdA==",
    };
    staffService.updateBoardingDailyStatus.mockResolvedValueOnce({ imageUrl: "https://example.test/milo.png" });

    // Act
    const response = await request(app).patch("/api/staff/boarding/601/daily-status").send(input);

    // Assert
    expect(response.status).toBe(200);
    expect(staffService.updateBoardingDailyStatus).toHaveBeenCalledWith("601", input.todayStatus, 200, input);
  });

  test("POST /api/staff/boarding/:id/checkout returns invoice totals", async () => {
    // Arrange
    boardingService.checkOutBoarding.mockResolvedValueOnce({ invoiceId: 801, nights: 2, total: 500000 });
    const fees = { foodFee: 50000, serviceFee: 25000 };

    // Act
    const response = await request(app).post("/api/staff/boarding/601/checkout").send(fees);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ ok: true, invoiceId: 801, total: 500000 }));
    expect(boardingService.checkOutBoarding).toHaveBeenCalledWith("601", 200, fees);
  });

  test("PATCH /api/staff/payments/:id/pay forwards payment method", async () => {
    // Arrange
    staffService.markPaymentPaid.mockResolvedValueOnce();

    // Act
    const response = await request(app).patch("/api/staff/payments/801/pay").send({ method: "CARD" });

    // Assert
    expect(response.status).toBe(200);
    expect(staffService.markPaymentPaid).toHaveBeenCalledWith("801", "CARD");
  });

  test("maps service status errors without hiding their HTTP code", async () => {
    // Arrange
    staffService.confirmAppointment.mockRejectedValueOnce(
      Object.assign(new Error("Appointment already assigned"), { statusCode: 409 }),
    );

    // Act
    const response = await request(app).put("/api/staff/appointments/501/confirm");

    // Assert
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ ok: false, message: "Appointment already assigned" });
  });

  test("blocks a non-staff role before staff services run", async () => {
    // Arrange
    mockAuthUser = { id: 10, role: "customer", customerId: 100 };

    // Act
    const response = await request(app).get("/api/staff/summary");

    // Assert
    expect(response.status).toBe(403);
    expect(staffService.getStaffPortalSummary).not.toHaveBeenCalled();
  });
});
