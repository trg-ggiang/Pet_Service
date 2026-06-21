require("dotenv").config();

function parseClientUrls() {
  return [
    ...(process.env.CLIENT_URL || "http://localhost:5173").split(","),
    ...(process.env.FRONTEND_URL || "").split(","),
  ]
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

const reminderIntervalMinutes = Number(
  process.env.EMAIL_REMINDER_INTERVAL_MINUTES || 0,
);

module.exports = Object.freeze({
  port: Number(process.env.PORT || 5050),
  clientUrls: parseClientUrls(),
  reminderIntervalMinutes:
    Number.isFinite(reminderIntervalMinutes) && reminderIntervalMinutes > 0
      ? reminderIntervalMinutes
      : 0,
});
