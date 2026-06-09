export type Status = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  time: string;
  customer: string;
  pet: string;
  species: "Chó" | "Mèo";
  service: string;
  staff: string;
  status: Status;
  amount: string;
  phone?: string;
  email?: string;
  notes?: string;
}
