import type { AdminPageId, AdminStatus } from "@/types/navigation";

export const adminPageLabels: Record<AdminPageId, string> = {
  dashboard: "Bảng điều khiển",
  appointments: "Lịch hẹn",
  patients: "Bệnh nhân",
  staff: "Nhân viên",
  reports: "Báo cáo",
  clinic: "Phòng khám",
  grooming: "Grooming",
  boarding: "Lưu trú",
  vaccination: "Tiêm chủng",
  exam: "Phòng khám · APT-004",
  users: "Quản lý người dùng",
  services: "Quản lý dịch vụ",
  settings: "Cài đặt",
  help: "Hướng dẫn & Hỗ trợ",
};

export const appointmentStatusConfig: Record<
  AdminStatus,
  { label: string; cls: string; dot: string }
> = {
  scheduled: {
    label: "Chờ khám",
    cls: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
    dot: "bg-blue-500",
  },
  in_progress: {
    label: "Đang khám",
    cls: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Hoàn thành",
    cls: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Đã huỷ",
    cls: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200",
    dot: "bg-red-400",
  },
};
