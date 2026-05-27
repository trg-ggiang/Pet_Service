import { useState } from "react";
import { Calendar, Clock, Bell, LogOut, ChevronRight, Plus, Heart, Star, CheckCircle2, Stethoscope, Syringe, MapPin, X, Edit2, Check, Camera, AlertTriangle, Info, Megaphone } from "lucide-react";

function PawSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="currentColor">
      <ellipse cx="40" cy="54" rx="18" ry="15" />
      <ellipse cx="18" cy="35" rx="8.5" ry="10" />
      <ellipse cx="32" cy="27" rx="8" ry="9.5" />
      <ellipse cx="48" cy="27" rx="8" ry="9.5" />
      <ellipse cx="62" cy="35" rx="8.5" ry="10" />
    </svg>
  );
}

// Pet colors stored as actual hex values to avoid Tailwind class purging
const PET_COLOR_PRESETS = [
  { id: "amber",   from: "#FB923C", to: "#EA580C",  ring: "#FBBF24" },
  { id: "slate",   from: "#94A3B8", to: "#475569",  ring: "#64748B" },
  { id: "cyan",    from: "#22D3EE", to: "#0891B2",  ring: "#06B6D4" },
  { id: "rose",    from: "#FB7185", to: "#E11D48",  ring: "#F43F5E" },
  { id: "violet",  from: "#A78BFA", to: "#7C3AED",  ring: "#8B5CF6" },
  { id: "emerald", from: "#34D399", to: "#059669",  ring: "#10B981" },
];

function getPetColorById(id: string) {
  return PET_COLOR_PRESETS.find((c) => c.id === id) ?? PET_COLOR_PRESETS[0];
}

