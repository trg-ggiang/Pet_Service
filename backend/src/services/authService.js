const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { supabase } = require("../lib/supabaseClient");
const { signAuthToken } = require("../lib/jwt");
const { sendTemplateEmail } = require("./emailService");

const DEMO_SEED_PASSWORD = "PetService@123";

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function buildBaseUser(user, extra = {}) {
  return {
    id: user.id,
    email: user.email,
    role: normalizeRole(user.role),
    status: normalizeRole(user.status),
    ...extra,
  };
}

async function sendPasswordResetEmail({ email, code, expiresAt }) {
  try {
    const result = await sendTemplateEmail("password_reset", email, {
      code,
      expiresAt: new Date(expiresAt).toLocaleString("vi-VN"),
    });
    return result.sent;
  } catch (error) {
    console.error("[AUTH] SMTP email failed:", error.message);
    throw new Error("Không thể gửi mã xác minh qua email.");
  }
}

async function getUserAuthContext(user) {
  const role = normalizeRole(user.role);

  if (role === "customer") {
    const { data: customer, error } = await supabase
      .from("customers")
      .select("id, full_name, phone, address, user_id")
      .eq("user_id", user.id)
      .single();

    if (error || !customer) {
      return buildBaseUser(user, {
        fullName: user.email,
        customerId: null,
      });
    }

    return buildBaseUser(user, {
      fullName: customer.full_name,
      phone: customer.phone,
      address: customer.address,
      customerId: customer.id,
    });
  }

  if (role === "doctor") {
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("id, full_name, room_name, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    return buildBaseUser(user, {
      fullName: doctor?.full_name ?? user.email,
      doctorId: doctor?.id ?? null,
      roomName: doctor?.room_name ?? null,
      phone: null,
    });
  }

  if (role === "staff") {
    const { data: staff } = await supabase
      .from("staffs")
      .select("id, full_name, phone, address, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    return buildBaseUser(user, {
      fullName: staff?.full_name ?? user.email,
      staffId: staff?.id ?? null,
      phone: staff?.phone ?? null,
      address: staff?.address ?? null,
    });
  }

  return buildBaseUser(user, {
    fullName: "Quản trị viên",
  });
}

async function loginWithCredentials(email, password) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const inputPassword = String(password || "");

  if (!normalizedEmail || !inputPassword) {
    throw new Error("Vui lòng nhập email và mật khẩu.");
  }

  const { data: user, error } = await supabase
    .from("users")
    .select(
      "id, email, password_hash, role, status, auth_version, created_at, updated_at, deleted_at",
    )
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("Email hoặc mật khẩu không đúng.");
  }

  if (normalizeRole(user.status) !== "active") {
    throw new Error("Tài khoản đã bị khóa hoặc chưa kích hoạt.");
  }

  const passwordOk = await bcrypt.compare(inputPassword, user.password_hash);

  if (!passwordOk) {
    throw new Error("Email hoặc mật khẩu không đúng.");
  }

  const authUser = await getUserAuthContext(user);
  const token = signAuthToken({
    sub: String(user.id),
    role: authUser.role,
    email: user.email,
    authVersion: user.auth_version ?? 0,
  });

  return {
    token,
    user: authUser,
  };
}

async function registerCustomer(input) {
  const fullName = String(input.name || "").trim();
  const email = String(input.email || "")
    .trim()
    .toLowerCase();
  const phone = String(input.phone || "").trim();
  const password = String(input.password || "");
  const address = String(input.address || "").trim();
  const now = new Date().toISOString();

  if (!fullName || !email || !phone || !password) {
    throw new Error(
      "Vui lòng nhập đầy đủ họ tên, email, số điện thoại và mật khẩu.",
    );
  }

  if (password.length < 6) {
    throw new Error("Mật khẩu tối thiểu 6 ký tự.");
  }

  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existingUser) {
    throw new Error("Email này đã được sử dụng.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data: insertedUser, error: userError } = await supabase
    .from("users")
    .insert({
      email,
      password_hash: passwordHash,
      role: "CUSTOMER",
      status: "ACTIVE",
      updated_at: now,
    })
    .select("id, email, role, status, auth_version")
    .single();

  if (userError) {
    throw new Error(userError.message);
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      user_id: insertedUser.id,
      full_name: fullName,
      phone,
      address: address || null,
    })
    .select("id, full_name, phone, address, user_id")
    .single();

  if (customerError) {
    await supabase.from("users").delete().eq("id", insertedUser.id);
    throw new Error(customerError.message);
  }

  const authUser = buildBaseUser(insertedUser, {
    fullName: customer.full_name,
    phone: customer.phone,
    address: customer.address,
    customerId: customer.id,
  });

  const token = signAuthToken({
    sub: String(insertedUser.id),
    role: authUser.role,
    email: insertedUser.email,
    authVersion: insertedUser.auth_version ?? 0,
  });

  return {
    token,
    user: authUser,
  };
}

