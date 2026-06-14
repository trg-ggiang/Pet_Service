import type { Dispatch, SetStateAction } from "react";
import {
  AlertTriangle, BedDouble, Calendar, Check, ChevronDown,
  Clock, MapPin, Pill, Plus, Stethoscope,
} from "lucide-react";
import type {
  CustomerAppointmentListPayload,
  CustomerAppointmentStatusFilter,
} from "../../../types/customer/appointments";
import type { Apt, Pet, ServiceType } from "../../../types/customer/portal";
import { getServiceTypeConfig, getStatusConfig } from "../../../utils/customer/portalConfig";

type AppointmentFilterMenu = "pet" | "service" | null;
type ServiceFilterOption   = { value: ServiceType | "all"; label: string };

type Props = {
  pets: Pet[];
  appointments: Apt[];
  appointmentSummary: CustomerAppointmentListPayload["summary"];
  appointmentPagination: CustomerAppointmentListPayload["pagination"];
  appointmentsPageCount: number;
  appointmentsLoading: boolean;
  appointmentsError: string;
  statusFilter: CustomerAppointmentStatusFilter;
  petFilter: string;
  serviceTypeFilter: ServiceType | "all";
  openAptFilter: AppointmentFilterMenu;
  serviceFilterOptions: ServiceFilterOption[];
  selectedPetLabel: string;
  selectedServiceLabel: string;
  onBookAppointment: () => void;
  onBookBoarding?: () => void;
  onViewAppointment: (apt: Apt) => void;
  onRescheduleAppointment: (apt: Apt) => void;
  onCancelAppointment: (id: string) => void;
  setStatusFilter: (s: CustomerAppointmentStatusFilter) => void;
  setPetFilter: (p: string) => void;
  setServiceTypeFilter: (s: ServiceType | "all") => void;
  setOpenAptFilter: Dispatch<SetStateAction<AppointmentFilterMenu>>;
  setAppointmentsPage: Dispatch<SetStateAction<number>>;
};

/* ── Progress ──────────────────────────────────────────────────────── */

const STEPS_NORMAL   = ["Đặt lịch", "Xác nhận", "Check-in", "Thực hiện", "Hoàn thành"];
const STEPS_BOARDING = ["Đặt phòng", "Xác nhận", "Check-in", "Lưu trú",  "Trả phòng"];

function getActiveStep(status: string) {
  if (status === "PENDING")     return 0;
  if (status === "CONFIRMED")   return 1;
  if (status === "CHECKED_IN")  return 2;
  if (status === "IN_PROGRESS") return 3;
  if (status === "COMPLETED")   return 4;
  return -1;
}