interface Pet {
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

const INITIAL_PETS: Pet[] = [
  { id: 1, name: "Mochi", species: "Chó", breed: "Poodle", age: "2 tuổi", weight: "4.2 kg", colorId: "amber", initials: "Mo", lastVisit: "12/05/2026", nextVaccine: "12/08/2026", healthy: true, image: "https://images.unsplash.com/photo-1594149929911-78975a43d4f5?w=200&h=200&fit=crop" },
  { id: 2, name: "Luna",  species: "Mèo", breed: "British Shorthair", age: "3 tuổi", weight: "5.1 kg", colorId: "slate", initials: "Lu", lastVisit: "03/04/2026", nextVaccine: "03/07/2026", healthy: true, image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop" },
];

type AptStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
type ServiceType = "Khám bệnh" | "Tiêm phòng" | "Grooming" | "Lưu trú";

const STATUS_CONFIG: Record<AptStatus, { label: string; bg: string; color: string; ring: string }> = {
  PENDING:     { label: "Chờ xác nhận",   bg: "#FFFBEB", color: "#D97706", ring: "#FDE68A" },
  CONFIRMED:   { label: "Đã xác nhận",    bg: "#EFF6FF", color: "#2563EB", ring: "#BFDBFE" },
  CHECKED_IN:  { label: "Đã check-in",    bg: "#F0F9FF", color: "#0891B2", ring: "#BAE6FD" },
  IN_PROGRESS: { label: "Đang thực hiện", bg: "#F5F3FF", color: "#7C3AED", ring: "#DDD6FE" },
  COMPLETED:   { label: "Hoàn thành",     bg: "#ECFDF5", color: "#059669", ring: "#BBF7D0" },
  CANCELLED:   { label: "Đã hủy",         bg: "#FEF2F2", color: "#DC2626", ring: "#FECACA" },
  NO_SHOW:     { label: "Không đến",      bg: "#F8FAFC", color: "#64748B", ring: "#CBD5E1" },
};

const SERVICE_TYPE_CONFIG: Record<ServiceType, { bg: string; color: string }> = {
  "Khám bệnh":  { bg: "#ECFEFF", color: "#0891B2" },
  "Tiêm phòng": { bg: "#ECFDF5", color: "#059669" },
  "Grooming":   { bg: "#FFFBEB", color: "#D97706" },
  "Lưu trú":    { bg: "#F5F3FF", color: "#7C3AED" },
};

interface Apt {
  id: string; date: string; time: string; service: string;
  pet: string; doctor: string; icon: React.ElementType;
  iconColor: string; iconBg: string;
  status: AptStatus;
  serviceType: ServiceType;
  room?: string;
  queue?: string;
}

const MOCK_APTS: Apt[] = [
  { id: "APT-024", date: "25/05/2026", time: "09:30", service: "Khám tổng quát",  pet: "Mochi", doctor: "BS. Trần Hoài Nam", icon: Stethoscope, iconColor: "#0891B2", iconBg: "#ECFEFF", status: "CHECKED_IN", serviceType: "Khám bệnh", room: "Phòng khám 02", queue: "A012" },
  { id: "APT-025", date: "02/06/2026", time: "10:00", service: "Tiêm phòng dại",  pet: "Luna",  doctor: "BS. Lê Thị Hoa",    icon: Syringe,     iconColor: "#059669", iconBg: "#ECFDF5", status: "CONFIRMED", serviceType: "Tiêm phòng" },
  { id: "APT-026", date: "10/06/2026", time: "14:00", service: "Lưu trú 3 ngày",  pet: "Mochi", doctor: "NV. Nguyễn Văn An", icon: Calendar,    iconColor: "#7C3AED", iconBg: "#F5F3FF", status: "CONFIRMED", serviceType: "Lưu trú", room: "Chuồng A03" },
  { id: "APT-027", date: "20/05/2026", time: "15:30", service: "Grooming đầy đủ", pet: "Luna",  doctor: "NV. Phạm Minh Anh", icon: Star,        iconColor: "#D97706", iconBg: "#FFFBEB", status: "COMPLETED", serviceType: "Grooming" },
  { id: "APT-028", date: "18/05/2026", time: "11:00", service: "Khám da liễu",    pet: "Mochi", doctor: "BS. Nguyễn Đức Trung", icon: Heart,     iconColor: "#E11D48", iconBg: "#FFF1F2", status: "CANCELLED", serviceType: "Khám bệnh" },
];

interface HistoryRecord {
  id: string;
  date: string;
  service: string;
  pet: string;
  cost: string;
  status: "completed" | "pending" | "cancelled";
  type: "medical" | "vaccine" | "grooming" | "boarding";
  staff: string;
  details?: string;
}

const HISTORY: HistoryRecord[] = [
  { id: "H-001", date: "12/05/2026", service: "Khám tổng quát",  pet: "Mochi", cost: "250.000₫", status: "completed", type: "medical", staff: "BS. Trần Hoài Nam", details: "Sức khỏe ổn định" },
  { id: "H-002", date: "03/04/2026", service: "Grooming đầy đủ",  pet: "Luna",  cost: "350.000₫", status: "completed", type: "grooming", staff: "NV. Phạm Minh Anh", details: "Cắt tỉa lông, tắm, vệ sinh tai" },
  { id: "H-003", date: "18/03/2026", service: "Tiêm phòng combo", pet: "Mochi", cost: "320.000₫", status: "completed", type: "vaccine", staff: "BS. Lê Thị Hoa", details: "Tiêm vaccine 5 trong 1" },
  { id: "H-004", date: "10/02/2026", service: "Lưu trú 5 ngày", pet: "Luna", cost: "800.000₫", status: "completed", type: "boarding", staff: "NV. Nguyễn Văn An", details: "Lưu trú từ 10/02 đến 15/02" },
];

interface Notification {
  id: number;
  type: "high" | "medium" | "info" | "promo";
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, type: "high",   title: "Nhắc tiêm vaccine cho Luna",  desc: "Vaccine phòng dại của Luna sắp hết hạn vào 03/07/2026. Đặt lịch ngay!", time: "2 giờ trước", read: false },
  { id: 2, type: "medium", title: "Lịch hẹn APT-024 sắp tới",    desc: "Bạn có lịch khám tổng quát cho Mochi vào 09:30 ngày 25/05/2026 với BS. Trần Hoài Nam.", time: "5 giờ trước", read: false },
  { id: 3, type: "info",   title: "Xác nhận đặt lịch thành công", desc: "Lịch hẹn APT-025 (Tiêm phòng dại cho Luna) đã được xác nhận.", time: "Hôm qua", read: true },
  { id: 4, type: "promo",  title: "Ưu đãi tháng 6 — Giảm 20%",   desc: "Dịch vụ grooming cao cấp giảm 20% cho tất cả khách hàng thân thiết trong tháng 6.", time: "2 ngày trước", read: true },
];

const NOTIF_CONFIG = {
  high:   { icon: AlertTriangle, bg: "#FEF2F2",  color: "#DC2626", borderColor: "#FECACA", label: "Quan trọng" },
  medium: { icon: Bell,          bg: "#FFFBEB",  color: "#D97706", borderColor: "#FDE68A", label: "Nhắc nhở" },
  info:   { icon: Info,          bg: "#EFF6FF",  color: "#2563EB", borderColor: "#BFDBFE", label: "Thông tin" },
  promo:  { icon: Megaphone,     bg: "#F5F3FF",  color: "#7C3AED", borderColor: "#DDD6FE", label: "Ưu đãi" },
};

export function CustomerPortal({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"home" | "apts" | "pets" | "history" | "notifications">("home");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [pets, setPets] = useState<Pet[]>(INITIAL_PETS);
  const [apts, setApts] = useState<Apt[]>(MOCK_APTS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  // Appointments filters
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "in_progress" | "completed" | "cancelled">("all");
  const [petFilter, setPetFilter] = useState<string>("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | "all">("all");

  // History filters
  const [historyTypeFilter, setHistoryTypeFilter] = useState<"all" | "medical" | "vaccine" | "grooming" | "boarding">("all");

  // Modals
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);
  const [viewingPet, setViewingPet] = useState<Pet | null>(null);
  const [viewingApt, setViewingApt] = useState<Apt | null>(null);
  const [viewingHistory, setViewingHistory] = useState<HistoryRecord | null>(null);
  const [isNewAptOpen, setIsNewAptOpen] = useState(false);
  const [bookingPetName, setBookingPetName] = useState<string | null>(null);
  const [reschedulingApt, setReschedulingApt] = useState<Apt | null>(null);
  const [cancellingAptId, setCancellingAptId] = useState<string | null>(null);

  // Filter logic for appointments
  const filteredApts = apts.filter((apt) => {
    // Status filter
    if (statusFilter === "upcoming" && !["PENDING", "CONFIRMED"].includes(apt.status)) return false;
    if (statusFilter === "in_progress" && !["CHECKED_IN", "IN_PROGRESS"].includes(apt.status)) return false;
    if (statusFilter === "completed" && apt.status !== "COMPLETED") return false;
    if (statusFilter === "cancelled" && !["CANCELLED", "NO_SHOW"].includes(apt.status)) return false;

    // Pet filter
    if (petFilter !== "all" && apt.pet !== petFilter) return false;

    // Service type filter
    if (serviceTypeFilter !== "all" && apt.serviceType !== serviceTypeFilter) return false;

    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const dismissNotif = (id: number) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const NAV = [
    { id: "home" as const,    label: "Trang chủ", icon: Heart },
    { id: "apts" as const,    label: "Lịch hẹn",  icon: Calendar },
    { id: "pets" as const,    label: "Thú cưng",  icon: Star },
    { id: "history" as const, label: "Lịch sử",   icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-20 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
            <PawSVG className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-foreground text-[15px] tracking-tight">PetCare Center</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Bell with dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifDropdown((v) => !v); }}
              className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-foreground transition-colors relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
              )}
            </button>

            {showNotifDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNotifDropdown(false)} />
                <div className="absolute right-0 top-12 z-40 w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-slate-900">Thông báo</span>
                      {unreadCount > 0 && (
                        <span className="text-[11px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">{unreadCount}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={markAllRead} className="text-[12px] text-cyan-600 font-semibold hover:underline">Đánh dấu đã đọc</button>
                      <button onClick={() => { setShowNotifDropdown(false); setTab("notifications"); }} className="text-[12px] text-slate-500 font-semibold hover:text-slate-700">Xem tất cả</button>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                    {notifications.slice(0, 4).map((n) => {
                      const cfg = NOTIF_CONFIG[n.type];
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={`flex gap-3 px-4 py-3.5 cursor-pointer transition-colors ${n.read ? "hover:bg-slate-50" : "bg-cyan-50/40 hover:bg-cyan-50/70"}`}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cfg.bg }}>
                            <Icon size={15} style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-[13px] font-semibold leading-snug ${n.read ? "text-slate-700" : "text-slate-900"}`}>{n.title}</span>
                              {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: "#0891B2" }} />}
                            </div>
                            <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.desc}</p>
                            <span className="text-[11px] text-slate-400 font-medium mt-1 block">{n.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
              <span className="text-sm font-bold text-white">NH</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-foreground">Nguyễn Thị Hà</div>
              <div className="text-[11px] font-medium text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full inline-flex mt-0.5">Khách hàng</div>
            </div>
          </div>
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Tab nav — same background as content area */}
      <div className="bg-slate-50 border-b border-slate-200/80 sticky top-[73px] z-10">
        <div className="flex justify-center max-w-4xl mx-auto w-full px-5">
          <div className="flex gap-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.id;
              const isNotifTab = n.id === "notifications";
              return (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${
                    active ? "text-cyan-600" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <div className="relative">
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                    {isNotifTab && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:inline">{n.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-cyan-500 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logout confirm */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmLogout(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-[320px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5 border border-red-100">
              <LogOut size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Xác nhận đăng xuất</h3>
            <p className="text-sm text-slate-500 text-center mt-2">Bạn có chắc muốn đăng xuất khỏi tài khoản?</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmLogout(false)} className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Huỷ</button>
              <button onClick={onLogout} className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">Đăng xuất</button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 px-5 py-8 max-w-4xl mx-auto w-full">

        {/* ── HOME ── */}
        {tab === "home" && (
          <div className="grid grid-cols-6 gap-4 auto-rows-[120px]">
            {/* Welcome Card - Large, spans 4 columns and 2 rows */}
            <div className="col-span-6 md:col-span-4 row-span-2 rounded-3xl p-6 text-white shadow-md relative overflow-hidden" style={{ background: "linear-gradient(135deg,#0891B2 0%,#06B6D4 100%)" }}>
              <div className="relative z-10 h-full flex flex-col">
                <p className="text-sm font-medium opacity-90 mb-1">Xin chào trở lại 👋</p>
                <h2 className="text-2xl font-bold">Nguyễn Thị Hà</h2>
                <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium w-fit">
                  <Calendar size={14} />
                  <span>Có <strong>{MOCK_APTS.length} lịch hẹn</strong> sắp tới</span>
                </div>
                <button
                  onClick={() => setTab("apts")}
                  className="mt-auto flex items-center gap-1.5 bg-white text-cyan-700 hover:bg-cyan-50 transition-colors rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm w-fit"
                >
                  Xem lịch hẹn <ChevronRight size={16} />
                </button>
              </div>
              <PawSVG className="absolute -right-8 -bottom-8 w-48 h-48 text-white opacity-10 rotate-[-15deg]" />
            </div>

            {/* Quick Actions - 2 tall cards on the right */}
            <button
              onClick={() => setIsNewAptOpen(true)}
              className="col-span-3 md:col-span-2 row-span-2 bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-md hover:border-cyan-200 transition-all active:scale-[0.98] group flex flex-col"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-auto group-hover:scale-110 transition-transform" style={{ background: "#ECFEFF" }}>
                <Plus size={22} style={{ color: "#0891B2" }} />
              </div>
              <div className="text-lg font-bold text-slate-900 leading-tight mt-4">Đặt lịch mới</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Chọn dịch vụ & bác sĩ</div>
            </button>

            <button
              onClick={() => setTab("pets")}
              className="col-span-3 md:col-span-2 row-span-2 bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-md hover:border-cyan-200 transition-all active:scale-[0.98] group flex flex-col"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-auto group-hover:scale-110 transition-transform" style={{ background: "#FFF1F2" }}>
                <Heart size={22} style={{ color: "#E11D48" }} />
              </div>
              <div className="text-lg font-bold text-slate-900 leading-tight mt-4">Hồ sơ thú cưng</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Xem tình trạng sức khoẻ</div>
            </button>

            {/* Bottom Quick Actions - 2 smaller cards */}
            <button
              onClick={() => setTab("history")}
              className="col-span-3 md:col-span-2 row-span-1 bg-white border border-slate-200 rounded-2xl p-4 text-left hover:shadow-md hover:border-cyan-200 transition-all active:scale-[0.98] group flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0" style={{ background: "#F5F3FF" }}>
                <Clock size={20} style={{ color: "#7C3AED" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold text-slate-900 leading-tight">Lịch sử dịch vụ</div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">Tất cả giao dịch</div>
              </div>
            </button>

            <button
              className="col-span-3 md:col-span-2 row-span-1 bg-white border border-slate-200 rounded-2xl p-4 text-left hover:shadow-md hover:border-cyan-200 transition-all active:scale-[0.98] group flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0" style={{ background: "#ECFDF5" }}>
                <MapPin size={20} style={{ color: "#059669" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold text-slate-900 leading-tight">Tìm phòng khám</div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">Địa chỉ & giờ mở cửa</div>
              </div>
            </button>

            {/* Upcoming Appointments - Wide card */}
            <div className={`bg-white border border-slate-200 rounded-3xl p-6 ${unreadCount > 0 ? 'col-span-6 md:col-span-4' : 'col-span-6'} row-span-2`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Lịch hẹn sắp tới</h3>
                <button onClick={() => setTab("apts")} className="text-sm font-semibold text-cyan-600 hover:text-cyan-700">Xem tất cả</button>
              </div>
              <div className="space-y-3">
                {MOCK_APTS.map((apt) => {
                  const Icon = apt.icon;
                  return (
                    <div key={apt.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:border-cyan-100 transition-colors cursor-pointer">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm border border-slate-100">
                        <Icon size={20} style={{ color: apt.iconColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold text-slate-900">{apt.service}</div>
                        <div className="text-sm font-medium text-slate-500 mt-0.5">
                          <span className="text-slate-700">{apt.pet}</span> • {apt.doctor}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-sm font-bold text-slate-900">{apt.date}</div>
                        <div className="text-xs font-semibold text-cyan-600 mt-0.5">{apt.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notification preview - appears only when there are unread notifications */}
            {unreadCount > 0 && (
              <div className="col-span-6 md:col-span-2 row-span-2 bg-white border border-slate-200 rounded-3xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Thông báo mới</h3>
                    <span className="text-[11px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">{unreadCount}</span>
                  </div>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {notifications.filter((n) => !n.read).slice(0, 3).map((n) => {
                    const cfg = NOTIF_CONFIG[n.type];
                    const Icon = cfg.icon;
                    return (
                      <div key={n.id} className="flex gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-shadow" style={{ borderColor: cfg.borderColor, background: cfg.bg }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "white" }}>
                          <Icon size={14} style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold line-clamp-1" style={{ color: cfg.color }}>{n.title}</div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">{n.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setTab("notifications")} className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 mt-3 text-center">Xem tất cả →</button>
              </div>
            )}

            {/* Pet Summary Cards - only show if no notifications */}
            {unreadCount === 0 && pets.slice(0, 2).map((pet) => {
              const clr = getPetColorById(pet.colorId);
              return (
                <div key={pet.id} className="col-span-3 md:col-span-2 row-span-1 bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewingPet(pet)}>
                  <div className="flex items-center gap-3">
                    {pet.image ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-sm" style={{ border: `2px solid ${clr.ring}` }}>
                        <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${clr.from}, ${clr.to})` }}
                      >
                        <span className="text-lg font-bold text-white">{pet.initials}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">{pet.name}</div>
                      <div className="text-xs font-medium text-slate-500 truncate">{pet.species} • {pet.breed}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">Khoẻ mạnh</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── APPOINTMENTS ── */}
        {tab === "apts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Lịch hẹn của tôi</h2>
              <button
                onClick={() => setIsNewAptOpen(true)}
                className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
              >
                <Plus size={16} strokeWidth={2.5} /> Đặt lịch mới
              </button>
            </div>

            {/* Status filter tabs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-1.5 inline-flex gap-1">
              {[
                { id: "all" as const,         label: "Tất cả" },
                { id: "upcoming" as const,    label: "Sắp tới" },
                { id: "in_progress" as const, label: "Đang xử lý" },
                { id: "completed" as const,   label: "Đã hoàn thành" },
                { id: "cancelled" as const,   label: "Đã hủy" },
              ].map((s) => {
                const active = statusFilter === s.id;
                const count = apts.filter((a) => {
                  if (s.id === "all") return true;
                  if (s.id === "upcoming") return ["PENDING", "CONFIRMED"].includes(a.status);
                  if (s.id === "in_progress") return ["CHECKED_IN", "IN_PROGRESS"].includes(a.status);
                  if (s.id === "completed") return a.status === "COMPLETED";
                  if (s.id === "cancelled") return ["CANCELLED", "NO_SHOW"].includes(a.status);
                  return false;
                }).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStatusFilter(s.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      active ? "bg-cyan-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {s.label} <span className={active ? "opacity-80" : "text-slate-400"}>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Quick filters */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thú cưng:</label>
                <select
                  value={petFilter}
                  onChange={(e) => setPetFilter(e.target.value)}
                  className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                >
                  <option value="all">Tất cả</option>
                  {pets.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loại dịch vụ:</label>
                <select
                  value={serviceTypeFilter}
                  onChange={(e) => setServiceTypeFilter(e.target.value as ServiceType | "all")}
                  className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                >
                  <option value="all">Tất cả</option>
                  <option value="Khám bệnh">Khám bệnh</option>
                  <option value="Tiêm phòng">Tiêm phòng</option>
                  <option value="Grooming">Grooming</option>
                  <option value="Lưu trú">Lưu trú</option>
                </select>
              </div>
            </div>

            {filteredApts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Calendar size={26} className="text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-700">Không tìm thấy lịch hẹn</h3>
                <p className="text-sm text-slate-400 mt-1 mb-5">Thử thay đổi bộ lọc hoặc đặt lịch mới</p>
                <button
                  onClick={() => setIsNewAptOpen(true)}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
                >
                  <Plus size={16} /> Đặt lịch ngay
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApts.map((apt) => {
                  const Icon = apt.icon;
                  const statusCfg = STATUS_CONFIG[apt.status];
                  const serviceTypeCfg = SERVICE_TYPE_CONFIG[apt.serviceType];
                  return (
                    <div
                      key={apt.id}
                      onClick={() => setViewingApt(apt)}
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-5">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: apt.iconBg }}>
                          <Icon size={24} style={{ color: apt.iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="text-lg font-bold text-slate-900">{apt.service}</div>
                              <div className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                                <span className="font-semibold text-slate-700">{apt.pet}</span> • {apt.doctor}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="px-2.5 py-1 text-xs font-bold rounded-lg" style={{ background: serviceTypeCfg.bg, color: serviceTypeCfg.color }}>
                                {apt.serviceType}
                              </span>
                              <span className="px-3 py-1.5 text-xs font-bold rounded-lg ring-1 ring-inset" style={{ background: statusCfg.bg, color: statusCfg.color, ringColor: statusCfg.ring }}>
                                {statusCfg.label}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 flex-wrap">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                              <Calendar size={16} className="text-slate-400" /> {apt.date}
                            </div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                              <Clock size={16} className="text-slate-400" /> {apt.time}
                            </div>
                            {apt.room && (
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <MapPin size={16} className="text-slate-400" /> {apt.room}
                              </div>
                            )}
                            {apt.queue && (
                              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-600">
                                <span className="text-[11px] font-bold bg-cyan-50 px-2 py-1 rounded-md">Số thứ tự: {apt.queue}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                        <div className="flex gap-3 mt-5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setReschedulingApt(apt)}
                            className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Đổi lịch
                          </button>
                          <button
                            onClick={() => setCancellingAptId(apt.id)}
                            className="flex-1 h-11 border border-red-100 text-red-600 bg-red-50 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                          >
                            Huỷ lịch
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PETS ── */}
        {tab === "pets" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Thú cưng của tôi</h2>
              <button
                onClick={() => setIsAddPetModalOpen(true)}
                className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
              >
                <Plus size={16} strokeWidth={2.5} /> Thêm thú cưng
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {pets.map((pet) => {
                const clr = getPetColorById(pet.colorId);
                return (
                  <div key={pet.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="p-6">
                      <div className="flex items-center gap-4">
                        {pet.image ? (
                          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 shadow-md" style={{ border: `3px solid ${clr.ring}` }}>
                            <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                            style={{ background: `linear-gradient(135deg, ${clr.from}, ${clr.to})`, border: "3px solid white" }}
                          >
                            <span className="text-2xl font-bold text-white">{pet.initials}</span>
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-xl tracking-tight">{pet.name}</div>
                          <div className="text-sm font-medium text-slate-500 mt-0.5">{pet.species} • {pet.breed}</div>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg ring-1 ring-inset ring-emerald-200/50">Khoẻ mạnh</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
                        {[
                          { label: "Tuổi",      value: pet.age },
                          { label: "Cân nặng",  value: pet.weight },
                          { label: "Tiêm nhắc", value: pet.nextVaccine },
                        ].map((info) => (
                          <div key={info.label} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{info.label}</div>
                            <div className="text-sm font-bold text-slate-800 mt-1">{info.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => setViewingPet(pet)}
                          className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          Hồ sơ đầy đủ
                        </button>
                        <button
                          onClick={() => { setBookingPetName(pet.name); setIsNewAptOpen(true); }}
                          className="flex-1 h-11 rounded-xl text-sm font-bold text-white shadow-sm transition-colors hover:shadow-md"
                          style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
                        >
                          Đặt lịch khám
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === "history" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Lịch sử dịch vụ</h2>

            {/* Type filter tabs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-1.5 inline-flex gap-1 overflow-x-auto">
              {[
                { id: "all" as const,      label: "Tất cả", icon: CheckCircle2 },
                { id: "medical" as const,  label: "Khám bệnh", icon: Stethoscope },
                { id: "vaccine" as const,  label: "Tiêm phòng", icon: Syringe },
                { id: "grooming" as const, label: "Grooming", icon: Star },
                { id: "boarding" as const, label: "Lưu trú", icon: Calendar },
              ].map((t) => {
                const active = historyTypeFilter === t.id;
                const Icon = t.icon;
                const count = HISTORY.filter((h) => t.id === "all" || h.type === t.id).length;
                return (
                  <button
                    key={t.id}
                    onClick={() => setHistoryTypeFilter(t.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                      active ? "bg-cyan-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                    {t.label} <span className={active ? "opacity-80" : "text-slate-400"}>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* History list */}
            <div className="space-y-4">
              {HISTORY.filter((h) => historyTypeFilter === "all" || h.type === historyTypeFilter).map((h) => {
                const typeIcons: Record<HistoryRecord["type"], React.ElementType> = {
                  medical: Stethoscope,
                  vaccine: Syringe,
                  grooming: Star,
                  boarding: Calendar,
                };
                const typeColors: Record<HistoryRecord["type"], { bg: string; color: string }> = {
                  medical: { bg: "#ECFEFF", color: "#0891B2" },
                  vaccine: { bg: "#ECFDF5", color: "#059669" },
                  grooming: { bg: "#FFFBEB", color: "#D97706" },
                  boarding: { bg: "#F5F3FF", color: "#7C3AED" },
                };
                const Icon = typeIcons[h.type];
                const clr = typeColors[h.type];
                return (
                  <div
                    key={h.id}
                    onClick={() => setViewingHistory(h)}
                    className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: clr.bg }}>
                        <Icon size={22} style={{ color: clr.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold text-slate-900">{h.service}</div>
                        <div className="text-sm font-medium text-slate-500 mt-1">
                          <span className="text-slate-700">{h.pet}</span> • {h.staff} • {h.date}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-slate-900">{h.cost}</div>
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md ring-1 ring-inset ring-emerald-200/50">
                          {h.status === "completed" ? "Hoàn thành" : h.status === "pending" ? "Chờ thanh toán" : "Đã hủy"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab === "notifications" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Thông báo</h2>
                <p className="text-sm text-slate-500 mt-0.5">{unreadCount > 0 ? `${unreadCount} chưa đọc` : "Tất cả đã đọc"}</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Check size={14} /> Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Bell size={26} className="text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-700">Không có thông báo</h3>
                <p className="text-sm text-slate-400 mt-1">Mọi thứ đều ổn định. Chúng tôi sẽ thông báo khi có tin mới.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => {
                  const cfg = NOTIF_CONFIG[n.type];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${n.read ? "border-slate-200 opacity-80" : "border-slate-200"}`}
                    >
                      {!n.read && <div className="h-0.5" style={{ background: `linear-gradient(to right, ${cfg.color}, transparent)` }} />}
                      <div className="flex gap-4 p-5">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: cfg.bg }}>
                          <Icon size={18} style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[14px] font-bold ${n.read ? "text-slate-700" : "text-slate-900"}`}>{n.title}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                            </div>
                            <button onClick={() => dismissNotif(n.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0">
                              <X size={14} />
                            </button>
                          </div>
                          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">{n.desc}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-[12px] text-slate-400 font-medium flex items-center gap-1">
                              <Clock size={11} /> {n.time}
                            </span>
                            <div className="flex items-center gap-2">
                              {!n.read && (
                                <button
                                  onClick={() => markRead(n.id)}
                                  className="text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                  Đánh dấu đã đọc
                                </button>
                              )}
                              {(n.type === "high" || n.type === "medium") && (
                                <button
                                  onClick={() => setTab("apts")}
                                  className="text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                                  style={{ background: cfg.bg, color: cfg.color }}
                                >
                                  Xử lý ngay →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Pet Modal */}
      {isAddPetModalOpen && (
        <AddPetModal
          onClose={() => setIsAddPetModalOpen(false)}
          onAdd={(pet) => {
            setPets([...pets, {
              ...pet,
              id: Date.now(),
              initials: pet.name.substring(0, 2).toUpperCase(),
              colorId: "cyan",
              healthy: true,
              image: "",
              lastVisit: "Chưa có",
              nextVaccine: "Chưa có",
            }]);
            setIsAddPetModalOpen(false);
          }}
        />
      )}

      {/* View/Edit Pet Modal */}
      {viewingPet && (
        <PetProfileModal
          pet={viewingPet}
          onClose={() => setViewingPet(null)}
          onSave={(updated) => {
            setPets(pets.map((p) => (p.id === updated.id ? updated : p)));
            setViewingPet(null);
          }}
          onBookAppointment={(petName) => {
            setViewingPet(null);
            setBookingPetName(petName);
            setIsNewAptOpen(true);
          }}
        />
      )}

      {/* New Appointment Modal */}
      {isNewAptOpen && (
        <NewAppointmentModal
          pets={pets}
          defaultPet={bookingPetName ?? undefined}
          onClose={() => { setIsNewAptOpen(false); setBookingPetName(null); }}
          onAdd={(apt) => {
            setApts((prev) => [...prev, apt]);
            setIsNewAptOpen(false);
            setBookingPetName(null);
            setTab("apts");
          }}
        />
      )}

      {/* Reschedule Modal */}
      {reschedulingApt && (
        <RescheduleModal
          apt={reschedulingApt}
          onClose={() => setReschedulingApt(null)}
          onSave={(id, date, time) => {
            setApts((prev) => prev.map((a) => a.id === id ? { ...a, date, time } : a));
            setReschedulingApt(null);
          }}
        />
      )}

      {/* Appointment Detail Modal */}
      {viewingApt && (
        <AppointmentDetailModal
          apt={viewingApt}
          onClose={() => setViewingApt(null)}
          onReschedule={(apt) => { setViewingApt(null); setReschedulingApt(apt); }}
          onCancel={(id) => { setViewingApt(null); setCancellingAptId(id); }}
        />
      )}

      {/* History Detail Modal */}
      {viewingHistory && (
        <HistoryDetailModal
          record={viewingHistory}
          onClose={() => setViewingHistory(null)}
        />
      )}

      {/* Cancel Confirm */}
      {cancellingAptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setCancellingAptId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-[320px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5 border border-red-100">
              <X size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Huỷ lịch hẹn?</h3>
            <p className="text-sm text-slate-500 text-center mt-2">Lịch hẹn sẽ bị xoá và không thể khôi phục.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCancellingAptId(null)} className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Giữ lại</button>
              <button
                onClick={() => { setApts((prev) => prev.filter((a) => a.id !== cancellingAptId)); setCancellingAptId(null); }}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Xác nhận huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Pet Modal
// ─────────────────────────────────────────────────────────────────────────────

function AddPetModal({ onClose, onAdd }: { onClose: () => void; onAdd: (pet: any) => void }) {
  const [formData, setFormData] = useState({ name: "", species: "Chó", breed: "", age: "", weight: "" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between rounded-t-3xl">
          <h3 className="text-lg font-bold text-slate-900">Thêm thú cưng mới</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center mx-auto mb-6 cursor-pointer hover:bg-slate-200 transition-colors">
            <Camera size={24} className="text-slate-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-500">Tải ảnh lên</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Tên thú cưng</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                type="text"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                placeholder="VD: Mochi"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Giống loài</label>
                <select
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all appearance-none"
                >
                  <option value="Chó">Chó</option>
                  <option value="Mèo">Mèo</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Giống (Breed)</label>
                <input
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  type="text"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  placeholder="VD: Poodle"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Tuổi</label>
                <input
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  type="text"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  placeholder="VD: 2 tuổi"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Cân nặng</label>
                <input
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  type="text"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  placeholder="VD: 4.5 kg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
          <button
            onClick={() => onAdd(formData)}
            disabled={!formData.name}
            className="w-full h-12 rounded-xl text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
          >
            Lưu thú cưng
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pet Profile Modal (với tabs)
// ─────────────────────────────────────────────────────────────────────────────

type PetTab = "overview" | "medical" | "vaccine" | "grooming" | "boarding" | "invoices";

function PetProfileModal({ pet, onClose, onSave, onBookAppointment }: { pet: Pet; onClose: () => void; onSave: (pet: Pet) => void; onBookAppointment?: (petName: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Pet>({ ...pet });
  const [activeTab, setActiveTab] = useState<PetTab>("overview");

  const clr = getPetColorById(pet.colorId);

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  const TABS: { id: PetTab; label: string }[] = [
    { id: "overview", label: "Tổng quan" },
    { id: "medical",  label: "Lịch sử khám" },
    { id: "vaccine",  label: "Tiêm chủng" },
    { id: "grooming", label: "Grooming" },
    { id: "boarding", label: "Lưu trú" },
    { id: "invoices", label: "Hóa đơn" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            {pet.image ? (
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex-shrink-0">
                <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${clr.from}, ${clr.to})` }}
              >
                <span className="text-xl font-bold text-white">{pet.initials}</span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900">{pet.name}</h3>
              <p className="text-sm text-slate-500">{pet.species} • {pet.breed}</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg ring-1 ring-inset ring-emerald-200/50">Khoẻ mạnh</span>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && activeTab === "overview" && (
              <button
                onClick={() => setIsEditing(true)}
                className="h-9 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
              >
                <Edit2 size={13} /> Sửa
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSave}
                className="h-9 px-3 rounded-xl text-sm font-bold text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                style={{ background: "#0891B2" }}
              >
                <Check size={14} strokeWidth={3} /> Lưu
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100 px-6 flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setIsEditing(false); }}
                className={`px-4 py-3 text-sm font-bold transition-all relative whitespace-nowrap ${
                  active ? "text-cyan-600" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
                {active && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500 rounded-t-full" />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {activeTab === "overview" && !isEditing && <PetOverviewTab pet={pet} onBookAppointment={onBookAppointment} />}
          {activeTab === "overview" && isEditing && <PetEditForm formData={formData} setFormData={setFormData} />}
          {activeTab === "medical" && <PetMedicalHistoryTab pet={pet} />}
          {activeTab === "vaccine" && <PetVaccineTab pet={pet} />}
          {activeTab === "grooming" && <PetGroomingTab pet={pet} />}
          {activeTab === "boarding" && <PetBoardingTab pet={pet} />}
          {activeTab === "invoices" && <PetInvoicesTab pet={pet} />}
        </div>
      </div>
    </div>
  );
}

// ──────── Pet Overview Tab ────────
function PetOverviewTab({ pet, onBookAppointment }: { pet: Pet; onBookAppointment?: (petName: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Tuổi",           value: pet.age },
          { label: "Cân nặng",       value: pet.weight },
          { label: "Khám gần nhất",  value: pet.lastVisit },
          { label: "Tiêm nhắc lại",  value: pet.nextVaccine },
        ].map((info) => (
          <div key={info.label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{info.label}</div>
            <div className="text-base font-bold text-slate-800">{info.value}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Thông tin y tế tóm tắt</h3>
        <ul className="space-y-3">
          <li className="flex gap-3 items-start">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#0891B2" }} />
            <div>
              <div className="text-sm font-bold text-slate-800">Đã tiêm phòng dại</div>
              <div className="text-xs text-slate-500 mt-0.5">Mũi cuối: 03/07/2025</div>
            </div>
          </li>
          <li className="flex gap-3 items-start">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#0891B2" }} />
            <div>
              <div className="text-sm font-bold text-slate-800">Sức khoẻ răng miệng tốt</div>
              <div className="text-xs text-slate-500 mt-0.5">Kiểm tra lần cuối: 12/05/2026</div>
            </div>
          </li>
        </ul>
      </div>

      <button
        onClick={() => onBookAppointment?.(pet.name)}
        className="w-full h-12 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md"
        style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
      >
        Đặt lịch khám cho {pet.name}
      </button>
    </div>
  );
}

// ──────── Pet Edit Form ────────
function PetEditForm({ formData, setFormData }: { formData: Pet; setFormData: (data: Pet) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Tên thú cưng</label>
        <input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          type="text"
          className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Giống loài</label>
          <select
            value={formData.species}
            onChange={(e) => setFormData({ ...formData, species: e.target.value })}
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all appearance-none"
          >
            <option value="Chó">Chó</option>
            <option value="Mèo">Mèo</option>
            <option value="Khác">Khác</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Giống (Breed)</label>
          <input
            value={formData.breed}
            onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
            type="text"
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Tuổi</label>
          <input
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            type="text"
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Cân nặng</label>
          <input
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            type="text"
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">URL Ảnh (Tuỳ chọn)</label>
        <input
          value={formData.image || ""}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          type="text"
          className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          placeholder="https://..."
        />
      </div>
    </div>
  );
}

// ──────── Pet Medical History Tab ────────
function PetMedicalHistoryTab({ pet }: { pet: Pet }) {
  const medicalHistory = [
    { date: "12/05/2026", doctor: "BS. Trần Hoài Nam", service: "Khám tổng quát", diagnosis: "Sức khỏe ổn định", status: "completed" },
    { date: "15/03/2026", doctor: "BS. Lê Thị Hoa", service: "Khám da liễu", diagnosis: "Da khô nhẹ, kê thuốc bôi", status: "completed" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Lịch sử khám bệnh của {pet.name}</p>
      {medicalHistory.map((record, idx) => (
        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-cyan-200 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-base font-bold text-slate-900">{record.service}</div>
              <div className="text-sm text-slate-500 mt-1">{record.doctor} • {record.date}</div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">Hoàn thành</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Chẩn đoán</div>
            <div className="text-sm font-semibold text-slate-800">{record.diagnosis}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ──────── Pet Vaccine Tab ────────
function PetVaccineTab({ pet }: { pet: Pet }) {
  const vaccines = [
    { name: "Vaccine phòng dại", date: "03/07/2025", nextDate: "03/07/2026", doctor: "BS. Lê Thị Hoa", status: "upcoming" as const },
    { name: "Vaccine 5 trong 1", date: "15/01/2025", nextDate: "15/01/2026", doctor: "BS. Trần Hoài Nam", status: "completed" as const },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Lịch sử tiêm chủng của {pet.name}</p>
      {vaccines.map((v, idx) => {
        const isUpcoming = v.status === "upcoming";
        return (
          <div key={idx} className={`border rounded-2xl p-5 ${isUpcoming ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-base font-bold text-slate-900">{v.name}</div>
                <div className="text-sm text-slate-500 mt-1">Tiêm lần cuối: {v.date}</div>
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${isUpcoming ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                {isUpcoming ? "Sắp đến hạn" : "Đã tiêm"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-sm text-slate-600">Nhắc lại: <strong className="text-slate-900">{v.nextDate}</strong></span>
              {isUpcoming && (
                <button className="h-9 px-4 rounded-lg text-xs font-bold text-white" style={{ background: "#0891B2" }}>
                  Đặt lịch tiêm
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────── Pet Grooming Tab ────────
function PetGroomingTab({ pet }: { pet: Pet }) {
  const groomingHistory = [
    { date: "03/04/2026", service: "Grooming đầy đủ", staff: "NV. Phạm Minh Anh", cost: "350.000₫", note: "Cắt tỉa lông, tắm, vệ sinh tai" },
    { date: "10/02/2026", service: "Tắm + cắt móng", staff: "NV. Lê Thu Hà", cost: "150.000₫", note: "Tắm thơm, cắt móng" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Lịch sử dịch vụ chăm sóc của {pet.name}</p>
      {groomingHistory.map((g, idx) => (
        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-base font-bold text-slate-900">{g.service}</div>
              <div className="text-sm text-slate-500 mt-1">{g.staff} • {g.date}</div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-slate-900">{g.cost}</div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ghi chú</div>
            <div className="text-sm text-slate-700">{g.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ──────── Pet Boarding Tab ────────
function PetBoardingTab({ pet }: { pet: Pet }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Calendar size={26} className="text-slate-400" />
      </div>
      <h3 className="text-base font-bold text-slate-700">Chưa có lịch sử lưu trú</h3>
      <p className="text-sm text-slate-400 mt-1">{pet.name} chưa từng lưu trú tại trung tâm</p>
    </div>
  );
}

// ──────── Pet Invoices Tab ────────
function PetInvoicesTab({ pet }: { pet: Pet }) {
  const invoices = [
    { id: "INV-2026-051", date: "12/05/2026", service: "Khám tổng quát", amount: "250.000₫", status: "paid" as const },
    { id: "INV-2026-042", date: "03/04/2026", service: "Grooming đầy đủ", amount: "350.000₫", status: "paid" as const },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Hóa đơn liên quan đến {pet.name}</p>
      {invoices.map((inv) => (
        <div key={inv.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-slate-900">{inv.service}</div>
            <div className="text-sm text-slate-500 mt-1">{inv.id} • {inv.date}</div>
          </div>
          <div className="text-right">
            <div className="text-base font-bold text-cyan-600">{inv.amount}</div>
            <span className="inline-flex mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md">Đã thanh toán</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Appointment Modal
// ─────────────────────────────────────────────────────────────────────────────

const SERVICES = [
  { label: "Khám tổng quát",  icon: Stethoscope,  iconColor: "#0891B2", iconBg: "#ECFEFF" },
  { label: "Tiêm phòng",      icon: Syringe,      iconColor: "#059669", iconBg: "#ECFDF5" },
  { label: "Grooming",        icon: Star,         iconColor: "#D97706", iconBg: "#FFFBEB" },
  { label: "Khám da liễu",    icon: Heart,        iconColor: "#E11D48", iconBg: "#FFF1F2" },
  { label: "Lưu trú",         icon: Calendar,     iconColor: "#7C3AED", iconBg: "#F5F3FF" },
  { label: "Khám ngoại khoa", icon: CheckCircle2, iconColor: "#0891B2", iconBg: "#ECFEFF" },
];

const DOCTORS = [
  "BS. Trần Hoài Nam",
  "BS. Lê Thị Hoa",
  "BS. Nguyễn Đức Trung",
  "BS. Phạm Minh Đức",
];

const INPUT_CLS = "w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all";
const LABEL_CLS = "block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide";

function NewAppointmentModal({ pets, defaultPet, onClose, onAdd }: { pets: Pet[]; defaultPet?: string; onClose: () => void; onAdd: (apt: any) => void }) {
  const [form, setForm] = useState({
    pet: defaultPet ?? pets[0]?.name ?? "",
    serviceIdx: 0,
    doctor: DOCTORS[0],
    date: "",
    time: "",
    note: "",
  });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [newAptId, setNewAptId] = useState("");

  const svc = SERVICES[form.serviceIdx];
  const canNext = !!(form.pet && form.date && form.time);

  const handleConfirm = () => {
    const id = `APT-${Date.now()}`;
    setNewAptId(id);
    const serviceType: ServiceType = svc.label === "Tiêm phòng" ? "Tiêm phòng" : svc.label === "Grooming" ? "Grooming" : svc.label === "Lưu trú" ? "Lưu trú" : "Khám bệnh";
    onAdd({
      id,
      date: form.date,
      time: form.time,
      service: svc.label,
      pet: form.pet,
      doctor: form.doctor,
      icon: svc.icon,
      iconColor: svc.iconColor,
      iconBg: svc.iconBg,
      status: "PENDING" as AptStatus,
      serviceType,
    });
    setStep(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={step === 3 ? onClose : undefined}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {step !== 3 && (
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Đặt lịch mới</h3>
              <p className="text-xs text-slate-400 mt-0.5">Bước {step}/2</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className={LABEL_CLS}>Dịch vụ</label>
                <div className="grid grid-cols-3 gap-2">
                  {SERVICES.map((s, i) => {
                    const Icon = s.icon;
                    const active = form.serviceIdx === i;
                    return (
                      <button
                        key={s.label}
                        onClick={() => setForm({ ...form, serviceIdx: i })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all ${
                          active ? "border-cyan-400 bg-cyan-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.iconBg }}>
                          <Icon size={16} style={{ color: s.iconColor }} />
                        </div>
                        <span className={`text-[11px] font-bold leading-tight ${active ? "text-cyan-700" : "text-slate-600"}`}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>Thú cưng</label>
                <select value={form.pet} onChange={(e) => setForm({ ...form, pet: e.target.value })} className={INPUT_CLS + " appearance-none"}>
                  {pets.map((p) => <option key={p.id} value={p.name}>{p.name} ({p.species})</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL_CLS}>Bác sĩ</label>
                <select value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} className={INPUT_CLS + " appearance-none"}>
                  {DOCTORS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Ngày khám</label>
                  <input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Giờ khám</label>
                  <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={INPUT_CLS + " appearance-none"}>
                    <option value="">Chọn giờ</option>
                    {["08:00","08:30","09:00","09:30","10:00","10:30","11:00","13:30","14:00","14:30","15:00","15:30","16:00"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>Ghi chú (tuỳ chọn)</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={2}
                  placeholder="Triệu chứng, yêu cầu đặc biệt..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-1">
              <p className="text-sm text-slate-500 mb-4">Vui lòng kiểm tra thông tin trước khi xác nhận.</p>
              {[
                { label: "Dịch vụ",   value: svc.label },
                { label: "Thú cưng",  value: form.pet },
                { label: "Bác sĩ",    value: form.doctor },
                { label: "Ngày khám", value: form.date },
                { label: "Giờ khám",  value: form.time },
              ].map((r) => (
                <div key={r.label} className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500 font-medium">{r.label}</span>
                  <span className="text-sm font-bold text-slate-900">{r.value}</span>
                </div>
              ))}
              {form.note && (
                <div className="flex justify-between items-start pt-3">
                  <span className="text-sm text-slate-500 font-medium">Ghi chú</span>
                  <span className="text-sm font-semibold text-slate-700 max-w-[200px] text-right">{form.note}</span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5 border-4 border-emerald-100">
                <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Đặt lịch thành công!</h3>
              <p className="text-sm text-slate-500 mb-1">Lịch hẹn của bạn đã được ghi nhận</p>
              <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl mt-4 mb-8">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã lịch hẹn</span>
                <span className="text-base font-bold text-cyan-600">{newAptId}</span>
              </div>
              <div className="space-y-3 w-full">
                <button
                  onClick={onClose}
                  className="w-full h-12 rounded-xl text-sm font-bold text-white shadow-sm transition-all"
                  style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
                >
                  Xem lịch hẹn của tôi
                </button>
                <button
                  onClick={() => { setStep(1); setForm({ ...form, serviceIdx: 0, date: "", time: "", note: "" }); }}
                  className="w-full h-11 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Đặt thêm lịch khác
                </button>
              </div>
            </div>
          )}
        </div>

        {step !== 3 && (
          <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex gap-3">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="h-12 px-5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                Quay lại
              </button>
            )}
            <button
              onClick={step === 1 ? () => setStep(2) : handleConfirm}
              disabled={!canNext}
              className="flex-1 h-12 rounded-xl text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
            >
              {step === 1 ? "Tiếp theo →" : "Xác nhận đặt lịch"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Appointment Detail Modal
// ─────────────────────────────────────────────────────────────────────────────

function AppointmentDetailModal({ apt, onClose, onReschedule, onCancel }: { apt: Apt; onClose: () => void; onReschedule: (apt: Apt) => void; onCancel: (id: string) => void }) {
  const Icon = apt.icon;
  const statusCfg = STATUS_CONFIG[apt.status];
  const serviceTypeCfg = SERVICE_TYPE_CONFIG[apt.serviceType];

  const timeline: { label: string; time: string; completed: boolean }[] = [
    { label: "Đặt lịch", time: "20/05 08:30", completed: true },
    { label: "Xác nhận", time: "20/05 09:15", completed: true },
    { label: "Check-in", time: apt.status === "CHECKED_IN" || apt.status === "IN_PROGRESS" || apt.status === "COMPLETED" ? `${apt.date} ${apt.time}` : "-", completed: ["CHECKED_IN", "IN_PROGRESS", "COMPLETED"].includes(apt.status) },
    { label: "Đang thực hiện", time: apt.status === "IN_PROGRESS" || apt.status === "COMPLETED" ? "-" : "-", completed: ["IN_PROGRESS", "COMPLETED"].includes(apt.status) },
    { label: "Hoàn thành", time: apt.status === "COMPLETED" ? "-" : "-", completed: apt.status === "COMPLETED" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: apt.iconBg }}>
              <Icon size={24} style={{ color: apt.iconColor }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{apt.service}</h3>
              <p className="text-sm text-slate-500 mt-0.5">Mã: {apt.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 text-xs font-bold rounded-lg ring-1 ring-inset" style={{ background: statusCfg.bg, color: statusCfg.color, ringColor: statusCfg.ring }}>
              {statusCfg.label}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Thông tin chính</h4>
                <div className="space-y-3">
                  {[
                    { label: "Thú cưng", value: apt.pet },
                    { label: "Loại dịch vụ", value: apt.serviceType, badge: true },
                    { label: "Ngày hẹn", value: apt.date },
                    { label: "Giờ hẹn", value: apt.time },
                    { label: "Người phụ trách", value: apt.doctor },
                    ...(apt.room ? [{ label: "Phòng/Chuồng", value: apt.room }] : []),
                    ...(apt.queue ? [{ label: "Số thứ tự", value: apt.queue }] : []),
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm font-medium text-slate-500">{item.label}</span>
                      {item.badge ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: serviceTypeCfg.bg, color: serviceTypeCfg.color }}>
                          {item.value}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-slate-900">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Chi phí dự kiến</h4>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Phí dịch vụ</span>
                    <span className="text-sm font-bold text-slate-900">250.000₫</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-sm font-bold text-slate-700">Tổng tạm tính</span>
                    <span className="text-base font-bold text-cyan-600">250.000₫</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Timeline trạng thái</h4>
                <div className="space-y-3">
                  {timeline.map((step, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.completed ? "bg-cyan-500" : "bg-slate-200"}`}>
                          {step.completed ? <Check size={16} className="text-white" strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                        </div>
                        {idx < timeline.length - 1 && <div className={`w-0.5 h-8 ${step.completed ? "bg-cyan-200" : "bg-slate-200"}`} />}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className={`text-sm font-bold ${step.completed ? "text-slate-900" : "text-slate-400"}`}>{step.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{step.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ghi chú</h4>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-sm text-slate-700 leading-relaxed">Kiểm tra sức khỏe định kỳ. Thú cưng ăn uống bình thường.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
          <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex gap-3">
            <button
              onClick={() => onReschedule(apt)}
              className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              Đổi lịch
            </button>
            <button
              onClick={() => onCancel(apt.id)}
              className="flex-1 h-11 border border-red-100 text-red-600 bg-red-50 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
            >
              Huỷ lịch
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// History Detail Modal
// ─────────────────────────────────────────────────────────────────────────────

function HistoryDetailModal({ record, onClose }: { record: HistoryRecord; onClose: () => void }) {
  const typeIcons: Record<HistoryRecord["type"], React.ElementType> = {
    medical: Stethoscope,
    vaccine: Syringe,
    grooming: Star,
    boarding: Calendar,
  };
  const typeColors: Record<HistoryRecord["type"], { bg: string; color: string }> = {
    medical: { bg: "#ECFEFF", color: "#0891B2" },
    vaccine: { bg: "#ECFDF5", color: "#059669" },
    grooming: { bg: "#FFFBEB", color: "#D97706" },
    boarding: { bg: "#F5F3FF", color: "#7C3AED" },
  };
  const Icon = typeIcons[record.type];
  const clr = typeColors[record.type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: clr.bg }}>
              <Icon size={24} style={{ color: clr.color }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{record.service}</h3>
              <p className="text-sm text-slate-500 mt-0.5">Mã: {record.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Thông tin dịch vụ</h4>
                <div className="space-y-3">
                  {[
                    { label: "Thú cưng", value: record.pet },
                    { label: "Người phụ trách", value: record.staff },
                    { label: "Ngày thực hiện", value: record.date },
                    { label: "Loại dịch vụ", value: record.type === "medical" ? "Khám bệnh" : record.type === "vaccine" ? "Tiêm phòng" : record.type === "grooming" ? "Grooming" : "Lưu trú" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm font-medium text-slate-500">{item.label}</span>
                      <span className="text-sm font-bold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Chi tiết</h4>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-sm text-slate-700 leading-relaxed">{record.details || "Không có ghi chú"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Hóa đơn</h4>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-slate-600">Phí dịch vụ</span>
                    <span className="text-sm font-bold text-slate-900">{record.cost}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <span className="text-sm font-bold text-slate-700">Tổng tiền</span>
                    <span className="text-lg font-bold text-cyan-600">{record.cost}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Trạng thái thanh toán</span>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">Đã thanh toán</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="w-full h-11 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Tải hóa đơn PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reschedule Modal
// ─────────────────────────────────────────────────────────────────────────────

function RescheduleModal({ apt, onClose, onSave }: { apt: any; onClose: () => void; onSave: (id: string, date: string, time: string) => void }) {
  const [date, setDate] = useState(apt.date);
  const [time, setTime] = useState(apt.time);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Đổi lịch hẹn</h3>
            <p className="text-xs text-slate-400 mt-0.5">{apt.service} · {apt.pet}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-slate-400 font-medium text-xs uppercase tracking-wide mb-1">Lịch hiện tại</p>
            <p className="font-bold text-slate-700 text-sm">{apt.date} · {apt.time}</p>
          </div>

          <div>
            <label className={LABEL_CLS}>Ngày mới</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Giờ mới</label>
            <select value={time} onChange={(e) => setTime(e.target.value)} className={INPUT_CLS + " appearance-none"}>
              {["08:00","08:30","09:00","09:30","10:00","10:30","11:00","13:30","14:00","14:30","15:00","15:30","16:00"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
          <button
            onClick={() => onSave(apt.id, date, time)}
            disabled={!date || !time}
            className="w-full h-12 rounded-xl text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
          >
            Xác nhận đổi lịch
          </button>
        </div>
      </div>
    </div>
  );
}
