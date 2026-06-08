const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const {
  getCustomerPetDashboard,
  getPetDetail,
  createCustomerPet,
  updateCustomerPet,
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
} = require("../services/customer/customerAppointmentsService");
const {
  listCustomerServiceHistoryView,
} = require("../services/customer/customerServiceHistoryService");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("customer"));

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

module.exports = router;
