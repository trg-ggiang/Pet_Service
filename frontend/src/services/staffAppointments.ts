import { getAuthHeaders } from "../utils/authSession";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error("Vui lòng đăng nhập lại");
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...options.headers,
    },
  });

  return response;
}

export type StaffAppointmentStatus = "scheduled" | "checked_in" | "in_progress" | "completed";

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
  serviceType: string;
  status: StaffAppointmentStatus;
  queue?: string;
  note: string;
  createdAt: string;
}

interface StaffAppointmentsResponse {
  ok: boolean;
  appointments: StaffAppointment[];
  message?: string;
}

export const staffAppointmentsService = {
  async fetchPendingAppointments(): Promise<StaffAppointment[]> {
    console.log("[FRONTEND] fetchPendingAppointments called");
    const response = await fetchWithAuth("/api/staff/appointments");
    const data: StaffAppointmentsResponse = await response.json();

    console.log("[FRONTEND] fetchPendingAppointments response:", data);

    if (!data.ok) {
      throw new Error(data.message || "Không thể tải danh sách lịch hẹn");
    }

    return data.appointments || [];
  },

  async checkInAppointment(appointmentId: number): Promise<void> {
    console.log("[FRONTEND] checkInAppointment called with id:", appointmentId);
    const response = await fetchWithAuth(`/api/staff/appointments/${appointmentId}/checkin`, {
      method: "PUT",
    });
    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.message || "Không thể check-in");
    }

    console.log("[FRONTEND] Check-in thành công");
  },
};
