import { ArrowRight, ChevronRight } from "lucide-react";

import { PawSVG } from "./AuthShared";

export interface WelcomeSlide {
  url: string;
  alt: string;
  caption: string;
}

export function WelcomeView({
  slides,
  slide,
  onSlideChange,
  onLogin,
  onRegister,
}: {
  slides: WelcomeSlide[];
  slide: number;
  onSlideChange: (index: number) => void;
  onLogin: () => void;
  onRegister: () => void;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <style>{`
        @keyframes kenburns {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.12) translate(-1.5%, 1%); }
        }
        .kb { animation: kenburns 10s ease-in-out infinite alternate; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <div className="absolute inset-0 z-0">
        {slides.map((item, index) => (
          <img
            key={item.url}
            src={item.url}
            alt={item.alt}
            className="kb absolute inset-0 w-full h-full object-cover"
            style={{ opacity: index === slide ? 1 : 0, transition: "opacity 1.2s ease-in-out" }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      <div className="relative z-10 flex items-center px-8 pt-7">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
            <PawSVG className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-tight">PetCare Center</span>
            <div className="text-[10px] text-white/50 font-mono">v2.1.0</div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center -mt-16">
        <div key={slide} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-white/80 mb-6 border border-white/20 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.08)", animation: "fadeUp 0.6s ease-out" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {slides[slide].caption}
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight max-w-3xl">
          Chăm sóc thú cưng<br />
          <span style={{ color: "#22D3EE" }}>tận tâm & chuyên nghiệp</span>
        </h1>
        <p className="text-white/60 mt-5 text-lg max-w-xl leading-relaxed">
          Nền tảng quản lý phòng khám thú y tích hợp - đặt lịch, hồ sơ bệnh án, tiêm chủng và lưu trú.
        </p>
        <div className="flex items-center gap-4 mt-10">
          <button onClick={onLogin} className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold text-white shadow-2xl transition-all hover:scale-[1.03] active:scale-[0.98]" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)", boxShadow: "0 0 40px rgba(8,145,178,0.45)" }}>
            Đăng nhập <ArrowRight size={18} />
          </button>
          <button onClick={onRegister} className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.98] border border-white/30 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.1)" }}>
            Đăng ký miễn phí <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-8 mt-12 text-center">
          {[
            { n: "1.284+", label: "Khách hàng" },
            { n: "1.847+", label: "Thú cưng" },
            { n: "8+", label: "Bác sĩ & Nhân viên" },
            { n: "24/7", label: "Hỗ trợ" },
          ].map((item) => (
            <div key={item.n}>
              <div className="text-2xl font-bold text-white">{item.n}</div>
              <div className="text-xs text-white/50 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between px-8 pb-8">
        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => onSlideChange(index)}
              className="transition-all duration-300"
              style={{
                width: index === slide ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: index === slide ? "#0891B2" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="font-mono">{String(slide + 1).padStart(2, "0")}</span>
          <div className="w-12 h-0.5 bg-white/20 rounded-full" />
          <span className="font-mono">{String(slides.length).padStart(2, "0")}</span>
        </div>
      </div>
    </div>
  );
}
