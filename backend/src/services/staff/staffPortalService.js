const { supabase } = require("../../lib/supabaseClient");
const { sendAppointmentEventEmail } = require("../emailService");
const { getStoredSetting } = require("../settingsService");

const BOARDING_UPDATE_BUCKET = process.env.BOARDING_UPDATES_BUCKET || "boarding-updates";
const MAX_BOARDING_IMAGE_BYTES = 5 * 1024 * 1024;
const BOARDING_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
let boardingBucketReady = false;

function getLocalDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIME_ZONE || "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
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

async function ensureGroomingRecordForAppointment(appointmentId, appointmentServiceId, staffId) {
  const now = new Date().toISOString();
  const { data: existing, error: existingError } = await supabase
    .from("grooming_records")
    .select("id, staff_id, status")
    .eq("appointment_id", appointmentId)
    .eq("appointment_service_id", appointmentServiceId)
    .neq("status", "CANCELLED")
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing?.id) {
    if (!existing.staff_id || existing.status === "PENDING") {
      const { error } = await supabase
        .from("grooming_records")
        .update({
          staff_id: staffId,
          status: "IN_PROGRESS",
          started_at: now,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    }
    return existing.id;
  }

  const { data, error } = await supabase
    .from("grooming_records")
    .insert({
      appointment_id: appointmentId,
      appointment_service_id: appointmentServiceId,
      staff_id: staffId,
      status: "IN_PROGRESS",
      started_at: now,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

async function ensurePendingInvoiceForGrooming(groomingId) {
  const { data: record, error: recordError } = await supabase
    .from("grooming_records")
    .select(`
      id,
      appointment_id,
      appointment_service_id,
      appointment_services:appointment_service_id (
        id,
        service_id,
        quantity,
        unit_price,
        services:service_id (id, name, type, price)
      )
    `)
    .eq("id", groomingId)
    .single();

  if (recordError) throw new Error(recordError.message);
  if (!record?.appointment_id || !record?.appointment_service_id) {
    throw new Error("Thiếu thông tin dịch vụ grooming để tạo hóa đơn");
  }

  const appointmentService = record.appointment_services;
  const service = appointmentService?.services;
  const quantity = Math.max(1, Number(appointmentService?.quantity || 1));
  const unitPrice = moneyNumber(appointmentService?.unit_price || service?.price);
  const totalPrice = quantity * unitPrice;
  const now = new Date().toISOString();

  const existingInvoiceResult = await supabase
    .from("invoices")
    .select("id, payment_status, status")
    .eq("appointment_id", record.appointment_id)
    .maybeSingle();

  if (existingInvoiceResult.error) throw new Error(existingInvoiceResult.error.message);

  let invoice = existingInvoiceResult.data;
  if (!invoice?.id) {
    const created = await supabase
      .from("invoices")
      .insert({
        appointment_id: record.appointment_id,
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

    if (created.error) throw new Error(created.error.message);
    invoice = created.data;
  }

  const itemPayload = {
    invoice_id: invoice.id,
    service_id: appointmentService.service_id || service?.id || null,
    appointment_service_id: appointmentService.id,
    grooming_record_id: record.id,
    source_type: "GROOMING",
    description: service?.name || "Grooming",
    quantity,
    unit_price: unitPrice,
    total_price: totalPrice,
  };

  const existingItem = await supabase
    .from("invoice_items")
    .select("id")
    .eq("invoice_id", invoice.id)
    .eq("grooming_record_id", record.id)
    .maybeSingle();

  if (existingItem.error) throw new Error(existingItem.error.message);

  const itemResult = existingItem.data?.id
    ? await supabase.from("invoice_items").update(itemPayload).eq("id", existingItem.data.id)
    : await supabase.from("invoice_items").insert(itemPayload);

  if (itemResult.error) throw new Error(itemResult.error.message);

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

function getBoardingCareNote(update) {
  const tokens = new Set(["BREAKFAST", "LUNCH", "DINNER", "CLEANED", "EXERCISED", "HEALTHCHECK"]);
  return String(update?.note || "")
    .split(/\r?\n|,/)
    .map((part) => part.trim())
    .filter((part) => part && !tokens.has(part.toUpperCase()))
    .join("\n");
}

function getBoardingCreationNote(boarding) {
  return [
    boarding.special_note ? `Ghi chú: ${boarding.special_note}` : "",
    boarding.habit_note ? `Thói quen: ${boarding.habit_note}` : "",
  ].filter(Boolean).join("\n");
}

function getLatestBoardingUpdatesByDate(updates = []) {
  const latestByDate = new Map();
  [...updates]
    .sort((left, right) => {
      const dateDelta = new Date(right?.date || 0).getTime() - new Date(left?.date || 0).getTime();
      if (dateDelta !== 0) return dateDelta;
      return Number(right?.id || 0) - Number(left?.id || 0);
    })
    .forEach((update) => {
      const dateKey = String(update?.date || "").slice(0, 10);
      if (dateKey && !latestByDate.has(dateKey)) {
        latestByDate.set(dateKey, update);
      }
    });
  return Array.from(latestByDate.values());
}

function mapBoardingDailyUpdate(update) {
  return {
    id: update.id,
    date: String(update.date || "").slice(0, 10),
    status: normalizeBoardingStatus(update),
    note: getBoardingCareNote(update),
    imageUrl: update.img_url || null,
  };
}

function mapBoarding(boarding) {
  const appointment = boarding.appointments;
  const today = getLocalDateKey();
  const dailyUpdates = getLatestBoardingUpdatesByDate(boarding.boarding_daily_updates || []);
  const todayUpdate = dailyUpdates.find((update) => String(update?.date || "").slice(0, 10) === today) || null;
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
    specialNotes: getBoardingCreationNote(boarding),
    todayStatus: normalizeBoardingStatus(todayUpdate),
    todayNote: getBoardingCareNote(todayUpdate),
    todayImageUrl: todayUpdate?.img_url || null,
    dailyUpdates: dailyUpdates.map(mapBoardingDailyUpdate),
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

function moneyNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function isGroomingService(service) {
  return service?.services?.type === "GROOMING";
}

function parseBoardingImageDataUrl(value) {
  if (!value) return null;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(value));
  if (!match) {
    const error = new Error("Ảnh lưu trú không đúng định dạng");
    error.statusCode = 400;
    throw error;
  }

  const mimeType = match[1];
  const extension = BOARDING_IMAGE_TYPES.get(mimeType);
  if (!extension) {
    const error = new Error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
    error.statusCode = 400;
    throw error;
  }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BOARDING_IMAGE_BYTES) {
    const error = new Error("Ảnh lưu trú không được vượt quá 5MB");
    error.statusCode = 400;
    throw error;
  }

  return { buffer, mimeType, extension };
}

async function ensureBoardingBucket() {
  if (boardingBucketReady) return;

  const bucketResult = await supabase.storage.getBucket(BOARDING_UPDATE_BUCKET);
  if (bucketResult.error) {
    const created = await supabase.storage.createBucket(BOARDING_UPDATE_BUCKET, {
      public: true,
      fileSizeLimit: MAX_BOARDING_IMAGE_BYTES,
      allowedMimeTypes: Array.from(BOARDING_IMAGE_TYPES.keys()),
    });
    if (created.error) throw new Error(created.error.message);
  } else if (bucketResult.data && bucketResult.data.public === false) {
    await supabase.storage.updateBucket(BOARDING_UPDATE_BUCKET, { public: true });
  }

  boardingBucketReady = true;
}

async function uploadBoardingDailyImage(boardingId, imageDataUrl) {
  const image = parseBoardingImageDataUrl(imageDataUrl);
  if (!image) return null;

  await ensureBoardingBucket();

  const today = getLocalDateKey();
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `boarding-${boardingId}/${today}-${unique}.${image.extension}`;
  const uploaded = await supabase.storage
    .from(BOARDING_UPDATE_BUCKET)
    .upload(path, image.buffer, {
      contentType: image.mimeType,
      upsert: true,
    });

  if (uploaded.error) throw new Error(uploaded.error.message);

  const { data } = supabase.storage.from(BOARDING_UPDATE_BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}

function getPrimaryGroomingService(appointment) {
  return (appointment?.appointment_services || []).find(isGroomingService) || null;
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

async function autoConfirmPendingAppointments() {
  const rawHours = await getStoredSetting("auto_confirm_hours").catch(() => null);
  const hours = Number(rawHours ?? 2);
  if (!Number.isFinite(hours) || hours <= 0) return 0;

  const cutoff = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const todayVN = getLocalDateKey();

  const { data: candidates, error } = await supabase
    .from("appointments")
    .select(`
      id,
      requested_date,
      pets:pet_id (
        customers:customer_id ( user_id )
      ),
      doctor_schedule_slots:doctor_schedule_slot_id ( slot_date )
    `)
    .eq("status", "PENDING")
    .lte("created_at", cutoff);

  if (error || !candidates?.length) return 0;

  const toConfirm = candidates.filter(apt => {
    const aptDate = apt.requested_date || apt.doctor_schedule_slots?.slot_date;
    return !aptDate || aptDate >= todayVN;
  });

  if (!toConfirm.length) return 0;

  const ids = toConfirm.map(a => a.id);
  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "CONFIRMED", updated_at: new Date().toISOString() })
    .in("id", ids);

  if (updateError) return 0;

  for (const apt of toConfirm) {
    const userId = apt.pets?.customers?.user_id;
    if (userId) {
      await createUserNotification(
        userId,
        "Lịch hẹn đã được xác nhận",
        "Lịch hẹn của bạn đã được phòng khám xác nhận tự động. Vui lòng đến đúng giờ.",
      ).catch(() => {});
    }
  }

  return ids.length;
}

async function listStaffAppointments(staffId) {
  const autoConfirmedCount = await autoConfirmPendingAppointments().catch(() => 0);
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
  return { appointments: (data || []).map(mapAppointment), autoConfirmedCount };
}

async function confirmAppointment(appointmentId, staffId) {
  const effectiveStaffId = assertStaffId(staffId);
  const id = parsePositiveId(appointmentId, "ID lịch hẹn");
  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select(`
      id,
      status,
      staff_id,
      appointment_services (
        id,
        service_id,
        services:service_id (id, name, type)
      )
    `)
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
    .select(`
      id,
      status,
      staff_id,
      requested_date,
      doctor_schedule_slots:doctor_schedule_slots!appointments_doctor_schedule_slot_id_fkey ( slot_date ),
      appointment_services (
        id,
        service_id,
        services:service_id (id, name, type)
      )
    `)
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

  // Chỉ cho check-in đúng ngày hẹn (hoặc không có ngày cụ thể)
  const aptDate = appointment.requested_date || appointment.doctor_schedule_slots?.slot_date;
  const todayVN = getLocalDateKey();
  if (aptDate && aptDate !== todayVN) {
    const displayDate = new Date(aptDate + "T00:00:00").toLocaleDateString("vi-VN");
    const err = new Error(`Chỉ có thể check-in vào đúng ngày hẹn (${displayDate}). Nếu khách đến sai ngày, vui lòng hủy và đặt lại lịch.`);
    err.statusCode = 400;
    throw err;
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: "IN_PROGRESS", staff_id: effectiveStaffId, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  const groomingService = getPrimaryGroomingService(appointment);
  if (groomingService) {
    await ensureGroomingRecordForAppointment(id, groomingService.id, effectiveStaffId);
  }
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
    .select("id, staff_id, appointment_id, appointment_service_id")
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

  if (record.appointment_service_id) {
    const serviceUpdate = await supabase
      .from("appointment_services")
      .update({
        status: status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
      })
      .eq("id", record.appointment_service_id);

    if (serviceUpdate.error) throw new Error(serviceUpdate.error.message);
  }

  if (record.appointment_id) {
    const appointmentUpdate = await supabase
      .from("appointments")
      .update({
        status: status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
        staff_id: effectiveStaffId,
        updated_at: now,
      })
      .eq("id", record.appointment_id);

    if (appointmentUpdate.error) throw new Error(appointmentUpdate.error.message);
  }

  if (status === "COMPLETED") {
    await ensurePendingInvoiceForGrooming(id);
  }
}

async function completeGroomingAppointment(appointmentId, staffId) {
  const id = parsePositiveId(appointmentId, "ID lịch hẹn");
  const effectiveStaffId = assertStaffId(staffId);

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select(`
      id,
      status,
      staff_id,
      appointment_services (
        id,
        service_id,
        services:service_id (id, name, type)
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (appointmentError) throw new Error(appointmentError.message);
  if (!appointment) throw new Error("Không tìm thấy lịch hẹn");
  if (appointment.staff_id && appointment.staff_id !== effectiveStaffId) {
    const error = new Error("Bạn không có quyền hoàn thành lịch grooming này");
    error.statusCode = 403;
    throw error;
  }
  if (appointment.status !== "IN_PROGRESS") {
    const error = new Error("Chỉ có thể hoàn thành lịch grooming đang thực hiện");
    error.statusCode = 400;
    throw error;
  }

  const groomingService = getPrimaryGroomingService(appointment);
  if (!groomingService) {
    const error = new Error("Lịch hẹn này không phải dịch vụ grooming");
    error.statusCode = 400;
    throw error;
  }

  const groomingId = await ensureGroomingRecordForAppointment(id, groomingService.id, effectiveStaffId);
  await updateGroomingStatus(groomingId, "COMPLETED", effectiveStaffId);
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
        id,
        date,
        eating_status,
        health_status,
        activity_status,
        note,
        img_url
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
    .in("current_status", ["CHECKED_IN", "STAYING"])
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
  const today = getLocalDateKey();
  const note = Object.entries(normalizedStatus)
    .filter(([, done]) => done)
    .map(([field]) => field.toUpperCase())
    .join(",");

  const { data: existing, error: fetchError } = await supabase
    .from("boarding_daily_updates")
    .select("id, health_status")
    .eq("boarding_id", id)
    .eq("date", today)
    .order("id", { ascending: false })
    .limit(1)
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

async function updateBoardingDailyStatusWithPhoto(boardingId, status, staffId, input = {}) {
  const id = parsePositiveId(boardingId, "ID lưu trú");
  const effectiveStaffId = assertStaffId(staffId);
  const allowedFields = ["breakfast", "lunch", "dinner", "cleaned", "exercised", "healthCheck"];
  const normalizedStatus = Object.fromEntries(
    allowedFields.map((field) => [field, Boolean(status?.[field])]),
  );
  const hasDailyNote = Object.prototype.hasOwnProperty.call(input, "dailyNote") || Object.prototype.hasOwnProperty.call(input, "note");
  const uploadedImageUrl = await uploadBoardingDailyImage(id, input?.imageDataUrl);
  const today = getLocalDateKey();
  const statusNote = Object.entries(normalizedStatus)
    .filter(([, done]) => done)
    .map(([field]) => field.toUpperCase())
    .join(",");

  const { data: existing, error: fetchError } = await supabase
    .from("boarding_daily_updates")
    .select("id, health_status, img_url, note")
    .eq("boarding_id", id)
    .eq("date", today)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  const dailyNote = hasDailyNote
    ? String(input?.dailyNote || input?.note || "").trim()
    : getBoardingCareNote(existing);
  const note = [statusNote, dailyNote].filter(Boolean).join("\n");
  const payload = {
    boarding_id: id,
    staff_id: effectiveStaffId,
    date: today,
    eating_status: [normalizedStatus.breakfast && "BREAKFAST", normalizedStatus.lunch && "LUNCH", normalizedStatus.dinner && "DINNER"].filter(Boolean).join(","),
    activity_status: normalizedStatus.exercised ? "EXERCISED" : "",
    health_status: normalizedStatus.healthCheck ? "CHECKED" : "",
    note,
    ...(uploadedImageUrl ? { img_url: uploadedImageUrl } : {}),
  };

  const result = existing?.id
    ? await supabase.from("boarding_daily_updates").update(payload).eq("id", existing.id)
    : await supabase.from("boarding_daily_updates").insert(payload);

  if (result.error) throw new Error(result.error.message);

  const savedUpdate = {
    dailyNote,
    imageUrl: uploadedImageUrl || existing?.img_url || null,
  };

  if ((normalizedStatus.healthCheck && existing?.health_status !== "CHECKED") || uploadedImageUrl || dailyNote) {
    try {
    const { data: boarding } = await supabase
      .from("boarding")
      .select(`
        appointment_id,
        appointments:appointment_id (
          pets:pet_id (
            name,
            customers:customer_id (user_id)
          )
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (boarding?.appointment_id) {
      await sendAppointmentEventEmail("boarding_update", boarding.appointment_id, {
        boardingStatus: dailyNote || statusNote || "Đã cập nhật tình trạng chăm sóc.",
      });
    }

    const userId = boarding?.appointments?.pets?.customers?.user_id;
    if (userId) {
      await notifyAppointmentActor(
        userId,
        "Có cập nhật lưu trú mới",
        `${boarding.appointments?.pets?.name || "Thú cưng"} vừa có cập nhật chăm sóc${uploadedImageUrl ? " kèm ảnh" : ""}.`,
      );
    }
  }
    catch (notifyError) {
      console.warn("[STAFF] Boarding update notification failed:", notifyError.message);
    }
  }
  return savedUpdate;
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

// Tạo lịch hẹn vãng lai (khách đến trực tiếp không có đặt trước)
async function createWalkInAppointment(staffId, { customerId, petId, doctorId, note }) {
  const effectiveStaffId = assertStaffId(staffId);

  if (!customerId) throw Object.assign(new Error("Thiếu thông tin khách hàng"), { statusCode: 400 });
  if (!petId)      throw Object.assign(new Error("Thiếu thông tin thú cưng"),   { statusCode: 400 });
  if (!doctorId)   throw Object.assign(new Error("Thiếu thông tin bác sĩ"),    { statusCode: 400 });

  // Verify pet belongs to customer
  const { data: pet, error: petErr } = await supabase
    .from("pets")
    .select("id, name, customer_id")
    .eq("id", petId)
    .eq("customer_id", customerId)
    .maybeSingle();
  if (petErr || !pet) throw Object.assign(new Error("Thú cưng không thuộc khách hàng này"), { statusCode: 400 });

  // Verify doctor exists
  const { data: doctor, error: doctorErr } = await supabase
    .from("doctors")
    .select("id, full_name, user_id")
    .eq("id", doctorId)
    .maybeSingle();
  if (doctorErr || !doctor) throw Object.assign(new Error("Bác sĩ không tồn tại"), { statusCode: 400 });

  const todayVN = getLocalDateKey();
  const nowISO = new Date().toISOString();
  // requested_time = current time in HH:MM
  const nowVNTime = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });

  const { data: apt, error: insertErr } = await supabase
    .from("appointments")
    .insert({
      pet_id: petId,
      doctor_id: doctorId,
      staff_id: effectiveStaffId,
      appointment_type: "MEDICAL",
      status: "CONFIRMED",
      requested_date: todayVN,
      requested_time: nowVNTime,
      note: note || null,
      created_at: nowISO,
      updated_at: nowISO,
    })
    .select("id, status, requested_date, requested_time, pet_id, doctor_id")
    .single();

  if (insertErr) throw new Error(insertErr.message);
  return { appointmentId: apt.id, petName: pet.name, doctorName: doctor.full_name };
}

module.exports = {
  getStaffProfile,
  listStaffAppointments,
  autoConfirmPendingAppointments,
  confirmAppointment,
  checkInAppointment,
  approveAppointmentRequest,
  listGroomingTasks,
  updateGroomingStatus,
  completeGroomingAppointment,
  listBoardingGuests,
  updateBoardingDailyStatus: updateBoardingDailyStatusWithPhoto,
  listPayments,
  markPaymentPaid,
  getStaffPortalSummary,
  createWalkInAppointment,
};
