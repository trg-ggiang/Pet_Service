const express = require("express");
const { authMiddleware, requireRole } = require("../../middlewares/auth.middleware");
const { supabase } = require("../../lib/supabaseClient");
const { listDoctorAppointmentsForPortal } = require("./medical.service");
const { sendAppointmentEventEmail } = require("../notifications/email.service");
const {
  ensureDoctorScheduleSlot,
  reserveDoctorScheduleSlot,
  setDoctorScheduleSlotStatus,
} = require("../doctors/doctor-schedule.service");

const router = express.Router();
const REQUEST_PREFIX = "[CUSTOMER_REQUEST]";
const MOJIBAKE_PATTERN = /\u00c3|\u00c4|\u00c6|\u00c2|\u00e1\u00ba|\u00e1\u00bb|\u00e2\u20ac|\u00f0\u0178|\ufffd/;
const CP1252_REVERSE = {
  "\u20ac": 0x80, "\u201a": 0x82, "\u0192": 0x83, "\u201e": 0x84, "\u2026": 0x85, "\u2020": 0x86, "\u2021": 0x87,
  "\u02c6": 0x88, "\u2030": 0x89, "\u0160": 0x8A, "\u2039": 0x8B, "\u0152": 0x8C, "\u017d": 0x8E,
  "\u2018": 0x91, "\u2019": 0x92, "\u201c": 0x93, "\u201d": 0x94, "\u2022": 0x95, "\u2013": 0x96, "\u2014": 0x97,
  "\u02dc": 0x98, "\u2122": 0x99, "\u0161": 0x9A, "\u203a": 0x9B, "\u0153": 0x9C, "\u017e": 0x9E, "\u0178": 0x9F,
};
const REPLACEMENT_TEXT_FIXES = [
  [/Kh[\ufffd?]ng c[\ufffd?]/gi, "Không có"],
  [/Kh[\ufffd?]ng ghi nh[\ufffd?]n/gi, "Không ghi nhận"],
  [/Ch[\ufffd?]a r[\ufffd?]/gi, "Chưa rõ"],
  [/Ch[\ufffd?]a c[\ufffd?]/gi, "Chưa có"],
  [/D[\ufffd?] [\ufffd?]ng/gi, "Dị ứng"],
  [/B[\ufffd?]nh n[\ufffd?]n/gi, "Bệnh nền"],
  [/L[\ufffd?]u [\ufffd?]/gi, "Lưu ý"],
];

router.use(authMiddleware);
router.use(requireRole("doctor"));

const EXAM_SYMPTOM_OPTIONS = [
  "Bỏ ăn",
  "Nôn mửa",
  "Tiêu chảy",
  "Sốt",
  "Ho",
  "Hắt hơi",
  "Ngứa da",
  "Rụng lông",
  "Mệt mỏi",
  "Đi khập khiễng",
  "Uống nhiều nước",
  "Tiểu nhiều",
  "Chảy nước mắt",
  "Sưng hạch",
  "Thở khó",
  "Đau bụng",
];

const EXAM_BODY_SYSTEMS = [
  { id: "general", label: "Tổng thể" },
  { id: "skin", label: "Da & Lông" },
  { id: "eyes_ears", label: "Mắt & Tai" },
  { id: "lymph", label: "Hạch bạch huyết" },
  { id: "cardiac", label: "Tim mạch" },
  { id: "respiratory", label: "Hô hấp" },
  { id: "gastro", label: "Tiêu hoá" },
  { id: "musculo", label: "Cơ xương khớp" },
  { id: "neuro", label: "Thần kinh" },
];

const EXAM_FORM_OPTIONS = {
  durationOptions: [
    { value: "<1d", label: "Dưới 1 ngày" },
    { value: "1-3d", label: "1-3 ngày" },
    { value: "3-7d", label: "3-7 ngày" },
    { value: "1-2w", label: "1-2 tuần" },
    { value: ">2w", label: "Hơn 2 tuần" },
  ],
  onsetOptions: [
    { value: "sudden", label: "Đột ngột" },
    { value: "gradual", label: "Từ từ" },
  ],
  severityOptions: [
    { value: "1", label: "Rất nhẹ" },
    { value: "2", label: "Nhẹ" },
    { value: "3", label: "Trung bình" },
    { value: "4", label: "Nặng" },
    { value: "5", label: "Rất nặng" },
  ],
  systemStatusOptions: [
    { value: "normal", label: "Bình thường" },
    { value: "abnormal", label: "Bất thường" },
    { value: "not_examined", label: "Chưa khám" },
  ],
};

const SERVICE_LABELS = {
  MEDICAL: "Khám bệnh",
  GROOMING: "Grooming",
  BOARDING: "Lưu trú",
  VACCINE: "Tiêm phòng",
  MIXED: "Khám & dịch vụ",
  FOOD: "Thức ăn",
  OTHER: "Khác",
};

const STATUS_LABELS = {
  PENDING: "Chờ khám",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang khám",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Không đến",
};

const STATUS_VIEW = {
  PENDING: { label: "Chờ khám", color: "#D97706", bg: "#FFFBEB" },
  CONFIRMED: { label: "Đã xác nhận", color: "#2563EB", bg: "#EFF6FF" },
  IN_PROGRESS: { label: "Đang khám", color: "#7C3AED", bg: "#F5F3FF" },
  COMPLETED: { label: "Hoàn thành", color: "#059669", bg: "#ECFDF5" },
  CANCELLED: { label: "Đã hủy", color: "#DC2626", bg: "#FEF2F2" },
  NO_SHOW: { label: "Không đến", color: "#64748B", bg: "#F1F5F9" },
};

