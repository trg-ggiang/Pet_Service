import { AlertTriangle, Bell, Calendar, Info, Megaphone, Star, Stethoscope, Syringe } from "lucide-react";
import type { CustomerAppointment } from "../../types/customer/appointments";
import type { Apt, ServiceType } from "../../types/customer/portal";
import type { CustomerNotification } from "../../types/customer/notifications";

const PET_COLOR_PRESETS = [
  { id: "amber", from: "#FB923C", to: "#EA580C", ring: "#FBBF24" },
  { id: "slate", from: "#94A3B8", to: "#475569", ring: "#64748B" },
  { id: "cyan", from: "#22D3EE", to: "#0891B2", ring: "#06B6D4" },
  { id: "rose", from: "#FB7185", to: "#E11D48", ring: "#F43F5E" },
  { id: "violet", from: "#A78BFA", to: "#7C3AED", ring: "#8B5CF6" },
  { id: "emerald", from: "#34D399", to: "#059669", ring: "#10B981" },
];

export function getPetColorById(id: string) {
  return PET_COLOR_PRESETS.find((color) => color.id === id) ?? PET_COLOR_PRESETS[0];
}

export const STATUS_CONFIG = {
  PENDING: { label: "Chờ xác nhận", bg: "#FFFBEB", color: "#D97706", ring: "#FDE68A" },
  CONFIRMED: { label: "Đã xác nhận", bg: "#EFF6FF", color: "#2563EB", ring: "#BFDBFE" },
  CHECKED_IN: { label: "Đã check-in", bg: "#F0F9FF", color: "#0891B2", ring: "#BAE6FD" },
  IN_PROGRESS: { label: "Đang thực hiện", bg: "#F5F3FF", color: "#7C3AED", ring: "#DDD6FE" },
  COMPLETED: { label: "Hoàn thành", bg: "#ECFDF5", color: "#059669", ring: "#BBF7D0" },
  CANCELLED: { label: "Đã hủy", bg: "#FEF2F2", color: "#DC2626", ring: "#FECACA" },
  NO_SHOW: { label: "Không đến", bg: "#F8FAFC", color: "#64748B", ring: "#CBD5E1" },
};

export const SERVICE_TYPE_CONFIG: Record<ServiceType, { bg: string; color: string }> = {
  "Khám bệnh": { bg: "#ECFEFF", color: "#0891B2" },
  "Tiêm phòng": { bg: "#ECFDF5", color: "#059669" },
  Grooming: { bg: "#FFFBEB", color: "#D97706" },
  "Lưu trú": { bg: "#EFF6FF", color: "#2563EB" },
};

export const NOTIF_CONFIG = {
  high: { icon: AlertTriangle, bg: "#FEF2F2", color: "#DC2626", borderColor: "#FECACA", label: "Quan trọng" },
  medium: { icon: Bell, bg: "#FFFBEB", color: "#D97706", borderColor: "#FDE68A", label: "Nhắc nhở" },
  info: { icon: Info, bg: "#EFF6FF", color: "#2563EB", borderColor: "#BFDBFE", label: "Thông tin" },
  promo: { icon: Megaphone, bg: "#F5F3FF", color: "#7C3AED", borderColor: "#DDD6FE", label: "Ưu đãi" },
};

export function getStatusConfig(status?: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
    ?? { label: "Unknown", bg: "#F8FAFC", color: "#64748B", ring: "#CBD5E1" };
}

export function getServiceTypeConfig(serviceType?: string) {
  return SERVICE_TYPE_CONFIG[serviceType as ServiceType]
    ?? { bg: "#F8FAFC", color: "#64748B" };
}

export function getNotifConfig(type?: string) {
  return NOTIF_CONFIG[type as keyof typeof NOTIF_CONFIG] ?? NOTIF_CONFIG.info;
}

export function getAppointmentIcon(iconKey?: CustomerAppointment["iconKey"]) {
  if (iconKey === "vaccine") return Syringe;
  if (iconKey === "grooming") return Star;
  if (iconKey === "boarding") return Calendar;
  return Stethoscope;
}

export function mapCustomerAppointment(appointment: CustomerAppointment): Apt {
  return {
    id: appointment.id,
    appointmentId: appointment.appointmentId,
    petId: appointment.petId,
    date: appointment.date,
    time: appointment.time,
    service: appointment.service,
    pet: appointment.pet,
    doctor: appointment.doctor,
    icon: getAppointmentIcon(appointment.iconKey),
    iconColor: appointment.iconColor,
    iconBg: appointment.iconBg,
    status: appointment.status,
    serviceType: appointment.serviceType,
    room: appointment.room,
    queue: appointment.queue,
    note: appointment.note,
    serviceFee: appointment.serviceFee,
    totalCost: appointment.totalCost,
    hasPrescription: appointment.hasPrescription,
    prescriptions: appointment.prescriptions?.map((item) => ({
      medicineName: item.medicineName,
      dosage: item.dosage || "",
      frequency: item.frequency || "",
      durationDays: item.durationDays ?? null,
      instructions: item.instructions || "",
    })),
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    createdAtLabel: appointment.createdAtLabel,
    updatedAtLabel: appointment.updatedAtLabel,
  };
}

export function getNotificationUiType(type: CustomerNotification["type"]) {
  if (type === "VACCINE" || type === "PAYMENT") return "high";
  if (type === "APPOINTMENT" || type === "BOARDING") return "medium";
  if (type === "GROOMING") return "promo";
  return "info";
}

export function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < minuteMs) return "Vừa xong";
  if (diffMs < hourMs) return `${Math.max(1, Math.floor(diffMs / minuteMs))} phút trước`;
  if (diffMs < dayMs) return `${Math.floor(diffMs / hourMs)} giờ trước`;
  if (diffMs < 7 * dayMs) return `${Math.floor(diffMs / dayMs)} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

export function mapCustomerNotification(notification: CustomerNotification) {
  return {
    id: notification.id,
    type: getNotificationUiType(notification.type),
    title: notification.title,
    desc: notification.content,
    time: formatNotificationTime(notification.created_at),
    read: notification.is_read,
  };
}
