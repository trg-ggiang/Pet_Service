const { supabase } = require("../../lib/supabaseClient");
const { sendAppointmentEventEmail } = require("../emailService");
const {
  ensureDoctorScheduleSlot,
  setDoctorScheduleSlotStatus,
} = require("../doctorScheduleService");


const REQUEST_PREFIX = "[CUSTOMER_REQUEST]";

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

async function releaseDoctorScheduleSlot(scheduleId) {
  await setDoctorScheduleSlotStatus(scheduleId, "AVAILABLE");
}

async function createUserNotification(userId, title, content) {
  if (!userId) return;
  const { error } = await supabase.from("notifications").insert({ user_id: userId, title, content, type: "APPOINTMENT", is_read: false });
  if (error) throw new Error(error.message);
}

async function notifyAppointmentActor(userId, title, content) {
  try {
    await createUserNotification(userId, title, content);
  } catch (error) {
    console.warn("[STAFF] Failed to create appointment notification:", error.message);
  }
}

async function getDoctorUserId(doctorId) {
  if (!doctorId) return null;
  const { data, error } = await supabase
    .from("doctors")
    .select("user_id")
    .eq("id", doctorId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.user_id || null;
}
const SERVICE_LABELS = {
  MEDICAL: "Khám bệnh",
  GROOMING: "Grooming",
  BOARDING: "Lưu trú",
  VACCINE: "Tiêm phòng",
  FOOD: "Thức ăn",
  OTHER: "Khác",
  MIXED: "Khám & dịch vụ",
};

const APPOINTMENT_STATUS_MAP = {
  PENDING: "scheduled",
  CONFIRMED: "confirmed",
  CHECKED_IN: "in_progress",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "completed",
  NO_SHOW: "completed",
};

const GROOMING_STATUS_MAP = {
  PENDING: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "completed",
};

const PAYMENT_STATUS_MAP = {
  UNPAID: "pending",
  PAID: "paid",
  REFUNDED: "paid",
};

function assertStaffId(staffId) {
  const effectiveStaffId = Number(staffId);
  if (!Number.isFinite(effectiveStaffId)) {
    const error = new Error("Tài khoản này chưa được liên kết với hồ sơ nhân viên");
    error.statusCode = 403;
    throw error;
  }
  return effectiveStaffId;
}

function parsePositiveId(value, fieldName = "id") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error(`${fieldName} không hợp lệ`);
    error.statusCode = 400;
    throw error;
  }
  return id;
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

function formatAppointmentCode(id) {
  return `APT-${String(id).padStart(5, "0")}`;
}

function formatInvoiceCode(id) {
  return `INV-${String(id).padStart(5, "0")}`;
}

function getServiceLabel(type, fallback) {
  return fallback || SERVICE_LABELS[type] || type || "Chưa rõ";
}

function getServiceType(type) {
  if (type === "GROOMING") return "grooming";
  if (type === "BOARDING") return "boarding";
  if (type === "VACCINE") return "vaccination";
  return "exam";
}

function getAppointmentDate(appointment) {
  return appointment.requested_date || appointment.created_at || "";
}

function getAppointmentTime(appointment) {
  return appointment.requested_time || "";
}

function mapAppointment(appointment) {
  const appointmentServices = appointment.appointment_services || [];
  const primaryService = appointmentServices[0]?.services;
  const appointmentType = primaryService?.type || appointment.appointment_type;

  const noteRequest = getRequestPayload(appointment.note);
  const cancelRequest = getRequestPayload(appointment.cancel_reason);
  const pendingRequest = cancelRequest?.type === "CANCEL" ? cancelRequest : noteRequest?.type === "RESCHEDULE" ? noteRequest : null;

  return {
    id: formatAppointmentCode(appointment.id),
    appointmentId: appointment.id,
    date: formatDate(getAppointmentDate(appointment)),
    time: formatTime(getAppointmentTime(appointment)),
    petName: appointment.pets?.name || "N/A",
    species: appointment.pets?.species?.name || "N/A",
    breed: appointment.pets?.breed?.name || "N/A",
    owner: appointment.pets?.customers?.full_name || "N/A",
    phone: appointment.pets?.customers?.phone || "N/A",
    service: getServiceLabel(appointmentType, primaryService?.name),
    serviceType: getServiceType(appointmentType),
    status: APPOINTMENT_STATUS_MAP[appointment.status] || "scheduled",
    queue: `A${String(appointment.id).padStart(3, "0")}`,
    note: stripRequestPayload(appointment.note) || "",
    pendingRequest,
    createdAt: appointment.created_at,
    rawDate: appointment.requested_date ? String(appointment.requested_date).slice(0, 10) : "",
    doctorName: appointment.doctors?.full_name || null,
    roomName: appointment.doctors?.room_name || null,
    staffName: appointment.staffs?.full_name || null,
  };
}

