import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  Mail,
  Monitor,
  Phone,
  Plus,
  Save,
  Shield,
  Smartphone,
  Trash2,
  User,
  X,
} from "lucide-react";
import type { DoctorSettingsPayload } from "../../features/doctor/services/doctorData";

export type DoctorSettingsTabId = "profile" | "schedule" | "notifications" | "security";

export const DOCTOR_SETTINGS_TABS: Array<{ id: DoctorSettingsTabId; label: string; icon: typeof User }> = [
  { id: "profile", label: "Hồ sơ", icon: User },
  { id: "schedule", label: "Lịch làm việc", icon: Clock },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "security", label: "Bảo mật", icon: Shield },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground px-0.5 mt-1">{children}</h4>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function ReadOnlyInput({ value }: { value: string }) {
  return (
    <input
      value={value}
      readOnly
      className="h-10 px-3.5 bg-white border border-border rounded-xl text-[13px] text-foreground focus:outline-none"
    />
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`relative w-10 rounded-full transition-colors flex-shrink-0 ${on ? "bg-cyan-500" : "bg-slate-200"}`} style={{ height: 22 }}>
      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all" style={{ left: on ? "calc(100% - 18px)" : 2 }} />
    </span>
  );
}

export function DoctorSettingsHeader() {
  return (
    <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-border">
      <h2 className="text-sm font-bold text-foreground">Cài đặt</h2>
      <p className="text-[11px] text-muted-foreground">Quản lý hồ sơ, lịch làm việc và bảo mật tài khoản</p>
    </div>
  );
}

export function DoctorSettingsNav({
  tab,
  onTabChange,
}: {
  tab: DoctorSettingsTabId;
  onTabChange: (tab: DoctorSettingsTabId) => void;
}) {
  return (
    <nav className="w-48 flex-shrink-0 bg-white border-r border-border flex flex-col p-3">
      <div className="flex flex-col gap-0.5">
        {DOCTOR_SETTINGS_TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                active ? "bg-cyan-50 text-cyan-700" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={15} className={active ? "text-cyan-600" : ""} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function DoctorSettingsLoading() {
  return (
    <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
      <Loader2 size={22} className="animate-spin text-cyan-500 mr-2" />
      Đang tải cài đặt...
    </div>
  );
}

export function DoctorSettingsError({ message }: { message: string }) {
  return <div className="flex-1 flex items-center justify-center text-sm text-red-600">{message}</div>;
}

export function DoctorProfileSettings({ profile }: { profile: DoctorSettingsPayload["profile"] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-200">
          <span className="text-2xl font-bold text-white">{profile.initials || "BS"}</span>
        </div>
        <div>
          <p className="text-base font-bold text-foreground">BS. {profile.name}</p>
          <p className="text-[13px] text-muted-foreground">{profile.specialty} · {profile.room}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-emerald-600 font-semibold">{profile.statusLabel}</span>
          </div>
        </div>
      </div>
      <div className="w-full h-px bg-border" />
      <SectionTitle>Thông tin cơ bản</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Họ và tên"><ReadOnlyInput value={profile.name} /></Field>
        <Field label="Chuyên khoa"><ReadOnlyInput value={profile.specialty} /></Field>
        <Field label="Email">
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={profile.email} readOnly className="w-full h-10 pl-9 pr-3.5 bg-white border border-border rounded-xl text-[13px] text-foreground focus:outline-none" />
          </div>
        </Field>
        <Field label="Số điện thoại">
          <div className="relative">
            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={profile.phone} readOnly className="w-full h-10 pl-9 pr-3.5 bg-white border border-border rounded-xl text-[13px] text-foreground focus:outline-none" />
          </div>
        </Field>
        <Field label="Phòng khám"><ReadOnlyInput value={profile.room} /></Field>
        <Field label="Bằng cấp / giấy phép"><ReadOnlyInput value={profile.license} /></Field>
      </div>
      <Field label="Giới thiệu bản thân">
        <textarea rows={3} value={profile.bio} readOnly className="px-3.5 py-3 bg-white border border-border rounded-xl text-[13px] text-foreground focus:outline-none resize-none" />
      </Field>
    </div>
  );
}

export interface ScheduleRowInput {
  id?: number;
  day: string;
  date: string;
  on: boolean;
  from: string;
  to: string;
  roomName: string;
  status: string;
}

interface ScheduleFormProps {
  initialRows: DoctorSettingsPayload["schedule"]["rows"];
  onSave: (rows: ScheduleRowInput[]) => Promise<void>;
  onDelete: (scheduleId: number) => Promise<void>;
  onCancel: () => void;
}

function generateDateFromDay(index: number): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = (index - dayOfWeek + 7) % 7;
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + diff);
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const totalMinutes = 7 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
});

