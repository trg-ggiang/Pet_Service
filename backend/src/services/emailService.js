const nodemailer = require("nodemailer");
const { supabase } = require("../lib/supabaseClient");
const { getStoredSetting, saveStoredSetting } = require("./settingsService");

const TEMPLATE_SETTING_KEY = "email.templates";
const EMAIL_PREFERENCE_KEYS = {
  appointment_confirmation: "emailNewAppt",
  appointment_reminder: "emailReminder",
  exam_result: "emailExamResult",
  payment_confirmation: "emailPaymentConfirmation",
  follow_up_reminder: "emailFollowUpReminder",
  vaccination_reminder: "emailVaccinationReminder",
  boarding_update: "emailBoardingUpdate",
};

const DEFAULT_TEMPLATES = {
  password_reset: {
    subject: "Mã xác minh đặt lại mật khẩu Pet Service",
    heading: "Đặt lại mật khẩu Pet Service",
    message: "Mã xác minh của bạn là {{code}}. Mã có hiệu lực đến {{expiresAt}}.",
  },
  appointment_confirmation: {
    subject: "Xác nhận lịch hẹn {{appointmentCode}}",
    heading: "Lịch hẹn đã được ghi nhận",
    message: "Pet Service đã ghi nhận lịch hẹn cho {{petName}} vào {{appointmentDate}} lúc {{appointmentTime}}.",
  },
  appointment_reminder: {
    subject: "Nhắc lịch hẹn cho {{petName}}",
    heading: "Bạn có lịch hẹn sắp tới",
    message: "Lịch hẹn {{appointmentCode}} của {{petName}} diễn ra vào {{appointmentDate}} lúc {{appointmentTime}}.",
  },
  exam_result: {
    subject: "Kết quả khám của {{petName}}",
    heading: "Kết quả khám đã sẵn sàng",
    message: "Ca khám {{appointmentCode}} đã hoàn thành. Kết luận: {{diagnosis}}",
  },
  payment_confirmation: {
    subject: "Xác nhận thanh toán hóa đơn {{invoiceCode}}",
    heading: "Thanh toán thành công",
    message: "Pet Service đã nhận thanh toán {{amount}} cho {{petName}}.",
  },
  follow_up_reminder: {
    subject: "Nhắc tái khám cho {{petName}}",
    heading: "Đến lịch tái khám",
    message: "{{petName}} có lịch tái khám vào {{followUpDate}}.",
  },
  vaccination_reminder: {
    subject: "Nhắc tiêm chủng cho {{petName}}",
    heading: "Đến lịch tiêm chủng",
    message: "{{petName}} đến hạn tiêm {{vaccineName}} vào {{vaccinationDate}}.",
  },
  boarding_update: {
    subject: "Cập nhật lưu trú của {{petName}}",
    heading: "Thông tin chăm sóc hôm nay",
    message: "Pet Service vừa cập nhật tình trạng lưu trú của {{petName}}: {{boardingStatus}}",
  },
  custom: {
    subject: "Thông báo từ Pet Service",
    heading: "Pet Service xin thông báo",
    message: "Nội dung email tùy chỉnh.",
  },
};

function getSmtpConfig() {
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_APP_PASSWORD;
  if (!user || !password) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return {
    from: process.env.EMAIL_FROM || `Pet Service <${user}>`,
    transport: {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user, pass: password.replace(/\s+/g, "") },
    },
  };
}

