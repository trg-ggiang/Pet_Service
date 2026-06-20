import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockAuthSession } from "../tests/mocks/auth.mock";
import { mockNotificationsPayload } from "../tests/mocks/customerCore.mock";
import { writeStorage } from "../utils/authSession";
import {
  dismissCustomerNotification,
  fetchCustomerNotifications,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
} from "./customerNotifications";

function mockFetchJson(payload: unknown = { ok: true }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(payload),
    }),
  );
}

describe("customerNotifications API", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    writeStorage(localStorage, mockAuthSession);
  });

  test("fetches notifications and summary", async () => {
    // Arrange
    mockFetchJson({ ok: true, ...mockNotificationsPayload });

    // Act
    const payload = await fetchCustomerNotifications();

    // Assert
    expect(payload).toEqual(mockNotificationsPayload);
  });

  test("marks one notification read", async () => {
    // Arrange
    mockFetchJson();

    // Act
    await markCustomerNotificationRead(1);

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/notifications/1/read",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  test("marks all notifications read", async () => {
    // Arrange
    mockFetchJson();

    // Act
    await markAllCustomerNotificationsRead();

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/notifications/read-all",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  test("dismisses one notification", async () => {
    // Arrange
    mockFetchJson();

    // Act
    await dismissCustomerNotification(1);

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/notifications/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
