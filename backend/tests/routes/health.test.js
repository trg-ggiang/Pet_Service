const request = require("supertest");
const app = require("../../src/server");

describe("GET /api/health", () => {
  test("returns backend health status", async () => {
    // Arrange
    const expectedStatus = 200;

    // Act
    const response = await request(app).get("/api/health");

    // Assert
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: true,
        message: "Backend is running",
      }),
    );
    expect(response.body).toHaveProperty("supabaseConfigured");
    expect(response.body).toHaveProperty("prismaConfigured");
  });
});
