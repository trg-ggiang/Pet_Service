import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Mail, KeyRound, Eye, EyeOff, CheckCircle2, RefreshCw, ChevronRight } from "lucide-react";

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
  { top: "8%",  left: "8%",  rotate: 20,  scale: 1.4, op: 0.06 },
  { top: "25%", left: "70%", rotate: -15, scale: 1.2, op: 0.05 },
  { top: "55%", left: "5%",  rotate: -30, scale: 0.9, op: 0.04 },
  { top: "72%", left: "60%", rotate: 30,  scale: 1.7, op: 0.05 },
  { top: "82%", left: "20%", rotate: 12,  scale: 1.3, op: 0.06 },
  { top: "38%", left: "38%", rotate: 45,  scale: 1.5, op: 0.03 },
];

type Step = "email" | "otp" | "newpw" | "done";

export function ForgotPasswordPage({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErr("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    setErr("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCountdown(60);
      setStep("otp");
    }, 1200);
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setErr("");
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.join("").length < 6) {
      setErr("Vui lòng nhập đủ 6 chữ số.");
      return;
    }
    setErr("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("newpw");
    }, 1000);
  }

  function handleResend() {
    setOtp(["", "", "", "", "", ""]);
    setCountdown(60);
    otpRefs.current[0]?.focus();
  }

  function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) {
      setErr("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (newPw !== confirmPw) {
      setErr("Mật khẩu xác nhận không khớp.");
      return;
    }
    setErr("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("done");
    }, 1200);
  }

  const pwStrength = newPw.length === 0 ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Yếu", "Trung bình", "Mạnh"];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-emerald-500"];

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col relative overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(145deg, #080F1F 0%, #0C2040 60%, #080F1F 100%)" }}
      >
        {BG_PAWS.map((p, i) => (
          <div
            key={i}
            className="absolute pointer-events-none text-cyan-400"
            style={{ top: p.top, left: p.left, transform: `rotate(${p.rotate}deg) scale(${p.scale})`, opacity: p.op }}
          >
            <PawSVG className="w-14 h-14" />
          </div>
        ))}

        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ width: 360, height: 360, background: "radial-gradient(circle, rgba(8,145,178,0.15) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex flex-col h-full px-12 py-14">
          {/* logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0891B2, #06B6D4)" }}>
              <PawSVG className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-base tracking-tight">PetCare Center</span>
              <div className="text-[10px] text-slate-500 font-mono">v2.1.0</div>
            </div>
          </div>

          {/* step indicator */}
          <div className="mt-auto mb-auto pt-20">
            <div className="flex items-center gap-3 mb-10">
              {(["email", "otp", "newpw", "done"] as Step[]).map((s, i) => {
                const steps = ["email", "otp", "newpw", "done"];
                const idx = steps.indexOf(step);
                const sIdx = steps.indexOf(s);
                const done = sIdx < idx;
                const active = sIdx === idx;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done ? "bg-cyan-500 text-white" : active ? "bg-white text-slate-900" : "bg-white/10 text-slate-500"
                    }`}>
                      {done ? <CheckCircle2 size={15} /> : i + 1}
                    </div>
                    {i < 3 && <div className={`w-8 h-0.5 rounded-full ${sIdx < idx ? "bg-cyan-500" : "bg-white/10"}`} />}
                  </div>
                );
              })}
            </div>

            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
              {step === "email" && (<>Quên mật<br /><span style={{ color: "#0891B2" }}>khẩu?</span></>)}
              {step === "otp"   && (<>Nhập mã<br /><span style={{ color: "#0891B2" }}>xác thực</span></>)}
              {step === "newpw" && (<>Tạo mật<br /><span style={{ color: "#0891B2" }}>khẩu mới</span></>)}
              {step === "done"  && (<>Đặt lại<br /><span style={{ color: "#0891B2" }}>thành công</span></>)}
            </h2>
            <p className="text-slate-400 mt-4 leading-relaxed text-sm max-w-[300px]">
              {step === "email" && "Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác thực 6 chữ số về hộp thư của bạn."}
              {step === "otp"   && `Mã OTP đã được gửi đến ${email}. Kiểm tra hộp thư và nhập mã trong vòng 10 phút.`}
              {step === "newpw" && "Tạo mật khẩu mới an toàn — ít nhất 8 ký tự, nên kết hợp chữ hoa, số và ký tự đặc biệt."}
              {step === "done"  && "Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại với mật khẩu mới."}
            </p>
          </div>

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
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0891B2, #06B6D4)" }}>
              <PawSVG className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-foreground">PetCare Center</span>
          </div>

          {/* back button */}
          {step !== "done" && (
            <button
              onClick={step === "email" ? onBack : () => { setStep(step === "otp" ? "email" : "otp"); setErr(""); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-7 transition-colors group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              {step === "email" ? "Quay lại đăng nhập" : "Quay lại"}
            </button>
          )}

          {/* ── Step 1: Email ── */}
          {step === "email" && (
            <>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, #0891B2, #06B6D4)" }}>
                <Mail size={22} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Quên mật khẩu</h1>
              <p className="text-sm text-muted-foreground mt-1.5">Nhập email tài khoản để nhận mã xác thực.</p>

              <form onSubmit={handleSendEmail} className="mt-8 space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErr(""); }}
                    placeholder="email@petcare.vn"
                    autoFocus
                    className="mt-1.5 w-full h-11 px-4 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
                  />
                </div>

                {err && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-600">{err}</div>}

                <PrimaryBtn loading={loading} label="Gửi mã xác thực" />
                <p className="text-center text-sm text-muted-foreground">
                  Nhớ mật khẩu rồi?{" "}
                  <button type="button" onClick={onBack} className="font-semibold text-cyan-600 hover:underline">Đăng nhập</button>
                </p>
              </form>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, #0891B2, #06B6D4)" }}>
                <KeyRound size={22} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Nhập mã OTP</h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Mã 6 chữ số đã gửi đến <span className="font-semibold text-foreground">{email}</span>
              </p>

              <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6">
                {/* OTP boxes */}
                <div>
                  <div className="flex items-center gap-2.5 justify-between">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onFocus={(e) => e.target.select()}
                        className={`w-full aspect-square max-w-[56px] text-center rounded-xl border-2 text-xl font-bold text-foreground transition-all outline-none
                          ${digit ? "border-cyan-400 bg-cyan-50/50" : "border-border bg-white"}
                          focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20`}
                      />
                    ))}
                  </div>
                  {err && <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-600">{err}</div>}
                </div>

                {/* resend */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Không nhận được mã?</span>
                  {countdown > 0 ? (
                    <span className="text-muted-foreground font-medium">Gửi lại sau {countdown}s</span>
                  ) : (
                    <button type="button" onClick={handleResend} className="flex items-center gap-1 font-semibold text-cyan-600 hover:underline">
                      <RefreshCw size={13} /> Gửi lại
                    </button>
                  )}
                </div>

                <PrimaryBtn loading={loading} label="Xác nhận" />
              </form>
            </>
          )}

          {/* ── Step 3: New password ── */}
          {step === "newpw" && (
            <>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, #0891B2, #06B6D4)" }}>
                <KeyRound size={22} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Mật khẩu mới</h1>
              <p className="text-sm text-muted-foreground mt-1.5">Tạo mật khẩu mạnh cho tài khoản của bạn.</p>

              <form onSubmit={handleSetPassword} className="mt-8 space-y-4">
                {/* new password */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Mật khẩu mới</label>
                  <div className="relative mt-1.5">
                    <input
                      type={showPw ? "text" : "password"}
                      value={newPw}
                      onChange={(e) => { setNewPw(e.target.value); setErr(""); }}
                      placeholder="••••••••"
                      autoFocus
                      className="w-full h-11 px-4 pr-12 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
                    />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* strength bar */}
                  {newPw.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className={`h-1 flex-1 rounded-full transition-all ${n <= pwStrength ? strengthColor[pwStrength] : "bg-slate-200"}`} />
                        ))}
                      </div>
                      <span className={`text-[11px] font-semibold ${pwStrength === 1 ? "text-red-500" : pwStrength === 2 ? "text-amber-500" : "text-emerald-600"}`}>
                        {strengthLabel[pwStrength]}
                      </span>
                    </div>
                  )}
                </div>

                {/* confirm password */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Xác nhận mật khẩu</label>
                  <div className="relative mt-1.5">
                    <input
                      type={showCPw ? "text" : "password"}
                      value={confirmPw}
                      onChange={(e) => { setConfirmPw(e.target.value); setErr(""); }}
                      placeholder="••••••••"
                      className="w-full h-11 px-4 pr-12 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
                    />
                    <button type="button" onClick={() => setShowCPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* match indicator */}
                  {confirmPw.length > 0 && (
                    <div className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-medium ${confirmPw === newPw ? "text-emerald-600" : "text-red-500"}`}>
                      {confirmPw === newPw
                        ? <><CheckCircle2 size={12} /> Mật khẩu khớp</>
                        : <><span className="w-3 h-3 rounded-full border-2 border-red-400 flex-shrink-0 inline-block" /> Chưa khớp</>
                      }
                    </div>
                  )}
                </div>

                {err && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-600">{err}</div>}

                <PrimaryBtn loading={loading} label="Cập nhật mật khẩu" />
              </form>
            </>
          )}

          {/* ── Step 4: Done ── */}
          {step === "done" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200"
                style={{ background: "linear-gradient(135deg, #10B981, #34D399)" }}>
                <CheckCircle2 size={38} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Đặt lại thành công!</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto leading-relaxed">
                Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại để tiếp tục.
              </p>
              <button
                onClick={onBack}
                className="mt-8 w-full h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #0891B2, #06B6D4)", boxShadow: "0 4px 14px rgba(8,145,178,0.3)" }}
              >
                Đăng nhập ngay
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PrimaryBtn({ loading, label }: { loading: boolean; label: string }) {
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
