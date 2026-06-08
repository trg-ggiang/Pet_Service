import { getAuthHeaders } from "../../../utils/authSession";
import { apiUrl } from "../../../utils/apiUrl";

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = getAuthHeaders();

  if (!authHeaders.Authorization) {
    throw new Error("Vui lòng đăng nhập lại");
  }

  const response = await fetch(apiUrl(url), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message || "Request thất bại");
  }

  return data as T;
}

export interface DoctorAppointment {
  id: string;
  appointmentId: number;
  date: string;
  time: string;
  endTime: string;
  roomName: string;
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
  statusKey: "scheduled" | "in_progress" | "completed";
  statusView: DoctorPortalStatusView;
  note: string;
  createdAt: string;
  scheduleRow: DoctorScheduleRow;
}

export interface DoctorPortalStatusView {
  label: string;
  cls: string;
  dot: string;
}

export interface DoctorScheduleRow {
  id: string;
  appointmentId: number;
  time: string;
  date: string;
  dateLabel: string;
  patient: string;
  species: string;
  owner: string;
  service: string;
  statusKey: DoctorAppointment["statusKey"];
  statusView: DoctorPortalStatusView;
}

export interface DoctorScheduleSummary {
  total: number;
  completed: number;
  inProgress: number;
  scheduled: number;
}

export interface DoctorScheduleMeta {
  title: string;
  dateLabel: string;
  roomLabel: string;
  activityLabel: string;
}

export interface DoctorNotification {
  id: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface DoctorNotificationsPayload {
  notifications: DoctorNotification[];
  summary: {
    total: number;
    unreadCount: number;
  };
}

export interface DoctorAppointmentsPayload {
  appointments: DoctorAppointment[];
  summary: DoctorScheduleSummary;
  meta: DoctorScheduleMeta;
}

export type ExamSystemStatus = "normal" | "abnormal" | "not_examined";

export interface ExamSystemEntry {
  status: ExamSystemStatus;
  notes: string;
}

export interface PrescriptionEntry {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  route: string;
  durationDays: number | null;
  instructions: string;
}

export interface DoctorExamRecord {
  chiefComplaint: string;
  selectedSymptoms: string[];
  duration: string;
  onset: string;
  severity: number;
  ownerNotes: string;
  vitals: {
    temp: string;
    heart: string;
    resp: string;
    spo2: string;
    weight: string;
  };
  systems: Record<string, ExamSystemEntry>;
  clinicalNote: string;
  prescriptions: PrescriptionEntry[];
  nextVisitDate: string | null;
  nextVisitTime: string;
}

export interface DoctorExamDetail {
  appointment: {
    id: number;
    displayId: string;
    status: string;
    statusLabel: string;
    serviceType: string;
    serviceLabel: string;
    date: string;
    dateLabel: string;
    time: string;
    endTime: string;
    roomName: string;
    note: string;
  };
  patientCard: {
    id: number | null;
    name: string;
    initials: string;
    imageUrl: string | null;
    subtitle: string;
    serviceBadge: string;
  };
  petInfoItems: Array<{
    key: string;
    icon: string;
    label: string;
    value: string;
  }>;
  owner: {
    id: number | null;
    fullName: string;
    phone: string;
    address: string;
  };
  riskAlerts: Array<{
    key: string;
    label: string;
    value: string;
  }>;
  vaccinations: Array<{
    id: number;
    name: string;
    dateGiven: string;
    nextDueDate: string | null;
    dateGivenLabel: string;
    nextDueDateLabel: string;
    note: string;
    isDue: boolean;
  }>;
  history: Array<{
    id: number;
    date: string;
    time: string;
    service: string;
    status: string;
    doctorName: string;
    diagnosisNote: string;
    nextVisitDate: string | null;
  }>;
  formSchema: {
    symptomOptions: Array<{ id: number; label: string }>;
    bodySystems: Array<{ id: string; label: string }>;
    durationOptions: Array<{ value: string; label: string }>;
    onsetOptions: Array<{ value: string; label: string }>;
    severityOptions: Array<{ value: string; label: string }>;
    systemStatusOptions: Array<{ value: string; label: string }>;
    vitalFields: Array<{
      key: keyof DoctorExamRecord["vitals"];
      icon: string;
      label: string;
      unit: string;
      tone: string;
    }>;
  };
  record: DoctorExamRecord;
}

interface DoctorAppointmentsResponse {
  ok: boolean;
  appointments: DoctorAppointment[];
  summary?: DoctorScheduleSummary;
  meta?: DoctorScheduleMeta;
  message?: string;
}

interface DoctorExamDetailResponse {
  ok: boolean;
  detail: DoctorExamDetail;
  message?: string;
}

interface MutationResponse {
  ok: boolean;
  message: string;
}

interface DoctorNotificationsResponse extends DoctorNotificationsPayload {
  ok: boolean;
  message?: string;
}

export const doctorAppointmentsService = {
  async fetchNotifications(): Promise<DoctorNotificationsPayload> {
    const data = await fetchWithAuth<DoctorNotificationsResponse>("/api/doctor/appointments/notifications");
    return {
      notifications: data.notifications || [],
      summary: data.summary || { total: 0, unreadCount: 0 },
    };
  },

  async markNotificationRead(notificationId: number): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/doctor/appointments/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  },

  async markAllNotificationsRead(): Promise<void> {
    await fetchWithAuth<MutationResponse>("/api/doctor/appointments/notifications/read-all", {
      method: "PATCH",
    });
  },

  async fetchAppointments(): Promise<DoctorAppointmentsPayload> {
    const data = await fetchWithAuth<DoctorAppointmentsResponse>("/api/doctor/appointments");
    const appointments = data.appointments || [];

    return {
      appointments,
      summary: data.summary || {
        total: appointments.length,
        completed: 0,
        inProgress: 0,
        scheduled: appointments.length,
      },
      meta: data.meta || {
        title: "Lịch khám của bác sĩ",
        dateLabel: "",
        roomLabel: "Phòng 1",
        activityLabel: "Phòng 1 · Đang hoạt động",
      },
    };
  },

  async startExam(appointmentId: number): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/doctor/appointments/${appointmentId}/start`, {
      method: "PUT",
    });
  },

  async fetchExamDetail(appointmentId: number): Promise<DoctorExamDetail> {
    const data = await fetchWithAuth<DoctorExamDetailResponse>(
      `/api/doctor/appointments/${appointmentId}/exam-detail`,
    );

    return data.detail;
  },

  async saveExamDraft(appointmentId: number, record: DoctorExamRecord): Promise<string> {
    const data = await fetchWithAuth<MutationResponse>(
      `/api/doctor/appointments/${appointmentId}/exam-draft`,
      {
        method: "PUT",
        body: JSON.stringify({ record }),
      },
    );

    return data.message;
  },

  async completeExamWithRecord(
    appointmentId: number,
    record: DoctorExamRecord,
  ): Promise<string> {
    const data = await fetchWithAuth<MutationResponse>(
      `/api/doctor/appointments/${appointmentId}/exam-complete`,
      {
        method: "PUT",
        body: JSON.stringify({ record }),
      },
    );

    return data.message;
  },

  async completeExam(appointmentId: number): Promise<void> {
    await fetchWithAuth<MutationResponse>(`/api/doctor/appointments/${appointmentId}/complete`, {
      method: "PUT",
    });
  },
};
