import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockAuthSession } from "../../tests/mocks/auth.mock";
import { mockCustomerProfile } from "../../tests/mocks/customerCore.mock";
import { writeStorage } from "../../utils/authSession";
import { fetchCustomerProfile, updateCustomerProfile } from "./customerProfileApi";

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

describe("customerProfileApi", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    writeStorage(localStorage, mockAuthSession);
  });

  test("fetches the customer profile with auth headers", async () => {
    // Arrange
    mockFetchJson({ ok: true, profile: mockCustomerProfile });

    // Act
    const result = await fetchCustomerProfile();

    // Assert
    expect(result.profile).toEqual(mockCustomerProfile);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/profile",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockAuthSession.token}`,
        }),
      }),
    );
  });

  test("updates allowed customer profile fields", async () => {
    // Arrange
    const input = {
      fullName: "Updated Name",
      phone: "0901888999",
      address: "New Address",
      dateOfBirth: "1990-02-18",
      gender: "OTHER" as const,
    };
    mockFetchJson({ ok: true, profile: { ...mockCustomerProfile, ...input } });

    // Act
    const result = await updateCustomerProfile(input);

    // Assert
    expect(result.profile.fullName).toBe(input.fullName);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/profile",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    );
  });
});
