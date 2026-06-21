const { supabase } = require("../../lib/supabaseClient");

const CUSTOMER_GENDERS = new Set(["MALE", "FEMALE", "OTHER", "UNKNOWN"]);

function normalizeText(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeDate(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const error = new Error("Ngày sinh không hợp lệ");
    error.statusCode = 400;
    throw error;
  }
  const parsed = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed > new Date()) {
    const error = new Error("Ngày sinh không hợp lệ");
    error.statusCode = 400;
    throw error;
  }
  return text;
}

function normalizeGender(value) {
  const gender = String(value || "UNKNOWN").toUpperCase();
  return CUSTOMER_GENDERS.has(gender) ? gender : "UNKNOWN";
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 ? age : null;
}

function mapCustomerProfile(row) {
  const dateOfBirth = row.date_of_birth || null;
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name || "",
    email: row.users?.email || "",
    phone: row.phone || "",
    address: row.address || "",
    dateOfBirth,
    age: calculateAge(dateOfBirth),
    gender: row.gender || "UNKNOWN",
  };
}

async function getCustomerProfile(customerId) {
  const { data, error } = await supabase
    .from("customers")
    .select("id, user_id, full_name, phone, address, date_of_birth, gender, users:user_id(email)")
    .eq("id", customerId)
    .single();

  if (error) throw new Error(error.message);
  return mapCustomerProfile(data);
}

async function updateCustomerProfile(customerId, input = {}) {
  const fullName = normalizeText(input.fullName ?? input.full_name ?? input.name);
  if (!fullName) {
    const error = new Error("Họ tên không được để trống");
    error.statusCode = 400;
    throw error;
  }

  const payload = {
    full_name: fullName,
    phone: normalizeText(input.phone),
    address: normalizeText(input.address),
    date_of_birth: normalizeDate(input.dateOfBirth ?? input.date_of_birth),
    gender: normalizeGender(input.gender),
  };

  const { data, error } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", customerId)
    .select("id, user_id, full_name, phone, address, date_of_birth, gender, users:user_id(email)")
    .single();

  if (error) throw new Error(error.message);
  return mapCustomerProfile(data);
}

module.exports = {
  getCustomerProfile,
  updateCustomerProfile,
};
