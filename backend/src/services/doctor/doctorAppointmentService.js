const { supabase } = require("../../lib/supabaseClient");
const MOJIBAKE_PATTERN = /\u00c3|\u00c4|\u00c6|\u00c2|\u00e1\u00ba|\u00e1\u00bb|\u00e2\u20ac|\u00f0\u0178|\ufffd/;
const CP1252_REVERSE = {
  "\u20ac": 0x80, "\u201a": 0x82, "\u0192": 0x83, "\u201e": 0x84, "\u2026": 0x85, "\u2020": 0x86, "\u2021": 0x87,
  "\u02c6": 0x88, "\u2030": 0x89, "\u0160": 0x8A, "\u2039": 0x8B, "\u0152": 0x8C, "\u017d": 0x8E,
  "\u2018": 0x91, "\u2019": 0x92, "\u201c": 0x93, "\u201d": 0x94, "\u2022": 0x95, "\u2013": 0x96, "\u2014": 0x97,
  "\u02dc": 0x98, "\u2122": 0x99, "\u0161": 0x9A, "\u203a": 0x9B, "\u0153": 0x9C, "\u017e": 0x9E, "\u0178": 0x9F,
};

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
  for (let i = 0; i < 3 && MOJIBAKE_PATTERN.test(text); i += 1) {
    const decoded = decodeWindows1252AsUtf8(text);
    if (!decoded || decoded === text) break;
    text = decoded;
  }
  return text;
}

function normalizeText(value) {
  const text = String(value ?? "");
  if (!MOJIBAKE_PATTERN.test(text)) return text;
  const decoded = decodeMojibakeToken(text);
  if (decoded !== text && !MOJIBAKE_PATTERN.test(decoded)) return decoded;
  return text.split(/(\s+)/).map((part) => (MOJIBAKE_PATTERN.test(part) ? decodeMojibakeToken(part) : part)).join("");
}

function normalizeTextDeep(value) {
  if (typeof value === "string") return normalizeText(value);
  if (Array.isArray(value)) return value.map(normalizeTextDeep);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeTextDeep(item)]));
}