async function requestPasswordReset(emailInput) {
  const email = String(emailInput || "").trim().toLowerCase();
  if (!email) throw new Error("Vui lòng nhập email.");

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, status")
    .ilike("email", email)
    .maybeSingle();
  if (error) throw new Error(error.message);

  // Do not reveal whether an email exists.
  if (!user || String(user.status || "").toUpperCase() !== "ACTIVE") {
    return {};
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase
    .from("password_reset_tokens")
    .delete()
    .eq("user_id", user.id)
    .is("used_at", null);

  const { error: insertError } = await supabase.from("password_reset_tokens").insert({
    user_id: user.id,
    code_hash: codeHash,
    expires_at: expiresAt,
  });
  if (insertError) throw new Error(insertError.message);

  let emailSent = false;
  try {
    emailSent = await sendPasswordResetEmail({ email: user.email, code, expiresAt });
  } catch (sendError) {
    await supabase.from("password_reset_tokens").delete().eq("user_id", user.id).is("used_at", null);
    throw sendError;
  }

  if (!emailSent && process.env.NODE_ENV === "production") {
    await supabase.from("password_reset_tokens").delete().eq("user_id", user.id).is("used_at", null);
    throw new Error("SMTP_USER hoặc SMTP_APP_PASSWORD chưa được cấu hình.");
  }

  return emailSent || process.env.NODE_ENV === "production" ? {} : { devCode: code };
}

async function findValidResetToken(emailInput, codeInput) {
  const email = String(emailInput || "").trim().toLowerCase();
  const code = String(codeInput || "").trim();
  if (!email || !/^\d{6}$/.test(code)) throw new Error("Mã xác minh không hợp lệ.");

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, auth_version")
    .ilike("email", email)
    .maybeSingle();
  if (userError) throw new Error(userError.message);
  if (!user) throw new Error("Mã xác minh không hợp lệ hoặc đã hết hạn.");

  const { data: tokens, error } = await supabase
    .from("password_reset_tokens")
    .select("id, code_hash, expires_at")
    .eq("user_id", user.id)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw new Error(error.message);

  for (const token of tokens || []) {
    if (await bcrypt.compare(code, token.code_hash)) {
      return { userId: user.id, authVersion: user.auth_version ?? 0 };
    }
  }
  throw new Error("Mã xác minh không hợp lệ hoặc đã hết hạn.");
}

async function verifyPasswordResetCode(email, code) {
  await findValidResetToken(email, code);
}

async function resetPassword(email, code, passwordInput) {
  const password = String(passwordInput || "");
  if (password.length < 8) throw new Error("Mật khẩu phải có ít nhất 8 ký tự.");
  const { userId, authVersion } = await findValidResetToken(email, code);
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: passwordHash, auth_version: authVersion + 1, updated_at: now })
    .eq("id", userId);
  if (updateError) throw new Error(updateError.message);

  const { error: tokenError } = await supabase
    .from("password_reset_tokens")
    .update({ used_at: now })
    .eq("user_id", userId)
    .is("used_at", null);
  if (tokenError) throw new Error(tokenError.message);
}

module.exports = {
  DEMO_SEED_PASSWORD,
  getUserAuthContext,
  loginWithCredentials,
  registerCustomer,
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPassword,
};
