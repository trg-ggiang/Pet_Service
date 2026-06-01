import {
  Activity,
  CalendarDays,
  Clock,
  Heart,
  Stethoscope,
  Thermometer,
  Weight,
  Wind,
  type LucideIcon,
} from "lucide-react";

export const TONE_CLASS = {
  orange: { bg: "bg-orange-50", icon: "text-orange-500" },
  red: { bg: "bg-red-50", icon: "text-red-500" },
  cyan: { bg: "bg-cyan-50", icon: "text-cyan-500" },
  violet: { bg: "bg-violet-50", icon: "text-violet-500" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-500" },
  slate: { bg: "bg-slate-50", icon: "text-slate-500" },
};

export const SYSTEM_STATUS_CLASS = {
  normal: {
    cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  abnormal: {
    cls: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  not_examined: {
    cls: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
};

const ICONS: Record<string, LucideIcon> = {
  Activity,
  CalendarDays,
  Clock,
  Heart,
  Stethoscope,
  Thermometer,
  Weight,
  Wind,
};

export function pickIcon(name: string): LucideIcon {
  return ICONS[name] || Stethoscope;
}
