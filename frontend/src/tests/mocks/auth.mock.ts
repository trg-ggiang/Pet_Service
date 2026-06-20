import type { AuthSession, AuthUser } from "../../types/auth";

export const mockAuthUser: AuthUser = {
  id: 1,
  email: "customer@example.test",
  role: "customer",
  status: "active",
  fullName: "Nguyen Van Minh",
  customerId: 10,
  phone: "0901000001",
  address: "20 Nguyen Hue",
};

export const mockAuthSession: AuthSession = {
  token: "frontend-test-token",
  user: mockAuthUser,
  remember: true,
};
