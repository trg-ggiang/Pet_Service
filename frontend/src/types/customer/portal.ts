import type { CustomerAppointmentStatus, CustomerAppointmentServiceType } from "./appointments";

export interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  colorId: string;
  initials: string;
  lastVisit: string;
  nextVaccine: string;
  healthy: boolean;
  image: string;
}

export type AptStatus = CustomerAppointmentStatus;
export type ServiceType = CustomerAppointmentServiceType;

export interface Apt {
  id: string;
  appointmentId?: number;
  petId?: number;
  date: string;
  time: string;
  service: string;
  pet: string;
  doctor: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  status: AptStatus;
  serviceType: ServiceType;
  room?: string;
  queue?: string;
  note?: string | null;
  serviceFee?: number;
  totalCost?: number;
  hasPrescription?: boolean;
  prescriptions?: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
    durationDays: number | null;
    instructions: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  createdAtLabel?: string;
  updatedAtLabel?: string;
}

export interface HistoryRecord {
  id: string;
  invoiceId?: number;
  sortAt?: string;
  date: string;
  service: string;
  services: string[];
  items: Array<{
    id: number;
    description: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
  pet: string;
  cost: string;
  status: "completed" | "pending" | "cancelled";
  type: "medical" | "vaccine" | "grooming" | "boarding";
  staff: string;
  details?: string;
  prescriptions?: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
    durationDays: number | null;
    instructions: string;
  }>;
}

export interface CustomerPortalNotification {
  id: number;
  type: "high" | "medium" | "info" | "promo";
  title: string;
  desc: string;
  time: string;
  read: boolean;
}
