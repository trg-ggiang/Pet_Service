import { CheckCircle2, ChevronRight, Eye, EyeOff } from "lucide-react";
import type * as React from "react";

export function PawSVG({ className }: { className?: string }) {
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

export const AUTH_BG_PAWS = [
  { top: "6%", left: "6%", rotate: 15, scale: 1.5, op: 0.06 },
  { top: "20%", left: "75%", rotate: -20, scale: 1.2, op: 0.05 },
  { top: "50%", left: "4%", rotate: -35, scale: 0.9, op: 0.04 },
  { top: "70%", left: "62%", rotate: 25, scale: 1.8, op: 0.05 },
  { top: "80%", left: "18%", rotate: 10, scale: 1.4, op: 0.06 },
  { top: "35%", left: "40%", rotate: 40, scale: 1.6, op: 0.03 },
];

export function AuthLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0891B2, #06B6D4)" }}>
        <PawSVG className="w-7 h-7 text-white" />
      </div>
      <div>
        <span className={`${dark ? "text-white" : "text-foreground"} font-bold text-base tracking-tight`}>PetCare Center</span>
        {dark && <div className="text-[10px] text-slate-500 font-mono">v2.1.0</div>}
      </div>
    </div>
  );
}

export function AuthBrandPanel({
  children,
  footer = "© 2026 PetCare Center · Mọi quyền được bảo lưu",
}: {
  children: React.ReactNode;
  footer?: string;
}) {
  return (
    <div
      className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col relative overflow-hidden flex-shrink-0"
      style={{ background: "linear-gradient(145deg, #080F1F 0%, #0C2040 60%, #080F1F 100%)" }}
    >
      {AUTH_BG_PAWS.map((paw, index) => (
        <div
          key={index}
          className="absolute pointer-events-none text-cyan-400"
          style={{
            top: paw.top,
            left: paw.left,
            transform: `rotate(${paw.rotate}deg) scale(${paw.scale})`,
            opacity: paw.op,
          }}
        >
          <PawSVG className="w-14 h-14" />
        </div>
      ))}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{ width: 360, height: 360, background: "radial-gradient(circle, rgba(8,145,178,0.15) 0%, transparent 70%)" }}
      />
      <div className="relative z-10 flex flex-col h-full px-12 py-14">
        <AuthLogo dark />
        <div className="mt-auto mb-auto pt-20">{children}</div>
        <div className="mt-auto">
          <p className="text-[11px] text-slate-600">{footer}</p>
        </div>
      </div>
    </div>
  );
}

export function AuthPageShell({ brand, children }: { brand: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-white">
      {brand}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-slate-50/50">
        <div className="w-full max-w-[400px]">
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0891B2, #06B6D4)" }}>
              <PawSVG className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-foreground">PetCare Center</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthField({
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
  id?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  right?: React.ReactNode;
}) {
  return (
    <div>
      {label && <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">{label}</label>}
      <div className={label ? "relative mt-1.5" : "relative mt-1.5"}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full h-11 px-4 ${right ? "pr-12" : ""} rounded-xl border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
            error ? "border-red-300 bg-red-50/50 focus:ring-red-200" : "border-border bg-white focus:ring-cyan-500/20 focus:border-cyan-400"
          }`}
        />
        {right && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
      {error && <p className="mt-1 text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}

export function PasswordVisibilityButton({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
      {shown ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

export function AuthCheckbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all flex-shrink-0 ${
        checked ? "bg-cyan-500 border-cyan-500" : "border-slate-300 bg-white"
      }`}
    >
      {checked && <CheckCircle2 size={12} className="text-white" />}
    </button>
  );
}

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-600">{message}</div>;
}

export function PrimaryAuthButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
      style={{
        background: loading ? "#94A3B8" : "linear-gradient(135deg, #0891B2, #06B6D4)",
        boxShadow: loading ? "none" : "0 4px 14px rgba(8,145,178,0.3)",
      }}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          Đang xử lý…
        </>
      ) : (
        <>
          {label}
          <ChevronRight size={16} />
        </>
      )}
    </button>
  );
}