const SERVICE_LABELS = {
  MEDICAL: "Khám bệnh",
  GROOMING: "Grooming",
  BOARDING: "Lưu trú",
  VACCINE: "Tiêm phòng",
  MIXED: "Khám & dịch vụ",
  FOOD: "Thức ăn",
  OTHER: "Khác",
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

function formatTime(value) {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
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

function formatScheduleDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getServiceLabel(type) {
  return SERVICE_LABELS[type] || type || "Chưa rõ";
}

function getPortalStatusKey(status) {
  if (status === "COMPLETED") return "completed";
  if (status === "IN_PROGRESS") return "in_progress";
  return "scheduled";
}

function getAppointmentDate(appointment) {
  return appointment.requested_date
    || appointment.doctor_schedule_slots?.slot_date
    || appointment.created_at
    || "";
}

function getAppointmentTime(appointment) {
  return appointment.requested_time || appointment.doctor_schedule_slots?.start_time || "";
}

function getRoomName(appointment) {
  return appointment.doctor_schedule_slots?.schedule?.room_name || appointment.doctors?.room_name || "";
}

function getPortalSortPriority(statusKey) {
  if (statusKey === "in_progress") return 0;
  if (statusKey === "scheduled") return 1;
  return 2;
}

function mapDoctorAppointment(appointment) {
  const statusKey = getPortalStatusKey(appointment.status);
  const displayId = `APT-${String(appointment.id).padStart(5, "0")}`;
  const service = getServiceLabel(appointment.appointment_type);
  const roomName = getRoomName(appointment);
  const date = getAppointmentDate(appointment);
  const time = formatTime(getAppointmentTime(appointment));
  const endTime = formatTime(appointment.doctor_schedule_slots?.end_time);
  const statusView = PORTAL_STATUS_VIEW[statusKey];

  return {
    id: displayId,
    appointmentId: appointment.id,
    date,
    time,
    endTime,
    roomName,
    petName: appointment.pets?.name || "N/A",
    petImage: appointment.pets?.img_url || null,
    species: appointment.pets?.species?.name || "N/A",
    breed: appointment.pets?.breed?.name || "N/A",
    owner: appointment.pets?.customers?.full_name || "N/A",
    ownerPhone: appointment.pets?.customers?.phone || "N/A",
    service,
    serviceType: appointment.appointment_type,
    status: STATUS_VIEW[appointment.status] || STATUS_VIEW.PENDING,
    statusKey,
    statusView,
    note: appointment.note || "",
    createdAt: appointment.created_at,
    scheduleRow: {
      id: displayId,
      appointmentId: appointment.id,
      time,
      date,
      dateLabel: formatScheduleDate(date),
      patient: appointment.pets?.name || "N/A",
      species: appointment.pets?.species?.name || "N/A",
      owner: appointment.pets?.customers?.full_name || "N/A",
      service,
      statusKey,
      statusView,
    },
  };
}

function buildDoctorScheduleSummary(appointments) {
  return appointments.reduce(
    (acc, appointment) => {
      acc.total += 1;
      if (appointment.statusKey === "completed") acc.completed += 1;
      if (appointment.statusKey === "in_progress") acc.inProgress += 1;
      if (appointment.statusKey === "scheduled") acc.scheduled += 1;
      return acc;
    },
    { total: 0, completed: 0, inProgress: 0, scheduled: 0 },
  );
}

async function getDoctorRoomLabel(doctorId) {
  const { data, error } = await supabase
    .from("doctors")
    .select("room_name")
    .eq("id", doctorId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.room_name || "Phòng 1";
}

async function listDoctorAppointmentsForPortal(doctorId) {
  if (!doctorId) {
    throw new Error("Tài khoản này chưa được liên kết với hồ sơ bác sĩ");
  }

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id,
      pet_id,
      doctor_id,
      doctor_schedule_slot_id,
      appointment_type,
      status,
      note,
      requested_date,
      requested_time,
      created_at,
      doctors:doctor_id (
        room_name
      ),
      doctor_schedule_slots:doctor_schedule_slots!appointments_doctor_schedule_slot_id_fkey (
        slot_date,
        start_time,
        end_time,
        schedule:doctor_schedules!doctor_schedule_slots_doctor_schedule_id_fkey (room_name)
      ),
      pets:pet_id (
        id,
        name,
        img_url,
        species:species_id (name),
        breed:breed_id (name),
        customers:customer_id (full_name, phone)
      )
    `)
    .eq("doctor_id", doctorId)
    .not("status", "in", "(CANCELLED,NO_SHOW)")
    .order("requested_date", { ascending: true, nullsFirst: false })
    .order("requested_time", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const formattedAppointments = (appointments || [])
    .map(mapDoctorAppointment)
    .sort((a, b) => {
      const priority = getPortalSortPriority(a.statusKey) - getPortalSortPriority(b.statusKey);
      if (priority !== 0) return priority;
      const dateA = new Date(a.date || 0).getTime() || 0;
      const dateB = new Date(b.date || 0).getTime() || 0;
      if (dateA !== dateB) return dateA - dateB;
      return String(a.time).localeCompare(String(b.time));
    });
  const roomLabel = formattedAppointments.find((appointment) => appointment.roomName)?.roomName
    || await getDoctorRoomLabel(doctorId);

  return normalizeTextDeep({
    appointments: formattedAppointments,
    summary: buildDoctorScheduleSummary(formattedAppointments),
    meta: {
      title: "Lịch khám của bác sĩ",
      dateLabel: "Tất cả lịch khám",
      roomLabel,
      activityLabel: `${roomLabel} · Đang hoạt động`,
    },
  });
}

module.exports = {
  listDoctorAppointmentsForPortal,
};


