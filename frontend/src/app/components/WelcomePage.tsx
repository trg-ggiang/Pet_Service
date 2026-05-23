import { useState, useEffect } from "react";
import { ChevronRight, ArrowRight } from "lucide-react";

export type UserRole = "admin" | "doctor" | "staff" | "customer";

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

const SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1763586756635-1c1b61f969d2?w=1920&q=85",
    alt: "Golden retriever sits by a calm lake",
    caption: "Mỗi thú cưng đều xứng đáng được yêu thương tốt nhất",
  },
  {
    url: "https://images.unsplash.com/photo-1743776351114-519247692199?w=1920&q=85",
    alt: "A curious tabby cat stares right at the camera",
    caption: "Đặt lịch khám dễ dàng — chăm sóc toàn diện",
  },
  {
    url: "https://images.unsplash.com/photo-1768084368558-0c4f68278309?w=1920&q=85",
    alt: "A golden retriever dog running through a field",
    caption: "Theo dõi sức khoẻ thú cưng mọi lúc, mọi nơi",
  },
  {
    url: "https://images.unsplash.com/photo-1761079329550-8d91baffde00?w=1920&q=85",
    alt: "Fluffy grey cat with yellow eyes",
    caption: "Đội ngũ bác sĩ chuyên nghiệp — tận tâm với từng bệnh nhân",
  },
];

export function WelcomePage({
  onLogin,
  onRegister,
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const goTo = (i: number) => setSlide(i);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <style>{`
        @keyframes kenburns {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.12) translate(-1.5%, 1%); }
        }
        .kb { animation: kenburns 10s ease-in-out infinite alternate; }
      `}</style>

      {/* ── Background photos — all stacked, cross-fade via opacity ── */}
      <div className="absolute inset-0 z-0">
        {SLIDES.map((s, i) => (
          <img
            key={s.url}
            src={s.url}
            alt={s.alt}
            className="kb absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: i === slide ? 1 : 0,
              transition: "opacity 1.2s ease-in-out",
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {/* ── Top bar — logo only ── */}
      <div className="relative z-10 flex items-center px-8 pt-7">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
          >
            <PawSVG className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-tight">PetCare Center</span>
            <div className="text-[10px] text-white/50 font-mono">v2.1.0</div>
          </div>
        </div>
      </div>

      {/* ── Center hero text ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center -mt-16">
        {/* Caption badge */}
        <div
          key={slide}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-white/80 mb-6 border border-white/20 backdrop-blur-sm"
          style={{
            background: "rgba(255,255,255,0.08)",
            animation: "fadeUp 0.6s ease-out",
          }}
        >
          <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {SLIDES[slide].caption}
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight max-w-3xl">
          Chăm sóc thú cưng<br />
          <span style={{ color: "#22D3EE" }}>tận tâm & chuyên nghiệp</span>
        </h1>

        <p className="text-white/60 mt-5 text-lg max-w-xl leading-relaxed">
          Nền tảng quản lý phòng khám thú y tích hợp — đặt lịch, hồ sơ bệnh án, tiêm chủng và lưu trú.
        </p>

        {/* CTA buttons — single set */}
        <div className="flex items-center gap-4 mt-10">
          <button
            onClick={onLogin}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold text-white shadow-2xl transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)", boxShadow: "0 0 40px rgba(8,145,178,0.45)" }}
          >
            Đăng nhập
            <ArrowRight size={18} />
          </button>
          <button
            onClick={onRegister}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.98] border border-white/30 backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            Đăng ký miễn phí
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-8 mt-12 text-center">
          {[
            { n: "1.284+", label: "Khách hàng" },
            { n: "1.847+", label: "Thú cưng" },
            { n: "8+",     label: "Bác sĩ & Nhân viên" },
            { n: "24/7",   label: "Hỗ trợ" },
          ].map((s) => (
            <div key={s.n}>
              <div className="text-2xl font-bold text-white">{s.n}</div>
              <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom controls ── */}
      <div className="relative z-10 flex items-center justify-between px-8 pb-8">
        {/* Slide dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-300"
              style={{
                width: i === slide ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: i === slide ? "#0891B2" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>

        {/* Slide counter */}
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="font-mono">{String(slide + 1).padStart(2, "0")}</span>
          <div className="w-12 h-0.5 bg-white/20 rounded-full" />
          <span className="font-mono">{String(SLIDES.length).padStart(2, "0")}</span>
        </div>
      </div>
    </div>
  );
}
