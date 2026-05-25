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
      .select("id, email, role, status, created_at, updated_at, deleted_at")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ ok: false, message: "Người dùng không tồn tại" });
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
    const role = req.auth?.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ ok: false, message: "Bạn không có quyền truy cập" });
    }
    next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
};