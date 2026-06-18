const { supabase } = require("../lib/supabaseClient");
const { sendAppointmentEventEmail } = require("./emailService");

// ─── Helpers ────────────────────────────────────────────────────────────────

function parsePositiveId(value, fieldName = "id") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error(`${fieldName} không hợp lệ`);
    err.statusCode = 400;
    throw err;
  }
  return id;
}

function badRequest(msg) {
  return Object.assign(new Error(msg), { statusCode: 400 });
}

function notFound(msg) {
  return Object.assign(new Error(msg), { statusCode: 404 });
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
}

// Convert date string "YYYY-MM-DD" to ISO timestamp for storage in Timestamptz columns.
// We store as noon UTC to avoid timezone edge-cases.
function dateToTimestamp(dateStr) {
  return dateStr ? `${dateStr}T12:00:00.000Z` : null;
}

// Extract YYYY-MM-DD from a timestamp or date string.
function timestampToDate(value) {
  if (!value) return null;
  const s = String(value);
  // Handles "2024-01-15", "2024-01-15T12:00:00Z", "2024-01-15 12:00:00+00"
  return s.slice(0, 10);
}

function computeNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / 86400000));
}

// ──────────────────────────────────────────────────────────────────────────────
// Cage helpers
// We always read the base columns. If price_per_day / size_type exist (after
// migration), they come back; if not, we fall back to sensible defaults in JS.
// ──────────────────────────────────────────────────────────────────────────────

const SIZE_LABELS = { SMALL: "Nhỏ", MEDIUM: "Vừa", LARGE: "Lớn", VIP: "VIP" };
const SIZE_ORDER = { SMALL: 1, MEDIUM: 2, LARGE: 3, VIP: 4 };
const DEFAULT_PRICE = 150000;
const DEFAULT_SIZE = "MEDIUM";

function cagePrice(cage) {
  return Number(cage.price_per_day ?? DEFAULT_PRICE) || DEFAULT_PRICE;
}

function cageSize(cage) {
  return cage.size_type || DEFAULT_SIZE;
}

// ─── PUBLIC: room availability ──────────────────────────────────────────────

async function listRoomsWithAvailability(checkIn, checkOut) {
  if (!checkIn || !checkOut || checkIn >= checkOut) {
    throw badRequest("Ngày check-in và check-out không hợp lệ");
  }

  // We use check_in / pickup_reminder_at to detect overlapping stays.
  // check_in stores the customer-requested start (as a timestamp).
  // pickup_reminder_at stores the customer-requested end (as a timestamp).
  const checkInTs = dateToTimestamp(checkIn);
  const checkOutTs = dateToTimestamp(checkOut);

  const [cagesResult, overlapResult] = await Promise.all([
    supabase
      .from("cages")
      .select("*")
      .order("cage_number"),
    supabase
      .from("boarding")
      .select("cage_id")
      .not("current_status", "in", "(CHECKED_OUT,CANCELLED)")
      // overlap: existing starts before our checkout AND ends after our check-in
      .lt("check_in", checkOutTs)
      .gt("pickup_reminder_at", checkInTs),
  ]);

  if (cagesResult.error) throw new Error(cagesResult.error.message);
  if (overlapResult.error) throw new Error(overlapResult.error.message);

  const occupiedIds = new Set((overlapResult.data || []).map((b) => b.cage_id));

  const rooms = (cagesResult.data || []).map((cage) => ({
    id: cage.id,
    cageNumber: cage.cage_number,
    status: cage.status,
    pricePerDay: cagePrice(cage),
    sizeType: cageSize(cage),
    sizeLabel: SIZE_LABELS[cageSize(cage)] || cageSize(cage),
    description: cage.description || "",
    note: cage.note || "",
    isAvailable:
      !occupiedIds.has(cage.id) &&
      cage.status !== "MAINTENANCE" &&
      cage.status !== "CLEANING",
  }));

  rooms.sort(
    (a, b) =>
      (SIZE_ORDER[a.sizeType] || 5) - (SIZE_ORDER[b.sizeType] || 5) ||
      a.cageNumber.localeCompare(b.cageNumber),
  );

  return rooms;
}

// ─── CUSTOMER: create booking ────────────────────────────────────────────────

