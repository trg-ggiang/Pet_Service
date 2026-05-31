const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const { supabase } = require("../lib/supabaseClient");

const router = express.Router();

router.use(authMiddleware);

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

module.exports = router;
