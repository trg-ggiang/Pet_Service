import { getAuthHeaders } from "../../../utils/authSession";
import { apiUrl } from "../../../utils/apiUrl";

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error("Vui lòng đăng nhập lại");
  }

  const response = await fetch(apiUrl(url), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message || "Request thất bại");
  }

  return data as T;
}

export type StaffAppointmentStatus = "scheduled" | "checked_in" | "in_progress" | "completed";
export type StaffServiceType = "exam" | "grooming" | "boarding" | "vaccination";
export type GroomingTaskStatus = "scheduled" | "in_progress" | "completed";
export type PaymentStatus = "pending" | "paid";
export type PaymentMethod = "cash" | "transfer" | "card";

export interface StaffProfile {
  id: number;
  fullName: string;
  initials: string;
  roleLabel: string;
  email: string;
  phone: string;
  address: string;
}

export interface StaffAppointmentRequest {
  type: "RESCHEDULE" | "CANCEL";
  date?: string;
  time?: string;
  reason?: string;
}

export interface StaffAppointment {
  id: string;
  appointmentId: number;
  date: string;
  time: string;
  petName: string;
  species: string;
  breed: string;
  owner: string;
  phone: string;
  service: string;
  serviceType: StaffServiceType;
  status: StaffAppointmentStatus;
  queue?: string;
  note: string;
  pendingRequest?: StaffAppointmentRequest | null;
  createdAt: string;
}

export interface GroomingTask {
  id: number;
  time: string;
  petName: string;
  breed: string;
  service: string;
  status: GroomingTaskStatus;
  owner: string;
  notes?: string;
}

export interface BoardingDailyStatus {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  cleaned: boolean;
  exercised: boolean;
  healthCheck: boolean;
}

export interface BoardingGuest {
  id: number;
  room: string;
  petName: string;
  species: string;
  breed: string;
  owner: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  foodType: string;
  mealsPerDay: number;
  specialNotes: string;
  todayStatus: BoardingDailyStatus;
}

export interface PaymentItem {
  id: string;
  invoiceId: number;
  date: string;
  petName: string;
  owner: string;
  service: string;
  amount: number;
  status: PaymentStatus;
}

export interface StaffPortalSummary {
  doneGrooming: number;
  totalGrooming: number;
  pendingCheckIn: number;
  needsFed: number;
  pendingPayments: number;
}

interface ProfileResponse {
  ok: boolean;
  profile: StaffProfile;
}

interface StaffAppointmentsResponse {
  ok: boolean;
  appointments: StaffAppointment[];
}

interface GroomingResponse {
  ok: boolean;
  tasks: GroomingTask[];
}

interface BoardingResponse {
  ok: boolean;
  guests: BoardingGuest[];
}

interface PaymentsResponse {
  ok: boolean;
  payments: PaymentItem[];
}

interface MutationResponse {
  ok: boolean;
  message: string;
}

interface SummaryResponse {
  ok: boolean;
  summary: StaffPortalSummary;
}

export const staffAppointmentsService = {
  async fetchProfile(): Promise<StaffProfile> {
    const data = await fetchWithAuth<ProfileResponse>("/api/staff/profile");
    return data.profile;
  },

  async fetchSummary(): Promise<StaffPortalSummary> {
    const data = await fetchWithAuth<SummaryResponse>("/api/staff/summary");
    return data.summary;
  },

  async fetchPendingAppointments(): Promise<StaffAppointment[]> {
    const data = await fetchWithAuth<StaffAppointmentsResponse>("/api/staff/appointments");
    return data.appointments || [];
  },

  async checkInAppointment(appointmentId: number): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/appointments/${appointmentId}/checkin`, {
      method: "PUT",
    });
  },

  async approveAppointmentRequest(appointmentId: number): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/appointments/${appointmentId}/approve-request`, {
      method: "PUT",
    });
  },

  async fetchGroomingTasks(): Promise<GroomingTask[]> {
    const data = await fetchWithAuth<GroomingResponse>("/api/staff/grooming");
    return data.tasks || [];
  },

  async updateGroomingStatus(taskId: number, status: "IN_PROGRESS" | "COMPLETED"): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/grooming/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async fetchBoardingGuests(): Promise<BoardingGuest[]> {
    const data = await fetchWithAuth<BoardingResponse>("/api/staff/boarding");
    return data.guests || [];
  },

  async updateBoardingDailyStatus(guestId: number, todayStatus: BoardingDailyStatus): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/boarding/${guestId}/daily-status`, {
      method: "PATCH",
      body: JSON.stringify({ todayStatus }),
    });
  },

  async fetchPayments(): Promise<PaymentItem[]> {
    const data = await fetchWithAuth<PaymentsResponse>("/api/staff/payments");
    return data.payments || [];
  },

  async markPaymentPaid(invoiceId: number, method: PaymentMethod): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/payments/${invoiceId}/pay`, {
      method: "PATCH",
      body: JSON.stringify({ method }),
    });
  },
};
