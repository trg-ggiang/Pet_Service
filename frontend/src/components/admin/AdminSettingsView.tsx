import { Bell, Building2, Check, CreditCard, Eye, EyeOff, Mail, Save, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import type { AdminEmailTemplates, AdminSettings } from "../../features/admin/services/admin";

type Tab = "clinic" | "account" | "notifications" | "emailTemplates" | "payment" | "security";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "clinic", label: "Phòng khám", icon: Building2 },
  { id: "account", label: "Tài khoản", icon: User },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "emailTemplates", label: "Mẫu email", icon: Mail },
  { id: "payment", label: "Thanh toán", icon: CreditCard },
  { id: "security", label: "Bảo mật", icon: Shield },
];

const DESCRIPTIONS: Record<Tab, string> = {
  clinic: "Thông tin và cấu hình cơ bản của phòng khám",
  account: "Thông tin tài khoản cá nhân và mật khẩu",
  notifications: "Quản lý các loại thông báo qua email, SMS và trong ứng dụng",
  emailTemplates: "Tùy chỉnh tiêu đề và nội dung email tự động",
  payment: "Cấu hình phương thức thanh toán và thông tin ngân hàng",
  security: "Bảo mật tài khoản và quản lý phiên đăng nhập",
};

const NOTIFICATION_LABELS: Record<string, { label: string; desc: string; group: string }> = {
  emailNewAppt: { label: "Xác nhận đặt lịch", desc: "Email khi khách hàng đặt lịch", group: "Email" },
  emailCancelAppt: { label: "Hủy lịch hẹn", desc: "Email khi lịch bị hủy", group: "Email" },
  emailReminder: { label: "Nhắc lịch hẹn", desc: "Email nhắc trước lịch hẹn", group: "Email" },
  emailExamResult: { label: "Kết quả khám", desc: "Email khi kết quả khám được hoàn tất", group: "Email" },
  emailPaymentConfirmation: { label: "Xác nhận thanh toán", desc: "Email sau khi thanh toán thành công", group: "Email" },
  emailFollowUpReminder: { label: "Nhắc tái khám", desc: "Email trước ngày tái khám", group: "Email" },
  emailBoardingUpdate: { label: "Cập nhật lưu trú", desc: "Email khi nhân viên cập nhật chăm sóc lưu trú", group: "Email" },
  smsNewAppt: { label: "Lịch hẹn mới", desc: "SMS xác nhận cho khách hàng", group: "SMS" },
  smsReminder: { label: "Nhắc lịch", desc: "SMS nhắc trước lịch hẹn", group: "SMS" },
  smsCancelAppt: { label: "Hủy lịch", desc: "SMS khi lịch bị hủy", group: "SMS" },
  pushNewAppt: { label: "Lịch hẹn mới", desc: "Thông báo tức thì", group: "Trong ứng dụng" },
  pushReminder: { label: "Nhắc lịch", desc: "Thông báo trước lịch hẹn", group: "Trong ứng dụng" },
  pushBoardingAlert: { label: "Cảnh báo lưu trú", desc: "Khi thú cưng cần theo dõi", group: "Trong ứng dụng" },
  weeklyReport: { label: "Báo cáo tuần", desc: "Gửi báo cáo định kỳ", group: "Báo cáo" },
  monthlyReport: { label: "Báo cáo tháng", desc: "Gửi báo cáo định kỳ", group: "Báo cáo" },
  lowInventory: { label: "Tồn kho thấp", desc: "Khi vật tư sắp hết", group: "Cảnh báo" },
};

