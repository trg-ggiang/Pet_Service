import { useState } from "react";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Info,
  Heart,
  Stethoscope,
  Calendar,
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

const BENEFITS = [
  { icon: Calendar, text: "Đặt lịch hẹn trực tuyến 24/7" },
  { icon: Heart, text: "Theo dõi sức khoẻ thú cưng" },
  { icon: Stethoscope, text: "Nhắc lịch tiêm phòng tự động" },
];

function RegisterField({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  right,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  right?: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full h-11 px-4 ${right ? "pr-12" : ""} rounded-xl border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
            error
              ? "border-red-300 bg-red-50/50 focus:ring-red-200"
              : "border-border bg-white focus:ring-cyan-500/20 focus:border-cyan-400"
          }`}
        />
        {right && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {right}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-[11px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}

export function RegisterPage({
  onBack,
  onRegister,
}: {
  onBack: () => void;
  onRegister: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    address?: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [k]: e.target.value }));
      setErrors((prev) => ({ ...prev, [k]: "" }));
    };
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Vui lòng nhập họ tên.";
    if (!form.email.trim()) errs.email = "Vui lòng nhập email.";
    if (!form.phone.trim()) errs.phone = "Vui lòng nhập số điện thoại.";
    if (form.password.length < 6) errs.password = "Mật khẩu tối thiểu 6 ký tự.";
    if (form.password !== form.confirm)
      errs.confirm = "Mật khẩu xác nhận không khớp.";
    if (!agreed) errs.agreed = "Vui lòng đồng ý với điều khoản dịch vụ.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await onRegister({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error instanceof Error ? error.message : "Đăng ký thất bại.",
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col relative overflow-hidden flex-shrink-0"
        style={{
          background:
            "linear-gradient(145deg, #080F1F 0%, #0C2040 60%, #080F1F 100%)",
        }}
      >
        {/* glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: 320,
            height: 320,
            background:
              "radial-gradient(circle, rgba(8,145,178,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col h-full px-10 py-14">
          {/* logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #0891B2, #06B6D4)",
              }}
            >
              <PawSVG className="w-7 h-7 text-white" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">
              PetCare Center
            </span>
          </div>

          <div className="mt-auto mb-auto pt-16">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
              style={{
                background: "rgba(8,145,178,0.12)",
                border: "1px solid rgba(8,145,178,0.2)",
              }}
            >
              <PawSVG className="w-12 h-12 text-cyan-400" />
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
              Tạo tài khoản
              <br />
              <span style={{ color: "#0891B2" }}>miễn phí</span> ngay hôm nay
            </h2>
            <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-[270px]">
              Đăng ký để quản lý lịch hẹn và theo dõi sức khoẻ cho thú cưng của
              bạn.
            </p>

            <div className="mt-8 space-y-3">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(8,145,178,0.15)" }}
                  >
                    <Icon size={13} style={{ color: "#0891B2" }} />
                  </div>
                  <span className="text-sm text-slate-300">{text}</span>
                </div>
              ))}
            </div>

            {/* staff note */}
            <div
              className="mt-8 p-4 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-start gap-2.5">
                <Info
                  size={14}
                  className="text-slate-500 mt-0.5 flex-shrink-0"
                />
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Tài khoản{" "}
                  <span className="text-slate-400 font-semibold">
                    bác sĩ & nhân viên
                  </span>{" "}
                  được cấp trực tiếp bởi quản trị viên — không qua đăng ký này.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-700">© 2026 PetCare Center</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-slate-50/50">
        <div className="w-full max-w-[400px]">
          {/* back */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={15} />
            Quay lại đăng nhập
          </button>

          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Tạo tài khoản
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Đăng ký tài khoản khách hàng để đặt lịch và quản lý thú cưng.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <RegisterField
              label="Họ và tên"
              id="name"
              value={form.name}
              onChange={set("name")}
              placeholder="Nguyễn Văn A"
              error={errors.name}
            />

            <div className="grid grid-cols-2 gap-3">
              <RegisterField
                label="Email"
                id="email"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="email@example.com"
                error={errors.email}
              />
              <RegisterField
                label="Số điện thoại"
                id="phone"
                value={form.phone}
                onChange={set("phone")}
                placeholder="09xxxxxxxx"
                error={errors.phone}
              />
            </div>

            <RegisterField
              label="Mật khẩu"
              id="password"
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              placeholder="Tối thiểu 6 ký tự"
              error={errors.password}
              right={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            <RegisterField
              label="Xác nhận mật khẩu"
              id="confirm"
              type={showConfirm ? "text" : "password"}
              value={form.confirm}
              onChange={set("confirm")}
              placeholder="Nhập lại mật khẩu"
              error={errors.confirm}
              right={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            {/* terms */}
            <div>
              <div
                className="flex items-start gap-2.5 cursor-pointer"
                onClick={() => {
                  setAgreed((v) => !v);
                  setErrors((prev) => ({ ...prev, agreed: "" }));
                }}
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                    agreed
                      ? "bg-cyan-500 border-cyan-500"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {agreed && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <span className="text-sm text-muted-foreground leading-relaxed select-none">
                  Tôi đồng ý với{" "}
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="text-cyan-600 font-semibold hover:underline"
                  >
                    Điều khoản dịch vụ
                  </button>{" "}
                  và{" "}
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="text-cyan-600 font-semibold hover:underline"
                  >
                    Chính sách bảo mật
                  </button>
                </span>
              </div>
              {errors.agreed && (
                <p className="mt-1 text-[11px] text-red-500 font-medium ml-7">
                  {errors.agreed}
                </p>
              )}
              {errors.submit && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-600">
                  {errors.submit}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 mt-2"
              style={{
                background: loading
                  ? "#94A3B8"
                  : "linear-gradient(135deg, #0891B2, #06B6D4)",
                boxShadow: loading ? "none" : "0 4px 14px rgba(8,145,178,0.3)",
              }}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                    />
                  </svg>
                  Đang tạo tài khoản…
                </>
              ) : (
                <>
                  Tạo tài khoản <ChevronRight size={16} />
                </>
              )}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={onBack}
                className="font-semibold text-cyan-600 hover:underline"
              >
                Đăng nhập
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
