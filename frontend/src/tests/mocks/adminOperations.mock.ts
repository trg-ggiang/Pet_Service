import type {
  AdminAppointment,
  AdminAppointmentSummary,
  AdminDashboard,
  AdminReports,
  AdminService,
  AdminServicePayload,
  AdminServiceSummary,
  AdminSettings,
  AdminStaffMember,
  AdminStaffSummary,
  AdminUsersSummary,
  AdminCustomer,
  AdminDoctor,
  AdminStaffUser,
} from "../../features/admin/services/admin";

export const mockAdminCustomer: AdminCustomer = {
  id: "C101",
  role: "customer",
  name: "Nguyen Van Minh",
  phone: "0901000001",
  email: "customer@example.test",
  avatar: "NM",
  joinDate: "10/01/2026",
  locked: false,
  tier: "regular",
  address: "1 Nguyen Trai",
  dateOfBirth: "1995-05-10",
  age: 31,
  gender: "MALE",
  petCount: 1,
  pets: ["Milo (Dog)"],
  totalVisits: 2,
  totalSpend: "250.000",
  lastVisit: "20/06/2026",
};

export const mockAdminDoctor: AdminDoctor = {
  id: "D201",
  role: "doctor",
  name: "Dr Le An",
  phone: "",
  email: "doctor@example.test",
  avatar: "LA",
  joinDate: "11/01/2026",
  locked: false,
  specialty: "Noi khoa",
  room: "Room 2",
  status: "active",
  todayPatients: 2,
  totalPatients: 10,
  rating: 4.5,
  licenseNo: "",
};

export const mockAdminStaffUser: AdminStaffUser = {
  id: "S301",
  role: "staff",
  name: "Pham Staff",
  phone: "0903000003",
  email: "staff@example.test",
  avatar: "PS",
  joinDate: "12/01/2026",
  locked: true,
  department: "Van hanh",
  position: "Nhan vien",
  status: "on_leave",
  tasksToday: 3,
};

export const mockAdminUsersSummary: AdminUsersSummary = {
  role: "customers",
  search: "milo",
  totals: {
    customers: 1,
    doctors: 1,
    staff: 1,
    locked: 1,
    activeDoctors: 1,
    activeStaff: 0,
    vipCustomers: 0,
  },
  filtered: {
    customers: 1,
    doctors: 1,
    staff: 1,
  },
  tabs: [
    { role: "customers", label: "Khach hang", count: 1 },
    { role: "doctors", label: "Bac si", count: 1 },
    { role: "staff", label: "Nhan vien", count: 1 },
  ],
};

export const mockAdminService: AdminService = {
  id: "SV-701",
  category: "clinic",
  name: "General Exam",
  description: "Clinical exam",
  duration: 30,
  durationUnit: "phút",
  pricingType: "fixed",
  basePrice: 250000,
  variants: [],
  status: "active",
  specialistRoomType: null,
  bookingsMonth: 1,
  revenueMonth: 250000,
};

export const mockAdminServicePayload: AdminServicePayload = {
  category: "clinic",
  name: "General Exam",
  description: "Clinical exam",
  pricingType: "fixed",
  basePrice: 250000,
  status: "active",
  specialistRoomType: null,
};

export const mockAdminServiceSummary: AdminServiceSummary = {
  total: 1,
  filtered: 1,
  totalActive: 1,
  totalBookings: 1,
  totalRevenueMonth: 250000,
  totalRevenueMonthText: "250.000",
  topService: { name: "General Exam", bookingsMonth: 1 },
  categories: [
    { category: "clinic", count: 1, activeCount: 1, revenueMonth: 250000, revenueMonthText: "250.000" },
  ],
  activeCategory: { category: "clinic", count: 1, activeCount: 1, revenueMonth: 250000, revenueMonthText: "250.000" },
};

