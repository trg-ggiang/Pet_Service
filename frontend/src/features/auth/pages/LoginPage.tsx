import { useState } from "react";
import type * as React from "react";

import { LoginView } from "../../../components/auth/LoginView";

export function LoginPage({
  onLogin,
  onRegister,
  onForgotPassword,
}: {
  onLogin: (input: { email: string; password: string; remember: boolean }) => Promise<void>;
  onRegister: () => void;
  onForgotPassword?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await onLogin({ email, password, remember });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoginView
      email={email}
      password={password}
      remember={remember}
      showPassword={showPassword}
      loading={loading}
      error={error}
      onEmailChange={(value) => { setEmail(value); setError(""); }}
      onPasswordChange={(value) => { setPassword(value); setError(""); }}
      onRememberToggle={() => setRemember((value) => !value)}
      onShowPasswordToggle={() => setShowPassword((value) => !value)}
      onSubmit={handleSubmit}
      onRegister={onRegister}
      onForgotPassword={onForgotPassword}
    />
  );
}
