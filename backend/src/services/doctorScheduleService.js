const { supabase } = require("../lib/supabaseClient");

const LOCKED_SLOT_STATUSES = new Set(["BOOKED", "IN_PROGRESS", "DONE"]);

function normalizeDateInput(value) {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function normalizeTimeInput(value) {
  const text = String(value ?? "").trim();
  if (!/^\d{2}:\d{2}/.test(text)) return null;
  return `${text.slice(0, 5)}:00`;
}

function timeToMinutes(value) {
  const [hour, minute] = String(value || "00:00").split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

function buildScheduleSlots(rows, slotDuration = 30) {
  const slots = [];

  rows.forEach((row) => {
    const slotDate = normalizeDateInput(row.date || row.workDate);
    const startTime = normalizeTimeInput(row.from || row.startTime);
    const endTime = normalizeTimeInput(row.to || row.endTime);
    if (!slotDate) throw new Error(`Ngày không hợp lệ: ${row.date || row.workDate || ""}`);
    if (!startTime || !endTime) throw new Error(`Giờ làm việc không hợp lệ cho ngày ${slotDate}`);

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    if (endMinutes <= startMinutes) throw new Error(`Khung giờ ngày ${slotDate} phải có giờ kết thúc sau giờ bắt đầu`);

    for (let cursor = startMinutes; cursor + slotDuration <= endMinutes; cursor += slotDuration) {
      slots.push({
        slot_date: slotDate,
        start_time: minutesToTime(cursor),
        end_time: minutesToTime(cursor + slotDuration),
        status: row.on === false ? "OFF" : "AVAILABLE",
      });
    }
  });

  return slots;
}

async function upsertScheduleWindow(doctorId, row, now) {
  const workDate = normalizeDateInput(row.date || row.workDate);
  const startTime = normalizeTimeInput(row.from || row.startTime);
  const endTime = normalizeTimeInput(row.to || row.endTime);
  if (!workDate || !startTime || !endTime) throw new Error("Dữ liệu khung làm việc không hợp lệ");

  const roomName = String(row.roomName || row.room_name || "Phòng 1").trim();
  const existing = await supabase
    .from("doctor_schedules")
    .select("id")
    .eq("doctor_id", doctorId)
    .eq("work_date", workDate)
    .eq("start_time", startTime)
    .eq("end_time", endTime)
    .eq("room_name", roomName)
    .limit(1)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data.id;

  const inserted = await supabase
    .from("doctor_schedules")
    .insert({
      doctor_id: doctorId,
      work_date: workDate,
      start_time: startTime,
      end_time: endTime,
      room_name: roomName,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (inserted.error) throw new Error(inserted.error.message);
  return inserted.data.id;
}

async function saveDoctorScheduleSlots(doctorId, rows, options = {}) {
  const effectiveDoctorId = Number(doctorId);
  if (!Number.isFinite(effectiveDoctorId)) throw new Error("Không tìm thấy hồ sơ bác sĩ");
  if (!Array.isArray(rows)) throw new Error("Dữ liệu lịch không hợp lệ");

  const slotDuration = Math.max(5, Number(options.slotDuration || 30));
  const now = new Date().toISOString();
  const savedScheduleIds = [];
  const savedSlotIds = [];

  for (const row of rows) {
    const scheduleId = await upsertScheduleWindow(effectiveDoctorId, row, now);
    savedScheduleIds.push(scheduleId);
    const desiredSlots = buildScheduleSlots([row], slotDuration);
    const slotDate = desiredSlots[0]?.slot_date;

    const existingResult = slotDate
      ? await supabase
          .from("doctor_schedule_slots")
          .select("id, doctor_schedule_id, start_time, status")
          .eq("doctor_id", effectiveDoctorId)
          .eq("slot_date", slotDate)
      : { data: [], error: null };
    if (existingResult.error) throw new Error(existingResult.error.message);

    const existingByStart = new Map((existingResult.data || []).map((slot) => [normalizeTimeInput(slot.start_time), slot]));
    const desiredStarts = new Set();

    for (const slot of desiredSlots) {
      desiredStarts.add(slot.start_time);
      const existing = existingByStart.get(slot.start_time);
      const status = existing && LOCKED_SLOT_STATUSES.has(existing.status) ? existing.status : slot.status;

      if (existing) {
        const updated = await supabase
          .from("doctor_schedule_slots")
          .update({ doctor_schedule_id: scheduleId, end_time: slot.end_time, status, updated_at: now })
          .eq("id", existing.id)
          .select("id")
          .single();
        if (updated.error) throw new Error(updated.error.message);
        savedSlotIds.push(updated.data.id);
      } else {
        const inserted = await supabase
          .from("doctor_schedule_slots")
          .insert({
            doctor_schedule_id: scheduleId,
            doctor_id: effectiveDoctorId,
            ...slot,
            created_at: now,
            updated_at: now,
          })
          .select("id")
          .single();
        if (inserted.error) throw new Error(inserted.error.message);
        savedSlotIds.push(inserted.data.id);
      }
    }

    const obsoleteIds = (existingResult.data || [])
      .filter((slot) => slot.doctor_schedule_id === scheduleId)
      .filter((slot) => !desiredStarts.has(normalizeTimeInput(slot.start_time)) && !LOCKED_SLOT_STATUSES.has(slot.status))
      .map((slot) => slot.id);
    if (obsoleteIds.length > 0) {
      const disabled = await supabase
        .from("doctor_schedule_slots")
        .update({ status: "OFF", updated_at: now })
        .in("id", obsoleteIds);
      if (disabled.error) throw new Error(disabled.error.message);
    }
  }

  return { savedScheduleIds, savedSlotIds, slotCount: savedSlotIds.length };
}

async function ensureDoctorScheduleSlot(doctorId, slotDate, startTime, options = {}) {
  const normalizedDate = normalizeDateInput(slotDate);
  const normalizedStart = normalizeTimeInput(startTime);
  const slotDuration = Math.max(5, Number(options.slotDuration || 30));
  if (!normalizedDate || !normalizedStart) return null;

  const endTime = minutesToTime(timeToMinutes(normalizedStart) + slotDuration);
  const exact = await supabase
    .from("doctor_schedule_slots")
    .select("id, doctor_schedule_id, doctor_id, slot_date, start_time, end_time, status, schedule:doctor_schedules!doctor_schedule_slots_doctor_schedule_id_fkey(room_name)")
    .eq("doctor_id", doctorId)
    .eq("slot_date", normalizedDate)
    .eq("start_time", normalizedStart)
    .eq("end_time", endTime)
    .eq("status", "AVAILABLE")
    .limit(1)
    .maybeSingle();

  if (exact.error) throw new Error(exact.error.message);
  return exact.data || null;
}

async function setDoctorScheduleSlotStatus(slotId, status) {
  if (!slotId) return;
  const result = await supabase
    .from("doctor_schedule_slots")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", slotId);
  if (result.error) throw new Error(result.error.message);
}

async function reserveDoctorScheduleSlot(slotId) {
  if (!slotId) return null;
  const result = await supabase
    .from("doctor_schedule_slots")
    .update({ status: "BOOKED", updated_at: new Date().toISOString() })
    .eq("id", slotId)
    .eq("status", "AVAILABLE")
    .select("id")
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

module.exports = {
  buildScheduleSlots,
  ensureDoctorScheduleSlot,
  normalizeDateInput,
  normalizeTimeInput,
  reserveDoctorScheduleSlot,
  saveDoctorScheduleSlots,
  setDoctorScheduleSlotStatus,
  timeToMinutes,
};
