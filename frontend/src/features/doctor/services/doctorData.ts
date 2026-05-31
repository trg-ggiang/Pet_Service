import { getAuthHeaders } from "../../../utils/authSession";
import { requestJson } from "../../../utils/requestJson";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";

type ApiOk<T> = { ok: true } & T;

export interface DoctorPrescription {
  drug: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
}

export interface DoctorMedicalRecord {
  id: string;
  appointmentId: number;
  date: string;
  dateShort: string;
  pet: string;
  petImage: string | null;
  species: string;
  breed: string;
  owner: string;
  phone: string;
  sex: string;
  age: string;
  weight: string;
  doctor: string;
  service: string;
  serviceColor: string;
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  onset: string;
  severity: number;
  vitals: {
    temp: string;
    heart: string;
    resp: string;
    spo2: string;
    weight: string;
  };
  sysResults: Array<{
    system: string;
    status: "normal" | "abnormal";
    note?: string;
  }>;
  diagnosis: string;
  diagnosisCode: string;
  clinicalNote: string;
  prescriptions: DoctorPrescription[];
  followUp: string;
  followUpDate: string;
  allergy: string;
}

export type DoctorStatsPeriod = "week" | "month" | "quarter";

export interface DoctorStatsPayload {
  kpis: {
    total: number;
    completed: number;
    newPatients: number;
    averageMinutes: number;
    completionRate: number;
  };
  trend: Array<{ label: string; total: number; completed: number }>;
  byDay: Array<{ label: string; value: number }>;
  speciesPie: Array<{ name: string; value: number; color: string }>;
  topServices: Array<{ name: string; count: number; pct: number }>;
  recentPatients: Array<{
    name: string;
    species: string;
    diagnosis: string;
    date: string;
    rating: number;
  }>;
  averageRating: number;
}

export type DoctorStatsResponse = Record<DoctorStatsPeriod, DoctorStatsPayload>;

export interface DoctorExamContext {
  appointment: {
    id: number;
    code: string;
    status: string;
    service: string;
    serviceType: string;
    note: string;
    date: string;
    time: string;
  };
  pet: {
    id: number;
    name: string;
    image: string | null;
    species: string;
    breed: string;
    sex: string;
    age: string;
    weight: string;
    allergies: string;
    owner: string;
    ownerPhone: string;
  };
  vaccinations: Array<{
    id: number;
    name: string;
    date: string;
    due: string;
    ok: boolean;
    note: string;
  }>;
  visitHistory: Array<{
    id: number;
    date: string;
    reason: string;
    doctor: string;
  }>;
  initialForm: {
    chiefComplaint: string;
    ownerNotes: string;
    vitals: {
      temp: string;
      heart: string;
      resp: string;
      spo2: string;
      weight: string;
    };
  };
}

function authInit(init?: RequestInit): RequestInit {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error("Vui lòng đăng nhập lại");
  }

  return {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers ?? {}),
    },
  };
}

export const doctorDataService = {
  async listRecords(): Promise<DoctorMedicalRecord[]> {
    const data = await requestJson<ApiOk<{ records: DoctorMedicalRecord[] }>>(
      `${API_BASE}/api/doctor/records`,
      authInit(),
    );
    return data.records || [];
  },

  async getStats(): Promise<DoctorStatsResponse> {
    const data = await requestJson<ApiOk<{ stats: DoctorStatsResponse }>>(
      `${API_BASE}/api/doctor/stats`,
      authInit(),
    );
    return data.stats;
  },

  async getExamContext(appointmentId: number): Promise<DoctorExamContext> {
    const data = await requestJson<ApiOk<{ context: DoctorExamContext }>>(
      `${API_BASE}/api/doctor/exam/${appointmentId}`,
      authInit(),
    );
    return data.context;
  },
};