export const mockAdminAppointment: AdminAppointment = {
  id: "APT-501",
  time: "08:30",
  customer: "Nguyen Van Minh",
  pet: "Milo",
  species: "Dog",
  service: "General Exam",
  staff: "Dr Le An",
  status: "completed",
  amount: "250.000",
  phone: "0901000001",
  email: "",
  notes: "Annual check",
};

export const mockAdminAppointmentSummary: AdminAppointmentSummary = {
  total: 1,
  filtered: 1,
  totalAmount: 250000,
  totalAmountText: "250.000",
  tabs: [{ status: "completed", label: "Hoan thanh", count: 1 }],
  serviceOptions: ["General Exam"],
  staffOptions: ["Dr Le An"],
};

export const mockAdminStaffMember: AdminStaffMember = {
  id: "NV-C201",
  name: "Dr Le An",
  avatar: "LA",
  department: "clinic",
  position: "Bac si thu y",
  phone: "",
  email: "doctor@example.test",
  joinDate: "11/01/2026",
  shift: "Cả ngày (7–19h)",
  workStatus: "active",
  locked: false,
  todayTasks: 2,
  completedTasks: 1,
  monthlyPerf: 50,
  rating: 4.5,
  notes: "",
  specialty: "Noi khoa",
  room: "Room 2",
  licenseNo: "",
  todayPatients: 2,
};

export const mockAdminStaffSummary: AdminStaffSummary = {
  department: "clinic",
  status: "active",
  search: "le",
  total: 1,
  filtered: 1,
  activeFiltered: 1,
  active: 1,
  onLeave: 0,
  probation: 0,
  locked: 0,
  avgPerf: 50,
  avgRating: "4.5",
  departments: [{ department: "clinic", count: 1 }],
};

export const mockAdminDashboard: AdminDashboard = {
  totals: {
    customers: 1,
    doctors: 1,
    staff: 1,
    pets: 1,
    services: 1,
    activeServices: 1,
    appointments: 1,
    scheduledAppointments: 0,
    revenue: 250000,
    cages: 1,
    occupiedCages: 0,
  },
  appointmentsByStatus: [{ status: "completed", label: "Hoan thanh", value: 1 }],
  revenueByMonth: [{ label: "06/2026", value: 250000 }],
  recentActivity: [{ id: 501, time: "08:30", title: "Hoan thanh - Milo", description: "Nguyen Van Minh - Dr Le An" }],
  boardingRooms: [{ id: 801, number: "CAGE-01", status: "available", pet: "", species: "", owner: "" }],
};

export const mockAdminReports: AdminReports = {
  summary: {
    revenue: 250000,
    customers: 1,
    bookings: 1,
    avgRevenue: 250000,
  },
  revenueByPeriod: [{ label: "06/2026", clinic: 250000, vaccination: 0, grooming: 0, boarding: 0 }],
  topServices: [{ id: 701, name: "General Exam", category: "clinic", bookings: 1, revenue: 250000, rating: 0 }],
  appointmentStats: {
    scheduled: 0,
    inProgress: 0,
    completed: 1,
    cancelled: 0,
    total: 1,
  },
  staffPerformance: [
    { id: "doctor-201", name: "Dr Le An", department: "Noi khoa", appointments: 1, completed: 1, revenue: 0, completionRate: 100 },
  ],
};

export const mockAdminSettings: AdminSettings = {
  clinic: {
    name: "Pet Service",
    address: "1 Nguyen Trai",
    phone: "0900000000",
    email: "clinic@example.test",
    website: "",
    taxCode: "",
    openFrom: "07:30",
    openTo: "20:00",
    timezone: "Asia/Ho_Chi_Minh",
  },
  account: {
    name: "Admin",
    email: "admin@example.test",
    phone: "",
    role: "Quan tri vien",
    initials: "A",
  },
  notifications: { emailNewAppt: true },
  payment: {
    method: "both",
    bankName: "",
    bankAccount: "",
    bankOwner: "",
    autoInvoice: true,
    vatEnabled: false,
  },
  security: {
    twoFactorEnabled: false,
    sessions: [{ device: "Browser", location: "Current", time: "Now", current: true }],
  },
};
