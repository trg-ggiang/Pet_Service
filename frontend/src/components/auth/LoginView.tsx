import { BarChart3, Calendar, CheckCircle2, FileText } from "lucide-react";
import type * as React from "react";

import {
  AuthBrandPanel,
  AuthCheckbox,
  AuthError,
  AuthField,
  AuthPageShell,
  PasswordVisibilityButton,
  PrimaryAuthButton,
} from "./AuthShared";

const FEATURES = [
  { icon: Calendar, text: "Quản lý lịch hẹn thông minh" },
  { icon: FileText, text: "Hồ sơ bệnh án điện tử" },
  { icon: BarChart3, text: "Báo cáo & phân tích doanh thu" },
  { icon: CheckCircle2, text: "Theo dõi sức khỏe thú cưng toàn diện" },
];

export function LoginView({
  email,
  password,
  remember,
  showPassword,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onRememberToggle,
  onShowPasswordToggle,
  onSubmit,
  onRegister,
  onForgotPassword,
}: {
  email: string;
  password: string;
  remember: boolean;
  showPassword: boolean;
  loading: boolean;
  error: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberToggle: () => void;
  onShowPasswordToggle: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onRegister: () => void;
  onForgotPassword?: () => void;
}) {
  return (
    <AuthPageShell
      brand={(
        <AuthBrandPanel>
          <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
            Chăm sóc toàn diện<br />
            <span style={{ color: "#0891B2" }}>cho thú cưng</span><br />
            của bạn.
          </h2>
          <p className="text-slate-400 mt-4 leading-relaxed text-sm max-w-[300px]">
            Nền tảng quản lý phòng khám thú y tích hợp - từ lịch hẹn, hồ sơ bệnh án đến báo cáo doanh thu.
          </p>
          <div className="mt-10 space-y-3.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(8,145,178,0.15)" }}>
                  <Icon size={14} style={{ color: "#0891B2" }} />
                </div>
                <span className="text-sm text-slate-300">{text}</span>
              </div>
            ))}
          </div>
        </AuthBrandPanel>
      )}
    >
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Đăng nhập</h1>
      <p className="text-sm text-muted-foreground mt-1.5">Chào mừng trở lại! Vui lòng nhập thông tin tài khoản.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <AuthField label="Email" type="email" value={email} onChange={onEmailChange} placeholder="admin@petcare.vn" />
        <div>
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Mật khẩu</label>
            <button type="button" onClick={onForgotPassword} className="text-xs font-medium text-cyan-600 hover:underline">Quên mật khẩu?</button>
          </div>
          <AuthField
            label=""
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={onPasswordChange}
            placeholder="••••••••"
            right={<PasswordVisibilityButton shown={showPassword} onToggle={onShowPasswordToggle} />}
          />
        </div>
        <div className="flex items-center gap-2.5">
          <AuthCheckbox checked={remember} onToggle={onRememberToggle} />
          <span className="text-sm text-muted-foreground">Nhớ đăng nhập</span>
        </div>
        <AuthError message={error} />
        <PrimaryAuthButton loading={loading} label="Đăng nhập" />
        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <button type="button" onClick={onRegister} className="font-semibold text-cyan-600 hover:underline">
            Đăng ký ngay
          </button>
        </p>
      </form>
    </AuthPageShell>
  );
}
