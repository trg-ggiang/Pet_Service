const {
  buildAdminAuditEvent,
  recordAdminAudit,
} = require("../../src/services/adminAuditService");

describe("adminAuditService", () => {
  test("builds a structured event without copying sensitive request data", () => {
    // Arrange & Act
    const event = buildAdminAuditEvent({
      actor: { id: 99, email: "admin@example.test", role: "ADMIN", password: "must-not-leak" },
      action: "delete_service",
      targetType: "service",
      targetId: "SV-702",
      metadata: { reason: "retired" },
    });

    // Assert
    expect(event).toEqual(expect.objectContaining({
      occurredAt: expect.any(String),
      actor: { id: 99, email: "admin@example.test", role: "admin" },
      action: "DELETE_SERVICE",
      target: { type: "SERVICE", id: "SV-702" },
      metadata: { reason: "retired" },
    }));
    expect(JSON.stringify(event)).not.toContain("must-not-leak");
  });

  test("returns the event even when the audit sink fails", async () => {
    // Arrange
    const logger = {
      info: jest.fn(() => { throw new Error("sink unavailable"); }),
      warn: jest.fn(),
    };

    // Act
    const event = await recordAdminAudit({
      actor: { id: 99, role: "admin" },
      action: "LOCK_USER",
      targetType: "customer",
      targetId: "CUS-10",
    }, logger);

    // Assert
    expect(event.action).toBe("LOCK_USER");
    expect(logger.warn).toHaveBeenCalledWith(
      "[ADMIN_AUDIT] Failed to write audit event",
      "sink unavailable",
    );
  });
});
