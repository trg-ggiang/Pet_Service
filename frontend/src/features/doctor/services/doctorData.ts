import { getAuthHeaders } from "../../../utils/authSession";
import { apiUrl } from "../../../utils/apiUrl";
import { requestJson } from "../../../utils/requestJson";

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
  kpiCards: Array<{
    key: string;
    label: string;
    sub: string;
    value: number;
    icon: string;
    bg: string;
    color: string;
    unit?: string;
  }>;
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

export interface DoctorSettingsPayload {
  profile: {
    id: number;
    name: string;
    email: string;
    phone: string;
    specialty: string;
    room: string;
    bio: string;
    license: string;
    initials: string;
    statusLabel: string;
  };
  schedule: {
    rows: Array<{
      id: number;
      day: string;
      date: string;
      on: boolean;
      from: string;
      to: string;
      roomName: string;
      status: string;
    }>;
    options: {
      maxAppointments: string;
      slotDuration: string;
      breakFrom: string;
      breakTo: string;
    };
  };
  notifications: Record<string, boolean>;
  security: {
    twoFa: boolean;
    sessions: Array<{
      device: string;
      location: string;
      time: string;
      current: boolean;
    }>;
  };
}

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

function hasEncodingNoise(value: string) {
  return /[ÃÂ�]|áÂ|â€|â„|Æ|»/.test(value);
}

function normalizeDoctorSettings(settings: DoctorSettingsPayload): DoctorSettingsPayload {
  return {
    ...settings,
    profile: {
      ...settings.profile,
      specialty: hasEncodingNoise(settings.profile.specialty) ? "Nội khoa" : settings.profile.specialty,
      room: hasEncodingNoise(settings.profile.room) ? "Phòng 1" : settings.profile.room,
      statusLabel: hasEncodingNoise(settings.profile.statusLabel) ? "Đang làm việc" : settings.profile.statusLabel,
    },
    schedule: {
      ...settings.schedule,
      rows: settings.schedule.rows.map((row) => ({
        ...row,
        day: hasEncodingNoise(row.day)
          ? row.day.includes("7") ? "Thứ 7" : row.day.includes("6") ? "Thứ 6" : row.day.includes("5") ? "Thứ 5" : row.day.includes("4") ? "Thứ 4" : row.day.includes("3") ? "Thứ 3" : "Thứ 2"
          : row.day,
        roomName: hasEncodingNoise(row.roomName) ? "Phòng 1" : row.roomName,
      })),
    },
    security: {
      ...settings.security,
      sessions: settings.security.sessions.map((session) => ({
        ...session,
        location: hasEncodingNoise(session.location) ? "Thiết bị hiện tại" : session.location,
        time: hasEncodingNoise(session.time) ? "Hiện tại" : session.time,
      })),
    },
  };
}

export const doctorDataService = {
  async listRecords(filters: { search?: string; species?: string } = {}): Promise<DoctorMedicalRecord[]> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.species && filters.species !== "all") params.set("species", filters.species);
    const query = params.toString();
    const data = await requestJson<ApiOk<{ records: DoctorMedicalRecord[] }>>(
      apiUrl(`/api/doctor/records${query ? `?${query}` : ""}`),
      authInit(),
    );
    return data.records || [];
  },

  async getStats(): Promise<DoctorStatsResponse> {
    const data = await requestJson<ApiOk<{ stats: DoctorStatsResponse }>>(
      apiUrl("/api/doctor/stats"),
      authInit(),
    );
    return data.stats;
  },

  async getSettings(): Promise<DoctorSettingsPayload> {
    const data = await requestJson<ApiOk<{ settings: DoctorSettingsPayload }>>(
      apiUrl("/api/doctor/settings"),
      authInit(),
    );
    return normalizeDoctorSettings(data.settings);
  },

  async getExamContext(appointmentId: number): Promise<DoctorExamContext> {
    const data = await requestJson<ApiOk<{ context: DoctorExamContext }>>(
      apiUrl(`/api/doctor/exam/${appointmentId}`),
      authInit(),
    );
    return data.context;
  },
};
