import { useState } from "react";
import {
  Building2, User, Bell, CreditCard, Shield,
  Camera, Check, Eye, EyeOff, ToggleLeft, ToggleRight,
  Clock, Phone, Mail, MapPin, Globe, Save,
} from "lucide-react";

type Tab = "clinic" | "account" | "notifications" | "payment" | "security";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "clinic",        label: "Phòng khám",  icon: Building2 },
  { id: "account",       label: "Tài khoản",   icon: User },
  { id: "notifications", label: "Thông báo",   icon: Bell },
  { id: "payment",       label: "Thanh toán",  icon: CreditCard },
  { id: "security",      label: "Bảo mật",     icon: Shield },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? "bg-cyan-500" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? "left-6" : "left-1"}`}
      />
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground pt-2 pb-1">{children}</h3>
  );
}

function Field({
  label, description, children,
}: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-6 py-4 border-b border-border/60 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</div>}
      </div>
      <div className="flex-shrink-0 flex items-center">{children}</div>
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, type = "text",
}: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-64 h-9 px-3 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
    />
  );
}

function SaveButton({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div className="flex justify-end pt-4">
      <button
        onClick={onSave}
        className={`flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white transition-all ${saved ? "bg-emerald-500" : "bg-primary hover:opacity-90"}`}
      >
        {saved ? <><Check size={15} /> Đã lưu</> : <><Save size={15} /> Lưu thay đổi</>}
      </button>
    </div>
  );
}

// ─── Tab: Clinic ──────────────────────────────────────────────────────────────

function ClinicTab() {
  const [form, setForm] = useState({
    name: "PetCare Center", address: "123 Lê Văn Lương, Quận 7, TP.HCM",
    phone: "028 3456 7890", email: "contact@petcare.vn",
    website: "petcare.vn", taxCode: "0312345678",
    openFrom: "07:30", openTo: "20:00",
    timezone: "Asia/Ho_Chi_Minh",
  });
  const [saved, setSaved] = useState(false);

  function set(k: keyof typeof form) {
    return (v: string) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-1">
      {/* Avatar */}
      <div className="flex items-center gap-5 py-6 border-b border-border">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold text-white">PC</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{form.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Logo phòng khám</p>
          <button className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-cyan-600 hover:underline">
            <Camera size={12} /> Thay đổi logo
          </button>
        </div>
      </div>

      <SectionTitle>Thông tin cơ bản</SectionTitle>
      <Field label="Tên phòng khám" description="Hiển thị trên tất cả tài liệu và hóa đơn">
        <TextInput value={form.name} onChange={set("name")} />
      </Field>
      <Field label="Mã số thuế">
        <TextInput value={form.taxCode} onChange={set("taxCode")} placeholder="0312345678" />
      </Field>
      <Field label="Địa chỉ">
        <TextInput value={form.address} onChange={set("address")} />
      </Field>

      <SectionTitle>Liên hệ</SectionTitle>
      <Field label="Số điện thoại">
        <TextInput value={form.phone} onChange={set("phone")} type="tel" />
      </Field>
      <Field label="Email liên hệ">
        <TextInput value={form.email} onChange={set("email")} type="email" />
      </Field>
      <Field label="Website">
        <TextInput value={form.website} onChange={set("website")} placeholder="example.com" />
      </Field>

      <SectionTitle>Giờ hoạt động</SectionTitle>
      <Field label="Giờ mở cửa" description="Áp dụng cho tất cả các ngày trong tuần">
        <div className="flex items-center gap-2">
          <input type="time" value={form.openFrom} onChange={(e) => set("openFrom")(e.target.value)}
            className="h-9 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400" />
          <span className="text-muted-foreground text-sm">–</span>
          <input type="time" value={form.openTo} onChange={(e) => set("openTo")(e.target.value)}
            className="h-9 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400" />
        </div>
      </Field>

      <SaveButton onSave={handleSave} saved={saved} />
    </div>
  );
}

// ─── Tab: Account ─────────────────────────────────────────────────────────────

function AccountTab() {
  const [form, setForm] = useState({ name: "Hoàng Minh Thiện", email: "admin@petcare.vn", phone: "090 1234 5678", role: "Chủ trung tâm" });
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [saved, setSaved] = useState(false);

  function set(k: keyof typeof form) { return (v: string) => setForm((f) => ({ ...f, [k]: v })); }

  return (
    <div className="space-y-1">
      {/* Avatar */}
      <div className="flex items-center gap-5 py-6 border-b border-border">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
          <span className="text-xl font-bold text-white">HT</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{form.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{form.role} · {form.email}</p>
          <button className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-cyan-600 hover:underline">
            <Camera size={12} /> Thay đổi ảnh
          </button>
        </div>
      </div>

      <SectionTitle>Thông tin cá nhân</SectionTitle>
      <Field label="Họ và tên">
        <TextInput value={form.name} onChange={set("name")} />
      </Field>
      <Field label="Email" description="Dùng để đăng nhập và nhận thông báo">
        <TextInput value={form.email} onChange={set("email")} type="email" />
      </Field>
      <Field label="Số điện thoại">
        <TextInput value={form.phone} onChange={set("phone")} type="tel" />
      </Field>
      <Field label="Chức vụ">
        <TextInput value={form.role} onChange={set("role")} />
      </Field>

      <SectionTitle>Đổi mật khẩu</SectionTitle>
      {[
        { label: "Mật khẩu hiện tại", key: "current" as const },
        { label: "Mật khẩu mới",      key: "next" as const },
        { label: "Xác nhận mật khẩu", key: "confirm" as const },
      ].map((f) => (
        <Field key={f.key} label={f.label}>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={pw[f.key]}
              onChange={(e) => setPw((p) => ({ ...p, [f.key]: e.target.value }))}
              placeholder="••••••••"
              className="w-64 h-9 px-3 pr-10 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
            />
            {f.key === "current" && (
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
          </div>
        </Field>
      ))}

      <SaveButton onSave={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }} saved={saved} />
    </div>
  );
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    emailNewAppt: true, emailCancelAppt: true, emailReminder: true,
    smsNewAppt: false, smsReminder: true, smsCancelAppt: false,
    pushNewAppt: true, pushReminder: true, pushBoardingAlert: true,
    weeklyReport: true, monthlyReport: true,
    lowInventory: true, vaccineExpiry: true,
  });
  const [saved, setSaved] = useState(false);

  function toggle(k: keyof typeof prefs) { setPrefs((p) => ({ ...p, [k]: !p[k] })); setSaved(false); }

  const emailRows = [
    { key: "emailNewAppt" as const,    label: "Lịch hẹn mới",           desc: "Khi khách hàng đặt lịch mới" },
    { key: "emailCancelAppt" as const, label: "Huỷ lịch hẹn",           desc: "Khi khách hàng huỷ lịch" },
    { key: "emailReminder" as const,   label: "Nhắc lịch hẹn",           desc: "Trước 24h và 1h trước lịch hẹn" },
    { key: "weeklyReport" as const,    label: "Báo cáo tuần",            desc: "Gửi mỗi thứ Hai hàng tuần" },
    { key: "monthlyReport" as const,   label: "Báo cáo tháng",           desc: "Gửi ngày đầu tiên mỗi tháng" },
  ];
  const smsRows = [
    { key: "smsNewAppt" as const,     label: "Lịch hẹn mới",   desc: "SMS xác nhận cho khách hàng" },
    { key: "smsReminder" as const,    label: "Nhắc lịch",       desc: "SMS nhắc trước 2h" },
    { key: "smsCancelAppt" as const,  label: "Huỷ lịch",        desc: "SMS khi lịch bị huỷ" },
  ];
  const pushRows = [
    { key: "pushNewAppt" as const,       label: "Lịch hẹn mới",      desc: "Thông báo tức thì" },
    { key: "pushReminder" as const,      label: "Nhắc lịch",          desc: "30 phút trước lịch hẹn" },
    { key: "pushBoardingAlert" as const, label: "Cảnh báo lưu trú",   desc: "Khi thú cưng cần chăm sóc đặc biệt" },
    { key: "lowInventory" as const,      label: "Tồn kho thấp",       desc: "Khi thuốc/vật tư sắp hết" },
    { key: "vaccineExpiry" as const,     label: "Vaccine sắp hết hạn", desc: "Nhắc tiêm nhắc lại cho bệnh nhân" },
  ];

  return (
    <div className="space-y-1">
      <SectionTitle>Email</SectionTitle>
      {emailRows.map((r) => (
        <Field key={r.key} label={r.label} description={r.desc}>
          <Toggle on={prefs[r.key]} onToggle={() => toggle(r.key)} />
        </Field>
      ))}

      <SectionTitle>SMS</SectionTitle>
      {smsRows.map((r) => (
        <Field key={r.key} label={r.label} description={r.desc}>
          <Toggle on={prefs[r.key]} onToggle={() => toggle(r.key)} />
        </Field>
      ))}

      <SectionTitle>Thông báo trong ứng dụng</SectionTitle>
      {pushRows.map((r) => (
        <Field key={r.key} label={r.label} description={r.desc}>
          <Toggle on={prefs[r.key]} onToggle={() => toggle(r.key)} />
        </Field>
      ))}

      <SaveButton onSave={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }} saved={saved} />
    </div>
  );
}

// ─── Tab: Payment ─────────────────────────────────────────────────────────────

function PaymentTab() {
  const [method, setMethod] = useState<"cash" | "bank" | "both">("both");
  const [bank] = useState({ name: "Vietcombank", account: "1234 5678 9012", owner: "HOANG MINH THIEN" });

  const PAYMENT_METHODS = [
    { id: "cash" as const, label: "Tiền mặt", desc: "Chấp nhận thanh toán tiền mặt tại quầy" },
    { id: "bank" as const, label: "Chuyển khoản", desc: "Chuyển khoản ngân hàng / QR Code" },
    { id: "both" as const, label: "Cả hai", desc: "Chấp nhận cả tiền mặt và chuyển khoản" },
  ];

  return (
    <div className="space-y-1">
      <SectionTitle>Phương thức thanh toán</SectionTitle>
      <div className="grid grid-cols-3 gap-3 py-4 border-b border-border">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${method === m.id ? "border-cyan-500 bg-cyan-50" : "border-border bg-white hover:border-slate-300"}`}
          >
            <div className={`text-sm font-bold ${method === m.id ? "text-cyan-700" : "text-foreground"}`}>{m.label}</div>
            <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.desc}</div>
            {method === m.id && (
              <div className="mt-2 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                <Check size={11} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      <SectionTitle>Tài khoản ngân hàng</SectionTitle>
      <Field label="Ngân hàng">
        <TextInput value={bank.name} onChange={() => {}} />
      </Field>
      <Field label="Số tài khoản">
        <TextInput value={bank.account} onChange={() => {}} />
      </Field>
      <Field label="Tên chủ tài khoản">
        <TextInput value={bank.owner} onChange={() => {}} />
      </Field>

      <SectionTitle>Hóa đơn & Thuế</SectionTitle>
      <Field label="Xuất hóa đơn tự động" description="Tự động xuất hóa đơn sau khi hoàn thành dịch vụ">
        <Toggle on={true} onToggle={() => {}} />
      </Field>
      <Field label="VAT" description="Áp dụng thuế VAT 10% vào hóa đơn">
        <Toggle on={false} onToggle={() => {}} />
      </Field>

      <SaveButton onSave={() => {}} saved={false} />
    </div>
  );
}

