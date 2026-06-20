const { createSupabaseQuery } = require("../helpers/supabaseQuery");
const { activeCustomerUser } = require("../mocks/auth.mock");

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("../../src/lib/jwt", () => ({
  verifyAuthToken: jest.fn(),
}));

jest.mock("../../src/services/authService", () => ({
  getUserAuthContext: jest.fn(),
}));

const { supabase } = require("../../src/lib/supabaseClient");
const { verifyAuthToken } = require("../../src/lib/jwt");
const { getUserAuthContext } = require("../../src/services/authService");
const { authMiddleware, requireRole } = require("../../src/middleware/authMiddleware");

function createResponse() {
  return {
    status: jest.fn(function status() {
      return this;
    }),
    json: jest.fn(function json() {
      return this;
    }),
  };
}

describe("authMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 401 when the bearer token is missing", async () => {
    // Arrange
    const req = { headers: {} };
    const res = createResponse();
    const next = jest.fn();

    // Act
    await authMiddleware(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when token subject is not a finite user id", async () => {
    // Arrange
    const req = { headers: { authorization: "Bearer invalid-sub" } };
    const res = createResponse();
    const next = jest.fn();
    verifyAuthToken.mockReturnValue({ sub: "not-a-number", authVersion: 0 });

    // Act
    await authMiddleware(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("attaches auth context and calls next when token and user are valid", async () => {
    // Arrange
    const req = { headers: { authorization: "Bearer valid-token" } };
    const res = createResponse();
    const next = jest.fn();
    const authContext = {
      id: activeCustomerUser.id,
      email: activeCustomerUser.email,
      role: "customer",
      status: "active",
      fullName: "Nguyen Van Minh",
      customerId: 10,
    };

    verifyAuthToken.mockReturnValue({ sub: String(activeCustomerUser.id), authVersion: 0 });
    supabase.from.mockReturnValueOnce(createSupabaseQuery({ data: activeCustomerUser, error: null }));
    getUserAuthContext.mockResolvedValue(authContext);

    // Act
    await authMiddleware(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.auth).toEqual({
      token: "valid-token",
      payload: { sub: String(activeCustomerUser.id), authVersion: 0 },
      user: authContext,
      rawUser: activeCustomerUser,
    });
  });

  test("returns 401 when auth version no longer matches the database user", async () => {
    // Arrange
    const req = { headers: { authorization: "Bearer old-token" } };
    const res = createResponse();
    const next = jest.fn();

    verifyAuthToken.mockReturnValue({ sub: String(activeCustomerUser.id), authVersion: 0 });
    supabase.from.mockReturnValueOnce(
      createSupabaseQuery({
        data: { ...activeCustomerUser, auth_version: 2 },
        error: null,
      }),
    );

    // Act
    await authMiddleware(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("requireRole", () => {
  test("allows a request when the current role is included", () => {
    // Arrange
    const req = { auth: { user: { role: "customer" } } };
    const res = createResponse();
    const next = jest.fn();

    // Act
    requireRole("customer", "admin")(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("returns 403 when the current role is not included", () => {
    // Arrange
    const req = { auth: { user: { role: "customer" } } };
    const res = createResponse();
    const next = jest.fn();

    // Act
    requireRole("admin")(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
    expect(next).not.toHaveBeenCalled();
  });
});