function mapGroomingRecord(record) {
  const appointment = record.appointments;
  const appointmentService = record.appointment_services;
  const service = appointmentService?.services;

  return {
    id: record.id,
    time: formatTime(record.started_at || appointment?.requested_time || appointment?.created_at),
    petName: appointment?.pets?.name || "N/A",
    breed: appointment?.pets?.breed?.name || "N/A",
    service: getServiceLabel(service?.type || appointment?.appointment_type, service?.name),
    status: GROOMING_STATUS_MAP[record.status] || "scheduled",
    owner: appointment?.pets?.customers?.full_name || "N/A",
    notes: record.notes || appointment?.note || "",
  };
}

function normalizeBoardingStatus(update) {
  const eatingText = String(update?.eating_status || "").toUpperCase();
  const activityText = String(update?.activity_status || "").toUpperCase();
  const healthText = String(update?.health_status || "").toUpperCase();
  const noteText = String(update?.note || "").toUpperCase();

  return {
    breakfast: eatingText.includes("BREAKFAST") || noteText.includes("BREAKFAST"),
    lunch: eatingText.includes("LUNCH") || noteText.includes("LUNCH"),
    dinner: eatingText.includes("DINNER") || noteText.includes("DINNER"),
    cleaned: noteText.includes("CLEANED"),
    exercised: activityText.includes("EXERCISED") || noteText.includes("EXERCISED"),
    healthCheck: healthText.includes("CHECKED") || noteText.includes("HEALTHCHECK"),
  };
}

function mapBoarding(boarding) {
  const appointment = boarding.appointments;
  const latestUpdate = boarding.boarding_daily_updates?.[0] || null;
  const checkIn = boarding.check_in || appointment?.requested_date || appointment?.created_at;
  const checkOut = boarding.check_out || boarding.pickup_reminder_at;
  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;
  const nights = checkInDate && checkOutDate
    ? Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000))
    : 1;

  return {
    id: boarding.id,
    room: boarding.cages?.cage_number || String(boarding.cage_id),
    petName: appointment?.pets?.name || "N/A",
    species: appointment?.pets?.species?.name || "N/A",
    breed: appointment?.pets?.breed?.name || "N/A",
    owner: appointment?.pets?.customers?.full_name || "N/A",
    phone: appointment?.pets?.customers?.phone || "N/A",
    checkIn: formatDate(checkIn),
    checkOut: formatDate(checkOut),
    nights,
    foodType: boarding.feeding_instruction || "Chưa cập nhật",
    mealsPerDay: 2,
    specialNotes: boarding.special_note || boarding.habit_note || "",
    todayStatus: normalizeBoardingStatus(latestUpdate),
  };
}

function mapPayment(invoice) {
  const appointment = invoice.appointments;
  const primaryItem = invoice.invoice_items?.[0];

  return {
    id: formatInvoiceCode(invoice.id),
    invoiceId: invoice.id,
    date: formatDate(invoice.paid_at || invoice.created_at),
    petName: appointment?.pets?.name || "N/A",
    owner: appointment?.pets?.customers?.full_name || "N/A",
    service: primaryItem?.description || getServiceLabel(appointment?.appointment_type),
    amount: Number(invoice.total_amount || invoice.subtotal_amount || 0),
    status: PAYMENT_STATUS_MAP[invoice.payment_status] || "pending",
  };
}

async function getStaffProfile(staffId) {
  const effectiveStaffId = assertStaffId(staffId);
  const { data, error } = await supabase
    .from("staffs")
    .select("id, full_name, phone, address, users:user_id (email)")
    .eq("id", effectiveStaffId)
    .single();

  if (error || !data) throw new Error("Không tìm thấy hồ sơ nhân viên");

  return {
    id: data.id,
    fullName: data.full_name,
    initials: data.full_name
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
    roleLabel: "Nhân viên chăm sóc",
    email: data.users?.email || "",
    phone: data.phone || "",
    address: data.address || "",
  };
}

