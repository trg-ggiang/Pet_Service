const express = require("express");
const { supabase } = require("../lib/supabaseClient");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const {
  getAdminDashboard,
  getAdminHealthTrends,
  getAdminReports,
  getAdminSettings,
  updateAdminSettings,
  createAdminService,
  createAdminStaffMember,
  deleteAdminService,
  listAdminAppointments,
  listAdminServices,
  listAdminStaff,
  listAdminUsers,
  updateAdminAppointmentStatus,
  updateAdminService,
  updateAdminServiceStatus,
  updateAdminUserLock,
  updateAdminUserProfile,
} = require("../services/adminService");
const {
  getEmailTemplates,
  updateEmailTemplates,
  sendCustomEmail,
} = require("../services/emailService");
const { saveDoctorScheduleSlots } = require("../services/doctorScheduleService");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

router.get("/dashboard", async function(req, res) {
  try {
    const dashboard = await getAdminDashboard();
    res.json({ ok: true, dashboard });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Không thể tải dashboard" });
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
    res.status(500).json({ ok: false, message: error.message || "Không thể tải danh sách người dùng" });
  }
});

router.patch("/users/:role/:id/lock", async function(req, res) {
  try {
    const user = await updateAdminUserLock(req.params.role, req.params.id, Boolean(req.body?.locked));
    res.json({ ok: true, user });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Không thể cập nhật trạng thái khóa tài khoản" });
  }
});

router.patch("/users/:role/:id/profile", async function(req, res) {
  try {
    const result = await updateAdminUserProfile(req.params.role, req.params.id, req.body || {});
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Không thể cập nhật thông tin người dùng" });
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
    res.status(500).json({ ok: false, message: error.message || "Không thể tải danh sách dịch vụ" });
  }
});

router.post("/services", async function(req, res) {
  try {
    const service = await createAdminService(req.body);
    res.status(201).json({ ok: true, service });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Không thể tạo dịch vụ" });
  }
});

router.patch("/services/:id", async function(req, res) {
  try {
    const service = await updateAdminService(req.params.id, req.body);
    res.json({ ok: true, service });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Không thể cập nhật dịch vụ" });
  }
});

router.patch("/services/:id/status", async function(req, res) {
  try {
    const service = await updateAdminServiceStatus(req.params.id, req.body?.status);
    res.json({ ok: true, service });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Không thể cập nhật trạng thái dịch vụ" });
  }
});

router.delete("/services/:id", async function(req, res) {
  try {
    const result = await deleteAdminService(req.params.id);
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Không thể xoá dịch vụ" });
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
    res.status(500).json({ ok: false, message: error.message || "Không thể tải danh sách lịch hẹn" });
  }
});

router.patch("/appointments/:id/status", async function(req, res) {
  try {
    const appointment = await updateAdminAppointmentStatus(req.params.id, req.body?.status);
    res.json({ ok: true, appointment });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Không thể cập nhật trạng thái lịch hẹn" });
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
    res.status(500).json({ ok: false, message: error.message || "Không thể tải danh sách nhân viên" });
  }
});

router.patch("/staff/:id/lock", async function(req, res) {
  try {
    const role = String(req.params.id || "").startsWith("NV-C") ? "doctor" : "staff";
    const user = await updateAdminUserLock(role, req.params.id, Boolean(req.body?.locked));
    res.json({ ok: true, user });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Không thể cập nhật trạng thái khóa nhân viên" });
  }
});

router.patch("/staff/:id/profile", async function(req, res) {
  try {
    const role = String(req.params.id || "").startsWith("NV-C") ? "doctor" : "staff";
    const result = await updateAdminUserProfile(role, req.params.id, req.body || {});
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Không thể cập nhật thông tin nhân viên" });
  }
});

router.post("/staff", async function(req, res) {
  try {
    const member = await createAdminStaffMember(req.body || {});
    res.status(201).json({ ok: true, member });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || "Không thể tạo nhân viên" });
  }
});

router.get("/reports", async function(req, res) {
  try {
    const reports = await getAdminReports();
    res.json({ ok: true, reports });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Không thể tải báo cáo" });
  }
});

router.get("/health-trends", async function(req, res) {
  try {
    const trends = await getAdminHealthTrends();
    res.json({ ok: true, trends });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Không thể tải phân tích sức khỏe" });
  }
});

router.get("/settings", async function(req, res) {
  try {
    const settings = await getAdminSettings(req.auth?.user);
    res.json({ ok: true, settings });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Không thể tải cài đặt" });
  }
});

router.put("/doctors/:doctorId/schedules", async function(req, res) {
  try {
    const doctorId = Number(String(req.params.doctorId || "").replace(/\D/g, ""));
    if (!Number.isFinite(doctorId)) {
      return res.status(400).json({ ok: false, message: "ID bác sĩ không hợp lệ" });
    }

    const rows = req.body?.rows;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ ok: false, message: "Dữ liệu lịch không hợp lệ" });
    }

    const result = await saveDoctorScheduleSlots(doctorId, rows, { slotDuration: req.body?.slotDuration || 30 });
    res.json({ ok: true, message: `Đã lưu ${result.slotCount} ca khám 30 phút`, ...result });
  } catch (error) {
    res.status(error.statusCode || 400).json({ ok: false, message: error.message || "Không thể lưu lịch bác sĩ" });
  }
});

