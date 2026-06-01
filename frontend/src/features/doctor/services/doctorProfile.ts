import { getAuthHeaders } from "../../../utils/authSession";
import { apiUrl } from "../../../utils/apiUrl";

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
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

  return response;
}

export interface DoctorProfile {
  id: number;
  fullName: string;
  email: string;
  specialization: string;
  degree: string;
  experienceYears: number;
  roomName: string;
}

interface DoctorProfileResponse {
  ok: boolean;
  profile: DoctorProfile;
  message?: string;
}

export const doctorProfileService = {
  async fetchProfile(): Promise<DoctorProfile> {
    console.log("[FRONTEND] fetchDoctorProfile called");
    const response = await fetchWithAuth("/api/doctor/profile");
    const data: DoctorProfileResponse = await response.json();

    console.log("[FRONTEND] fetchDoctorProfile response:", data);

    if (!data.ok) {
      throw new Error(data.message || "Không thể tải thông tin bác sĩ");
    }

    return data.profile;
  },
};