const PORTAL_STATUS_VIEW = {
  completed: {
    label: "Hoàn thành",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  in_progress: {
    label: "Đang khám",
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  scheduled: {
    label: "Chờ khám",
    cls: "bg-blue-50 text-blue-700 ring-blue-200",
    dot: "bg-blue-500",
  },
};

function getPortalStatusKey(status) {
  if (status === "COMPLETED") return "completed";
  if (status === "IN_PROGRESS") return "in_progress";
  return "scheduled";
}

function formatLongDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function parsePositiveId(value, fieldName = "id") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${fieldName} không hợp lệ`);
  }
  return id;
}

function decodeWindows1252AsUtf8(text) {
  const bytes = [];
  for (const char of String(text)) {
    const code = char.codePointAt(0);
    if (code <= 0xff) {
      bytes.push(code);
      continue;
    }

    const mapped = CP1252_REVERSE[char];
    if (mapped == null) return text;
    bytes.push(mapped);
  }
  return Buffer.from(bytes).toString("utf8");
}

function decodeMojibakeToken(value) {
  let text = String(value ?? "");
  for (let index = 0; index < 3 && MOJIBAKE_PATTERN.test(text); index += 1) {
    const decoded = decodeWindows1252AsUtf8(text);
    if (!decoded || decoded === text) break;
    text = decoded;
  }
  return text;
}

function normalizeText(value) {
  let text = String(value ?? "");

  if (MOJIBAKE_PATTERN.test(text)) {
    const decoded = decodeMojibakeToken(text);
    if (decoded !== text && !MOJIBAKE_PATTERN.test(decoded)) {
      text = decoded;
    } else {
      text = text
        .split(/(\s+)/)
        .map((part) => (MOJIBAKE_PATTERN.test(part) ? decodeMojibakeToken(part) : part))
        .join("");
    }
  }

  for (const [pattern, replacement] of REPLACEMENT_TEXT_FIXES) {
    text = text.replace(pattern, replacement);
  }

  return text;
}

function normalizeTextDeep(value) {
  if (typeof value === "string") return normalizeText(value);
  if (Array.isArray(value)) return value.map(normalizeTextDeep);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, normalizeTextDeep(item)]),
  );
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN");
}

function getTodayVN() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function getYesterdayVN() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function getHourVN() {
  return parseInt(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", hour: "numeric", hour12: false }), 10);
}

// Cho phép: đúng ngày hôm nay, HOẶC ngày hôm qua nếu hiện tại < 03:00 (ca trực đêm)
function isDateAllowed(aptDate) {
  if (!aptDate) return true;
  const todayVN = getTodayVN();
  if (aptDate === todayVN) return true;
  return aptDate === getYesterdayVN() && getHourVN() < 3;
}

function getAppointmentDate(appointment) {
  return appointment.requested_date || appointment.doctor_schedule_slots?.slot_date || null;
}

function formatTime(value) {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
}

function normalizeDateInput(value) {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function normalizeTimeInput(value) {
  const text = String(value ?? "").trim();
  if (!/^\d{2}:\d{2}/.test(text)) return null;
  return text.slice(0, 5) + ":00";
}

function addMinutes(time, minutes) {
  const [hourText, minuteText] = String(time || "09:00").split(":");
  const date = new Date(2000, 0, 1, Number(hourText), Number(minuteText));
  date.setMinutes(date.getMinutes() + minutes);
  return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":00";
}

function assertFutureFollowUpSlot(record) {
  if (!record.nextVisitDate) return null;

  const date = normalizeDateInput(record.nextVisitDate);
  const time = normalizeTimeInput(record.nextVisitTime);
  if (!date) throw new Error("Ngày tái khám không hợp lệ");
  if (!time) throw new Error("Vui lòng chọn giờ tái khám");

  const slot = new Date(date + "T" + time.slice(0, 5) + ":00");
  if (Number.isNaN(slot.getTime()) || slot.getTime() <= Date.now()) {
    throw new Error("Lịch tái khám phải nằm trong tương lai");
  }

  return { date, time };
}

function formatAge(dob) {
  if (!dob) return "Chưa rõ";

  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "Chưa rõ";

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    years -= 1;
  }

  if (years <= 0) {
    const months = Math.max(1, Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    return `${months} tháng`;
  }

  return `${years} tuổi`;
}

function getInitials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getGenderLabel(gender) {
  if (gender === "MALE") return "Đực";
  if (gender === "FEMALE") return "Cái";
  return "Chưa rõ";
}

function getServiceLabel(type) {
  return SERVICE_LABELS[type] || type || "Chưa rõ";
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "Chưa rõ";
}

function cleanAppointmentNote(value) {
  return normalizeText(value)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith(REQUEST_PREFIX))
    .filter((line) => !(line.startsWith("{") && line.endsWith("}")))
    .join("\n")
    .trim();
}

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function emptyExamRecord() {
  return normalizeTextDeep({
    chiefComplaint: "",
    selectedSymptoms: [],
    duration: "",
    onset: "",
    severity: 0,
    ownerNotes: "",
    vitals: {
      temp: "",
      heart: "",
      resp: "",
      spo2: "",
      weight: "",
    },
    systems: Object.fromEntries(
      EXAM_BODY_SYSTEMS.map((system) => [
        system.id,
        {
          status: "not_examined",
          notes: "",
        },
      ]),
    ),
    clinicalNote: "",
    prescriptions: [],
    nextVisitDate: null,
    nextVisitTime: "",
  });
}

function normalizeExamRecord(rawVisit) {
  const empty = emptyExamRecord();

  if (!rawVisit) return empty;

  const clinicalExam = safeJsonParse(rawVisit.clinical_exam, {});

  return {
    ...empty,
    chiefComplaint: clinicalExam.chiefComplaint || "",
    selectedSymptoms: Array.isArray(clinicalExam.selectedSymptoms)
      ? clinicalExam.selectedSymptoms
      : String(rawVisit.symptoms || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    duration: clinicalExam.duration || "",
    onset: clinicalExam.onset || "",
    severity: Number(clinicalExam.severity || 0),
    ownerNotes: clinicalExam.ownerNotes || "",
    vitals: {
      ...empty.vitals,
      ...(clinicalExam.vitals || {}),
    },
    systems: {
      ...empty.systems,
      ...(clinicalExam.systems || {}),
    },
    clinicalNote: rawVisit.diagnosis_note || "",
    prescriptions: Array.isArray(clinicalExam.prescriptions) ? clinicalExam.prescriptions : [],
    nextVisitDate: rawVisit.next_visit_date || null,
    nextVisitTime: clinicalExam.nextVisitTime || "",
  };
}

function sanitizeExamRecord(input) {
  const empty = emptyExamRecord();
  const record = input && typeof input === "object" ? input : {};

  const allowedSymptoms = new Set(EXAM_SYMPTOM_OPTIONS);
  const allowedDurations = new Set(EXAM_FORM_OPTIONS.durationOptions.map((item) => item.value));
  const allowedOnsets = new Set(EXAM_FORM_OPTIONS.onsetOptions.map((item) => item.value));
  const allowedStatus = new Set(EXAM_FORM_OPTIONS.systemStatusOptions.map((item) => item.value));
  const allowedSystemIds = new Set(EXAM_BODY_SYSTEMS.map((item) => item.id));

  const systems = { ...empty.systems };
  const rawSystems = record.systems && typeof record.systems === "object" ? record.systems : {};

  for (const [systemId, entry] of Object.entries(rawSystems)) {
    if (!allowedSystemIds.has(systemId)) continue;

    systems[systemId] = {
      status: allowedStatus.has(entry?.status) ? entry.status : "not_examined",
      notes: String(entry?.notes || "").trim(),
    };
  }

  const severity = Number(record.severity || 0);

  // Sanitize prescriptions
  const rawPrescriptions = Array.isArray(record.prescriptions) ? record.prescriptions : [];
  const prescriptions = rawPrescriptions
    .filter((rx) => rx && typeof rx === "object" && String(rx.medicineName || "").trim() !== "")
    .map((rx) => ({
      id: String(rx.id || Math.random().toString(36).substring(2, 9)),
      medicineName: String(rx.medicineName || "").trim(),
      dosage: String(rx.dosage || "").trim(),
      frequency: String(rx.frequency || "2 lần/ngày").trim(),
      route: String(rx.route || "Uống").trim(),
      durationDays: rx.durationDays && Number.isInteger(rx.durationDays) ? rx.durationDays : null,
      instructions: String(rx.instructions || "").trim(),
    }));

  return {
    ...empty,
    chiefComplaint: String(record.chiefComplaint || "").trim(),
    selectedSymptoms: Array.isArray(record.selectedSymptoms)
      ? record.selectedSymptoms
          .map((item) => String(item).trim())
          .filter((item) => allowedSymptoms.has(item))
      : [],
    duration: allowedDurations.has(record.duration) ? record.duration : "",
    onset: allowedOnsets.has(record.onset) ? record.onset : "",
    severity: Number.isInteger(severity) && severity >= 0 && severity <= 5 ? severity : 0,
    ownerNotes: String(record.ownerNotes || "").trim(),
    vitals: {
      temp: String(record.vitals?.temp || "").trim(),
      heart: String(record.vitals?.heart || "").trim(),
      resp: String(record.vitals?.resp || "").trim(),
      spo2: String(record.vitals?.spo2 || "").trim(),
      weight: String(record.vitals?.weight || "").trim(),
    },
    systems,
    clinicalNote: String(record.clinicalNote || "").trim(),
    prescriptions,
    nextVisitDate: normalizeDateInput(record.nextVisitDate) || null,
    nextVisitTime: normalizeTimeInput(record.nextVisitTime)?.slice(0, 5) || "",
  };
}

async function getOwnedAppointment(appointmentId, doctorId) {
  if (!doctorId) {
    throw new Error("Tài khoản bác sĩ chưa được liên kết hồ sơ bác sĩ");
  }

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id,
      pet_id,
      doctor_id,
      doctor_schedule_slot_id,
      appointment_type,
      status,
      note,
      cancel_reason,
      requested_date,
      requested_time,
      created_at,
      updated_at,
      appointment_services (
        id,
        service_id,
        quantity,
        unit_price,
        status,
        services:service_id (
          id,
          name,
          type,
          price
        )
      ),
      doctor_schedule_slots:doctor_schedule_slots!appointments_doctor_schedule_slot_id_fkey (
        id,
        slot_date,
        start_time,
        end_time,
        status,
        schedule:doctor_schedules!doctor_schedule_slots_doctor_schedule_id_fkey (room_name)
      ),
      pets:pet_id (
        id,
        name,
        gender,
        dob,
        weight,
        color,
        img_url,
        allergies,
        chronic_diseases,
        special_note,
        species:species_id (
          id,
          name
        ),
        breed:breed_id (
          id,
          name
        ),
        customers:customer_id (
          id,
          full_name,
          phone,
          address,
          user_id
        )
      )
    `)
    .eq("id", appointmentId)
    .eq("doctor_id", doctorId)
    .single();

  if (error || !data) {
    throw new Error("Không tìm thấy lịch hẹn hoặc bạn không có quyền truy cập");
  }

  return data;
}

