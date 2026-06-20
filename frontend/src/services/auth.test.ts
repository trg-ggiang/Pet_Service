import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockAuthSession, mockAuthUser } from "../tests/mocks/auth.mock";
import { getStoredSession, writeStorage } from "../utils/authSession";
import {
  login,
  register,
  requestPasswordReset,
  resetPassword,
  restoreSession,
  verifyPasswordResetCode,
} from "./auth";

function mockFetchJson(payload: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: vi.fn().mockResolvedValue(payload),
    }),
  );
}

describe("auth service", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  test("login stores a temporary session when remember is false", async () => {
    // Arrange
    mockFetchJson({
      ok: true,
      token: "login-token",
      user: mockAuthUser,
    });

    // Act
    const session = await login({
      email: "customer@example.test",
      password: "PetService@123",
      remember: false,
    });

    // Assert
    expect(session).toEqual({
      token: "login-token",
      user: mockAuthUser,
      remember: false,
    });
    expect(getStoredSession()).toEqual(session);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "customer@example.test",
          password: "PetService@123",
          remember: false,
        }),
      }),
    );
  });

  test("login failure does not store a session", async () => {
    // Arrange
    mockFetchJson({ ok: false, message: "Invalid credentials" }, false, 400);

    // Act
    const action = () =>
      login({
        email: "customer@example.test",
        password: "wrong-password",
        remember: true,
      });

    // Assert
    await expect(action()).rejects.toThrow("Invalid credentials");
    expect(getStoredSession()).toBeNull();
  });

  test("register stores a remembered customer session", async () => {
    // Arrange
    mockFetchJson({
      ok: true,
      token: "register-token",
      user: mockAuthUser,
    });

    // Act
    const session = await register({
      name: "Nguyen Van Minh",
      email: "customer@example.test",
      phone: "0901000001",
      password: "PetService@123",
      address: "20 Nguyen Hue",
    });

    // Assert
    expect(session.remember).toBe(true);
    expect(session.token).toBe("register-token");
    expect(JSON.parse(localStorage.getItem("petcare.session") ?? "{}")).toEqual(session);
  });

  test("restoreSession refreshes the user context when the token is still valid", async () => {
    // Arrange
    writeStorage(localStorage, mockAuthSession);
    mockFetchJson({
      ok: true,
      user: {
        ...mockAuthUser,
        fullName: "Updated Customer",
      },
    });

    // Act
    const session = await restoreSession();

    // Assert
    expect(session).toEqual({
      ...mockAuthSession,
      user: {
        ...mockAuthUser,
        fullName: "Updated Customer",
      },
    });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockAuthSession.token}`,
        }),
      }),
    );
  });

  test("restoreSession returns null without calling the API when no session is stored", async () => {
    // Arrange
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    // Act
    const session = await restoreSession();

    // Assert
    expect(session).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("restoreSession clears storage when the server rejects the token", async () => {
    // Arrange
    writeStorage(localStorage, mockAuthSession);
    mockFetchJson({ ok: false, message: "Unauthorized" }, false, 401);

    // Act
    const session = await restoreSession();

    // Assert
    expect(session).toBeNull();
    expect(getStoredSession()).toBeNull();
  });

  test("password reset helpers call the expected endpoints", async () => {
    // Arrange
    mockFetchJson({ ok: true, devCode: "123456" });

    // Act
    await requestPasswordReset("customer@example.test");
    await verifyPasswordResetCode("customer@example.test", "123456");
    await resetPassword("customer@example.test", "123456", "NewPassword@123");

    // Assert
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5050/api/auth/forgot-password/request",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "customer@example.test" }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5050/api/auth/forgot-password/verify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "customer@example.test", code: "123456" }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      "http://localhost:5050/api/auth/forgot-password/reset",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "customer@example.test",
          code: "123456",
          password: "NewPassword@123",
        }),
      }),
    );
  });
});
