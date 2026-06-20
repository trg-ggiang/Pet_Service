function cleanText(value, fallback = "unknown") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function buildAdminAuditEvent({ actor, action, targetType, targetId, metadata = {} }) {
  return {
    occurredAt: new Date().toISOString(),
    actor: {
      id: Number(actor?.id) || null,
      email: cleanText(actor?.email, ""),
      role: cleanText(actor?.role, "admin").toLowerCase(),
    },
    action: cleanText(action).toUpperCase(),
    target: {
      type: cleanText(targetType).toUpperCase(),
      id: cleanText(targetId),
    },
    metadata: metadata && typeof metadata === "object" ? { ...metadata } : {},
  };
}

async function recordAdminAudit(input, logger = console) {
  const event = buildAdminAuditEvent(input);
  try {
    logger.info("[ADMIN_AUDIT]", JSON.stringify(event));
  } catch (error) {
    logger.warn?.("[ADMIN_AUDIT] Failed to write audit event", error?.message);
  }
  return event;
}

module.exports = {
  buildAdminAuditEvent,
  recordAdminAudit,
};
