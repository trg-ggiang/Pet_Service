const express = require("express");
const { supabase } = require("../lib/supabaseClient");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const {
  getAdminDashboard,
  getAdminExamContext,
  getAdminReports,
  getAdminSettings,
  createAdminService,
  listAdminAppointments,
  listAdminServices,
  listAdminStaff,
  listAdminUsers,
  updateAdminAppointmentStatus,
  updateAdminService,
  updateAdminServiceStatus,
  updateAdminUserLock,
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
    const users = await listAdminUsers({
      role: req.query.role,
      search: req.query.search,
    });
    res.json({ ok: true, ...users });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load users" });
  }
});

router.patch("/users/:role/:id/lock", async function(req, res) {
  try {
    const user = await updateAdminUserLock(req.params.role, req.params.id, Boolean(req.body?.locked));
    res.json({ ok: true, user });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Failed to update user lock" });
  }
});

router.get("/services", async function(req, res) {
  try {
    const result = await listAdminServices({
      category: req.query.category,
      status: req.query.status,
      search: req.query.search,
    });
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load services" });
  }
});

router.post("/services", async function(req, res) {
  try {
    const service = await createAdminService(req.body);
    res.status(201).json({ ok: true, service });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Failed to create service" });
  }
});

router.patch("/services/:id", async function(req, res) {
  try {
    const service = await updateAdminService(req.params.id, req.body);
    res.json({ ok: true, service });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Failed to update service" });
  }
});

router.patch("/services/:id/status", async function(req, res) {
  try {
    const service = await updateAdminServiceStatus(req.params.id, req.body?.status);
    res.json({ ok: true, service });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Failed to update service status" });
  }
});

router.get("/appointments", async function(req, res) {
  try {
    const result = await listAdminAppointments({
      status: req.query.status,
      search: req.query.search,
    });
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load appointments" });
  }
});

router.patch("/appointments/:id/status", async function(req, res) {
  try {
    const appointment = await updateAdminAppointmentStatus(req.params.id, req.body?.status);
    res.json({ ok: true, appointment });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Failed to update appointment status" });
  }
});

router.get("/staff", async function(req, res) {
  try {
    const result = await listAdminStaff({
      department: req.query.department,
      status: req.query.status,
      search: req.query.search,
    });
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load staff" });
  }
});

router.patch("/staff/:id/lock", async function(req, res) {
  try {
    const role = String(req.params.id || "").startsWith("NV-C") ? "doctor" : "staff";
    const user = await updateAdminUserLock(role, req.params.id, Boolean(req.body?.locked));
    res.json({ ok: true, user });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Failed to update staff lock" });
  }
});

router.get("/reports", async function(req, res) {
  try {
    const reports = await getAdminReports();
    res.json({ ok: true, reports });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load reports" });
  }
});

router.get("/settings", async function(req, res) {
  try {
    const settings = await getAdminSettings(req.auth?.user);
    res.json({ ok: true, settings });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load settings" });
  }
});

router.get("/exam-context", async function(req, res) {
  try {
    const exam = await getAdminExamContext();
    res.json({ ok: true, exam });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load exam context" });
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
