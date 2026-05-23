import { useState } from "react";
import {
  LogOut, Bell, Calendar, CheckCircle2, Clock, Scissors,
  BedDouble, Settings, ChevronRight, User, Package,
  Stethoscope, Star, Home, DollarSign, X, Check,
  AlertTriangle, Coffee, Activity, Eye, Edit2, Plus,
  MessageSquare, Camera, FileText, Search,
} from "lucide-react";

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

// ─────────────────────────────────────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────────────────────────────────────

type AptStatus = "scheduled" | "checked_in" | "in_progress" | "completed";
type ServiceType = "exam" | "grooming" | "boarding" | "vaccination";

interface Appointment {
  id: string;
  time: string;
  petName: string;
  species: string;
  breed: string;
  owner: string;
  phone: string;
  service: string;
  serviceType: ServiceType;
  status: AptStatus;
  room?: string;
  queue?: string;
}

interface GroomingTask {
  id: number;
  time: string;
  petName: string;
  breed: string;
  service: string;
  status: "scheduled" | "in_progress" | "completed";
  owner: string;
  notes?: string;
}

interface BoardingGuest {
  room: number;
  petName: string;
  species: string;
  breed: string;
  owner: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  foodType: string;
  mealsPerDay: number;
  specialNotes: string;
  todayStatus: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    cleaned: boolean;
    exercised: boolean;
    healthCheck: boolean;
  };
}

interface PaymentItem {
  id: string;
  date: string;
  petName: string;
  owner: string;
  service: string;
  amount: number;
  status: "pending" | "paid";
}

const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: "APT-001", time: "08:30", petName: "Mochi", species: "Chó", breed: "Poodle", owner: "Nguyễn Thị Mai", phone: "0912345678", service: "Khám tổng quát", serviceType: "exam", status: "scheduled", queue: "A001" },
  { id: "APT-002", time: "09:00", petName: "Kiwi", species: "Mèo", breed: "British", owner: "Phạm Văn Đức", phone: "0923456789", service: "Tiêm phòng dại", serviceType: "vaccination", status: "scheduled", queue: "A002" },
  { id: "APT-003", time: "09:30", petName: "Buddy", species: "Chó", breed: "Labrador", owner: "Lê Thị Hương", phone: "0934567890", service: "Grooming cao cấp", serviceType: "grooming", status: "checked_in", room: "G-01" },
  { id: "APT-004", time: "10:00", petName: "Luna", species: "Mèo", breed: "Scottish Fold", owner: "Trần Minh Khoa", phone: "0945678901", service: "Khám da liễu", serviceType: "exam", status: "in_progress", room: "K-02" },
];

const INITIAL_GROOMING_TASKS: GroomingTask[] = [
  { id: 1, time: "09:30", petName: "Buddy", breed: "Labrador", service: "Grooming cao cấp", status: "in_progress", owner: "Lê Thị Hương", notes: "Cắt lông ngắn, massage thư giãn" },
  { id: 2, time: "11:00", petName: "Pumpkin", breed: "Poodle", service: "Cắt tỉa lông", status: "scheduled", owner: "Phan Văn Hải" },
  { id: 3, time: "14:00", petName: "Cookie", breed: "Bichon", service: "Tắm & sấy tiêu chuẩn", status: "scheduled", owner: "Vũ Thị Hà" },
  { id: 4, time: "15:30", petName: "Milo", breed: "Poodle", service: "Tắm & vệ sinh tai", status: "scheduled", owner: "Phan Anh Tuấn" },
];

