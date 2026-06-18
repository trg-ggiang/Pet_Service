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
    throw new Error(data?.message || "Yêu cầu thất bại");
  }

  return data as T;
}

export type StaffAppointmentStatus = "scheduled" | "confirmed" | "in_progress" | "completed";
export type StaffServiceType = "exam" | "grooming" | "boarding";
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
  rawDate?: string;
  doctorName?: string | null;
  roomName?: string | null;
  staffName?: string | null;
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

export interface BoardingDailyUpdate {
  id: number;
  date: string;
  status: BoardingDailyStatus;
  note?: string;
  imageUrl?: string | null;
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
  todayNote?: string;
  todayImageUrl?: string | null;
  dailyUpdates?: BoardingDailyUpdate[];
}

export interface PendingBoarding {
  id: number;
  appointmentId: number;
  room: string;
  sizeType: string;
  sizeLabel: string;
  pricePerDay: number;
  checkIn: string;
  checkOut: string;
  rawCheckIn: string;
  rawCheckOut: string;
  nights: number;
  petName: string;
  species: string;
  breed: string;
  owner: string;
  phone: string;
  feedingInstruction: string;
  specialNote: string;
  habitNote: string;
  bookedAt: string;
}

export interface StaffBoardingRoom {
  id: number;
  cageNumber: string;
  status: string;
  pricePerDay: number;
  sizeType: string;
  sizeLabel: string;
  description: string;
  note: string;
  currentBoarding: {
    boardingId: number;
    boardingStatus: string;
    checkIn: string;
    checkOut: string;
    petName: string;
    species: string;
    owner: string;
    phone: string;
  } | null;
}

export interface BoardingCheckoutResult {
  invoiceId: number;
  nights: number;
  roomFee: number;
  foodFee: number;
  serviceFee: number;
  total: number;
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
  autoConfirmedCount?: number;
}

interface GroomingResponse {
  ok: boolean;
  tasks: GroomingTask[];
}

interface BoardingResponse {
  ok: boolean;
  guests: BoardingGuest[];
}

interface PendingBoardingsResponse {
  ok: boolean;
  bookings: PendingBoarding[];
}

interface BoardingRoomsResponse {
  ok: boolean;
  rooms: StaffBoardingRoom[];
}

interface CheckoutResponse {
  ok: boolean;
  message: string;
  invoiceId: number;
  nights: number;
  roomFee: number;
  foodFee: number;
  serviceFee: number;
  total: number;
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

  async fetchPendingAppointments(): Promise<{ appointments: StaffAppointment[]; autoConfirmedCount: number }> {
    const data = await fetchWithAuth<StaffAppointmentsResponse>("/api/staff/appointments");
    return { appointments: data.appointments || [], autoConfirmedCount: data.autoConfirmedCount ?? 0 };
  },

  async fetchAutoConfirmHours(): Promise<number> {
    const data = await fetchWithAuth<{ ok: boolean; hours: number }>("/api/staff/settings/auto-confirm");
    return data.hours;
  },

  async updateAutoConfirmHours(hours: number): Promise<void> {
    await fetchWithAuth<MutationResponse>("/api/staff/settings/auto-confirm", {
      method: "PUT",
      body: JSON.stringify({ hours }),
    });
  },