function ProgressTrack({ status, isBoarding }: { status: string; isBoarding: boolean }) {
  const steps      = isBoarding ? STEPS_BOARDING : STEPS_NORMAL;
  const active     = getActiveStep(status);
  const cancelled  = status === "CANCELLED" || status === "NO_SHOW";

  if (cancelled) return (
    <div className="flex items-center gap-2 pt-3">
      <div className="h-0.5 flex-1 rounded-full bg-red-100" />
      <span className="text-[11px] font-semibold text-red-400">Đã hủy</span>
    </div>
  );

  return (
    <div className="flex items-center gap-0 pt-3">
      {steps.map((label, i) => {
        const done   = i <= active;
        const isNow  = i === active;
        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full transition-all
                ${done ? "bg-cyan-500" : "border border-slate-200 bg-white"}
                ${isNow ? "ring-2 ring-cyan-200 ring-offset-1" : ""}`}
              >
                {done
                  ? <Check size={10} className="text-white" strokeWidth={3} />
                  : <div className="h-1 w-1 rounded-full bg-slate-300" />}
              </div>
              <span className={`text-[9px] font-semibold whitespace-nowrap ${done ? "text-cyan-600" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mb-3.5 h-px flex-1 ${done && i < active ? "bg-cyan-300" : "bg-slate-100"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Status colour palette ─────────────────────────────────────────── */

const STATUS_ACCENT: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  PENDING:     { bg: "bg-slate-50",    text: "text-slate-600",   border: "border-slate-200",   dot: "bg-slate-400"   },
  CONFIRMED:   { bg: "bg-cyan-50",     text: "text-cyan-700",    border: "border-cyan-100",    dot: "bg-cyan-500"    },
  CHECKED_IN:  { bg: "bg-cyan-50",     text: "text-cyan-800",    border: "border-cyan-100",    dot: "bg-cyan-600"    },
  IN_PROGRESS: { bg: "bg-cyan-50",     text: "text-cyan-800",    border: "border-cyan-100",    dot: "bg-cyan-600"    },
  COMPLETED:   { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-100", dot: "bg-emerald-500" },
  CANCELLED:   { bg: "bg-white",       text: "text-slate-400",   border: "border-slate-200",   dot: "bg-slate-300"   },
  NO_SHOW:     { bg: "bg-white",       text: "text-slate-400",   border: "border-slate-200",   dot: "bg-slate-300"   },
};
const DEFAULT_ACCENT = STATUS_ACCENT.PENDING;

/* ── Main component ────────────────────────────────────────────────── */

export function CustomerAppointmentsTab({
  pets,
  appointments,
  appointmentSummary,
  appointmentPagination,
  appointmentsPageCount,
  appointmentsLoading,
  appointmentsError,
  statusFilter,
  petFilter,
  serviceTypeFilter,
  serviceFilterOptions,
  onBookAppointment,
  onBookBoarding,
  onViewAppointment,
  onRescheduleAppointment,
  onCancelAppointment,
  setStatusFilter,
  setPetFilter,
  setServiceTypeFilter,
  setAppointmentsPage,
}: Props) {
  return (
    <div className="w-full space-y-4">

      {/* ── Title row ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lịch hẹn của tôi</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {appointmentSummary.total} lịch hẹn · {appointmentSummary.statusCounts.find(s => s.status === "upcoming")?.count ?? 0} sắp tới
          </p>
        </div>
        <div className="flex gap-2">
          {onBookBoarding && (
            <button
              onClick={onBookBoarding}
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <BedDouble size={15} className="text-blue-500" />
              <span className="hidden sm:inline">Lưu trú</span>
            </button>
          )}
          <button
            onClick={onBookAppointment}
            className="flex h-10 items-center gap-2 rounded-lg bg-cyan-600 px-5 text-sm font-bold text-white transition-colors hover:bg-cyan-700"
          >
            <Plus size={15} strokeWidth={2.5} />
            Đặt lịch mới
          </button>
        </div>
      </div>

      {/* ── Status tabs ───────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5">
        {([
          { id: "all"         as const, label: "Tất cả"        },
          { id: "upcoming"    as const, label: "Sắp tới"       },
          { id: "in_progress" as const, label: "Đang xử lý"    },
          { id: "completed"   as const, label: "Hoàn thành"    },
          { id: "cancelled"   as const, label: "Đã hủy"        },
        ] as const).map(s => {
          const active = statusFilter === s.id;
          const count  = s.id === "all"
            ? appointmentSummary.total
            : (appointmentSummary.statusCounts.find(x => x.status === s.id)?.count ?? 0);
          return (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`h-9 min-w-fit flex-1 whitespace-nowrap rounded-lg px-4 text-sm font-bold transition-colors ${
                active ? "bg-cyan-500 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s.label}
              <span className={`ml-1.5 text-[11px] ${active ? "opacity-70" : "text-slate-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Filter row ────────────────────────────────────────────── */}
      <div className="flex gap-3">
        {/* Pet */}
        <div className="relative min-w-[160px] flex-1">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-rose-400">
            <svg viewBox="0 0 80 80" className="h-3.5 w-3.5" fill="currentColor">
              <ellipse cx="40" cy="54" rx="18" ry="15" /><ellipse cx="18" cy="35" rx="8.5" ry="10" />
              <ellipse cx="32" cy="27" rx="8" ry="9.5" /><ellipse cx="48" cy="27" rx="8" ry="9.5" />
              <ellipse cx="62" cy="35" rx="8.5" ry="10" />
            </svg>
          </div>
          <select
            value={petFilter}
            onChange={e => { setPetFilter(e.target.value); setAppointmentsPage(1); }}
            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-semibold focus:border-cyan-400 focus:outline-none"
          >
            <option value="all">Tất cả thú cưng</option>
            {pets.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Service type */}
        <div className="relative min-w-[160px] flex-1">
          <Stethoscope size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500" />
          <select
            value={serviceTypeFilter}
            onChange={e => { setServiceTypeFilter(e.target.value as ServiceType | "all"); setAppointmentsPage(1); }}
            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-semibold focus:border-cyan-400 focus:outline-none"
          >
            {serviceFilterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Result count */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500 whitespace-nowrap">
          {appointmentSummary.filtered} kết quả
        </div>
      </div>

      {/* ── Appointment list ──────────────────────────────────────── */}
      {appointmentsLoading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => (
            <div key={i} className="flex overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="w-[88px] flex-shrink-0 animate-pulse bg-slate-100" />
              <div className="flex-1 space-y-3 p-5">
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                <div className="h-2 w-full animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : appointmentsError ? (
        <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-5">
          <AlertTriangle size={20} className="flex-shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-bold text-red-700">Không thể tải lịch hẹn</p>
            <p className="text-xs text-red-500 mt-0.5">{appointmentsError}</p>
          </div>
        </div>
      ) : appointmentSummary.filtered === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Calendar size={24} className="text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">Không tìm thấy lịch hẹn</p>
            <p className="mt-1 text-xs text-slate-400">Thử thay đổi bộ lọc hoặc đặt lịch mới</p>
          </div>
          <button
            onClick={onBookAppointment}
            className="mt-1 flex h-10 items-center gap-2 rounded-lg bg-cyan-600 px-5 text-sm font-bold text-white hover:bg-cyan-700 transition-colors"
          >
            <Plus size={15} /> Đặt lịch ngay
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(apt => {
            const Icon       = apt.icon;
            const statusCfg  = getStatusConfig(apt.status);
            const svcCfg     = getServiceTypeConfig(apt.serviceType);
            const isBoarding = apt.serviceType === "Lưu trú";
            const canAction  = apt.status === "PENDING" || apt.status === "CONFIRMED";
            const accent     = STATUS_ACCENT[apt.status] ?? DEFAULT_ACCENT;

            return (
              <div
                key={apt.id}
                onClick={() => onViewAppointment(apt)}
                className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300 cursor-pointer"
              >
                {/* ── Date / time accent column ──────────────────── */}
                <div className={`flex w-[88px] flex-shrink-0 flex-col items-center justify-center gap-0.5 border-r py-4 ${accent.bg} ${accent.border}`}>
                  {isBoarding ? (
                    <>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${accent.text}`}>Lưu trú</span>
                      <span className={`text-base font-black leading-tight ${accent.text}`}>{apt.date.split(" ")[0] ?? apt.date}</span>
                      {apt.note && (
                        <span className={`mt-1 text-[9px] font-semibold ${accent.text} opacity-70`}>
                          → {apt.note.split("–")[1]?.trim() ?? ""}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className={`text-lg font-black leading-tight ${accent.text}`}>{apt.time}</span>
                      <span className={`text-[11px] font-semibold ${accent.text} opacity-80`}>{apt.date}</span>
                    </>
                  )}
                  <div className={`mt-2 h-1.5 w-1.5 rounded-full ${accent.dot}`} />
                </div>

                {/* ── Main content ───────────────────────────────── */}
                <div className="min-w-0 flex-1 px-5 py-4">

                  {/* Row 1: service + badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: apt.iconBg }}>
                        <Icon size={16} style={{ color: apt.iconColor }} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold text-slate-900">{apt.service}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                          <span className="font-semibold text-slate-800">{apt.pet}</span>
                          {apt.doctor && (
                            <><span className="text-slate-300">·</span><span className="truncate">{apt.doctor}</span></>
                          )}
                          {apt.room && (
                            <><span className="text-slate-300">·</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin size={10} className="text-slate-400" />{apt.room}
                            </span></>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className="rounded-lg px-2.5 py-1 text-[11px] font-bold" style={{ background: svcCfg.bg, color: svcCfg.color }}>
                        {apt.serviceType}
                      </span>
                      <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${statusCfg.badgeCls}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: meta chips */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {!isBoarding && apt.time && (
                      <span className="flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[12px] font-semibold text-slate-600">
                        <Clock size={11} className="text-slate-400" /> {apt.date} lúc {apt.time}
                      </span>
                    )}
                    {apt.queue && (
                      <span className="rounded-lg border border-violet-100 bg-violet-50 px-2.5 py-1 text-[12px] font-semibold text-violet-700">
                        Số thứ tự: {apt.queue}
                      </span>
                    )}
                    {apt.hasPrescription && (
                      <span className="flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-700">
                        <Pill size={11} /> Có đơn thuốc
                      </span>
                    )}
                  </div>

                  {/* Row 3: progress */}
                  <ProgressTrack status={apt.status} isBoarding={isBoarding} />

                  {/* Row 4: actions */}
                  {canAction && (
                    <div className="mt-4 flex gap-2.5" onClick={e => e.stopPropagation()}>
                      {!isBoarding && (
                        <button
                          onClick={() => onRescheduleAppointment(apt)}
                          className="h-9 flex-1 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          Đổi lịch
                        </button>
                      )}
                      <button
                        onClick={() => onCancelAppointment(apt.id)}
                        className="h-9 flex-1 rounded-lg border border-red-100 bg-red-50 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                      >
                        {isBoarding ? "Hủy đặt phòng" : "Hủy lịch"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────── */}
      {!appointmentsLoading && !appointmentsError && appointmentSummary.filtered > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3">
          <span className="text-sm font-semibold text-slate-500">
            Hiển thị {appointmentPagination.from}–{appointmentPagination.to} / {appointmentPagination.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAppointmentsPage(p => Math.max(1, p - 1))}
              disabled={appointmentPagination.page === 1}
              className="h-9 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              Trước
            </button>
            <span className="min-w-[60px] rounded-lg bg-cyan-50 px-3 py-2 text-center text-sm font-bold text-cyan-700">
              {appointmentPagination.page} / {appointmentPagination.pageCount}
            </span>
            <button
              type="button"
              onClick={() => setAppointmentsPage(p => Math.min(appointmentsPageCount, p + 1))}
              disabled={appointmentPagination.page === appointmentPagination.pageCount}
              className="h-9 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
