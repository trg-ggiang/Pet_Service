import { useEffect, useState } from "react";
import {
  Search, Edit, Lock, Unlock, Plus,
  Eye, X, Phone, Mail, MapPin, Calendar, Star,
  Stethoscope, Scissors, Users,
  ShieldAlert, CheckCircle2, Clock, Activity,
} from "lucide-react";
import { adminService, type AdminUsersSummary } from "../../features/admin/services/admin";

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

// --- Helpers ──────────────────────────────────────────────────────────────────

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

function UserEditModal({ user, onClose, onSaved }: { user: AnyUser; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState(user.role === "customer" ? (user as Customer).address || "" : "");
  const [specialty, setSpecialty] = useState(user.role === "doctor" ? (user as Doctor).specialty || "" : "");
  const [room, setRoom] = useState(user.role === "doctor" ? (user as Doctor).room || "" : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await adminService.updateUserProfile(user.role, user.id, { name, phone, address, specialty, room });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật thông tin");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-foreground">Chỉnh sửa thông tin</h3>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">{user.name} · {user.id}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={15} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-1.5">Họ và tên</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
          </div>
          {user.role !== "doctor" && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-1.5">Số điện thoại</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
            </div>
          )}
          {user.role === "customer" && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-1.5">Địa chỉ</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
            </div>
          )}
          {user.role === "doctor" && (
            <>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-1.5">Chuyên khoa</label>
                <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-1.5">Phòng khám</label>
                <input value={room} onChange={(e) => setRoom(e.target.value)} className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
              </div>
            </>
          )}
          {error && <p className="text-[12.5px] font-medium text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} disabled={submitting} className="h-10 px-5 rounded-xl border border-border text-[13px] font-semibold text-foreground hover:bg-muted disabled:opacity-40">Hủy</button>
          <button onClick={() => void handleSave()} disabled={submitting || !name.trim()} className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddUserModal({ defaultTab, onClose, onSaved }: { defaultTab: Tab; onClose: () => void; onSaved: () => void }) {
  const [role, setRole] = useState<"customer" | "doctor" | "staff">(defaultTab === "customers" ? "customer" : defaultTab === "doctors" ? "doctor" : "staff");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [room, setRoom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) return;
    setSubmitting(true);
    setError("");
    try {
      await adminService.createStaff({ name, email, password, phone, role, specialty, room });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo tài khoản");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-foreground">Thêm người dùng mới</h3>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">Tạo tài khoản cho khách hàng, bác sĩ hoặc nhân viên</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={15} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-1.5">Vai trò</label>
            <div className="flex gap-2">
              {(["customer", "doctor", "staff"] as const).map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`flex-1 h-9 rounded-xl border text-[12.5px] font-semibold transition-all ${role === r ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                  {r === "customer" ? "Khách hàng" : r === "doctor" ? "Bác sĩ" : "Nhân viên"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-1.5">Họ và tên</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-1.5">Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ít nhất 6 ký tự" className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-1.5">Số điện thoại</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
          </div>
          {role === "doctor" && (
            <>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-1.5">Chuyên khoa</label>
                <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Nội khoa tổng quát" className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-1.5">Phòng khám</label>
                <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Phòng khám 1" className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
              </div>
            </>
          )}
          {error && <p className="text-[12.5px] font-medium text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} disabled={submitting} className="h-10 px-5 rounded-xl border border-border text-[13px] font-semibold text-foreground hover:bg-muted disabled:opacity-40">Hủy</button>
          <button onClick={() => void handleSave()} disabled={submitting || !name.trim() || !email.trim() || password.length < 6} className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
            {submitting ? "Đang tạo..." : "Tạo tài khoản"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerDetail({ user, onToggleLock, onEdit }: { user: Customer; onToggleLock: () => void; onEdit: () => void }) {
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
        <button onClick={onEdit} className="w-full flex items-center gap-2.5 h-10 px-4 border border-border bg-white rounded-xl text-[13px] font-medium text-foreground hover:bg-muted transition-colors">
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

function DoctorDetail({ user, onToggleLock, onEdit }: { user: Doctor; onToggleLock: () => void; onEdit: () => void }) {
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
        <button onClick={onEdit} className="w-full flex items-center gap-2.5 h-10 px-4 border border-border bg-white rounded-xl text-[13px] font-medium text-foreground hover:bg-muted transition-colors">
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

function StaffDetail({ user, onToggleLock, onEdit }: { user: StaffMember; onToggleLock: () => void; onEdit: () => void }) {
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
        <button onClick={onEdit} className="w-full flex items-center gap-2.5 h-10 px-4 border border-border bg-white rounded-xl text-[13px] font-medium text-foreground hover:bg-muted transition-colors">
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

function UserDrawer({ user, onClose, onToggleLock, onEdit }: { user: AnyUser; onClose: () => void; onToggleLock: () => void; onEdit: () => void }) {
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
          {user.role === "customer" && <CustomerDetail user={user as Customer} onToggleLock={onToggleLock} onEdit={onEdit} />}
          {user.role === "doctor"   && <DoctorDetail   user={user as Doctor}   onToggleLock={onToggleLock} onEdit={onEdit} />}
          {user.role === "staff"    && <StaffDetail    user={user as StaffMember} onToggleLock={onToggleLock} onEdit={onEdit} />}
        </div>
      </div>
    </div>
  );
}

// ─── Customer Table ───────────────────────────────────────────────────────────

function CustomerTable({
  customers, onSelect, onToggleLock,
}: {
  customers: Customer[];
  onSelect: (u: Customer) => void;
  onToggleLock: (u: Customer) => void;
}) {
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
            {customers.map((c) => {
              const locked = c.locked;
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
                      <button onClick={() => onToggleLock(c)} className={`p-1.5 hover:bg-muted rounded-md ${locked ? "text-emerald-500" : "text-muted-foreground"}`}>
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

function DoctorTable({ doctors, onSelect }: { doctors: Doctor[]; onSelect: (u: Doctor) => void }) {
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
            {doctors.map((d) => (
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

function StaffTable({
  staff, onSelect, onToggleLock,
}: {
  staff: StaffMember[];
  onSelect: (u: StaffMember) => void;
  onToggleLock: (u: StaffMember) => void;
}) {
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
            {staff.map((s) => {
              const locked = s.locked;
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
                      <button onClick={() => onToggleLock(s)} className={`p-1.5 hover:bg-muted rounded-md ${locked ? "text-emerald-500" : "text-muted-foreground"}`}>
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

export function AdminUsersView() {
  const [tab, setTab] = useState<Tab>("customers");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AnyUser | null>(null);
  const [lockedDrawerUser, setLockedDrawerUser] = useState(false);
  const [editingUser, setEditingUser] = useState<AnyUser | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [customersData, setCustomersData] = useState<Customer[]>([]);
  const [doctorsData, setDoctorsData] = useState<Doctor[]>([]);
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [summary, setSummary] = useState<AdminUsersSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    adminService
      .listUsers({ role: tab, search })
      .then((data) => {
        if (!mounted) return;
        setCustomersData(data.customers as Customer[]);
        setDoctorsData(data.doctors as Doctor[]);
        setStaffData(data.staff as StaffMember[]);
        setSummary(data.summary);
        setLoadError("");
      })
      .catch((error) => {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : "Không thể tải dữ liệu người dùng.");
        setCustomersData([]);
        setDoctorsData([]);
        setStaffData([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [tab, search]);

  const openDrawer = (u: AnyUser) => {
    setSelectedUser(u);
    setLockedDrawerUser(u.locked);
  };

  const reloadUsers = async () => {
    const data = await adminService.listUsers({ role: tab, search });
    setCustomersData(data.customers as Customer[]);
    setDoctorsData(data.doctors as Doctor[]);
    setStaffData(data.staff as StaffMember[]);
    setSummary(data.summary);
  };

  const toggleUserLock = async (user: AnyUser) => {
    try {
      setActionError("");
      const locked = !user.locked;
      await adminService.updateUserLock(user.role, user.id, locked);
      await reloadUsers();
      if (selectedUser?.id === user.id && selectedUser.role === user.role) {
        setSelectedUser({ ...user, locked });
        setLockedDrawerUser(locked);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Không thể cập nhật trạng thái tài khoản.");
    }
  };

  const toggleDrawerLock = () => {
    if (selectedUser) void toggleUserLock({ ...selectedUser, locked: lockedDrawerUser });
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: "customers", label: "Khách hàng", icon: Users,      count: summary?.totals.customers ?? customersData.length },
    { id: "doctors",   label: "Bác sĩ",     icon: Stethoscope, count: summary?.totals.doctors ?? doctorsData.length },
    { id: "staff",     label: "Nhân viên",  icon: Scissors,    count: summary?.totals.staff ?? staffData.length },
  ];

  const statCards = [
    { label: "Tổng khách hàng", value: String(summary?.totals.customers ?? customersData.length), sub: `${summary?.totals.vipCustomers ?? 0} VIP`, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Bác sĩ trực",     value: `${summary?.totals.activeDoctors ?? 0}/${summary?.totals.doctors ?? doctorsData.length}`, sub: "Theo dữ liệu backend", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Nhân viên",       value: String(summary?.totals.activeStaff ?? 0), sub: `${summary?.totals.staff ?? staffData.length} tài khoản nhân viên`, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "Tài khoản khoá",  value: String(summary?.totals.locked ?? 0), sub: "Cần xem xét", color: "text-red-600", bg: "bg-red-50" },
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
          <button onClick={() => setShowAddUser(true)} className="flex items-center gap-1.5 h-9 px-4 bg-primary text-primary-foreground text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity">
            <Plus size={13} /> Thêm người dùng
          </button>
        </div>
      </div>

      {/* Stat strip */}
      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {loadError}
        </div>
      )}
      {actionError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {actionError}
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
      {!loading && tab === "customers" && customersData.length > 0 && <CustomerTable customers={customersData} onSelect={openDrawer} onToggleLock={toggleUserLock} />}
      {!loading && tab === "doctors" && doctorsData.length > 0 && <DoctorTable doctors={doctorsData} onSelect={openDrawer} />}
      {!loading && tab === "staff" && staffData.length > 0 && <StaffTable staff={staffData} onSelect={openDrawer} onToggleLock={toggleUserLock} />}
      {!loading && (
        (tab === "customers" && customersData.length === 0)
        || (tab === "doctors" && doctorsData.length === 0)
        || (tab === "staff" && staffData.length === 0)
      ) && (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          Không tìm thấy người dùng phù hợp
        </div>
      )}

      {/* Drawer */}
      {selectedUser && (
        <UserDrawer
          user={{ ...selectedUser, locked: lockedDrawerUser }}
          onClose={() => setSelectedUser(null)}
          onToggleLock={toggleDrawerLock}
          onEdit={() => setEditingUser({ ...selectedUser, locked: lockedDrawerUser })}
        />
      )}

      {/* Edit modal */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => void reloadUsers()}
        />
      )}

      {/* Add user modal */}
      {showAddUser && (
        <AddUserModal
          defaultTab={tab}
          onClose={() => setShowAddUser(false)}
          onSaved={() => void reloadUsers()}
        />
      )}
    </div>
  );
}
