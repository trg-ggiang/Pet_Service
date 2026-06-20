const bcrypt = require("bcryptjs");

const activeCustomerUser = {
  id: 1,
  email: "customer@example.test",
  password_hash: bcrypt.hashSync("PetService@123", 4),
  role: "CUSTOMER",
  status: "ACTIVE",
  auth_version: 0,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
  deleted_at: null,
};

const lockedCustomerUser = {
  ...activeCustomerUser,
  id: 2,
  email: "locked@example.test",
  status: "LOCKED",
};

const customerProfile = {
  id: 10,
  full_name: "Nguyen Van Minh",
  phone: "0901000001",
  address: "20 Nguyen Hue",
  user_id: activeCustomerUser.id,
};

const registerInput = {
  name: "Tran Thi Hoa",
  email: "hoa@example.test",
  phone: "0902000002",
  password: "PetService@123",
  address: "1 Le Loi",
};

module.exports = {
  activeCustomerUser,
  customerProfile,
  lockedCustomerUser,
  registerInput,
};
