const express = require("express");
const { supabase } = require("../lib/supabaseClient");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const {
  getAdminDashboard,
  listAdminAppointments,
  listAdminServices,
  listAdminStaff,
  listAdminUsers,
} = require("../services/adminService");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

router.get("/dashboard", async function(req, res) {
  try {
    const dashboard = await getAdminDashboard();
    res.json({ ok: true, dashboard });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load dashboard" });
  }
});

router.get("/users", async function(req, res) {
  try {
    const users = await listAdminUsers();
    res.json({ ok: true, ...users });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load users" });
  }
});

router.get("/services", async function(req, res) {
  try {
    const services = await listAdminServices();
    res.json({ ok: true, services });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load services" });
  }
});

router.get("/appointments", async function(req, res) {
  try {
    const appointments = await listAdminAppointments();
    res.json({ ok: true, appointments });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load appointments" });
  }
});

router.get("/staff", async function(req, res) {
  try {
    const staff = await listAdminStaff();
    res.json({ ok: true, staff });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load staff" });
  }
});

// GET /api/admin/doctors - Lấy danh sách doctors chưa có hồ sơ
router.get("/doctors", async function(req, res) {
  try {
    // Lấy tất cả users có role DOCTOR
    const { data: doctorUsers, error: usersError } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("role", "DOCTOR");

    if (usersError) {
      console.error("[ADMIN] Get doctor users ERROR:", usersError);
      throw new Error(usersError.message);
    }

    // Lấy tất cả hồ sơ doctors
    const { data: doctorProfiles, error: profilesError } = await supabase
      .from("doctors")
      .select("user_id");

    if (profilesError) {
      console.error("[ADMIN] Get doctor profiles ERROR:", profilesError);
      throw new Error(profilesError.message);
    }

    const linkedUserIds = doctorProfiles.map(d => d.user_id);

    // Tìm users DOCTOR chưa có hồ sơ
    const unlinkedDoctors = doctorUsers.filter(u => !linkedUserIds.includes(u.id));

    console.log("[ADMIN] Found", unlinkedDoctors.length, "doctors without profile");

    res.json({ ok: true, users: unlinkedDoctors });
  } catch (error) {
    console.error("[ADMIN] GET /doctors ERROR:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// POST /api/admin/doctors/create-profile - Tạo hồ sơ cho doctor
router.post("/doctors/create-profile", async function(req, res) {
  try {
    const { userId, fullName, specialization, roomName } = req.body;

    if (!userId || !fullName) {
      return res.status(400).json({ ok: false, message: "Thiếu thông tin bắt buộc" });
    }

    console.log("[ADMIN] Creating doctor profile for userId:", userId);

    // Kiểm tra đã có hồ sơ chưa
    const { data: existing } = await supabase
      .from("doctors")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      return res.status(400).json({ ok: false, message: "Hồ sơ bác sĩ đã tồn tại" });
    }

    // Tạo hồ sơ
    const { data: newDoctor, error: insertError } = await supabase
      .from("doctors")
      .insert({
        user_id: userId,
        full_name: fullName,
        specialization: specialization || "Nội khoa tổng quát",
        room_name: roomName || "Phòng khám 1",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[ADMIN] Create doctor profile ERROR:", insertError);
      throw new Error("Không thể tạo hồ sơ: " + insertError.message);
    }

    console.log("[ADMIN] Created doctor profile:", newDoctor);

    res.json({ ok: true, doctor: newDoctor });
  } catch (error) {
    console.error("[ADMIN] POST /create-profile ERROR:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// POST /api/admin/doctors/init-all - Tạo hồ sơ cho tất cả doctors chưa có
router.post("/doctors/init-all", async function(req, res) {
  try {
    console.log("[ADMIN] Initializing all doctor profiles...");

    // Lấy tất cả users có role DOCTOR
    const { data: doctorUsers, error: usersError } = await supabase
      .from("users")
      .select("id, email")
      .eq("role", "DOCTOR");

    if (usersError) throw new Error(usersError.message);

    // Lấy tất cả hồ sơ doctors
    const { data: doctorProfiles } = await supabase
      .from("doctors")
      .select("user_id");

    const linkedUserIds = (doctorProfiles || []).map(d => d.user_id);

    // Tạo hồ sơ cho doctors chưa có
    const doctorsToCreate = doctorUsers.filter(u => !linkedUserIds.includes(u.id));

    if (doctorsToCreate.length === 0) {
      return res.json({ ok: true, message: "Tất cả doctors đã có hồ sơ", created: 0 });
    }

    const insertData = doctorsToCreate.map((u, index) => ({
      user_id: u.id,
      full_name: `BS. ${u.email.split("@")[0]}`,
      specialization: "Nội khoa tổng quát",
      room_name: `Phòng ${index + 1}`,
    }));

    const { data: created, error: insertError } = await supabase
      .from("doctors")
      .insert(insertData)
      .select();

    if (insertError) throw new Error("Không thể tạo hồ sơ: " + insertError.message);

    console.log("[ADMIN] Created", created.length, "doctor profiles");

    res.json({ ok: true, created: created.length, doctors: created });
  } catch (error) {
    console.error("[ADMIN] POST /init-all ERROR:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

module.exports = router;
