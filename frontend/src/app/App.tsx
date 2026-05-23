import { useState } from "react";
import { ExamPage } from "./components/ExamPage";
import { UsersPage } from "./components/UsersPage";
import { ServicesPage } from "./components/ServicesPage";
import { StaffPage } from "./components/StaffPage";
import { ReportsPage } from "./components/ReportsPage";
import { SettingsPage } from "./components/SettingsPage";
import { HelpPage } from "./components/HelpPage";
import { AppointmentsPage } from "./components/AppointmentsPage";
import { WelcomePage } from "./components/WelcomePage";
import { LoginPage, type UserRole } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { CustomerPortal } from "./components/CustomerPortal";
import { DoctorPortal } from "./components/DoctorPortal";
import { StaffPortal } from "./components/StaffPortal";
import {
  LayoutDashboard, Calendar, Users, Scissors,
  BedDouble, Stethoscope, BarChart3, Settings, Bell,
  Search, Plus, Download,
  ChevronRight, ChevronDown, ArrowUpRight, ArrowDownRight,
  Clock, LogOut, Activity, Eye, Edit, X, FileText,
  Package, UserCog, CheckCircle2, ClipboardList,
  Heart, AlertTriangle, Info, Home, TrendingUp,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
  PieChart, Pie,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = "scheduled" | "in_progress" | "completed" | "cancelled";
type PageId =
  | "dashboard" | "appointments" | "patients" | "staff" | "reports"
  | "clinic" | "grooming" | "boarding" | "vaccination"
  | "exam" | "users" | "services" | "settings" | "help";

// ─── Appointments data ────────────────────────────────────────────────────────

interface Appointment {
  id: string; time: string; customer: string; pet: string;
  species: "Chó" | "Mèo"; service: string; staff: string;
  status: Status; amount: string;
}

const appointments: Appointment[] = [
  { id: "APT-001", time: "08:30", customer: "Nguyễn Thị Mai",     pet: "Mochi",    species: "Chó", service: "Khám tổng quát",       staff: "BS. Trần Hoài Nam",     status: "completed",   amount: "250.000" },
  { id: "APT-002", time: "09:00", customer: "Phạm Văn Đức",       pet: "Kiwi",     species: "Mèo", service: "Tiêm phòng dại",       staff: "BS. Lê Thị Hoa",        status: "completed",   amount: "180.000" },
  { id: "APT-003", time: "09:30", customer: "Lê Thị Hương",       pet: "Buddy",    species: "Chó", service: "Grooming cao cấp",      staff: "NV. Vũ Minh Tuấn",      status: "in_progress", amount: "350.000" },
  { id: "APT-004", time: "10:00", customer: "Trần Minh Khoa",     pet: "Luna",     species: "Mèo", service: "Khám da liễu",         staff: "BS. Trần Hoài Nam",     status: "in_progress", amount: "320.000" },
  { id: "APT-005", time: "10:30", customer: "Hoàng Thanh Thảo",   pet: "Max",      species: "Chó", service: "Lưu trú 3 ngày",       staff: "NV. Đinh Thị Lan",      status: "scheduled",   amount: "900.000" },
  { id: "APT-006", time: "11:00", customer: "Võ Thị Bích",        pet: "Coco",     species: "Chó", service: "Khám tổng quát",       staff: "BS. Lê Thị Hoa",        status: "scheduled",   amount: "250.000" },
  { id: "APT-007", time: "11:30", customer: "Đặng Quốc Hùng",    pet: "Snowball", species: "Mèo", service: "Tiêm phòng combo",     staff: "BS. Trần Hoài Nam",     status: "scheduled",   amount: "380.000" },
  { id: "APT-008", time: "14:00", customer: "Bùi Thị Lan",        pet: "Charlie",  species: "Chó", service: "Phẫu thuật triệt sản", staff: "BS. Nguyễn Đức Trung",  status: "scheduled",   amount: "1.500.000" },
  { id: "APT-009", time: "14:30", customer: "Ngô Văn Tâm",        pet: "Whiskers", species: "Mèo", service: "Grooming tiêu chuẩn", staff: "NV. Vũ Minh Tuấn",      status: "cancelled",   amount: "280.000" },
  { id: "APT-010", time: "15:00", customer: "Dương Thị Thu",      pet: "Rocky",    species: "Chó", service: "Khám ngoại khoa",      staff: "BS. Nguyễn Đức Trung",  status: "scheduled",   amount: "380.000" },
  { id: "APT-011", time: "15:30", customer: "Phan Anh Tuấn",      pet: "Milo",     species: "Chó", service: "Tắm và vệ sinh tai",   staff: "NV. Vũ Minh Tuấn",      status: "scheduled",   amount: "150.000" },
  { id: "APT-012", time: "16:00", customer: "Trịnh Thị Nga",      pet: "Nala",     species: "Mèo", service: "Kiểm tra định kỳ",     staff: "BS. Lê Thị Hoa",        status: "scheduled",   amount: "200.000" },
];

// ─── Admin Dashboard Data ─────────────────────────────────────────────────────

const weeklyRevData = [
  { t: "T2", rv: 6.8, tg: 7.0 }, { t: "T3", rv: 8.2, tg: 7.0 },
  { t: "T4", rv: 7.5, tg: 7.0 }, { t: "T5", rv: 9.1, tg: 7.0 },
  { t: "T6", rv: 11.3, tg: 7.0 }, { t: "T7", rv: 3.2, tg: 3.5 },
  { t: "CN", rv: 2.5, tg: 3.5 },
];

const monthlyRevData = [
  { t: "T6'25", rv: 32.1, tg: 38 }, { t: "T7'25", rv: 35.8, tg: 40 },
  { t: "T8'25", rv: 41.2, tg: 42 }, { t: "T9'25", rv: 38.5, tg: 42 },
  { t: "T10'25", rv: 44.3, tg: 44 }, { t: "T11'25", rv: 39.7, tg: 44 },
  { t: "T12'25", rv: 52.1, tg: 46 }, { t: "T1'26", rv: 41.5, tg: 46 },
  { t: "T2'26", rv: 38.2, tg: 48 }, { t: "T3'26", rv: 44.8, tg: 48 },
  { t: "T4'26", rv: 41.2, tg: 50 }, { t: "T5'26", rv: 48.5, tg: 50 },
];

const quarterlyRevData = [
  { t: "Q3/25", rv: 109.1, tg: 120 }, { t: "Q4/25", rv: 131.9, tg: 134 },
  { t: "Q1/26", rv: 124.5, tg: 144 }, { t: "Q2/26", rv: 48.5, tg: 148 },
];

const apptDonut = [
  { name: "Chờ khám",   value: 19, color: "#3B82F6" },
  { name: "Đang khám",  value: 2,  color: "#F59E0B" },
  { name: "Hoàn thành", value: 2,  color: "#10B981" },
  { name: "Đã huỷ",     value: 1,  color: "#EF4444" },
];

interface ActivityItem {
  id: number; time: string; msg: string;
  icon: React.ElementType; iconColor: string; iconBg: string;
}

const activityLog: ActivityItem[] = [
  { id: 1, time: "10:12", msg: "Ngô Văn Tâm huỷ lịch 14:30 — Whiskers (Grooming)", icon: X,            iconColor: "text-red-500",    iconBg: "bg-red-50" },
  { id: 2, time: "10:00", msg: "BS. Trần Hoài Nam bắt đầu khám Luna · Phòng 1",      icon: Activity,     iconColor: "text-amber-500",  iconBg: "bg-amber-50" },
  { id: 3, time: "09:45", msg: "Charlie nhận phòng lưu trú · Phòng 3 · 3 đêm",       icon: Home,         iconColor: "text-indigo-500", iconBg: "bg-indigo-50" },
  { id: 4, time: "09:30", msg: "Grooming bắt đầu: Buddy — NV. Vũ Minh Tuấn",         icon: Scissors,     iconColor: "text-violet-500", iconBg: "bg-violet-50" },
  { id: 5, time: "09:15", msg: "Đặt lịch mới: Phan Văn Hải · Pumpkin · 15:30",       icon: Calendar,     iconColor: "text-cyan-500",   iconBg: "bg-cyan-50" },
  { id: 6, time: "09:00", msg: "Hoàn thành: Tiêm phòng dại cho Kiwi (Phạm Văn Đức)", icon: CheckCircle2, iconColor: "text-emerald-500", iconBg: "bg-emerald-50" },
  { id: 7, time: "08:30", msg: "Hoàn thành: Khám tổng quát cho Mochi (Nguyễn Thị Mai)", icon: CheckCircle2, iconColor: "text-emerald-500", iconBg: "bg-emerald-50" },
  { id: 8, time: "08:15", msg: "Đặt lịch mới: Trịnh Thị Nga · Nala · 16:00 hôm nay", icon: Calendar,   iconColor: "text-cyan-500",   iconBg: "bg-cyan-50" },
];

interface Doctor {
  name: string; role: string; room: string;
  status: "busy" | "available" | "off";
  patient: string | null; timeSlot: string | null; initials: string;
  color: string;
}

const doctors: Doctor[] = [
  { name: "BS. Trần Hoài Nam",    role: "Nội khoa",          room: "Phòng 1", status: "busy",      patient: "Luna · Trần Minh Khoa",   timeSlot: "10:00–10:45", initials: "TN", color: "from-cyan-400 to-cyan-600" },
  { name: "BS. Lê Thị Hoa",       role: "Thú y đa khoa",     room: "Phòng 2", status: "available", patient: null,                      timeSlot: null,          initials: "LH", color: "from-emerald-400 to-emerald-600" },
  { name: "BS. Nguyễn Đức Trung", role: "Ngoại khoa",        room: "Phòng 3", status: "busy",      patient: "Rocky · Dương Thị Thu",   timeSlot: "10:15–11:00", initials: "NT", color: "from-violet-400 to-violet-600" },
  { name: "BS. Phạm Minh Đức",    role: "Da liễu thú y",     room: "Phòng 4", status: "off",       patient: null,                      timeSlot: null,          initials: "PĐ", color: "from-slate-400 to-slate-500" },
];

interface BoardingRoom {
  id: number; pet: string | null; species: string | null;
  owner: string | null; checkIn: string | null; nights: number | null;
  status: "occupied" | "available";
}

const boardingRooms: BoardingRoom[] = [
  { id: 1, pet: "Mochi",    species: "Chó", owner: "Nguyễn Thị Mai",   checkIn: "19/05", nights: 3, status: "occupied" },
  { id: 2, pet: "Buddy",    species: "Chó", owner: "Lê Thị Hương",     checkIn: "20/05", nights: 2, status: "occupied" },
  { id: 3, pet: "Charlie",  species: "Chó", owner: "Bùi Thị Lan",      checkIn: "21/05", nights: 3, status: "occupied" },
  { id: 4, pet: "Luna",     species: "Mèo", owner: "Phạm Thị Thu",     checkIn: "18/05", nights: 5, status: "occupied" },
  { id: 5, pet: "Max",      species: "Chó", owner: "Hoàng Thanh Thảo", checkIn: "21/05", nights: 3, status: "occupied" },
  { id: 6, pet: "Kiwi",     species: "Mèo", owner: "Nguyễn Văn Bình",  checkIn: "20/05", nights: 2, status: "occupied" },
  { id: 7, pet: "Snowball", species: "Mèo", owner: "Đặng Quốc Hùng",  checkIn: "19/05", nights: 4, status: "occupied" },
  { id: 8,  pet: null, species: null, owner: null, checkIn: null, nights: null, status: "available" },
  { id: 9,  pet: null, species: null, owner: null, checkIn: null, nights: null, status: "available" },
  { id: 10, pet: null, species: null, owner: null, checkIn: null, nights: null, status: "available" },
];

interface Notif {
  id: number; severity: "high" | "medium" | "info";
  title: string; desc: string; time: string;
  icon: React.ElementType; color: string; bg: string; border: string;
}

const notifications: Notif[] = [
  { id: 1, severity: "high",   title: "Vaccine sắp hết hạn",      desc: "Mochi, Luna, Max cần tiêm nhắc lại trong 7 ngày tới.",     time: "Ưu tiên cao",       icon: AlertTriangle, color: "text-red-600",   bg: "bg-red-50",   border: "border-red-200" },
  { id: 2, severity: "medium", title: "Tồn kho thuốc thấp",       desc: "Amoxicillin 250mg còn 12 viên. Đặt mua thêm ngay.",        time: "Cần xử lý hôm nay", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { id: 3, severity: "info",   title: "Khu lưu trú 70% công suất", desc: "7/10 phòng đang có thú cưng. Còn 3 phòng trống hôm nay.", time: "Thông tin",         icon: Info,          color: "text-blue-600",  bg: "bg-blue-50",  border: "border-blue-200" },
];

// ─── KPI data ─────────────────────────────────────────────────────────────────

interface KPIData {
  label: string; value: string; unit?: string;
  change: string; changePct: number; sub: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  color: string; spark: number[];
}

const kpis: KPIData[] = [
  {
    label: "Tổng khách hàng", value: "1.284", change: "+24", changePct: 3.2,
    sub: "tháng này", icon: Users, iconBg: "bg-indigo-50", iconColor: "text-indigo-600",
    color: "#6366F1", spark: [890, 960, 1020, 1080, 1140, 1210, 1284],
  },
  {
    label: "Tổng thú cưng", value: "1.847", change: "+38", changePct: 2.1,
    sub: "đã đăng ký", icon: Heart, iconBg: "bg-pink-50", iconColor: "text-pink-600",
    color: "#EC4899", spark: [1600, 1660, 1700, 1730, 1770, 1810, 1847],
  },
  {
    label: "Lịch hẹn hôm nay", value: "24", change: "+3", changePct: 14.3,
    sub: "so với hôm qua (21)", icon: Calendar, iconBg: "bg-cyan-50", iconColor: "text-cyan-600",
    color: "#0891B2", spark: [18, 21, 19, 23, 20, 21, 24],
  },
  {
    label: "Doanh thu tháng", value: "48,5M", unit: "₫", change: "+7,3M", changePct: 8.3,
    sub: "vs. T4: 41,2M₫", icon: TrendingUp, iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
    color: "#10B981", spark: [32, 35, 41, 38, 44, 39, 52, 41, 38, 44, 41, 48.5],
  },
  {
    label: "Bác sĩ đang làm việc", value: "3/4", change: "1 nghỉ phép", changePct: 0,
    sub: "Phòng 4 trống hôm nay", icon: Stethoscope, iconBg: "bg-violet-50", iconColor: "text-violet-600",
    color: "#A855F7", spark: [4, 4, 3, 4, 4, 4, 3],
  },
  {
    label: "Công suất lưu trú", value: "70%", change: "7/10", changePct: 0,
    sub: "3 phòng còn trống", icon: BedDouble, iconBg: "bg-amber-50", iconColor: "text-amber-600",
    color: "#F59E0B", spark: [50, 60, 40, 70, 60, 80, 70],
  },
];

// ─── Shared utilities ─────────────────────────────────────────────────────────

const statusConfig: Record<Status, { label: string; cls: string; dot: string }> = {
  scheduled:   { label: "Chờ khám",   cls: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",         dot: "bg-blue-500" },
  in_progress: { label: "Đang khám",  cls: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",      dot: "bg-amber-500" },
  completed:   { label: "Hoàn thành", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200", dot: "bg-emerald-500" },
  cancelled:   { label: "Đã huỷ",     cls: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200",            dot: "bg-red-400" },
};

function StatusBadge({ status }: { status: Status }) {
  const { label, cls, dot } = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  );
}

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();
  const colors = ["from-cyan-400 to-cyan-600", "from-violet-400 to-violet-600", "from-emerald-400 to-emerald-600", "from-amber-400 to-amber-600", "from-rose-400 to-rose-600"];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div className={`rounded-full bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 ${sz}`}>
      <span className="text-white font-semibold">{initials}</span>
    </div>
  );
}

function MiniSparkline({ data, color, idx }: { data: number[]; color: string; idx: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 72; const H = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return [x, y] as [number, number];
  });
  const linePts = points.map(([x, y]) => `${x},${y}`).join(" ");
  const fillPath = `M 0,${H} L ${points.map(([x, y]) => `${x},${y}`).join(" L ")} L ${W},${H} Z`;
  const gradId = `sp-${idx}`;
  return (
    <svg width={W} height={H} className="overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ active, onNav, onLogout }: { active: PageId; onNav: (id: PageId) => void; onLogout: () => void }) {
  function NavBtn({ id, label, icon: Icon, badge }: { id: PageId; label: string; icon: React.ElementType; badge?: string }) {
    const isActive = active === id;
    return (
      <button
        onClick={() => onNav(id)}
        className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-colors ${
          isActive ? "text-white bg-white/10" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
        }`}
      >
        <Icon size={15} className="flex-shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {badge && <span className="text-[10px] font-bold bg-cyan-500 text-white px-1.5 py-0.5 rounded-full leading-none">{badge}</span>}
        {isActive && !badge && <div className="w-1 h-1 rounded-full bg-cyan-400 flex-shrink-0" />}
      </button>
    );
  }

  return (
    <aside className="w-[232px] flex-shrink-0 flex flex-col h-screen bg-[#0F172A] border-r border-white/[0.06] select-none">

      {/* Logo */}
      <div className="px-5 py-[18px] border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <ellipse cx="5" cy="9" rx="2.5" ry="3.5" fill="white" opacity="0.9"/>
              <ellipse cx="19" cy="9" rx="2.5" ry="3.5" fill="white" opacity="0.9"/>
              <ellipse cx="10" cy="5" rx="2" ry="3" fill="white" opacity="0.9"/>
              <ellipse cx="14" cy="5" rx="2" ry="3" fill="white" opacity="0.9"/>
              <path d="M12 10c-3.5 0-6 2.5-6 5.5 0 2.2 1.5 4.5 6 4.5s6-2.3 6-4.5c0-3-2.5-5.5-6-5.5z" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-[15px] leading-tight tracking-tight">PetCare</div>
            <div className="text-slate-400 text-[11px] leading-tight font-medium tracking-wide">CENTER</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto">

        {/* ── Section: Vận hành */}
        <p className="px-2 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Vận hành</p>
        <div className="space-y-0.5">
          <NavBtn id="dashboard"    label="Tổng quan" icon={LayoutDashboard} />
          <NavBtn id="appointments" label="Lịch hẹn"  icon={Calendar} badge="24" />
        </div>

        {/* ── Section: Quản lý */}
        <p className="px-2 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Quản lý</p>
        <div className="space-y-0.5">
          <NavBtn id="users"    label="Khách hàng"  icon={Users} />
          <NavBtn id="staff"    label="Nhân viên"   icon={UserCog} />
          <NavBtn id="services" label="Dịch vụ"     icon={ClipboardList} />
          <NavBtn id="reports"  label="Báo cáo"     icon={BarChart3} />
        </div>

        {/* ── Section: Hệ thống */}
        <p className="px-2 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Hệ thống</p>
        <div className="space-y-0.5">
          <NavBtn id="settings" label="Cài đặt"    icon={Settings} />
          <NavBtn id="help"     label="Hướng dẫn"  icon={FileText} />
        </div>

      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[11px] font-bold">HT</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-slate-200 truncate leading-tight">Hoàng Minh Thiện</div>
            <div className="text-[11px] text-slate-500 truncate leading-tight">Chủ trung tâm</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Top Navigation ───────────────────────────────────────────────────────────

const pageLabels: Record<PageId, string> = {
  dashboard: "Bảng điều khiển", appointments: "Lịch hẹn", patients: "Bệnh nhân",
  staff: "Nhân viên", reports: "Báo cáo", clinic: "Phòng khám",
  grooming: "Grooming", boarding: "Lưu trú", vaccination: "Tiêm chủng",
  exam: "Phòng khám · APT-004", users: "Quản lý người dùng",
  services: "Quản lý dịch vụ", settings: "Cài đặt", help: "Hướng dẫn & Hỗ trợ",
};

function TopNav({ page }: { page: PageId }) {
  const [showNotif, setShowNotif] = useState(false);
  const unread = notifications.length;

  return (
    <header className="h-[60px] flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm border-b border-border flex-shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground font-medium">PetCare Center</span>
        <ChevronRight size={14} className="text-muted-foreground/60" />
        <span className="font-semibold text-foreground">{pageLabels[page]}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Tìm kiếm nhanh..." className="w-56 h-9 pl-8 pr-4 bg-muted rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all" />
        </div>

        {/* Bell with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotif((v) => !v)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <Bell size={16} className="text-foreground" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>

          {showNotif && (
            <>
              {/* backdrop */}
              <div className="fixed inset-0 z-20" onClick={() => setShowNotif(false)} />
              {/* panel */}
              <div className="absolute right-0 top-11 z-30 w-[360px] bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-foreground">Thông báo</span>
                    <span className="text-[11px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unread}</span>
                  </div>
                  <button className="text-[12px] text-primary font-semibold hover:underline">Đánh dấu đã đọc</button>
                </div>
                <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
                  {notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div key={n.id} className="flex gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer">
                        <div className={`w-9 h-9 rounded-xl ${n.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Icon size={15} className={n.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[13px] font-semibold text-foreground leading-snug">{n.title}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${n.bg} ${n.color}`}>{n.time}</span>
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{n.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-2.5 border-t border-border bg-muted/30">
                  <button className="w-full text-center text-[13px] font-semibold text-primary hover:underline">Xem tất cả thông báo</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ kpi, idx }: { kpi: KPIData; idx: number }) {
  const Icon = kpi.icon;
  const isNeutral = kpi.changePct === 0;
  const isPositive = kpi.changePct > 0;

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3 hover:shadow-sm hover:shadow-slate-200/70 transition-all group cursor-default">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
          <Icon size={17} className={kpi.iconColor} />
        </div>
        {!isNeutral ? (
          <span className={`flex items-center gap-0.5 text-[11px] font-bold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(kpi.changePct)}%
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{kpi.change}</span>
        )}
      </div>

      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-[26px] font-bold text-foreground font-mono leading-none tracking-tight">{kpi.value}</span>
          {kpi.unit && <span className="text-xs font-semibold text-muted-foreground">{kpi.unit}</span>}
        </div>
        <div className="text-[12.5px] font-medium text-foreground mt-1">{kpi.label}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {!isNeutral && <span className="font-semibold" style={{ color: kpi.color }}>{kpi.change} </span>}
          {kpi.sub}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <MiniSparkline data={kpi.spark} color={kpi.color} idx={idx} />
        <span className="text-[10px] text-muted-foreground/60 font-mono">7d</span>
      </div>
    </div>
  );
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────

type Period = "week" | "month" | "quarter";

function RevTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg shadow-slate-200/60 p-3 text-xs min-w-[140px]">
      <p className="font-bold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => p.dataKey !== "tg" && (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <span className="text-muted-foreground">Doanh thu</span>
          </div>
          <span className="font-mono font-bold text-foreground">{p.value}M₫</span>
        </div>
      ))}
      {payload.find((p: any) => p.dataKey === "tg") && (
        <div className="flex items-center justify-between gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full border border-slate-400 bg-transparent" />
            <span className="text-muted-foreground">Mục tiêu</span>
          </div>
          <span className="font-mono font-bold text-muted-foreground">{payload.find((p: any) => p.dataKey === "tg")?.value}M₫</span>
        </div>
      )}
    </div>
  );
}

function RevenueAreaChart() {
  const [period, setPeriod] = useState<Period>("month");
  const data = period === "week" ? weeklyRevData : period === "month" ? monthlyRevData : quarterlyRevData;

  const totals: Record<Period, { val: string; label: string; sub: string }> = {
    week:    { val: "48,8M₫", label: "Tuần này",   sub: "vs. tuần trước: 44,5M₫ (+9,7%)" },
    month:   { val: "48,5M₫", label: "Tháng 5/26", sub: "vs. T4/26: 41,2M₫ (+17,7%)" },
    quarter: { val: "173,0M₫", label: "Q2/26 (tạm tính)", sub: "vs. Q1/26: 124,5M₫ (+38,9%)" },
  };
  const { val, label: lbl, sub } = totals[period];

  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-[15px] font-bold text-foreground">Doanh thu</h2>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold font-mono text-foreground tracking-tight">{val}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <ArrowUpRight size={12} />
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{lbl} · {sub}</p>
        </div>

        <div className="flex items-center bg-muted p-1 rounded-lg gap-0.5">
          {(["week", "month", "quarter"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${period === p ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {p === "week" ? "Tuần" : p === "month" ? "Tháng" : "Quý"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11.5px] text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-cyan-500 rounded" /> Thực tế</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 border-t border-dashed border-slate-400" /> Mục tiêu</div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0891B2" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#0891B2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="t" tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
          <Tooltip content={<RevTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="rv" stroke="#0891B2" strokeWidth={2.5} fill="url(#rev-grad)" dot={false} activeDot={{ r: 5, fill: "#0891B2", strokeWidth: 0 }} />
          <Area type="monotone" dataKey="tg" stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} activeDot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Appointment Donut ────────────────────────────────────────────────────────

const RADIAN = Math.PI / 180;
function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, value, name }: any) {
  if (value < 3) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>{value}</text>;
}

function AppointmentDonut() {
  const total = apptDonut.reduce((s, d) => s + d.value, 0);
  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-[15px] font-bold text-foreground">Lịch hẹn hôm nay</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Phân bổ theo trạng thái</p>
      </div>

      <div className="relative flex-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={apptDonut} cx="50%" cy="50%" innerRadius={54} outerRadius={78}
              paddingAngle={3} dataKey="value" labelLine={false} label={<CustomPieLabel />}
            >
              {apptDonut.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-3xl font-bold font-mono text-foreground leading-none">{total}</div>
            <div className="text-[11px] text-muted-foreground font-medium mt-0.5">hôm nay</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {apptDonut.map((d) => (
          <div key={d.name} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground truncate">{d.name}</div>
              <div className="text-sm font-bold font-mono text-foreground">{d.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeed() {
  return (
    <div className="bg-card rounded-xl border border-border flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-[15px] font-bold text-foreground">Hoạt động gần đây</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Cập nhật theo thời gian thực</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {activityLog.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
              <div className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon size={13} className={item.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-foreground leading-snug">{item.msg}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={10} className="text-muted-foreground/60" />
                  <span className="text-[11px] text-muted-foreground font-mono">{item.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t border-border bg-muted/30 flex-shrink-0">
        <button className="text-xs font-semibold text-primary hover:underline underline-offset-2 w-full text-center">
          Xem toàn bộ nhật ký →
        </button>
      </div>
    </div>
  );
}

// ─── Upcoming Appointments ────────────────────────────────────────────────────

function UpcomingPanel() {
  const upcoming = appointments.filter((a) => a.status === "scheduled" || a.status === "in_progress").slice(0, 6);
  return (
    <div className="bg-card rounded-xl border border-border flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex-shrink-0">
        <h2 className="text-[15px] font-bold text-foreground">Lịch hẹn sắp tới</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Từ 10:30 đến hết ngày</p>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {upcoming.map((apt) => (
          <div key={apt.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors group cursor-pointer">
            <div className="w-11 h-11 rounded-lg bg-slate-50 border border-border flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[11px] font-bold text-foreground leading-tight text-center">{apt.time}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-foreground truncate">{apt.pet}</span>
                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded flex-shrink-0">{apt.species}</span>
              </div>
              <div className="text-xs text-muted-foreground truncate mt-0.5">{apt.service}</div>
              <div className="text-[11px] text-muted-foreground/70 truncate">{apt.staff}</div>
            </div>
            <StatusBadge status={apt.status} />
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-border bg-muted/30 flex-shrink-0">
        <button className="text-xs font-semibold text-primary hover:underline underline-offset-2 w-full text-center">
          Xem lịch đầy đủ →
        </button>
      </div>
    </div>
  );
}

// ─── Notifications Panel ──────────────────────────────────────────────────────

function NotificationsPanel() {
  const [dismissed, setDismissed] = useState<number[]>([]);
  const visible = notifications.filter((n) => !dismissed.includes(n.id));

  return (
    <div className="bg-card rounded-xl border border-border flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-[15px] font-bold text-foreground">Thông báo quan trọng</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{visible.length} cần chú ý</p>
        </div>
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">{visible.filter(n => n.severity === "high").length}</span>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <CheckCircle2 size={24} className="text-emerald-400 mb-2" />
            <p className="text-sm font-medium text-foreground">Không có thông báo mới</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tất cả hoạt động bình thường</p>
          </div>
        )}
        {visible.map((n) => {
          const Icon = n.icon;
          return (
            <div key={n.id} className={`rounded-lg border p-3.5 ${n.bg} ${n.border} relative group`}>
              <button onClick={() => setDismissed(d => [...d, n.id])}
                className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded-md hover:bg-black/10">
                <X size={11} className={n.color} />
              </button>
              <div className="flex items-start gap-2.5 pr-4">
                <Icon size={15} className={`${n.color} flex-shrink-0 mt-0.5`} />
                <div className="min-w-0">
                  <div className={`text-[12.5px] font-bold ${n.color}`}>{n.title}</div>
                  <p className="text-[11.5px] text-foreground/80 mt-0.5 leading-snug">{n.desc}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10.5px] text-muted-foreground font-medium">{n.time}</span>
                    <button className={`text-[11px] font-bold ${n.color} hover:underline underline-offset-2`}>Xử lý</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Doctor Status Panel ──────────────────────────────────────────────────────

const doctorStatusConfig = {
  busy:      { label: "Đang khám",  cls: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",    dot: "bg-amber-500" },
  available: { label: "Sẵn sàng",   cls: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200", dot: "bg-emerald-500 animate-pulse" },
  off:       { label: "Nghỉ phép",  cls: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",   dot: "bg-slate-400" },
};

function DoctorStatusPanel({ onViewStaff }: { onViewStaff?: () => void }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-foreground">Bác sĩ đang làm việc</h2>
          <p className="text-xs text-muted-foreground mt-0.5">3/4 bác sĩ trực hôm nay</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-600">3 đang hoạt động</span>
          </div>
          {onViewStaff && (
            <button onClick={onViewStaff} className="text-xs font-semibold text-primary hover:underline">Xem tất cả</button>
          )}
        </div>
      </div>

      <div className="divide-y divide-border">
        {doctors.map((doc) => {
          const sc = doctorStatusConfig[doc.status];
          return (
            <div key={doc.name} onClick={onViewStaff} className={`flex items-center gap-4 px-5 py-4 ${doc.status === "off" ? "opacity-60" : "hover:bg-muted/30 cursor-pointer"} transition-colors`}>
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${doc.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <span className="text-white text-[11px] font-bold">{doc.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-foreground truncate">{doc.name}</div>
                <div className="text-xs text-muted-foreground truncate">{doc.role} · {doc.room}</div>
                {doc.patient && (
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    <span className="font-medium text-foreground">{doc.patient}</span>
                    {doc.timeSlot && <span className="ml-1.5 font-mono text-muted-foreground">{doc.timeSlot}</span>}
                  </div>
                )}
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${sc.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Boarding Capacity Panel ──────────────────────────────────────────────────

function BoardingCapacityPanel({ onManage }: { onManage?: () => void }) {
  const occupied = boardingRooms.filter((r) => r.status === "occupied").length;
  const total = boardingRooms.length;
  const pct = Math.round((occupied / total) * 100);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-foreground">Công suất lưu trú</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{occupied}/{total} phòng đang có thú cưng</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-foreground">{pct}%</div>
            <div className="text-xs text-muted-foreground">công suất</div>
          </div>
        </div>
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="p-4 grid grid-cols-5 gap-2">
        {boardingRooms.map((room) => (
          <div
            key={room.id}
            className={`rounded-lg border p-2 flex flex-col gap-1 transition-colors ${
              room.status === "occupied"
                ? "bg-cyan-50 border-cyan-200"
                : "bg-muted/30 border-dashed border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground font-mono">P{room.id}</span>
              {room.status === "occupied" ? (
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              )}
            </div>
            {room.status === "occupied" ? (
              <>
                <div className="text-[11px] font-bold text-foreground truncate leading-tight">{room.pet}</div>
                <div className="text-[10px] text-muted-foreground truncate">{room.species}</div>
                <div className="text-[10px] font-mono text-cyan-600 font-semibold">{room.nights}đ</div>
              </>
            ) : (
              <div className="text-[10px] text-muted-foreground/60 italic text-center mt-1">Trống</div>
            )}
          </div>
        ))}
      </div>

      <div className="px-5 pb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-cyan-100 border border-cyan-300" />
              <span>Có thú cưng ({occupied})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-muted border border-dashed border-border" />
              <span>Trống ({total - occupied})</span>
            </div>
          </div>
          <button onClick={onManage} className="font-semibold text-primary hover:underline underline-offset-2">Quản lý</button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard Page ─────────────────────────────────────────────────────

function AdminDashboard({ onNav }: { onNav?: (page: PageId) => void }) {
  const [refreshed, setRefreshed] = useState(false);

  const handleRefresh = () => {
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 1000);
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Bảng điều khiển quản trị</h1>
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <p className="text-sm text-muted-foreground">Thứ Năm, 21/05/2026 · Tổng quan hoạt động toàn trung tâm</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border px-3.5 py-2 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Hệ thống hoạt động</span>
            <span className="text-muted-foreground/60 font-mono">10:12</span>
          </div>
          <button onClick={handleRefresh}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors ${refreshed ? "text-primary" : "text-muted-foreground"}`}>
            <RefreshCw size={14} className={refreshed ? "animate-spin" : ""} />
          </button>
          <button className="flex items-center gap-1.5 h-9 px-4 border border-border bg-card text-sm font-medium text-foreground rounded-lg hover:bg-muted transition-colors">
            <Download size={14} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-6 gap-4">
        {kpis.map((kpi, i) => <KPICard key={i} kpi={kpi} idx={i} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-6 gap-4" style={{ minHeight: 380 }}>
        <div className="col-span-4">
          <RevenueAreaChart />
        </div>
        <div className="col-span-2">
          <AppointmentDonut />
        </div>
      </div>

      {/* Activity / Upcoming / Notifications */}
      <div className="grid grid-cols-3 gap-4" style={{ minHeight: 380 }}>
        <ActivityFeed />
        <UpcomingPanel />
        <NotificationsPanel />
      </div>

      {/* Doctor / Boarding */}
      <div className="grid grid-cols-2 gap-4">
        <DoctorStatusPanel onViewStaff={() => onNav?.("staff")} />
        <BoardingCapacityPanel onManage={() => onNav?.("appointments")} />
      </div>
    </div>
  );
}

// ─── Placeholder page ─────────────────────────────────────────────────────────

function PlaceholderPage({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center mb-5 shadow-sm">
        <Package size={22} className="text-muted-foreground" />
      </div>
      <h2 className="text-lg font-bold text-foreground">{label}</h2>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">Module này đang được phát triển và sẽ ra mắt trong phiên bản tới.</p>
      <button className="mt-6 px-5 py-2.5 border border-border bg-card rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors">Thông báo khi ra mắt</button>
    </div>
  );
}

// ─── Admin Root ───────────────────────────────────────────────────────────────

function AdminRoot({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState<PageId>("dashboard");

  const isExam = page === "exam";
  const goToApts = () => setPage("appointments");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar active={page} onNav={setPage} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav page={page} />
        <main className={`flex-1 ${isExam ? "overflow-hidden" : "overflow-y-auto"}`}>
          {isExam ? (
            <ExamPage onBack={() => setPage("appointments")} />
          ) : (
            <div className="max-w-[1280px] mx-auto px-6 py-6">
              {page === "dashboard"    && <AdminDashboard onNav={setPage} />}
              {page === "appointments" && <AppointmentsPage onNewAppt={goToApts} onOpenExam={() => setPage("exam")} />}
              {page === "users"        && <UsersPage />}
              {page === "services"     && <ServicesPage />}
              {page === "staff"        && <StaffPage />}
              {page === "reports"      && <ReportsPage />}
              {page === "settings"     && <SettingsPage onLogout={onLogout} />}
              {page === "help"         && <HelpPage />}
              {!["dashboard","appointments","users","services","staff","reports","settings","help"].includes(page) && <PlaceholderPage label={pageLabels[page]} />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Auth-aware Root ──────────────────────────────────────────────────────────

type AuthScreen = "welcome" | "login" | "register" | "forgot" | "app";

export default function App() {
  const [screen, setScreen] = useState<AuthScreen>("welcome");
  const [role, setRole] = useState<UserRole>("admin");

  if (screen === "welcome") {
    return (
      <WelcomePage
        onLogin={() => setScreen("login")}
        onRegister={() => setScreen("register")}
      />
    );
  }

  if (screen === "login") {
    return (
      <LoginPage
        onLogin={(r) => { setRole(r); setScreen("app"); }}
        onRegister={() => setScreen("register")}
        onForgotPassword={() => setScreen("forgot")}
      />
    );
  }

  if (screen === "register") {
    return (
      <RegisterPage
        onBack={() => setScreen("login")}
        onSuccess={() => setScreen("login")}
      />
    );
  }

  if (screen === "forgot") {
    return (
      <ForgotPasswordPage
        onBack={() => setScreen("login")}
      />
    );
  }

  // screen === "app"
  const logout = () => setScreen("welcome");

  if (role === "admin")    return <AdminRoot onLogout={logout} />;
  if (role === "doctor")   return <DoctorPortal onLogout={logout} />;
  if (role === "staff")    return <StaffPortal onLogout={logout} />;
  if (role === "customer") return <CustomerPortal onLogout={logout} />;
  return null;
}
