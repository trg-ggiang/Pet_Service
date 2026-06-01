import { ArrowLeft, Calendar, Heart, Info, Stethoscope } from "lucide-react";
import type * as React from "react";

import {
  AuthBrandPanel,
  AuthCheckbox,
  AuthError,
  AuthField,
  AuthPageShell,
  PasswordVisibilityButton,
  PawSVG,
  PrimaryAuthButton,
} from "./AuthShared";

const BENEFITS = [
  { icon: Calendar, text: "Đặt lịch hẹn trực tuyến 24/7" },
  { icon: Heart, text: "Theo dõi sức khỏe thú cưng" },
  { icon: Stethoscope, text: "Nhắc lịch tiêm phòng tự động" },
];

export interface RegisterFormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
}

export function RegisterView({
  form,
  errors,
  agreed,
  loading,
  showPassword,
  showConfirm,
  onBack,
  onSubmit,
  onFieldChange,
  onAgreedToggle,
  onShowPasswordToggle,
  onShowConfirmToggle,
}: {
  form: RegisterFormState;
  errors: Record<string, string>;
  agreed: boolean;
  loading: boolean;
  showPassword: boolean;
  showConfirm: boolean;
  onBack: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onFieldChange: (key: keyof RegisterFormState, value: string) => void;
  onAgreedToggle: () => void;
  onShowPasswordToggle: () => void;
  onShowConfirmToggle: () => void;
}) {
  return (
    <AuthPageShell
      brand={(
        <AuthBrandPanel footer="© 2026 PetCare Center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8" style={{ background: "rgba(8,145,178,0.12)", border: "1px solid rgba(8,145,178,0.2)" }}>
            <PawSVG className="w-12 h-12 text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
            Tạo tài khoản<br />
            <span style={{ color: "#0891B2" }}>miễn phí</span> ngay hôm nay
          </h2>
          <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-[270px]">
            Đăng ký để quản lý lịch hẹn và theo dõi sức khỏe cho thú cưng của bạn.
          </p>
          <div className="mt-8 space-y-3">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(8,145,178,0.15)" }}>
                  <Icon size={13} style={{ color: "#0891B2" }} />
                </div>
                <span className="text-sm text-slate-300">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-start gap-2.5">
              <Info size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Tài khoản <span className="text-slate-400 font-semibold">bác sĩ & nhân viên</span> được cấp trực tiếp bởi quản trị viên.
              </p>
            </div>
          </div>
        </AuthBrandPanel>
      )}
    >
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={15} />
        Quay lại đăng nhập
      </button>

      <h1 className="text-2xl font-bold text-foreground tracking-tight">Tạo tài khoản</h1>
      <p className="text-sm text-muted-foreground mt-1.5">Đăng ký tài khoản khách hàng để đặt lịch và quản lý thú cưng.</p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <AuthField label="Họ và tên" value={form.name} onChange={(value) => onFieldChange("name", value)} placeholder="Nguyễn Văn A" error={errors.name} />
        <div className="grid grid-cols-2 gap-3">
          <AuthField label="Email" type="email" value={form.email} onChange={(value) => onFieldChange("email", value)} placeholder="email@example.com" error={errors.email} />
          <AuthField label="Số điện thoại" value={form.phone} onChange={(value) => onFieldChange("phone", value)} placeholder="09xxxxxxxx" error={errors.phone} />
        </div>
        <AuthField
          label="Mật khẩu"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={(value) => onFieldChange("password", value)}
          placeholder="Tối thiểu 6 ký tự"
          error={errors.password}
          right={<PasswordVisibilityButton shown={showPassword} onToggle={onShowPasswordToggle} />}
        />
        <AuthField
          label="Xác nhận mật khẩu"
          type={showConfirm ? "text" : "password"}
          value={form.confirm}
          onChange={(value) => onFieldChange("confirm", value)}
          placeholder="Nhập lại mật khẩu"
          error={errors.confirm}
          right={<PasswordVisibilityButton shown={showConfirm} onToggle={onShowConfirmToggle} />}
        />
        <div>
          <div className="flex items-start gap-2.5 cursor-pointer" onClick={onAgreedToggle}>
            <AuthCheckbox checked={agreed} onToggle={onAgreedToggle} />
            <span className="text-sm text-muted-foreground leading-relaxed select-none">
              Tôi đồng ý với <span className="text-cyan-600 font-semibold">Điều khoản dịch vụ</span> và <span className="text-cyan-600 font-semibold">Chính sách bảo mật</span>
            </span>
          </div>
          {errors.agreed && <p className="mt-1 text-[11px] text-red-500 font-medium ml-7">{errors.agreed}</p>}
        </div>
        <AuthError message={errors.submit} />
        <PrimaryAuthButton loading={loading} label="Tạo tài khoản" />
        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <button type="button" onClick={onBack} className="font-semibold text-cyan-600 hover:underline">Đăng nhập</button>
        </p>
      </form>
    </AuthPageShell>
  );
}
