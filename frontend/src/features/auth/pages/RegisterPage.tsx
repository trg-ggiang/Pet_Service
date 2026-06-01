import { useState } from "react";
import type * as React from "react";

import { RegisterView, type RegisterFormState } from "../../../components/auth/RegisterView";

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
  const [form, setForm] = useState<RegisterFormState>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setField(key: keyof RegisterFormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "", submit: "" }));
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Vui lòng nhập họ tên.";
    if (!form.email.trim()) nextErrors.email = "Vui lòng nhập email.";
    if (!form.phone.trim()) nextErrors.phone = "Vui lòng nhập số điện thoại.";
    if (form.password.length < 6) nextErrors.password = "Mật khẩu tối thiểu 6 ký tự.";
    if (form.password !== form.confirm) nextErrors.confirm = "Mật khẩu xác nhận không khớp.";
    if (!agreed) nextErrors.agreed = "Vui lòng đồng ý với điều khoản dịch vụ.";
    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
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
    } catch (err) {
      setErrors((current) => ({
        ...current,
        submit: err instanceof Error ? err.message : "Đăng ký thất bại.",
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <RegisterView
      form={form}
      errors={errors}
      agreed={agreed}
      loading={loading}
      showPassword={showPassword}
      showConfirm={showConfirm}
      onBack={onBack}
      onSubmit={handleSubmit}
      onFieldChange={setField}
      onAgreedToggle={() => {
        setAgreed((value) => !value);
        setErrors((current) => ({ ...current, agreed: "" }));
      }}
      onShowPasswordToggle={() => setShowPassword((value) => !value)}
      onShowConfirmToggle={() => setShowConfirm((value) => !value)}
    />
  );
}
