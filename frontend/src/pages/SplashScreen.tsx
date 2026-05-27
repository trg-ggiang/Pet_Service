import { useEffect, useState } from "react";

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
  { top: "8%",  left: "4%",  rotate: 15,  scale: 1.6 },
  { top: "22%", left: "78%", rotate: -20, scale: 1.3 },
  { top: "42%", left: "8%",  rotate: -35, scale: 0.9 },
  { top: "58%", left: "60%", rotate: 25,  scale: 2.0 },
  { top: "72%", left: "15%", rotate: 10,  scale: 1.4 },
  { top: "80%", left: "82%", rotate: -15, scale: 1.1 },
  { top: "15%", left: "45%", rotate: 40,  scale: 1.8 },
  { top: "65%", left: "38%", rotate: -30, scale: 1.2 },
];

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(onDone, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  useEffect(() => {
    if (phase < 2) return;
    let p = 0;
    const id = setInterval(() => {
      p += 1.8;
      setProgress(Math.min(p, 100));
      if (p >= 100) clearInterval(id);
    }, 32);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center select-none overflow-hidden"
      style={{ background: "linear-gradient(140deg, #080F1F 0%, #0C1E3C 55%, #080F1F 100%)" }}
    >
      {/* background paws */}
      {BG_PAWS.map((p, i) => (
        <div
          key={i}
          className="absolute pointer-events-none text-cyan-400/[0.045]"
          style={{ top: p.top, left: p.left, transform: `rotate(${p.rotate}deg) scale(${p.scale})` }}
        >
          <PawSVG className="w-14 h-14" />
        </div>
      ))}

      {/* teal glow */}
      <div
        className="absolute rounded-full blur-[120px] pointer-events-none"
        style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(8,145,178,0.18) 0%, transparent 70%)" }}
      />

      {/* content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* logo */}
        <div
          className="transition-all duration-700 ease-out"
          style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "scale(1)" : "scale(0.7)" }}
        >
          <div
            className="w-24 h-24 rounded-[28px] flex items-center justify-center shadow-2xl"
            style={{ background: "linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)", boxShadow: "0 0 40px rgba(8,145,178,0.4)" }}
          >
            <PawSVG className="w-14 h-14 text-white" />
          </div>
        </div>

        {/* brand */}
        <div
          className="text-center transition-all duration-500 delay-200"
          style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "translateY(0)" : "translateY(10px)" }}
        >
          <h1 className="text-[32px] font-bold text-white tracking-tight leading-none">
            PetCare <span style={{ color: "#0891B2" }}>Center</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2 tracking-wide">Hệ thống quản lý phòng khám thú y</p>
        </div>

        {/* progress bar */}
        <div
          className="w-52 transition-opacity duration-300"
          style={{ opacity: phase >= 2 ? 1 : 0 }}
        >
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #0891B2, #22D3EE)",
                transitionDuration: "80ms",
                boxShadow: "0 0 8px rgba(8,145,178,0.6)",
              }}
            />
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-2 font-mono">Đang khởi động…</p>
        </div>
      </div>

      {/* version */}
      <div className="absolute bottom-6 text-center">
        <p className="text-[11px] text-slate-700 font-mono">v2.1.0 · © 2026 PetCare Center</p>
      </div>
    </div>
  );
}