function renderText(value, variables) {
  return String(value || "").replace(/\{\{\s*([\w]+)\s*\}\}/g, (_, key) => String(variables[key] ?? ""));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildHtml(heading, message) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#0f172a">
      <div style="margin-bottom:20px;color:#0891b2;font-size:14px;font-weight:700">PET SERVICE</div>
      <h2 style="margin:0 0 12px">${escapeHtml(heading)}</h2>
      <p style="font-size:15px;line-height:1.7">${escapeHtml(message)}</p>
      <p style="margin-top:28px;font-size:12px;color:#64748b">Đây là email tự động từ Pet Service.</p>
    </div>
  `;
}

async function getEmailTemplates() {
  const stored = await getStoredSetting(TEMPLATE_SETTING_KEY);
  return { ...DEFAULT_TEMPLATES, ...(stored || {}) };
}

async function updateEmailTemplates(input) {
  const current = await getEmailTemplates();
  const next = { ...current };
  Object.entries(input || {}).forEach(([key, value]) => {
    if (!DEFAULT_TEMPLATES[key] || !value || typeof value !== "object") return;
    next[key] = { ...current[key], ...value };
  });
  return saveStoredSetting(TEMPLATE_SETTING_KEY, next);
}

async function sendTemplateEmail(type, to, variables = {}) {
  const preferenceKey = EMAIL_PREFERENCE_KEYS[type];
  if (preferenceKey) {
    const adminSettings = await getStoredSetting("admin.settings");
    if (adminSettings?.notifications?.[preferenceKey] === false) return { sent: false, disabled: true };
  }

  const smtp = getSmtpConfig();
  if (!smtp) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP chưa được cấu hình.");
    console.info(`[EMAIL] Skipped ${type} email to ${to}: SMTP is not configured.`);
    return { sent: false };
  }
  if (!to) throw new Error("Email người nhận không hợp lệ.");

  const templates = await getEmailTemplates();
  const template = templates[type];
  if (!template) throw new Error(`Email template không tồn tại: ${type}`);

  const subject = renderText(template.subject, variables);
  const heading = renderText(template.heading, variables);
  const message = renderText(template.message, variables);
  const transporter = nodemailer.createTransport(smtp.transport);
  await transporter.sendMail({
    from: smtp.from,
    to,
    subject,
    text: `${heading}\n\n${message}`,
    html: buildHtml(heading, message),
  });
  return { sent: true };
}

async function sendCustomEmail({ to, subject, heading, message }) {
  const smtp = getSmtpConfig();
  if (!smtp) throw new Error("SMTP chưa được cấu hình.");
  if (!to) throw new Error("Email người nhận không hợp lệ.");
  const transporter = nodemailer.createTransport(smtp.transport);
  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: String(subject || "Thông báo từ Pet Service"),
    text: `${heading || "Pet Service xin thông báo"}\n\n${message || ""}`,
    html: buildHtml(heading || "Pet Service xin thông báo", message || ""),
  });
  return { sent: true };
}

async function safeSendTemplateEmail(type, to, variables = {}) {
  try {
    return await sendTemplateEmail(type, to, variables);
  } catch (error) {
    console.error(`[EMAIL] Failed to send ${type} email:`, error.message);
    return { sent: false, error: error.message };
  }
}

async function getAppointmentEmailContext(appointmentId) {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id,
      requested_date,
      requested_time,
      appointment_type,
      pets:pet_id (
        name,
        customers:customer_id (
          full_name,
          users:user_id (email)
        )
      )
    `)
    .eq("id", appointmentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    to: data.pets?.customers?.users?.email || "",
    variables: {
      appointmentCode: `APT-${String(data.id).padStart(3, "0")}`,
      appointmentDate: data.requested_date || "",
      appointmentTime: String(data.requested_time || "").slice(0, 5),
      petName: data.pets?.name || "thú cưng",
      customerName: data.pets?.customers?.full_name || "Quý khách",
      appointmentType: data.appointment_type || "",
    },
  };
}

async function sendAppointmentEventEmail(type, appointmentId, variables = {}) {
  const context = await getAppointmentEmailContext(appointmentId);
  if (!context?.to) return { sent: false };
  return safeSendTemplateEmail(type, context.to, { ...context.variables, ...variables });
}

module.exports = {
  DEFAULT_TEMPLATES,
  getEmailTemplates,
  updateEmailTemplates,
  sendTemplateEmail,
  sendCustomEmail,
  safeSendTemplateEmail,
  getAppointmentEmailContext,
  sendAppointmentEventEmail,
};
