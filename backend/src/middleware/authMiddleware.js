const { supabase } = require("../lib/supabaseClient");
const { verifyAuthToken } = require("../lib/jwt");
const { getUserAuthContext } = require("../services/authService");

function getBearerToken(headerValue) {
  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

async function authMiddleware(req, res, next) {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ ok: false, message: "Thiếu token xác thực" });
    }

    const payload = verifyAuthToken(token);
    const userId = Number(payload.sub);

    if (!Number.isFinite(userId)) {
      return res.status(401).json({ ok: false, message: "Token không hợp lệ" });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, role, status, auth_version, created_at, updated_at, deleted_at")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ ok: false, message: "Người dùng không tồn tại" });
    }

    if (String(user.status || "").toUpperCase() !== "ACTIVE" || user.deleted_at) {
      return res.status(401).json({ ok: false, message: "Tài khoản đã bị khóa hoặc vô hiệu hóa" });
    }

    if (Number(payload.authVersion) !== Number(user.auth_version ?? 0)) {
      return res.status(401).json({ ok: false, message: "Phiên đăng nhập đã hết hiệu lực" });
    }

    const authContext = await getUserAuthContext(user);

    req.auth = {
      token,
      payload,
      user: authContext,
      rawUser: user,
    };

    next();
  } catch (error) {
    return res.status(401).json({ ok: false, message: "Token hết hạn hoặc không hợp lệ" });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = String(req.auth?.user?.role || req.auth?.payload?.role || "").toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((allowedRole) => String(allowedRole).toLowerCase());
    if (!role || !normalizedAllowedRoles.includes(role)) {
      return res.status(403).json({ ok: false, message: "Bạn không có quyền truy cập" });
    }
    next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
};
