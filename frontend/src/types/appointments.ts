export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type ServiceType = "MEDICAL" | "GROOMING" | "BOARDING" | "VACCINE" | "FOOD" | "OTHER";
export type AppointmentType = "MEDICAL" | "GROOMING" | "BOARDING" | "MIXED";

export interface Service {
  id: number;
  name: string;
  type: string;
  typeLabel: string;
  appointmentType: string;
  price: number;
  description: string;
}

export interface ServicesResponse {
  ok: boolean;
  services: Service[];
  message?: string;
}

export interface Appointment {
  id: number;
  appointmentId: string;
  date: string;
  time: string;
  service: string;
  serviceType: AppointmentType;
  pet: string;
  petId: number;
  petSpecies: string;
  petImage: string | null;
  doctor: string;
  doctorId: number | null;
  icon: string;
  iconColor: string;
  iconBg: string;
  status: AppointmentStatus;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  statusText: string;
  statusBorder: string;
  note: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pet {
  id: number;
  name: string;
  species: string;
  image: string | null;
}

export interface Doctor {
  id: number;
  full_name: string;
  specialization: string | null;
}

export interface CreateAppointmentInput {
  petId: number;
  doctorId?: number | null;
  doctorScheduleSlotId?: number | null;
  appointmentType: AppointmentType;
  appointmentDate: string;
  appointmentTime: string;
  note?: string;
}

export interface AppointmentsResponse {
  ok: boolean;
  appointments: Appointment[];
  pets: Pet[];
  doctors: Doctor[];
  message?: string;
}

export interface CreateAppointmentResponse {
  ok: boolean;
  appointment: Appointment;
  message?: string;
}
