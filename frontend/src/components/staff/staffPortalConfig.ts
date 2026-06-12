import type React from "react";
import {
  BedDouble,
  Calendar,
  DollarSign,
  Home,
  Scissors,
  Settings,
  Stethoscope,
} from "lucide-react";
import type {
  StaffAppointmentStatus,
  StaffServiceType,
} from "../../features/staff/services/staffAppointments";

export const NAV_ITEMS = [
  { id: "appointments" as const, label: "Lịch hẹn", icon: Calendar },
  { id: "grooming" as const, label: "Grooming", icon: Scissors },
  { id: "boarding" as const, label: "Lưu trú", icon: BedDouble },
  { id: "payments" as const, label: "Thanh toán", icon: DollarSign },
  { id: "settings" as const, label: "Cài đặt", icon: Settings },
];

export type StaffNavId = typeof NAV_ITEMS[number]["id"];

export const APT_STATUS_CONFIG: Record<StaffAppointmentStatus, { label: string; color: string; bg: string; border: string }> = {
  scheduled:   { label: "Chờ xác nhận",  color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  confirmed:   { label: "Chờ check-in",  color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
  in_progress: { label: "Đang thực hiện", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  completed:   { label: "Hoàn thành",    color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
};

export const SERVICE_ICONS: Record<StaffServiceType, { icon: React.ElementType; color: string; bg: string }> = {
  exam: { icon: Stethoscope, color: "#0891B2", bg: "#ECFEFF" },
  grooming: { icon: Scissors, color: "#D97706", bg: "#FFFBEB" },
  boarding: { icon: Home, color: "#7C3AED", bg: "#F5F3FF" },
};
