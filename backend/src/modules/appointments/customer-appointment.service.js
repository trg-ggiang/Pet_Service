const { supabase } = require("../../lib/supabaseClient");
const { sendAppointmentEventEmail } = require("../notifications/email.service");
const {
  ensureDoctorScheduleSlot,
  reserveDoctorScheduleSlot,
  setDoctorScheduleSlotStatus,
} = require("../doctors/doctor-schedule.service");

const SERVICE_TYPE_UI = {
  MEDICAL: "Khám bệnh",
  VACCINE: "Khám bệnh",
  GROOMING: "Grooming",
  BOARDING: "Lưu trú",
  FOOD: "Khám bệnh",
  OTHER: "Khám bệnh",
};
const CUSTOMER_BOOKING_SERVICE_TYPES = new Set(["MEDICAL", "GROOMING", "BOARDING"]);

const APPOINTMENT_TYPE_BY_UI = {
  "Khám bệnh": "MEDICAL",
  Grooming: "GROOMING",
  "Lưu trú": "BOARDING",
};

const ICON_BY_UI_TYPE = {
  "Khám bệnh": { iconKey: "medical", iconColor: "#0891B2", iconBg: "#ECFEFF" },
  Grooming: { iconKey: "grooming", iconColor: "#D97706", iconBg: "#FFFBEB" },
  "Lưu trú": { iconKey: "boarding", iconColor: "#7C3AED", iconBg: "#F5F3FF" },
};

const REQUEST_PREFIX = "[CUSTOMER_REQUEST]";
const BUSINESS_TIMEZONE = "Asia/Ho_Chi_Minh";

function buildRequestPayload(type, payload) {
  return REQUEST_PREFIX + JSON.stringify({ type, ...payload });
}

function getRequestPayload(value) {
  const text = String(value || "");
  const index = text.indexOf(REQUEST_PREFIX);
  if (index < 0) return null;
  try { return JSON.parse(text.slice(index + REQUEST_PREFIX.length)); } catch { return null; }
}

function stripRequestPayload(value) {
  const text = String(value || "");
  const index = text.indexOf(REQUEST_PREFIX);
  return (index < 0 ? text : text.slice(0, index)).trim();
}

async function createUserNotification(userId, title, content) {
  if (!userId) return;
  const { error } = await supabase.from("notifications").insert({ user_id: userId, title, content, type: "APPOINTMENT", is_read: false });
  if (error) throw new Error(error.message);
}

