import { useEffect, useRef, useState } from "react";
import type * as React from "react";

import {
  ForgotPasswordView,
  type ForgotPasswordStep,
} from "../../../components/auth/ForgotPasswordView";
import { requestPasswordReset, resetPassword, verifyPasswordResetCode } from "../../../services/auth";

const EMPTY_OTP = ["", "", "", "", "", ""];
const STRENGTH_LABELS = ["", "Yếu", "Trung bình", "Mạnh"];
const STRENGTH_COLORS = ["", "bg-red-400", "bg-amber-400", "bg-emerald-500"];

export function ForgotPasswordPage({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(EMPTY_OTP);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const passwordStrengthLevel = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 10 ? 2 : 3;

  async function handleSendEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await requestPasswordReset(email);
      if (result.devCode) setOtp(result.devCode.split(""));
      setLoading(false);
      setCountdown(60);
      setStep("otp");
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Không thể gửi mã xác minh.");
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;

    setOtp((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
    setError("");

    if (value && index < EMPTY_OTP.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, event: React.KeyboardEvent) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    if (otp.join("").length < EMPTY_OTP.length) {
      setError("Vui lòng nhập đủ 6 chữ số.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await verifyPasswordResetCode(email, otp.join(""));
      setLoading(false);
      setStep("newpw");
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Mã xác minh không hợp lệ.");
    }
  }

  async function handleResend() {
    setOtp(EMPTY_OTP);
    setError("");
    try {
      const result = await requestPasswordReset(email);
      if (result.devCode) setOtp(result.devCode.split(""));
      setCountdown(60);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi lại mã.");
    }
  }

  async function handleSetPassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await resetPassword(email, otp.join(""), newPassword);
      setLoading(false);
      setStep("done");
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Không thể đổi mật khẩu.");
    }
  }

  function handleStepBack() {
    setStep((current) => (current === "newpw" ? "otp" : "email"));
    setError("");
  }

  return (
    <ForgotPasswordView
      step={step}
      email={email}
      otp={otp}
      newPassword={newPassword}
      confirmPassword={confirmPassword}
      showPassword={showPassword}
      showConfirmPassword={showConfirmPassword}
      loading={loading}
      error={error}
      countdown={countdown}
      otpRefs={otpRefs}
      passwordStrength={{
        level: passwordStrengthLevel,
        label: STRENGTH_LABELS[passwordStrengthLevel],
        color: STRENGTH_COLORS[passwordStrengthLevel],
      }}
      onBack={onBack}
      onStepBack={handleStepBack}
      onEmailChange={(value) => {
        setEmail(value);
        setError("");
      }}
      onOtpChange={handleOtpChange}
      onOtpKeyDown={handleOtpKeyDown}
      onNewPasswordChange={(value) => {
        setNewPassword(value);
        setError("");
      }}
      onConfirmPasswordChange={(value) => {
        setConfirmPassword(value);
        setError("");
      }}
      onShowPasswordToggle={() => setShowPassword((shown) => !shown)}
      onShowConfirmPasswordToggle={() => setShowConfirmPassword((shown) => !shown)}
      onSendEmail={handleSendEmail}
      onVerifyOtp={handleVerifyOtp}
      onResend={handleResend}
      onSetPassword={handleSetPassword}
    />
  );
}
