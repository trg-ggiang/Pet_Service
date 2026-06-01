const { supabase } = require("../../lib/supabaseClient");

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
    || appointment.doctor_schedules?.work_date
    || appointment.created_at
    || "";
}

function getAppointmentTime(appointment) {
  return appointment.requested_time || appointment.doctor_schedules?.start_time || "";
}

function getRoomName(appointment) {
  return appointment.doctor_schedules?.room_name || appointment.doctors?.room_name || "";
}

function mapDoctorAppointment(appointment) {
  const statusKey = getPortalStatusKey(appointment.status);
  const displayId = `APT-${String(appointment.id).padStart(5, "0")}`;
  const service = getServiceLabel(appointment.appointment_type);
  const roomName = getRoomName(appointment);
  const date = getAppointmentDate(appointment);
  const time = formatTime(getAppointmentTime(appointment));
  const endTime = formatTime(appointment.doctor_schedules?.end_time);
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
      doctor_schedule_id,
      appointment_type,
      status,
      note,
      requested_date,
      requested_time,
      created_at,
      doctors:doctor_id (
        room_name
      ),
      doctor_schedules:doctor_schedule_id (
        work_date,
        start_time,
        end_time,
        room_name
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

  const formattedAppointments = (appointments || []).map(mapDoctorAppointment);
  const roomLabel = formattedAppointments.find((appointment) => appointment.roomName)?.roomName
    || await getDoctorRoomLabel(doctorId);

  return {
    appointments: formattedAppointments,
    summary: buildDoctorScheduleSummary(formattedAppointments),
    meta: {
      title: "Lịch khám của bác sĩ",
      dateLabel: formatLongDate(new Date()),
      roomLabel,
      activityLabel: `${roomLabel} · Đang hoạt động`,
    },
  };
}

module.exports = {
  listDoctorAppointmentsForPortal,
};