async function getAppointmentActors(appointmentId) {
  const { data, error } = await supabase
    .from("appointments")
    .select(`id, doctor_id, pets:pet_id (name, customers:customer_id (user_id, full_name)), doctors:doctor_id (user_id, full_name)`)
    .eq("id", appointmentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}
const ICON_KEY_BY_UI_TYPE = {
  "Khám bệnh": "medical",
  Grooming: "grooming",
  "Lưu trú": "boarding",
};

let requestedSlotColumnsAvailable = null;

function isMissingColumnError(error) {
  return error?.code === "42703" || /requested_(date|time).*does not exist/i.test(error?.message ?? "");
}

async function hasRequestedSlotColumns() {
  if (requestedSlotColumnsAvailable === true) return true;

  const result = await supabase
    .from("appointments")
    .select("requested_date, requested_time")
    .limit(1);

  if (result.error) {
    if (isMissingColumnError(result.error)) {
      requestedSlotColumnsAvailable = false;
      return false;
    }
    throw new Error(result.error.message);
  }

  requestedSlotColumnsAvailable = true;
  return true;
}

let scheduleSlotIdAvailable = null;

async function hasDoctorScheduleSlotIdColumn() {
  if (scheduleSlotIdAvailable === true) return true;

  const result = await supabase
    .from("appointments")
    .select("doctor_schedule_slot_id")
    .limit(1);

  if (result.error) {
    if (result.error.code === "42703" || /doctor_schedule_slot_id.*does not exist/i.test(result.error.message ?? "")) {
      scheduleSlotIdAvailable = false;
      return false;
    }
    throw new Error(result.error.message);
  }

  scheduleSlotIdAvailable = true;
  return true;
}

function assertCustomerId(customerId) {
  const effectiveCustomerId = Number(customerId);
  if (!Number.isFinite(effectiveCustomerId)) {
    const error = new Error("Không xác định được khách hàng");
    error.statusCode = 401;
    throw error;
  }
  return effectiveCustomerId;
}

function parseAppointmentId(value) {
  const raw = String(value ?? "").trim();
  const normalized = raw.toUpperCase().startsWith("APT-") ? raw.slice(4) : raw;
  const appointmentId = Number(normalized);

  if (!Number.isFinite(appointmentId)) {
    const error = new Error("Mã lịch hẹn không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  return appointmentId;
}

function formatAppointmentCode(id) {
  return `APT-${String(id).padStart(6, "0")}`;
}

function normalizeDate(value) {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function normalizeTime(value) {
  const text = String(value ?? "").trim();
  if (!/^\d{2}:\d{2}/.test(text)) return null;
  return `${text.slice(0, 5)}:00`;
}

function timeToMinutes(value) {
  const [hourText = "0", minuteText = "0"] = String(value || "00:00").split(":");
  return Number(hourText) * 60 + Number(minuteText);
}

function getBusinessNowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = Number(byType.hour) % 24;
  return {
    date: `${byType.year}-${byType.month}-${byType.day}`,
    minutes: hour * 60 + Number(byType.minute),
  };
}

function assertFutureAppointmentSlot(date, time) {
  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);
  if (!normalizedDate || !normalizedTime) {
    const error = new Error("Vui lòng chọn ngày và giờ hẹn");
    error.statusCode = 400;
    throw error;
  }

  const now = getBusinessNowParts();
  if (normalizedDate < now.date || (normalizedDate === now.date && timeToMinutes(normalizedTime) <= now.minutes)) {
    const error = new Error("Khung giờ đã qua. Vui lòng chọn thời gian trong tương lai.");
    error.statusCode = 400;
    throw error;
  }

  return { date: normalizedDate, time: normalizedTime };
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
}

function formatTime(value) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{2}:\d{2}/.test(text)) return text.slice(0, 5);

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function addMinutes(time, minutes) {
  const [hourText, minuteText] = String(time || "09:00").split(":");
  const date = new Date(2000, 0, 1, Number(hourText), Number(minuteText));
  date.setMinutes(date.getMinutes() + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:00`;
}

function formatShortDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function getSlotEndTime(time) {
  return addMinutes(time, 30);
}

function requiresDoctor(serviceType) {
  const text = String(serviceType ?? "").toLowerCase();
  return text.includes("kh") || text.includes("medical");
}

function requiresDoctorService(service) {
  if (service?.type) return ["MEDICAL", "VACCINE"].includes(service.type);
  return requiresDoctor(service?.serviceType);
}

function pickService(appointmentServices) {
  const first = appointmentServices[0];
  return first?.service ?? null;
}

function getUiServiceType(appointment, service) {
  if (service?.type) return SERVICE_TYPE_UI[service.type] ?? "Khám bệnh";
  if (appointment.appointment_type === "GROOMING") return "Grooming";
  if (appointment.appointment_type === "BOARDING") return "Lưu trú";
  return "Khám bệnh";
}

function getDisplayServiceName(appointment, service) {
  if (appointment.appointment_type === "BOARDING" || service?.type === "BOARDING") return "Lưu trú";
  if (service?.type === "VACCINE") return "Khám bệnh";
  return service?.name ?? SERVICE_TYPE_UI[appointment.appointment_type] ?? appointment.appointment_type ?? "Dịch vụ";
}

function mapAppointment(appointment, maps) {
  const pet = maps.petsById.get(appointment.pet_id);
  const doctor = appointment.doctor_id ? maps.doctorsById.get(appointment.doctor_id) : null;
  const staff = appointment.staff_id ? maps.staffsById.get(appointment.staff_id) : null;
  const schedule = appointment.doctor_schedule_slot_id
    ? maps.schedulesById.get(appointment.doctor_schedule_slot_id)
    : null;
  const appointmentServices = maps.servicesByAppointmentId.get(appointment.id) ?? [];
  const service = pickService(appointmentServices);
  const serviceType = getUiServiceType(appointment, service);
  const icon = ICON_BY_UI_TYPE[serviceType] ?? ICON_BY_UI_TYPE["Khám bệnh"];
  let serviceFee = appointmentServices.reduce((total, item) => {
    const quantity = Number(item.quantity ?? 1);
    const unitPrice = Number(item.unit_price ?? item.service?.price ?? 0);
    return total + (Number.isFinite(quantity) ? quantity : 1) * (Number.isFinite(unitPrice) ? unitPrice : 0);
  }, 0);

  if (appointment.appointment_type === "BOARDING") {
    const boardingInfo = maps.boardingByAppointmentId?.get(appointment.id);
    if (boardingInfo) {
      const checkIn = boardingInfo.check_in;
      const checkOut = boardingInfo.pickup_reminder_at;
      const pricePerDay = Number(boardingInfo.cages?.price_per_day || 0);
      if (checkIn && checkOut && pricePerDay > 0) {
        const msPerDay = 1000 * 60 * 60 * 24;
        const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / msPerDay));
        serviceFee = nights * pricePerDay;
      }
    }
  }
  const appointmentDate = appointment.requested_date ?? schedule?.slot_date ?? null;
  const appointmentTime = appointment.requested_time ?? schedule?.start_time ?? null;

  return {
    id: formatAppointmentCode(appointment.id),
    appointmentId: appointment.id,
    petId: appointment.pet_id,
    date: formatDate(appointmentDate),
    time: formatTime(appointmentTime),
    service: getDisplayServiceName(appointment, service),
    pet: pet?.name ?? "Thú cưng",
    doctor: doctor?.full_name ?? staff?.full_name ?? "Đang chờ phân công",
    status: appointment.status,
    serviceType,
    room: schedule?.schedule?.room_name ?? undefined,
    queue: `A${String(appointment.id).padStart(3, "0")}`,
    note: stripRequestPayload(appointment.note),
    serviceFee,
    totalCost: serviceFee,
    createdAt: appointment.created_at,
    updatedAt: appointment.updated_at,
    createdAtLabel: formatShortDateTime(appointment.created_at),
    updatedAtLabel: formatShortDateTime(appointment.updated_at),
    hasPrescription: (maps.prescriptionAppointmentIds ?? new Set()).has(appointment.id),
    prescriptions: (maps.prescriptionsByAppointmentId ?? new Map()).get(appointment.id),
    ...icon,
  };
}

async function loadAppointmentMaps(appointments) {
  const petIds = [...new Set(appointments.map((row) => row.pet_id).filter(Boolean))];
  const doctorIds = [...new Set(appointments.map((row) => row.doctor_id).filter(Boolean))];
  const staffIds = [...new Set(appointments.map((row) => row.staff_id).filter(Boolean))];
  const scheduleIds = [...new Set(appointments.map((row) => row.doctor_schedule_slot_id).filter(Boolean))];
  const appointmentIds = appointments.map((row) => row.id);
  const boardingAptIds = appointments.filter((row) => row.appointment_type === "BOARDING").map((row) => row.id);

  const [petsResult, doctorsResult, staffsResult, schedulesResult, servicesResult, medicalVisitsResult] = await Promise.all([
    petIds.length
      ? supabase.from("pets").select("id, name").in("id", petIds)
      : Promise.resolve({ data: [], error: null }),
    doctorIds.length
      ? supabase.from("doctors").select("id, full_name").in("id", doctorIds)
      : Promise.resolve({ data: [], error: null }),
    staffIds.length
      ? supabase.from("staffs").select("id, full_name").in("id", staffIds)
      : Promise.resolve({ data: [], error: null }),
    scheduleIds.length
      ? supabase.from("doctor_schedule_slots").select("id, slot_date, start_time, schedule:doctor_schedules!doctor_schedule_slots_doctor_schedule_id_fkey(room_name)").in("id", scheduleIds)
      : Promise.resolve({ data: [], error: null }),
    appointmentIds.length
      ? supabase
          .from("appointment_services")
          .select("id, appointment_id, quantity, unit_price, service:services(id, name, type, price)")
          .in("appointment_id", appointmentIds)
      : Promise.resolve({ data: [], error: null }),
    appointmentIds.length
      ? supabase
          .from("medical_visits")
          .select("appointment_id, prescriptions(id)")
          .in("appointment_id", appointmentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const result of [petsResult, doctorsResult, staffsResult, schedulesResult, servicesResult, medicalVisitsResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  // Fetch boarding pricing info (with price_per_day, fallback if column doesn't exist)
  let boardingData = [];
  if (boardingAptIds.length > 0) {
    const boardingWithPrice = await supabase
      .from("boarding")
      .select("id, appointment_id, check_in, pickup_reminder_at, cages:cage_id(cage_number, price_per_day)")
      .in("appointment_id", boardingAptIds)
      .order("id", { ascending: false });
    if (boardingWithPrice.error && /column.*does not exist|price_per_day/i.test(boardingWithPrice.error.message)) {
      const boardingBasic = await supabase
        .from("boarding")
        .select("id, appointment_id, check_in, pickup_reminder_at, cages:cage_id(cage_number)")
        .in("appointment_id", boardingAptIds)
        .order("id", { ascending: false });
      boardingData = boardingBasic.data || [];
    } else if (!boardingWithPrice.error) {
      boardingData = boardingWithPrice.data || [];
    }
  }
  const boardingByAppointmentId = new Map();
  for (const row of boardingData) {
    if (!boardingByAppointmentId.has(row.appointment_id)) {
      boardingByAppointmentId.set(row.appointment_id, row);
    }
  }

  const prescriptionAppointmentIds = new Set();
  (medicalVisitsResult.data ?? []).forEach((row) => {
    if (row.prescriptions && row.prescriptions.length > 0) {
      prescriptionAppointmentIds.add(row.appointment_id);
    }
  });

  const servicesByAppointmentId = new Map();
  (servicesResult.data ?? []).forEach((row) => {
    const current = servicesByAppointmentId.get(row.appointment_id) ?? [];
    current.push(row);
    servicesByAppointmentId.set(row.appointment_id, current);
  });

  const prescriptionIdsByVisitId = new Map();
  const allPrescriptionIds = [];
  (medicalVisitsResult.data ?? []).forEach((row) => {
    if (row.prescriptions && row.prescriptions.length > 0) {
      prescriptionIdsByVisitId.set(row.appointment_id, row.prescriptions.map((p) => p.id));
      allPrescriptionIds.push(...row.prescriptions.map((p) => p.id));
    }
  });

  const prescriptionItemsResult = allPrescriptionIds.length
    ? await supabase
        .from("prescription_items")
        .select("id, prescription_id, medicine_name, dosage, frequency, duration_days, instructions")
        .in("prescription_id", allPrescriptionIds)
    : { data: [], error: null };

  if (prescriptionItemsResult.error) throw new Error(prescriptionItemsResult.error.message);

  const prescriptionItemsByPrescriptionId = new Map();
  (prescriptionItemsResult.data ?? []).forEach((item) => {
    const current = prescriptionItemsByPrescriptionId.get(item.prescription_id) ?? [];
    current.push(item);
    prescriptionItemsByPrescriptionId.set(item.prescription_id, current);
  });

  const prescriptionsByAppointmentId = new Map();
  prescriptionIdsByVisitId.forEach((rxIds, aptId) => {
    const items = rxIds.flatMap((rxId) => prescriptionItemsByPrescriptionId.get(rxId) ?? []);
    if (items.length > 0) {
      prescriptionsByAppointmentId.set(aptId, items.map((item) => ({
        medicineName: item.medicine_name,
        dosage: item.dosage,
        frequency: item.frequency,
        durationDays: item.duration_days,
        instructions: item.instructions,
      })));
    }
  });

  return {
    petsById: new Map((petsResult.data ?? []).map((row) => [row.id, row])),
    doctorsById: new Map((doctorsResult.data ?? []).map((row) => [row.id, row])),
    staffsById: new Map((staffsResult.data ?? []).map((row) => [row.id, row])),
    schedulesById: new Map((schedulesResult.data ?? []).map((row) => [row.id, row])),
    servicesByAppointmentId,
    prescriptionAppointmentIds,
    prescriptionsByAppointmentId,
    boardingByAppointmentId,
  };
}

async function listCustomerAppointments(customerId) {
  const effectiveCustomerId = assertCustomerId(customerId);

  const { data: pets, error: petsError } = await supabase
    .from("pets")
    .select("id")
    .eq("customer_id", effectiveCustomerId);

  if (petsError) throw new Error(petsError.message);

  const petIds = (pets ?? []).map((pet) => pet.id);
  if (petIds.length === 0) return [];

  const [hasRequestedSlots, hasSlotId] = await Promise.all([
    hasRequestedSlotColumns(),
    hasDoctorScheduleSlotIdColumn(),
  ]);
  const appointmentSelect = [
    "id, pet_id, doctor_id, staff_id",
    hasSlotId ? "doctor_schedule_slot_id" : null,
    "appointment_type, status, note, cancel_reason",
    hasRequestedSlots ? "requested_date, requested_time" : null,
    "created_at, updated_at",
  ].filter(Boolean).join(", ");

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(appointmentSelect)
    .in("pet_id", petIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const maps = await loadAppointmentMaps(appointments ?? []);
  return (appointments ?? []).map((appointment) => mapAppointment(appointment, maps));
}

function appointmentStatusGroup(status) {
  if (["PENDING", "CONFIRMED"].includes(status)) return "upcoming";
  if (["CHECKED_IN", "IN_PROGRESS"].includes(status)) return "in_progress";
  if (status === "COMPLETED") return "completed";
  if (["CANCELLED", "NO_SHOW"].includes(status)) return "cancelled";
  return "all";
}

function filterCustomerAppointments(appointments, filters = {}) {
  const status = String(filters.status || "all");
  const pet = String(filters.pet || "all");
  const serviceType = String(filters.serviceType || "all");

  return appointments.filter((appointment) => {
    const statusMatched = status === "all" || appointmentStatusGroup(appointment.status) === status;
    const petMatched = pet === "all" || appointment.pet === pet;
    const serviceMatched = serviceType === "all" || appointment.serviceType === serviceType;
    return statusMatched && petMatched && serviceMatched;
  });
}

function buildCustomerAppointmentSummary(allAppointments, filteredAppointments) {
  const statuses = ["all", "upcoming", "in_progress", "completed", "cancelled"];
  const statusCounts = statuses.map((status) => ({
    status,
    count: status === "all"
      ? allAppointments.length
      : allAppointments.filter((appointment) => appointmentStatusGroup(appointment.status) === status).length,
  }));

  return {
    total: allAppointments.length,
    filtered: filteredAppointments.length,
    statusCounts,
    petOptions: Array.from(new Set(allAppointments.map((appointment) => appointment.pet).filter(Boolean))).sort(),
    serviceTypeOptions: Array.from(new Set(allAppointments.map((appointment) => appointment.serviceType).filter(Boolean))).sort(),
  };
}

async function listCustomerAppointmentsView(customerId, filters = {}) {
  const allAppointments = await listCustomerAppointments(customerId);
  const filteredAppointments = filterCustomerAppointments(allAppointments, filters);
  const pageSize = Math.max(1, Math.min(50, Number(filters.pageSize || 5)));
  const pageCount = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
  const requestedPage = Number(filters.page || 1);
  const page = Math.min(Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1), pageCount);
  const start = (page - 1) * pageSize;
  const appointments = filteredAppointments.slice(start, start + pageSize);

  return {
    appointments,
    summary: buildCustomerAppointmentSummary(allAppointments, filteredAppointments),
    pagination: {
      page,
      pageSize,
      pageCount,
      total: filteredAppointments.length,
      from: filteredAppointments.length ? start + 1 : 0,
      to: Math.min(start + pageSize, filteredAppointments.length),
    },
  };
}

async function listCustomerAppointmentOptions(customerId) {
  assertCustomerId(customerId);

  const servicesResult = await supabase
    .from("services")
    .select("id, name, type")
    .eq("is_active", true)
    .is("specialist_room_type", null)
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (servicesResult.error) throw new Error(servicesResult.error.message);

  return {
    services: (servicesResult.data ?? []).filter((service) => CUSTOMER_BOOKING_SERVICE_TYPES.has(service.type)).map((service) => {
      const serviceType = SERVICE_TYPE_UI[service.type] ?? "Khám bệnh";
      const icon = ICON_BY_UI_TYPE[serviceType] ?? ICON_BY_UI_TYPE["Khám bệnh"];
      return {
        id: service.id,
        name: service.name,
        serviceType,
        iconKey: ICON_KEY_BY_UI_TYPE[serviceType] ?? "medical",
        iconColor: icon.iconColor,
        iconBg: icon.iconBg,
      };
    }),
  };
}

async function assertOwnedPet(petId, customerId) {
  const { data, error } = await supabase
    .from("pets")
    .select("id, customer_id")
    .eq("id", petId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    const notFound = new Error("Không tìm thấy thú cưng");
    notFound.statusCode = 404;
    throw notFound;
  }

  return data;
}

async function resolveService(serviceName, serviceType) {
  const name = String(serviceName ?? "").trim();
  if (!name) return null;

  const query = supabase
    .from("services")
    .select("id, name, type, price")
    .ilike("name", name)
    .limit(1);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  if (data?.[0]) return data[0];

  return null;
}

async function resolveServiceById(serviceId) {
  const id = Number(serviceId);
  if (!Number.isFinite(id)) return null;

  const { data, error } = await supabase
    .from("services")
    .select("id, name, type, price")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

async function findDoctorAssignment(date, time, { doctorId = null, excludeAppointmentId = null } = {}) {
  const { date: normalizedDate, time: normalizedTime } = assertFutureAppointmentSlot(date, time);

  const selectedDoctorId = Number(doctorId);
  if (!Number.isFinite(selectedDoctorId)) {
    const error = new Error("Vui lòng chọn bác sĩ phụ trách");
    error.statusCode = 400;
    throw error;
  }

  const schedule = await ensureDoctorScheduleSlot(selectedDoctorId, normalizedDate, normalizedTime);

  if (!schedule) {
    const error = new Error("Bác sĩ không có ca làm việc trống trong khung giờ này.");
    error.statusCode = 409;
    throw error;
  }

  return {
    role: "doctor",
    id: schedule.doctor_id,
    name: schedule.doctor?.full_name ?? "Bác sĩ",
    scheduleId: schedule.id,
    room: schedule.schedule?.room_name ?? undefined,
  };
}

async function findStaffAssignment(date, time, { staffId = null, excludeAppointmentId = null } = {}) {
  const { date: normalizedDate, time: normalizedTime } = assertFutureAppointmentSlot(date, time);

  const selectedStaffId = Number(staffId);
  if (!Number.isFinite(selectedStaffId)) {
    const error = new Error("Vui lòng chọn nhân viên phụ trách");
    error.statusCode = 400;
    throw error;
  }

  let staffQuery = supabase
    .from("staffs")
    .select("id, full_name")
    .eq("id", selectedStaffId)
    .limit(1);

  const staffResult = await staffQuery.maybeSingle();
  if (staffResult.error) throw new Error(staffResult.error.message);
  if (!staffResult.data) {
    const error = new Error("Không tìm thấy nhân viên.");
    error.statusCode = 409;
    throw error;
  }

  if (await hasRequestedSlotColumns()) {
    let busyAppointmentsQuery = supabase
      .from("appointments")
      .select("id")
      .eq("staff_id", selectedStaffId)
      .eq("requested_date", normalizedDate)
      .eq("requested_time", normalizedTime)
      .not("status", "in", "(CANCELLED,NO_SHOW)");

    if (excludeAppointmentId) {
      busyAppointmentsQuery = busyAppointmentsQuery.neq("id", excludeAppointmentId);
    }

    const busyAppointments = await busyAppointmentsQuery.limit(1);
    if (busyAppointments.error) throw new Error(busyAppointments.error.message);
    if ((busyAppointments.data ?? []).length > 0) {
      const error = new Error("Nhân viên đã có lịch hẹn trong khung giờ này.");
      error.statusCode = 409;
      throw error;
    }
  }

  return {
    role: "staff",
    id: staffResult.data.id,
    name: staffResult.data.full_name,
  };
}

async function listDoctorProviderOptions(date, time, serviceType) {
  const { date: normalizedDate, time: normalizedTime } = assertFutureAppointmentSlot(date, time);

  const [schedulesResult, doctorsResult] = await Promise.all([
    supabase
      .from("doctor_schedule_slots")
      .select("id, doctor_id, start_time, end_time, schedule:doctor_schedules!doctor_schedule_slots_doctor_schedule_id_fkey(room_name), doctor:doctors(id, full_name, specialization, degree, experience_years, room_name)")
      .eq("slot_date", normalizedDate)
      .eq("start_time", normalizedTime)
      .eq("status", "AVAILABLE")
      .order("start_time", { ascending: true }),
    supabase
      .from("doctors")
      .select("id, full_name, specialization, degree, experience_years, room_name")
      .order("id", { ascending: true }),
  ]);

  if (schedulesResult.error) throw new Error(schedulesResult.error.message);
  if (doctorsResult.error) throw new Error(doctorsResult.error.message);
  const doctorsById = new Map((doctorsResult.data ?? []).map((doctor) => [doctor.id, doctor]));
  const seenDoctorIds = new Set();
  return (schedulesResult.data ?? []).filter((schedule) => {
    if (!schedule.doctor_id || seenDoctorIds.has(schedule.doctor_id)) {
      return false;
    }
    seenDoctorIds.add(schedule.doctor_id);
    return true;
  }).map((schedule) => {
    const doctor = schedule.doctor ?? doctorsById.get(schedule.doctor_id);
    return {
      role: "doctor",
      id: schedule.doctor_id,
      name: doctor?.full_name ?? "Bác sĩ",
      title: doctor?.degree ?? doctor?.specialization ?? null,
      description: doctor?.specialization ?? null,
      experienceYears: doctor?.experience_years ?? null,
      room: schedule.schedule?.room_name ?? doctor?.room_name ?? undefined,
      scheduleId: schedule.id,
      serviceType,
      date: normalizedDate,
      time: normalizedTime.slice(0, 5),
      status: "PENDING",
    };
  });
}

async function listStaffProviderOptions(date, time, serviceType) {
  const { date: normalizedDate, time: normalizedTime } = assertFutureAppointmentSlot(date, time);

  const staffResult = await supabase
    .from("staffs")
    .select("id, full_name, phone, address")
    .order("id", { ascending: true });
  if (staffResult.error) throw new Error(staffResult.error.message);

  return (staffResult.data ?? []).map((staff) => ({
    role: "staff",
    id: staff.id,
    name: staff.full_name,
    title: "Nhân viên dịch vụ",
    description: staff.address ?? null,
    phone: staff.phone ?? null,
    serviceType,
    date: normalizedDate,
    time: normalizedTime.slice(0, 5),
    status: "PENDING",
  }));
}

async function listCustomerAppointmentProviders(input, customerId) {
  assertCustomerId(customerId);
  const service = await resolveServiceById(input?.serviceId);
  const serviceType = service ? (SERVICE_TYPE_UI[service.type] ?? input?.serviceType) : (input?.serviceType ?? "Khám bệnh");
  return requiresDoctorService(service ?? { serviceType })
    ? listDoctorProviderOptions(input?.date, input?.time, serviceType)
    : listStaffProviderOptions(input?.date, input?.time, serviceType);
}

async function createCustomerAppointment(input, customerId) {
  const effectiveCustomerId = assertCustomerId(customerId);
  const petId = Number(input?.petId);

  if (!Number.isFinite(petId)) {
    const error = new Error("Vui lòng chọn thú cưng");
    error.statusCode = 400;
    throw error;
  }

  await assertOwnedPet(petId, effectiveCustomerId);

  const service = await resolveServiceById(input?.serviceId) ?? await resolveService(input?.serviceName, input?.serviceType);
  const serviceType = service ? (SERVICE_TYPE_UI[service.type] ?? input?.serviceType) : (input?.serviceType ?? "Khám bệnh");
  const { date: requestedDate, time: requestedTime } = assertFutureAppointmentSlot(input?.date, input?.time);

  const providerRole = input?.providerRole;
  const providerId = Number(input?.providerId);
  if (!["doctor", "staff"].includes(providerRole) || !Number.isFinite(providerId)) {
    const error = new Error("Vui lòng chọn người phụ trách");
    error.statusCode = 400;
    throw error;
  }

  const expectedRole = requiresDoctorService(service ?? { serviceType }) ? "doctor" : "staff";
  if (providerRole !== expectedRole) {
    const error = new Error("Người phụ trách không phù hợp với loại dịch vụ");
    error.statusCode = 400;
    throw error;
  }

  const assignment = providerRole === "doctor"
    ? await findDoctorAssignment(requestedDate, requestedTime, { doctorId: providerId })
    : await findStaffAssignment(requestedDate, requestedTime, { staffId: providerId });

  const hasRequestedSlots = await hasRequestedSlotColumns();
  if (!hasRequestedSlots) {
    const error = new Error("Database chưa có cột requested_date/requested_time để lưu ngày giờ hẹn.");
    error.statusCode = 500;
    throw error;
  }

  const insertPayload = {
    pet_id: petId,
    doctor_id: assignment.role === "doctor" ? assignment.id : null,
    staff_id: assignment.role === "staff" ? assignment.id : null,
    doctor_schedule_slot_id: assignment.scheduleId ?? null,
    appointment_type: APPOINTMENT_TYPE_BY_UI[serviceType] ?? "MEDICAL",
    status: "PENDING",
    note: input?.note?.trim() || null,
    updated_at: new Date().toISOString(),
    requested_date: requestedDate,
    requested_time: requestedTime,
  };

  // Reserve one concrete 30-minute slot to avoid duplicate doctor_schedule_slot_id conflicts.
  let appointmentId = null;
  if (assignment.scheduleId) {
    if (!await reserveDoctorScheduleSlot(assignment.scheduleId)) {
      const error = new Error("Ca làm việc của bác sĩ vừa được đặt. Vui lòng chọn khung giờ khác.");
      error.statusCode = 409;
      throw error;
    }
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    // Rollback schedule if appointment insert fails
    if (assignment.scheduleId) {
      await setDoctorScheduleSlotStatus(assignment.scheduleId, "AVAILABLE");
    }
    throw new Error(error.message);
  }

  appointmentId = appointment.id;

  if (service?.id) {
    const item = await supabase.from("appointment_services").insert({
      appointment_id: appointmentId,
      service_id: service.id,
      quantity: 1,
      unit_price: service.price ?? 0,
      status: "PENDING",
    });

    if (item.error) {
      await supabase.from("appointments").delete().eq("id", appointmentId);
      if (assignment.scheduleId) {
        await setDoctorScheduleSlotStatus(assignment.scheduleId, "AVAILABLE");
      }
      throw new Error(item.error.message);
    }
  }

  await sendAppointmentEventEmail("appointment_confirmation", appointmentId);
  return getOneCustomerAppointment(appointmentId, effectiveCustomerId);
}

async function getOneCustomerAppointment(appointmentId, customerId) {
  const all = await listCustomerAppointments(customerId);
  return all.find((appointment) => appointment.appointmentId === appointmentId) ?? null;
}

async function confirmCustomerAppointment(appointmentCode, customerId) {
  const effectiveCustomerId = assertCustomerId(customerId);
  const appointmentId = parseAppointmentId(appointmentCode);
  const { data: appointment, error } = await supabase.from("appointments").select("id, pet_id, status, note").eq("id", appointmentId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!appointment) { const notFound = new Error("Không tìm thấy lịch hẹn"); notFound.statusCode = 404; throw notFound; }
  await assertOwnedPet(appointment.pet_id, effectiveCustomerId);
  if (appointment.status !== "PENDING") { const invalidStatus = new Error("Chỉ có thể xác nhận lịch hẹn đang chờ."); invalidStatus.statusCode = 409; throw invalidStatus; }
  const actors = await getAppointmentActors(appointment.id);
  const note = [stripRequestPayload(appointment.note), "Khách hàng đã xác nhận lịch hẹn"].filter(Boolean).join("\n");
  const updated = await supabase.from("appointments").update({ status: "CONFIRMED", note, updated_at: new Date().toISOString() }).eq("id", appointment.id);
  if (updated.error) throw new Error(updated.error.message);
  await createUserNotification(actors?.doctors?.user_id, "Khách hàng đã xác nhận lịch hẹn", `${actors?.pets?.customers?.full_name || "Khách hàng"} đã xác nhận lịch hẹn APT-${String(appointment.id).padStart(6, "0")}.`);
  return getOneCustomerAppointment(appointmentId, effectiveCustomerId);
}

async function rescheduleCustomerAppointment(appointmentCode, input, customerId) {
  const effectiveCustomerId = assertCustomerId(customerId);
  const appointmentId = parseAppointmentId(appointmentCode);
  const { date: requestedDate, time: requestedTime } = assertFutureAppointmentSlot(input?.date, input?.time);
  const reason = String(input?.reason || "").trim() || "Khách hàng yêu cầu đổi lịch";

  const hasSlotId = await hasDoctorScheduleSlotIdColumn();
  const selectFields = [
    "id, pet_id, status, note, doctor_id, staff_id",
    hasSlotId ? "doctor_schedule_slot_id" : null,
  ].filter(Boolean).join(", ");

  const { data: appointment, error } = await supabase.from("appointments").select(selectFields).eq("id", appointmentId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!appointment) { const notFound = new Error("Không tìm thấy lịch hẹn"); notFound.statusCode = 404; throw notFound; }
  await assertOwnedPet(appointment.pet_id, effectiveCustomerId);
  if (!["PENDING", "CONFIRMED"].includes(appointment.status)) { const invalidStatus = new Error("Chỉ có thể gửi yêu cầu đổi lịch hẹn đang chờ hoặc đã xác nhận."); invalidStatus.statusCode = 409; throw invalidStatus; }

  // PENDING → đổi lịch trực tiếp, không cần staff duyệt
  if (appointment.status === "PENDING") {
    let newSlotId = null;

    if (hasSlotId && appointment.doctor_id) {
      const newSlot = await ensureDoctorScheduleSlot(appointment.doctor_id, requestedDate, requestedTime);
      if (!newSlot) {
        const slotError = new Error("Bác sĩ không có ca làm việc trống trong khung giờ này. Vui lòng chọn khung giờ khác.");
        slotError.statusCode = 409;
        throw slotError;
      }
      const reserved = await reserveDoctorScheduleSlot(newSlot.id);
      if (!reserved) {
        const slotError = new Error("Ca khám vừa được đặt bởi người khác. Vui lòng chọn khung giờ khác.");
        slotError.statusCode = 409;
        throw slotError;
      }
      newSlotId = newSlot.id;
    }

    const hasRequestedSlots = await hasRequestedSlotColumns();
    const updatePayload = {
      note: [stripRequestPayload(appointment.note), reason].filter(Boolean).join("\n"),
      updated_at: new Date().toISOString(),
      ...(hasSlotId ? { doctor_schedule_slot_id: newSlotId } : {}),
      ...(hasRequestedSlots ? { requested_date: requestedDate, requested_time: requestedTime } : {}),
    };

    const updated = await supabase.from("appointments").update(updatePayload).eq("id", appointmentId);
    if (updated.error) {
      if (newSlotId) await setDoctorScheduleSlotStatus(newSlotId, "AVAILABLE");
      throw new Error(updated.error.message);
    }

    // Giải phóng slot cũ sau khi cập nhật thành công
    const oldSlotId = appointment.doctor_schedule_slot_id;
    if (hasSlotId && oldSlotId && oldSlotId !== newSlotId) {
      await setDoctorScheduleSlotStatus(oldSlotId, "AVAILABLE");
    }

    const actors = await getAppointmentActors(appointmentId);
    const customerName = actors?.pets?.customers?.full_name || "Khách hàng";
    const aptCode = `APT-${String(appointmentId).padStart(6, "0")}`;
    if (actors?.doctors?.user_id) {
      await createUserNotification(
        actors.doctors.user_id,
        "Khách hàng đã đổi lịch hẹn",
        `${customerName} đã đổi lịch hẹn ${aptCode} sang ${requestedDate} lúc ${requestedTime.slice(0, 5)}.`,
      );
    }

    return getOneCustomerAppointment(appointmentId, effectiveCustomerId);
  }

  // CONFIRMED → gửi yêu cầu cho staff duyệt
  const request = buildRequestPayload("RESCHEDULE", { date: requestedDate, time: requestedTime, reason });
  const updated = await supabase.from("appointments")
    .update({ note: [stripRequestPayload(appointment.note), request].filter(Boolean).join("\n"), updated_at: new Date().toISOString() })
    .eq("id", appointment.id);
  if (updated.error) throw new Error(updated.error.message);
  return getOneCustomerAppointment(appointmentId, effectiveCustomerId);
}

async function cancelCustomerAppointment(appointmentCode, inputOrCustomerId, maybeCustomerId) {
  const input = maybeCustomerId === undefined ? {} : (inputOrCustomerId || {});
  const customerId = maybeCustomerId === undefined ? inputOrCustomerId : maybeCustomerId;
  const effectiveCustomerId = assertCustomerId(customerId);
  const appointmentId = parseAppointmentId(appointmentCode);
  const reason = String(input?.reason || "").trim() || "Khách hàng yêu cầu hủy lịch";

  const hasSlotId = await hasDoctorScheduleSlotIdColumn();
  const selectFields = ["id, pet_id, status", hasSlotId ? "doctor_schedule_slot_id" : null].filter(Boolean).join(", ");

  const { data: appointment, error } = await supabase.from("appointments").select(selectFields).eq("id", appointmentId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!appointment) { const notFound = new Error("Không tìm thấy lịch hẹn"); notFound.statusCode = 404; throw notFound; }
  await assertOwnedPet(appointment.pet_id, effectiveCustomerId);
  if (!["PENDING", "CONFIRMED"].includes(appointment.status)) { const invalidStatus = new Error("Chỉ có thể hủy lịch hẹn đang chờ hoặc đã xác nhận."); invalidStatus.statusCode = 409; throw invalidStatus; }

  // PENDING → hủy trực tiếp, không cần staff duyệt
  if (appointment.status === "PENDING") {
    const actors = await getAppointmentActors(appointmentId);
    const updated = await supabase.from("appointments")
      .update({ status: "CANCELLED", cancel_reason: reason, updated_at: new Date().toISOString() })
      .eq("id", appointmentId);
    if (updated.error) throw new Error(updated.error.message);

    if (hasSlotId && appointment.doctor_schedule_slot_id) {
      await setDoctorScheduleSlotStatus(appointment.doctor_schedule_slot_id, "AVAILABLE");
    }

    const customerName = actors?.pets?.customers?.full_name || "Khách hàng";
    const aptCode = `APT-${String(appointmentId).padStart(6, "0")}`;
    if (actors?.doctors?.user_id) {
      await createUserNotification(
        actors.doctors.user_id,
        "Lịch hẹn đã bị hủy",
        `${customerName} đã hủy lịch hẹn ${aptCode}. Lý do: ${reason}`,
      );
    }

    return getOneCustomerAppointment(appointmentId, effectiveCustomerId);
  }

  // CONFIRMED → gửi yêu cầu cho staff duyệt
  const updated = await supabase.from("appointments")
    .update({ cancel_reason: buildRequestPayload("CANCEL", { reason }), updated_at: new Date().toISOString() })
    .eq("id", appointmentId);
  if (updated.error) throw new Error(updated.error.message);
  return getOneCustomerAppointment(appointmentId, effectiveCustomerId);
}

module.exports = {
  listCustomerAppointmentOptions,
  listCustomerAppointmentProviders,
  listCustomerAppointments,
  listCustomerAppointmentsView,
  createCustomerAppointment,
  confirmCustomerAppointment,
  rescheduleCustomerAppointment,
  cancelCustomerAppointment,
};
