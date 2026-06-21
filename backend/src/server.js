const app = require("./app");
const env = require("./config/env");
const { runEmailReminders } = require("./scripts/sendEmailReminders");

function startReminderScheduler() {
  if (!env.reminderIntervalMinutes) return;

  const intervalMs = env.reminderIntervalMinutes * 60 * 1000;
  const runReminders = () =>
    runEmailReminders().catch((error) =>
      console.error("[EMAIL] Reminder scheduler failed:", error),
    );

  setTimeout(runReminders, 5_000);
  setInterval(runReminders, intervalMs);
  console.log(
    `[EMAIL] Reminder scheduler enabled every ${env.reminderIntervalMinutes} minute(s).`,
  );
}

if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`Backend running on http://localhost:${env.port}`);
  });

  startReminderScheduler();
}

module.exports = app;
