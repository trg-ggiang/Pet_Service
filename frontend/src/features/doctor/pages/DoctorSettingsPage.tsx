import { useState } from "react";
import {
  User, Clock, Bell, Shield, Eye, EyeOff,
  CheckCircle2, Save, Camera, Mail, Phone,
  Monitor, Smartphone, Globe,
} from "lucide-react";

type Tab = "profile" | "schedule" | "notifications" | "security";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile",       label: "Hồ sơ",        icon: User },
  { id: "schedule",      label: "Lịch làm việc", icon: Clock },
  { id: "notifications", label: "Thông báo",     icon: Bell },
  { id: "security",      label: "Bảo mật",       icon: Shield },
];

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
const TIMES = ["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground px-0.5 mt-1">{children}</h4>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 px-3.5 bg-white border border-border rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
    />
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${on ? "bg-cyan-500" : "bg-slate-200"}`}
      style={{ height: 22 }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
        style={{ left: on ? "calc(100% - 18px)" : 2 }}
      />
    </button>
  );
}

function NotifRow({ label, sub, on, onToggle }: { label: string; sub?: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}

function SaveBtn({ onClick }: { onClick: () => void }) {
  const [saved, setSaved] = useState(false);
  function handle() {
    onClick();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 h-9 px-5 rounded-xl text-[13px] font-bold text-white transition-all active:scale-[0.98] hover:opacity-90"
      style={{ background: saved ? "#10B981" : "linear-gradient(135deg,#0891B2,#06B6D4)", boxShadow: "0 3px 12px rgba(8,145,178,0.25)" }}
    >
      {saved ? <><CheckCircle2 size={14} /> Đã lưu</> : <><Save size={14} /> Lưu thay đổi</>}
    </button>
  );
}

// ── Tab: Profile ───────────────────────────────────────────────────────────────
function ProfileTab() {
  const [name,      setName]      = useState("Trần Hoài Nam");
  const [email,     setEmail]     = useState("nam.tran@petcare.vn");
  const [phone,     setPhone]     = useState("0901 234 567");
  const [specialty, setSpecialty] = useState("Nội khoa & Da liễu");
  const [room,      setRoom]      = useState("Phòng 1");
  const [bio,       setBio]       = useState("Bác sĩ thú y với hơn 8 năm kinh nghiệm trong lĩnh vực nội khoa và da liễu thú cưng. Chuyên điều trị các bệnh mãn tính và bệnh da ở chó mèo.");
  const [license,   setLicense]   = useState("BSTY-2018-00412");

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-200">
            <span className="text-2xl font-bold text-white">TN</span>
          </div>
          <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-white border-2 border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm">
            <Camera size={13} className="text-muted-foreground" />
          </button>
        </div>
        <div>
          <p className="text-base font-bold text-foreground">BS. {name}</p>
          <p className="text-[13px] text-muted-foreground">{specialty} · {room}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-emerald-600 font-semibold">Đang làm việc</span>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-border" />

      <SectionTitle>Thông tin cơ bản</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Họ và tên">
          <TextInput value={name} onChange={setName} />
        </Field>
        <Field label="Chuyên khoa">
          <TextInput value={specialty} onChange={setSpecialty} />
        </Field>
        <Field label="Email">
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 pl-9 pr-3.5 bg-white border border-border rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
            />
          </div>
        </Field>
        <Field label="Số điện thoại">
          <div className="relative">
            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full h-10 pl-9 pr-3.5 bg-white border border-border rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
            />
          </div>
        </Field>
        <Field label="Phòng khám">
          <TextInput value={room} onChange={setRoom} />
        </Field>
        <Field label="Số giấy phép hành nghề">
          <TextInput value={license} onChange={setLicense} />
        </Field>
      </div>

      <Field label="Giới thiệu bản thân">
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="px-3.5 py-3 bg-white border border-border rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all resize-none"
        />
      </Field>

      <div className="flex justify-end">
        <SaveBtn onClick={() => {}} />
      </div>
    </div>
  );
}

// ── Tab: Schedule ──────────────────────────────────────────────────────────────
function ScheduleTab() {
  const [schedule, setSchedule] = useState<Record<string, { on: boolean; from: string; to: string }>>({
    "Thứ 2": { on: true,  from: "08:00", to: "17:00" },
    "Thứ 3": { on: true,  from: "08:00", to: "17:00" },
    "Thứ 4": { on: true,  from: "08:00", to: "17:00" },
    "Thứ 5": { on: true,  from: "08:00", to: "17:00" },
    "Thứ 6": { on: true,  from: "08:00", to: "12:00" },
    "Thứ 7": { on: false, from: "08:00", to: "12:00" },
    "CN":    { on: false, from: "08:00", to: "12:00" },
  });
  const [maxApts, setMaxApts] = useState("12");
  const [slotDur, setSlotDur] = useState("30");
  const [breakFrom, setBreakFrom] = useState("12:00");
  const [breakTo,   setBreakTo]   = useState("13:30");

  function update(day: string, key: string, val: any) {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [key]: val } }));
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Ngày & Giờ làm việc</SectionTitle>
      <div className="flex flex-col gap-2">
        {DAYS.map((day) => {
          const s = schedule[day];
          return (
            <div key={day} className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${s.on ? "bg-white border-border" : "bg-slate-50 border-border opacity-60"}`}>
              <Toggle on={s.on} onToggle={() => update(day, "on", !s.on)} />
              <span className="w-14 text-[13px] font-semibold text-foreground">{day}</span>
              {s.on ? (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    <select value={s.from} onChange={(e) => update(day, "from", e.target.value)}
                      className="h-9 px-3 bg-slate-50 border border-border rounded-xl text-[12px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 appearance-none transition-all">
                      {TIMES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <span className="text-muted-foreground text-[12px] font-medium">→</span>
                    <select value={s.to} onChange={(e) => update(day, "to", e.target.value)}
                      className="h-9 px-3 bg-slate-50 border border-border rounded-xl text-[12px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 appearance-none transition-all">
                      {TIMES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium ml-auto">
                    {(() => {
                      const [fh, fm] = s.from.split(":").map(Number);
                      const [th, tm] = s.to.split(":").map(Number);
                      const mins = (th * 60 + tm) - (fh * 60 + fm);
                      return mins > 0 ? `${Math.floor(mins / 60)}h${mins % 60 ? `${mins % 60}m` : ""}` : "—";
                    })()}
                  </span>
                </>
              ) : (
                <span className="text-[12px] text-muted-foreground">Nghỉ</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="w-full h-px bg-border" />
      <SectionTitle>Cấu hình ca khám</SectionTitle>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Thời lượng mỗi ca">
          <div className="relative">
            <select value={slotDur} onChange={(e) => setSlotDur(e.target.value)}
              className="w-full h-10 px-3.5 pr-8 bg-white border border-border rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 appearance-none transition-all">
              {["15", "20", "30", "45", "60"].map((v) => <option key={v} value={v}>{v} phút</option>)}
            </select>
          </div>
        </Field>
        <Field label="Tối đa ca/ngày">
          <TextInput value={maxApts} onChange={setMaxApts} type="number" placeholder="12" />
        </Field>
        <Field label="Nghỉ giải lao">
          <div className="flex items-center gap-1.5">
            <select value={breakFrom} onChange={(e) => setBreakFrom(e.target.value)}
              className="flex-1 h-10 px-2 bg-white border border-border rounded-xl text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 appearance-none transition-all">
              {TIMES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <span className="text-muted-foreground text-[11px]">→</span>
            <select value={breakTo} onChange={(e) => setBreakTo(e.target.value)}
              className="flex-1 h-10 px-2 bg-white border border-border rounded-xl text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 appearance-none transition-all">
              {TIMES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </Field>
      </div>

      <div className="flex justify-end">
        <SaveBtn onClick={() => {}} />
      </div>
    </div>
  );
}

// ── Tab: Notifications ─────────────────────────────────────────────────────────
function NotificationsTab() {
  const [s, setS] = useState({
    aptEmail: true,  aptSms: false, aptPush: true,
    remEmail: true,  remSms: true,  remPush: true,
    sysEmail: false, sysSms: false, sysPush: true,
    reportEmail: true,
  });
  function tog(key: keyof typeof s) { setS((v) => ({ ...v, [key]: !v[key] })); }

  const channels = [
    { icon: Mail,       label: "Email" },
    { icon: Smartphone, label: "SMS" },
    { icon: Monitor,    label: "Trong app" },
  ];

  const groups = [
    {
      title: "Lịch hẹn",
      sub: "Thông báo về ca khám mới, hủy, thay đổi",
      keys: ["aptEmail", "aptSms", "aptPush"] as const,
    },
    {
      title: "Nhắc nhở ca khám",
      sub: "Nhắc trước 30 phút mỗi ca",
      keys: ["remEmail", "remSms", "remPush"] as const,
    },
    {
      title: "Thông báo hệ thống",
      sub: "Cập nhật phần mềm, bảo trì",
      keys: ["sysEmail", "sysSms", "sysPush"] as const,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Kênh nhận thông báo</SectionTitle>

      {/* Channel headers */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_80px] px-4 py-2 bg-slate-50 border-b border-border">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sự kiện</span>
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="flex flex-col items-center gap-1">
                <Icon size={13} className="text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground">{c.label}</span>
              </div>
            );
          })}
        </div>
        {groups.map((g) => (
          <div key={g.title} className="grid grid-cols-[1fr_80px_80px_80px] px-4 py-3.5 border-b border-border last:border-0 items-center">
            <div>
              <p className="text-[13px] font-semibold text-foreground">{g.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{g.sub}</p>
            </div>
            {g.keys.map((k) => (
              <div key={k} className="flex justify-center">
                <Toggle on={s[k]} onToggle={() => tog(k)} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <SectionTitle>Khác</SectionTitle>
      <div className="bg-white rounded-2xl border border-border px-4">
        <NotifRow
          label="Báo cáo tuần qua email"
          sub="Nhận tóm tắt thống kê mỗi thứ Hai"
          on={s.reportEmail}
          onToggle={() => tog("reportEmail")}
        />
      </div>

      <div className="flex justify-end">
        <SaveBtn onClick={() => {}} />
      </div>
    </div>
  );
}

// ── Tab: Security ──────────────────────────────────────────────────────────────
function SecurityTab() {
  const [cur,  setCur]  = useState("");
  const [next, setNext] = useState("");
  const [conf, setConf] = useState("");
  const [showCur,  setShowCur]  = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [twoFa, setTwoFa] = useState(false);

  const pwStrength = next.length === 0 ? 0 : next.length < 6 ? 1 : next.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Yếu", "Trung bình", "Mạnh"];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-emerald-500"];

  const sessions = [
    { device: "Chrome · macOS",   location: "Hà Nội",    time: "Hiện tại",     current: true },
    { device: "Safari · iPhone",  location: "Hà Nội",    time: "2 giờ trước",  current: false },
    { device: "Chrome · Windows", location: "TP.HCM",    time: "2 ngày trước", current: false },
  ];

  function PwField({ label, val, show, setVal, setShow }: {
    label: string; val: string; show: boolean;
    setVal: (v: string) => void; setShow: (v: boolean) => void;
  }) {
    return (
      <Field label={label}>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="••••••••"
            className="w-full h-10 px-3.5 pr-11 bg-white border border-border rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
          />
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </Field>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Đổi mật khẩu</SectionTitle>
      <div className="grid grid-cols-1 gap-4 max-w-md">
        <PwField label="Mật khẩu hiện tại" val={cur}  show={showCur}  setVal={setCur}  setShow={setShowCur} />
        <PwField label="Mật khẩu mới"      val={next} show={showNext} setVal={setNext} setShow={setShowNext} />
        {next.length > 0 && (
          <div className="flex items-center gap-2 -mt-2">
            <div className="flex-1 flex gap-1">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`h-1.5 flex-1 rounded-full transition-all ${n <= pwStrength ? strengthColor[pwStrength] : "bg-slate-200"}`} />
              ))}
            </div>
            <span className={`text-[11px] font-bold ${pwStrength === 1 ? "text-red-500" : pwStrength === 2 ? "text-amber-500" : "text-emerald-600"}`}>
              {strengthLabel[pwStrength]}
            </span>
          </div>
        )}
        <PwField label="Xác nhận mật khẩu mới" val={conf} show={showConf} setVal={setConf} setShow={setShowConf} />
        {conf.length > 0 && (
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold -mt-2 ${conf === next ? "text-emerald-600" : "text-red-500"}`}>
            <CheckCircle2 size={12} />
            {conf === next ? "Mật khẩu khớp" : "Chưa khớp"}
          </div>
        )}
      </div>
      <div className="flex">
        <SaveBtn onClick={() => { setCur(""); setNext(""); setConf(""); }} />
      </div>

      <div className="w-full h-px bg-border" />
      <SectionTitle>Xác thực 2 bước</SectionTitle>
      <div className="bg-white rounded-2xl border border-border px-4 py-3.5 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-foreground">Xác thực 2 yếu tố (2FA)</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Bảo vệ tài khoản với mã OTP qua email hoặc ứng dụng xác thực</p>
        </div>
        <div className="flex items-center gap-3">
          {twoFa && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Đã bật</span>}
          <Toggle on={twoFa} onToggle={() => setTwoFa((v) => !v)} />
        </div>
      </div>

      <div className="w-full h-px bg-border" />
      <div className="flex items-center justify-between">
        <SectionTitle>Phiên đăng nhập</SectionTitle>
        <button className="text-[12px] font-semibold text-red-500 hover:underline">Đăng xuất tất cả</button>
      </div>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {sessions.map((sess, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Globe size={16} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-foreground">{sess.device}</p>
                {sess.current && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Thiết bị này</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{sess.location} · {sess.time}</p>
            </div>
            {!sess.current && (
              <button className="text-[12px] font-semibold text-red-500 hover:underline flex-shrink-0">Đăng xuất</button>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export function DoctorSettingsPage({ onLogout }: { onLogout?: () => void }) {
  const [tab, setTab] = useState<Tab>("profile");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const TAB_CONTENT: Record<Tab, React.ReactNode> = {
    profile:       <ProfileTab />,
    schedule:      <ScheduleTab />,
    notifications: <NotificationsTab />,
    security:      <SecurityTab />,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Confirm logout modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setConfirmOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-[15px] font-bold text-foreground">Xác nhận đăng xuất</h3>
              <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">Bạn có chắc chắn muốn đăng xuất? Phiên làm việc hiện tại sẽ kết thúc.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 h-10 border border-border rounded-xl text-[13px] font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={() => { setConfirmOpen(false); onLogout?.(); }}
                className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[13px] font-bold transition-colors active:scale-[0.98]"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-border">
        <h2 className="text-sm font-bold text-foreground">Cài đặt</h2>
        <p className="text-[11px] text-muted-foreground">Quản lý hồ sơ, lịch làm việc và bảo mật tài khoản</p>
      </div>

      <div className="flex-1 overflow-hidden flex min-h-0">
        {/* Side tabs */}
        <nav className="w-48 flex-shrink-0 bg-white border-r border-border flex flex-col p-3">
          <div className="flex flex-col gap-0.5 flex-1">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
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
          <div className="pt-3 mt-3 border-t border-border">
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl">
            {TAB_CONTENT[tab]}
          </div>
        </div>
      </div>
    </div>
  );
}
