require("dotenv").config();

const { supabase } = require("../lib/supabaseClient");
const { safeSendTemplateEmail } = require("../services/emailService");
const { getStoredSetting, saveStoredSetting } = require("../services/settingsService");

function dateString(date) {
  return date.toISOString().slice(0, 10);
}

function appointmentVariables(row) {
  return {
    appointmentCode: `APT-${String(row.id).padStart(3, "0")}`,
    appointmentDate: row.requested_date || "",
    appointmentTime: String(row.requested_time || "").slice(0, 5),
    petName: row.pets?.name || "thú cưng",
  };
}

async function sendOnce(log, key, type, to, variables) {
  if (!to || log[key]) return false;
  const result = await safeSendTemplateEmail(type, to, variables);
  if (result.sent) log[key] = new Date().toISOString();
  return result.sent;
}

async function runEmailReminders() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const todayValue = dateString(today);
  const tomorrowValue = dateString(tomorrow);
  const logKey = `email.reminder-log.${todayValue}`;
  const log = (await getStoredSetting(logKey)) || {};

  const [appointments, visits, vaccinations] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, requested_date, requested_time, pets:pet_id(name, customers:customer_id(users:user_id(email)))")
      .eq("requested_date", tomorrowValue)
      .not("status", "in", "(CANCELLED,NO_SHOW,COMPLETED)"),
    supabase
      .from("medical_visits")
      .select("id, next_visit_date, appointment:appointment_id(pets:pet_id(name, customers:customer_id(users:user_id(email))))")
      .eq("next_visit_date", tomorrowValue),
    supabase
      .from("vaccinations")
      .select("id, vaccine_name, next_due_date, pets:pet_id(name, customers:customer_id(users:user_id(email)))")
      .eq("next_due_date", tomorrowValue),
  ]);

  for (const result of [appointments, visits, vaccinations]) {
    if (result.error) throw new Error(result.error.message);
  }

  let sent = 0;
  for (const row of appointments.data || []) {
    sent += Number(await sendOnce(
      log,
      `appointment:${row.id}:${tomorrowValue}`,
      "appointment_reminder",
      row.pets?.customers?.users?.email,
      appointmentVariables(row),
    ));
  }
  for (const row of visits.data || []) {
    sent += Number(await sendOnce(
      log,
      `follow-up:${row.id}:${tomorrowValue}`,
      "follow_up_reminder",
      row.appointment?.pets?.customers?.users?.email,
      { petName: row.appointment?.pets?.name || "thú cưng", followUpDate: row.next_visit_date || "" },
    ));
  }
  for (const row of vaccinations.data || []) {
    sent += Number(await sendOnce(
      log,
      `vaccination:${row.id}:${tomorrowValue}`,
      "vaccination_reminder",
      row.pets?.customers?.users?.email,
      {
        petName: row.pets?.name || "thú cưng",
        vaccineName: row.vaccine_name || "vaccine",
        vaccinationDate: row.next_due_date || "",
      },
    ));
  }

  await saveStoredSetting(logKey, log);
  console.log(`[EMAIL] Reminder job completed. Sent ${sent} email(s) for ${tomorrowValue}.`);
}

if (require.main === module) {
  runEmailReminders().catch((error) => {
    console.error("[EMAIL] Reminder job failed:", error);
    process.exitCode = 1;
  });
}

module.exports = { runEmailReminders };
