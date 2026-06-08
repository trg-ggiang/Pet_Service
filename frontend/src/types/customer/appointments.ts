export type CustomerAppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type CustomerAppointmentServiceType =
  | "Khám bệnh"
  | "Tiêm phòng"
  | "Grooming"
  | "Lưu trú";

export type CustomerAppointmentIconKey =
  | "medical"
  | "vaccine"
  | "grooming"
  | "boarding";

export type CustomerAppointment = {
  id: string;
  appointmentId: number;
  petId: number;
  date: string;
  time: string;
  service: string;
  pet: string;
  doctor: string;
  iconKey: CustomerAppointmentIconKey;
  iconColor: string;
  iconBg: string;
  status: CustomerAppointmentStatus;
  serviceType: CustomerAppointmentServiceType;
  room?: string;
  queue?: string;
  note?: string | null;
  serviceFee?: number;
  totalCost?: number;
  createdAt?: string;
  updatedAt?: string;
  createdAtLabel?: string;
  updatedAtLabel?: string;
};

export type CreateCustomerAppointmentInput = {
  petId: number;
  serviceId?: number;
  serviceName: string;
  serviceType: CustomerAppointmentServiceType;
  providerRole: "doctor" | "staff";
  providerId: number;
  date: string;
  time: string;
  note?: string | null;
};

export type RescheduleCustomerAppointmentInput = {
  date: string;
  time: string;
  reason: string;
};

export type CustomerAppointmentOptions = {
  services: Array<{
    id: number;
    name: string;
    serviceType: CustomerAppointmentServiceType;
    iconKey: CustomerAppointmentIconKey;
    iconColor: string;
    iconBg: string;
  }>;
  doctors?: Array<{ id: number; name: string }>;
};

export type CustomerAppointmentProvider = {
  role: "doctor" | "staff";
  id: number;
  name: string;
  serviceType: CustomerAppointmentServiceType;
  date: string;
  time: string;
  status: "PENDING";
  title?: string | null;
  description?: string | null;
  phone?: string | null;
  experienceYears?: number | null;
  room?: string;
  scheduleId?: number | null;
};

export type CustomerAppointmentProviderInput = {
  serviceId?: number;
  serviceType: CustomerAppointmentServiceType;
  date: string;
  time: string;
};

export type CustomerAppointmentStatusFilter =
  | "all"
  | "upcoming"
  | "in_progress"
  | "completed"
  | "cancelled";

export type CustomerAppointmentListParams = {
  status?: CustomerAppointmentStatusFilter;
  pet?: string;
  serviceType?: CustomerAppointmentServiceType | "all";
  page?: number;
  pageSize?: number;
};

export type CustomerAppointmentSummary = {
  total: number;
  filtered: number;
  statusCounts: Array<{ status: CustomerAppointmentStatusFilter; count: number }>;
  petOptions: string[];
  serviceTypeOptions: CustomerAppointmentServiceType[];
};

export type CustomerAppointmentPagination = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  from: number;
  to: number;
};

export type CustomerAppointmentListPayload = {
  appointments: CustomerAppointment[];
  summary: CustomerAppointmentSummary;
  pagination: CustomerAppointmentPagination;
};
