import { expect, test } from "@playwright/test";

test("frontend loads and backend reports healthy configuration", async ({ page, request }) => {
  // Arrange
  const backendUrl = process.env.E2E_BACKEND_URL || "http://localhost:5050";

  // Act
  const healthResponse = await request.get(`${backendUrl}/api/health`);
  await page.goto("/");

  // Assert
  expect(healthResponse.ok()).toBe(true);
  await expect(healthResponse.json()).resolves.toEqual(expect.objectContaining({ ok: true }));
  await expect(page.locator("body")).not.toBeEmpty();
  await expect(page).toHaveTitle(/Pet Service/i);
});
