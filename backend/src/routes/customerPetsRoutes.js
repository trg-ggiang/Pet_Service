const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const {
  getCustomerPetDashboard,
  getPetDetail,
  createCustomerPet,
  updateCustomerPet,
  getCustomerProfile,
  updateCustomerProfile,
  updateCustomerPassword,
} = require("../services/customerPetsService");
const {
  buildCustomerInvoicePdf,
  buildLatestCustomerInvoicePdf,
  buildMatchingCustomerInvoicePdf,
} = require("../services/invoicePdfService");
const {
  dismissCustomerNotification,
  listCustomerNotifications,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
} = require("../services/customerNotificationsService");
const {
  listCustomerAppointmentOptions,
  listCustomerAppointmentProviders,
  listCustomerAppointments,
  listCustomerAppointmentsView,
  createCustomerAppointment,
  confirmCustomerAppointment,
  rescheduleCustomerAppointment,
  cancelCustomerAppointment,
  listAvailableCages,
} = require("../services/customer/customerAppointmentsService");
const {
  listCustomerServiceHistoryView,
} = require("../services/customer/customerServiceHistoryService");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("customer"));

router.get("/profile", async (req, res) => {
  try {
    const profile = await getCustomerProfile(req.auth.user.customerId);
    res.json({ ok: true, profile });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load profile" });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const profile = await updateCustomerProfile(req.auth.user.customerId, req.body ?? {});
    res.json({ ok: true, profile });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Failed to update profile" });
  }
});

router.put("/password", async (req, res) => {
  try {
    await updateCustomerPassword(req.auth.user.id, req.body?.oldPassword, req.body?.newPassword);
    res.json({ ok: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Failed to change password" });
  }
});

router.get("/pets", async (req, res) => {
  try {
    const customerId = req.auth.user.customerId;
    const data = await getCustomerPetDashboard(customerId);
    res.json({ ok: true, ...data });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load customer pets" });
  }
});

router.get("/pets/:petId", async (req, res) => {
  try {
    const data = await getPetDetail(req.params.petId, req.auth.user.customerId);
    res.json({ ok: true, ...data });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load pet detail" });
  }
});

router.get("/appointment-options", async (req, res) => {
  try {
    const options = await listCustomerAppointmentOptions(req.auth.user.customerId);
    res.json({ ok: true, options });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Failed to load customer appointment options",
    });
  }
});

router.get("/cages/available", async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    const cages = await listAvailableCages(checkIn, checkOut);
    res.json({ ok: true, cages });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Failed to load available cages" });
  }
});

router.post("/appointment-provider-options", async (req, res) => {
  try {
    const providers = await listCustomerAppointmentProviders(
      req.body ?? {},
      req.auth.user.customerId,
    );
    res.json({ ok: true, providers });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      ok: false,
      message: error.message || "Failed to list customer appointment providers",
    });
  }
});

router.get("/appointments", async (req, res) => {
  try {
    const result = await listCustomerAppointmentsView(req.auth.user.customerId, {
      status: req.query.status,
      pet: req.query.pet,
      serviceType: req.query.serviceType,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Failed to load customer appointments",
    });
  }
});

router.post("/appointments", async (req, res) => {
  try {
    const appointment = await createCustomerAppointment(
      req.body ?? {},
      req.auth.user.customerId,
    );
    res.status(201).json({ ok: true, appointment });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      ok: false,
      message: error.message || "Failed to create customer appointment",
    });
  }
});


router.patch("/appointments/:appointmentId/confirm", async (req, res) => {
  try {
    const appointment = await confirmCustomerAppointment(
      req.params.appointmentId,
      req.auth.user.customerId,
    );
    res.json({ ok: true, appointment });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      ok: false,
      message: error.message || "Failed to confirm customer appointment",
    });
  }
});

router.patch("/appointments/:appointmentId/reschedule", async (req, res) => {
  try {
    const appointment = await rescheduleCustomerAppointment(
      req.params.appointmentId,
      req.body ?? {},
      req.auth.user.customerId,
    );
    res.json({ ok: true, appointment });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      ok: false,
      message: error.message || "Failed to reschedule customer appointment",
    });
  }
});

router.patch("/appointments/:appointmentId/cancel", async (req, res) => {
  try {
    const appointment = await cancelCustomerAppointment(
      req.params.appointmentId,
      req.body ?? {},
      req.auth.user.customerId,
    );
    res.json({ ok: true, appointment });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      ok: false,
      message: error.message || "Failed to cancel customer appointment",
    });
  }
});

router.get("/service-history", async (req, res) => {
  try {
    const result = await listCustomerServiceHistoryView(req.auth.user.customerId, {
      type: req.query.type,
    });
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Failed to load customer service history",
    });
  }
});

