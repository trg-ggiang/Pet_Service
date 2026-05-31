import { useEffect, useState } from "react";
import {
  Search, Filter, MoreHorizontal, Edit, Lock, Unlock,
  Eye, X, Phone, Mail, MapPin, Calendar, Star,
  ChevronDown, Stethoscope, Scissors, Users,
  ShieldAlert, CheckCircle2, Clock, Activity,
} from "lucide-react";
import { adminService } from "../services/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "customers" | "doctors" | "staff";
type UserRole = "customer" | "doctor" | "staff";

interface BaseUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  joinDate: string;
  locked: boolean;
  role: UserRole;
}

interface Customer extends BaseUser {
  role: "customer";
  tier: "regular" | "vip";
  address: string;
  petCount: number;
  pets: string[];
  totalVisits: number;
  totalSpend: string;
  lastVisit: string;
}

interface Doctor extends BaseUser {
  role: "doctor";
  specialty: string;
  room: string;
  status: "active" | "on_leave";
  todayPatients: number;
  totalPatients: number;
  rating: number;
  licenseNo: string;
}

interface StaffMember extends BaseUser {
  role: "staff";
  department: string;
  position: string;
  status: "active" | "on_leave";
  tasksToday: number;
}

type AnyUser = Customer | Doctor | StaffMember;

// ─── Sample data ──────────────────────────────────────────────────────────────

const customers: Customer[] = [
  { id: "C001", role: "customer", name: "Nguyễn Thị Mai",   phone: "0901 234 567", email: "mai.nguyen@gmail.com",    avatar: "NM", joinDate: "12/03/2022", locked: false, tier: "vip",     address: "45 Nguyễn Huệ, Q.1, TP.HCM",      petCount: 2, pets: ["Mochi (Chó)", "Pudding (Chó)"],         totalVisits: 47, totalSpend: "12.400.000", lastVisit: "15/05/2026" },
  { id: "C002", role: "customer", name: "Phạm Văn Đức",     phone: "0912 345 678", email: "duc.pham@gmail.com",      avatar: "PĐ", joinDate: "08/06/2022", locked: false, tier: "regular", address: "12 Lê Lợi, Q.3, TP.HCM",          petCount: 1, pets: ["Kiwi (Mèo)"],                           totalVisits: 18, totalSpend: "3.200.000",  lastVisit: "21/05/2026" },
  { id: "C003", role: "customer", name: "Lê Thị Hương",     phone: "0923 456 789", email: "huong.le@gmail.com",      avatar: "LH", joinDate: "23/09/2022", locked: false, tier: "regular", address: "78 Trần Hưng Đạo, Q.5, TP.HCM",   petCount: 1, pets: ["Buddy (Chó)"],                          totalVisits: 22, totalSpend: "5.600.000",  lastVisit: "21/05/2026" },
  { id: "C004", role: "customer", name: "Trần Minh Khoa",   phone: "0934 567 890", email: "khoa.tran@gmail.com",     avatar: "TK", joinDate: "15/01/2021", locked: false, tier: "vip",     address: "33 Pasteur, Q. Bình Thạnh, TP.HCM", petCount: 1, pets: ["Luna (Mèo)"],                          totalVisits: 63, totalSpend: "18.750.000", lastVisit: "21/05/2026" },
  { id: "C005", role: "customer", name: "Hoàng Thanh Thảo", phone: "0945 678 901", email: "thao.hoang@gmail.com",    avatar: "HT", joinDate: "04/04/2023", locked: false, tier: "regular", address: "91 Võ Thị Sáu, Q.3, TP.HCM",      petCount: 1, pets: ["Max (Chó)"],                            totalVisits: 9,  totalSpend: "1.800.000",  lastVisit: "18/05/2026" },
  { id: "C006", role: "customer", name: "Võ Thị Bích",      phone: "0956 789 012", email: "bich.vo@gmail.com",       avatar: "VB", joinDate: "19/07/2023", locked: true,  tier: "regular", address: "56 Điện Biên Phủ, Q.10, TP.HCM",  petCount: 1, pets: ["Coco (Chó)"],                           totalVisits: 5,  totalSpend: "820.000",    lastVisit: "02/04/2026" },
  { id: "C007", role: "customer", name: "Đặng Quốc Hùng",   phone: "0967 890 123", email: "hung.dang@gmail.com",     avatar: "ĐH", joinDate: "30/11/2021", locked: false, tier: "vip",     address: "27 Cách Mạng Tháng 8, Q. Tân Bình", petCount: 2, pets: ["Snowball (Mèo)", "Oreo (Mèo)"],        totalVisits: 41, totalSpend: "9.300.000",  lastVisit: "19/05/2026" },
  { id: "C008", role: "customer", name: "Bùi Thị Lan",      phone: "0978 901 234", email: "lan.bui@gmail.com",       avatar: "BL", joinDate: "11/02/2024", locked: false, tier: "regular", address: "64 Bạch Đằng, Q. Bình Thạnh, TP.HCM", petCount: 1, pets: ["Charlie (Chó)"],                     totalVisits: 7,  totalSpend: "2.100.000",  lastVisit: "21/05/2026" },
];

