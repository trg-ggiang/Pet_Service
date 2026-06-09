export type Department =
  | "all"
  | "clinic"
  | "grooming"
  | "boarding"
  | "reception"
  | "admin";
export type WorkStatus = "active" | "on_leave" | "probation";
export type Shift = "Sáng (7–13h)" | "Chiều (13–19h)" | "Cả ngày (7–19h)";

export interface StaffMember {
  id: string;
  name: string;
  avatar: string;
  department: Exclude<Department, "all">;
  position: string;
  phone: string;
  email: string;
  joinDate: string;
  shift: Shift;
  workStatus: WorkStatus;
  locked: boolean;
  todayTasks: number;
  completedTasks: number;
  monthlyPerf: number;
  rating: number;
  notes: string;
  specialty?: string;
  room?: string;
  licenseNo?: string;
  todayPatients?: number;
}
