import { useState } from "react";
import {
  Eye, EyeOff, Shield, Stethoscope, UserCog, User,
  ChevronRight, CheckCircle2, Calendar, BarChart3, FileText,
} from "lucide-react";
import type { UserRole } from "@/types/auth";

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

const BG_PAWS = [
  { top: "6%",  left: "6%",  rotate: 15,  scale: 1.5, op: 0.06 },
  { top: "20%", left: "75%", rotate: -20, scale: 1.2, op: 0.05 },
  { top: "50%", left: "4%",  rotate: -35, scale: 0.9, op: 0.04 },
  { top: "70%", left: "62%", rotate: 25,  scale: 1.8, op: 0.05 },
  { top: "80%", left: "18%", rotate: 10,  scale: 1.4, op: 0.06 },
  { top: "35%", left: "40%", rotate: 40,  scale: 1.6, op: 0.03 },
];

const FEATURES = [
  { icon: Calendar,   text: "Quản lý lịch hẹn thông minh" },
  { icon: FileText,   text: "Hồ sơ bệnh án điện tử" },
  { icon: BarChart3,  text: "Báo cáo & phân tích doanh thu" },
  { icon: CheckCircle2, text: "Theo dõi sức khoẻ thú cưng toàn diện" },
];

const DEV_ROLES: { id: UserRole; label: string; desc: string; icon: React.ElementType; color: string; bg: string }[] = [
  { id: "admin",    label: "Quản trị viên", desc: "Toàn quyền hệ thống",  icon: Shield,      color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  { id: "doctor",   label: "Bác sĩ thú y",  desc: "Cổng khám bệnh",      icon: Stethoscope, color: "text-cyan-600",   bg: "bg-cyan-50 border-cyan-200" },
  { id: "staff",    label: "Nhân viên",      desc: "Cổng tác nghiệp",     icon: UserCog,     color: "text-emerald-600",bg: "bg-emerald-50 border-emerald-200" },
  { id: "customer", label: "Khách hàng",     desc: "Cổng khách hàng",     icon: User,        color: "text-amber-600",  bg: "bg-amber-50 border-amber-200" },
];

export function LoginPage({
  onLogin,
  onRegister,
  onForgotPassword,
}: {
  onLogin: (role: UserRole) => void;
  onRegister: () => void;
  onForgotPassword?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [devRole, setDevRole] = useState<UserRole>("customer");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErr("Vui lòng nhập email và mật khẩu.");
      return;
    }
    setErr("");
    const selectedRole = devRole;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(selectedRole);
    }, 1100);
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col relative overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(145deg, #080F1F 0%, #0C2040 60%, #080F1F 100%)" }}
      >
        {/* bg paws */}
        {BG_PAWS.map((p, i) => (
          <div
            key={i}
            className="absolute pointer-events-none text-cyan-400"
            style={{
              top: p.top, left: p.left,
              transform: `rotate(${p.rotate}deg) scale(${p.scale})`,
              opacity: p.op,
            }}
          >
            <PawSVG className="w-14 h-14" />
          </div>
        ))}

        {/* glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ width: 360, height: 360, background: "radial-gradient(circle, rgba(8,145,178,0.15) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex flex-col h-full px-12 py-14">
          {/* logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0891B2, #06B6D4)" }}
            >
              <PawSVG className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-base tracking-tight">PetCare Center</span>
              <div className="text-[10px] text-slate-500 font-mono">v2.1.0</div>
            </div>
          </div>

          {/* headline */}
          <div className="mt-auto mb-auto pt-20">
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Chăm sóc toàn diện<br />
              <span style={{ color: "#0891B2" }}>cho thú cưng</span><br />
              của bạn.
            </h2>
            <p className="text-slate-400 mt-4 leading-relaxed text-sm max-w-[300px]">
              Nền tảng quản lý phòng khám thú y tích hợp — từ lịch hẹn, hồ sơ bệnh án đến báo cáo doanh thu.
            </p>

            <div className="mt-10 space-y-3.5">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(8,145,178,0.15)" }}
                  >
                    <Icon size={14} style={{ color: "#0891B2" }} />
                  </div>
                  <span className="text-sm text-slate-300">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* footer */}
          <div className="mt-auto">
            <p className="text-[11px] text-slate-600">© 2026 PetCare Center · Mọi quyền được bảo lưu</p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-slate-50/50">
        <div className="w-full max-w-[400px]">
          {/* mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0891B2, #06B6D4)" }}
            >
              <PawSVG className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-foreground">PetCare Center</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground tracking-tight">Đăng nhập</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Chào mừng trở lại! Vui lòng nhập thông tin tài khoản.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* email */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErr(""); }}
                placeholder="admin@petcare.vn"
                className="mt-1.5 w-full h-11 px-4 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
              />
            </div>

            {/* password */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Mật khẩu</label>
                <button type="button" onClick={onForgotPassword} className="text-xs font-medium text-cyan-600 hover:underline">Quên mật khẩu?</button>
              </div>
              <div className="relative mt-1.5">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErr(""); }}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 pr-12 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* remember */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setRemember(v => !v)}
                className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                  remember ? "bg-cyan-500 border-cyan-500" : "border-slate-300 bg-white"
                }`}
              >
                {remember && <CheckCircle2 size={12} className="text-white" />}
              </button>
              <span className="text-sm text-muted-foreground">Nhớ đăng nhập</span>
            </div>

            {/* error */}
            {err && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-600">
                {err}
              </div>
            )}

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
              style={{ background: loading ? "#94A3B8" : "linear-gradient(135deg, #0891B2, #06B6D4)", boxShadow: loading ? "none" : "0 4px 14px rgba(8,145,178,0.3)" }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                  </svg>
                  Đang xác thực…
                </>
              ) : (
                <>
                  Đăng nhập
                  <ChevronRight size={16} />
                </>
              )}
            </button>

            {/* register link */}
            <p className="text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <button type="button" onClick={onRegister} className="font-semibold text-cyan-600 hover:underline">
                Đăng ký ngay
              </button>
            </p>
          </form>

          {/* ── Dev mode role selector ── */}
          <div className="mt-8 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full uppercase tracking-wider">
                🧪 Test Mode
              </span>
              <span className="text-xs text-amber-700 font-medium">Chọn role để xem giao diện tương ứng</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEV_ROLES.map(r => {
                const Icon = r.icon;
                const active = devRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={loading}
                    onClick={() => setDevRole(r.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${
                      active ? `${r.bg} border-current shadow-sm` : "bg-white border-slate-200 hover:border-slate-300"
                    } ${loading ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <Icon size={15} className={active ? r.color : "text-slate-400"} />
                    <div>
                      <div className={`text-[11px] font-bold ${active ? r.color : "text-slate-600"}`}>{r.label}</div>
                      <div className="text-[9px] text-muted-foreground">{r.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
