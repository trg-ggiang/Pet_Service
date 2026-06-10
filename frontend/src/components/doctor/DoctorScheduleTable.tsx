import { useMemo, useState } from "react";
import { Calendar, Check, ChevronDown, ChevronRight, ListFilter, Loader2, Stethoscope } from "lucide-react";
import type { DoctorAppointment, DoctorScheduleMeta } from "../../features/doctor/services/doctorAppointments";
import {
  DateFilterBar,
  EmptyState,
  getDefaultDateFilter,
  matchesDateFilter,
  todayYmd,
  type DateFilterState,
} from "../staff/StaffCommon";

export type DoctorScheduleFilter = "all" | "in_progress" | "scheduled" | "completed";
export type DoctorScheduleView = "today" | "history";

const DOCTOR_SCHEDULE_FILTER_OPTIONS: Array<{ value: DoctorScheduleFilter; label: string }> = [
  { value: "all", label: "Tất cả lịch khám" },
  { value: "in_progress", label: "Đang khám" },
  { value: "scheduled", label: "Chờ khám" },
  { value: "completed", label: "Hoàn thành" },
];

function DoctorAppointmentRow({
  appointment,
  compact = false,
  showRecordDetail = false,
  onOpenExam,
  onOpenRecordDetail,
}: {
  appointment: DoctorAppointment;
  compact?: boolean;
  showRecordDetail?: boolean;
  onOpenExam: (appointment: DoctorAppointment) => void;
  onOpenRecordDetail?: (appointment: DoctorAppointment) => void;
}) {
  const row = appointment.scheduleRow;
  const isActive = row.statusKey === "in_progress";

  return (
    <div className={`flex items-center gap-4 px-5 py-4 transition-colors ${isActive ? "bg-amber-50/50" : "hover:bg-muted/20"}`}>
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
          {compact && <div className="mt-1 text-[11px] font-semibold text-slate-500 truncate">{row.service}</div>}
        </div>
      </div>

      {!compact && <div className="hidden md:block text-xs text-foreground font-medium w-44 truncate">{row.service}</div>}

      <div className="flex w-[236px] flex-shrink-0 items-center justify-end gap-3">
        <span className={`inline-flex w-24 justify-center items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ring-1 ring-inset ${row.statusView.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${row.statusView.dot}`} />
          <span className="truncate">{row.statusView.label}</span>
        </span>

        <div className="w-28 flex justify-end">
          {showRecordDetail ? (
            <button
              onClick={() => onOpenRecordDetail?.(appointment)}
              className="flex w-28 items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-200 bg-white text-xs font-bold text-cyan-700 transition-colors flex-shrink-0 hover:bg-cyan-50"
            >
              <span className="truncate">Chi tiết</span> <ChevronRight size={12} />
            </button>
          ) : isActive && (
            <button
              onClick={() => onOpenExam(appointment)}
              className="flex w-28 items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-xs font-bold text-white transition-colors flex-shrink-0 hover:bg-cyan-600"
            >
              <span className="truncate">Tiếp tục khám</span> <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DoctorAppointmentList({
  appointments,
  emptyLabel,
  compact = false,
  showRecordDetail = false,
  onOpenExam,
  onOpenRecordDetail,
}: {
  appointments: DoctorAppointment[];
  emptyLabel: string;
  compact?: boolean;
  showRecordDetail?: boolean;
  onOpenExam: (appointment: DoctorAppointment) => void;
  onOpenRecordDetail?: (appointment: DoctorAppointment) => void;
}) {
  if (appointments.length === 0) {
    return <EmptyState icon={Calendar} label={emptyLabel} />;
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border/60">
      {appointments.map((appointment) => (
        <DoctorAppointmentRow
          key={appointment.id}
          appointment={appointment}
          compact={compact}
          showRecordDetail={showRecordDetail}
          onOpenExam={onOpenExam}
          onOpenRecordDetail={onOpenRecordDetail}
        />
      ))}
    </div>
  );
}

function ScheduleLoadingState() {
  return (
    <div className="bg-white border border-border rounded-2xl flex-1 min-h-[320px] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-cyan-500" />
      <span className="ml-3 text-sm text-slate-500">Đang tải danh sách lịch hẹn...</span>
    </div>
  );
}

function ScheduleErrorState({ message }: { message: string }) {
  return (
    <div className="bg-white border border-border rounded-2xl flex-1 min-h-[320px] flex flex-col items-center justify-center py-16 px-6 text-center">
      <Calendar size={48} className="text-red-300 mb-3" />
      <p className="text-sm font-semibold text-red-600">Không tải được lịch hẹn từ backend</p>
      <p className="text-xs text-slate-500 mt-1 max-w-md">{message}</p>
    </div>
  );
}

export function DoctorScheduleTable({
  appointments,
  loading,
  error,
  meta,
  filter,
  view = "today",
  onFilterChange,
  onOpenExam,
  onOpenRecordDetail,
}: {
  appointments: DoctorAppointment[];
  loading: boolean;
  error?: string | null;
  meta: DoctorScheduleMeta;
  filter: DoctorScheduleFilter;
  view?: DoctorScheduleView;
  onFilterChange: (filter: DoctorScheduleFilter) => void;
  onOpenExam: (appointment: DoctorAppointment) => void;
  onOpenRecordDetail?: (appointment: DoctorAppointment) => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterState>(getDefaultDateFilter);
  const selectedFilter = DOCTOR_SCHEDULE_FILTER_OPTIONS.find((option) => option.value === filter)
    || DOCTOR_SCHEDULE_FILTER_OPTIONS[0];

  const statusFilteredAppointments = useMemo(
    () => filter === "all" ? appointments : appointments.filter((appointment) => appointment.statusKey === filter),
    [appointments, filter],
  );
  const dateFilteredAppointments = useMemo(
    () => appointments.filter((appointment) => matchesDateFilter(appointment.scheduleRow.date || appointment.date, dateFilter)),
    [appointments, dateFilter],
  );
  const todayCount = useMemo(
    () => appointments.filter((appointment) => (appointment.scheduleRow.date || appointment.date) === todayYmd()).length,
    [appointments],
  );

  if (loading) return <ScheduleLoadingState />;
  if (error) return <ScheduleErrorState message={error} />;

  if (view === "history") {
    return (
      <section className="bg-white border border-border rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="px-6 py-4 border-b border-border flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Tất cả ca khám</h3>
            <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{statusFilteredAppointments.length} / {appointments.length} lịch</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-48">
              <button
                type="button"
                onClick={() => setFilterOpen((current) => !current)}
                className={`flex h-9 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left text-[12px] font-bold transition-all ${
                  filterOpen ? "border-cyan-300 ring-2 ring-cyan-500/15" : "border-border hover:border-slate-300"
                }`}
                aria-expanded={filterOpen}
                aria-haspopup="listbox"
                aria-label="Lọc lịch khám"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <ListFilter size={14} className="flex-shrink-0 text-muted-foreground" />
                  <span className="truncate text-foreground">{selectedFilter.label}</span>
                </span>
                <ChevronDown size={15} className={`flex-shrink-0 text-slate-500 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
              </button>

              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setFilterOpen(false)} />
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10" role="listbox">
                    {DOCTOR_SCHEDULE_FILTER_OPTIONS.map((option) => {
                      const selected = option.value === filter;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            onFilterChange(option.value);
                            setFilterOpen(false);
                          }}
                          className={`flex h-9 w-full items-center justify-between rounded-xl px-3 text-left text-[12px] font-semibold transition-colors ${
                            selected ? "bg-cyan-50 text-cyan-700" : "text-slate-700 hover:bg-slate-50"
                          }`}
                          role="option"
                          aria-selected={selected}
                        >
                          <span className="truncate">{option.label}</span>
                          {selected && <Check size={15} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground font-medium">{meta.activityLabel}</span>
            </div>
          </div>
        </div>

        <DoctorAppointmentList
          appointments={statusFilteredAppointments}
          emptyLabel="Không có lịch hẹn nào phù hợp"
          showRecordDetail
          onOpenExam={onOpenExam}
          onOpenRecordDetail={onOpenRecordDetail}
        />
      </section>
    );
  }

  return (
    <section className="bg-white border border-border rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
      <div className="px-6 py-4 border-b border-border flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">Lịch hôm nay</h3>
            <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">Hôm nay có {todayCount} ca khám</p>
          </div>
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-700">
            {dateFilteredAppointments.length} ca
          </span>
        </div>
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>

      <DoctorAppointmentList
        appointments={dateFilteredAppointments}
        emptyLabel="Không có ca khám trong mốc thời gian này"
        compact
        onOpenExam={onOpenExam}
      />
    </section>
  );
}
