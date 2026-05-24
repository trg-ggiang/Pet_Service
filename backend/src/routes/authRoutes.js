const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { loginWithCredentials, registerCustomer } = require("../services/authService");

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

module.exports = router;