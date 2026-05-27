export type UserRole = "admin" | "doctor" | "staff" | "customer";

export type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
  status: string;
  fullName: string;
  customerId?: number | null;
  doctorId?: number | null;
  staffId?: number | null;
  phone?: string | null;
  address?: string | null;
  roomName?: string | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  remember: boolean;
};

export type AuthResponse = {
  ok: true;
  token: string;
  user: AuthUser;
};

export type SessionPayload = {
  token: string;
  user: AuthUser;
  remember: boolean;
};
