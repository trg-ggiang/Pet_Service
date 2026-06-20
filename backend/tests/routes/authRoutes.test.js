const request = require("supertest");

jest.mock("../../src/services/authService", () => ({
  getUserAuthContext: jest.fn(),
  loginWithCredentials: jest.fn(),
  registerCustomer: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
  verifyPasswordResetCode: jest.fn(),
}));

jest.mock("../../src/middleware/authMiddleware", () => {
  const actual = jest.requireActual("../../src/middleware/authMiddleware");
  return {
    ...actual,
    authMiddleware: jest.fn((req, res, next) => {
      req.auth = {
        user: {
          id: 1,
          email: "customer@example.test",
          role: "customer",
          status: "active",
          fullName: "Nguyen Van Minh",
        },
      };
      next();
    }),
  };
});

const app = require("../../src/server");
const {
  loginWithCredentials,
  registerCustomer,
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetCode,
} = require("../../src/services/authService");

describe("auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST /api/auth/login returns a signed session", async () => {
    // Arrange
    loginWithCredentials.mockResolvedValueOnce({
      token: "route-login-token",
      user: { id: 1, email: "customer@example.test", role: "customer" },
    });

    // Act
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "customer@example.test", password: "PetService@123" });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: true,
        token: "route-login-token",
      }),
    );
    expect(loginWithCredentials).toHaveBeenCalledWith(
      "customer@example.test",
      "PetService@123",
    );
  });

  test("POST /api/auth/login returns 400 when credentials are rejected", async () => {
    // Arrange
    loginWithCredentials.mockRejectedValueOnce(new Error("Invalid credentials"));

    // Act
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "customer@example.test", password: "wrong" });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: false,
        message: "Invalid credentials",
      }),
    );
  });

  test("POST /api/auth/register returns 201 with a customer session", async () => {
    // Arrange
    const input = {
      name: "Tran Thi Hoa",
      email: "hoa@example.test",
      phone: "0902000002",
      password: "PetService@123",
    };
    registerCustomer.mockResolvedValueOnce({
      token: "route-register-token",
      user: { id: 2, email: input.email, role: "customer" },
    });

    // Act
    const response = await request(app).post("/api/auth/register").send(input);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: true,
        token: "route-register-token",
      }),
    );
    expect(registerCustomer).toHaveBeenCalledWith(input);
  });

  test("GET /api/auth/me returns the middleware auth user", async () => {
    // Arrange
    const authorization = "Bearer mocked-token";

    // Act
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", authorization);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: true,
        user: expect.objectContaining({
          role: "customer",
          email: "customer@example.test",
        }),
      }),
    );
  });

  test("forgot-password endpoints map service success responses", async () => {
    // Arrange
    requestPasswordReset.mockResolvedValueOnce({ devCode: "123456" });
    verifyPasswordResetCode.mockResolvedValueOnce();
    resetPassword.mockResolvedValueOnce();

    // Act
    const requestResponse = await request(app)
      .post("/api/auth/forgot-password/request")
      .send({ email: "customer@example.test" });
    const verifyResponse = await request(app)
      .post("/api/auth/forgot-password/verify")
      .send({ email: "customer@example.test", code: "123456" });
    const resetResponse = await request(app)
      .post("/api/auth/forgot-password/reset")
      .send({ email: "customer@example.test", code: "123456", password: "NewPassword@123" });

    // Assert
    expect(requestResponse.status).toBe(200);
    expect(requestResponse.body).toEqual({ ok: true, devCode: "123456" });
    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body).toEqual({ ok: true });
    expect(resetResponse.status).toBe(200);
    expect(resetResponse.body).toEqual({ ok: true });
  });
});
