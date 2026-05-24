const bcrypt = require("bcryptjs");
const { supabase } = require("../lib/supabaseClient");
const { signAuthToken } = require("../lib/jwt");

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
    const { data: doctor } = await supabase
      .from("doctors")
      .select("id, full_name, phone, room_name, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    return buildBaseUser(user, {
      fullName: doctor?.full_name ?? user.email,
      doctorId: doctor?.id ?? null,
      roomName: doctor?.room_name ?? null,
      phone: doctor?.phone ?? null,
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
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const inputPassword = String(password || "");

  if (!normalizedEmail || !inputPassword) {
    throw new Error("Vui lòng nhập email và mật khẩu.");
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, password_hash, role, status, created_at, updated_at, deleted_at")
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
  const token = signAuthToken({ sub: String(user.id), role: authUser.role, email: user.email });

  return {
    token,
    user: authUser,
  };
}

async function registerCustomer(input) {
  const fullName = String(input.name || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const phone = String(input.phone || "").trim();
  const password = String(input.password || "");
  const address = String(input.address || "").trim();

  if (!fullName || !email || !phone || !password) {
    throw new Error("Vui lòng nhập đầy đủ họ tên, email, số điện thoại và mật khẩu.");
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
    })
    .select("id, email, role, status")
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

  const token = signAuthToken({ sub: String(insertedUser.id), role: authUser.role, email: insertedUser.email });

  return {
    token,
    user: authUser,
  };
}

module.exports = {
  DEMO_SEED_PASSWORD,
  getUserAuthContext,
  loginWithCredentials,
  registerCustomer,
};