export function DoctorScheduleForm({ initialRows, onSave, onDelete, onCancel }: ScheduleFormProps) {
  const [rows, setRows] = useState<ScheduleRowInput[]>(() =>
    initialRows.length > 0
      ? initialRows.map((r) => ({
          id: r.id,
          day: r.day,
          date: r.date,
          on: r.on,
          from: r.from,
          to: r.to,
          roomName: r.roomName,
          status: r.status,
        }))
      : Array.from({ length: 7 }, (_, i) => ({
          day: ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][i],
          date: generateDateFromDay(i === 0 ? 0 : i === 6 ? 6 : i),
          on: i >= 1 && i <= 6,
          from: "08:00",
          to: "17:00",
          roomName: "Phòng 1",
          status: "AVAILABLE",
        })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateRow(index: number, patch: Partial<ScheduleRowInput>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function handleAddRow() {
    setRows((prev) => {
      const nextIndex = prev.length;
      return [
        ...prev,
        {
          day: "",
          date: generateDateFromDay(nextIndex === 0 ? 0 : nextIndex === 6 ? 6 : nextIndex),
          on: true,
          from: "08:00",
          to: "17:00",
          roomName: "Phòng 1",
          status: "AVAILABLE",
        },
      ];
    });
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await onSave(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể lưu lịch");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle>Cấu hình ngày làm việc</SectionTitle>
        <button
          type="button"
          onClick={handleAddRow}
          className="h-8 px-3 border border-border rounded-lg text-[12px] font-semibold text-foreground hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <Plus size={14} />
          Thêm ngày
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
              row.on ? "bg-white border-border" : "bg-slate-50 border-border opacity-70"
            }`}
          >
            <button
              type="button"
              onClick={() => updateRow(index, { on: !row.on })}
              className="flex-shrink-0 focus:outline-none"
            >
              <Toggle on={row.on} />
            </button>

            <input
              type="text"
              value={row.day}
              onChange={(e) => updateRow(index, { day: e.target.value })}
              placeholder="Thứ 2"
              className="w-20 h-8 px-2 text-[12px] border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />

            <input
              type="date"
              value={row.date}
              onChange={(e) => updateRow(index, { date: e.target.value })}
              className="h-8 px-2 text-[12px] border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />

            <select
              value={row.from}
              onChange={(e) => updateRow(index, { from: e.target.value })}
              disabled={!row.on}
              className="h-8 px-2 text-[12px] border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:bg-slate-100"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <span className="text-[12px] text-muted-foreground">→</span>

            <select
              value={row.to}
              onChange={(e) => updateRow(index, { to: e.target.value })}
              disabled={!row.on}
              className="h-8 px-2 text-[12px] border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:bg-slate-100"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <input
              type="text"
              value={row.roomName}
              onChange={(e) => updateRow(index, { roomName: e.target.value })}
              placeholder="Phòng 1"
              className="w-28 h-8 px-2 text-[12px] border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="h-10 px-5 border border-border rounded-xl text-[13px] font-semibold text-foreground hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-[13px] font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Lưu lịch
        </button>
      </div>
    </div>
  );
}

export function DoctorScheduleSettings({
  schedule,
}: {
  schedule: DoctorSettingsPayload["schedule"];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionTitle>Ngày và giờ làm việc từ admin</SectionTitle>
      </div>
      <div className="flex flex-col gap-2">
        {schedule.rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
            Chưa có lịch làm việc trong database.
          </div>
        ) : schedule.rows.map((row) => (
          <div key={row.id} className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${row.on ? "bg-white border-border" : "bg-slate-50 border-border opacity-60"}`}>
            <Toggle on={row.on} />
            <span className="w-14 text-[13px] font-semibold text-foreground">{row.day}</span>
            <span className="text-[12px] text-muted-foreground">{row.date}</span>
            <span className="text-[12px] font-semibold text-foreground">{row.from} - {row.to}</span>
            <span className="ml-auto text-[11px] text-muted-foreground font-medium">
              {row.roomName} · {row.slotCount ?? 0} ca khám
            </span>
          </div>
        ))}
      </div>
      <div className="w-full h-px bg-border" />
      <SectionTitle>Cấu hình ca khám</SectionTitle>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Thời lượng mỗi ca"><ReadOnlyInput value={`${schedule.options.slotDuration} phút`} /></Field>
        <Field label="Tối đa ca/ngày"><ReadOnlyInput value={schedule.options.maxAppointments} /></Field>
        <Field label="Nghỉ giải lao"><ReadOnlyInput value={`${schedule.options.breakFrom} - ${schedule.options.breakTo}`} /></Field>
      </div>
    </div>
  );
}

