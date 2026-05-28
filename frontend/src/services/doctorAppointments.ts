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

export interface DoctorAppointment {
  id: string;
  appointmentId: number;
  date: string;
  time: string;
  petName: string;
  petImage: string | null;
  species: string;
  breed: string;
  owner: string;
  ownerPhone: string;
  service: string;
  serviceType: string;
  status: {
    label: string;
    color: string;
    bg: string;
  };
  note: string;
  createdAt: string;
}

interface DoctorAppointmentsResponse {
  ok: boolean;
  appointments: DoctorAppointment[];
  message?: string;
}

export const doctorAppointmentsService = {
  async fetchAppointments(): Promise<DoctorAppointment[]> {
    console.log("[FRONTEND] fetchDoctorAppointments called");
    const response = await fetchWithAuth("/api/doctor/appointments");
    const data: DoctorAppointmentsResponse = await response.json();

    console.log("[FRONTEND] fetchDoctorAppointments response:", data);

    if (!data.ok) {
      throw new Error(data.message || "Không thể tải danh sách lịch hẹn");
    }

    return data.appointments || [];
  },

  async startExam(appointmentId: number): Promise<void> {
    console.log("[FRONTEND] startExam called with id:", appointmentId);
    const response = await fetchWithAuth(`/api/doctor/appointments/${appointmentId}/start`, {
      method: "PUT",
    });
    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.message || "Không thể bắt đầu khám");
    }

    console.log("[FRONTEND] Bắt đầu khám thành công");
  },

  async completeExam(appointmentId: number): Promise<void> {
    console.log("[FRONTEND] completeExam called with id:", appointmentId);
    const response = await fetchWithAuth(`/api/doctor/appointments/${appointmentId}/complete`, {
      method: "PUT",
    });
    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.message || "Không thể hoàn thành khám");
    }

    console.log("[FRONTEND] Hoàn thành khám thành công");
  },
};
