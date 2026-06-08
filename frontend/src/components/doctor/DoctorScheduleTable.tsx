import { Calendar, ChevronRight, ListFilter, Loader2, Stethoscope } from "lucide-react";
import type { DoctorAppointment, DoctorScheduleMeta } from "../../features/doctor/services/doctorAppointments";

export type DoctorScheduleFilter = "all" | "in_progress" | "scheduled" | "completed";

const DOCTOR_SCHEDULE_FILTER_OPTIONS: Array<{ value: DoctorScheduleFilter; label: string }> = [
  { value: "all", label: "Tất cả lịch khám" },
  { value: "in_progress", label: "Đang khám" },
  { value: "scheduled", label: "Chờ khám" },
  { value: "completed", label: "Hoàn thành" },
];

export function DoctorScheduleTable({
  appointments,
  loading,
  error,
  meta,
  filter,
  onFilterChange,
  onOpenExam,
}: {
  appointments: DoctorAppointment[];
  loading: boolean;
  error?: string | null;
  meta: DoctorScheduleMeta;
  filter: DoctorScheduleFilter;
  onFilterChange: (filter: DoctorScheduleFilter) => void;
  onOpenExam: (appointment: DoctorAppointment) => void;
}) {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
      <div className="px-6 py-4 border-b border-border flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-sm font-bold text-foreground">Danh sách ca khám</h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <label className="relative flex items-center">
            <ListFilter size={14} className="pointer-events-none absolute left-3 text-muted-foreground" />
            <select
              value={filter}
              onChange={(event) => onFilterChange(event.target.value as DoctorScheduleFilter)}
              className="h-9 min-w-[180px] appearance-none rounded-xl border border-border bg-white pl-9 pr-8 text-xs font-semibold text-foreground outline-none transition-colors hover:bg-muted/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              aria-label="Lọc lịch khám"
            >
              {DOCTOR_SCHEDULE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronRight size={14} className="pointer-events-none absolute right-3 rotate-90 text-muted-foreground" />
          </label>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground font-medium">{meta.activityLabel}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 min-h-[260px] items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-cyan-500" />
          <span className="ml-3 text-sm text-slate-500">Đang tải danh sách lịch hẹn...</span>
        </div>
      ) : error ? (
        <div className="flex flex-1 min-h-[260px] flex-col items-center justify-center py-16 px-6 text-center">
          <Calendar size={48} className="text-red-300 mb-3" />
          <p className="text-sm font-semibold text-red-600">Không tải được lịch hẹn từ backend</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">{error}</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-1 min-h-[260px] flex-col items-center justify-center py-16">
          <Calendar size={48} className="text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">Không có lịch hẹn nào từ backend</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border/60">
          {appointments.map((appointment) => {
            const row = appointment.scheduleRow;
            const isActive = row.statusKey === "in_progress";

            return (
              <div key={row.id} className={`flex items-center gap-4 px-6 py-4 transition-colors ${isActive ? "bg-amber-50/50" : "hover:bg-muted/20"}`}>
                <div className="w-20 text-center flex-shrink-0">
                  <div className="text-sm font-bold text-foreground font-mono">{row.time}</div>
                  {row.dateLabel && <div className="mt-1 text-[10px] font-semibold leading-tight text-muted-foreground">{row.dateLabel}</div>}
                  {isActive && <div className="text-[9px] text-amber-600 font-bold mt-0.5 animate-pulse">ĐANG KHÁM</div>}
                </div>

                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                    <Stethoscope size={14} className="text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">
                      {row.patient}
                      <span className="ml-2 text-[10px] font-normal text-muted-foreground">{row.species}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{row.owner} · {row.id}</div>
                  </div>
                </div>

                <div className="hidden md:block text-xs text-foreground font-medium w-44 truncate">{row.service}</div>

                <div className="flex items-center justify-end gap-3 w-[236px] flex-shrink-0">
                  <span className={`inline-flex w-24 justify-center items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ring-1 ring-inset ${row.statusView.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${row.statusView.dot}`} />
                    <span className="truncate">{row.statusView.label}</span>
                  </span>

                  <div className="w-28 flex justify-end">
                    {row.statusKey !== "completed" && (
                      <button
                        onClick={() => onOpenExam(appointment)}
                        className={`flex w-28 items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex-shrink-0 ${
                          isActive
                            ? "bg-cyan-500 text-white hover:bg-cyan-600"
                            : "border border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="truncate">{isActive ? "Tiếp tục khám" : "Bắt đầu"}</span> <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
