import { requestJson } from "../../../utils/requestJson";
import { getAuthHeaders } from "../../../utils/authSession";

type ApiOk<T> = { ok: true } & T;

export type AdminUserRole = "customer" | "doctor" | "staff";

export type AdminUserLockResult = {
  id: string;
  role: AdminUserRole;
  locked: boolean;
};

export type AdminUsersTab = "customers" | "doctors" | "staff";

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
  dateOfBirth: string;
  age: number | null;
  gender: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
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

export type AdminUsersSummary = {
  role: AdminUsersTab;
  search: string;
  totals: {
    customers: number;
    doctors: number;
    staff: number;
    locked: number;
    activeDoctors: number;
    activeStaff: number;
    vipCustomers: number;
  };
  filtered: {
    customers: number;
    doctors: number;
    staff: number;
  };
  tabs: Array<{ role: AdminUsersTab; label: string; count: number }>;
};

export type SpecialistRoomType =
  | "XRAY" | "LAB" | "SURGERY" | "ENDOSCOPY" | "ULTRASOUND" | "DENTAL" | "OTHER_SPECIALIST";

export type AdminService = {
  id: string;
  category: "clinic" | "grooming" | "boarding";
  name: string;
  description: string;
  duration: number;
  durationUnit: "phút" | "đêm" | "ngày";
  pricingType: "fixed" | "variants";
  basePrice: number;
  variants?: Array<{ label: string; price: number }>;
  status: "active" | "inactive";
  specialistRoomType?: SpecialistRoomType | null;
  bookingsMonth: number;
  revenueMonth: number;
  tag?: string;
};

export type AdminServiceCategory = AdminService["category"];
export type AdminServiceStatus = AdminService["status"];

export type AdminServicePayload = {
  category: AdminServiceCategory;
  name: string;
  description: string;
  duration?: number;
  durationUnit?: AdminService["durationUnit"];
  pricingType?: AdminService["pricingType"];
  basePrice: number;
  variants?: AdminService["variants"];
  status: AdminServiceStatus;
  specialistRoomType?: SpecialistRoomType | null;
  tag?: string;
};

