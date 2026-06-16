type PixelDogLoaderProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  sm: "h-14 w-14",
  md: "h-24 w-24",
  lg: "h-40 w-40",
};

export function PixelDogLoader({ label = "Đang tải...", size = "md", className = "" }: PixelDogLoaderProps) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} role="status" aria-live="polite" aria-label={label}>
      <div className={`blue-pixel-dog-orbit ${sizeClass[size]}`}>
        <div className="blue-pixel-dog-runner">
          <span className="blue-pixel-dog" />
        </div>
      </div>
      {label && <span className="text-sm font-bold text-slate-600">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function PixelDogOverlay({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-cyan-50/15 backdrop-blur-[2px]">
      <div className="rounded-3xl border border-white/55 bg-white/30 px-9 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl">
        <PixelDogLoader label={label} size="lg" />
      </div>
    </div>
  );
}
