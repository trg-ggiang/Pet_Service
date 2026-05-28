const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const {
  getCustomerAppointments,
  createAppointment,
  cancelAppointment,
  getAppointmentDetail,
} = require("../services/customerAppointmentService");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("customer"));

router.get("/", async function(req, res) {
  try {
    const customerId = req.auth.user.customerId;
    console.log("[ROUTES] GET /appointments - customerId:", customerId);
    const data = await getCustomerAppointments(customerId);
    console.log("[ROUTES] Found", data.appointments.length, "appointments,", data.doctors.length, "doctors");
    res.json({ ok: true, appointments: data.appointments, pets: data.pets, doctors: data.doctors });
  } catch (error) {
    console.error("[ROUTES] GET /appointments ERROR:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.get("/:id", async function(req, res) {
  try {
    const customerId = req.auth.user.customerId;
    const data = await getAppointmentDetail(req.params.id, customerId);
    res.json({ ok: true, appointment: data });
  } catch (error) {
    const status = error.message.includes("Không tìm thấy") ? 404 : 500;
    res.status(status).json({ ok: false, message: error.message });
  }
});

router.post("/", async function(req, res) {
  try {
    const customerId = req.auth.user.customerId;
    console.log("[ROUTES] POST /appointments - customerId:", customerId);
    console.log("[ROUTES] Body:", JSON.stringify(req.body, null, 2));

    const { petId, doctorId, doctorScheduleId, appointmentType, appointmentDate, appointmentTime, note } = req.body;
    const appointment = await createAppointment({ petId, doctorId, doctorScheduleId, appointmentType, appointmentDate, appointmentTime, note }, customerId);

    res.status(201).json({ ok: true, appointment });
  } catch (error) {
    console.error("[ROUTES] POST /appointments ERROR:", error.message);
    res.status(400).json({ ok: false, message: error.message });
  }
});

router.delete("/:id", async function(req, res) {
  try {
    const customerId = req.auth.user.customerId;
    const { reason } = req.body;
    await cancelAppointment(req.params.id, reason, customerId);
    res.json({ ok: true, message: "Lịch hẹn đã được hủy thành công" });
  } catch (error) {
    const status = error.message.includes("Không tìm thấy") ? 404 : error.message.includes("Không thể hủy") ? 400 : 500;
    res.status(status).json({ ok: false, message: error.message });
  }
});

module.exports = router;