async function updateDoctorScheduleStatus(scheduleId, status) {
  await setDoctorScheduleSlotStatus(scheduleId, status);
}

function moneyNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function getBillableMedicalAppointmentService(appointment) {
  const appointmentServices = appointment?.appointment_services || [];
  return (
    appointmentServices.find((item) => item?.services?.type === "MEDICAL")
    || appointmentServices.find((item) => item?.services?.type === "VACCINE")
    || appointmentServices[0]
    || null
  );
}

async function createOrUpdateMedicalVisitInvoice(appointment, medicalVisitId) {
  if (!appointment?.id || !medicalVisitId) return null;

  const appointmentService = getBillableMedicalAppointmentService(appointment);
  const service = appointmentService?.services;
  const quantity = Math.max(1, Number(appointmentService?.quantity || 1));
  const unitPrice = moneyNumber(appointmentService?.unit_price || service?.price);
  const totalPrice = quantity * unitPrice;
  const now = new Date().toISOString();

  const existingInvoiceResult = await supabase
    .from("invoices")
    .select("id, payment_status, status")
    .eq("appointment_id", appointment.id)
    .maybeSingle();

  if (existingInvoiceResult.error) throw new Error(existingInvoiceResult.error.message);

  let invoice = existingInvoiceResult.data;
  if (!invoice?.id) {
    const createdInvoice = await supabase
      .from("invoices")
      .insert({
        appointment_id: appointment.id,
        subtotal_amount: totalPrice,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: totalPrice,
        payment_status: "UNPAID",
        status: "PENDING",
        created_at: now,
        updated_at: now,
      })
      .select("id, payment_status, status")
      .single();

    if (createdInvoice.error) throw new Error(createdInvoice.error.message);
    invoice = createdInvoice.data;
  }

  const itemPayload = {
    invoice_id: invoice.id,
    service_id: appointmentService?.service_id || service?.id || null,
    appointment_service_id: appointmentService?.id || null,
    medical_visit_id: medicalVisitId,
    source_type: "MEDICAL_VISIT",
    description: service?.name || getServiceLabel(appointment.appointment_type) || "Khám bệnh",
    quantity,
    unit_price: unitPrice,
    total_price: totalPrice,
  };

  const existingItem = await supabase
    .from("invoice_items")
    .select("id")
    .eq("invoice_id", invoice.id)
    .eq("medical_visit_id", medicalVisitId)
    .maybeSingle();

  if (existingItem.error) throw new Error(existingItem.error.message);

  const itemResult = existingItem.data?.id
    ? await supabase.from("invoice_items").update(itemPayload).eq("id", existingItem.data.id)
    : await supabase.from("invoice_items").insert(itemPayload);

  if (itemResult.error) throw new Error(itemResult.error.message);

  if (appointmentService?.id) {
    const serviceStatusResult = await supabase
      .from("appointment_services")
      .update({ status: "COMPLETED" })
      .eq("id", appointmentService.id);

    if (serviceStatusResult.error) throw new Error(serviceStatusResult.error.message);
  }

  // Add completed specialist service orders that were not yet on the invoice
  const specialistOrders = await supabase
    .from("appointment_services")
    .select("id, service_id, unit_price, quantity, services(name)")
    .eq("appointment_id", appointment.id)
    .not("ordered_by_doctor_id", "is", null)
    .eq("status", "COMPLETED");

  if (!specialistOrders.error) {
    for (const order of specialistOrders.data || []) {
      const existingSpecialistItem = await supabase
        .from("invoice_items")
        .select("id")
        .eq("invoice_id", invoice.id)
        .eq("appointment_service_id", order.id)
        .maybeSingle();

      if (existingSpecialistItem.data?.id) continue;

      const svcQty = Math.max(1, Number(order.quantity || 1));
      const svcPrice = moneyNumber(order.unit_price);
      await supabase.from("invoice_items").insert({
        invoice_id: invoice.id,
        service_id: order.service_id,
        appointment_service_id: order.id,
        source_type: "SERVICE",
        description: order.services?.name ?? "Dịch vụ chuyên sâu",
        quantity: svcQty,
        unit_price: svcPrice,
        total_price: svcQty * svcPrice,
      });
    }
  }

  if (invoice.payment_status !== "PAID") {
    const totals = await supabase
      .from("invoice_items")
      .select("total_price")
      .eq("invoice_id", invoice.id);

    if (totals.error) throw new Error(totals.error.message);
    const subtotal = (totals.data || []).reduce((sum, item) => sum + moneyNumber(item.total_price), 0);

    const updatedInvoice = await supabase
      .from("invoices")
      .update({
        subtotal_amount: subtotal,
        total_amount: subtotal,
        payment_status: "UNPAID",
        status: "PENDING",
        updated_at: now,
      })
      .eq("id", invoice.id);

    if (updatedInvoice.error) throw new Error(updatedInvoice.error.message);
  }

  return invoice.id;
}

async function resolveFollowUpService() {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, type, price")
    .eq("type", "MEDICAL")
    .eq("is_active", true)
    .order("id", { ascending: true })
    .limit(1);

  if (error) throw new Error(error.message);
  return data?.[0] || null;
}

async function findFollowUpScheduleIfExists(doctorId, date, time, excludeAppointmentId = null) {
  let busyAppointmentsQuery = supabase
    .from("appointments")
    .select("id")
    .eq("doctor_id", doctorId)
    .eq("requested_date", date)
    .eq("requested_time", time)
    .not("status", "in", "(CANCELLED,NO_SHOW)");

  if (excludeAppointmentId) {
    busyAppointmentsQuery = busyAppointmentsQuery.neq("id", excludeAppointmentId);
  }

  const busyAppointments = await busyAppointmentsQuery.limit(1);

  if (busyAppointments.error) throw new Error(busyAppointments.error.message);
  if ((busyAppointments.data || []).length > 0) {
    throw new Error("Bác sĩ đã có lịch hẹn trong khung giờ tái khám này");
  }

  return ensureDoctorScheduleSlot(doctorId, date, time, { slotDuration: 30 });
}

async function createCustomerNotification(userId, payload) {
  if (!userId) throw new Error("Không tìm thấy tài khoản khách hàng để gửi thông báo tái khám");

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title: payload.title,
    content: payload.content,
    type: "APPOINTMENT",
    is_read: false,
  });

  if (error) throw new Error(error.message);
}

function sanitizeUrgentAlertMessage(value) {
  const message = normalizeText(value).trim();
  if (!message) {
    const error = new Error("Vui lòng nhập nội dung thông báo khẩn");
    error.statusCode = 400;
    throw error;
  }

  if (message.length > 1000) {
    const error = new Error("Nội dung thông báo khẩn không được vượt quá 1000 ký tự");
    error.statusCode = 400;
    throw error;
  }

  return message;
}

