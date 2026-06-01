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
    revenue: number;
    cages: number;
    occupiedCages: number;
  };
  appointmentsByStatus: Array<{ status: string; label: string; value: number }>;
  revenueByMonth: Array<{ label: string; value: number }>;
  recentActivity: Array<{ id: number | string; time: string; title: string; description: string }>;
  boardingRooms: Array<{
    id: number | string;
    number: string;
    status: "occupied" | "available";
    pet: string;
    species: string;
    owner: string;
  }>;
};

export type AdminReports = {
  summary: {
    revenue: number;
    customers: number;
    bookings: number;
    avgRevenue: number;
  };
  revenueByPeriod: Array<{
    label: string;
    clinic: number;
    vaccination: number;
    grooming: number;
    boarding: number;
  }>;
  topServices: Array<{
    id: number | string;
    name: string;
    category: "clinic" | "vaccination" | "grooming" | "boarding";
    bookings: number;
    revenue: number;
    rating: number;
  }>;
  appointmentStats: {
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    total: number;
  };
  staffPerformance: Array<{
    id: string;
    name: string;
    department: string;
    appointments: number;
    completed: number;
    revenue: number;
    completionRate: number;
  }>;
};

export type AdminSettings = {
  clinic: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    taxCode: string;
    openFrom: string;
    openTo: string;
    timezone: string;
  };
  account: {
    name: string;
    email: string;
    phone: string;
    role: string;
    initials: string;
  };
  notifications: Record<string, boolean>;
  payment: {
    method: "cash" | "bank" | "both";
    bankName: string;
    bankAccount: string;
    bankOwner: string;
    autoInvoice: boolean;
    vatEnabled: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessions: Array<{ device: string; location: string; time: string; current: boolean }>;
  };
};

export type AdminExamContext = {
  header: {
    appointmentCode: string;
    status: "scheduled" | "in_progress" | "completed" | "cancelled";
    time: string;
    room: string;
    provider: string;
  };
  pet: {
    name: string;
    species: string;
    breed: string;
    gender: string;
    weightKg: string;
    owner: string;
    phone: string;
    service: string;
    note: string;
  };
  vitals: Array<{ label: string; value: string; unit: string; state: "normal" | "warn" | "critical" }>;
  history: Array<{ date: string; service: string; outcome: string }>;
  options: {
    symptoms: Array<{ id: string; label: string; active: boolean }>;
    bodySystems: Array<{ id: string; label: string; status: "normal" | "abnormal" | "not_checked"; note: string }>;
    drugs: Array<{ id: number; name: string; dose: string; frequency: string; duration: string; note: string }>;
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

  getReports() {
    return adminGet<{ reports: AdminReports }>("/api/admin/reports");
  },

  getSettings() {
    return adminGet<{ settings: AdminSettings }>("/api/admin/settings");
  },

  getExamContext() {
    return adminGet<{ exam: AdminExamContext }>("/api/admin/exam-context");
  },
};
