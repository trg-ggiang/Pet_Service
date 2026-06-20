const request = require("supertest");

let mockAuthUser = { id: 1, role: "customer", customerId: 10 };

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

jest.mock("../../src/services/customerPetsService", () => ({
  getCustomerPetDashboard: jest.fn(),
  getPetDetail: jest.fn(),
  createCustomerPet: jest.fn(),
  updateCustomerPet: jest.fn(),
}));

jest.mock("../../src/services/customer/customerProfileService", () => ({
  getCustomerProfile: jest.fn(),
  updateCustomerProfile: jest.fn(),
}));

jest.mock("../../src/services/customer/customerServiceHistoryService", () => ({
  listCustomerServiceHistoryView: jest.fn(),
}));

jest.mock("../../src/services/invoicePdfService", () => ({
  buildCustomerInvoicePdf: jest.fn(),
  buildLatestCustomerInvoicePdf: jest.fn(),
  buildMatchingCustomerInvoicePdf: jest.fn(),
}));

const app = require("../../src/server");
const petService = require("../../src/services/customerPetsService");
const profileService = require("../../src/services/customer/customerProfileService");
const historyService = require("../../src/services/customer/customerServiceHistoryService");
const pdfService = require("../../src/services/invoicePdfService");

describe("customer core and invoice PDF routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = { id: 1, role: "customer", customerId: 10 };
  });

  test("GET /api/customer/profile scopes profile lookup to the authenticated customer", async () => {
    // Arrange
    const profile = { id: 10, fullName: "Customer Test" };
    profileService.getCustomerProfile.mockResolvedValueOnce(profile);

    // Act
    const response = await request(app).get("/api/customer/profile");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, profile });
    expect(profileService.getCustomerProfile).toHaveBeenCalledWith(10);
  });

  test("GET /api/customer/pets/:id keeps ownership context in the service call", async () => {
    // Arrange
    const pet = { id: 81, name: "Milo" };
    petService.getPetDetail.mockResolvedValueOnce({ pet });

    // Act
    const response = await request(app).get("/api/customer/pets/81");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, pet });
    expect(petService.getPetDetail).toHaveBeenCalledWith("81", 10);
  });

  test("GET /api/customer/service-history forwards customer filters", async () => {
    // Arrange
    const history = [{ id: "INV-001", petName: "Milo" }];
    historyService.listCustomerServiceHistoryView.mockResolvedValueOnce({ history });

    // Act
    const response = await request(app)
      .get("/api/customer/service-history")
      .query({ type: "MEDICAL" });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, history });
    expect(historyService.listCustomerServiceHistoryView).toHaveBeenCalledWith(10, {
      type: "MEDICAL",
    });
  });

  test("GET /api/customer/invoices/:id/pdf returns an owned PDF attachment", async () => {
    // Arrange
    const buffer = Buffer.from("%PDF-test");
    pdfService.buildCustomerInvoicePdf.mockResolvedValueOnce({ buffer, filename: "invoice-81.pdf" });

    // Act
    const response = await request(app).get("/api/customer/invoices/81/pdf");

    // Assert
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toBe('attachment; filename="invoice-81.pdf"');
    expect(pdfService.buildCustomerInvoicePdf).toHaveBeenCalledWith("81", 10);
  });

  test("GET /api/customer/invoices/latest/pdf uses the authenticated customer", async () => {
    // Arrange
    const buffer = Buffer.from("%PDF-latest");
    pdfService.buildLatestCustomerInvoicePdf.mockResolvedValueOnce({ buffer, filename: "latest.pdf" });

    // Act
    const response = await request(app).get("/api/customer/invoices/latest/pdf");

    // Assert
    expect(response.status).toBe(200);
    expect(pdfService.buildLatestCustomerInvoicePdf).toHaveBeenCalledWith(10);
  });

  test("GET /api/customer/invoices/match/pdf forwards matching query fields", async () => {
    // Arrange
    const buffer = Buffer.from("%PDF-match");
    pdfService.buildMatchingCustomerInvoicePdf.mockResolvedValueOnce({ buffer, filename: "matched.pdf" });

    // Act
    const response = await request(app).get("/api/customer/invoices/match/pdf").query({
      petName: "Milo",
      serviceName: "General exam",
      serviceType: "MEDICAL",
      date: "2099-08-01",
    });

    // Assert
    expect(response.status).toBe(200);
    expect(pdfService.buildMatchingCustomerInvoicePdf).toHaveBeenCalledWith(10, {
      petName: "Milo",
      serviceName: "General exam",
      serviceType: "MEDICAL",
      date: "2099-08-01",
    });
  });

  test("maps an invoice ownership failure to its service status code", async () => {
    // Arrange
    pdfService.buildCustomerInvoicePdf.mockRejectedValueOnce(
      Object.assign(new Error("Invoice does not belong to customer"), { statusCode: 404 }),
    );

    // Act
    const response = await request(app).get("/api/customer/invoices/999/pdf");

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ ok: false, message: "Invoice does not belong to customer" });
  });

  test("blocks non-customer roles before customer data services run", async () => {
    // Arrange
    mockAuthUser = { id: 30, role: "doctor", doctorId: 300 };

    // Act
    const response = await request(app).get("/api/customer/profile");

    // Assert
    expect(response.status).toBe(403);
    expect(profileService.getCustomerProfile).not.toHaveBeenCalled();
  });
});
