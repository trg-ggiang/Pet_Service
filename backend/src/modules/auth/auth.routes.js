const express = require("express");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const {
  loginWithCredentials,
  registerCustomer,
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPassword,
} = require("./auth.service");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const result = await loginWithCredentials(req.body?.email, req.body?.password);
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Đăng nhập thất bại" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const result = await registerCustomer(req.body || {});
    res.status(201).json({ ok: true, ...result });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Đăng ký thất bại" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  res.json({ ok: true, user: req.auth.user });
});

router.post("/forgot-password/request", async (req, res) => {
  try {
    const result = await requestPasswordReset(req.body?.email);
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Không thể gửi mã xác minh" });
  }
});

router.post("/forgot-password/verify", async (req, res) => {
  try {
    await verifyPasswordResetCode(req.body?.email, req.body?.code);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Mã xác minh không hợp lệ" });
  }
});

router.post("/forgot-password/reset", async (req, res) => {
  try {
    await resetPassword(req.body?.email, req.body?.code, req.body?.password);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Không thể đổi mật khẩu" });
  }
});

module.exports = router;