async function listStaffAppointments(staffId) {
  const effectiveStaffId = assertStaffId(staffId);
  const query = supabase
    .from("appointments")
    .select(`
      id,
      appointment_type,
      status,
      note,
      cancel_reason,
      requested_date,
      requested_time,
      created_at,
      appointment_services (
        id,
        services:service_id (name, type)
      ),
      pets:pet_id (
        id,
        name,
        species:species_id (name),
        breed:breed_id (name),
        customers:customer_id (full_name, phone)
      ),
      doctors:doctor_id (full_name, room_name),
      staffs:staff_id (full_name)
    `)
    .in("status", ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"])
    .order("requested_date", { ascending: true, nullsFirst: false })
    .order("requested_time", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .or(`staff_id.eq.${effectiveStaffId},staff_id.is.null`);
  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data || []).map(mapAppointment);
}

async function confirmAppointment(appointmentId, staffId) {
  const effectiveStaffId = assertStaffId(staffId);
  const id = parsePositiveId(appointmentId, "ID lịch hẹn");
  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("id, status, staff_id")
    .eq("id", id)
    .single();

  if (fetchError || !appointment) throw new Error("Không tìm thấy lịch hẹn");
  if (appointment.staff_id && appointment.staff_id !== effectiveStaffId) {
    const error = new Error("Bạn không có quyền xác nhận lịch hẹn này");
    error.statusCode = 403;
    throw error;
  }
  if (appointment.status !== "PENDING") {
    const error = new Error("Chỉ có thể xác nhận lịch hẹn đang ở trạng thái chờ xác nhận");
    error.statusCode = 400;
    throw error;
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: "CONFIRMED", staff_id: effectiveStaffId, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

async function checkInAppointment(appointmentId, staffId) {
  const effectiveStaffId = assertStaffId(staffId);
  const id = parsePositiveId(appointmentId, "ID lịch hẹn");
  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("id, status, staff_id")
    .eq("id", id)
    .single();

  if (fetchError || !appointment) throw new Error("Không tìm thấy lịch hẹn");
  if (appointment.staff_id && appointment.staff_id !== effectiveStaffId) {
    const error = new Error("Bạn không có quyền check-in lịch hẹn này");
    error.statusCode = 403;
    throw error;
  }
  if (appointment.status !== "CONFIRMED") {
    const error = new Error("Chỉ có thể check-in lịch hẹn đã được xác nhận");
    error.statusCode = 400;
    throw error;
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: "IN_PROGRESS", staff_id: effectiveStaffId, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

async function approveAppointmentRequest(appointmentId, staffId) {
  const effectiveStaffId = assertStaffId(staffId);
  const id = parsePositiveId(appointmentId, "ID lịch hẹn");
  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select(`
      id,
      pet_id,
      doctor_id,
      staff_id,
      status,
      note,
      cancel_reason,
      requested_date,
      requested_time,
      doctor_schedule_slot_id,
      pets:pet_id (
        name,
        customers:customer_id (user_id, full_name)
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!appointment) throw new Error("Không tìm thấy lịch hẹn");

  const request = getRequestPayload(appointment.cancel_reason) || getRequestPayload(appointment.note);
  if (!request) {
    const error = new Error("Lịch hẹn không có yêu cầu chờ duyệt");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const code = `APT-${String(id).padStart(6, "0")}`;
  const doctorUserId = await getDoctorUserId(appointment.doctor_id);

  if (request.type === "RESCHEDULE") {
    const cleanNote = stripRequestPayload(appointment.note);
    let newSchedule = null;

    if (appointment.doctor_id) {
      const busy = await supabase
        .from("appointments")
        .select("id")
        .eq("doctor_id", appointment.doctor_id)
        .eq("requested_date", request.date)
        .eq("requested_time", request.time)
        .neq("id", appointment.id)
        .not("status", "in", "(CANCELLED,NO_SHOW)")
        .limit(1);
      if (busy.error) throw new Error(busy.error.message);
      if ((busy.data || []).length > 0) throw new Error("Bác sĩ đã có lịch hẹn trong khung giờ mới.");

      newSchedule = await ensureDoctorScheduleSlot(appointment.doctor_id, request.date, request.time, { slotDuration: 30 });
      if (!newSchedule) throw new Error("Bác sĩ không có ca làm việc trống trong khung giờ mới.");

      const reserved = await supabase
        .from("doctor_schedule_slots")
        .update({ status: "BOOKED", updated_at: now })
        .eq("id", newSchedule.id)
        .eq("status", "AVAILABLE")
        .select("id")
        .maybeSingle();
      if (reserved.error) throw new Error(reserved.error.message);
      if (!reserved.data) throw new Error("Ca khám mới vừa được đặt. Vui lòng chọn khung giờ khác.");
    }

    const updated = await supabase
      .from("appointments")
      .update({
        requested_date: request.date,
        requested_time: request.time,
        doctor_schedule_slot_id: newSchedule?.id ?? null,
        note: cleanNote,
        staff_id: appointment.staff_id || effectiveStaffId,
        updated_at: now,
      })
      .eq("id", id);

    if (updated.error) {
      if (newSchedule?.id) await releaseDoctorScheduleSlot(newSchedule.id);
      throw new Error(updated.error.message);
    }
    if (appointment.doctor_schedule_slot_id && appointment.doctor_schedule_slot_id !== newSchedule?.id) {
      await releaseDoctorScheduleSlot(appointment.doctor_schedule_slot_id);
    }

    await notifyAppointmentActor(
      appointment.pets?.customers?.user_id,
      "Yêu cầu đổi lịch đã được duyệt",
      `Lịch hẹn ${code} đã được đổi sang ${request.date} ${String(request.time || "").slice(0, 5)}.`,
    );
    await notifyAppointmentActor(
      doctorUserId,
      "Lịch hẹn đã được đổi",
      `Staff đã duyệt yêu cầu đổi lịch ${code} sang ${request.date} ${String(request.time || "").slice(0, 5)}.`,
    );
    return;
  }

  if (request.type === "CANCEL") {
    const updated = await supabase
      .from("appointments")
      .update({
        status: "CANCELLED",
        doctor_schedule_slot_id: null,
        cancel_reason: request.reason || "Customer requested cancellation",
        staff_id: appointment.staff_id || effectiveStaffId,
        updated_at: now,
      })
      .eq("id", id);

    if (updated.error) throw new Error(updated.error.message);
    await releaseDoctorScheduleSlot(appointment.doctor_schedule_slot_id);

    await notifyAppointmentActor(
      appointment.pets?.customers?.user_id,
      "Yêu cầu hủy lịch đã được duyệt",
      `Lịch hẹn ${code} đã được hủy.`,
    );
    await notifyAppointmentActor(
      doctorUserId,
      "Lịch hẹn đã được hủy",
      `Staff đã duyệt yêu cầu hủy lịch ${code}. Lý do: ${request.reason || "Không ghi rõ"}`,
    );
    return;
  }

  const error = new Error("Loại yêu cầu không hợp lệ");
  error.statusCode = 400;
  throw error;
}
async function listGroomingTasks(staffId) {
  const effectiveStaffId = assertStaffId(staffId);
  let query = supabase
    .from("grooming_records")
    .select(`
      id,
      staff_id,
      status,
      started_at,
      notes,
      appointments:appointment_id (
        id,
        appointment_type,
        note,
        requested_time,
        created_at,
        pets:pet_id (
          name,
          breed:breed_id (name),
          customers:customer_id (full_name)
        )
      ),
      appointment_services:appointment_service_id (
        id,
        services:service_id (name, type)
      )
    `)
    .neq("status", "CANCELLED")
    .order("started_at", { ascending: true, nullsFirst: false });

  query = query.or(`staff_id.eq.${effectiveStaffId},staff_id.is.null`);
  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data || []).map(mapGroomingRecord);
}

async function updateGroomingStatus(groomingId, status, staffId) {
  const id = parsePositiveId(groomingId, "ID grooming");
  const effectiveStaffId = assertStaffId(staffId);
  const allowed = new Set(["IN_PROGRESS", "COMPLETED"]);
  if (!allowed.has(status)) {
    const error = new Error("Trạng thái grooming không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const { data: record, error: recordError } = await supabase
    .from("grooming_records")
    .select("id, staff_id")
    .eq("id", id)
    .maybeSingle();
  if (recordError) throw new Error(recordError.message);
  if (!record || (record.staff_id && record.staff_id !== effectiveStaffId)) {
    const error = new Error("Bạn không có quyền cập nhật nhiệm vụ grooming này");
    error.statusCode = 403;
    throw error;
  }
  const payload = {
    status,
    staff_id: effectiveStaffId,
    ...(status === "IN_PROGRESS" ? { started_at: now } : {}),
    ...(status === "COMPLETED" ? { completed_at: now } : {}),
  };

  const { error } = await supabase
    .from("grooming_records")
    .update(payload)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

async function listBoardingGuests() {
  const { data, error } = await supabase
    .from("boarding")
    .select(`
      id,
      cage_id,
      check_in,
      check_out,
      feeding_instruction,
      habit_note,
      special_note,
      pickup_reminder_at,
      current_status,
      cages:cage_id (cage_number),
      boarding_daily_updates (
        date,
        eating_status,
        health_status,
        activity_status,
        note
      ),
      appointments:appointment_id (
        id,
        requested_date,
        created_at,
        pets:pet_id (
          name,
          species:species_id (name),
          breed:breed_id (name),
          customers:customer_id (full_name, phone)
        )
      )
    `)
    .in("current_status", ["BOOKED", "CHECKED_IN", "STAYING"])
    .order("check_in", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapBoarding);
}

async function updateBoardingDailyStatus(boardingId, status, staffId) {
  const id = parsePositiveId(boardingId, "ID lưu trú");
  const effectiveStaffId = assertStaffId(staffId);
  const allowedFields = ["breakfast", "lunch", "dinner", "cleaned", "exercised", "healthCheck"];
  const normalizedStatus = Object.fromEntries(
    allowedFields.map((field) => [field, Boolean(status?.[field])]),
  );
  const today = new Date().toISOString().slice(0, 10);
  const note = Object.entries(normalizedStatus)
    .filter(([, done]) => done)
    .map(([field]) => field.toUpperCase())
    .join(",");

  const { data: existing, error: fetchError } = await supabase
    .from("boarding_daily_updates")
    .select("id, health_status")
    .eq("boarding_id", id)
    .eq("date", today)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  const payload = {
    boarding_id: id,
    staff_id: effectiveStaffId,
    date: today,
    eating_status: [normalizedStatus.breakfast && "BREAKFAST", normalizedStatus.lunch && "LUNCH", normalizedStatus.dinner && "DINNER"].filter(Boolean).join(","),
    activity_status: normalizedStatus.exercised ? "EXERCISED" : "",
    health_status: normalizedStatus.healthCheck ? "CHECKED" : "",
    note,
  };

  const result = existing?.id
    ? await supabase.from("boarding_daily_updates").update(payload).eq("id", existing.id)
    : await supabase.from("boarding_daily_updates").insert(payload);

  if (result.error) throw new Error(result.error.message);

  if (normalizedStatus.healthCheck && existing?.health_status !== "CHECKED") {
    const { data: boarding } = await supabase
      .from("boarding")
      .select("appointment_id")
      .eq("id", id)
      .maybeSingle();
    if (boarding?.appointment_id) {
      await sendAppointmentEventEmail("boarding_update", boarding.appointment_id, {
        boardingStatus: note || "Đã cập nhật tình trạng chăm sóc.",
      });
    }
  }
}

async function listPayments() {
  const { data, error } = await supabase
    .from("invoices")
    .select(`
      id,
      subtotal_amount,
      total_amount,
      payment_status,
      paid_at,
      created_at,
      invoice_items (description),
      appointments:appointment_id (
        appointment_type,
        pets:pet_id (
          name,
          customers:customer_id (full_name)
        )
      )
    `)
    .in("status", ["DRAFT", "PENDING", "PAID"])
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapPayment);
}

async function markPaymentPaid(invoiceId, method = "CASH") {
  const id = parsePositiveId(invoiceId, "ID hóa đơn");
  const methodMap = {
    cash: "CASH",
    transfer: "BANK_TRANSFER",
    card: "VNPAY",
    CASH: "CASH",
    BANK_TRANSFER: "BANK_TRANSFER",
    VNPAY: "VNPAY",
  };

  const { data: existingInvoice, error: fetchError } = await supabase
    .from("invoices")
    .select("id, payment_status")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  if (existingInvoice.payment_status === "PAID") return;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .update({
      payment_status: "PAID",
      status: "PAID",
      payment_method: methodMap[method] || "CASH",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, appointment_id, total_amount")
    .single();

  if (error) throw new Error(error.message);
  await sendAppointmentEventEmail("payment_confirmation", invoice.appointment_id, {
    invoiceCode: `INV-${String(invoice.id).padStart(4, "0")}`,
    amount: `${Number(invoice.total_amount || 0).toLocaleString("vi-VN")} ₫`,
  });
}

async function getStaffPortalSummary(staffId) {
  const [appointments, grooming, boarding, payments] = await Promise.all([
    listStaffAppointments(staffId),
    listGroomingTasks(staffId),
    listBoardingGuests(),
    listPayments(),
  ]);
  return {
    doneGrooming: grooming.filter((task) => task.status === "completed").length,
    totalGrooming: grooming.length,
    pendingCheckIn: appointments.filter((a) => a.status === "scheduled" || a.status === "confirmed").length,
    needsFed: boarding.filter((guest) => !guest.todayStatus.breakfast || !guest.todayStatus.lunch || !guest.todayStatus.dinner).length,
    pendingPayments: payments.filter((payment) => payment.status === "pending").length,
  };
}

module.exports = {
  getStaffProfile,
  listStaffAppointments,
  confirmAppointment,
  checkInAppointment,
  approveAppointmentRequest,
  listGroomingTasks,
  updateGroomingStatus,
  listBoardingGuests,
  updateBoardingDailyStatus,
  listPayments,
  markPaymentPaid,
  getStaffPortalSummary,
};