router.get("/doctors/schedules", async function(req, res) {
  try {
    const weekStart = String(req.query.weekStart || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      return res.status(400).json({ ok: false, message: "weekStart phải có định dạng YYYY-MM-DD" });
    }
    // Parse and add 6 days using UTC noon to avoid timezone date-shift
    const startUtc = new Date(weekStart + "T12:00:00Z");
    const endUtc = new Date(startUtc);
    endUtc.setUTCDate(endUtc.getUTCDate() + 6);
    const weekEnd = endUtc.toISOString().split("T")[0];

    const { data: doctors, error: doctorsErr } = await supabase
      .from("doctors")
      .select("id, full_name, room_name")
      .order("full_name");
    if (doctorsErr) throw new Error(doctorsErr.message);

    if (!doctors || doctors.length === 0) {
      return res.json({ ok: true, doctors: [], schedules: [], weekStart, weekEnd });
    }

    const doctorIds = doctors.map((d) => d.id);
    const { data: scheduleRows, error: schedulesErr } = await supabase
      .from("doctor_schedules")
      .select(`id, doctor_id, work_date, start_time, end_time, room_name,
        slots:doctor_schedule_slots!doctor_schedule_slots_doctor_schedule_id_fkey(id, status)`)
      .in("doctor_id", doctorIds)
      .gte("work_date", weekStart)
      .lte("work_date", weekEnd);
    if (schedulesErr) throw new Error(schedulesErr.message);

    const cellMap = new Map();
    for (const row of scheduleRows || []) {
      const key = `${row.doctor_id}:${row.work_date}`;
      const slots = row.slots || [];
      const slotCount = slots.filter((s) => s.status !== "OFF").length;
      const bookedCount = slots.filter((s) => ["BOOKED", "IN_PROGRESS", "DONE"].includes(s.status)).length;
      const existing = cellMap.get(key);
      if (!existing) {
        cellMap.set(key, { from: row.start_time.slice(0, 5), to: row.end_time.slice(0, 5), roomName: row.room_name || "Phòng 1", slotCount, bookedCount });
      } else {
        if (row.start_time.slice(0, 5) < existing.from) existing.from = row.start_time.slice(0, 5);
        if (row.end_time.slice(0, 5) > existing.to) existing.to = row.end_time.slice(0, 5);
        existing.slotCount += slotCount;
        existing.bookedCount += bookedCount;
      }
    }

    const schedules = [];
    for (const [key, data] of cellMap.entries()) {
      const [doctorIdStr, date] = key.split(":");
      schedules.push({ doctorId: Number(doctorIdStr), date, ...data });
    }

    res.json({
      ok: true,
      doctors: doctors.map((d) => ({ id: d.id, name: d.full_name, room: d.room_name || "Phòng 1" })),
      schedules,
      weekStart,
      weekEnd,
    });
  } catch (error) {
    console.error("[ADMIN] GET /doctors/schedules ERROR:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.put("/settings", async function(req, res) {
  try {
    const settings = await updateAdminSettings(req.body || {}, req.auth?.user);
    res.json({ ok: true, settings });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Không thể cập nhật cài đặt" });
  }
});

router.get("/email-templates", async function(req, res) {
  try {
    const templates = await getEmailTemplates();
    res.json({ ok: true, templates });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Không thể tải mẫu email" });
  }
});

router.put("/email-templates", async function(req, res) {
  try {
    const templates = await updateEmailTemplates(req.body?.templates || {});
    res.json({ ok: true, templates });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Không thể cập nhật mẫu email" });
  }
});

router.post("/email-templates/test", async function(req, res) {
  try {
    const result = await sendCustomEmail({
      to: req.body?.to,
      subject: req.body?.subject || "Email thử nghiệm Pet Service",
      heading: req.body?.heading || "Email thử nghiệm",
      message: req.body?.message || "Cấu hình SMTP và template email đang hoạt động.",
    });
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Không thể gửi email thử" });
  }
});

// GET /api/admin/doctors - Lấy danh sách bác sĩ chưa có hồ sơ
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

    // Lấy tất cả hồ sơ bác sĩ
    const { data: doctorProfiles, error: profilesError } = await supabase
      .from("doctors")
      .select("user_id");

    if (profilesError) {
      console.error("[ADMIN] Get doctor profiles ERROR:", profilesError);
      throw new Error(profilesError.message);
    }

    const linkedUserIds = doctorProfiles.map(d => d.user_id);

    // Tìm tài khoản DOCTOR chưa có hồ sơ
    const unlinkedDoctors = doctorUsers.filter(u => !linkedUserIds.includes(u.id));

    console.log("[ADMIN] Found", unlinkedDoctors.length, "doctors without profile");

    res.json({ ok: true, users: unlinkedDoctors });
  } catch (error) {
    console.error("[ADMIN] GET /doctors ERROR:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// POST /api/admin/doctors/create-profile - Tạo hồ sơ cho bác sĩ
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

// POST /api/admin/doctors/init-all - Tạo hồ sơ cho tất cả bác sĩ chưa có
router.post("/doctors/init-all", async function(req, res) {
  try {
    console.log("[ADMIN] Initializing all doctor profiles...");

    // Lấy tất cả users có role DOCTOR
    const { data: doctorUsers, error: usersError } = await supabase
      .from("users")
      .select("id, email")
      .eq("role", "DOCTOR");

    if (usersError) throw new Error(usersError.message);

    // Lấy tất cả hồ sơ bác sĩ
    const { data: doctorProfiles } = await supabase
      .from("doctors")
      .select("user_id");

    const linkedUserIds = (doctorProfiles || []).map(d => d.user_id);

    // Tạo hồ sơ cho bác sĩ chưa có
    const doctorsToCreate = doctorUsers.filter(u => !linkedUserIds.includes(u.id));

    if (doctorsToCreate.length === 0) {
      return res.json({ ok: true, message: "Tất cả bác sĩ đã có hồ sơ", created: 0 });
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
