import type {
  Appointment,
  CreateAppointmentInput,
  AppointmentsResponse,
  CreateAppointmentResponse,
  Pet,
  Doctor,
} from "../types/appointments";
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

export const appointmentsService = {
  async fetchAppointments(): Promise<{ appointments: Appointment[]; pets: Pet[]; doctors: Doctor[] }> {
    console.log("[FRONTEND] fetchAppointments called");
    const response = await fetchWithAuth("/api/customer/appointments");
    const data: AppointmentsResponse = await response.json();

    console.log("[FRONTEND] fetchAppointments response:", data);

    if (!data.ok) {
      throw new Error(data.message || "Không thể tải danh sách lịch hẹn");
    }

    return {
      appointments: data.appointments || [],
      pets: data.pets || [],
      doctors: data.doctors || [],
    };
  },

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    console.log("[FRONTEND] createAppointment called with:", input);

    const payload = {
      petId: input.petId,
      doctorId: input.doctorId,
      appointmentType: input.appointmentType,
      appointmentDate: input.appointmentDate,
      appointmentTime: input.appointmentTime,
      note: input.note,
    };

    const response = await fetchWithAuth("/api/customer/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data: CreateAppointmentResponse = await response.json();

    console.log("[FRONTEND] createAppointment response:", data);

    if (!data.ok) {
      throw new Error(data.message || "Không thể tạo lịch hẹn");
    }

    return data.appointment;
  },

  async cancelAppointment(appointmentId: number, reason: string): Promise<void> {
    const response = await fetchWithAuth(`/api/customer/appointments/${appointmentId}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    });
    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.message || "Không thể hủy lịch hẹn");
    }
  },

  async getAppointmentDetail(appointmentId: number): Promise<Appointment> {
    const response = await fetchWithAuth(`/api/customer/appointments/${appointmentId}`);
    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.message || "Không tìm thấy lịch hẹn");
    }

    return data.appointment;
  },
};
