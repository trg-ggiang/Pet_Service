import { useEffect, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight,
  Loader2, Save, X,
} from "lucide-react";
import { adminService, type AdminDoctorScheduleRow } from "../../features/admin/services/admin";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const TIME_OPTIONS = Array.from({ length: 27 }, (_, i) => {
  const total = 7 * 60 + i * 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
});

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return toYmd(d);
}

function getWeekDates(weekStart: string): string[] {
  const d = new Date(weekStart + "T00:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(day.getDate() + i);
    return toYmd(day);
  });
}

function fmtDateShort(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${d}/${m}`;
}

function slotCount(from: string, to: string, breakFrom?: string, breakTo?: string): number {
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  let mins = toMin(to) - toMin(from);
  if (breakFrom && breakTo) mins -= Math.max(0, toMin(breakTo) - toMin(breakFrom));
  return Math.max(0, Math.floor(mins / 30));
}

function todayYmd(): string {
  return toYmd(new Date());
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeekDoctor {
  id: string;
  name: string;
  room: string;
}

interface ServerCell {
  from: string;
  to: string;
  roomName: string;
  slotCount: number;
  bookedCount: number;
}

interface PendingCell {
  from: string;
  to: string;
  roomName: string;
  breakFrom?: string;
  breakTo?: string;
}

type CellKey = string; // `${doctorId}:${date}`

// ─── Cell Edit Dialog ─────────────────────────────────────────────────────────

function CellEditDialog({
  initial,
  bookedCount,
  onSave,
  onClear,
  onClose,
  hasServer,
}: {
  initial: PendingCell;
  bookedCount: number;
  onSave: (cell: PendingCell) => void;
  onClear: () => void;
  onClose: () => void;
  hasServer: boolean;
}) {
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [room, setRoom] = useState(initial.roomName);
  const [hasBreak, setHasBreak] = useState(!!(initial.breakFrom && initial.breakTo));
  const [breakFrom, setBreakFrom] = useState(initial.breakFrom ?? "12:00");
  const [breakTo, setBreakTo] = useState(initial.breakTo ?? "13:00");

  const validMain = from < to;
  const validBreak = !hasBreak || (breakFrom >= from && breakTo <= to && breakFrom < breakTo);
  const valid = validMain && validBreak;
  const preview = valid ? slotCount(from, to, hasBreak ? breakFrom : undefined, hasBreak ? breakTo : undefined) : 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/25"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-border p-5 w-[300px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-bold text-foreground">Cài đặt ca làm việc</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted">
            <X size={13} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Work hours */}
          <div>
            <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5">Giờ làm việc</div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-[10px] text-muted-foreground">
                Bắt đầu
                <select value={from} onChange={(e) => setFrom(e.target.value)}
                  className="mt-1 w-full h-9 px-2 text-[13px] border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400">
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="block text-[10px] text-muted-foreground">
                Kết thúc
                <select value={to} onChange={(e) => setTo(e.target.value)}
                  className="mt-1 w-full h-9 px-2 text-[13px] border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400">
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>
          </div>

          {/* Room */}
          <label className="block text-[10px] font-bold uppercase text-muted-foreground">
            Phòng khám
            <input value={room} onChange={(e) => setRoom(e.target.value)}
              className="mt-1 w-full h-9 px-3 text-[13px] border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400" />
          </label>

          {/* Lunch break toggle */}
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setHasBreak((v) => !v)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-[12px] font-semibold transition-colors ${hasBreak ? "bg-orange-50 text-orange-700" : "bg-muted/30 text-muted-foreground hover:bg-muted"}`}
            >
              <span>Nghỉ trưa</span>
              <span className={`w-8 h-4 rounded-full relative transition-colors ${hasBreak ? "bg-orange-400" : "bg-slate-300"}`}>
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${hasBreak ? "translate-x-4" : "translate-x-0.5"}`} />
              </span>
            </button>
            {hasBreak && (
              <div className="px-3 py-2 border-t border-border bg-orange-50/50 grid grid-cols-2 gap-2">
                <label className="block text-[10px] text-muted-foreground">
                  Bắt đầu nghỉ
                  <select value={breakFrom} onChange={(e) => setBreakFrom(e.target.value)}
                    className="mt-1 w-full h-8 px-2 text-[12px] border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-orange-300">
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="block text-[10px] text-muted-foreground">
                  Hết nghỉ
                  <select value={breakTo} onChange={(e) => setBreakTo(e.target.value)}
                    className="mt-1 w-full h-8 px-2 text-[12px] border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-orange-300">
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                {!validBreak && (
                  <div className="col-span-2 text-[10px] text-red-600 bg-red-50 rounded px-2 py-1">
                    Giờ nghỉ phải nằm trong khung làm việc
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          {valid ? (
            <div className="bg-cyan-50 border border-cyan-100 rounded-lg px-3 py-2 text-[11px] text-cyan-700 font-medium">
              {preview} ca 30 phút
              {hasBreak
                ? <span> · {from}–{breakFrom} + {breakTo}–{to}</span>
                : <span> · {from}–{to}</span>
              }
              {bookedCount > 0 && (
                <span className="ml-2 text-amber-600 font-semibold">({bookedCount} lịch đã đặt)</span>
              )}
            </div>
          ) : (
            <div className="bg-red-50 rounded-lg px-3 py-2 text-[11px] text-red-600">
              Kiểm tra lại thời gian
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 h-9 border border-border rounded-lg text-[12px] font-semibold text-foreground hover:bg-muted transition-colors">
              Hủy
            </button>
            <button
              onClick={() => {
                if (valid) {
                  onSave({ from, to, roomName: room, breakFrom: hasBreak ? breakFrom : undefined, breakTo: hasBreak ? breakTo : undefined });
                  onClose();
                }
              }}
              disabled={!valid}
              className="flex-1 h-9 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-[12px] font-bold transition-colors disabled:opacity-40"
            >
              Áp dụng
            </button>
          </div>
          {hasServer && (
            <button onClick={() => { onClear(); onClose(); }}
              className="w-full h-8 border border-dashed border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 rounded-lg text-[11px] transition-colors">
              Xóa lịch ngày này
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Schedule Cell ────────────────────────────────────────────────────────────

function ScheduleCell({
  server,
  pending,
  isCleared,
  isEditing,
  onClick,
}: {
  server: ServerCell | undefined;
  pending: PendingCell | undefined;
  isCleared: boolean;
  isEditing: boolean;
  onClick: () => void;
}) {
  const effective = pending ?? server;
  const hasData = !!effective && !isCleared;
  const isPending = pending !== undefined || isCleared;

  return (
    <button
      onClick={onClick}
      className={`relative w-full h-[68px] rounded-xl border-2 text-left px-2.5 py-1.5 transition-all focus:outline-none ${
        isEditing
          ? "border-cyan-400 bg-cyan-50 shadow-sm shadow-cyan-200/50"
          : isCleared
            ? "border-dashed border-red-200 bg-red-50/40 hover:border-red-300"
            : hasData
              ? isPending
                ? pending && !server
                  ? "border-amber-300 bg-amber-50 hover:border-amber-400"
                  : "border-cyan-300 bg-cyan-50/80 hover:border-cyan-400"
                : "border-emerald-200 bg-emerald-50 hover:border-emerald-300"
              : "border-dashed border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
      }`}
    >
      {isCleared ? (
        <div className="flex items-center justify-center h-full">
          <span className="text-[10px] text-red-400 font-medium">Xóa lịch</span>
        </div>
      ) : hasData ? (
        <div className="space-y-0.5">
          <div className={`text-[11px] font-bold leading-tight ${
            isPending ? (pending && !server ? "text-amber-700" : "text-cyan-700") : "text-emerald-700"
          }`}>
            {effective!.from}–{effective!.to}
          </div>
          <div className={`text-[10px] truncate ${isPending ? "text-amber-600" : "text-emerald-600"}`}>
            {effective!.roomName}
            {isPending && pending?.breakFrom && pending?.breakTo && (
              <span className="ml-1 text-orange-500">☕{pending.breakFrom}–{pending.breakTo}</span>
            )}
          </div>
          <div className={`text-[10px] ${isPending ? "text-amber-500" : "text-emerald-500"}`}>
            {isPending && pending
              ? `~${slotCount(pending.from, pending.to, pending.breakFrom, pending.breakTo)} ca`
              : `${(effective as ServerCell).slotCount} ca`}
            {server?.bookedCount ? <span className="text-amber-500 ml-1">· {server.bookedCount} đặt</span> : null}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <span className="text-[11px] text-slate-400">+ Thêm</span>
        </div>
      )}
      {isPending && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
      )}
    </button>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function DoctorWeeklyScheduleModal({ onClose }: { onClose: () => void }) {
  const [weekStart, setWeekStart] = useState(getMonday);
  const [doctors, setDoctors] = useState<WeekDoctor[]>([]);
  const [serverCells, setServerCells] = useState<Map<CellKey, ServerCell>>(new Map());
  const [pending, setPending] = useState<Map<CellKey, PendingCell | null>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [editingKey, setEditingKey] = useState<CellKey | null>(null);

  // Quick-apply state
  const [qaFrom, setQaFrom] = useState("08:00");
  const [qaTo, setQaTo] = useState("17:00");
  const [qaRoom, setQaRoom] = useState("Phòng 1");
  const [qaBreak, setQaBreak] = useState(true);
  const [qaBreakFrom, setQaBreakFrom] = useState("12:00");
  const [qaBreakTo, setQaBreakTo] = useState("13:00");
  const [qaDays, setQaDays] = useState([true, true, true, true, true, false, false]);
  const [qaSelectedDoctors, setQaSelectedDoctors] = useState<Set<string>>(new Set());

  const weekDates = getWeekDates(weekStart);
  const today = todayYmd();

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    setSaveResult("");
    setSaveError("");

    adminService.getDoctorWeekSchedules(weekStart)
      .then((data) => {
        if (!active) return;
        setDoctors(data.doctors.map((d) => ({ id: String(d.id), name: d.name, room: d.room })));
        const map = new Map<CellKey, ServerCell>();
        for (const s of data.schedules) {
          map.set(`${s.doctorId}:${s.date}`, {
            from: s.from, to: s.to, roomName: s.roomName,
            slotCount: s.slotCount, bookedCount: s.bookedCount,
          });
        }
        setServerCells(map);
        setPending(new Map());
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "Không thể tải lịch bác sĩ");
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [weekStart]);

  // ── Week navigation ────────────────────────────────────────────────────────
  function shiftWeek(delta: number) {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(toYmd(d));
  }

  // ── Quick apply ────────────────────────────────────────────────────────────
  function applyQuickTemplate() {
    if (qaFrom >= qaTo) return;
    const targets = qaSelectedDoctors.size > 0
      ? doctors.filter((d) => qaSelectedDoctors.has(d.id))
      : doctors;
    const next = new Map(pending);
    for (const doctor of targets) {
      for (let i = 0; i < 7; i++) {
        if (!qaDays[i]) continue;
        next.set(`${doctor.id}:${weekDates[i]}`, {
          from: qaFrom, to: qaTo, roomName: qaRoom,
          breakFrom: qaBreak ? qaBreakFrom : undefined,
          breakTo: qaBreak ? qaBreakTo : undefined,
        });
      }
    }
    setPending(next);
    setSaveResult("");
    setSaveError("");
  }

  // ── Save all ───────────────────────────────────────────────────────────────
  async function saveAll() {
    const changes = [...pending.entries()];
    if (changes.length === 0) return;
    setSaving(true);
    setSaveResult("");
    setSaveError("");

    const byDoctor = new Map<string, AdminDoctorScheduleRow[]>();
    for (const [key, cell] of changes) {
      const [doctorId, date] = key.split(":");
      if (!byDoctor.has(doctorId)) byDoctor.set(doctorId, []);
      const rows = byDoctor.get(doctorId)!;
      if (cell !== null && cell.breakFrom && cell.breakTo) {
        // Split into morning + afternoon rows
        rows.push({ date, from: cell.from, to: cell.breakFrom, roomName: cell.roomName, on: true });
        rows.push({ date, from: cell.breakTo, to: cell.to, roomName: cell.roomName, on: true });
      } else {
        rows.push({
          date,
          from: cell?.from ?? "08:00",
          to: cell?.to ?? "08:00",
          roomName: cell?.roomName ?? "Phòng 1",
          on: cell !== null,
        });
      }
    }

    let totalSlots = 0;
    const errors: string[] = [];
    for (const [doctorId, rows] of byDoctor.entries()) {
      try {
        const result = await adminService.saveDoctorSchedule(doctorId, rows.filter((r) => r.on));
        totalSlots += result.slotCount;
      } catch (err: unknown) {
        const name = doctors.find((d) => d.id === doctorId)?.name ?? doctorId;
        errors.push(`${name}: ${err instanceof Error ? err.message : "Lỗi"}`);
      }
    }

    // Reload week data
    try {
      const data = await adminService.getDoctorWeekSchedules(weekStart);
      const map = new Map<CellKey, ServerCell>();
      for (const s of data.schedules) {
        map.set(`${s.doctorId}:${s.date}`, {
          from: s.from, to: s.to, roomName: s.roomName,
          slotCount: s.slotCount, bookedCount: s.bookedCount,
        });
      }
      setServerCells(map);
      setPending(new Map());
    } catch { /* ignore reload error */ }

    if (errors.length === 0) {
      setSaveResult(`Đã lưu ${totalSlots} ca khám 30 phút`);
    } else {
      setSaveError(errors.join(" · "));
    }
    setSaving(false);
  }

  const pendingCount = pending.size;
  const allSelected = doctors.length > 0 && qaSelectedDoctors.size === doctors.length;

  // Editing cell details
  const editServer = editingKey ? serverCells.get(editingKey) : undefined;
  const editPending = editingKey ? pending.get(editingKey) : undefined;
  const editInitial: PendingCell = editPending ?? (editServer ? { from: editServer.from, to: editServer.to, roomName: editServer.roomName } : { from: "08:00", to: "17:00", roomName: "Phòng 1" });
  const editIsCleared = editPending === null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "min(96vw, 1280px)", height: "min(92vh, 860px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-foreground">Phân lịch làm việc theo tuần</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Khung giờ tự động chia thành ca 30 phút · nhấp vào ô để chỉnh sửa từng bác sĩ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => shiftWeek(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-[13px] font-semibold text-foreground px-2 min-w-[180px] text-center">
              {fmtDateShort(weekDates[0])} – {fmtDateShort(weekDates[6])} · {weekDates[0].slice(0, 4)}
            </span>
            <button onClick={() => shiftWeek(1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors">
              <ChevronRight size={14} />
            </button>
            <button onClick={onClose} className="ml-2 w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors">
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* ── Quick Apply Bar ── */}
        <div className="px-6 py-3 bg-slate-50/80 border-b border-border flex flex-wrap items-center gap-3 flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Áp dụng nhanh</span>

          {/* Time range */}
          <div className="flex items-center gap-1.5">
            <select value={qaFrom} onChange={(e) => setQaFrom(e.target.value)} className="h-8 px-2 text-[12px] border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400">
              {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-[11px] text-muted-foreground">→</span>
            <select value={qaTo} onChange={(e) => setQaTo(e.target.value)} className="h-8 px-2 text-[12px] border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400">
              {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Room input */}
          <input
            value={qaRoom}
            onChange={(e) => setQaRoom(e.target.value)}
            placeholder="Phòng khám"
            className="h-8 px-2 text-[12px] border border-border rounded-lg bg-white w-28 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />

          {/* Lunch break */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setQaBreak((v) => !v)}
              className={`flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-semibold border transition-colors ${
                qaBreak ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-white text-muted-foreground border-border hover:border-orange-200"
              }`}
            >
              Nghỉ trưa
            </button>
            {qaBreak && (
              <>
                <select value={qaBreakFrom} onChange={(e) => setQaBreakFrom(e.target.value)}
                  className="h-8 px-2 text-[12px] border border-orange-200 rounded-lg bg-orange-50 focus:outline-none focus:ring-1 focus:ring-orange-300">
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="text-[11px] text-muted-foreground">–</span>
                <select value={qaBreakTo} onChange={(e) => setQaBreakTo(e.target.value)}
                  className="h-8 px-2 text-[12px] border border-orange-200 rounded-lg bg-orange-50 focus:outline-none focus:ring-1 focus:ring-orange-300">
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </>
            )}
          </div>

          {/* Day toggles */}
          <div className="flex items-center gap-1">
            {DAY_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => setQaDays((prev) => { const next = [...prev]; next[i] = !next[i]; return next; })}
                className={`w-8 h-8 rounded-lg text-[11px] font-bold border transition-colors ${
                  qaDays[i] ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-muted-foreground border-border hover:border-cyan-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Apply button */}
          <button
            onClick={applyQuickTemplate}
            disabled={qaFrom >= qaTo}
            className="h-8 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-[12px] font-bold disabled:opacity-40 transition-colors"
          >
            {qaSelectedDoctors.size > 0 ? `Áp dụng (${qaSelectedDoctors.size} BS)` : "Áp dụng tất cả"}
          </button>

          {qaSelectedDoctors.size > 0 && (
            <button
              onClick={() => setQaSelectedDoctors(new Set())}
              className="h-8 px-3 border border-border rounded-lg text-[11px] text-muted-foreground hover:bg-muted transition-colors"
            >
              Bỏ chọn
            </button>
          )}
        </div>

        {/* ── Grid ── */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full gap-2">
              <Loader2 size={20} className="animate-spin text-cyan-500" />
              <span className="text-sm text-muted-foreground">Đang tải lịch...</span>
            </div>
          ) : loadError ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-red-600">{loadError}</span>
            </div>
          ) : (
            <table className="w-full min-w-[860px] border-collapse">
              <thead className="sticky top-0 z-10 bg-white shadow-sm">
                <tr className="border-b border-border">
                  {/* Select-all checkbox column */}
                  <th className="w-44 pl-4 pr-2 py-3 bg-slate-50/90 text-left">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQaSelectedDoctors(allSelected ? new Set() : new Set(doctors.map((d) => d.id)))}
                        className={`w-4 h-4 rounded border-2 flex-shrink-0 transition-colors ${allSelected ? "bg-cyan-500 border-cyan-500" : "border-slate-300 hover:border-cyan-400"}`}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bác sĩ</span>
                    </div>
                  </th>
                  {weekDates.map((date, i) => (
                    <th key={date} className={`py-3 px-1 text-center bg-slate-50/90 ${date === today ? "text-cyan-600" : "text-muted-foreground"}`}>
                      <div className={`text-[12px] font-bold ${date === today ? "text-cyan-600" : "text-foreground"}`}>{DAY_LABELS[i]}</div>
                      <div className={`text-[10px] font-medium ${date === today ? "text-cyan-500" : "text-muted-foreground"}`}>
                        {fmtDateShort(date)}
                        {date === today && <span className="ml-1 text-[9px] bg-cyan-500 text-white px-1 rounded-full">HN</span>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-muted-foreground text-sm">
                      Không có bác sĩ nào trong hệ thống
                    </td>
                  </tr>
                ) : (
                  doctors.map((doctor) => {
                    const isSelected = qaSelectedDoctors.has(doctor.id);
                    return (
                      <tr
                        key={doctor.id}
                        className={`border-b border-border/50 transition-colors ${isSelected ? "bg-cyan-50/30" : "hover:bg-slate-50/40"}`}
                      >
                        {/* Doctor name */}
                        <td className="pl-4 pr-2 py-2 w-44 align-middle">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setQaSelectedDoctors((prev) => {
                                const next = new Set(prev);
                                next.has(doctor.id) ? next.delete(doctor.id) : next.add(doctor.id);
                                return next;
                              })}
                              className={`w-4 h-4 rounded border-2 flex-shrink-0 transition-colors ${isSelected ? "bg-cyan-500 border-cyan-500" : "border-slate-300 hover:border-cyan-400"}`}
                            />
                            <div className="min-w-0">
                              <div className="text-[12px] font-semibold text-foreground truncate">{doctor.name}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{doctor.room}</div>
                            </div>
                          </div>
                        </td>

                        {/* Day cells */}
                        {weekDates.map((date) => {
                          const key = `${doctor.id}:${date}`;
                          const server = serverCells.get(key);
                          const pendingVal = pending.get(key);
                          const isCleared = pendingVal === null;
                          const pCell = isCleared ? undefined : pendingVal;
                          const isEditing = editingKey === key;

                          return (
                            <td key={date} className="px-1 py-1.5 align-middle">
                              <ScheduleCell
                                server={server}
                                pending={pCell}
                                isCleared={isCleared}
                                isEditing={isEditing}
                                onClick={() => setEditingKey(isEditing ? null : key)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Legend ── */}
        <div className="px-6 py-2 border-t border-border/60 bg-slate-50/40 flex items-center gap-5 flex-shrink-0">
          {[
            { color: "bg-emerald-200 border-emerald-300", label: "Đã có lịch" },
            { color: "bg-amber-200 border-amber-300", label: "Lịch mới (chưa lưu)" },
            { color: "bg-cyan-200 border-cyan-300", label: "Đã chỉnh sửa" },
            { color: "bg-red-100 border-red-200", label: "Xóa lịch" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm border ${item.color}`} />
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[10px] text-muted-foreground">Dấu cam = chưa lưu</span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between flex-shrink-0 bg-muted/20">
          <div className="flex items-center gap-3 min-w-0">
            {pendingCount > 0 && !saving && (
              <span className="text-[12px] text-amber-600 font-medium flex items-center gap-1.5 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {pendingCount} thay đổi chưa lưu
              </span>
            )}
            {saveResult && (
              <span className="text-[12px] text-emerald-600 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={13} /> {saveResult}
              </span>
            )}
            {saveError && (
              <span className="text-[12px] text-red-600 font-medium flex items-center gap-1.5 truncate">
                <AlertTriangle size={13} className="flex-shrink-0" /> {saveError}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {pendingCount > 0 && !saving && (
              <button
                onClick={() => { setPending(new Map()); setSaveResult(""); setSaveError(""); }}
                className="h-9 px-4 border border-border rounded-lg text-[12px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                Hoàn tác tất cả
              </button>
            )}
            <button
              onClick={saveAll}
              disabled={saving || pendingCount === 0}
              className="h-9 px-5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-[13px] font-bold disabled:opacity-40 flex items-center gap-2 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Đang lưu..." : pendingCount > 0 ? `Lưu tất cả (${pendingCount})` : "Lưu"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Cell Edit Dialog (rendered inside the modal's stopPropagation boundary) ── */}
      {editingKey && !editIsCleared && (
        <CellEditDialog
          initial={editInitial}
          bookedCount={editServer?.bookedCount ?? 0}
          hasServer={!!editServer}
          onSave={(cell) => setPending((prev) => new Map(prev).set(editingKey, cell))}
          onClear={() => setPending((prev) => new Map(prev).set(editingKey, null))}
          onClose={() => setEditingKey(null)}
        />
      )}
    </div>
  );
}