  async confirmAppointment(appointmentId: number): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/appointments/${appointmentId}/confirm`, {
      method: "PUT",
    });
  },

  async checkInAppointment(appointmentId: number): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/appointments/${appointmentId}/checkin`, {
      method: "PUT",
    });
  },

  async completeGroomingAppointment(appointmentId: number): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/appointments/${appointmentId}/complete-grooming`, {
      method: "PUT",
    });
  },

  async approveAppointmentRequest(appointmentId: number): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/appointments/${appointmentId}/approve-request`, {
      method: "PUT",
    });
  },

  async deleteAppointment(appointmentId: number): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/appointments/${appointmentId}`, {
      method: "DELETE",
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

  async fetchPendingBoardings(): Promise<PendingBoarding[]> {
    const data = await fetchWithAuth<PendingBoardingsResponse>("/api/staff/boarding/pending");
    return data.bookings || [];
  },

  async fetchConfirmedBoardings(): Promise<PendingBoarding[]> {
    const data = await fetchWithAuth<PendingBoardingsResponse>("/api/staff/boarding/confirmed");
    return data.bookings || [];
  },

  async fetchBoardingRooms(): Promise<StaffBoardingRoom[]> {
    const data = await fetchWithAuth<BoardingRoomsResponse>("/api/staff/boarding/rooms");
    return data.rooms || [];
  },

  async createBoardingRoom(input: { cageNumber: string; sizeType: string; pricePerDay: number; description?: string; note?: string }): Promise<void> {
    await fetchWithAuth<MutationResponse>("/api/staff/boarding/rooms", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateBoardingRoom(cageId: number, updates: { status?: string; description?: string; note?: string; sizeType?: string; pricePerDay?: number }): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/boarding/rooms/${cageId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async deleteBoardingRoom(cageId: number): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/boarding/rooms/${cageId}`, {
      method: "DELETE",
    });
  },

  async approveBoardingBooking(boardingId: number): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/boarding/${boardingId}/approve`, {
      method: "PUT",
    });
  },

  async checkInBoarding(boardingId: number): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/boarding/${boardingId}/check-in`, {
      method: "PUT",
    });
  },

  async checkOutBoarding(
    boardingId: number,
    fees: { foodFeePerDay?: number; extraServiceFee?: number; paymentMethod?: string },
  ): Promise<BoardingCheckoutResult> {
    const data = await fetchWithAuth<CheckoutResponse>(`/api/staff/boarding/${boardingId}/checkout`, {
      method: "POST",
      body: JSON.stringify(fees),
    });
    return {
      invoiceId: data.invoiceId,
      nights: data.nights,
      roomFee: data.roomFee,
      foodFee: data.foodFee,
      serviceFee: data.serviceFee,
      total: data.total,
    };
  },

  async updateBoardingDailyStatus(
    guestId: number,
    todayStatus: BoardingDailyStatus,
    options: { dailyNote?: string; imageDataUrl?: string | null } = {},
  ): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/staff/boarding/${guestId}/daily-status`, {
      method: "PATCH",
      body: JSON.stringify({ todayStatus, ...options }),
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

  // Walk-in helpers
  async searchCustomers(q: string): Promise<{ id: number; full_name: string; phone: string }[]> {
    const data = await fetchWithAuth<{ ok: boolean; customers: { id: number; full_name: string; phone: string }[] }>(
      `/api/staff/walk-in/customers?q=${encodeURIComponent(q)}`,
    );
    return data.customers ?? [];
  },

  async getCustomerPets(customerId: number): Promise<{ id: number; name: string; species: { name: string } | null; breed: { name: string } | null }[]> {
    const data = await fetchWithAuth<{ ok: boolean; pets: { id: number; name: string; species: { name: string } | null; breed: { name: string } | null }[] }>(
      `/api/staff/walk-in/pets/${customerId}`,
    );
    return data.pets ?? [];
  },

  async getDoctors(): Promise<{ id: number; full_name: string; specialization: string | null; room_name: string | null }[]> {
    const data = await fetchWithAuth<{ ok: boolean; doctors: { id: number; full_name: string; specialization: string | null; room_name: string | null }[] }>(
      "/api/staff/walk-in/doctors",
    );
    return data.doctors ?? [];
  },

  async createWalkIn(payload: { customerId: number; petId: number; doctorId: number; note?: string }): Promise<{ appointmentId: number; petName: string; doctorName: string }> {
    const data = await fetchWithAuth<{ ok: boolean; message: string; appointmentId: number; petName: string; doctorName: string }>(
      "/api/staff/appointments/walk-in",
      { method: "POST", body: JSON.stringify(payload) },
    );
    return { appointmentId: data.appointmentId, petName: data.petName, doctorName: data.doctorName };
  },
};