const INITIAL_BOARDING: BoardingGuest[] = [
  {
    room: 1, petName: "Mochi", species: "Chó", breed: "Poodle", owner: "Nguyễn Thị Mai", phone: "0912345678",
    checkIn: "19/05/2026", checkOut: "22/05/2026", nights: 3,
    foodType: "Royal Canin Poodle", mealsPerDay: 2, specialNotes: "Cho ăn 2 lần/ngày, 7h sáng và 6h chiều",
    todayStatus: { breakfast: true, lunch: false, dinner: false, cleaned: true, exercised: true, healthCheck: true }
  },
  {
    room: 2, petName: "Buddy", species: "Chó", breed: "Labrador", owner: "Lê Thị Hương", phone: "0934567890",
    checkIn: "20/05/2026", checkOut: "22/05/2026", nights: 2,
    foodType: "Pedigree Adult", mealsPerDay: 2, specialNotes: "Ăn nhiều, cần vận động 2 lần/ngày",
    todayStatus: { breakfast: true, lunch: false, dinner: false, cleaned: false, exercised: false, healthCheck: true }
  },
  {
    room: 3, petName: "Charlie", species: "Chó", breed: "Golden Retriever", owner: "Bùi Thị Lan", phone: "0956789012",
    checkIn: "21/05/2026", checkOut: "24/05/2026", nights: 3,
    foodType: "Tự mang từ nhà", mealsPerDay: 3, specialNotes: "Dị ứng gà, chỉ ăn thức ăn chủ mang theo",
    todayStatus: { breakfast: false, lunch: false, dinner: false, cleaned: false, exercised: false, healthCheck: false }
  },
  {
    room: 4, petName: "Luna", species: "Mèo", breed: "British Shorthair", owner: "Phạm Thị Thu", phone: "0967890123",
    checkIn: "18/05/2026", checkOut: "23/05/2026", nights: 5,
    foodType: "Me-O Adult", mealsPerDay: 2, specialNotes: "Ít vận động, thích ngủ",
    todayStatus: { breakfast: true, lunch: false, dinner: false, cleaned: true, exercised: false, healthCheck: true }
  },
  {
    room: 5, petName: "Max", species: "Chó", breed: "Husky", owner: "Hoàng Thanh Thảo", phone: "0978901234",
    checkIn: "21/05/2026", checkOut: "24/05/2026", nights: 3,
    foodType: "SmartHeart Adult", mealsPerDay: 2, specialNotes: "Năng động, cần chạy bộ 30 phút mỗi ngày",
    todayStatus: { breakfast: false, lunch: false, dinner: false, cleaned: false, exercised: false, healthCheck: false }
  },
];

const INITIAL_PAYMENTS: PaymentItem[] = [
  { id: "INV-001", date: "21/05/2026", petName: "Mochi", owner: "Nguyễn Thị Mai", service: "Khám tổng quát", amount: 250000, status: "pending" },
  { id: "INV-002", date: "21/05/2026", petName: "Kiwi", owner: "Phạm Văn Đức", service: "Tiêm phòng dại", amount: 180000, status: "paid" },
  { id: "INV-003", date: "20/05/2026", petName: "Buddy", owner: "Lê Thị Hương", service: "Grooming cao cấp", amount: 350000, status: "pending" },
  { id: "INV-004", date: "21/05/2026", petName: "Luna", owner: "Trần Minh Khoa", service: "Khám da liễu", amount: 320000, status: "paid" },
];

const NAV_ITEMS = [
  { id: "appointments" as const, label: "Lịch hẹn", icon: Calendar },
  { id: "grooming" as const, label: "Grooming", icon: Scissors },
  { id: "boarding" as const, label: "Lưu trú", icon: BedDouble },
  { id: "payments" as const, label: "Thanh toán", icon: DollarSign },
  { id: "settings" as const, label: "Cài đặt", icon: Settings },
];

type NavId = typeof NAV_ITEMS[number]["id"];