async function createBoardingBooking(input, customerId) {
  const { petId, cageId, checkIn, checkOut, feedingInstruction, habitNote, specialNote } = input || {};

  if (!petId || !cageId || !checkIn || !checkOut) {
    throw badRequest("Vui lòng điền đầy đủ thông tin đặt phòng");
  }
  if (checkIn >= checkOut) throw badRequest("Ngày check-out phải sau ngày check-in");

  const today = new Date().toISOString().slice(0, 10);
  if (checkIn < today) throw badRequest("Ngày check-in không được ở trong quá khứ");

  // Validate pet belongs to customer
  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("id, name")
    .eq("id", petId)
    .eq("customer_id", customerId)
    .maybeSingle();
  if (petError) throw new Error(petError.message);
  if (!pet) throw notFound("Không tìm thấy thú cưng");

  // Validate cage
  const { data: cage, error: cageError } = await supabase
    .from("cages")
    .select("*")
    .eq("id", cageId)
    .maybeSingle();
  if (cageError) throw new Error(cageError.message);
  if (!cage) throw notFound("Không tìm thấy phòng");
  if (cage.status === "MAINTENANCE") throw badRequest("Phòng đang bảo trì, không thể đặt");

  // Overlap check using check_in / pickup_reminder_at
  const checkInTs = dateToTimestamp(checkIn);
  const checkOutTs = dateToTimestamp(checkOut);

  const { data: overlap, error: overlapError } = await supabase
    .from("boarding")
    .select("id")
    .eq("cage_id", cageId)
    .not("current_status", "in", "(CHECKED_OUT,CANCELLED)")
    .lt("check_in", checkOutTs)
    .gt("pickup_reminder_at", checkInTs)
    .limit(1);

  if (overlapError) throw new Error(overlapError.message);
  if (overlap && overlap.length > 0) {
    throw badRequest("Phòng đã được đặt trong khoảng thời gian này. Vui lòng chọn phòng khác.");
  }

  // Get boarding service for invoice linking (optional)
  const { data: boardingService } = await supabase
    .from("services")
    .select("id, price")
    .eq("type", "BOARDING")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  // Always use the cage's own price — the service record price is just a catalog default
  const pricePerDay = cagePrice(cage);
  const nights = computeNights(checkIn, checkOut);
  const now = new Date().toISOString();

  // Create appointment
  const { data: appointment, error: aptError } = await supabase
    .from("appointments")
    .insert({
      pet_id: petId,
      appointment_type: "BOARDING",
      status: "PENDING",
      requested_date: checkIn,
      requested_time: "08:00:00",
      note: `Đặt phòng ${cage.cage_number} · ${formatDate(checkIn)} – ${formatDate(checkOut)}`,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();
  if (aptError) throw new Error(aptError.message);

  // Link service
  if (boardingService?.id) {
    await supabase.from("appointment_services").insert({
      appointment_id: appointment.id,
      service_id: boardingService.id,
      quantity: nights,
      unit_price: pricePerDay,
      status: "PENDING",
    });
  }

  // Create boarding record.
  // We store requested dates in check_in (start timestamp) and pickup_reminder_at (end timestamp).
  // After staff does real check-in, check_in gets overwritten with the actual timestamp.
  const boardingPayload = {
    appointment_id: appointment.id,
    cage_id: cageId,
    check_in: checkInTs,                // requested start – overwritten at actual check-in
    pickup_reminder_at: checkOutTs,      // requested end
    feeding_instruction: feedingInstruction || "",
    habit_note: habitNote || "",
    special_note: specialNote || "",
    current_status: "BOOKED",
  };

  // Try to store new columns too if they exist (migration already run)
  const boardingPayloadWithNewCols = {
    ...boardingPayload,
    requested_check_in: checkIn,
    requested_check_out: checkOut,
  };

  let boardingData;
  const attemptNew = await supabase
    .from("boarding")
    .insert(boardingPayloadWithNewCols)
    .select("id")
    .single();

  if (attemptNew.error && /column|does not exist/i.test(attemptNew.error.message)) {
    // Columns not yet added – fall back to base payload
    const fallback = await supabase
      .from("boarding")
      .insert(boardingPayload)
      .select("id")
      .single();
    if (fallback.error) {
      await supabase.from("appointments").delete().eq("id", appointment.id);
      throw new Error(fallback.error.message);
    }
    boardingData = fallback.data;
  } else if (attemptNew.error) {
    await supabase.from("appointments").delete().eq("id", appointment.id);
    throw new Error(attemptNew.error.message);
  } else {
    boardingData = attemptNew.data;
  }

  try {
    await sendAppointmentEventEmail("boarding_booked", appointment.id, {
      roomNumber: cage.cage_number,
      checkIn: formatDate(checkIn),
      checkOut: formatDate(checkOut),
    });
  } catch { /* email failure is non-fatal */ }

  return { boardingId: boardingData.id, appointmentId: appointment.id };
}

// ─── STAFF: pending bookings ─────────────────────────────────────────────────

async function listPendingBoardings() {
  const { data, error } = await supabase
    .from("boarding")
    .select(`
      id,
      cage_id,
      check_in,
      pickup_reminder_at,
      feeding_instruction,
      habit_note,
      special_note,
      current_status,
      cages:cage_id (*),
      appointments:appointment_id (
        id,
        status,
        created_at,
        pets:pet_id (
          name,
          species:species_id (name),
          breed:breed_id (name),
          customers:customer_id (full_name, phone)
        )
      )
    `)
    .eq("current_status", "BOOKED")
    .order("check_in", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);

  return (data || [])
    .filter((b) => b.appointments?.status === "PENDING")
    .map((b) => {
      const cage = b.cages || {};
      const checkInDate = timestampToDate(b.check_in);
      const checkOutDate = timestampToDate(b.pickup_reminder_at);
      return {
        id: b.id,
        appointmentId: b.appointments?.id,
        room: cage.cage_number || String(b.cage_id),
        sizeType: cageSize(cage),
        sizeLabel: SIZE_LABELS[cageSize(cage)] || "Vừa",
        pricePerDay: cagePrice(cage),
        checkIn: formatDate(checkInDate),
        checkOut: formatDate(checkOutDate),
        rawCheckIn: checkInDate,
        rawCheckOut: checkOutDate,
        nights: computeNights(checkInDate, checkOutDate),
        petName: b.appointments?.pets?.name || "N/A",
        species: b.appointments?.pets?.species?.name || "N/A",
        breed: b.appointments?.pets?.breed?.name || "",
        owner: b.appointments?.pets?.customers?.full_name || "N/A",
        phone: b.appointments?.pets?.customers?.phone || "",
        feedingInstruction: b.feeding_instruction || "",
        specialNote: b.special_note || "",
        habitNote: b.habit_note || "",
        bookedAt: b.appointments?.created_at || "",
      };
    });
}

// ─── STAFF: approve ──────────────────────────────────────────────────────────

async function approveBoardingBooking(boardingId, staffId) {
  const id = parsePositiveId(boardingId, "ID lưu trú");

  const { data: boarding, error: fetchError } = await supabase
    .from("boarding")
    .select(`
      id, current_status,
      appointments:appointment_id (
        id, status,
        pets:pet_id (
          name,
          customers:customer_id (user_id, full_name)
        )
      ),
      cages:cage_id (cage_number)
    `)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!boarding) throw notFound("Không tìm thấy lịch lưu trú");
  if (boarding.current_status !== "BOOKED") throw badRequest("Chỉ có thể duyệt phòng đang ở trạng thái chờ duyệt");
  if (boarding.appointments?.status !== "PENDING") throw badRequest("Lịch hẹn này không ở trạng thái chờ xác nhận");

  const now = new Date().toISOString();
  const { error: aptError } = await supabase
    .from("appointments")
    .update({ status: "CONFIRMED", staff_id: staffId, updated_at: now })
    .eq("id", boarding.appointments.id);
  if (aptError) throw new Error(aptError.message);

  const userId = boarding.appointments?.pets?.customers?.user_id;
  if (userId) {
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Đặt phòng lưu trú được xác nhận",
      content: `Phòng ${boarding.cages?.cage_number} đã được xác nhận. Thú cưng ${boarding.appointments?.pets?.name} sẵn sàng check-in.`,
      type: "BOARDING",
      is_read: false,
    });
  }
}

