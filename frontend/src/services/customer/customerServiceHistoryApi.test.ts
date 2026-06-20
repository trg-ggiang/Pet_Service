import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockAuthSession } from "../../tests/mocks/auth.mock";
import { mockServiceHistoryPayload } from "../../tests/mocks/customerCore.mock";
import { writeStorage } from "../../utils/authSession";
import { fetchCustomerServiceHistory } from "./customerServiceHistoryApi";

function mockFetchJson(payload: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(payload),
    }),
  );
}

describe("customerServiceHistoryApi", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    writeStorage(localStorage, mockAuthSession);
  });

  test("fetches all service history without a query string", async () => {
    // Arrange
    mockFetchJson({ ok: true, ...mockServiceHistoryPayload });

    // Act
    const payload = await fetchCustomerServiceHistory();

    // Assert
    expect(payload).toEqual(mockServiceHistoryPayload);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/service-history",
      expect.any(Object),
    );
  });

  test("adds a type filter when a specific history type is requested", async () => {
    // Arrange
    mockFetchJson({ ok: true, ...mockServiceHistoryPayload });

    // Act
    await fetchCustomerServiceHistory({ type: "medical" });

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/service-history?type=medical",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockAuthSession.token}`,
        }),
      }),
    );
  });
});
