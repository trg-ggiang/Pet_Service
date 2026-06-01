import { requestJson } from "../../../utils/requestJson";
import { getAuthHeaders } from "../../../utils/authSession";

type ApiOk<T> = { ok: true } & T;

export type AdminUserRole = "customer" | "doctor" | "staff";

export type AdminCustomer = {
  id: string;
  role: "customer";
  name: string;
  phone: string;
  email: string;
  avatar: string;
  joinDate: string;
  locked: boolean;
  tier: "regular" | "vip";
  address: string;
  petCount: number;
  pets: string[];
  totalVisits: number;
  totalSpend: string;
  lastVisit: string;
};

export type AdminDoctor = {
  id: string;
  role: "doctor";
  name: string;
  phone: string;
  email: string;
  avatar: string;
  joinDate: string;
  locked: boolean;
  specialty: string;
  room: string;
  status: "active" | "on_leave";
  todayPatients: number;
  totalPatients: number;
  rating: number;
  licenseNo: string;
};

export type AdminStaffUser = {
  id: string;
  role: "staff";
  name: string;
  phone: string;
  email: string;
  avatar: string;
  joinDate: string;
  locked: boolean;
  department: string;
  position: string;
  status: "active" | "on_leave";
  tasksToday: number;
};

export type AdminService = {
  id: string;
  category: "clinic" | "vaccination" | "grooming" | "boarding";
  name: string;
  description: string;
  duration: number;
  durationUnit: "phút" | "đêm" | "ngày";
  pricingType: "fixed" | "variants";
  basePrice: number;
  variants?: Array<{ label: string; price: number }>;
  status: "active" | "inactive";
  bookingsMonth: number;
  revenueMonth: number;
  tag?: string;
};

export type AdminAppointment = {
  id: string;
  time: string;
  customer: string;
  pet: string;
  species: string;
  service: string;
  staff: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  amount: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export type AdminStaffMember = {
  id: string;
  name: string;
  avatar: string;
  department: "clinic" | "grooming" | "boarding" | "reception" | "admin";
  position: string;
  phone: string;
  email: string;
  joinDate: string;
  shift: "Sáng (7–13h)" | "Chiều (13–19h)" | "Cả ngày (7–19h)";
  workStatus: "active" | "on_leave" | "probation";
  locked: boolean;
  todayTasks: number;
  completedTasks: number;
  monthlyPerf: number;
  rating: number;
  notes: string;
  specialty?: string;
  room?: string;
  licenseNo?: string;
  todayPatients?: number;
};

export type AdminDashboard = {
  totals: {
    customers: number;
    doctors: number;
    staff: number;
    pets: number;
    services: number;
    activeServices: number;
    appointments: number;
    scheduledAppointments: number;
  };
};

function adminGet<T>(url: string) {
  return requestJson<ApiOk<T>>(url, {
    headers: getAuthHeaders(),
  });
}

export const adminService = {
  getDashboard() {
    return adminGet<{ dashboard: AdminDashboard }>("/api/admin/dashboard");
  },

  listUsers() {
    return adminGet<{
      customers: AdminCustomer[];
      doctors: AdminDoctor[];
      staff: AdminStaffUser[];
    }>("/api/admin/users");
  },

  listServices() {
    return adminGet<{ services: AdminService[] }>("/api/admin/services");
  },

  listAppointments() {
    return adminGet<{ appointments: AdminAppointment[] }>("/api/admin/appointments");
  },

  listStaff() {
    return adminGet<{ staff: AdminStaffMember[] }>("/api/admin/staff");
  },
};