async function createUrgentCustomerNotification(appointment, message) {
  const customerUserId = appointment?.pets?.customers?.user_id;
  if (!customerUserId) {
    const error = new Error("Không tìm thấy tài khoản chủ thú cưng để gửi thông báo khẩn");
    error.statusCode = 404;
    throw error;
  }

  const petName = appointment?.pets?.name || "thú cưng";
  const title = `Khẩn: Bất thường khi khám ${petName}`.slice(0, 150);

  const { error } = await supabase.from("notifications").insert({
    user_id: customerUserId,
    title,
    content: message,
    type: "SYSTEM",
    is_read: false,
  });

  if (error) throw new Error(error.message);
}

async function createFollowUpAppointment(originalAppointment, cleanRecord) {
  const slot = assertFutureFollowUpSlot(cleanRecord);
  if (!slot) return null;

  const currentDate = normalizeDateInput(originalAppointment.requested_date);
  const currentTime = normalizeTimeInput(originalAppointment.requested_time);
  if (slot.date === currentDate && slot.time === currentTime) {
    return null;
  }

  const schedule = await findFollowUpScheduleIfExists(originalAppointment.doctor_id, slot.date, slot.time, originalAppointment.id);

  // Reserve one concrete 30-minute slot to avoid duplicate doctor_schedule_slot_id conflicts.
  if (schedule?.id) {
    if (!await reserveDoctorScheduleSlot(schedule.id)) {
      const error = new Error("Ca làm việc của bác sĩ đã được đặt. Vui lòng chọn khung giờ khác.");
      error.statusCode = 409;
      throw error;
    }
  }

  const customer = originalAppointment.pets?.customers;
  const service = await resolveFollowUpService();
  const now = new Date().toISOString();
  const note = [
    "Tái khám từ lịch " + String(originalAppointment.id).padStart(6, "0"),
    cleanRecord.clinicalNote ? "Ghi chú: " + cleanRecord.clinicalNote : "",
  ].filter(Boolean).join(". ");

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      pet_id: originalAppointment.pet_id,
      doctor_id: originalAppointment.doctor_id,
      staff_id: null,
      doctor_schedule_slot_id: schedule?.id ?? null,
      appointment_type: "MEDICAL",
      status: "PENDING",
      note,
      updated_at: now,
      requested_date: slot.date,
      requested_time: slot.time,
    })
    .select("id")
    .single();

  if (error) {
    if (schedule?.id) {
      await setDoctorScheduleSlotStatus(schedule.id, "AVAILABLE");
    }
    throw new Error(error.message);
  }

  if (service?.id) {
    const item = await supabase.from("appointment_services").insert({
      appointment_id: appointment.id,
      service_id: service.id,
      quantity: 1,
      unit_price: service.price ?? 0,
      status: "PENDING",
    });

    if (item.error) {
      await supabase.from("appointments").delete().eq("id", appointment.id);
      if (schedule?.id) {
        await setDoctorScheduleSlotStatus(schedule.id, "AVAILABLE");
      }
      throw new Error(item.error.message);
    }
  }

  const petName = originalAppointment.pets?.name || "thú cưng";
  try {
    await createCustomerNotification(customer?.user_id, {
      title: "Lịch tái khám mới",
      content: petName + " có lịch tái khám vào " + formatDate(slot.date) + " lúc " + formatTime(slot.time) + ". Mã lịch hẹn: APT-" + String(appointment.id).padStart(6, "0") + ".",
    });
  } catch (notificationError) {
    await supabase.from("appointments").delete().eq("id", appointment.id);
    if (schedule?.id) {
      await setDoctorScheduleSlotStatus(schedule.id, "AVAILABLE");
    }
    throw notificationError;
  }

  await sendAppointmentEventEmail("appointment_confirmation", appointment.id);

  return {
    id: appointment.id,
    date: slot.date,
    time: slot.time,
  };
}

async function getCurrentMedicalVisit(appointmentId) {
  const { data, error } = await supabase
    .from("medical_visits")
    .select("id, appointment_id, symptoms, clinical_exam, diagnosis_note, next_visit_date, created_at, updated_at")
    .eq("appointment_id", appointmentId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data || null;
}

async function getPrescriptionsForVisit(medicalVisitId) {
  const { data, error } = await supabase
    .from("prescriptions")
    .select(`
      id,
      items:prescription_items!prescription_items_prescription_id_fkey (
        id,
        medicine_name,
        dosage,
        frequency,
        duration_days,
        instructions
      )
    `)
    .eq("medical_visit_id", medicalVisitId)
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).flatMap((prescription) => prescription.items || []).map((item) => ({
    id: String(item.id),
    medicineName: item.medicine_name || "",
    dosage: item.dosage || "",
    frequency: item.frequency || "",
    route: "", // Route is not stored in DB, default to empty
    durationDays: item.duration_days || null,
    instructions: item.instructions || "",
  }));
}

