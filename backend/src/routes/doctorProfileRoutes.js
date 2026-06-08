const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const { supabase } = require("../lib/supabaseClient");
const { getDoctorExamContext, getDoctorSettings, getDoctorStats, listDoctorRecords } = require("../services/doctor/doctorService");
const { assertScheduleAvailable } = require("../services/scheduleService");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("doctor"));

// GET /api/doctor/profile - Lấy thông tin profile của bác sĩ đang đăng nhập
router.get("/profile", async function(req, res) {
  try {
    const doctorId = req.auth?.user?.doctorId;
    console.log("[ROUTES] GET /doctor/profile - doctorId:", doctorId);

    if (!doctorId) {
      return res.status(403).json({ ok: false, message: "Không tìm thấy hồ sơ bác sĩ" });
    }

    const { data: doctor, error } = await supabase
      .from("doctors")
      .select(`
        id,
        full_name,
        specialization,
        degree,
        experience_years,
        room_name,
        user:user_id (email)
      `)
      .eq("id", doctorId)
      .single();

    if (error || !doctor) {
      throw new Error("Không tìm thấy hồ sơ bác sĩ");
    }

    res.json({
      ok: true,
      profile: {
        id: doctor.id,
        fullName: doctor.full_name,
        email: doctor.user?.email || "",
        specialization: doctor.specialization || "Nội khoa tổng quát",
        degree: doctor.degree || "",
        experienceYears: doctor.experience_years || 0,
        roomName: doctor.room_name || "Phòng khám 1",
      }
    });
  } catch (error) {
    console.error("[ROUTES] GET /doctor/profile ERROR:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.get("/records", async function(req, res) {
  try {
    const doctorId = req.auth?.user?.doctorId;
    if (!doctorId) {
      return res.status(403).json({ ok: false, message: "Không tìm thấy hồ sơ bác sĩ" });
    }

    const records = await listDoctorRecords(doctorId, {
      search: req.query.search,
      species: req.query.species,
    });
    res.json({ ok: true, records });
  } catch (error) {
    console.error("[ROUTES] GET /doctor/records ERROR:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.get("/exam/:appointmentId", async function(req, res) {
  try {
    const doctorId = req.auth?.user?.doctorId;
    if (!doctorId) {
      return res.status(403).json({ ok: false, message: "Không tìm thấy hồ sơ bác sĩ" });
    }

    const context = await getDoctorExamContext(doctorId, req.params.appointmentId);
    res.json({ ok: true, context });
  } catch (error) {
    console.error("[ROUTES] GET /doctor/exam/:appointmentId ERROR:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.get("/stats", async function(req, res) {
  try {
    const doctorId = req.auth?.user?.doctorId;
    if (!doctorId) {
      return res.status(403).json({ ok: false, message: "Không tìm thấy hồ sơ bác sĩ" });
    }

    const stats = await getDoctorStats(doctorId);
    res.json({ ok: true, stats });
  } catch (error) {
    console.error("[ROUTES] GET /doctor/stats ERROR:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.get("/settings", async function(req, res) {
  try {
    const doctorId = req.auth?.user?.doctorId;
    if (!doctorId) {
      return res.status(403).json({ ok: false, message: "Không tìm thấy hồ sơ bác sĩ" });
    }

    const settings = await getDoctorSettings(doctorId);
    res.json({ ok: true, settings });
  } catch (error) {
    console.error("[ROUTES] GET /doctor/settings ERROR:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

function parsePositiveId(value, fieldName = "id") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${fieldName} không hợp lệ`);
  }
  return id;
}

function normalizeTimeInput(value) {
  const text = String(value ?? "").trim();
  if (!/^\d{2}:\d{2}/.test(text)) return null;
  return text.slice(0, 5) + ":00";
}

router.put("/settings/schedule", async function(req, res) {
  try {
    console.log("[SCHEDULE] PUT /doctor/settings/schedule called");
    console.log("[SCHEDULE] body:", JSON.stringify(req.body));

    const doctorId = req.auth?.user?.doctorId;
    if (!doctorId) {
      return res.status(403).json({ ok: false, message: "Không tìm thấy hồ sơ bác sĩ" });
    }

    const { rows } = req.body ?? {};
    console.log("[SCHEDULE] rows count:", Array.isArray(rows) ? rows.length : "not array");
    if (!Array.isArray(rows)) {
      return res.status(400).json({ ok: false, message: "Dữ liệu lịch không hợp lệ" });
    }

    const now = new Date().toISOString();
    const upsertedIds = [];

    // Get all existing schedules for this doctor
    const { data: existingSchedules, error: fetchError } = await supabase
      .from("doctor_schedules")
      .select("id, work_date, start_time, end_time, room_name")
      .eq("doctor_id", doctorId);

    if (fetchError) throw new Error(fetchError.message);

    const existingByDate = new Map();
    (existingSchedules || []).forEach((s) => {
      existingByDate.set(s.work_date, s);
    });

    for (const row of rows) {
      const workDate = String(row.date || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
        throw new Error(`Ngày không hợp lệ: ${workDate}`);
      }

      const startTime = normalizeTimeInput(row.from);
      const endTime = normalizeTimeInput(row.to);
      if (!startTime || !endTime) {
        throw new Error(`Giờ làm việc không hợp lệ cho ngày ${workDate}`);
      }

      const roomName = String(row.roomName || "Phòng 1").trim();
      const status = row.on ? "AVAILABLE" : "OFF";

      const existing = existingByDate.get(workDate);

      if (existing) {
        // Update existing schedule
        console.log(`[SCHEDULE] Updating schedule id=${existing.id} for date=${workDate}`);
        const { data, error } = await supabase
          .from("doctor_schedules")
          .update({
            start_time: startTime,
            end_time: endTime,
            room_name: roomName,
            status: status,
            updated_at: now,
          })
          .eq("id", existing.id)
          .eq("doctor_id", doctorId)
          .select("id")
          .single();

        if (error) throw new Error(`Update error: ${error.message}`);
        upsertedIds.push(data.id);
      } else {
        // Insert new schedule
        console.log(`[SCHEDULE] Inserting new schedule for date=${workDate}`);
        const { data, error } = await supabase
          .from("doctor_schedules")
          .insert({
            doctor_id: doctorId,
            work_date: workDate,
            start_time: startTime,
            end_time: endTime,
            room_name: roomName,
            status: status,
            created_at: now,
            updated_at: now,
          })
          .select("id")
          .single();

        if (error) throw new Error(`Insert error: ${error.message}`);
        upsertedIds.push(data.id);
      }
    }

    // Deactivate any existing schedules not in the update list
    const allScheduleIds = (existingSchedules || []).map((s) => s.id);
    const toDeactivate = allScheduleIds.filter((id) => !upsertedIds.includes(id));
    if (toDeactivate.length > 0) {
      console.log("[SCHEDULE] Deactivating old schedules:", toDeactivate);
      const { error: deactivateError } = await supabase
        .from("doctor_schedules")
        .update({ status: "OFF", updated_at: now })
        .eq("doctor_id", doctorId)
        .in("id", toDeactivate);
      if (deactivateError) console.warn("[SCHEDULE] Deactivate warning:", deactivateError.message);
    }

    console.log("[SCHEDULE] Success! upsertedIds:", upsertedIds);
    res.json({ ok: true, message: "Đã lưu lịch làm việc" });
  } catch (error) {
    console.error("[ROUTES] PUT /doctor/settings/schedule ERROR:", error.message, error.details);
    res.status(400).json({ ok: false, message: error.message });
  }
});

router.delete("/settings/schedule/:id", async function(req, res) {
  try {
    const doctorId = req.auth?.user?.doctorId;
    if (!doctorId) {
      return res.status(403).json({ ok: false, message: "Không tìm thấy hồ sơ bác sĩ" });
    }

    const scheduleId = parsePositiveId(req.params.id, "ID lịch");

    const { error } = await supabase
      .from("doctor_schedules")
      .delete()
      .eq("id", scheduleId)
      .eq("doctor_id", doctorId);

    if (error) throw new Error(`Xóa lịch thất bại: ${error.message}`);

    res.json({ ok: true, message: "Đã xóa lịch làm việc" });
  } catch (error) {
    console.error("[ROUTES] DELETE /doctor/settings/schedule/:id ERROR:", error.message);
    res.status(400).json({ ok: false, message: error.message });
  }
});

module.exports = router;
