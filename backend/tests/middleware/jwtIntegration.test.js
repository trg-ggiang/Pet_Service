const jsonwebtoken = require("jsonwebtoken");
const { createSupabaseQuery } = require("../helpers/supabaseQuery");
const { activeCustomerUser } = require("../mocks/auth.mock");

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: { from: jest.fn() },
}));

jest.mock("../../src/services/authService", () => ({
  getUserAuthContext: jest.fn(),
}));

const { supabase } = require("../../src/lib/supabaseClient");
const { getUserAuthContext } = require("../../src/services/authService");
const { signAuthToken } = require("../../src/lib/jwt");
const { authMiddleware } = require("../../src/middleware/authMiddleware");

function responseMock() {
  return {
    status: jest.fn(function status() { return this; }),
    json: jest.fn(function json() { return this; }),
  };
}

describe("JWT middleware integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("accepts a token signed by the real JWT module", async () => {
    // Arrange
    const user = { ...activeCustomerUser, auth_version: 2 };
    const context = { id: user.id, role: "customer", customerId: 10 };
    const token = signAuthToken({ sub: String(user.id), role: "customer", authVersion: 2 });
    supabase.from.mockReturnValueOnce(createSupabaseQuery({ data: user, error: null }));
    getUserAuthContext.mockResolvedValueOnce(context);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = responseMock();
    const next = jest.fn();

    // Act
    await authMiddleware(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.auth).toEqual(expect.objectContaining({ token, user: context, rawUser: user }));
    expect(req.auth.payload).toEqual(expect.objectContaining({ sub: String(user.id), authVersion: 2 }));
  });

  test("rejects a token signed with a different secret before user lookup", async () => {
    // Arrange
    const token = jsonwebtoken.sign(
      { sub: String(activeCustomerUser.id), role: "customer", authVersion: 0 },
      "different-test-secret",
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = responseMock();
    const next = jest.fn();

    // Act
    await authMiddleware(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("rejects an expired real JWT before user lookup", async () => {
    // Arrange
    const token = jsonwebtoken.sign(
      { sub: String(activeCustomerUser.id), role: "customer", authVersion: 0 },
      process.env.JWT_SECRET,
      { expiresIn: -1 },
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = responseMock();
    const next = jest.fn();

    // Act
    await authMiddleware(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("rejects a validly signed token after auth_version changes", async () => {
    // Arrange
    const user = { ...activeCustomerUser, auth_version: 3 };
    const token = signAuthToken({ sub: String(user.id), role: "customer", authVersion: 2 });
    supabase.from.mockReturnValueOnce(createSupabaseQuery({ data: user, error: null }));
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = responseMock();
    const next = jest.fn();

    // Act
    await authMiddleware(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(getUserAuthContext).not.toHaveBeenCalled();
  });
});