async function savePrescriptions(medicalVisitId, prescriptions) {
  // Get existing prescription IDs for this medical visit
  const { data: existingPrescriptions, error: fetchError } = await supabase
    .from("prescriptions")
    .select("id")
    .eq("medical_visit_id", medicalVisitId);

  if (fetchError) throw new Error(fetchError.message);
  const existingPrescriptionIds = (existingPrescriptions || []).map((row) => row.id);

  if (existingPrescriptionIds.length > 0) {
    const { error: deleteItemsError } = await supabase
      .from("prescription_items")
      .delete()
      .in("prescription_id", existingPrescriptionIds);

    if (deleteItemsError) throw new Error(deleteItemsError.message);

    const { error: deletePrescriptionsError } = await supabase
      .from("prescriptions")
      .delete()
      .eq("medical_visit_id", medicalVisitId);

    if (deletePrescriptionsError) throw new Error(deletePrescriptionsError.message);
  }

  if (!prescriptions || prescriptions.length === 0) return;

  // Create prescription records
  const prescriptionInserts = prescriptions.map((rx) => ({
    medical_visit_id: medicalVisitId,
    notes: rx.instructions || "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { data: createdPrescriptions, error: prescriptionError } = await supabase
    .from("prescriptions")
    .insert(prescriptionInserts)
    .select("id");

  if (prescriptionError) throw new Error(prescriptionError.message);

  // Create prescription items
  const prescriptionItemsInserts = [];
  for (let i = 0; i < prescriptions.length; i++) {
    const rx = prescriptions[i];
    const prescriptionId = createdPrescriptions[i]?.id;

    if (!prescriptionId) continue;

    prescriptionItemsInserts.push({
      prescription_id: prescriptionId,
      medicine_name: String(rx.medicineName || "").trim(),
      dosage: String(rx.dosage || "").trim(),
      frequency: String(rx.frequency || "").trim(),
      duration_days: rx.durationDays && Number.isInteger(rx.durationDays) ? rx.durationDays : null,
      instructions: String(rx.instructions || "").trim(),
    });
  }

  if (prescriptionItemsInserts.length > 0) {
    const { error: itemsError } = await supabase
      .from("prescription_items")
      .insert(prescriptionItemsInserts);

    if (itemsError) throw new Error(itemsError.message);
  }
}

async function getVaccinations(petId) {
  const { data, error } = await supabase
    .from("vaccinations")
    .select("id, vaccine_name, date_given, next_due_date, note")
    .eq("pet_id", petId)
    .order("date_given", { ascending: false });

  if (error) throw new Error(error.message);

  const today = new Date();

  return (data || []).map((item) => {
    const dueDate = item.next_due_date ? new Date(item.next_due_date) : null;

    return {
      id: item.id,
      name: item.vaccine_name,
      dateGiven: item.date_given,
      nextDueDate: item.next_due_date,
      dateGivenLabel: formatDate(item.date_given),
      nextDueDateLabel: formatDate(item.next_due_date),
      note: item.note || "",
      isDue: dueDate ? dueDate.getTime() < today.getTime() : false,
    };
  });
}

async function getVisitHistory(petId, currentAppointmentId) {
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id,
      doctor_id,
      doctor_schedule_slot_id,
      appointment_type,
      status,
      created_at,
      doctors:doctor_id (
        full_name
      ),
      doctor_schedule_slots:doctor_schedule_slots!appointments_doctor_schedule_slot_id_fkey (
        slot_date,
        start_time,
        schedule:doctor_schedules!doctor_schedule_slots_doctor_schedule_id_fkey (room_name)
      )
    `)
    .eq("pet_id", petId)
    .neq("id", currentAppointmentId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw new Error(error.message);

  const appointmentIds = (appointments || []).map((item) => item.id);

  const { data: visits, error: visitError } = appointmentIds.length
    ? await supabase
        .from("medical_visits")
        .select("appointment_id, diagnosis_note, next_visit_date")
        .in("appointment_id", appointmentIds)
    : { data: [], error: null };

  if (visitError) throw new Error(visitError.message);

  const visitMap = new Map((visits || []).map((visit) => [visit.appointment_id, visit]));

  return (appointments || []).map((appointment) => {
    const visit = visitMap.get(appointment.id);
    const schedule = appointment.doctor_schedule_slots;

    return {
      id: appointment.id,
      date: formatDate(schedule?.slot_date || appointment.created_at),
      time: formatTime(schedule?.start_time),
      service: getServiceLabel(appointment.appointment_type),
      status: getStatusLabel(appointment.status),
      doctorName: appointment.doctors?.full_name || "Chưa rõ bác sĩ",
      diagnosisNote: visit?.diagnosis_note || "",
      nextVisitDate: visit?.next_visit_date || null,
    };
  });
}

async function buildExamDetail({ appointment, vaccinations, history, visit }) {
  const pet = appointment.pets;
  const owner = pet?.customers;
  const schedule = appointment.doctor_schedule_slots;
  const record = normalizeExamRecord(visit);
  const appointmentNote = cleanAppointmentNote(appointment.note);

  // Fetch prescriptions from database if visit exists
  let prescriptions = record.prescriptions;
  if (visit?.id) {
    try {
      const dbPrescriptions = await getPrescriptionsForVisit(visit.id);
      if (dbPrescriptions && dbPrescriptions.length > 0) {
        prescriptions = dbPrescriptions;
      }
    } catch (e) {
      // Fall back to clinical_exam data
    }
  }

  return normalizeTextDeep({
    appointment: {
      id: appointment.id,
      displayId: `APT-${String(appointment.id).padStart(5, "0")}`,
      status: appointment.status,
      statusLabel: getStatusLabel(appointment.status),
      serviceType: appointment.appointment_type,
      serviceLabel: getServiceLabel(appointment.appointment_type),
      date: appointment.requested_date || schedule?.slot_date || appointment.created_at,
      dateLabel: formatDate(appointment.requested_date || schedule?.slot_date || appointment.created_at),
      time: formatTime(appointment.requested_time || schedule?.start_time),
      endTime: formatTime(schedule?.end_time),
      roomName: schedule?.schedule?.room_name || "",
      note: appointmentNote || "",
    },
    patientCard: {
      id: pet?.id || null,
      name: pet?.name || "Chưa rõ",
      initials: getInitials(pet?.name),
      imageUrl: pet?.img_url || null,
      subtitle: [
        pet?.species?.name || "Chưa rõ loài",
        getGenderLabel(pet?.gender),
        pet?.color || "Chưa rõ màu",
      ].join(" · "),
      serviceBadge: getServiceLabel(appointment.appointment_type),
    },
    petInfoItems: [
      { key: "age", icon: "CalendarDays", label: "Tuổi", value: formatAge(pet?.dob) },
      { key: "weight", icon: "Weight", label: "Cân nặng", value: pet?.weight ? `${pet.weight} kg` : "Chưa rõ" },
      { key: "breed", icon: "Stethoscope", label: "Giống", value: pet?.breed?.name || "Chưa rõ" },
      { key: "time", icon: "Clock", label: "Giờ hẹn", value: formatTime(schedule?.start_time) },
    ],
    owner: {
      id: owner?.id || null,
      fullName: owner?.full_name || "Chưa rõ chủ nuôi",
      phone: owner?.phone || "Chưa có SĐT",
      address: owner?.address || "",
    },
    riskAlerts: [
      pet?.allergies ? { key: "allergies", label: "Dị ứng", value: pet.allergies } : null,
      pet?.chronic_diseases ? { key: "chronicDiseases", label: "Bệnh nền", value: pet.chronic_diseases } : null,
      pet?.special_note ? { key: "specialNote", label: "Lưu ý", value: pet.special_note } : null,
    ].filter(Boolean),
    vaccinations,
    history,
    formSchema: {
      symptomOptions: EXAM_SYMPTOM_OPTIONS.map((label, index) => ({ id: index + 1, label })),
      bodySystems: EXAM_BODY_SYSTEMS,
      ...EXAM_FORM_OPTIONS,
      vitalFields: [
        { key: "temp", icon: "Thermometer", label: "Nhiệt độ", unit: "°C", tone: "orange" },
        { key: "heart", icon: "Heart", label: "Nhịp tim", unit: "lần/phút", tone: "red" },
        { key: "resp", icon: "Wind", label: "Nhịp thở", unit: "lần/phút", tone: "cyan" },
        { key: "spo2", icon: "Activity", label: "SpO₂", unit: "%", tone: "violet" },
        { key: "weight", icon: "Weight", label: "Cân nặng thực tế", unit: "kg", tone: "emerald" },
      ],
    },
    record: {
      ...record,
      prescriptions,
    },
  });
}

async function saveMedicalVisit(appointmentId, record) {
  const cleanRecord = sanitizeExamRecord(record);
  const now = new Date().toISOString();

  const clinicalExamPayload = {
    chiefComplaint: cleanRecord.chiefComplaint,
    selectedSymptoms: cleanRecord.selectedSymptoms,
    duration: cleanRecord.duration,
    onset: cleanRecord.onset,
    severity: cleanRecord.severity,
    ownerNotes: cleanRecord.ownerNotes,
    vitals: cleanRecord.vitals,
    systems: cleanRecord.systems,
    nextVisitTime: cleanRecord.nextVisitTime,
  };

  const existingVisit = await getCurrentMedicalVisit(appointmentId);

  const payload = {
    appointment_id: appointmentId,
    symptoms: cleanRecord.selectedSymptoms.join(", "),
    clinical_exam: JSON.stringify(clinicalExamPayload),
    diagnosis_note: cleanRecord.clinicalNote || null,
    next_visit_date: cleanRecord.nextVisitDate || null,
    updated_at: now,
  };

  let medicalVisitId;

  if (existingVisit?.id) {
    const { data, error } = await supabase
      .from("medical_visits")
      .update(payload)
      .eq("id", existingVisit.id)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    medicalVisitId = data.id;
  } else {
    const { data, error } = await supabase
      .from("medical_visits")
      .insert({
        ...payload,
        created_at: now,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    medicalVisitId = data.id;
  }

  // Save prescriptions to database
  await savePrescriptions(medicalVisitId, cleanRecord.prescriptions);

  return medicalVisitId;
}

function repairNotificationText(value) {
  let text = String(value || "");

  if (text.includes("?") || text.includes("?") || text.includes("?") || text.includes("?") || text.includes("??") || text.includes("??")) {
    try {
      const repaired = Buffer.from(text, "latin1").toString("utf8");
      if (repaired && !repaired.includes("?")) text = repaired;
    } catch {
      // Keep original text if legacy repair fails.
    }
  }

  const replacements = [
    [/Kh.ch h.ng/g, "Khách hàng"],
    [/y.u c.u/g, "yêu cầu"],
    [/.{2}i l.ch/g, "đổi lịch"],
    [/h.y l.ch/g, "hủy lịch"],
    [/l.ch h.n/g, "lịch hẹn"],
    [/L. do/g, "Lý do"],
    [/.{2} x.c nh.n/g, "đã xác nhận"],
    [/Kh.ng ghi r./g, "Không ghi rõ"],
  ];

  for (const [bad, good] of replacements) {
    text = text.replace(bad, good);
  }

  return text;
}

function mapDoctorNotification(notification) {
  return {
    id: notification.id,
    title: repairNotificationText(notification.title || "Thông báo"),
    content: repairNotificationText(notification.content || ""),
    type: notification.type || "APPOINTMENT",
    isRead: Boolean(notification.is_read),
    createdAt: notification.created_at,
  };
}

// GET /api/doctor/appointments
router.get("/", async function getDoctorAppointments(req, res) {
  try {
    const doctorId = req.auth?.user?.doctorId;

    if (!doctorId) {
      return res.status(403).json({
        ok: false,
        message: "Tài khoản này không phải là bác sĩ hoặc chưa được liên kết với hồ sơ bác sĩ",
      });
    }

    const payload = await listDoctorAppointmentsForPortal(doctorId);
    res.json({ ok: true, ...payload });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// GET /api/doctor/appointments/notifications
router.get("/notifications", async function getDoctorNotifications(req, res) {
  try {
    const userId = req.auth?.rawUser?.id;
    if (!userId) return res.status(403).json({ ok: false, message: "Không xác định được tài khoản bác sĩ" });

    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, content, type, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);

    const notifications = (data || []).map(mapDoctorNotification);
    res.json({
      ok: true,
      notifications,
      summary: {
        total: notifications.length,
        unreadCount: notifications.filter((notification) => !notification.isRead).length,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.patch("/notifications/read-all", async function markAllDoctorNotificationsRead(req, res) {
  try {
    const userId = req.auth?.rawUser?.id;
    if (!userId) return res.status(403).json({ ok: false, message: "Không xác định được tài khoản bác sĩ" });

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw new Error(error.message);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.patch("/notifications/:notificationId/read", async function markDoctorNotificationRead(req, res) {
  try {
    const userId = req.auth?.rawUser?.id;
    const notificationId = parsePositiveId(req.params.notificationId, "ID thông báo");
    if (!userId) return res.status(403).json({ ok: false, message: "Không xác định được tài khoản bác sĩ" });

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// POST /api/doctor/appointments/:id/urgent-alert
router.post("/:id/urgent-alert", async function sendUrgentAlert(req, res) {
  try {
    const appointmentId = parsePositiveId(req.params.id, "ID lịch hẹn");
    const doctorId = req.auth?.user?.doctorId;
    const appointment = await getOwnedAppointment(appointmentId, doctorId);
    const message = sanitizeUrgentAlertMessage(req.body?.message);

    await createUrgentCustomerNotification(appointment, message);

    res.json({
      ok: true,
      message: "Đã gửi thông báo khẩn đến chủ thú cưng",
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({ ok: false, message: error.message });
  }
});

// PUT /api/doctor/appointments/:id/start
router.put("/:id/start", async function startExam(req, res) {
  try {
    const appointmentId = parsePositiveId(req.params.id, "ID lịch hẹn");
    const doctorId = req.auth?.user?.doctorId;
    const appointment = await getOwnedAppointment(appointmentId, doctorId);

    if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
      return res.status(400).json({
        ok: false,
        message: "Chỉ có thể bắt đầu lịch hẹn ở trạng thái chờ khám hoặc đã xác nhận",
      });
    }

    const aptDate = getAppointmentDate(appointment);
    if (aptDate && !isDateAllowed(aptDate)) {
      const aptDateDisplay = new Date(aptDate + "T00:00:00").toLocaleDateString("vi-VN");
      const todayDisplay   = new Date(getTodayVN() + "T00:00:00").toLocaleDateString("vi-VN");
      return res.status(400).json({
        ok: false,
        message: `Chỉ được bắt đầu khám vào đúng ngày hẹn. Lịch hẹn vào ${aptDateDisplay}, hôm nay là ${todayDisplay}.`,
      });
    }

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "IN_PROGRESS",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (error) throw new Error(error.message);
    await updateDoctorScheduleStatus(appointment.doctor_schedule_slot_id, "IN_PROGRESS");

    res.json({ ok: true, message: "Bắt đầu khám thành công" });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

// GET /api/doctor/appointments/:id/exam-detail
router.get("/:id/exam-detail", async function getExamDetail(req, res) {
  try {
    const appointmentId = parsePositiveId(req.params.id, "ID lịch hẹn");
    const doctorId = req.auth?.user?.doctorId;

    const appointment = await getOwnedAppointment(appointmentId, doctorId);
    const [visit, vaccinations, history] = await Promise.all([
      getCurrentMedicalVisit(appointmentId),
      getVaccinations(appointment.pet_id),
      getVisitHistory(appointment.pet_id, appointmentId),
    ]);

    res.json({
      ok: true,
      detail: await buildExamDetail({
        appointment,
        vaccinations,
        history,
        visit,
      }),
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

// PUT /api/doctor/appointments/:id/exam-draft
router.put("/:id/exam-draft", async function saveExamDraft(req, res) {
  try {
    const appointmentId = parsePositiveId(req.params.id, "ID lịch hẹn");
    const doctorId = req.auth?.user?.doctorId;
    const appointment = await getOwnedAppointment(appointmentId, doctorId);

    await saveMedicalVisit(appointmentId, req.body?.record);

    if (["PENDING", "CONFIRMED"].includes(appointment.status)) {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "IN_PROGRESS",
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

      if (error) throw new Error(error.message);
      await updateDoctorScheduleStatus(appointment.doctor_schedule_slot_id, "IN_PROGRESS");
    }

    res.json({ ok: true, message: "Đã lưu nháp phiếu khám" });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

// PUT /api/doctor/appointments/:id/exam-complete
router.put("/:id/exam-complete", async function completeExamWithRecord(req, res) {
  try {
    const appointmentId = parsePositiveId(req.params.id, "ID lịch hẹn");
    const doctorId = req.auth?.user?.doctorId;

    const appointment = await getOwnedAppointment(appointmentId, doctorId);

    const aptDate = getAppointmentDate(appointment);
    if (aptDate && !isDateAllowed(aptDate)) {
      const aptDateDisplay = new Date(aptDate + "T00:00:00").toLocaleDateString("vi-VN");
      const todayDisplay   = new Date(getTodayVN() + "T00:00:00").toLocaleDateString("vi-VN");
      return res.status(400).json({
        ok: false,
        message: `Không thể hoàn thành ca khám qua ngày. Lịch hẹn vào ${aptDateDisplay} nhưng hiện tại là ${todayDisplay}. Vui lòng liên hệ quản lý để xử lý.`,
      });
    }

    const cleanRecord = sanitizeExamRecord(req.body?.record);
    assertFutureFollowUpSlot(cleanRecord);
    const medicalVisitId = await saveMedicalVisit(appointmentId, cleanRecord);
    const followUpAppointment = await createFollowUpAppointment(appointment, cleanRecord);

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "COMPLETED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (error) throw new Error(error.message);
    await createOrUpdateMedicalVisitInvoice(appointment, medicalVisitId);
    await updateDoctorScheduleStatus(appointment.doctor_schedule_slot_id, "DONE");
    await sendAppointmentEventEmail("exam_result", appointmentId, {
      diagnosis: req.body?.record?.clinicalNote || "Kết quả khám đã được cập nhật trên hệ thống.",
    });

    res.json({
      ok: true,
      message: followUpAppointment
        ? "Đã hoàn thành ca khám và tạo lịch tái khám cho khách hàng"
        : "Đã hoàn thành ca khám",
      followUpAppointment,
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

// ── SERVICE ORDER ENDPOINTS ────────────────────────────────────────────

// GET /api/doctor/specialist-services – danh mục dịch vụ chuyên khoa để bác sĩ chỉ định
router.get("/specialist-services", async function getSpecialistServices(_req, res) {
  try {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, type, price, description, specialist_room_type")
      .eq("is_active", true)
      .not("specialist_room_type", "is", null)
      .order("specialist_room_type")
      .order("name");
    if (error) throw new Error(error.message);
    res.json({ ok: true, services: data ?? [] });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

// GET /api/doctor/appointments/:id/service-orders – danh sách chỉ định + kết quả
router.get("/:id/service-orders", async function listServiceOrders(req, res) {
  try {
    const appointmentId = parsePositiveId(req.params.id, "ID lịch hẹn");
    const doctorId = req.auth?.user?.doctorId;
    await getOwnedAppointment(appointmentId, doctorId);

    const { data, error } = await supabase
      .from("appointment_services")
      .select(`
        id, appointment_id, service_id, quantity, unit_price, status, note, ordered_at, ordered_by_doctor_id,
        services ( id, name, price, specialist_room_type ),
        service_order_results ( id, result_text, image_urls, measurements, notes, performed_at )
      `)
      .eq("appointment_id", appointmentId)
      .not("ordered_by_doctor_id", "is", null)
      .order("ordered_at");

    if (error) throw new Error(error.message);
    res.json({ ok: true, serviceOrders: data ?? [] });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

// POST /api/doctor/appointments/:id/service-orders – chỉ định dịch vụ bổ sung
router.post("/:id/service-orders", async function createServiceOrder(req, res) {
  try {
    const appointmentId = parsePositiveId(req.params.id, "ID lịch hẹn");
    const doctorId = req.auth?.user?.doctorId;
    const userId = req.auth?.user?.id;
    const appointment = await getOwnedAppointment(appointmentId, doctorId);

    if (appointment.status === "COMPLETED") {
      return res.status(400).json({ ok: false, message: "Không thể chỉ định thêm dịch vụ cho lịch hẹn đã hoàn thành" });
    }

    const { serviceId, note } = req.body ?? {};
    if (!serviceId) return res.status(400).json({ ok: false, message: "Thiếu serviceId" });

    const { data: svc, error: svcErr } = await supabase
      .from("services")
      .select("id, name, price, specialist_room_type, is_active")
      .eq("id", serviceId)
      .single();
    if (svcErr || !svc) return res.status(404).json({ ok: false, message: "Dịch vụ không tồn tại" });
    if (!svc.is_active) return res.status(400).json({ ok: false, message: "Dịch vụ không còn hoạt động" });
    if (!svc.specialist_room_type) return res.status(400).json({ ok: false, message: "Chỉ có thể chỉ định dịch vụ chuyên khoa" });

    const { data: inserted, error: insertErr } = await supabase
      .from("appointment_services")
      .insert({
        appointment_id: appointmentId,
        service_id: serviceId,
        quantity: 1,
        unit_price: svc.price,
        status: "PENDING",
        ordered_by_doctor_id: userId,
        note: note ?? null,
        ordered_at: new Date().toISOString(),
      })
      .select(`
        id, service_id, quantity, unit_price, status, note, ordered_at,
        services ( id, name, price, specialist_room_type )
      `)
      .single();

    if (insertErr) throw new Error(insertErr.message);
    res.json({ ok: true, message: "Đã chỉ định dịch vụ", serviceOrder: inserted });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

// DELETE /api/doctor/service-orders/:orderId – hủy chỉ định (chỉ khi còn PENDING)
router.delete("/service-orders/:orderId", async function cancelServiceOrder(req, res) {
  try {
    const orderId = parsePositiveId(req.params.orderId, "ID chỉ định");
    const doctorId = req.auth?.user?.doctorId;
    const userId = req.auth?.user?.id;

    const { data: order, error: fetchErr } = await supabase
      .from("appointment_services")
      .select("id, status, ordered_by_doctor_id, appointment_id")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) return res.status(404).json({ ok: false, message: "Không tìm thấy chỉ định" });
    if (order.ordered_by_doctor_id !== userId) return res.status(403).json({ ok: false, message: "Không có quyền hủy chỉ định này" });
    if (order.status !== "PENDING") return res.status(400).json({ ok: false, message: "Chỉ có thể hủy chỉ định chưa được thực hiện" });

    await getOwnedAppointment(order.appointment_id, doctorId);

    const { error: delErr } = await supabase
      .from("appointment_services")
      .delete()
      .eq("id", orderId);

    if (delErr) throw new Error(delErr.message);
    res.json({ ok: true, message: "Đã hủy chỉ định dịch vụ" });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

// ── DOCTOR SPECIALIST QUEUE ───────────────────────────────────────────

// GET /api/doctor/specialist-queue – tất cả chỉ định dịch vụ chuyên sâu (mọi bác sĩ đều thấy)
router.get("/specialist-queue", async function getDoctorSpecialistQueue(req, res) {
  try {
    const userId = req.auth?.user?.id;
    const { search, roomType } = req.query;

    let query = supabase
      .from("appointment_services")
      .select(`
        id, quantity, unit_price, status, note, ordered_at, ordered_by_doctor_id,
        services ( id, name, specialist_room_type ),
        appointments (
          id,
          pets:pet_id (
            name,
            species:species_id ( name ),
            breed:breed_id ( name ),
            customers:customer_id ( full_name, phone )
          )
        ),
        service_order_results (
          id, performed_by_id, result_text, image_urls, measurements, notes, performed_at
        )
      `)
      .not("ordered_by_doctor_id", "is", null)
      .not("services.specialist_room_type", "is", null)
      .order("ordered_at", { ascending: false });

    if (roomType) {
      query = query.eq("services.specialist_room_type", roomType);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let rows = (data ?? []).filter(row => row.services?.specialist_room_type);

    if (roomType) {
      rows = rows.filter(row => row.services?.specialist_room_type === roomType);
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      rows = rows.filter(row => {
        const customer = row.appointments?.pets?.customers;
        return (
          (customer?.full_name || "").toLowerCase().includes(q) ||
          (customer?.phone || "").toLowerCase().includes(q) ||
          (row.appointments?.pets?.name || "").toLowerCase().includes(q)
        );
      });
    }

    // Resolve doctor names by user_id (ordered_by và performed_by)
    const userIds = [...new Set([
      ...rows.map(r => r.ordered_by_doctor_id),
      ...rows.map(r => r.service_order_results?.performed_by_id),
    ].filter(Boolean))];

    let doctorNameByUserId = {};
    if (userIds.length > 0) {
      const { data: doctors } = await supabase
        .from("doctors")
        .select("user_id, full_name")
        .in("user_id", userIds);
      doctorNameByUserId = Object.fromEntries((doctors || []).map(d => [d.user_id, d.full_name]));
    }

    rows = rows.map(row => ({
      ...row,
      ordered_by_doctor_name: doctorNameByUserId[row.ordered_by_doctor_id] ?? null,
      performed_by_doctor_name: row.service_order_results
        ? (doctorNameByUserId[row.service_order_results.performed_by_id] ?? null)
        : null,
      is_mine_to_perform:
        row.status === "PENDING" ||
        (row.status === "IN_PROGRESS" && row.service_order_results?.performed_by_id === userId),
    }));

    res.json({ ok: true, queue: rows });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

// PATCH /api/doctor/service-orders/:orderId/start – bác sĩ bắt đầu và khóa chỉ định
router.patch("/service-orders/:orderId/start", async function doctorStartServiceOrder(req, res) {
  try {
    const orderId = parsePositiveId(req.params.orderId, "ID chỉ định");
    const userId = req.auth?.user?.id;

    const { data: order, error: fetchErr } = await supabase
      .from("appointment_services")
      .select(`
        id, status,
        appointments ( requested_date, doctor_schedule_slots:doctor_schedule_slots!appointments_doctor_schedule_slot_id_fkey ( slot_date ) )
      `)
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) return res.status(404).json({ ok: false, message: "Không tìm thấy chỉ định" });
    if (order.status !== "PENDING") return res.status(400).json({ ok: false, message: "Chỉ định phải ở trạng thái Chờ" });

    const aptDate = order.appointments?.requested_date || order.appointments?.doctor_schedule_slots?.slot_date;
    if (aptDate && !isDateAllowed(aptDate)) {
      const aptDateDisplay = new Date(aptDate + "T00:00:00").toLocaleDateString("vi-VN");
      return res.status(400).json({
        ok: false,
        message: `Chỉ có thể thực hiện dịch vụ vào ngày khám (${aptDateDisplay}).`,
      });
    }

    // Kiểm tra chưa có ai khóa
    const { data: existing } = await supabase
      .from("service_order_results")
      .select("id, performed_by_id")
      .eq("appointment_service_id", orderId)
      .maybeSingle();

    if (existing?.id) {
      return res.status(409).json({ ok: false, message: "Chỉ định này đã được bác sĩ khác nhận thực hiện" });
    }

    // Khóa bằng cách insert bản ghi partial với performed_by_id = người bắt đầu
    const { error: lockErr } = await supabase
      .from("service_order_results")
      .insert({
        appointment_service_id: orderId,
        performed_by_id: userId,
        result_text: null,
        image_urls: [],
      });

    if (lockErr) throw new Error(lockErr.message);

    const { error } = await supabase
      .from("appointment_services")
      .update({ status: "IN_PROGRESS" })
      .eq("id", orderId);

    if (error) throw new Error(error.message);
    res.json({ ok: true, message: "Đã bắt đầu thực hiện" });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

// POST /api/doctor/service-orders/:orderId/result – bác sĩ nhập kết quả chuyên sâu
router.post("/service-orders/:orderId/result", async function doctorSubmitServiceOrderResult(req, res) {
  try {
    const orderId = parsePositiveId(req.params.orderId, "ID chỉ định");
    const userId = req.auth?.user?.id;

    const { data: order, error: fetchErr } = await supabase
      .from("appointment_services")
      .select("id, status, appointment_id, service_id, unit_price, quantity, ordered_by_doctor_id, services(name)")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) return res.status(404).json({ ok: false, message: "Không tìm thấy chỉ định" });
    if (order.status === "COMPLETED") return res.status(400).json({ ok: false, message: "Đã có kết quả rồi" });

    // Kiểm tra khóa: chỉ người đã bắt đầu mới được nhập kết quả
    const { data: lockRow } = await supabase
      .from("service_order_results")
      .select("performed_by_id")
      .eq("appointment_service_id", orderId)
      .maybeSingle();

    if (lockRow && lockRow.performed_by_id !== userId) {
      let performerName = "bác sĩ khác";
      const { data: perfDoc } = await supabase
        .from("doctors")
        .select("full_name")
        .eq("user_id", lockRow.performed_by_id)
        .maybeSingle();
      if (perfDoc?.full_name) performerName = perfDoc.full_name;

      return res.status(403).json({
        ok: false,
        message: `Chỉ định này đang được thực hiện bởi ${performerName}`,
      });
    }

    const { resultText, imageUrls, measurements, notes } = req.body ?? {};
    if (!resultText && (!imageUrls || imageUrls.length === 0)) {
      return res.status(400).json({ ok: false, message: "Cần nhập kết quả hoặc thêm hình ảnh" });
    }

    const now = new Date().toISOString();

    const { error: resultErr } = await supabase
      .from("service_order_results")
      .upsert({
        appointment_service_id: orderId,
        performed_by_id: userId,
        result_text: resultText ?? null,
        image_urls: imageUrls ?? [],
        measurements: measurements ?? null,
        notes: notes ?? null,
        performed_at: now,
        updated_at: now,
      }, { onConflict: "appointment_service_id" });

    if (resultErr) throw new Error(resultErr.message);

    const { error: statusErr } = await supabase
      .from("appointment_services")
      .update({ status: "COMPLETED" })
      .eq("id", orderId);

    if (statusErr) throw new Error(statusErr.message);

    // Cập nhật hóa đơn sau khi dịch vụ hoàn thành
    const { data: aptService } = await supabase
      .from("appointment_services")
      .select("appointment_id, service_id, unit_price, quantity, services(name)")
      .eq("id", orderId)
      .maybeSingle();

    if (aptService?.appointment_id) {
      const { data: invoice } = await supabase
        .from("invoices")
        .select("id, payment_status, status")
        .eq("appointment_id", aptService.appointment_id)
        .maybeSingle();

      if (invoice?.id) {
        const { data: existingItem } = await supabase
          .from("invoice_items")
          .select("id")
          .eq("invoice_id", invoice.id)
          .eq("appointment_service_id", orderId)
          .maybeSingle();

        if (!existingItem?.id) {
          const qty = Math.max(1, Number(aptService.quantity || 1));
          const price = Number(aptService.unit_price || 0);
          await supabase.from("invoice_items").insert({
            invoice_id: invoice.id,
            service_id: aptService.service_id,
            appointment_service_id: orderId,
            source_type: "SERVICE",
            description: aptService.services?.name ?? "Dịch vụ chuyên sâu",
            quantity: qty,
            unit_price: price,
            total_price: qty * price,
          });

          // Nếu hóa đơn chưa thanh toán thì cập nhật tổng tiền
          if (!["PAID", "REFUNDED"].includes(invoice.payment_status)) {
            const { data: items } = await supabase
              .from("invoice_items")
              .select("total_price")
              .eq("invoice_id", invoice.id);
            const subtotal = (items || []).reduce((s, i) => s + Number(i.total_price), 0);
            await supabase.from("invoices").update({
              subtotal_amount: subtotal,
              total_amount: subtotal,
              updated_at: new Date().toISOString(),
            }).eq("id", invoice.id);
          } else {
            // Hóa đơn đã thanh toán: ghi nhận cần thu thêm (log server-side)
            console.warn(
              `[INVOICE] Dịch vụ #${orderId} hoàn thành nhưng hóa đơn #${invoice.id} đã PAID. ` +
              `Cần thu thêm ${aptService.services?.name} từ khách hàng.`
            );
          }
        }
      }
    }

    res.json({ ok: true, message: "Đã lưu kết quả dịch vụ chuyên sâu" });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

// ── LEGACY COMPLETE ─────────────────────────────────────────────────────

// Giữ endpoint cũ để không vỡ nơi khác nếu đang gọi /complete.
router.put("/:id/complete", async function completeExamOnly(req, res) {
  try {
    const appointmentId = parsePositiveId(req.params.id, "ID lịch hẹn");
    const doctorId = req.auth?.user?.doctorId;
    const appointment = await getOwnedAppointment(appointmentId, doctorId);

    if (appointment.status !== "IN_PROGRESS") {
      return res.status(400).json({
        ok: false,
        message: "Chỉ có thể hoàn thành lịch hẹn đang trong quá trình khám",
      });
    }

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "COMPLETED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (error) throw new Error(error.message);
    const currentVisit = await getCurrentMedicalVisit(appointmentId);
    if (currentVisit?.id) {
      await createOrUpdateMedicalVisitInvoice(appointment, currentVisit.id);
    }
    await updateDoctorScheduleStatus(appointment.doctor_schedule_slot_id, "DONE");
    await sendAppointmentEventEmail("exam_result", appointmentId, {
      diagnosis: "Kết quả khám đã được cập nhật trên hệ thống.",
    });

    res.json({ ok: true, message: "Hoàn thành khám thành công" });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

module.exports = router;
