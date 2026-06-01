import type React from "react";
import { Loader2 } from "lucide-react";

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

export function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Icon size={44} className="text-slate-300 mb-3" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={30} className="animate-spin text-cyan-500" />
      <span className="ml-3 text-sm text-slate-500">{label}</span>
    </div>
  );
}
