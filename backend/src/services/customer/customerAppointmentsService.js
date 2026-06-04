const { supabase } = require("../../lib/supabaseClient");

const SERVICE_TYPE_UI = {
  MEDICAL: "Khám bệnh",
  VACCINE: "Tiêm phòng",
  GROOMING: "Grooming",
  BOARDING: "Lưu trú",
  FOOD: "Khám bệnh",
  OTHER: "Khám bệnh",
};

const APPOINTMENT_TYPE_BY_UI = {
  "Khám bệnh": "MEDICAL",
  "Tiêm phòng": "MEDICAL",
  Grooming: "GROOMING",
  "Lưu trú": "BOARDING",
};

const ICON_BY_UI_TYPE = {
  "Khám bệnh": { iconKey: "medical", iconColor: "#0891B2", iconBg: "#ECFEFF" },
  "Tiêm phòng": { iconKey: "vaccine", iconColor: "#059669", iconBg: "#ECFDF5" },
  Grooming: { iconKey: "grooming", iconColor: "#D97706", iconBg: "#FFFBEB" },
  "Lưu trú": { iconKey: "boarding", iconColor: "#7C3AED", iconBg: "#F5F3FF" },
};

const ICON_KEY_BY_UI_TYPE = {
  "Khám bệnh": "medical",
  "Tiêm phòng": "vaccine",
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

function assertCustomerId(customerId) {
  const effectiveCustomerId = Number(customerId);
  if (!Number.isFinite(effectiveCustomerId)) {
    const error = new Error("Missing customer id");
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
    const error = new Error("Invalid appointment id");
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
  return text.includes("kh") || text.includes("ti") || text.includes("medical") || text.includes("vaccine");
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

function mapAppointment(appointment, maps) {
  const pet = maps.petsById.get(appointment.pet_id);
  const doctor = appointment.doctor_id ? maps.doctorsById.get(appointment.doctor_id) : null;
  const staff = appointment.staff_id ? maps.staffsById.get(appointment.staff_id) : null;
  const schedule = appointment.doctor_schedule_id
    ? maps.schedulesById.get(appointment.doctor_schedule_id)
    : null;
  const appointmentServices = maps.servicesByAppointmentId.get(appointment.id) ?? [];
  const service = pickService(appointmentServices);
  const serviceType = getUiServiceType(appointment, service);
  const icon = ICON_BY_UI_TYPE[serviceType] ?? ICON_BY_UI_TYPE["Khám bệnh"];
  const serviceFee = appointmentServices.reduce((total, item) => {
    const quantity = Number(item.quantity ?? 1);
    const unitPrice = Number(item.unit_price ?? item.service?.price ?? 0);
    return total + (Number.isFinite(quantity) ? quantity : 1) * (Number.isFinite(unitPrice) ? unitPrice : 0);
  }, 0);
  const appointmentDate = appointment.requested_date ?? schedule?.work_date ?? null;
  const appointmentTime = appointment.requested_time ?? schedule?.start_time ?? null;

  return {
    id: formatAppointmentCode(appointment.id),
    appointmentId: appointment.id,
    petId: appointment.pet_id,
    date: formatDate(appointmentDate),
    time: formatTime(appointmentTime),
    service: service?.name ?? appointment.appointment_type ?? "Dịch vụ",
    pet: pet?.name ?? "Thú cưng",
    doctor: doctor?.full_name ?? staff?.full_name ?? "Đang chờ phân công",
    status: appointment.status,
    serviceType,
    room: schedule?.room_name ?? undefined,
    queue: `A${String(appointment.id).padStart(3, "0")}`,
    note: appointment.note,
    serviceFee,
    totalCost: serviceFee,
    createdAt: appointment.created_at,
    updatedAt: appointment.updated_at,
    createdAtLabel: formatShortDateTime(appointment.created_at),
    updatedAtLabel: formatShortDateTime(appointment.updated_at),
    ...icon,
  };
}

async function loadAppointmentMaps(appointments) {
  const petIds = [...new Set(appointments.map((row) => row.pet_id).filter(Boolean))];
  const doctorIds = [...new Set(appointments.map((row) => row.doctor_id).filter(Boolean))];
  const staffIds = [...new Set(appointments.map((row) => row.staff_id).filter(Boolean))];
  const scheduleIds = [...new Set(appointments.map((row) => row.doctor_schedule_id).filter(Boolean))];
  const appointmentIds = appointments.map((row) => row.id);

  const [petsResult, doctorsResult, staffsResult, schedulesResult, servicesResult] = await Promise.all([
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
      ? supabase.from("doctor_schedules").select("id, work_date, start_time, room_name").in("id", scheduleIds)
      : Promise.resolve({ data: [], error: null }),
    appointmentIds.length
      ? supabase
          .from("appointment_services")
          .select("id, appointment_id, quantity, unit_price, service:services(id, name, type, price)")
          .in("appointment_id", appointmentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const result of [petsResult, doctorsResult, staffsResult, schedulesResult, servicesResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const servicesByAppointmentId = new Map();
  (servicesResult.data ?? []).forEach((row) => {
    const current = servicesByAppointmentId.get(row.appointment_id) ?? [];
    current.push(row);
    servicesByAppointmentId.set(row.appointment_id, current);
  });

  return {
    petsById: new Map((petsResult.data ?? []).map((row) => [row.id, row])),
    doctorsById: new Map((doctorsResult.data ?? []).map((row) => [row.id, row])),
    staffsById: new Map((staffsResult.data ?? []).map((row) => [row.id, row])),
    schedulesById: new Map((schedulesResult.data ?? []).map((row) => [row.id, row])),
    servicesByAppointmentId,
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

  const hasRequestedSlots = await hasRequestedSlotColumns();
  const appointmentSelect = hasRequestedSlots
    ? "id, pet_id, doctor_id, staff_id, doctor_schedule_id, appointment_type, status, note, cancel_reason, requested_date, requested_time, created_at, updated_at"
    : "id, pet_id, doctor_id, staff_id, doctor_schedule_id, appointment_type, status, note, cancel_reason, created_at, updated_at";

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
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (servicesResult.error) throw new Error(servicesResult.error.message);

  return {
    services: (servicesResult.data ?? []).map((service) => {
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
    const notFound = new Error("Pet not found");
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

  const mappedType = serviceType === "Tiêm phòng" ? "VACCINE" : undefined;
  if (!mappedType) return null;

  const fallback = await supabase
    .from("services")
    .select("id, name, type, price")
    .eq("type", mappedType)
    .limit(1);

  if (fallback.error) throw new Error(fallback.error.message);
  return fallback.data?.[0] ?? null;
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

async function findDoctorAssignment(date, time, { doctorId = null } = {}) {
  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);
  if (!normalizedDate || !normalizedTime) {
    const error = new Error("Date and time are required");
    error.statusCode = 400;
    throw error;
  }

  const selectedDoctorId = Number(doctorId);
  if (!Number.isFinite(selectedDoctorId)) {
    const error = new Error("Doctor is required");
    error.statusCode = 400;
    throw error;
  }

  if (await hasRequestedSlotColumns()) {
    const busyAppointments = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", selectedDoctorId)
      .eq("requested_date", normalizedDate)
      .eq("requested_time", normalizedTime)
      .not("status", "in", "(CANCELLED,NO_SHOW)")
      .limit(1);

    if (busyAppointments.error) throw new Error(busyAppointments.error.message);
    if ((busyAppointments.data ?? []).length > 0) {
      const error = new Error("Bác sĩ đã có lịch hẹn trong khung giờ này.");
      error.statusCode = 409;
      throw error;
    }
  }

  const slotEndTime = getSlotEndTime(normalizedTime);
  const availableSchedule = await supabase
    .from("doctor_schedules")
    .select("id, doctor_id, room_name, doctor:doctors(id, full_name)")
    .eq("doctor_id", selectedDoctorId)
    .eq("work_date", normalizedDate)
    .lte("start_time", normalizedTime)
    .gte("end_time", slotEndTime)
    .eq("status", "AVAILABLE")
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (availableSchedule.error) throw new Error(availableSchedule.error.message);

  if (!availableSchedule.data) {
    const error = new Error("Bác sĩ không có ca làm việc trống trong khung giờ này.");
    error.statusCode = 409;
    throw error;
  }

  return {
    role: "doctor",
    id: availableSchedule.data.doctor_id,
    name: availableSchedule.data.doctor?.full_name ?? "Bác sĩ",
    scheduleId: null,
    room: availableSchedule.data.room_name ?? undefined,
  };
}

async function findStaffAssignment(date, time, { staffId = null } = {}) {
  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);
  if (!normalizedDate || !normalizedTime) {
    const error = new Error("Date and time are required");
    error.statusCode = 400;
    throw error;
  }

  const selectedStaffId = Number(staffId);
  if (!Number.isFinite(selectedStaffId)) {
    const error = new Error("Staff is required");
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

  return {
    role: "staff",
    id: staffResult.data.id,
    name: staffResult.data.full_name,
  };
}

async function listDoctorProviderOptions(date, time, serviceType) {
  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);
  if (!normalizedDate || !normalizedTime) {
    const error = new Error("Date and time are required");
    error.statusCode = 400;
    throw error;
  }

  const slotEndTime = getSlotEndTime(normalizedTime);
  const canCheckBookedSlots = await hasRequestedSlotColumns();
  const [schedulesResult, doctorsResult, appointmentsResult] = await Promise.all([
    supabase
      .from("doctor_schedules")
      .select("id, doctor_id, start_time, end_time, room_name, doctor:doctors(id, full_name, specialization, degree, experience_years, room_name)")
      .eq("work_date", normalizedDate)
      .lte("start_time", normalizedTime)
      .gte("end_time", slotEndTime)
      .eq("status", "AVAILABLE")
      .order("start_time", { ascending: true }),
    supabase
      .from("doctors")
      .select("id, full_name, specialization, degree, experience_years, room_name")
      .order("id", { ascending: true }),
    canCheckBookedSlots
      ? supabase
          .from("appointments")
          .select("doctor_id")
          .eq("requested_date", normalizedDate)
          .eq("requested_time", normalizedTime)
          .not("doctor_id", "is", null)
          .not("status", "in", "(CANCELLED,NO_SHOW)")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (schedulesResult.error) throw new Error(schedulesResult.error.message);
  if (doctorsResult.error) throw new Error(doctorsResult.error.message);
  if (appointmentsResult.error) throw new Error(appointmentsResult.error.message);

  const busyDoctorIds = new Set();
  (appointmentsResult.data ?? []).forEach((row) => {
    if (row.doctor_id) busyDoctorIds.add(row.doctor_id);
  });

  const doctorsById = new Map((doctorsResult.data ?? []).map((doctor) => [doctor.id, doctor]));
  const seenDoctorIds = new Set();
  return (schedulesResult.data ?? []).filter((schedule) => {
    if (!schedule.doctor_id || seenDoctorIds.has(schedule.doctor_id) || busyDoctorIds.has(schedule.doctor_id)) {
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
      room: schedule.room_name ?? doctor?.room_name ?? undefined,
      scheduleId: schedule.id,
      serviceType,
      date: normalizedDate,
      time: normalizedTime.slice(0, 5),
      status: "PENDING",
    };
  });
}

async function listStaffProviderOptions(date, time, serviceType) {
  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);
  if (!normalizedDate || !normalizedTime) {
    const error = new Error("Date and time are required");
    error.statusCode = 400;
    throw error;
  }

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
    const error = new Error("Pet is required");
    error.statusCode = 400;
    throw error;
  }

  await assertOwnedPet(petId, effectiveCustomerId);

  const service = await resolveServiceById(input?.serviceId) ?? await resolveService(input?.serviceName, input?.serviceType);
  const serviceType = service ? (SERVICE_TYPE_UI[service.type] ?? input?.serviceType) : (input?.serviceType ?? "Khám bệnh");
  const requestedDate = normalizeDate(input?.date);
  const requestedTime = normalizeTime(input?.time);

  if (!requestedDate || !requestedTime) {
    const error = new Error("Date and time are required");
    error.statusCode = 400;
    throw error;
  }

  const providerRole = input?.providerRole;
  const providerId = Number(input?.providerId);
  if (!["doctor", "staff"].includes(providerRole) || !Number.isFinite(providerId)) {
    const error = new Error("Provider is required");
    error.statusCode = 400;
    throw error;
  }

  const expectedRole = requiresDoctorService(service ?? { serviceType }) ? "doctor" : "staff";
  if (providerRole !== expectedRole) {
    const error = new Error("Provider role does not match service type");
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
    doctor_schedule_id: assignment.scheduleId ?? null,
    appointment_type: APPOINTMENT_TYPE_BY_UI[serviceType] ?? "MEDICAL",
    status: "PENDING",
    note: input?.note?.trim() || null,
    updated_at: new Date().toISOString(),
    requested_date: requestedDate,
    requested_time: requestedTime,
  };

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (service?.id) {
    const item = await supabase.from("appointment_services").insert({
      appointment_id: appointment.id,
      service_id: service.id,
      quantity: 1,
      unit_price: service.price ?? 0,
      status: "PENDING",
    });

    if (item.error) throw new Error(item.error.message);
  }

  return getOneCustomerAppointment(appointment.id, effectiveCustomerId);
}

async function getOneCustomerAppointment(appointmentId, customerId) {
  const all = await listCustomerAppointments(customerId);
  return all.find((appointment) => appointment.appointmentId === appointmentId) ?? null;
}

async function rescheduleCustomerAppointment(appointmentCode, input, customerId) {
  const effectiveCustomerId = assertCustomerId(customerId);
  const appointmentId = parseAppointmentId(appointmentCode);
  const requestedDate = normalizeDate(input?.date);
  const requestedTime = normalizeTime(input?.time);

  if (!requestedDate || !requestedTime) {
    const error = new Error("Date and time are required");
    error.statusCode = 400;
    throw error;
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, pet_id, doctor_id, staff_id, doctor_schedule_id, status")
    .eq("id", appointmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!appointment) {
    const notFound = new Error("Appointment not found");
    notFound.statusCode = 404;
    throw notFound;
  }

  await assertOwnedPet(appointment.pet_id, effectiveCustomerId);

  if (appointment.doctor_schedule_id) {
    const updated = await supabase
      .from("doctor_schedules")
      .update({
        work_date: requestedDate,
        start_time: requestedTime,
        end_time: addMinutes(requestedTime, 30),
        status: "BOOKED",
      })
      .eq("id", appointment.doctor_schedule_id);

    if (updated.error) throw new Error(updated.error.message);
  }

  if (!(await hasRequestedSlotColumns())) {
    const missingSlots = new Error("Database chưa có cột requested_date/requested_time để lưu ngày giờ hẹn.");
    missingSlots.statusCode = 500;
    throw missingSlots;
  }
  const updatePayload = {
    updated_at: new Date().toISOString(),
    requested_date: requestedDate,
    requested_time: requestedTime,
  };

  const updatedAppointment = await supabase
    .from("appointments")
    .update(updatePayload)
    .eq("id", appointment.id);

  if (updatedAppointment.error) throw new Error(updatedAppointment.error.message);

  return getOneCustomerAppointment(appointmentId, effectiveCustomerId);
}

async function cancelCustomerAppointment(appointmentCode, customerId) {
  const effectiveCustomerId = assertCustomerId(customerId);
  const appointmentId = parseAppointmentId(appointmentCode);

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, pet_id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!appointment) {
    const notFound = new Error("Appointment not found");
    notFound.statusCode = 404;
    throw notFound;
  }

  await assertOwnedPet(appointment.pet_id, effectiveCustomerId);

  const updated = await supabase
    .from("appointments")
    .update({
      status: "CANCELLED",
      cancel_reason: "Customer cancelled from portal",
      updated_at: new Date().toISOString(),
    })
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
  rescheduleCustomerAppointment,
  cancelCustomerAppointment,
};
