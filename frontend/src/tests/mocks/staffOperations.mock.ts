import type {
  BoardingDailyStatus,
  PaymentItem,
  StaffAppointment,
  StaffPortalSummary,
  StaffProfile,
} from "../../features/staff/services/staffAppointments";

export const mockStaffProfile: StaffProfile = {
  id: 20,
  fullName: "Le Staff",
  initials: "LS",
  roleLabel: "Nhan vien cham soc",
  email: "staff@example.test",
  phone: "0903000003",
  address: "2 Tran Hung Dao",
};

export const mockStaffAppointment: StaffAppointment = {
  id: "APT-000300",
  appointmentId: 300,
  date: "20/07/2099",
  time: "09:00",
  petName: "Milo",
  species: "Dog",
  breed: "Poodle",
  owner: "Nguyen Van Minh",
  phone: "0901000001",
  service: "Kham tong quat",
  serviceType: "exam",
  status: "scheduled",
  queue: "A300",
  note: "",
  createdAt: "2026-06-20T08:00:00.000Z",
};

export const mockStaffSummary: StaffPortalSummary = {
  doneGrooming: 1,
  totalGrooming: 2,
  pendingCheckIn: 3,
  needsFed: 1,
  pendingPayments: 4,
};

export const mockPayment: PaymentItem = {
  id: "INV-1000",
  invoiceId: 1000,
  date: "20/06/2026",
  petName: "Milo",
  owner: "Nguyen Van Minh",
  service: "Kham tong quat",
  amount: 250000,
  status: "pending",
};

export const mockBoardingStatus: BoardingDailyStatus = {
  breakfast: true,
  lunch: true,
  dinner: false,
  cleaned: true,
  exercised: false,
  healthCheck: true,
};
