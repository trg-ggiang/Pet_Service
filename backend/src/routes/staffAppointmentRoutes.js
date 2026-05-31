const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const { supabase } = require("../lib/supabaseClient");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("staff", "doctor"));

// GET /api/staff/appointments - Lấy tất cả lịch hẹn chưa xử lý
router.get("/", async function(req, res) {
  try {
    console.log("[ROUTES] GET /staff/appointments");

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        id,
        pet_id,
        doctor_id,
        staff_id,
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
          customer_id,
          species:species_id (name),
          breed:breed_id (name),
          customers:customer_id (full_name, phone)
        ),
        doctors:doctor_id (id, full_name, specialization)
      `)
      .in("status", ["PENDING", "CONFIRMED"])
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) {
      console.error("[ROUTES] GET /staff/appointments ERROR:", error);
      throw new Error(error.message);
    }

    console.log("[ROUTES] Found", appointments.length, "pending appointments");

    const formattedAppointments = (appointments || []).map((apt) => {
      // Mapping cho staff portal - CONFIRMED = đã check-in
      const staffStatusMap = {
        PENDING: "scheduled",
        CONFIRMED: "checked_in", // CONFIRMED = đã check-in
        CHECKED_IN: "checked_in",
        IN_PROGRESS: "in_progress",
        COMPLETED: "completed",
        CANCELLED: "completed",
        NO_SHOW: "completed",
      };

      const serviceMap = {
        MEDICAL: "Khám bệnh",
        GROOMING: "Grooming",
        BOARDING: "Lưu trú",
        VACCINE: "Tiêm phòng",
        FOOD: "Thức ăn",
        OTHER: "Khác",
        MIXED: "Khám & Dịch vụ",
      };

      return {
        id: "APT-" + String(apt.id).padStart(5, "0"),
        appointmentId: apt.id,
        date: apt.appointment_date || "",
        time: apt.appointment_time || "",
        petName: apt.pets?.name || "N/A",
        species: apt.pets?.species?.name || "N/A",
        breed: apt.pets?.breed?.name || "N/A",
        owner: apt.pets?.customers?.full_name || "N/A",
        phone: apt.pets?.customers?.phone || "N/A",
        service: serviceMap[apt.appointment_type] || apt.appointment_type,
        serviceType: apt.appointment_type,
        status: staffStatusMap[apt.status] || "scheduled",
        queue: "A" + String(apt.id).padStart(3, "0"),
        note: apt.note || "",
        createdAt: apt.created_at,
      };
    });

    res.json({ ok: true, appointments: formattedAppointments });
  } catch (error) {
    console.error("[ROUTES] GET /staff/appointments ERROR:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// PUT /api/staff/appointments/:id/checkin - Check-in lịch hẹn
router.put("/:id/checkin", async function(req, res) {
  try {
    const appointmentId = parseInt(req.params.id);
    console.log("[ROUTES] PUT /staff/appointments/:id/checkin - id:", appointmentId);

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      throw new Error("Không tìm thấy lịch hẹn");
    }

    if (appointment.status !== "PENDING" && appointment.status !== "CONFIRMED") {
      throw new Error("Không thể check-in lịch hẹn ở trạng thái hiện tại");
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "CONFIRMED", updated_at: new Date().toISOString() })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("[ROUTES] Check-in ERROR:", updateError);
      throw new Error("Không thể check-in: " + updateError.message);
    }

    console.log("[ROUTES] Check-in thành công cho appointment:", appointmentId);
    res.json({ ok: true, message: "Check-in thành công" });
  } catch (error) {
    console.error("[ROUTES] PUT /staff/appointments/:id/checkin ERROR:", error.message);
    res.status(400).json({ ok: false, message: error.message });
  }
});

module.exports = router;
