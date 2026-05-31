const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const { supabase } = require("../lib/supabaseClient");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("doctor"));

// GET /api/doctor/appointments - Lấy lịch hẹn của bác sĩ đang đăng nhập
router.get("/", async function(req, res) {
  try {
    const doctorId = req.auth?.user?.doctorId;
    console.log("[ROUTES] GET /doctor/appointments - user:", req.auth?.user?.email, "- doctorId:", doctorId, "- role:", req.auth?.user?.role);

    if (!doctorId) {
      return res.status(403).json({ ok: false, message: "Tài khoản này không phải là bác sĩ hoặc chưa được liên kết với hồ sơ bác sĩ" });
    }

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        id,
        pet_id,
        doctor_id,
        appointment_type,
        status,
        note,
        appointment_date,
        appointment_time,
        created_at,
        pets:pet_id (
          id,
          name,
          img_url,
          species:species_id (name),
          breed:breed_id (name),
          customers:customer_id (full_name, phone)
        )
      `)
      .eq("doctor_id", doctorId)
      .in("status", ["PENDING", "CONFIRMED", "IN_PROGRESS"])
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) {
      console.error("[ROUTES] GET /doctor/appointments ERROR:", error);
      throw new Error(error.message);
    }

    console.log("[ROUTES] Found", appointments.length, "appointments for doctor", doctorId);

    const serviceMap = {
      MEDICAL: "Khám bệnh",
      GROOMING: "Grooming",
      BOARDING: "Lưu trú",
      VACCINE: "Tiêm phòng",
      FOOD: "Thức ăn",
      OTHER: "Khác",
      MIXED: "Khám & Dịch vụ",
    };

    const statusMap = {
      PENDING: { label: "Chờ khám", color: "#D97706", bg: "#FFFBEB" },
      CONFIRMED: { label: "Đã xác nhận", color: "#2563EB", bg: "#EFF6FF" },
      IN_PROGRESS: { label: "Đang khám", color: "#7C3AED", bg: "#F5F3FF" },
      COMPLETED: { label: "Hoàn thành", color: "#059669", bg: "#ECFDF5" },
    };

    const formattedAppointments = (appointments || []).map((apt) => ({
      id: "APT-" + String(apt.id).padStart(5, "0"),
      appointmentId: apt.id,
      date: apt.appointment_date || "",
      time: apt.appointment_time || "",
      petName: apt.pets?.name || "N/A",
      petImage: apt.pets?.img_url || null,
      species: apt.pets?.species?.name || "N/A",
      breed: apt.pets?.breed?.name || "N/A",
      owner: apt.pets?.customers?.full_name || "N/A",
      ownerPhone: apt.pets?.customers?.phone || "N/A",
      service: serviceMap[apt.appointment_type] || apt.appointment_type,
      serviceType: apt.appointment_type,
      status: statusMap[apt.status] || statusMap.PENDING,
      note: apt.note || "",
      createdAt: apt.created_at,
    }));

    res.json({ ok: true, appointments: formattedAppointments });
  } catch (error) {
    console.error("[ROUTES] GET /doctor/appointments ERROR:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// PUT /api/doctor/appointments/:id/start - Bắt đầu khám
router.put("/:id/start", async function(req, res) {
  try {
    const appointmentId = parseInt(req.params.id);
    const doctorId = req.auth.user.doctorId;
    console.log("[ROUTES] PUT /doctor/appointments/:id/start - id:", appointmentId);

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, status, doctor_id")
      .eq("id", appointmentId)
      .eq("doctor_id", doctorId)
      .single();

    if (fetchError || !appointment) {
      throw new Error("Không tìm thấy lịch hẹn hoặc bạn không có quyền");
    }

    if (appointment.status !== "CONFIRMED" && appointment.status !== "PENDING") {
      throw new Error("Không thể bắt đầu khám lịch hẹn ở trạng thái hiện tại");
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "IN_PROGRESS", updated_at: new Date().toISOString() })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("[ROUTES] Start exam ERROR:", updateError);
      throw new Error("Không thể bắt đầu khám: " + updateError.message);
    }

    console.log("[ROUTES] Bắt đầu khám thành công cho appointment:", appointmentId);
    res.json({ ok: true, message: "Bắt đầu khám thành công" });
  } catch (error) {
    console.error("[ROUTES] PUT /doctor/appointments/:id/start ERROR:", error.message);
    res.status(400).json({ ok: false, message: error.message });
  }
});

// PUT /api/doctor/appointments/:id/complete - Hoàn thành khám
router.put("/:id/complete", async function(req, res) {
  try {
    const appointmentId = parseInt(req.params.id);
    const doctorId = req.auth.user.doctorId;
    console.log("[ROUTES] PUT /doctor/appointments/:id/complete - id:", appointmentId);

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, status, doctor_id")
      .eq("id", appointmentId)
      .eq("doctor_id", doctorId)
      .single();

    if (fetchError || !appointment) {
      throw new Error("Không tìm thấy lịch hẹn hoặc bạn không có quyền");
    }

    if (appointment.status !== "IN_PROGRESS") {
      throw new Error("Chỉ có thể hoàn thành lịch hẹn đang trong quá trình khám");
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "COMPLETED", updated_at: new Date().toISOString() })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("[ROUTES] Complete exam ERROR:", updateError);
      throw new Error("Không thể hoàn thành khám: " + updateError.message);
    }

    console.log("[ROUTES] Hoàn thành khám thành công cho appointment:", appointmentId);
    res.json({ ok: true, message: "Hoàn thành khám thành công" });
  } catch (error) {
    console.error("[ROUTES] PUT /doctor/appointments/:id/complete ERROR:", error.message);
    res.status(400).json({ ok: false, message: error.message });
  }
});

module.exports = router;