// ─── STAFF: check-in ────────────────────────────────────────────────────────

async function checkInBoarding(boardingId, staffId) {
  const id = parsePositiveId(boardingId, "ID lưu trú");

  const { data: boarding, error: fetchError } = await supabase
    .from("boarding")
    .select("id, current_status, cage_id, appointments:appointment_id (id, status)")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!boarding) throw notFound("Không tìm thấy lịch lưu trú");
  if (!["BOOKED", "CHECKED_IN"].includes(boarding.current_status)) {
    throw badRequest("Không thể check-in ở trạng thái hiện tại");
  }

  const now = new Date().toISOString();

  await supabase.from("boarding").update({ current_status: "CHECKED_IN", check_in: now }).eq("id", id);
  await supabase.from("cages").update({ status: "OCCUPIED" }).eq("id", boarding.cage_id);

  if (boarding.appointments?.id) {
    await supabase
      .from("appointments")
      .update({ status: "IN_PROGRESS", staff_id: staffId, updated_at: now })
      .eq("id", boarding.appointments.id);
  }
}

// ─── STAFF: checkout ─────────────────────────────────────────────────────────

async function checkOutBoarding(boardingId, staffId, fees = {}) {
  const id = parsePositiveId(boardingId, "ID lưu trú");
  const { foodFeePerDay = 0, extraServiceFee = 0, paymentMethod = "CASH" } = fees;

  const { data: boarding, error: fetchError } = await supabase
    .from("boarding")
    .select(`
      id, current_status, cage_id, check_in, pickup_reminder_at,
      appointments:appointment_id (
        id, status,
        pets:pet_id (
          name,
          customers:customer_id (user_id, full_name)
        )
      ),
      cages:cage_id (*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!boarding) throw notFound("Không tìm thấy lịch lưu trú");
  if (!["CHECKED_IN", "STAYING"].includes(boarding.current_status)) {
    throw badRequest("Chỉ có thể checkout thú cưng đang lưu trú");
  }

  const now = new Date();
  const checkInTime = boarding.check_in ? new Date(boarding.check_in) : now;
  const nights = computeNights(checkInTime.toISOString().slice(0, 10), now.toISOString().slice(0, 10)) || 1;
  const pricePerDay = cagePrice(boarding.cages || {});
  const roomFee = nights * pricePerDay;
  const foodFee = Number(foodFeePerDay || 0) * nights;
  const serviceFee = Number(extraServiceFee || 0);
  const total = roomFee + foodFee + serviceFee;

  // Upsert invoice
  const aptId = boarding.appointments.id;
  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id, payment_status")
    .eq("appointment_id", aptId)
    .maybeSingle();

  const invoicePayload = {
    appointment_id: aptId,
    subtotal_amount: total,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: total,
    payment_status: "UNPAID",
    status: "PENDING",
  };

  let invoiceId;
  if (existingInvoice?.id) {
    if (existingInvoice.payment_status === "PAID") throw badRequest("Hóa đơn đã được thanh toán");
    await supabase.from("invoices").update({ ...invoicePayload, updated_at: now.toISOString() }).eq("id", existingInvoice.id);
    invoiceId = existingInvoice.id;
  } else {
    const { data: newInv, error: invErr } = await supabase
      .from("invoices")
      .insert({ ...invoicePayload, created_at: now.toISOString(), updated_at: now.toISOString() })
      .select("id")
      .single();
    if (invErr) throw new Error(invErr.message);
    invoiceId = newInv.id;
  }

  // Rebuild invoice items
  await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId).eq("source_type", "BOARDING");

  const items = [
    {
      invoice_id: invoiceId,
      boarding_id: id,
      source_type: "BOARDING",
      description: `Phí phòng ${boarding.cages?.cage_number} (${nights} đêm × ${pricePerDay.toLocaleString("vi-VN")} ₫)`,
      quantity: nights,
      unit_price: pricePerDay,
      total_price: roomFee,
    },
  ];
  if (foodFee > 0) {
    items.push({
      invoice_id: invoiceId,
      boarding_id: id,
      source_type: "EXTRA",
      description: `Phí thức ăn (${nights} ngày × ${Number(foodFeePerDay).toLocaleString("vi-VN")} ₫)`,
      quantity: nights,
      unit_price: Number(foodFeePerDay),
      total_price: foodFee,
    });
  }
  if (serviceFee > 0) {
    items.push({
      invoice_id: invoiceId,
      boarding_id: id,
      source_type: "EXTRA",
      description: "Phí dịch vụ thêm",
      quantity: 1,
      unit_price: serviceFee,
      total_price: serviceFee,
    });
  }

  if (items.length > 0) {
    const { error: itemsErr } = await supabase.from("invoice_items").insert(items);
    if (itemsErr) throw new Error(itemsErr.message);
  }

  await supabase.from("boarding").update({ current_status: "CHECKED_OUT", check_out: now.toISOString() }).eq("id", id);
  await supabase.from("cages").update({ status: "CLEANING" }).eq("id", boarding.cage_id);
  await supabase.from("appointments").update({ status: "COMPLETED", updated_at: now.toISOString() }).eq("id", aptId);

  const userId = boarding.appointments?.pets?.customers?.user_id;
  if (userId) {
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Thú cưng đã checkout",
      content: `${boarding.appointments?.pets?.name} đã hoàn thành lưu trú. Tổng phí: ${total.toLocaleString("vi-VN")} ₫`,
      type: "BOARDING",
      is_read: false,
    });
  }

  return { invoiceId, nights, roomFee, foodFee, serviceFee, total };
}

// ─── STAFF: all rooms ────────────────────────────────────────────────────────

async function listAllRoomsForStaff() {
  const { data, error } = await supabase
    .from("cages")
    .select(`
      *,
      boardings:boarding (
        id, current_status, check_in, pickup_reminder_at,
        appointments:appointment_id (
          id,
          pets:pet_id (
            name, species:species_id (name),
            customers:customer_id (full_name, phone)
          )
        )
      )
    `)
    .order("cage_number");

  if (error) throw new Error(error.message);

  return (data || []).map((cage) => {
    const activeBoardings = (cage.boardings || []).filter(
      (b) => !["CHECKED_OUT", "CANCELLED"].includes(b.current_status),
    );
    const current = activeBoardings[0] || null;
    return {
      id: cage.id,
      cageNumber: cage.cage_number,
      status: cage.status,
      pricePerDay: cagePrice(cage),
      sizeType: cageSize(cage),
      sizeLabel: SIZE_LABELS[cageSize(cage)] || "Vừa",
      description: cage.description || "",
      note: cage.note || "",
      currentBoarding: current
        ? {
            boardingId: current.id,
            boardingStatus: current.current_status,
            checkIn: formatDate(current.check_in),
            checkOut: formatDate(current.pickup_reminder_at),
            petName: current.appointments?.pets?.name || "N/A",
            species: current.appointments?.pets?.species?.name || "",
            owner: current.appointments?.pets?.customers?.full_name || "N/A",
            phone: current.appointments?.pets?.customers?.phone || "",
          }
        : null,
    };
  });
}

// ─── STAFF: confirmed boardings (approved, waiting actual check-in) ──────────

async function listConfirmedBoardings() {
  const { data, error } = await supabase
    .from("boarding")
    .select(`
      id,
      cage_id,
      check_in,
      pickup_reminder_at,
      feeding_instruction,
      habit_note,
      special_note,
      current_status,
      cages:cage_id (*),
      appointments:appointment_id (
        id,
        status,
        created_at,
        pets:pet_id (
          name,
          species:species_id (name),
          breed:breed_id (name),
          customers:customer_id (full_name, phone)
        )
      )
    `)
    .eq("current_status", "BOOKED")
    .order("check_in", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);

  return (data || [])
    .filter((b) => b.appointments?.status === "CONFIRMED")
    .map((b) => {
      const cage = b.cages || {};
      const checkInDate = timestampToDate(b.check_in);
      const checkOutDate = timestampToDate(b.pickup_reminder_at);
      return {
        id: b.id,
        appointmentId: b.appointments?.id,
        room: cage.cage_number || String(b.cage_id),
        sizeType: cageSize(cage),
        sizeLabel: SIZE_LABELS[cageSize(cage)] || "Vừa",
        pricePerDay: cagePrice(cage),
        checkIn: formatDate(checkInDate),
        checkOut: formatDate(checkOutDate),
        rawCheckIn: checkInDate,
        rawCheckOut: checkOutDate,
        nights: computeNights(checkInDate, checkOutDate),
        petName: b.appointments?.pets?.name || "N/A",
        species: b.appointments?.pets?.species?.name || "N/A",
        breed: b.appointments?.pets?.breed?.name || "",
        owner: b.appointments?.pets?.customers?.full_name || "N/A",
        phone: b.appointments?.pets?.customers?.phone || "",
        feedingInstruction: b.feeding_instruction || "",
        specialNote: b.special_note || "",
        habitNote: b.habit_note || "",
        bookedAt: b.appointments?.created_at || "",
      };
    });
}

// ─── STAFF: create cage ───────────────────────────────────────────────────────

async function createCage({ cageNumber, sizeType, pricePerDay, description, note }) {
  if (!cageNumber?.trim()) throw badRequest("Số phòng không được để trống");

  const existing = await supabase
    .from("cages")
    .select("id")
    .eq("cage_number", cageNumber.trim())
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) throw badRequest(`Phòng ${cageNumber} đã tồn tại`);

  const payload = {
    cage_number: cageNumber.trim(),
    status: "AVAILABLE",
    note: note?.trim() || null,
  };

  // Try with new columns first, fallback if not yet migrated
  const attemptNew = await supabase
    .from("cages")
    .insert({
      ...payload,
      size_type: sizeType || "MEDIUM",
      price_per_day: Number(pricePerDay) || DEFAULT_PRICE,
      description: description?.trim() || null,
    })
    .select("id, cage_number")
    .single();

  if (attemptNew.error && /column|does not exist/i.test(attemptNew.error.message)) {
    const fallback = await supabase.from("cages").insert(payload).select("id, cage_number").single();
    if (fallback.error) throw new Error(fallback.error.message);
    return fallback.data;
  } else if (attemptNew.error) {
    throw new Error(attemptNew.error.message);
  }
  return attemptNew.data;
}

// ─── STAFF: update cage ───────────────────────────────────────────────────────

async function updateCage(cageId, updates) {
  const id = parsePositiveId(cageId, "ID phòng");

  const payload = {};
  if (updates.status) payload.status = updates.status;
  if (updates.note !== undefined) payload.note = updates.note?.trim() || null;
  if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
  if (updates.sizeType) payload.size_type = updates.sizeType;
  if (updates.pricePerDay !== undefined) payload.price_per_day = Number(updates.pricePerDay) || DEFAULT_PRICE;

  const { error } = await supabase.from("cages").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── STAFF: delete cage ───────────────────────────────────────────────────────

async function deleteCage(cageId) {
  const id = parsePositiveId(cageId, "ID phòng");

  // Block deletion if any active boarding exists
  const { data: active } = await supabase
    .from("boarding")
    .select("id")
    .eq("cage_id", id)
    .not("current_status", "in", "(CHECKED_OUT,CANCELLED)")
    .limit(1);

  if (active && active.length > 0) {
    throw badRequest("Không thể xóa phòng đang có thú cưng lưu trú");
  }

  const { error } = await supabase.from("cages").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── CUSTOMER: get own boardings with daily updates ──────────────────────────

async function getCustomerBoardings(customerId) {
  const custId = parsePositiveId(customerId, "ID khách hàng");

  const { data: pets, error: petsErr } = await supabase
    .from("pets")
    .select("id")
    .eq("customer_id", custId);
  if (petsErr) throw new Error(petsErr.message);
  if (!pets?.length) return [];

  const petIds = pets.map((p) => p.id);

  const { data: apts, error: aptsErr } = await supabase
    .from("appointments")
    .select("id")
    .in("pet_id", petIds)
    .eq("appointment_type", "BOARDING");
  if (aptsErr) throw new Error(aptsErr.message);
  if (!apts?.length) return [];

  const aptIds = apts.map((a) => a.id);

  const { data, error } = await supabase
    .from("boarding")
    .select(`
      id,
      current_status,
      check_in,
      check_out,
      pickup_reminder_at,
      feeding_instruction,
      habit_note,
      special_note,
      cages:cage_id (cage_number, size_type, price_per_day),
      appointments:appointment_id (
        id,
        pets:pet_id (
          id, name,
          species:species_id (name),
          breed:breed_id (name)
        )
      ),
      boarding_daily_updates (
        id, date, eating_status, health_status, activity_status, note, img_url,
        staffs:staff_id (full_name)
      )
    `)
    .in("appointment_id", aptIds)
    .not("current_status", "in", "(CANCELLED)")
    .order("check_in", { ascending: false });
  if (error) throw new Error(error.message);

  return (data || []).map((b) => {
    const checkIn = timestampToDate(b.check_in);
    const checkOut = timestampToDate(b.check_out || b.pickup_reminder_at);
    const updates = (b.boarding_daily_updates || [])
      .slice()
      .sort((a, z) => String(z.date).localeCompare(String(a.date)));
    return {
      id: b.id,
      status: b.current_status,
      petName: b.appointments?.pets?.name || "",
      petId: b.appointments?.pets?.id,
      species: b.appointments?.pets?.species?.name || "",
      breed: b.appointments?.pets?.breed?.name || "",
      roomNumber: b.cages?.cage_number || "",
      roomSize: b.cages?.size_type || "MEDIUM",
      pricePerDay: Number(b.cages?.price_per_day || 0),
      checkIn,
      checkOut,
      feedingInstruction: b.feeding_instruction || "",
      habitNote: b.habit_note || "",
      specialNote: b.special_note || "",
      dailyUpdates: updates.map((u) => ({
        id: u.id,
        date: String(u.date || "").slice(0, 10),
        eatingStatus: u.eating_status || "",
        healthStatus: u.health_status || "",
        activityStatus: u.activity_status || "",
        note: u.note || "",
        imageUrl: u.img_url || null,
        staffName: u.staffs?.full_name || null,
      })),
    };
  });
}

// ─── CUSTOMER: update care notes during stay ─────────────────────────────────

async function updateBoardingCareByCustomer(boardingId, customerId, care) {
  const id = parsePositiveId(boardingId, "ID lưu trú");
  const custId = parsePositiveId(customerId, "ID khách hàng");

  const { data: boarding, error: fetchErr } = await supabase
    .from("boarding")
    .select(`
      id, current_status,
      cages:cage_id (cage_number),
      appointments:appointment_id (
        pets:pet_id (
          name,
          customers:customer_id (id)
        )
      )
    `)
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!boarding) throw notFound("Không tìm thấy lịch lưu trú");

  const petOwnerId = boarding.appointments?.pets?.customers?.id;
  if (String(petOwnerId) !== String(custId)) {
    throw Object.assign(new Error("Bạn không có quyền cập nhật lịch lưu trú này"), { statusCode: 403 });
  }
  if (["CHECKED_OUT", "CANCELLED"].includes(boarding.current_status)) {
    throw badRequest("Không thể cập nhật thông tin sau khi đã kết thúc lưu trú");
  }

  const updates = {};
  if (care.feedingInstruction !== undefined) updates.feeding_instruction = String(care.feedingInstruction || "");
  if (care.habitNote !== undefined) updates.habit_note = String(care.habitNote || "");
  if (care.specialNote !== undefined) updates.special_note = String(care.specialNote || "");
  if (!Object.keys(updates).length) return;

  const { error: updateErr } = await supabase.from("boarding").update(updates).eq("id", id);
  if (updateErr) throw new Error(updateErr.message);

  // Notify all staff about the update
  const petName = boarding.appointments?.pets?.name || "Thú cưng";
  const roomNum = boarding.cages?.cage_number || "";
  const { data: staffList } = await supabase.from("staffs").select("user_id");
  for (const s of staffList || []) {
    await supabase.from("notifications").insert({
      user_id: s.user_id,
      title: "Cập nhật hướng dẫn chăm sóc",
      content: `Chủ nuôi của ${petName} (Phòng ${roomNum}) vừa cập nhật hướng dẫn chăm sóc.`,
      type: "BOARDING",
      is_read: false,
    });
  }
}

// ─── CUSTOMER: extend boarding stay ──────────────────────────────────────────

async function extendBoardingStay(boardingId, customerId, { newCheckOut }) {
  const id = parsePositiveId(boardingId, "ID lưu trú");
  const custId = parsePositiveId(customerId, "ID khách hàng");

  if (!newCheckOut) throw badRequest("Vui lòng chọn ngày gia hạn");

  const { data: boarding, error: fetchErr } = await supabase
    .from("boarding")
    .select(`
      id, current_status, cage_id, pickup_reminder_at,
      cages:cage_id (cage_number, price_per_day, size_type),
      appointments:appointment_id (
        pets:pet_id (
          name,
          customers:customer_id (id)
        )
      )
    `)
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!boarding) throw notFound("Không tìm thấy lịch lưu trú");

  const petOwnerId = boarding.appointments?.pets?.customers?.id;
  if (String(petOwnerId) !== String(custId)) {
    throw Object.assign(new Error("Bạn không có quyền gia hạn lịch lưu trú này"), { statusCode: 403 });
  }
  if (!["CHECKED_IN", "STAYING"].includes(boarding.current_status)) {
    throw badRequest("Chỉ có thể gia hạn khi thú cưng đang lưu trú");
  }

  const currentCheckOut = timestampToDate(boarding.pickup_reminder_at);
  if (!newCheckOut || newCheckOut <= currentCheckOut) {
    throw badRequest(`Ngày gia hạn phải sau ngày check-out hiện tại (${formatDate(currentCheckOut)})`);
  }

  const today = new Date().toISOString().slice(0, 10);
  if (newCheckOut <= today) throw badRequest("Ngày gia hạn phải là ngày trong tương lai");

  // Check cage availability for the extended period
  const currentCheckOutTs = dateToTimestamp(currentCheckOut);
  const newCheckOutTs = dateToTimestamp(newCheckOut);

  const { data: overlap } = await supabase
    .from("boarding")
    .select("id")
    .eq("cage_id", boarding.cage_id)
    .neq("id", id)
    .not("current_status", "in", "(CHECKED_OUT,CANCELLED)")
    .lt("check_in", newCheckOutTs)
    .gt("pickup_reminder_at", currentCheckOutTs)
    .limit(1);

  if (overlap?.length) {
    throw badRequest("Phòng đã có khách đặt trong khoảng thời gian gia hạn. Vui lòng chọn ngày ngắn hơn.");
  }

  const { error: extendErr } = await supabase
    .from("boarding")
    .update({ pickup_reminder_at: newCheckOutTs })
    .eq("id", id);
  if (extendErr) throw new Error(extendErr.message);

  const petName = boarding.appointments?.pets?.name || "Thú cưng";
  const roomNum = boarding.cages?.cage_number || "";
  const { data: staffList } = await supabase.from("staffs").select("user_id");
  for (const s of staffList || []) {
    await supabase.from("notifications").insert({
      user_id: s.user_id,
      title: "Gia hạn lưu trú",
      content: `${petName} (Phòng ${roomNum}) đã được gia hạn đến ${formatDate(newCheckOut)}.`,
      type: "BOARDING",
      is_read: false,
    });
  }

  return { newCheckOut, petName, roomNumber: roomNum };
}

// ─── CUSTOMER: reschedule boarding dates ──────────────────────────────────────

async function rescheduleBoardingBooking(appointmentId, customerId, { checkIn, checkOut }) {
  if (!checkIn || !checkOut) throw badRequest("Vui lòng chọn ngày check-in và check-out");

  const ciDate = new Date(checkIn);
  const coDate = new Date(checkOut);
  if (isNaN(ciDate.getTime()) || isNaN(coDate.getTime())) throw badRequest("Ngày không hợp lệ");
  if (coDate <= ciDate) throw badRequest("Ngày check-out phải sau ngày check-in");

  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (ciDate < today) throw badRequest("Ngày check-in không được là ngày trong quá khứ");

  const aptId = parsePositiveId(appointmentId, "ID lịch hẹn");

  const { data: boarding, error: fetchErr } = await supabase
    .from("boarding")
    .select(`
      id, current_status,
      appointments:appointment_id (
        id, status,
        pets:pet_id (customers:customer_id (id))
      )
    `)
    .eq("appointment_id", aptId)
    .in("current_status", ["BOOKED"])
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);
  if (!boarding) throw badRequest("Không tìm thấy đặt phòng có thể đổi ngày (chỉ đổi được khi chưa được duyệt)");

  const ownerId = boarding.appointments?.pets?.customers?.id;
  if (String(ownerId) !== String(customerId)) {
    throw Object.assign(new Error("Bạn không có quyền đổi lịch này"), { statusCode: 403 });
  }

  const now = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from("boarding")
    .update({
      check_in: ciDate.toISOString(),
      pickup_reminder_at: coDate.toISOString(),
    })
    .eq("id", boarding.id);
  if (updateErr) throw new Error(updateErr.message);

  await supabase.from("appointments").update({ updated_at: now }).eq("id", aptId);
}

module.exports = {
  listRoomsWithAvailability,
  createBoardingBooking,
  rescheduleBoardingBooking,
  getCustomerBoardings,
  updateBoardingCareByCustomer,
  extendBoardingStay,
  listPendingBoardings,
  listConfirmedBoardings,
  approveBoardingBooking,
  checkInBoarding,
  checkOutBoarding,
  listAllRoomsForStaff,
  createCage,
  updateCage,
  deleteCage,
};