const doctors: Doctor[] = [
  { id: "D001", role: "doctor", name: "BS. Trần Hoài Nam",    phone: "0901 111 222", email: "nam.tran@petcare.vn",    avatar: "TN", joinDate: "15/03/2020", locked: false, specialty: "Nội khoa",       room: "Phòng 1", status: "active",   todayPatients: 4, totalPatients: 1284, rating: 4.9, licenseNo: "VN-VET-2018-0412" },
  { id: "D002", role: "doctor", name: "BS. Lê Thị Hoa",       phone: "0902 222 333", email: "hoa.le@petcare.vn",      avatar: "LH", joinDate: "02/07/2021", locked: false, specialty: "Thú y đa khoa", room: "Phòng 2", status: "active",   todayPatients: 3, totalPatients: 847,  rating: 4.8, licenseNo: "VN-VET-2019-0891" },
  { id: "D003", role: "doctor", name: "BS. Nguyễn Đức Trung", phone: "0903 333 444", email: "trung.nguyen@petcare.vn", avatar: "NT", joinDate: "18/11/2021", locked: false, specialty: "Ngoại khoa",    room: "Phòng 3", status: "active",   todayPatients: 2, totalPatients: 632,  rating: 4.7, licenseNo: "VN-VET-2017-0256" },
  { id: "D004", role: "doctor", name: "BS. Phạm Minh Đức",    phone: "0904 444 555", email: "duc.pham@petcare.vn",    avatar: "PĐ", joinDate: "01/04/2022", locked: false, specialty: "Da liễu thú y", room: "Phòng 4", status: "on_leave", todayPatients: 0, totalPatients: 418,  rating: 4.8, licenseNo: "VN-VET-2020-0134" },
];

