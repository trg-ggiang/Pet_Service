import type React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PixelDogLoader } from "../ui/PixelDogLoader";

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
      <PixelDogLoader label={label} size="sm" />
    </div>
  );
}

// ── Date filter helpers ───────────────────────────────────────────────────────

export type DateFilterMode = "today" | "week" | "date";

export interface DateFilterState {
  mode: DateFilterMode;
  date: string;      // YYYY-MM-DD used in "date" mode
  weekStart: string; // YYYY-MM-DD (Monday) used in "week" mode
}

export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayYmd(): string {
  return toYmd(new Date());
}

export function getMonday(dateYmd: string): string {
  const d = new Date(dateYmd + "T00:00:00");
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return toYmd(d);
}

export function getDefaultDateFilter(): DateFilterState {
  const today = todayYmd();
  return { mode: "today", date: today, weekStart: getMonday(today) };
}

export function parseAnyDateToYmd(value: string): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  // DD/MM/YYYY
  const vn = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vn) return `${vn[3]}-${vn[2].padStart(2, "0")}-${vn[1].padStart(2, "0")}`;
  const d = new Date(value);
  if (!isNaN(d.getTime())) return toYmd(d);
  return null;
}

export function matchesDateFilter(dateStr: string, filter: DateFilterState): boolean {
  const ymd = parseAnyDateToYmd(dateStr);
  if (!ymd) return filter.mode === "today";
  if (filter.mode === "today") return ymd === todayYmd();
  if (filter.mode === "date") return ymd === filter.date;
  if (filter.mode === "week") {
    const end = new Date(filter.weekStart + "T00:00:00");
    end.setDate(end.getDate() + 6);
    return ymd >= filter.weekStart && ymd <= toYmd(end);
  }
  return true;
}

function fmtDisplay(ymd: string): string {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

// ── DateFilterBar component ───────────────────────────────────────────────────

export function DateFilterBar({
  filter,
  onChange,
}: {
  filter: DateFilterState;
  onChange: (f: DateFilterState) => void;
}) {
  const today = todayYmd();
  const weekEndDate = new Date(filter.weekStart + "T00:00:00");
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekLabel = `${fmtDisplay(filter.weekStart)} – ${fmtDisplay(toYmd(weekEndDate))}`;

  const prevWeek = () => {
    const d = new Date(filter.weekStart + "T00:00:00");
    d.setDate(d.getDate() - 7);
    onChange({ ...filter, mode: "week", weekStart: toYmd(d) });
  };

  const nextWeek = () => {
    const d = new Date(filter.weekStart + "T00:00:00");
    d.setDate(d.getDate() + 7);
    onChange({ ...filter, mode: "week", weekStart: toYmd(d) });
  };

  const base = "h-8 px-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap";
  const active = "bg-cyan-500 text-white shadow-sm";
  const inactive = "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        className={`${base} ${filter.mode === "today" ? active : inactive}`}
        onClick={() => onChange({ ...filter, mode: "today" })}
      >
        Hôm nay
      </button>

      <div className="flex items-center gap-1">
        <button
          className={`${base} ${filter.mode === "week" ? active : inactive}`}
          onClick={() => onChange({ ...filter, mode: "week" })}
        >
          Tuần
        </button>
        {filter.mode === "week" && (
          <>
            <button
              onClick={prevWeek}
              className="h-8 w-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 bg-white transition-colors"
            >
              <ChevronLeft size={14} className="text-slate-600" />
            </button>
            <span className="text-xs text-slate-700 font-semibold px-1 whitespace-nowrap">{weekLabel}</span>
            <button
              onClick={nextWeek}
              className="h-8 w-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 bg-white transition-colors"
            >
              <ChevronRight size={14} className="text-slate-600" />
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          className={`${base} ${filter.mode === "date" ? active : inactive}`}
          onClick={() => onChange({ ...filter, mode: "date" })}
        >
          Chọn ngày
        </button>
        {filter.mode === "date" && (
          <input
            type="date"
            value={filter.date}
            onChange={(e) => onChange({ ...filter, date: e.target.value || today })}
            className="h-8 px-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        )}
      </div>
    </div>
  );
}

// ── Pagination component ──────────────────────────────────────────────────────

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/60">
      <span className="text-sm text-slate-500 font-medium">
        {from}–{to} / {total} kết quả
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Trước
        </button>
        <span className="text-sm font-bold text-slate-700 min-w-[52px] text-center">
          {page}/{pageCount}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
