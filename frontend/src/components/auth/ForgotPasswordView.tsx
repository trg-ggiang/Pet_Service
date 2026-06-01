import { ArrowLeft, CheckCircle2, KeyRound, Mail, RefreshCw } from "lucide-react";
import type * as React from "react";

import {
  AuthBrandPanel,
  AuthError,
  AuthField,
  AuthPageShell,
  PasswordVisibilityButton,
  PrimaryAuthButton,
} from "./AuthShared";

export type ForgotPasswordStep = "email" | "otp" | "newpw" | "done";

export function ForgotPasswordView({
  step,
  email,
  otp,
  newPassword,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  loading,
  error,
  countdown,
  otpRefs,
  passwordStrength,
  onBack,
  onStepBack,
  onEmailChange,
  onOtpChange,
  onOtpKeyDown,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onShowPasswordToggle,
  onShowConfirmPasswordToggle,
  onSendEmail,
  onVerifyOtp,
  onResend,
  onSetPassword,
}: {
  step: ForgotPasswordStep;
  email: string;
  otp: string[];
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  loading: boolean;
  error: string;
  countdown: number;
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  passwordStrength: { level: number; label: string; color: string };
  onBack: () => void;
  onStepBack: () => void;
  onEmailChange: (value: string) => void;
  onOtpChange: (index: number, value: string) => void;
  onOtpKeyDown: (index: number, event: React.KeyboardEvent) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onShowConfirmPasswordToggle: () => void;
  onSendEmail: (event: React.FormEvent) => void;
  onVerifyOtp: (event: React.FormEvent) => void;
  onResend: () => void;
  onSetPassword: (event: React.FormEvent) => void;
}) {
  const steps: ForgotPasswordStep[] = ["email", "otp", "newpw", "done"];
  const currentStep = steps.indexOf(step);

  return (
    <AuthPageShell
      brand={(
        <AuthBrandPanel>
          <div className="flex items-center gap-3 mb-10">
            {steps.map((item, index) => {
              const itemStep = steps.indexOf(item);
              const done = itemStep < currentStep;
              const active = itemStep === currentStep;
              return (
                <div key={item} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? "bg-cyan-500 text-white" : active ? "bg-white text-slate-900" : "bg-white/10 text-slate-500"}`}>
                    {done ? <CheckCircle2 size={15} /> : index + 1}
                  </div>
                  {index < 3 && <div className={`w-8 h-0.5 rounded-full ${itemStep < currentStep ? "bg-cyan-500" : "bg-white/10"}`} />}
                </div>
              );
            })}
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
            {step === "email" && <>Quên mật<br /><span style={{ color: "#0891B2" }}>khẩu?</span></>}
            {step === "otp" && <>Nhập mã<br /><span style={{ color: "#0891B2" }}>xác thực</span></>}
            {step === "newpw" && <>Tạo mật<br /><span style={{ color: "#0891B2" }}>khẩu mới</span></>}
            {step === "done" && <>Đặt lại<br /><span style={{ color: "#0891B2" }}>thành công</span></>}
          </h2>
          <p className="text-slate-400 mt-4 leading-relaxed text-sm max-w-[300px]">
            {step === "email" && "Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác thực 6 chữ số về hộp thư của bạn."}
            {step === "otp" && `Mã OTP đã được gửi đến ${email}. Kiểm tra hộp thư và nhập mã trong vòng 10 phút.`}
            {step === "newpw" && "Tạo mật khẩu mới an toàn - ít nhất 8 ký tự, nên kết hợp chữ hoa, số và ký tự đặc biệt."}
            {step === "done" && "Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại với mật khẩu mới."}
          </p>
        </AuthBrandPanel>
      )}
    >
      {step !== "done" && (
        <button onClick={step === "email" ? onBack : onStepBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-7 transition-colors group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          {step === "email" ? "Quay lại đăng nhập" : "Quay lại"}
        </button>
      )}

      {step === "email" && (
        <>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, #0891B2, #06B6D4)" }}>
            <Mail size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Quên mật khẩu</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Nhập email tài khoản để nhận mã xác thực.</p>
          <form onSubmit={onSendEmail} className="mt-8 space-y-4">
            <AuthField label="Email" type="email" value={email} onChange={onEmailChange} placeholder="email@petcare.vn" />
            <AuthError message={error} />
            <PrimaryAuthButton loading={loading} label="Gửi mã xác thực" />
          </form>
        </>
      )}

      {step === "otp" && (
        <>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, #0891B2, #06B6D4)" }}>
            <KeyRound size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Nhập mã OTP</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Mã 6 chữ số đã gửi đến <span className="font-semibold text-foreground">{email}</span></p>
          <form onSubmit={onVerifyOtp} className="mt-8 space-y-6">
            <div className="flex items-center gap-2.5 justify-between">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { otpRefs.current[index] = element; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => onOtpChange(index, event.target.value)}
                  onKeyDown={(event) => onOtpKeyDown(index, event)}
                  className={`w-full aspect-square max-w-[56px] text-center rounded-xl border-2 text-xl font-bold text-foreground transition-all outline-none ${digit ? "border-cyan-400 bg-cyan-50/50" : "border-border bg-white"} focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20`}
                />
              ))}
            </div>
            <AuthError message={error} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Không nhận được mã?</span>
              {countdown > 0 ? (
                <span className="text-muted-foreground font-medium">Gửi lại sau {countdown}s</span>
              ) : (
                <button type="button" onClick={onResend} className="flex items-center gap-1 font-semibold text-cyan-600 hover:underline">
                  <RefreshCw size={13} /> Gửi lại
                </button>
              )}
            </div>
            <PrimaryAuthButton loading={loading} label="Xác nhận" />
          </form>
        </>
      )}

      {step === "newpw" && (
        <>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, #0891B2, #06B6D4)" }}>
            <KeyRound size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Mật khẩu mới</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Tạo mật khẩu mạnh cho tài khoản của bạn.</p>
          <form onSubmit={onSetPassword} className="mt-8 space-y-4">
            <AuthField label="Mật khẩu mới" type={showPassword ? "text" : "password"} value={newPassword} onChange={onNewPasswordChange} placeholder="••••••••" right={<PasswordVisibilityButton shown={showPassword} onToggle={onShowPasswordToggle} />} />
            {newPassword.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex gap-1">
                  {[1, 2, 3].map((item) => <div key={item} className={`h-1 flex-1 rounded-full transition-all ${item <= passwordStrength.level ? passwordStrength.color : "bg-slate-200"}`} />)}
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">{passwordStrength.label}</span>
              </div>
            )}
            <AuthField label="Xác nhận mật khẩu" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={onConfirmPasswordChange} placeholder="••••••••" right={<PasswordVisibilityButton shown={showConfirmPassword} onToggle={onShowConfirmPasswordToggle} />} />
            <AuthError message={error} />
            <PrimaryAuthButton loading={loading} label="Cập nhật mật khẩu" />
          </form>
        </>
      )}

      {step === "done" && (
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200" style={{ background: "linear-gradient(135deg, #10B981, #34D399)" }}>
            <CheckCircle2 size={38} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Đặt lại thành công!</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto leading-relaxed">Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại để tiếp tục.</p>
          <button onClick={onBack} className="mt-8 w-full h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:opacity-90" style={{ background: "linear-gradient(135deg, #0891B2, #06B6D4)", boxShadow: "0 4px 14px rgba(8,145,178,0.3)" }}>
            Đăng nhập ngay
          </button>
        </div>
      )}
    </AuthPageShell>
  );
}