// ─── Tab: Security ────────────────────────────────────────────────────────────

function SecurityTab() {
  const sessions = [
    { device: "Chrome · macOS",     location: "TP.HCM, Việt Nam",     time: "Hiện tại",    current: true },
    { device: "Safari · iPhone 15", location: "TP.HCM, Việt Nam",     time: "2 giờ trước", current: false },
    { device: "Chrome · Windows",   location: "Hà Nội, Việt Nam",     time: "Hôm qua",     current: false },
  ];

  return (
    <div className="space-y-1">
      <SectionTitle>Xác thực hai bước</SectionTitle>
      <Field label="Xác thực 2 lớp (2FA)" description="Bảo vệ tài khoản bằng mã OTP khi đăng nhập">
        <Toggle on={true} onToggle={() => {}} />
      </Field>
      <Field label="Phương thức xác thực" description="Ứng dụng Authenticator (Google Authenticator, Authy...)">
        <button className="h-9 px-4 border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-colors">
          Cấu hình
        </button>
      </Field>

      <SectionTitle>Phiên đăng nhập</SectionTitle>
      <div className="py-2 space-y-2">
        {sessions.map((s, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:bg-muted/20 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{s.device}</span>
                {s.current && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">Hiện tại</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.location} · {s.time}</div>
            </div>
            {!s.current && (
              <button className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors flex-shrink-0">
                Đăng xuất
              </button>
            )}
          </div>
        ))}
      </div>

      <SectionTitle>Nhật ký hoạt động</SectionTitle>
      <Field label="Lịch sử đăng nhập" description="Xem 30 ngày hoạt động gần nhất">
        <button className="h-9 px-4 border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-colors">
          Xem nhật ký
        </button>
      </Field>
      <Field label="Xóa tất cả phiên khác" description="Đăng xuất khỏi tất cả thiết bị ngoại trừ thiết bị hiện tại">
        <button className="h-9 px-4 border border-red-200 text-red-500 rounded-xl text-xs font-semibold hover:bg-red-50 transition-colors">
          Đăng xuất tất cả
        </button>
      </Field>

    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SettingsPage({ onLogout }: { onLogout?: () => void }) {
  const [tab, setTab] = useState<Tab>("clinic");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const TAB_CONTENT: Record<Tab, React.ReactNode> = {
    clinic:        <ClinicTab />,
    account:       <AccountTab />,
    notifications: <NotificationsTab />,
    payment:       <PaymentTab />,
    security:      <SecurityTab />,
  };

  return (
    <div className="space-y-6">
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
              <h3 className="text-base font-bold text-foreground">Xác nhận đăng xuất</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống? Phiên làm việc hiện tại sẽ kết thúc.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 h-10 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={() => { setConfirmOpen(false); onLogout?.(); }}
                className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors active:scale-[0.98]"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Cài đặt</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Quản lý cấu hình phòng khám, tài khoản và hệ thống</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <aside className="w-52 flex-shrink-0 flex flex-col">
          <nav className="space-y-0.5 flex-1">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active ? "bg-cyan-50 text-cyan-700 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </nav>
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 bg-white border border-border rounded-2xl px-8 py-6">
          <h2 className="text-base font-bold text-foreground mb-1">
            {TABS.find((t) => t.id === tab)?.label}
          </h2>
          <p className="text-xs text-muted-foreground mb-5 pb-4 border-b border-border">
            {tab === "clinic"        && "Thông tin và cấu hình cơ bản của phòng khám"}
            {tab === "account"       && "Thông tin tài khoản cá nhân và mật khẩu"}
            {tab === "notifications" && "Quản lý các loại thông báo qua email, SMS và trong ứng dụng"}
            {tab === "payment"       && "Cấu hình phương thức thanh toán và thông tin ngân hàng"}
            {tab === "security"      && "Bảo mật tài khoản và quản lý phiên đăng nhập"}
          </p>
          {TAB_CONTENT[tab]}
        </div>
      </div>
    </div>
  );
}
