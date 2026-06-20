import { describe, expect, test } from "vitest";
import { mockAuthSession, mockAuthUser } from "../tests/mocks/auth.mock";
import {
  clearSession,
  getAuthHeaders,
  getStoredSession,
  saveSession,
  writeStorage,
} from "./authSession";

describe("authSession", () => {
  test("saves remembered sessions in localStorage and clears sessionStorage", () => {
    // Arrange
    sessionStorage.setItem("petcare.session", JSON.stringify({ stale: true }));

    // Act
    const session = saveSession({
      token: "remember-token",
      user: mockAuthUser,
      remember: true,
    });

    // Assert
    expect(session).toEqual({
      token: "remember-token",
      user: mockAuthUser,
      remember: true,
    });
    expect(JSON.parse(localStorage.getItem("petcare.session") ?? "{}")).toEqual(session);
    expect(sessionStorage.getItem("petcare.session")).toBeNull();
  });

  test("saves temporary sessions in sessionStorage and clears localStorage", () => {
    // Arrange
    localStorage.setItem("petcare.session", JSON.stringify({ stale: true }));

    // Act
    const session = saveSession({
      token: "temporary-token",
      user: mockAuthUser,
      remember: false,
    });

    // Assert
    expect(JSON.parse(sessionStorage.getItem("petcare.session") ?? "{}")).toEqual(session);
    expect(localStorage.getItem("petcare.session")).toBeNull();
  });

  test("returns auth headers when a stored session exists", () => {
    // Arrange
    writeStorage(localStorage, mockAuthSession);

    // Act
    const headers = getAuthHeaders();

    // Assert
    expect(headers).toEqual({ Authorization: `Bearer ${mockAuthSession.token}` });
  });

  test("clears both storage locations", () => {
    // Arrange
    writeStorage(localStorage, mockAuthSession);
    writeStorage(sessionStorage, { ...mockAuthSession, remember: false });

    // Act
    clearSession();

    // Assert
    expect(getStoredSession()).toBeNull();
    expect(localStorage.getItem("petcare.session")).toBeNull();
    expect(sessionStorage.getItem("petcare.session")).toBeNull();
  });

  test("ignores malformed stored JSON", () => {
    // Arrange
    localStorage.setItem("petcare.session", "{not-valid-json");

    // Act
    const session = getStoredSession();

    // Assert
    expect(session).toBeNull();
  });
});