const EMAIL_TEMPLATE_LABELS: Record<string, string> = {
  password_reset: "Đặt lại mật khẩu",
  appointment_confirmation: "Xác nhận đặt lịch",
  appointment_reminder: "Nhắc lịch hẹn",
  exam_result: "Kết quả khám",
  payment_confirmation: "Xác nhận thanh toán",
  follow_up_reminder: "Nhắc tái khám",
  boarding_update: "Cập nhật lưu trú",
  custom: "Template tùy chỉnh",
};

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-6 border-b border-border/60 py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {description && <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Input({ value, onChange, type = "text" }: { value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-64 rounded-xl border border-border bg-white px-3 text-sm text-foreground transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
    />
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-cyan-500" : "bg-slate-200"}`}>
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

function SaveButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  return (
    <div className="flex justify-end pt-4">
      <button onClick={onClick} className={`flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition-all ${saved ? "bg-emerald-500" : "bg-primary hover:opacity-90"}`}>
        {saved ? <><Check size={15} /> Đã lưu</> : <><Save size={15} /> Lưu thay đổi</>}
      </button>
    </div>
  );
}

export function AdminSettingsView({
  settings,
  emailTemplates,
  loading,
  error,
  onSave,
  onSaveEmailTemplates,
  onSendTestEmail,
}: {
  settings: AdminSettings | null;
  emailTemplates: AdminEmailTemplates | null;
  loading: boolean;
  error: string;
  onSave: (settings: AdminSettings) => Promise<void>;
  onSaveEmailTemplates: (templates: AdminEmailTemplates) => Promise<void>;
  onSendTestEmail: (input: { to: string; subject: string; heading: string; message: string }) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("clinic");
  const [draft, setDraft] = useState<AdminSettings | null>(settings);
  const [templateDraft, setTemplateDraft] = useState<AdminEmailTemplates | null>(emailTemplates);
  const [saved, setSaved] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    setTemplateDraft(emailTemplates);
  }, [emailTemplates]);

  async function saveLocal() {
    if (!draft) return;
    await onSave(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  function setClinic(key: keyof AdminSettings["clinic"], value: string) {
    setDraft((current) => current && { ...current, clinic: { ...current.clinic, [key]: value } });
    setSaved(false);
  }

  function setAccount(key: keyof AdminSettings["account"], value: string) {
    setDraft((current) => current && { ...current, account: { ...current.account, [key]: value } });
    setSaved(false);
  }

  function setPayment(key: keyof AdminSettings["payment"], value: string | boolean) {
    setDraft((current) => current && { ...current, payment: { ...current.payment, [key]: value } });
    setSaved(false);
  }

  function toggleNotification(key: string) {
    setDraft((current) => current && {
      ...current,
      notifications: { ...current.notifications, [key]: !current.notifications[key] },
    });
    setSaved(false);
  }

  function toggleSecurity() {
    setDraft((current) => current && {
      ...current,
      security: { ...current.security, twoFactorEnabled: !current.security.twoFactorEnabled },
    });
    setSaved(false);
  }

  function setTemplateField(key: string, field: "subject" | "heading" | "message", value: string) {
    setTemplateDraft((current) => current && ({
      ...current,
      [key]: { ...current[key], [field]: value },
    }));
    setTemplateSaved(false);
  }

  async function saveTemplates() {
    if (!templateDraft) return;
    await onSaveEmailTemplates(templateDraft);
    setTemplateSaved(true);
    window.setTimeout(() => setTemplateSaved(false), 2000);
  }

  async function sendTest() {
    const template = templateDraft?.custom;
    if (!template || !testEmail.trim()) return;
    setTestStatus("Đang gửi...");
    try {
      await onSendTestEmail({ to: testEmail, ...template });
      setTestStatus("Đã gửi email thử.");
    } catch (sendError) {
      setTestStatus(sendError instanceof Error ? sendError.message : "Không thể gửi email thử.");
    }
  }

  const content = () => {
    if (!draft) return null;

    if (tab === "clinic") {
      return (
        <div>
          <Field label="Tên phòng khám"><Input value={draft.clinic.name} onChange={(value) => setClinic("name", value)} /></Field>
          <Field label="Mã số thuế"><Input value={draft.clinic.taxCode} onChange={(value) => setClinic("taxCode", value)} /></Field>
          <Field label="Địa chỉ"><Input value={draft.clinic.address} onChange={(value) => setClinic("address", value)} /></Field>
          <Field label="Số điện thoại"><Input value={draft.clinic.phone} onChange={(value) => setClinic("phone", value)} type="tel" /></Field>
          <Field label="Email liên hệ"><Input value={draft.clinic.email} onChange={(value) => setClinic("email", value)} type="email" /></Field>
          <Field label="Website"><Input value={draft.clinic.website} onChange={(value) => setClinic("website", value)} /></Field>
          <Field label="Giờ mở cửa">
            <div className="flex items-center gap-2">
              <Input value={draft.clinic.openFrom} onChange={(value) => setClinic("openFrom", value)} type="time" />
              <span className="text-sm text-muted-foreground">đến</span>
              <Input value={draft.clinic.openTo} onChange={(value) => setClinic("openTo", value)} type="time" />
            </div>
          </Field>
          <SaveButton saved={saved} onClick={saveLocal} />
        </div>
      );
    }

    if (tab === "account") {
      return (
        <div>
          <div className="flex items-center gap-5 border-b border-border py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-xl font-bold text-white">
              {draft.account.initials || "AD"}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{draft.account.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{draft.account.role} · {draft.account.email}</p>
            </div>
          </div>
          <Field label="Họ và tên"><Input value={draft.account.name} onChange={(value) => setAccount("name", value)} /></Field>
          <Field label="Email"><Input value={draft.account.email} onChange={(value) => setAccount("email", value)} type="email" /></Field>
          <Field label="Số điện thoại"><Input value={draft.account.phone} onChange={(value) => setAccount("phone", value)} type="tel" /></Field>
          <Field label="Chức vụ"><Input value={draft.account.role} onChange={(value) => setAccount("role", value)} /></Field>
          <Field label="Mật khẩu hiện tại">
            <div className="relative">
              <input type={showPassword ? "text" : "password"} className="h-9 w-64 rounded-xl border border-border bg-white px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          <SaveButton saved={saved} onClick={saveLocal} />
        </div>
      );
    }

    if (tab === "notifications") {
      const groups = Object.entries(draft.notifications).reduce<Record<string, string[]>>((acc, [key]) => {
        const group = NOTIFICATION_LABELS[key]?.group || "Khác";
        acc[group] = [...(acc[group] || []), key];
        return acc;
      }, {});

      return (
        <div>
          {Object.entries(groups).map(([group, keys]) => (
            <div key={group} className="mb-2">
              <h3 className="pt-3 pb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{group}</h3>
              {keys.map((key) => (
                <Field key={key} label={NOTIFICATION_LABELS[key]?.label || key} description={NOTIFICATION_LABELS[key]?.desc}>
                  <Toggle on={Boolean(draft.notifications[key])} onToggle={() => toggleNotification(key)} />
                </Field>
              ))}
            </div>
          ))}
          <SaveButton saved={saved} onClick={saveLocal} />
        </div>
      );
    }

    if (tab === "emailTemplates") {
      if (!templateDraft) return <div className="py-8 text-center text-sm text-muted-foreground">Đang tải mẫu email...</div>;
      return (
        <div className="space-y-5">
          <p className="rounded-xl bg-cyan-50 px-4 py-3 text-xs leading-relaxed text-cyan-800">
            Có thể dùng biến như {"{{petName}}"}, {"{{appointmentDate}}"}, {"{{appointmentTime}}"}, {"{{amount}}"} trong nội dung.
          </p>
          {Object.entries(templateDraft).map(([key, template]) => (
            <div key={key} className="rounded-xl border border-border p-4">
              <h3 className="mb-3 text-sm font-bold text-foreground">{EMAIL_TEMPLATE_LABELS[key] || key}</h3>
              <div className="space-y-3">
                <input value={template.subject} onChange={(event) => setTemplateField(key, "subject", event.target.value)} placeholder="Tiêu đề email" className="h-9 w-full rounded-xl border border-border px-3 text-sm" />
                <input value={template.heading} onChange={(event) => setTemplateField(key, "heading", event.target.value)} placeholder="Tiêu đề nội dung" className="h-9 w-full rounded-xl border border-border px-3 text-sm" />
                <textarea value={template.message} onChange={(event) => setTemplateField(key, "message", event.target.value)} placeholder="Nội dung email" rows={3} className="w-full rounded-xl border border-border px-3 py-2 text-sm" />
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-border p-4">
            <h3 className="mb-3 text-sm font-bold text-foreground">Gửi thử template tùy chỉnh</h3>
            <div className="flex gap-2">
              <input type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="email@example.com" className="h-9 flex-1 rounded-xl border border-border px-3 text-sm" />
              <button onClick={sendTest} className="h-9 rounded-xl border border-cyan-200 bg-cyan-50 px-4 text-sm font-bold text-cyan-700">Gửi thử</button>
            </div>
            {testStatus && <p className="mt-2 text-xs text-muted-foreground">{testStatus}</p>}
          </div>
          <SaveButton saved={templateSaved} onClick={saveTemplates} />
        </div>
      );
    }

    if (tab === "payment") {
      return (
        <div>
          <Field label="Phương thức thanh toán">
            <select value={draft.payment.method} onChange={(event) => setPayment("method", event.target.value)} className="h-9 w-64 rounded-xl border border-border bg-white px-3 text-sm">
              <option value="cash">Tiền mặt</option>
              <option value="bank">Chuyển khoản</option>
              <option value="both">Cả hai</option>
            </select>
          </Field>
          <Field label="Ngân hàng"><Input value={draft.payment.bankName} onChange={(value) => setPayment("bankName", value)} /></Field>
          <Field label="Số tài khoản"><Input value={draft.payment.bankAccount} onChange={(value) => setPayment("bankAccount", value)} /></Field>
          <Field label="Tên chủ tài khoản"><Input value={draft.payment.bankOwner} onChange={(value) => setPayment("bankOwner", value)} /></Field>
          <Field label="Xuất hóa đơn tự động"><Toggle on={draft.payment.autoInvoice} onToggle={() => setPayment("autoInvoice", !draft.payment.autoInvoice)} /></Field>
          <Field label="VAT"><Toggle on={draft.payment.vatEnabled} onToggle={() => setPayment("vatEnabled", !draft.payment.vatEnabled)} /></Field>
          <SaveButton saved={saved} onClick={saveLocal} />
        </div>
      );
    }

    return (
      <div>
        <Field label="Xác thực 2 lớp" description="Bảo vệ tài khoản bằng bước xác thực bổ sung">
          <Toggle on={draft.security.twoFactorEnabled} onToggle={toggleSecurity} />
        </Field>
        <h3 className="pt-3 pb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Phiên đăng nhập</h3>
        <div className="space-y-2 py-2">
          {draft.security.sessions.map((session) => (
            <div key={`${session.device}-${session.time}`} className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{session.device}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{session.location} · {session.time}</div>
                </div>
                {session.current && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Hiện tại</span>}
              </div>
            </div>
          ))}
        </div>
        <SaveButton saved={saved} onClick={saveLocal} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Cài đặt</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Dữ liệu cấu hình được lấy từ backend</p>
      </div>

      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{error}</div>}
      {!draft && loading && <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">Đang tải cài đặt...</div>}

      {draft && (
        <div className="flex gap-6">
          <aside className="flex w-52 flex-shrink-0 flex-col">
            <nav className="flex-1 space-y-0.5">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)} className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${tab === id ? "bg-cyan-50 text-cyan-700 shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1 rounded-2xl border border-border bg-white px-8 py-6">
            <h2 className="mb-1 text-base font-bold text-foreground">{TABS.find((item) => item.id === tab)?.label}</h2>
            <p className="mb-5 border-b border-border pb-4 text-xs text-muted-foreground">{DESCRIPTIONS[tab]}</p>
            {content()}
          </div>
        </div>
      )}
    </div>
  );
}