const APT_STATUS_CONFIG: Record<AptStatus, { label: string; color: string; bg: string; border: string }> = {
  scheduled:   { label: "Đã đặt lịch", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  checked_in:  { label: "Đã check-in", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  in_progress: { label: "Đang thực hiện", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  completed:   { label: "Hoàn thành", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
};

const SERVICE_ICONS: Record<ServiceType, { icon: React.ElementType; color: string; bg: string }> = {
  exam:        { icon: Stethoscope, color: "#0891B2", bg: "#ECFEFF" },
  grooming:    { icon: Scissors, color: "#D97706", bg: "#FFFBEB" },
  boarding:    { icon: Home, color: "#7C3AED", bg: "#F5F3FF" },
  vaccination: { icon: Star, color: "#059669", bg: "#ECFDF5" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function StaffPortal({ onLogout }: { onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState<NavId>("appointments");
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Data states
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [groomingTasks, setGroomingTasks] = useState(INITIAL_GROOMING_TASKS);
  const [boardingGuests, setBoardingGuests] = useState(INITIAL_BOARDING);
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);

  // Modal states
  const [viewingApt, setViewingApt] = useState<Appointment | null>(null);
  const [viewingBoarding, setViewingBoarding] = useState<BoardingGuest | null>(null);
  const [processingPayment, setProcessingPayment] = useState<PaymentItem | null>(null);

  // Stats
  const doneGrooming = groomingTasks.filter(t => t.status === "completed").length;
  const totalGrooming = groomingTasks.length;
  const pendingCheckIn = appointments.filter(a => a.status === "scheduled").length;
  const needsFed = boardingGuests.filter(b => !b.todayStatus.breakfast || !b.todayStatus.lunch || !b.todayStatus.dinner).length;
  const pendingPayments = payments.filter(p => p.status === "pending").length;

  const checkInAppointment = (id: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "checked_in" } : a));
    setViewingApt(null);
  };

  const completeGrooming = (id: number) => {
    setGroomingTasks(prev => prev.map(t => t.id === id ? { ...t, status: "completed" } : t));
  };

  const updateBoardingStatus = (room: number, field: keyof BoardingGuest["todayStatus"]) => {
    setBoardingGuests(prev => prev.map(b =>
      b.room === room ? { ...b, todayStatus: { ...b.todayStatus, [field]: !b.todayStatus[field] } } : b
    ));
  };

  const completePayment = (id: string) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "paid" } : p));
    setProcessingPayment(null);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-slate-200 bg-white flex-shrink-0">
        <div className="px-5 py-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
              <PawSVG className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">PetCare Center</div>
              <div className="text-[10px] text-slate-500 font-medium">Cổng nhân viên</div>
            </div>
          </div>
        </div>

        {/* Staff info */}
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-sm font-bold text-white">VT</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">NV. Vũ Minh Tuấn</div>
              <div className="text-[11px] text-slate-500 font-medium">Nhân viên chăm sóc</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-slate-500 font-semibold">Tiến độ Grooming hôm nay</span>
              <span className="text-[11px] font-bold text-slate-900">{doneGrooming}/{totalGrooming}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${totalGrooming > 0 ? (doneGrooming / totalGrooming) * 100 : 0}%`, background: "linear-gradient(90deg,#0891B2,#06B6D4)" }}
              />
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeNav === id;
            const badge =
              id === "appointments" && pendingCheckIn > 0 ? pendingCheckIn :
              id === "boarding" && needsFed > 0 ? needsFed :
              id === "payments" && pendingPayments > 0 ? pendingPayments :
              null;

            return (
              <button
                key={id}
                onClick={() => setActiveNav(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active ? "bg-cyan-50 text-cyan-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon size={16} />
                {label}
                {badge !== null && (
                  <span className="ml-auto text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            onClick={() => setConfirmLogout(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Logout confirm */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmLogout(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-80 p-6" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <LogOut size={24} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">Xác nhận đăng xuất</h3>
            <p className="text-sm text-slate-500 text-center mt-2">Bạn có chắc muốn đăng xuất khỏi Cổng nhân viên?</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmLogout(false)} className="flex-1 h-10 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Huỷ</button>
              <button onClick={onLogout} className="flex-1 h-10 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">Đăng xuất</button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-base font-bold text-slate-900">
              {activeNav === "appointments" && "Quản lý lịch hẹn"}
              {activeNav === "grooming" && "Dịch vụ Grooming"}
              {activeNav === "boarding" && "Khu lưu trú"}
              {activeNav === "payments" && "Quản lý thanh toán"}
              {activeNav === "settings" && "Cài đặt"}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Thứ Tư, 21 tháng 5 năm 2026</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors relative">
              <Bell size={16} />
              {(pendingCheckIn > 0 || needsFed > 0) && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* ── APPOINTMENTS TAB ── */}
          {activeNav === "appointments" && (
            <AppointmentsTab
              appointments={appointments}
              onViewDetails={setViewingApt}
              onCheckIn={(id) => {
                setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "checked_in" } : a));
              }}
            />
          )}

          {/* ── GROOMING TAB ── */}
          {activeNav === "grooming" && (
            <GroomingTab
              tasks={groomingTasks}
              onComplete={completeGrooming}
            />
          )}

          {/* ── BOARDING TAB ── */}
          {activeNav === "boarding" && (
            <BoardingTab
              guests={boardingGuests}
              onViewDetails={setViewingBoarding}
              onToggleStatus={updateBoardingStatus}
            />
          )}

          {/* ── PAYMENTS TAB ── */}
          {activeNav === "payments" && (
            <PaymentsTab
              payments={payments}
              onProcess={setProcessingPayment}
            />
          )}

          {/* ── SETTINGS TAB ── */}
          {activeNav === "settings" && (
            <div className="max-w-2xl">
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4">Cài đặt tài khoản</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-700">Họ tên</span>
                    <span className="text-sm font-semibold text-slate-900">NV. Vũ Minh Tuấn</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-700">Chức vụ</span>
                    <span className="text-sm font-semibold text-slate-900">Nhân viên chăm sóc</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-700">Email</span>
                    <span className="text-sm font-semibold text-slate-900">vu.minhtuan@petcare.vn</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-slate-700">Số điện thoại</span>
                    <span className="text-sm font-semibold text-slate-900">0987654321</span>
                  </div>
                </div>
                <button className="w-full mt-6 h-11 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Appointment Detail Modal */}
      {viewingApt && (
        <AppointmentDetailModal
          apt={viewingApt}
          onClose={() => setViewingApt(null)}
          onCheckIn={() => checkInAppointment(viewingApt.id)}
        />
      )}

      {/* Boarding Detail Modal */}
      {viewingBoarding && (
        <BoardingDetailModal
          guest={viewingBoarding}
          onClose={() => setViewingBoarding(null)}
          onToggleStatus={(field) => {
            updateBoardingStatus(viewingBoarding.room, field);
            setViewingBoarding({ ...viewingBoarding, todayStatus: { ...viewingBoarding.todayStatus, [field]: !viewingBoarding.todayStatus[field] } });
          }}
        />
      )}

      {/* Payment Process Modal */}
      {processingPayment && (
        <PaymentProcessModal
          payment={processingPayment}
          onClose={() => setProcessingPayment(null)}
          onComplete={() => completePayment(processingPayment.id)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab Components
// ─────────────────────────────────────────────────────────────────────────────

function AppointmentsTab({ appointments, onViewDetails, onCheckIn }: {
  appointments: Appointment[];
  onViewDetails: (apt: Appointment) => void;
  onCheckIn: (id: string) => void;
}) {
  const scheduled = appointments.filter(a => a.status === "scheduled").length;
  const checkedIn = appointments.filter(a => a.status === "checked_in").length;
  const inProgress = appointments.filter(a => a.status === "in_progress").length;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng lịch hẹn", value: appointments.length, icon: Calendar, color: "#0891B2", bg: "#ECFEFF" },
          { label: "Chờ check-in", value: scheduled, icon: Clock, color: "#2563EB", bg: "#EFF6FF" },
          { label: "Đã check-in", value: checkedIn, icon: CheckCircle2, color: "#7C3AED", bg: "#F5F3FF" },
          { label: "Đang thực hiện", value: inProgress, icon: Activity, color: "#D97706", bg: "#FFFBEB" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <Icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 font-medium">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Appointments list */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Danh sách lịch hẹn hôm nay</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
              />
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {appointments.map(apt => {
            const statusCfg = APT_STATUS_CONFIG[apt.status];
            const svcIcon = SERVICE_ICONS[apt.serviceType];
            const Icon = svcIcon.icon;
            return (
              <div key={apt.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-16 text-center flex-shrink-0">
                  <div className="text-sm font-bold font-mono text-slate-900">{apt.time}</div>
                  {apt.queue && <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{apt.queue}</div>}
                </div>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: svcIcon.bg }}>
                    <Icon size={18} style={{ color: svcIcon.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">
                      {apt.petName}
                      <span className="ml-2 text-xs font-normal text-slate-500">{apt.species} • {apt.breed}</span>
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{apt.owner} • {apt.service}</div>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0" style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}>
                  {statusCfg.label}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onViewDetails(apt)}
                    className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <Eye size={14} /> Chi tiết
                  </button>
                  {apt.status === "scheduled" && (
                    <button
                      onClick={() => onCheckIn(apt.id)}
                      className="h-9 px-4 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-1.5"
                      style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
                    >
                      <CheckCircle2 size={14} /> Check-in
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GroomingTab({ tasks, onComplete }: {
  tasks: GroomingTask[];
  onComplete: (id: number) => void;
}) {
  const done = tasks.filter(t => t.status === "completed").length;
  const total = tasks.length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tổng ca", value: total, icon: Scissors, color: "#7C3AED", bg: "#F5F3FF" },
          { label: "Hoàn thành", value: done, icon: CheckCircle2, color: "#059669", bg: "#ECFDF5" },
          { label: "Còn lại", value: total - done, icon: Clock, color: "#D97706", bg: "#FFFBEB" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <Icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 font-medium">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task list */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Danh sách ca Grooming hôm nay</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {tasks.map(task => {
            const isDone = task.status === "completed";
            const isActive = task.status === "in_progress";
            return (
              <div key={task.id} className={`flex items-center gap-4 px-6 py-4 transition-colors ${isActive ? "bg-amber-50/40" : isDone ? "bg-slate-50/40" : "hover:bg-slate-50"}`}>
                <div className="w-16 text-center flex-shrink-0">
                  <div className={`text-sm font-bold font-mono ${isDone ? "text-slate-400 line-through" : "text-slate-900"}`}>{task.time}</div>
                </div>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDone ? "bg-slate-100" : "bg-violet-50"}`}>
                    <Scissors size={16} className={isDone ? "text-slate-400" : "text-violet-600"} />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-sm font-bold ${isDone ? "text-slate-500" : "text-slate-900"}`}>
                      {task.petName}
                      <span className="ml-2 text-xs font-normal text-slate-500">{task.breed}</span>
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{task.owner} • {task.service}</div>
                    {task.notes && <div className="text-xs text-slate-400 italic truncate mt-1">{task.notes}</div>}
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-lg flex-shrink-0 ${
                  isDone ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                  isActive ? "bg-amber-50 text-amber-700 border border-amber-200" :
                  "bg-blue-50 text-blue-700 border border-blue-200"
                }`}>
                  {isDone ? "Hoàn thành" : isActive ? "Đang làm" : "Chờ"}
                </span>
                {!isDone && (
                  <button
                    onClick={() => onComplete(task.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex-shrink-0 ${
                      isActive
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {isActive ? <><CheckCircle2 size={14} /> Hoàn thành</> : <>Bắt đầu <ChevronRight size={14} /></>}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BoardingTab({ guests, onViewDetails, onToggleStatus }: {
  guests: BoardingGuest[];
  onViewDetails: (guest: BoardingGuest) => void;
  onToggleStatus: (room: number, field: keyof BoardingGuest["todayStatus"]) => void;
}) {
  const needsBreakfast = guests.filter(g => !g.todayStatus.breakfast).length;
  const needsCleaning = guests.filter(g => !g.todayStatus.cleaned).length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng phòng", value: "10", sub: "Công suất tối đa", color: "#0891B2", bg: "#ECFEFF" },
          { label: "Đang lưu trú", value: guests.length.toString(), sub: "Thú cưng hiện tại", color: "#7C3AED", bg: "#F5F3FF" },
          { label: "Cần cho ăn", value: needsBreakfast.toString(), sub: "Chưa ăn sáng", color: "#D97706", bg: "#FFFBEB" },
          { label: "Cần vệ sinh", value: needsCleaning.toString(), sub: "Chưa dọn phòng", color: "#059669", bg: "#ECFDF5" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-semibold text-slate-700 mt-1">{s.label}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Guest list */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Thú cưng đang lưu trú</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {guests.map(guest => (
            <div key={guest.room} className="px-6 py-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                  <BedDouble size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{guest.petName}</span>
                    <span className="text-xs text-slate-500">{guest.species} • {guest.breed}</span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Phòng {guest.room}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {guest.owner} • Check-in: {guest.checkIn} • Check-out: {guest.checkOut} ({guest.nights} đêm)
                  </div>
                  <div className="text-xs text-slate-600 mt-1.5 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <strong>Thức ăn:</strong> {guest.foodType} • <strong>Bữa/ngày:</strong> {guest.mealsPerDay}
                    {guest.specialNotes && <div className="mt-1 text-slate-500"><strong>Ghi chú:</strong> {guest.specialNotes}</div>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {[
                      { label: "Bữa sáng", field: "breakfast" as const },
                      { label: "Bữa trưa", field: "lunch" as const },
                      { label: "Bữa tối", field: "dinner" as const },
                      { label: "Vệ sinh", field: "cleaned" as const },
                      { label: "Vận động", field: "exercised" as const },
                      { label: "Kiểm tra SK", field: "healthCheck" as const },
                    ].map(item => {
                      const done = guest.todayStatus[item.field];
                      return (
                        <button
                          key={item.field}
                          onClick={() => onToggleStatus(guest.room, item.field)}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            done
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {done ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={() => onViewDetails(guest)}
                  className="h-9 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  <Eye size={14} /> Chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaymentsTab({ payments, onProcess }: {
  payments: PaymentItem[];
  onProcess: (payment: PaymentItem) => void;
}) {
  const pending = payments.filter(p => p.status === "pending");
  const paid = payments.filter(p => p.status === "paid");
  const totalPending = pending.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = paid.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng hóa đơn", value: payments.length.toString(), sub: "Hôm nay", color: "#0891B2", bg: "#ECFEFF" },
          { label: "Chờ thanh toán", value: pending.length.toString(), sub: `${(totalPending / 1000).toFixed(0)}K VNĐ`, color: "#D97706", bg: "#FFFBEB" },
          { label: "Đã thanh toán", value: paid.length.toString(), sub: `${(totalPaid / 1000).toFixed(0)}K VNĐ`, color: "#059669", bg: "#ECFDF5" },
          { label: "Tổng doanh thu", value: `${((totalPaid + totalPending) / 1000000).toFixed(1)}M`, sub: "VNĐ", color: "#7C3AED", bg: "#F5F3FF" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-semibold text-slate-700 mt-1">{s.label}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Pending payments */}
      {pending.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Chờ thanh toán</h3>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-md">{pending.length} hóa đơn</span>
          </div>
          <div className="divide-y divide-slate-100">
            {pending.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100">
                  <DollarSign size={18} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900">{p.petName} • {p.service}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{p.owner} • {p.date} • Mã: {p.id}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-slate-900">{(p.amount / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-slate-500">VNĐ</div>
                </div>
                <button
                  onClick={() => onProcess(p)}
                  className="h-9 px-4 rounded-lg text-sm font-bold text-white transition-colors"
                  style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
                >
                  Thanh toán
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paid payments */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Đã thanh toán</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {paid.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-6 py-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900">{p.petName} • {p.service}</div>
                <div className="text-xs text-slate-500 mt-0.5">{p.owner} • {p.date} • Mã: {p.id}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-slate-900">{(p.amount / 1000).toFixed(0)}K</div>
                <div className="text-xs text-slate-500">VNĐ</div>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                Đã thanh toán
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal Components
// ─────────────────────────────────────────────────────────────────────────────

function AppointmentDetailModal({ apt, onClose, onCheckIn }: {
  apt: Appointment;
  onClose: () => void;
  onCheckIn: () => void;
}) {
  const statusCfg = APT_STATUS_CONFIG[apt.status];
  const svcIcon = SERVICE_ICONS[apt.serviceType];
  const Icon = svcIcon.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: svcIcon.bg }}>
              <Icon size={20} style={{ color: svcIcon.color }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{apt.service}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Mã: {apt.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg inline-block" style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}>
              {statusCfg.label}
            </span>
          </div>

          {[
            { label: "Thú cưng", value: `${apt.petName} (${apt.species} • ${apt.breed})` },
            { label: "Chủ nuôi", value: apt.owner },
            { label: "Số điện thoại", value: apt.phone },
            { label: "Thời gian", value: `${apt.time}` },
            { label: "Phòng/Số thứ tự", value: apt.room || apt.queue || "—" },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">{item.label}</span>
              <span className="text-sm font-bold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>

        {apt.status === "scheduled" && (
          <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
            <button
              onClick={onCheckIn}
              className="w-full h-11 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
            >
              <CheckCircle2 size={16} /> Check-in ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BoardingDetailModal({ guest, onClose, onToggleStatus }: {
  guest: BoardingGuest;
  onClose: () => void;
  onToggleStatus: (field: keyof BoardingGuest["todayStatus"]) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <BedDouble size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{guest.petName} • Phòng {guest.room}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{guest.species} • {guest.breed}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Thông tin chủ nuôi</h4>
              <div className="space-y-2">
                {[
                  { label: "Họ tên", value: guest.owner },
                  { label: "Số điện thoại", value: guest.phone },
                  { label: "Check-in", value: guest.checkIn },
                  { label: "Check-out", value: guest.checkOut },
                  { label: "Số đêm", value: `${guest.nights} đêm` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">{item.label}:</span>
                    <span className="font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Chế độ ăn uống</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Loại thức ăn:</span>
                  <span className="font-bold text-slate-900">{guest.foodType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Số bữa/ngày:</span>
                  <span className="font-bold text-slate-900">{guest.mealsPerDay} bữa</span>
                </div>
                {guest.specialNotes && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-slate-500 font-medium mb-1">Ghi chú đặc biệt:</div>
                    <div className="text-slate-700">{guest.specialNotes}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-cyan-50 rounded-2xl p-4 border border-cyan-100">
              <h4 className="text-sm font-bold text-cyan-900 mb-3">Cập nhật trạng thái hôm nay</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Bữa sáng", field: "breakfast" as const, icon: Coffee },
                  { label: "Bữa trưa", field: "lunch" as const, icon: Coffee },
                  { label: "Bữa tối", field: "dinner" as const, icon: Coffee },
                  { label: "Vệ sinh phòng", field: "cleaned" as const, icon: Star },
                  { label: "Vận động", field: "exercised" as const, icon: Activity },
                  { label: "Kiểm tra sức khỏe", field: "healthCheck" as const, icon: Stethoscope },
                ].map(item => {
                  const Icon = item.icon;
                  const done = guest.todayStatus[item.field];
                  return (
                    <button
                      key={item.field}
                      onClick={() => onToggleStatus(item.field)}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                        done
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-white transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentProcessModal({ payment, onClose, onComplete }: {
  payment: PaymentItem;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [method, setMethod] = useState<"cash" | "transfer" | "card">("cash");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Xác nhận thanh toán</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Mã: {payment.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {[
            { label: "Thú cưng", value: payment.petName },
            { label: "Chủ nuôi", value: payment.owner },
            { label: "Dịch vụ", value: payment.service },
            { label: "Ngày", value: payment.date },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">{item.label}</span>
              <span className="text-sm font-bold text-slate-900">{item.value}</span>
            </div>
          ))}

          <div className="bg-cyan-50 rounded-2xl p-4 border border-cyan-100">
            <div className="text-sm text-slate-500 font-medium mb-1">Tổng tiền</div>
            <div className="text-3xl font-bold text-cyan-700">{payment.amount.toLocaleString()}₫</div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Phương thức thanh toán</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "cash" as const, label: "Tiền mặt" },
                { id: "transfer" as const, label: "Chuyển khoản" },
                { id: "card" as const, label: "Thẻ" },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    method === m.id
                      ? "bg-cyan-50 border-cyan-500 text-cyan-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-white transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onComplete}
            className="flex-1 h-11 rounded-xl text-sm font-bold text-white transition-colors"
            style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
          >
            Xác nhận thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}