export type AdminServiceSummary = {
  total: number;
  filtered: number;
  totalActive: number;
  totalBookings: number;
  totalRevenueMonth: number;
  totalRevenueMonthText: string;
  topService: { name: string; bookingsMonth: number } | null;
  categories: Array<{
    category: AdminServiceCategory;
    count: number;
    activeCount: number;
    revenueMonth: number;
    revenueMonthText: string;
  }>;
  activeCategory: {
    category: AdminServiceCategory;
    count: number;
    activeCount: number;
    revenueMonth: number;
    revenueMonthText: string;
  };
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

export type AdminAppointmentStatus = AdminAppointment["status"];

export type AdminAppointmentSummary = {
  total: number;
  filtered: number;
  totalAmount: number;
  totalAmountText: string;
  tabs: Array<{ status: AdminAppointmentStatus | "all"; label: string; count: number }>;
  serviceOptions: string[];
  staffOptions: string[];
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

export type AdminStaffDepartment = AdminStaffMember["department"];
export type AdminStaffStatusFilter = AdminStaffMember["workStatus"] | "all" | "locked";

export type AdminStaffSummary = {
  department: AdminStaffDepartment | "all";
  status: AdminStaffStatusFilter;
  search: string;
  total: number;
  filtered: number;
  activeFiltered: number;
  active: number;
  onLeave: number;
  probation: number;
  locked: number;
  avgPerf: number;
  avgRating: string;
  departments: Array<{ department: AdminStaffDepartment; count: number }>;
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
    category: "clinic" | "grooming" | "boarding";
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

export type AdminHealthTrends = {
  summary: {
    totalPets: number;
    totalVisits: number;
    revisitRate: number;
    petsWithAllergies: number;
    petsWithChronic: number;
    avgVisitsPerPet: number;
  };
  topDiseases: Array<{ name: string; count: number }>;
  visitTrend: Array<{ label: string; count: number }>;
  speciesDistribution: Array<{ name: string; count: number }>;
  avgWeightBySpecies: Array<{ name: string; avgWeight: number }>;
  topMedicines: Array<{ name: string; count: number }>;
  petGrowthTrend: Array<{ label: string; count: number }>;
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

export type AdminDoctorScheduleRow = {
  date: string;
  from: string;
  to: string;
  roomName: string;
  on: boolean;
};

export type AdminDoctorBasic = {
  id: number;
  name: string;
  room: string;
};

export type AdminWeekScheduleEntry = {
  doctorId: number;
  date: string;
  from: string;
  to: string;
  roomName: string;
  slotCount: number;
  bookedCount: number;
};

export type AdminEmailTemplate = {
  subject: string;
  heading: string;
  message: string;
};

export type AdminEmailTemplates = Record<string, AdminEmailTemplate>;

function adminGet<T>(url: string) {
  return requestJson<ApiOk<T>>(url, {
    headers: getAuthHeaders(),
  });
}

function adminPost<T>(url: string, body: unknown) {
  return requestJson<ApiOk<T>>(url, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function adminPatch<T>(url: string, body: unknown) {
  return requestJson<ApiOk<T>>(url, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function adminPut<T>(url: string, body: unknown) {
  return requestJson<ApiOk<T>>(url, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function adminDelete<T>(url: string) {
  return requestJson<ApiOk<T>>(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}

export const adminService = {
  getDashboard() {
    return adminGet<{ dashboard: AdminDashboard }>("/api/admin/dashboard");
  },

  listUsers(params?: { role?: AdminUsersTab; search?: string }) {
    const query = new URLSearchParams();
    if (params?.role) query.set("role", params.role);
    if (params?.search?.trim()) query.set("search", params.search.trim());
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return adminGet<{
      customers: AdminCustomer[];
      doctors: AdminDoctor[];
      staff: AdminStaffUser[];
      summary: AdminUsersSummary;
    }>(`/api/admin/users${suffix}`);
  },

  updateUserLock(role: AdminUserRole, id: string, locked: boolean) {
    return adminPatch<{ user: AdminUserLockResult }>(`/api/admin/users/${role}/${encodeURIComponent(id)}/lock`, { locked });
  },

  listServices(params?: { category?: AdminServiceCategory | "all"; status?: AdminServiceStatus | "all"; search?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.status && params.status !== "all") query.set("status", params.status);
    if (params?.search?.trim()) query.set("search", params.search.trim());
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return adminGet<{ services: AdminService[]; summary: AdminServiceSummary }>(`/api/admin/services${suffix}`);
  },

  createService(payload: AdminServicePayload) {
    return adminPost<{ service: AdminService }>("/api/admin/services", payload);
  },

  updateService(id: string, payload: AdminServicePayload) {
    return adminPatch<{ service: AdminService }>(`/api/admin/services/${encodeURIComponent(id)}`, payload);
  },

  updateServiceStatus(id: string, status: AdminServiceStatus) {
    return adminPatch<{ service: AdminService }>(`/api/admin/services/${encodeURIComponent(id)}/status`, { status });
  },

  deleteService(id: string) {
    return adminDelete<{ id: string }>(`/api/admin/services/${encodeURIComponent(id)}`);
  },

  listAppointments(params?: { status?: AdminAppointmentStatus | "all"; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "all") query.set("status", params.status);
    if (params?.search?.trim()) query.set("search", params.search.trim());
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return adminGet<{ appointments: AdminAppointment[]; summary: AdminAppointmentSummary }>(`/api/admin/appointments${suffix}`);
  },

  updateAppointmentStatus(id: string, status: AdminAppointmentStatus) {
    return adminPatch<{ appointment: AdminAppointment }>(`/api/admin/appointments/${encodeURIComponent(id)}/status`, { status });
  },

  listStaff(params?: { department?: AdminStaffDepartment | "all"; status?: AdminStaffStatusFilter; search?: string }) {
    const query = new URLSearchParams();
    if (params?.department) query.set("department", params.department);
    if (params?.status && params.status !== "all") query.set("status", params.status);
    if (params?.search?.trim()) query.set("search", params.search.trim());
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return adminGet<{ staff: AdminStaffMember[]; summary: AdminStaffSummary }>(`/api/admin/staff${suffix}`);
  },

  updateStaffLock(id: string, locked: boolean) {
    return adminPatch<{ user: AdminUserLockResult }>(`/api/admin/staff/${encodeURIComponent(id)}/lock`, { locked });
  },

  updateUserProfile(role: AdminUserRole, id: string, data: { name?: string; phone?: string; address?: string; dateOfBirth?: string | null; gender?: string; specialty?: string; room?: string }) {
    return adminPatch<{ id: string; role: string }>(`/api/admin/users/${role}/${encodeURIComponent(id)}/profile`, data);
  },

  updateStaffProfile(id: string, data: { name?: string; phone?: string; address?: string; specialty?: string; room?: string; position?: string }) {
    return adminPatch<{ id: string; role: string }>(`/api/admin/staff/${encodeURIComponent(id)}/profile`, data);
  },

  createStaff(data: { name: string; email: string; password: string; phone?: string; address?: string; role?: string; specialty?: string; room?: string }) {
    return adminPost<{ member: { userId: string; name: string; email: string; role: string } }>("/api/admin/staff", data);
  },

  getDoctorWeekSchedules(weekStart: string) {
    return adminGet<{ doctors: AdminDoctorBasic[]; schedules: AdminWeekScheduleEntry[]; weekStart: string; weekEnd: string }>(
      `/api/admin/doctors/schedules?weekStart=${encodeURIComponent(weekStart)}`,
    );
  },

  saveDoctorSchedule(doctorId: string, rows: AdminDoctorScheduleRow[]) {
    return adminPut<{ message: string; slotCount: number }>(
      `/api/admin/doctors/${encodeURIComponent(doctorId)}/schedules`,
      { rows, slotDuration: 30 },
    );
  },

  getReports() {
    return adminGet<{ reports: AdminReports }>("/api/admin/reports");
  },

  getHealthTrends() {
    return adminGet<{ trends: AdminHealthTrends }>("/api/admin/health-trends");
  },

  getSettings() {
    return adminGet<{ settings: AdminSettings }>("/api/admin/settings");
  },

  updateSettings(settings: AdminSettings) {
    return adminPut<{ settings: AdminSettings }>("/api/admin/settings", settings);
  },

  getEmailTemplates() {
    return adminGet<{ templates: AdminEmailTemplates }>("/api/admin/email-templates");
  },

  updateEmailTemplates(templates: AdminEmailTemplates) {
    return adminPut<{ templates: AdminEmailTemplates }>("/api/admin/email-templates", { templates });
  },

  sendTestEmail(input: { to: string; subject: string; heading: string; message: string }) {
    return adminPost<{ sent: boolean }>("/api/admin/email-templates/test", input);
  },

};
