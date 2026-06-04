import { useEffect, useState } from "react";
import {
  Search, Plus, Edit, Lock, Unlock, Eye, X, Phone, Mail,
  Calendar, Star, Stethoscope, Scissors, BedDouble, Users,
  ShieldAlert, CheckCircle2, Clock, Activity, ToggleLeft,
  ToggleRight, Briefcase, Filter,
  BarChart3, Award, TrendingUp,
} from "lucide-react";
import { adminService, type AdminStaffSummary } from "../../features/admin/services/admin";

type Department = "all" | "clinic" | "grooming" | "boarding" | "reception" | "admin";
type WorkStatus = "active" | "on_leave" | "probation";
type Shift = "Sáng (7–13h)" | "Chiều (13–19h)" | "Cả ngày (7–19h)";

interface StaffMember {
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

// --- Config ───────────────────────────────────────────────────────────────────

const DEPT_CONFIG: Record<Exclude<Department, "all">, {
  label: string; icon: React.ElementType; color: string; bg: string; border: string;
}> = {
  clinic:    { label: "Phòng khám",        icon: Stethoscope, color: "text-cyan-600",    bg: "bg-cyan-50",    border: "border-cyan-200" },
  grooming:  { label: "Grooming",          icon: Scissors,    color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  boarding:  { label: "Lưu trú",           icon: BedDouble,   color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200" },
  reception: { label: "Lễ tân",            icon: Users,       color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200" },
  admin:     { label: "Kế toán & Hành chính", icon: Briefcase, color: "text-slate-600",  bg: "bg-slate-100",  border: "border-slate-200" },
};

const DEPT_ORDER: Exclude<Department, "all">[] = ["clinic", "grooming", "boarding", "reception", "admin"];

const STATUS_CONFIG: Record<WorkStatus, { label: string; dot: string; cls: string }> = {
  active:     { label: "Đang làm việc", dot: "bg-emerald-500",              cls: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" },
  on_leave:   { label: "Nghỉ phép",     dot: "bg-slate-400",               cls: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200" },
  probation:  { label: "Thử việc",      dot: "bg-amber-400 animate-pulse", cls: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200" },
};

const AVATAR_COLORS = [
  "from-cyan-400 to-cyan-600", "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600", "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600", "from-indigo-400 to-indigo-600",
  "from-slate-400 to-slate-600",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function AvatarBubble({ initials, name, size = "md" }: { initials: string; name: string; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "w-8 h-8 text-[11px]", md: "w-10 h-10 text-[12px]", lg: "w-14 h-14 text-[16px]" }[size];
  return (
    <div className={`rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center flex-shrink-0 ${sz}`}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  );
}

function StatusPill({ status }: { status: WorkStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function DeptBadge({ dept }: { dept: Exclude<Department, "all"> }) {
  const cfg = DEPT_CONFIG[dept];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function PerfBar({ value }: { value: number }) {
  const color = value >= 90 ? "bg-emerald-500" : value >= 75 ? "bg-cyan-500" : value >= 60 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-[11px] font-bold text-foreground w-7 text-right">{value}%</span>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function StaffDrawer({
  staff, onClose, onEdit, onToggleLock,
}: {
  staff: StaffMember; onClose: () => void; onEdit: () => void; onToggleLock: () => void;
}) {
  const dept = DEPT_CONFIG[staff.department];
  const DeptIcon = dept.icon;
  const status = STATUS_CONFIG[staff.workStatus];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="w-[440px] bg-white h-full shadow-2xl flex flex-col border-l border-border">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <AvatarBubble initials={staff.avatar} name={staff.name} size="lg" />
              <div>
                <div className="text-[18px] font-bold text-foreground leading-tight">{staff.name}</div>
                <div className="text-[13px] text-muted-foreground mt-0.5">{staff.position}</div>
                <div className="mt-1.5">
                  <DeptBadge dept={staff.department} />
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors flex-shrink-0">
              <X size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Status chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill status={staff.workStatus} />
            {staff.locked && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 ring-1 ring-inset ring-red-200">
                <ShieldAlert size={11} /> Đã khoá
              </span>
            )}
            {staff.specialty && (
              <span className="text-[11px] text-muted-foreground font-medium px-2.5 py-1 rounded-full bg-muted border border-border">
                {staff.specialty}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground font-mono ml-auto">{staff.id}</span>
          </div>

          {/* Performance stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Hôm nay",    value: `${staff.completedTasks}/${staff.todayTasks}`, unit: "nhiệm vụ" },
              { label: "Hiệu suất",  value: `${staff.monthlyPerf}%`,                        unit: "tháng này" },
              { label: "Đánh giá",   value: staff.rating.toFixed(1),                        unit: "/ 5.0", highlight: true },
            ].map((s) => (
              <div key={s.label} className="bg-muted/40 rounded-xl p-3 text-center border border-border">
                <div className={`font-mono font-bold text-[20px] leading-none ${s.highlight ? "text-amber-500" : "text-foreground"}`}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground mt-1.5 font-medium">{s.unit}</div>
                <div className="text-[10px] text-muted-foreground/70">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Performance bar */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Hiệu suất tháng này</div>
            <PerfBar value={staff.monthlyPerf} />
          </div>

          {/* Work info */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Thông tin công việc</div>
            <div className="space-y-2.5">
              {[
                { icon: Briefcase, value: `${staff.position} · ${dept.label}` },
                { icon: Clock,     value: `Ca làm: ${staff.shift}` },
                { icon: Calendar,  value: `Ngày vào làm: ${staff.joinDate}` },
                ...(staff.room      ? [{ icon: Activity, value: `Phòng khám: ${staff.room}` }] : []),
                ...(staff.licenseNo ? [{ icon: Award,    value: `CMHV: ${staff.licenseNo}` }] : []),
              ].map(({ icon: Icon, value }) => (
                <div key={value} className="flex items-center gap-3 text-[12.5px]">
                  <Icon size={13} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rating stars */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Đánh giá từ khách hàng</div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={16}
                  className={i <= Math.round(staff.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
              ))}
              <span className="font-mono font-bold text-[14px] text-foreground ml-1">{staff.rating.toFixed(1)}</span>
              <span className="text-[12px] text-muted-foreground">/ 5.0</span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Liên hệ</div>
            <div className="space-y-2.5">
              {[
                { icon: Phone, value: staff.phone },
                { icon: Mail,  value: staff.email },
              ].map(({ icon: Icon, value }) => (
                <div key={value} className="flex items-center gap-3 text-[12.5px]">
                  <Icon size={13} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {staff.notes && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Ghi chú</div>
              <p className="text-[12.5px] text-foreground leading-relaxed">{staff.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border flex items-center gap-3 flex-shrink-0">
          <button onClick={onToggleLock}
            className={`flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold border transition-colors ${
              staff.locked
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            }`}>
            {staff.locked ? <><Unlock size={13} /> Mở khoá</> : <><Lock size={13} /> Khoá TK</>}
          </button>
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity">
            <Edit size={13} /> Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

const SHIFTS: Shift[] = ["Sáng (7–13h)", "Chiều (13–19h)", "Cả ngày (7–19h)"];
const WORK_STATUSES: { v: WorkStatus; label: string }[] = [
  { v: "active",    label: "Đang làm việc" },
  { v: "on_leave",  label: "Nghỉ phép" },
  { v: "probation", label: "Thử việc" },
];

const EMPTY: Omit<StaffMember, "id"> = {
  name: "", avatar: "", department: "clinic", position: "", phone: "", email: "",
  joinDate: "", shift: "Cả ngày (7–19h)", workStatus: "active", locked: false,
  todayTasks: 0, completedTasks: 0, monthlyPerf: 80, rating: 4.5, notes: "",
};

function StaffModal({
  editing, onClose, onSave,
}: {
  editing: StaffMember | null; onClose: () => void; onSave: () => void;
}) {
  const isEdit = !!editing;
  const [form, setForm] = useState<Omit<StaffMember, "id">>(
    editing ? { ...editing } : { ...EMPTY }
  );

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim() || !form.position.trim()) return;
    onSave();
  };

  const isDoctor = form.department === "clinic" && form.position.toLowerCase().startsWith("bác sĩ");

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="w-[520px] bg-white h-full shadow-2xl flex flex-col border-l border-border">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-foreground tracking-tight">
              {isEdit ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit ? `Đang sửa: ${editing!.name}` : "Điền thông tin nhân viên mới"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors mt-0.5">
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Department */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">Bộ phận</label>
            <div className="grid grid-cols-3 gap-2">
              {DEPT_ORDER.map((d) => {
                const cfg = DEPT_CONFIG[d];
                const Icon = cfg.icon;
                return (
                  <button key={d} onClick={() => set("department", d)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-[12.5px] font-medium transition-all text-left ${form.department === d ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"}`}>
                    <Icon size={13} className={form.department === d ? cfg.color : "text-muted-foreground"} />
                    <span className="truncate">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">Họ và tên</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">Chức vụ</label>
              <input value={form.position} onChange={(e) => set("position", e.target.value)}
                placeholder="VD: Bác sĩ thú y, Groomer..."
                className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">Số điện thoại</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                placeholder="09xx xxx xxx"
                className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] font-mono text-foreground placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">Email</label>
              <input value={form.email} onChange={(e) => set("email", e.target.value)}
                placeholder="ten@petcare.vn"
                className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
            </div>
          </div>

          {/* Shift + Join date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">Ca làm việc</label>
              <div className="space-y-1.5">
                {SHIFTS.map((s) => (
                  <button key={s} onClick={() => set("shift", s)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[12.5px] font-medium text-left transition-all ${form.shift === s ? "bg-cyan-50 border-cyan-300 text-cyan-700" : "border-border bg-white text-muted-foreground hover:bg-muted"}`}>
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${form.shift === s ? "border-cyan-500 bg-cyan-500" : "border-slate-300"}`} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">Ngày vào làm</label>
                <input value={form.joinDate} onChange={(e) => set("joinDate", e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full h-10 px-4 border border-border rounded-xl text-[13.5px] font-mono text-foreground placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">Trạng thái</label>
                <div className="space-y-1.5">
                  {WORK_STATUSES.map(({ v, label }) => (
                    <button key={v} onClick={() => set("workStatus", v)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[12.5px] font-medium text-left transition-all ${form.workStatus === v ? `${STATUS_CONFIG[v].cls} border-current` : "border-border bg-white text-muted-foreground hover:bg-muted"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_CONFIG[v].dot.replace("animate-pulse", "")}`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Doctor-specific: specialty + room */}
          {form.department === "clinic" && (
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-cyan-50/50 border border-cyan-200">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-cyan-700 block mb-2">Chuyên khoa</label>
                <input value={form.specialty ?? ""} onChange={(e) => set("specialty", e.target.value)}
                  placeholder="VD: Nội khoa, Ngoại khoa..."
                  className="w-full h-9 px-3 border border-cyan-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/20 focus:border-cyan-400 text-foreground placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-cyan-700 block mb-2">Phòng khám</label>
                <input value={form.room ?? ""} onChange={(e) => set("room", e.target.value)}
                  placeholder="VD: Phòng 1"
                  className="w-full h-9 px-3 border border-cyan-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/20 focus:border-cyan-400 text-foreground placeholder:text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground block mb-2">Ghi chú nội bộ</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
              rows={3} placeholder="Kỹ năng đặc biệt, ghi chú nội bộ..."
              className="w-full px-4 py-3 border border-border rounded-xl text-[13.5px] leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white resize-none" />
          </div>

          {/* Lock toggle */}
          {isEdit && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div>
                <div className="text-[13px] font-semibold text-foreground">Trạng thái tài khoản</div>
                <div className="text-[12px] text-muted-foreground mt-0.5">
                  {form.locked ? "Tài khoản đang bị khoá — nhân viên không thể đăng nhập" : "Tài khoản đang hoạt động bình thường"}
                </div>
              </div>
              <button onClick={() => set("locked", !form.locked)}>
                {!form.locked
                  ? <ToggleRight size={36} className="text-primary" />
                  : <ToggleLeft  size={36} className="text-muted-foreground" />
                }
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center gap-3 flex-shrink-0 bg-muted/20">
          <button onClick={onClose} className="flex-1 h-10 border border-border bg-white rounded-xl text-[13px] font-semibold text-foreground hover:bg-muted transition-colors">Huỷ bỏ</button>
          <button onClick={handleSave} disabled={!form.name.trim() || !form.position.trim()}
            className="flex-1 h-10 bg-primary text-primary-foreground rounded-xl text-[13px] font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-cyan-500/20">
            {isEdit ? "Lưu thay đổi" : "Thêm nhân viên"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Staff Row ────────────────────────────────────────────────────────────────

function StaffRow({
  member, selected, onSelect, onEdit, onToggleLock,
}: {
  member: StaffMember; selected: boolean;
  onSelect: () => void; onEdit: () => void; onToggleLock: () => void;
}) {
  const dept = DEPT_CONFIG[member.department];

  return (
    <tr
      onClick={onSelect}
      className={`group transition-colors cursor-pointer ${selected ? "bg-cyan-50/50" : "hover:bg-muted/25"}`}
    >
      {/* Name + id */}
      <td className="pl-5 pr-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <AvatarBubble initials={member.avatar} name={member.name} size="sm" />
            {member.locked && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                <Lock size={7} className="text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-foreground truncate">{member.name}</div>
            <div className="text-[11.5px] text-muted-foreground truncate">{member.position}</div>
          </div>
        </div>
      </td>

      {/* Department */}
      <td className="px-4 py-3.5">
        <DeptBadge dept={member.department} />
      </td>

      {/* Shift */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-[12.5px] text-foreground font-medium">
          <Clock size={11} className="text-muted-foreground flex-shrink-0" />
          {member.shift}
        </div>
      </td>

      {/* Tasks + perf */}
      <td className="px-4 py-3.5">
        <div className="text-[12.5px] font-medium text-foreground">
          {member.completedTasks}/{member.todayTasks}
          <span className="text-muted-foreground font-normal text-[11.5px] ml-1">nhiệm vụ</span>
        </div>
        <div className="mt-1.5 w-28">
          <PerfBar value={member.monthlyPerf} />
        </div>
      </td>

      {/* Rating */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
          <span className="font-mono font-bold text-[13px] text-foreground">{member.rating.toFixed(1)}</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <StatusPill status={member.workStatus} />
      </td>

      {/* Actions */}
      <td className="pr-4 py-3.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onSelect} className="p-1.5 hover:bg-muted rounded-md transition-colors">
            <Eye size={13} className="text-muted-foreground" />
          </button>
          <button onClick={onEdit} className="p-1.5 hover:bg-muted rounded-md transition-colors">
            <Edit size={13} className="text-muted-foreground" />
          </button>
          <button onClick={onToggleLock} className={`p-1.5 rounded-md transition-colors ${member.locked ? "hover:bg-emerald-50 text-emerald-500" : "hover:bg-red-50 text-muted-foreground hover:text-red-500"}`}>
            {member.locked ? <Unlock size={13} /> : <Lock size={13} />}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── StaffPage ────────────────────────────────────────────────────────────────

export function AdminStaffView() {
  const [staff, setStaff]           = useState<StaffMember[]>([]);
  const [summary, setSummary]       = useState<AdminStaffSummary | null>(null);
  const [activeDept, setActiveDept] = useState<Department>("all");
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showModal, setShowModal]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let mounted = true;

    adminService
      .listStaff({ department: activeDept, status: statusFilter, search })
      .then((data) => {
        if (!mounted) return;
        setStaff(data.staff as StaffMember[]);
        setSummary(data.summary);
        setLoadError("");
      })
      .catch((error) => {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : "Không thể tải dữ liệu nhân viên.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeDept, statusFilter, search]);

  const selectedMember = staff.find((m) => m.id === selectedId) ?? null;

  const reloadStaff = async () => {
    const data = await adminService.listStaff({ department: activeDept, status: statusFilter, search });
    setStaff(data.staff as StaffMember[]);
    setSummary(data.summary);
  };

  const toggleLock = async (member: StaffMember) => {
    try {
      setActionError("");
      await adminService.updateStaffLock(member.id, !member.locked);
      await reloadStaff();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Không thể cập nhật trạng thái tài khoản nhân viên.");
    }
  };

  const openEdit = (m: StaffMember) => { setEditingStaff(m); setShowModal(true); };
  const openAdd  = () => { setEditingStaff(null); setShowModal(true); };

  const handleSave = () => {
    setActionError("Chức năng thêm/sửa hồ sơ nhân viên cần API backend riêng, nên frontend không cập nhật giả lập trên màn hình.");
  };

  const totalStaff = summary?.total ?? staff.length;
  const filteredStaff = summary?.filtered ?? staff.length;
  const totalActive = summary?.active ?? 0;
  const totalOnLeave = summary?.onLeave ?? 0;
  const totalLocked = summary?.locked ?? 0;
  const avgPerf = summary?.avgPerf ?? 0;
  const avgRating = summary?.avgRating ?? "0.0";
  const activeFiltered = summary?.activeFiltered ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Quản lý nhân viên</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalStaff} nhân viên · {DEPT_ORDER.length} bộ phận</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-1.5 h-9 px-4 border border-border bg-white text-[13px] font-medium text-foreground rounded-lg hover:bg-muted transition-colors">
            <Filter size={13} /> Bộ lọc
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 h-9 px-4 bg-primary text-primary-foreground text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity">
            <Plus size={14} /> Thêm nhân viên
          </button>
        </div>
      </div>

      {/* KPI strip */}
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

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Tổng nhân viên",   value: totalStaff.toString(),     sub: `${DEPT_ORDER.length} bộ phận`,            icon: Users,       iconBg: "bg-cyan-50",    iconColor: "text-cyan-600" },
          { label: "Đang làm việc",    value: totalActive.toString(),    sub: "Có mặt hôm nay",                           icon: CheckCircle2, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
          { label: "Đang nghỉ phép",   value: totalOnLeave.toString(),   sub: "Tạm thời vắng mặt",                        icon: Clock,       iconBg: "bg-amber-50",   iconColor: "text-amber-600" },
          { label: "Hiệu suất TB",     value: `${avgPerf}%`,            sub: "Tất cả bộ phận",                            icon: TrendingUp,  iconBg: "bg-violet-50",  iconColor: "text-violet-600" },
          { label: "Đánh giá TB",      value: avgRating,                sub: totalLocked > 0 ? `${totalLocked} TK bị khoá` : "Không có TK bị khoá", icon: Star, iconBg: "bg-rose-50", iconColor: "text-rose-600" },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${k.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={16} className={k.iconColor} />
              </div>
              <div className="min-w-0">
                <div className="font-mono font-bold text-[20px] text-foreground leading-none">{k.value}</div>
                <div className="text-[12px] font-semibold text-foreground mt-0.5 truncate">{k.label}</div>
                <div className="text-[11px] text-muted-foreground truncate">{k.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Department tabs */}
        <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-xl flex-wrap">
          <button onClick={() => setActiveDept("all")}
            className={`px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${activeDept === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
            Tất cả
            <span className={`ml-1.5 text-[11px] font-mono ${activeDept === "all" ? "text-white/80" : "text-muted-foreground"}`}>{summary?.total ?? staff.length}</span>
          </button>
          {DEPT_ORDER.map((d) => {
            const cfg = DEPT_CONFIG[d];
            const Icon = cfg.icon;
            const count = summary?.departments.find((item) => item.department === d)?.count ?? 0;
            return (
              <button key={d} onClick={() => setActiveDept(d)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all ${activeDept === d ? `${cfg.bg} ${cfg.color} border ${cfg.border}` : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <Icon size={13} />
                {cfg.label}
                <span className={`text-[11px] font-mono ${activeDept === d ? cfg.color + "/70" : "text-muted-foreground"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            {([["all", "Tất cả"], ["active", "Đang làm"], ["on_leave", "Nghỉ phép"], ["probation", "Thử việc"]] as [WorkStatus | "all", string][]).map(([v, label]) => (
              <button key={v} onClick={() => setStatusFilter(v)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${statusFilter === v ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nhân viên..."
              className="w-52 h-9 pl-8 pr-4 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all" />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading && (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          Đang tải dữ liệu nhân viên...
        </div>
      )}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {["Nhân viên", "Bộ phận", "Ca làm việc", "Nhiệm vụ / Hiệu suất", "Đánh giá", "Trạng thái", ""].map((h, i) => (
                  <th key={h + i} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground ${i === 0 ? "pl-5 text-left" : i === 6 ? "w-20" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground text-sm">
                    Không tìm thấy nhân viên phù hợp
                  </td>
                </tr>
              ) : staff.map((m) => (
                <StaffRow
                  key={m.id}
                  member={m}
                  selected={m.id === selectedId}
                  onSelect={() => setSelectedId(selectedId === m.id ? null : m.id)}
                  onEdit={() => openEdit(m)}
                  onToggleLock={() => toggleLock(m)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {filteredStaff} nhân viên · {activeFiltered} đang làm việc
          </span>
          <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2">
            <Plus size={11} /> Thêm nhân viên
          </button>
        </div>
      </div>

      {/* Drawer */}
      {selectedMember && (
        <StaffDrawer
          staff={selectedMember}
          onClose={() => setSelectedId(null)}
          onEdit={() => { openEdit(selectedMember); setSelectedId(null); }}
          onToggleLock={() => toggleLock(selectedMember)}
        />
      )}

      {/* Modal */}
      {showModal && (
        <StaffModal
          editing={editingStaff}
          onClose={() => { setShowModal(false); setEditingStaff(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