const staff: StaffMember[] = [
  { id: "S001", role: "staff", name: "Vũ Minh Tuấn",    phone: "0911 100 200", email: "tuan.vu@petcare.vn",    avatar: "VT", joinDate: "12/05/2020", locked: false, department: "Grooming",    position: "Groomer cao cấp",   status: "active",   tasksToday: 3 },
  { id: "S002", role: "staff", name: "Đinh Thị Lan",    phone: "0922 200 300", email: "lan.dinh@petcare.vn",   avatar: "ĐL", joinDate: "08/09/2021", locked: false, department: "Lưu trú",     position: "Quản lý phòng",     status: "active",   tasksToday: 4 },
  { id: "S003", role: "staff", name: "Nguyễn Văn Hùng", phone: "0933 300 400", email: "hung.nguyen@petcare.vn", avatar: "NH", joinDate: "21/01/2022", locked: false, department: "Lễ tân",      position: "Nhân viên lễ tân",  status: "active",   tasksToday: 8 },
  { id: "S004", role: "staff", name: "Trần Thị Bảo",    phone: "0944 400 500", email: "bao.tran@petcare.vn",   avatar: "TB", joinDate: "05/06/2022", locked: false, department: "Tiêm chủng",  position: "Trợ lý thú y",      status: "active",   tasksToday: 5 },
  { id: "S005", role: "staff", name: "Lê Văn Nam",      phone: "0955 500 600", email: "nam.le@petcare.vn",     avatar: "LN", joinDate: "14/10/2022", locked: false, department: "Grooming",    position: "Groomer tiêu chuẩn", status: "on_leave", tasksToday: 0 },
  { id: "S006", role: "staff", name: "Phạm Thị Huyền",  phone: "0966 600 700", email: "huyen.pham@petcare.vn", avatar: "PH", joinDate: "28/03/2023", locked: true,  department: "Kế toán",     position: "Nhân viên kế toán", status: "active",   tasksToday: 0 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "from-cyan-400 to-cyan-600", "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600", "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600", "from-indigo-400 to-indigo-600",
];

function getColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function AvatarBubble({ initials, name, size = "md" }: { initials: string; name: string; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "w-8 h-8 text-[11px]", md: "w-10 h-10 text-[12px]", lg: "w-14 h-14 text-[16px]" }[size];
  return (
    <div className={`rounded-full bg-gradient-to-br ${getColor(name)} flex items-center justify-center flex-shrink-0 ${sz}`}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${active ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" : "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {label}
    </span>
  );
}

// ─── User Drawer ──────────────────────────────────────────────────────────────

function CustomerDetail({ user, onToggleLock }: { user: Customer; onToggleLock: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${user.tier === "vip" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-muted text-muted-foreground border border-border"}`}>
          {user.tier === "vip" ? "⭐ VIP" : "Thành viên"}
        </div>
        {user.locked && <div className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[11px] font-bold border border-red-200">Đã khoá</div>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Tổng lượt khám", value: user.totalVisits.toString(), unit: "lượt" },
          { label: "Tổng chi tiêu",  value: user.totalSpend, unit: "₫" },
          { label: "Số thú cưng",    value: user.petCount.toString(), unit: "bé" },
        ].map((s) => (
          <div key={s.label} className="bg-muted/40 rounded-xl p-3 text-center border border-border">
            <div className="font-mono font-bold text-[18px] text-foreground leading-none">{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-1 font-medium">{s.unit}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Thú cưng đã đăng ký</div>
        {user.pets.map((pet) => (
          <div key={pet} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-white">
            <span className="text-lg">🐾</span>
            <span className="text-[13px] font-medium text-foreground">{pet}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Thông tin liên hệ</div>
        {[
          { icon: Phone,   value: user.phone },
          { icon: Mail,    value: user.email },
          { icon: MapPin,  value: user.address },
          { icon: Calendar, value: `Tham gia: ${user.joinDate}` },
          { icon: Clock,   value: `Lần cuối: ${user.lastVisit}` },
        ].map(({ icon: Icon, value }) => (
          <div key={value} className="flex items-start gap-3 text-[12.5px]">
            <Icon size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-border space-y-2">
        <button className="w-full flex items-center gap-2.5 h-10 px-4 border border-border bg-white rounded-xl text-[13px] font-medium text-foreground hover:bg-muted transition-colors">
          <Edit size={13} /> Chỉnh sửa thông tin
        </button>
        <button onClick={onToggleLock}
          className={`w-full flex items-center gap-2.5 h-10 px-4 rounded-xl text-[13px] font-semibold transition-colors ${user.locked ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"}`}>
          {user.locked ? <><Unlock size={13} /> Mở khoá tài khoản</> : <><Lock size={13} /> Khoá tài khoản</>}
        </button>
      </div>
    </div>
  );
}

function DoctorDetail({ user, onToggleLock }: { user: Doctor; onToggleLock: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <StatusBadge active={user.status === "active"} label={user.status === "active" ? "Đang làm việc" : "Nghỉ phép"} />
        {user.locked && <div className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[11px] font-bold border border-red-200">Đã khoá</div>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Bệnh nhân hôm nay", value: user.todayPatients.toString(), unit: "ca" },
          { label: "Tổng bệnh nhân",    value: user.totalPatients.toString(), unit: "ca" },
          { label: "Đánh giá",          value: user.rating.toString(), unit: "/ 5.0" },
        ].map((s) => (
          <div key={s.label} className="bg-muted/40 rounded-xl p-3 text-center border border-border">
            <div className={`font-mono font-bold text-[18px] leading-none ${s.unit === "/ 5.0" ? "text-amber-600" : "text-foreground"}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-1 font-medium">{s.unit}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Thông tin chuyên môn</div>
        {[
          { icon: Stethoscope, value: `Chuyên khoa: ${user.specialty}` },
          { icon: Activity,    value: `Phòng khám: ${user.room}` },
          { icon: CheckCircle2, value: `Số CMHV: ${user.licenseNo}` },
        ].map(({ icon: Icon, value }) => (
          <div key={value} className="flex items-center gap-3 text-[12.5px]">
            <Icon size={13} className="text-muted-foreground flex-shrink-0" />
            <span className="text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Liên hệ</div>
        {[
          { icon: Phone, value: user.phone },
          { icon: Mail,  value: user.email },
          { icon: Calendar, value: `Tham gia: ${user.joinDate}` },
        ].map(({ icon: Icon, value }) => (
          <div key={value} className="flex items-center gap-3 text-[12.5px]">
            <Icon size={13} className="text-muted-foreground flex-shrink-0" />
            <span className="text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-border space-y-2">
        <button className="w-full flex items-center gap-2.5 h-10 px-4 border border-border bg-white rounded-xl text-[13px] font-medium text-foreground hover:bg-muted transition-colors">
          <Edit size={13} /> Chỉnh sửa thông tin
        </button>
        <button onClick={onToggleLock}
          className={`w-full flex items-center gap-2.5 h-10 px-4 rounded-xl text-[13px] font-semibold transition-colors ${user.locked ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"}`}>
          {user.locked ? <><Unlock size={13} /> Mở khoá tài khoản</> : <><Lock size={13} /> Khoá tài khoản</>}
        </button>
      </div>
    </div>
  );
}

function StaffDetail({ user, onToggleLock }: { user: StaffMember; onToggleLock: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <StatusBadge active={user.status === "active"} label={user.status === "active" ? "Đang làm việc" : "Nghỉ phép"} />
        {user.locked && <div className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[11px] font-bold border border-red-200">Đã khoá</div>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Phòng ban",          value: user.department },
          { label: "Công việc hôm nay",  value: `${user.tasksToday} nhiệm vụ` },
        ].map((s) => (
          <div key={s.label} className="bg-muted/40 rounded-xl p-3 text-center border border-border">
            <div className="font-semibold text-[14px] text-foreground leading-none">{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Thông tin công việc</div>
        {[
          { icon: Users,    value: `Phòng ban: ${user.department}` },
          { icon: Activity, value: `Vị trí: ${user.position}` },
          { icon: Calendar, value: `Tham gia: ${user.joinDate}` },
        ].map(({ icon: Icon, value }) => (
          <div key={value} className="flex items-center gap-3 text-[12.5px]">
            <Icon size={13} className="text-muted-foreground flex-shrink-0" />
            <span className="text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Liên hệ</div>
        {[
          { icon: Phone, value: user.phone },
          { icon: Mail,  value: user.email },
        ].map(({ icon: Icon, value }) => (
          <div key={value} className="flex items-center gap-3 text-[12.5px]">
            <Icon size={13} className="text-muted-foreground flex-shrink-0" />
            <span className="text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-border space-y-2">
        <button className="w-full flex items-center gap-2.5 h-10 px-4 border border-border bg-white rounded-xl text-[13px] font-medium text-foreground hover:bg-muted transition-colors">
          <Edit size={13} /> Chỉnh sửa thông tin
        </button>
        <button onClick={onToggleLock}
          className={`w-full flex items-center gap-2.5 h-10 px-4 rounded-xl text-[13px] font-semibold transition-colors ${user.locked ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"}`}>
          {user.locked ? <><Unlock size={13} /> Mở khoá tài khoản</> : <><Lock size={13} /> Khoá tài khoản</>}
        </button>
      </div>
    </div>
  );
}

function UserDrawer({ user, onClose, onToggleLock }: { user: AnyUser; onClose: () => void; onToggleLock: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="w-[440px] bg-white h-full shadow-2xl flex flex-col border-l border-border">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-start justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <AvatarBubble initials={user.avatar} name={user.name} size="lg" />
            <div>
              <div className="text-[18px] font-bold text-foreground">{user.name}</div>
              <div className="text-[12.5px] text-muted-foreground mt-0.5">
                {user.role === "customer"
                  ? `Mã KH: ${user.id}`
                  : user.role === "doctor"
                  ? (user as Doctor).specialty
                  : (user as StaffMember).position}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors flex-shrink-0">
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {user.role === "customer" && <CustomerDetail user={user as Customer} onToggleLock={onToggleLock} />}
          {user.role === "doctor"   && <DoctorDetail   user={user as Doctor}   onToggleLock={onToggleLock} />}
          {user.role === "staff"    && <StaffDetail    user={user as StaffMember} onToggleLock={onToggleLock} />}
        </div>
      </div>
    </div>
  );
}

// ─── Customer Table ───────────────────────────────────────────────────────────

function CustomerTable({ customers, search, onSelect }: { customers: Customer[]; search: string; onSelect: (u: Customer) => void }) {
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set(customers.filter(c => c.locked).map(c => c.id)));

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.id.toLowerCase().includes(q);
  });

  const toggleLock = (id: string) => {
    setLockedIds((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {["Khách hàng", "Thú cưng", "Lần cuối khám", "Tổng chi tiêu", "Hạng", "Trạng thái", ""].map((h, i) => (
                <th key={h} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground ${i === 0 ? "pl-5 text-left" : i === 5 ? "text-center" : i === 6 ? "w-12" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => {
              const locked = lockedIds.has(c.id);
              return (
                <tr key={c.id} className="hover:bg-muted/25 group transition-colors cursor-pointer" onClick={() => onSelect({ ...c, locked })}>
                  <td className="pl-5 pr-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <AvatarBubble initials={c.avatar} name={c.name} size="sm" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-foreground">{c.name}</span>
                          {c.tier === "vip" && <Star size={11} className="text-amber-500 fill-amber-500" />}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-[13px] text-foreground">{c.petCount} thú cưng</div>
                    <div className="text-[11.5px] text-muted-foreground truncate max-w-[140px]">{c.pets[0]}{c.petCount > 1 ? ` +${c.petCount - 1}` : ""}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[12.5px] text-foreground">{c.lastVisit}</td>
                  <td className="px-4 py-3.5 font-mono text-[13px] font-semibold text-foreground">{c.totalSpend}₫</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.tier === "vip" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-muted text-muted-foreground border border-border"}`}>
                      {c.tier === "vip" ? "⭐ VIP" : "Thường"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <StatusBadge active={!locked} label={locked ? "Đã khoá" : "Hoạt động"} />
                  </td>
                  <td className="pr-3 py-3.5">
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => onSelect({ ...c, locked })} className="p-1.5 hover:bg-muted rounded-md"><Eye size={13} className="text-muted-foreground" /></button>
                      <button onClick={() => toggleLock(c.id)} className={`p-1.5 hover:bg-muted rounded-md ${locked ? "text-emerald-500" : "text-muted-foreground"}`}>
                        {locked ? <Unlock size={13} /> : <Lock size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Doctor Table ─────────────────────────────────────────────────────────────

function DoctorTable({ doctors, search, onSelect }: { doctors: Doctor[]; search: string; onSelect: (u: Doctor) => void }) {
  const filtered = doctors.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q);
  });

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {["Bác sĩ", "Chuyên khoa & Phòng", "Bệnh nhân hôm nay", "Tổng ca", "Đánh giá", "Trạng thái", ""].map((h, i) => (
                <th key={h} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground ${i === 0 ? "pl-5 text-left" : i === 6 ? "w-12" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-muted/25 group transition-colors cursor-pointer" onClick={() => onSelect(d)}>
                <td className="pl-5 pr-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <AvatarBubble initials={d.avatar} name={d.name} size="sm" />
                    <div>
                      <div className="text-[13px] font-semibold text-foreground">{d.name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{d.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-[13px] font-medium text-foreground">{d.specialty}</div>
                  <div className="text-[11.5px] text-muted-foreground">{d.room}</div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="font-mono font-bold text-[16px] text-foreground">{d.todayPatients}</div>
                    <div className="text-xs text-muted-foreground">ca hôm nay</div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-[13px] font-semibold text-foreground">{d.totalPatients.toLocaleString()}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    <span className="font-mono font-bold text-[13px] text-foreground">{d.rating}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge active={d.status === "active"} label={d.status === "active" ? "Đang làm việc" : "Nghỉ phép"} />
                </td>
                <td className="pr-3 py-3.5">
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onSelect(d)} className="p-1.5 hover:bg-muted rounded-md"><Eye size={13} className="text-muted-foreground" /></button>
                    <button className="p-1.5 hover:bg-muted rounded-md"><Edit size={13} className="text-muted-foreground" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Staff Table ──────────────────────────────────────────────────────────────

function StaffTable({ staff, search, onSelect }: { staff: StaffMember[]; search: string; onSelect: (u: StaffMember) => void }) {
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set(staff.filter(s => s.locked).map(s => s.id)));

  const filtered = staff.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.department.toLowerCase().includes(q);
  });

  const toggleLock = (id: string) => {
    setLockedIds((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {["Nhân viên", "Phòng ban & Vị trí", "Nhiệm vụ hôm nay", "Tham gia", "Trạng thái", ""].map((h, i) => (
                <th key={h} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground ${i === 0 ? "pl-5 text-left" : i === 5 ? "w-12" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((s) => {
              const locked = lockedIds.has(s.id);
              return (
                <tr key={s.id} className="hover:bg-muted/25 group transition-colors cursor-pointer" onClick={() => onSelect({ ...s, locked })}>
                  <td className="pl-5 pr-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <AvatarBubble initials={s.avatar} name={s.name} size="sm" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-foreground">{s.name}</span>
                          {locked && <ShieldAlert size={12} className="text-red-400" />}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">{s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-[13px] font-medium text-foreground">{s.department}</div>
                    <div className="text-[11.5px] text-muted-foreground">{s.position}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className="font-mono font-bold text-[16px] text-foreground">{s.tasksToday}</div>
                      <div className="text-xs text-muted-foreground">nhiệm vụ</div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[12.5px] text-foreground">{s.joinDate}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge active={!locked && s.status === "active"} label={locked ? "Đã khoá" : s.status === "active" ? "Hoạt động" : "Nghỉ phép"} />
                  </td>
                  <td className="pr-3 py-3.5">
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => onSelect({ ...s, locked })} className="p-1.5 hover:bg-muted rounded-md"><Eye size={13} className="text-muted-foreground" /></button>
                      <button onClick={() => toggleLock(s.id)} className={`p-1.5 hover:bg-muted rounded-md ${locked ? "text-emerald-500" : "text-muted-foreground"}`}>
                        {locked ? <Unlock size={13} /> : <Lock size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── UsersPage ────────────────────────────────────────────────────────────────

export function UsersPage() {
  const [tab, setTab] = useState<Tab>("customers");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AnyUser | null>(null);
  const [lockedDrawerUser, setLockedDrawerUser] = useState(false);
  const [customersData, setCustomersData] = useState<Customer[]>([]);
  const [doctorsData, setDoctorsData] = useState<Doctor[]>([]);
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    adminService
      .listUsers()
      .then((data) => {
        if (!mounted) return;
        setCustomersData(data.customers as Customer[]);
        setDoctorsData(data.doctors as Doctor[]);
        setStaffData(data.staff as StaffMember[]);
        setLoadError("");
      })
      .catch((error) => {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : "Không thể tải dữ liệu người dùng.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const openDrawer = (u: AnyUser) => {
    setSelectedUser(u);
    setLockedDrawerUser(u.locked);
  };

  const toggleDrawerLock = () => setLockedDrawerUser((v) => !v);

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: "customers", label: "Khách hàng", icon: Users,      count: customersData.length },
    { id: "doctors",   label: "Bác sĩ",     icon: Stethoscope, count: doctorsData.length },
    { id: "staff",     label: "Nhân viên",  icon: Scissors,    count: staffData.length },
  ];

  const lockedCount = [...customersData, ...doctorsData, ...staffData].filter((user) => user.locked).length;
  const activeDoctors = doctorsData.filter((doctor) => !doctor.locked && doctor.status === "active").length;
  const vipCount = customersData.filter((customer) => customer.tier === "vip").length;

  const statCards = [
    { label: "Tổng khách hàng", value: customersData.length.toString(), sub: `${vipCount} VIP`, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Bác sĩ trực",     value: `${activeDoctors}/${doctorsData.length}`, sub: "Theo dữ liệu backend", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Nhân viên",       value: staffData.filter(s => !s.locked && s.status === "active").length.toString(), sub: `${staffData.length} tài khoản nhân viên`, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "Tài khoản khoá",  value: lockedCount.toString(), sub: "Cần xem xét", color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Quản lý người dùng</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Khách hàng, bác sĩ và nhân viên của trung tâm</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-1.5 h-9 px-4 border border-border bg-white text-[13px] font-medium text-foreground rounded-lg hover:bg-muted transition-colors">
            <Filter size={13} /> Bộ lọc
          </button>
          <button className="flex items-center gap-1.5 h-9 px-4 bg-primary text-primary-foreground text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity">
            <Users size={13} /> Thêm người dùng
          </button>
        </div>
      </div>

      {/* Stat strip */}
      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <span className={`font-mono font-bold text-[18px] leading-none ${s.color}`}>{s.value}</span>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-foreground">{s.label}</div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-lg">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setSearch(""); setSelectedUser(null); }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-semibold transition-colors ${tab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <Icon size={14} />
                {t.label}
                <span className={`text-[11px] font-mono ${tab === t.id ? "text-white/80" : "text-muted-foreground"}`}>{t.count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={`Tìm ${tab === "customers" ? "khách hàng" : tab === "doctors" ? "bác sĩ" : "nhân viên"}...`}
            className="w-64 h-9 pl-8 pr-4 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all" />
        </div>
      </div>

      {/* Table */}
      {loading && (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          Đang tải dữ liệu người dùng...
        </div>
      )}
      {!loading && tab === "customers" && <CustomerTable customers={customersData} search={search} onSelect={openDrawer} />}
      {!loading && tab === "doctors"   && <DoctorTable doctors={doctorsData} search={search} onSelect={openDrawer} />}
      {!loading && tab === "staff"     && <StaffTable staff={staffData} search={search} onSelect={openDrawer} />}

      {/* Drawer */}
      {selectedUser && (
        <UserDrawer
          user={{ ...selectedUser, locked: lockedDrawerUser }}
          onClose={() => setSelectedUser(null)}
          onToggleLock={toggleDrawerLock}
        />
      )}
    </div>
  );
}
