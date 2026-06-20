import { describe, expect, test } from "vitest";
import { apiUrl } from "./apiUrl";

describe("apiUrl", () => {
  test("builds backend URLs for relative API paths", () => {
    // Arrange
    const path = "/api/customer/pets";

    // Act
    const result = apiUrl(path);

    // Assert
    expect(result).toBe("http://localhost:5050/api/customer/pets");
  });

  test("keeps absolute URLs unchanged", () => {
    // Arrange
    const absoluteUrl = "https://example.test/api/health";

    // Act
    const result = apiUrl(absoluteUrl);

    // Assert
    expect(result).toBe(absoluteUrl);
  });
});