function DoctorScheduleSettingsEditor({
  schedule,
  onSave,
}: {
  schedule: DoctorSettingsPayload["schedule"];
  onSave: (rows: ScheduleRowInput[]) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {!isEditing ? (
        <>
          <div className="flex items-center justify-between">
            <SectionTitle>Ngày & giờ làm việc</SectionTitle>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-[13px] font-semibold transition-colors flex items-center gap-2"
            >
              <Plus size={14} />
              Chỉnh sửa lịch
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {schedule.rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
                Chưa có lịch làm việc trong database.
              </div>
            ) : schedule.rows.map((row) => (
              <div key={row.id} className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${row.on ? "bg-white border-border" : "bg-slate-50 border-border opacity-60"}`}>
                <Toggle on={row.on} />
                <span className="w-14 text-[13px] font-semibold text-foreground">{row.day}</span>
                <span className="text-[12px] text-muted-foreground">{row.date}</span>
                <span className="text-[12px] font-semibold text-foreground">{row.from} → {row.to}</span>
                <span className="ml-auto text-[11px] text-muted-foreground font-medium">{row.roomName} · {row.status}</span>
              </div>
            ))}
          </div>
          <div className="w-full h-px bg-border" />
          <SectionTitle>Cấu hình ca khám</SectionTitle>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Thời lượng mỗi ca"><ReadOnlyInput value={`${schedule.options.slotDuration} phút`} /></Field>
            <Field label="Tối đa ca/ngày"><ReadOnlyInput value={schedule.options.maxAppointments} /></Field>
            <Field label="Nghỉ giải lao"><ReadOnlyInput value={`${schedule.options.breakFrom} → ${schedule.options.breakTo}`} /></Field>
          </div>
        </>
      ) : (
        <DoctorScheduleForm
          initialRows={schedule.rows}
          onSave={async (rows) => {
            await onSave(rows);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}

export function DoctorNotificationSettings({ notifications }: { notifications: DoctorSettingsPayload["notifications"] }) {
  const channels = [
    { icon: Mail, label: "Email" },
    { icon: Smartphone, label: "SMS" },
    { icon: Monitor, label: "Trong app" },
  ];
  const groups = [
    { title: "Lịch hẹn", sub: "Thông báo về ca khám mới, hủy, thay đổi", keys: ["aptEmail", "aptSms", "aptPush"] },
    { title: "Nhắc nhở ca khám", sub: "Nhắc trước 30 phút mỗi ca", keys: ["remEmail", "remSms", "remPush"] },
    { title: "Thông báo hệ thống", sub: "Cập nhật phần mềm, bảo trì", keys: ["sysEmail", "sysSms", "sysPush"] },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Kênh nhận thông báo</SectionTitle>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_80px] px-4 py-2 bg-slate-50 border-b border-border">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sự kiện</span>
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <div key={channel.label} className="flex flex-col items-center gap-1">
                <Icon size={13} className="text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground">{channel.label}</span>
              </div>
            );
          })}
        </div>
        {groups.map((group) => (
          <div key={group.title} className="grid grid-cols-[1fr_80px_80px_80px] px-4 py-3.5 border-b border-border last:border-0 items-center">
            <div>
              <p className="text-[13px] font-semibold text-foreground">{group.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{group.sub}</p>
            </div>
            {group.keys.map((key) => (
              <div key={key} className="flex justify-center">
                <Toggle on={Boolean(notifications[key])} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DoctorSecuritySettings({ security }: { security: DoctorSettingsPayload["security"] }) {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Xác thực 2 bước</SectionTitle>
      <div className="bg-white rounded-2xl border border-border px-4 py-3.5 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-foreground">Xác thực 2 yếu tố (2FA)</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Bảo vệ tài khoản với mã OTP qua email hoặc ứng dụng xác thực</p>
        </div>
        <div className="flex items-center gap-3">
          {security.twoFa && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Đã bật</span>}
          <Toggle on={security.twoFa} />
        </div>
      </div>
      <div className="w-full h-px bg-border" />
      <SectionTitle>Phiên đăng nhập</SectionTitle>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {security.sessions.map((session, index) => (
          <div key={`${session.device}-${index}`} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Globe size={16} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-foreground">{session.device}</p>
                {session.current && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Thiết bị này</span>}
              </div>
              <p className="text-[11px] text-muted-foreground">{session.location} · {session.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DoctorLogoutConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
          <CheckCircle2 size={22} className="text-red-500" />
        </div>
        <div className="text-center">
          <h3 className="text-[15px] font-bold text-foreground">Xác nhận đăng xuất</h3>
          <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">Bạn có chắc chắn muốn đăng xuất? Phiên làm việc hiện tại sẽ kết thúc.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 h-10 border border-border rounded-xl text-[13px] font-semibold text-foreground hover:bg-muted transition-colors">
            Hủy
          </button>
          <button onClick={onConfirm} className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[13px] font-bold transition-colors active:scale-[0.98]">
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