router.post("/pets", async (req, res) => {
  try {
    // Debug: log incoming request body for troubleshooting speciesId issues
    console.debug("[routes] POST /api/customer/pets body:", req.body, "customerId:", req.auth?.user?.customerId);
    const data = await createCustomerPet(req.body ?? {}, req.auth.user.customerId);
    res.status(201).json({ ok: true, pet: data });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Failed to create pet" });
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const result = await listCustomerNotifications(req.auth.rawUser.id);
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Failed to load notifications",
    });
  }
});

router.delete("/notifications/:notificationId", async (req, res) => {
  try {
    await dismissCustomerNotification(
      req.auth.rawUser.id,
      req.params.notificationId,
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Failed to dismiss notification",
    });
  }
});

router.patch("/notifications/read-all", async (req, res) => {
  try {
    await markAllCustomerNotificationsRead(req.auth.rawUser.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Failed to update notifications",
    });
  }
});

router.patch("/notifications/:notificationId/read", async (req, res) => {
  try {
    await markCustomerNotificationRead(
      req.auth.rawUser.id,
      req.params.notificationId,
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Failed to update notification",
    });
  }
});

router.get("/invoices/latest/pdf", async (req, res) => {
  try {
    const { buffer, filename } = await buildLatestCustomerInvoicePdf(
      req.auth.user.customerId,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      ok: false,
      message: error.message || "Failed to export invoice PDF",
    });
  }
});

router.get("/invoices/match/pdf", async (req, res) => {
  try {
    const { buffer, filename } = await buildMatchingCustomerInvoicePdf(
      req.auth.user.customerId,
      {
        petName: req.query.petName,
        serviceName: req.query.serviceName,
        serviceType: req.query.serviceType,
        date: req.query.date,
      },
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      ok: false,
      message: error.message || "Failed to export invoice PDF",
    });
  }
});

router.get("/invoices/:invoiceId/pdf", async (req, res) => {
  try {
    const { buffer, filename } = await buildCustomerInvoicePdf(
      req.params.invoiceId,
      req.auth.user.customerId,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      ok: false,
      message: error.message || "Failed to export invoice PDF",
    });
  }
});

router.put("/pets/:petId", async (req, res) => {
  try {
    console.debug("[routes] PUT /api/customer/pets/:petId body:", req.body, "customerId:", req.auth?.user?.customerId);
    const data = await updateCustomerPet(req.params.petId, req.body ?? {}, req.auth.user.customerId);
    res.json({ ok: true, pet: data });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Failed to update pet" });
  }
});

router.post("/reviews", async (req, res) => {
  try {
    const customerId = req.auth.user.customerId;
    const { appointmentId, rating, feedback } = req.body;

    if (!appointmentId || !rating) {
      return res.status(400).json({ ok: false, message: "Thiếu thông tin lịch hẹn hoặc đánh giá sao." });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ ok: false, message: "Đánh giá sao phải là số nguyên từ 1 đến 5." });
    }

    const { data: appointment, error: aptError } = await supabase
      .from("appointments")
      .select("id, doctor_id, staff_id, appointment_type, pet:pets(customer_id)")
      .eq("id", appointmentId)
      .single();

    if (aptError || !appointment) {
      return res.status(404).json({ ok: false, message: "Không tìm thấy lịch hẹn." });
    }

    if (appointment.pet?.customer_id !== customerId) {
      return res.status(403).json({ ok: false, message: "Bạn không có quyền đánh giá lịch hẹn này." });
    }

    let targetType = "CENTER";
    let targetId = null;

    if (appointment.appointment_type === "MEDICAL") {
      targetType = "DOCTOR";
      targetId = appointment.doctor_id;
    } else if (appointment.appointment_type === "GROOMING") {
      targetType = "GROOMING";
      targetId = appointment.staff_id;
    } else if (appointment.appointment_type === "BOARDING") {
      targetType = "BOARDING";
      targetId = appointment.staff_id;
    }

    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("appointment_id", appointmentId)
      .maybeSingle();

    if (existingReview) {
      return res.status(400).json({ ok: false, message: "Bạn đã đánh giá lịch hẹn này rồi." });
    }

    const { data: review, error: createError } = await supabase
      .from("reviews")
      .insert({
        customer_id: customerId,
        appointment_id: appointmentId,
        target_type: targetType,
        target_id: targetId,
        rating: ratingNum,
        feedback: feedback || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (createError) throw new Error(createError.message);

    res.status(201).json({ ok: true, review });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to submit review" });
  }
});

router.get("/reviews/:appointmentId", async (req, res) => {
  try {
    const customerId = req.auth.user.customerId;
    const appointmentId = Number(req.params.appointmentId);

    const { data: review, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("appointment_id", appointmentId)
      .eq("customer_id", customerId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    res.json({ ok: true, review });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load review" });
  }
});

module.exports = router;
