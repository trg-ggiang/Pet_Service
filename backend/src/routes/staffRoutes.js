const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const {
  getStaffProfile,
  listStaffAppointments,
  checkInAppointment,
  approveAppointmentRequest,
  listGroomingTasks,
  updateGroomingStatus,
  listBoardingGuests,
  updateBoardingDailyStatus,
  listPayments,
  markPaymentPaid,
  getStaffPortalSummary,
} = require("../services/staff/staffPortalService");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("staff"));

function sendError(res, error) {
  res.status(error.statusCode || 500).json({ ok: false, message: error.message });
}

router.get("/profile", async function getProfile(req, res) {
  try {
    const profile = await getStaffProfile(req.auth?.user?.staffId);
    res.json({ ok: true, profile });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/summary", async function getSummary(req, res) {
  try {
    const summary = await getStaffPortalSummary(req.auth?.user?.staffId);
    res.json({ ok: true, summary });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/appointments", async function getAppointments(req, res) {
  try {
    const appointments = await listStaffAppointments(req.auth?.user?.staffId);
    res.json({ ok: true, appointments });
  } catch (error) {
    sendError(res, error);
  }
});

router.put("/appointments/:id/checkin", async function checkIn(req, res) {
  try {
    await checkInAppointment(req.params.id, req.auth?.user?.staffId);
    res.json({ ok: true, message: "Check-in thành công" });
  } catch (error) {
    sendError(res, error);
  }
});


router.put("/appointments/:id/approve-request", async function approveRequest(req, res) {
  try {
    await approveAppointmentRequest(req.params.id, req.auth?.user?.staffId);
    res.json({ ok: true, message: "Đã duyệt yêu cầu lịch hẹn" });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/grooming", async function getGrooming(req, res) {
  try {
    const tasks = await listGroomingTasks(req.auth?.user?.staffId);
    res.json({ ok: true, tasks });
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/grooming/:id/status", async function patchGroomingStatus(req, res) {
  try {
    await updateGroomingStatus(req.params.id, req.body?.status, req.auth?.user?.staffId);
    res.json({ ok: true, message: "Đã cập nhật grooming" });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/boarding", async function getBoarding(req, res) {
  try {
    const guests = await listBoardingGuests();
    res.json({ ok: true, guests });
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/boarding/:id/daily-status", async function patchBoardingDailyStatus(req, res) {
  try {
    await updateBoardingDailyStatus(req.params.id, req.body?.todayStatus, req.auth?.user?.staffId);
    res.json({ ok: true, message: "Đã cập nhật lưu trú" });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/payments", async function getPayments(req, res) {
  try {
    const payments = await listPayments();
    res.json({ ok: true, payments });
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/payments/:id/pay", async function payInvoice(req, res) {
  try {
    await markPaymentPaid(req.params.id, req.body?.method);
    res.json({ ok: true, message: "Đã xác nhận thanh toán" });
  } catch (error) {
    sendError(res, error);
  }
});

module.exports = router;
