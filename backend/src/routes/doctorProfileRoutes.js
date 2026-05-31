const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const { supabase } = require("../lib/supabaseClient");
const { getDoctorExamContext, getDoctorStats, listDoctorRecords } = require("../services/doctorService");

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

    const records = await listDoctorRecords(doctorId);
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

module.exports = router;
