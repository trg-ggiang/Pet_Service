import type { Dispatch, SetStateAction } from "react";
import { AlertTriangle, BedDouble, Calendar, Check, ChevronDown, Clock, MapPin, Pill, Plus, Stethoscope } from "lucide-react";
import type {
  CustomerAppointmentListPayload,
  CustomerAppointmentStatusFilter,
} from "../../../types/customer/appointments";
import type { Apt, Pet, ServiceType } from "../../../types/customer/portal";
import { getServiceTypeConfig, getStatusConfig } from "../../../utils/customer/portalConfig";

// Unused but kept to avoid breaking CustomerPortal props
type AppointmentFilterMenu = "pet" | "service" | null;

type ServiceFilterOption = {
  value: ServiceType | "all";
  label: string;
};

type CustomerAppointmentsTabProps = {
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
  onViewAppointment: (appointment: Apt) => void;
  onRescheduleAppointment: (appointment: Apt) => void;
  onCancelAppointment: (appointmentId: string) => void;
  setStatusFilter: (status: CustomerAppointmentStatusFilter) => void;
  setPetFilter: (pet: string) => void;
  setServiceTypeFilter: (serviceType: ServiceType | "all") => void;
  setOpenAptFilter: Dispatch<SetStateAction<AppointmentFilterMenu>>;
  setAppointmentsPage: Dispatch<SetStateAction<number>>;
};

const STEP_CONFIGS = {
  normal: [
    { key: "booked",     label: "Đặt lịch" },
    { key: "confirmed",  label: "Xác nhận" },
    { key: "checkin",    label: "Check-in" },
    { key: "inprogress", label: "Thực hiện" },
    { key: "done",       label: "Hoàn thành" },
  ],
  boarding: [
    { key: "booked",     label: "Đặt phòng" },
    { key: "confirmed",  label: "Xác nhận" },
    { key: "checkin",    label: "Check-in" },
    { key: "inprogress", label: "Lưu trú" },
    { key: "done",       label: "Trả phòng" },
  ],
};

function getActiveStep(status: string) {
  if (status === "PENDING")    return 0;
  if (status === "CONFIRMED")  return 1;
  if (status === "CHECKED_IN") return 2;
  if (status === "IN_PROGRESS") return 3;
  if (status === "COMPLETED")  return 4;
  return -1; // cancelled / no-show
}

function AppointmentProgressBar({ status, isBoarding }: { status: string; isBoarding: boolean }) {
  const steps = isBoarding ? STEP_CONFIGS.boarding : STEP_CONFIGS.normal;
  const activeStep = getActiveStep(status);
  const isCancelled = status === "CANCELLED" || status === "NO_SHOW";

  if (isCancelled) {
    return (
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
        <div className="w-full h-1.5 rounded-full bg-red-100 flex-1" />
        <span className="text-[11px] font-bold text-red-400 flex-shrink-0">Đã hủy</span>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center gap-0">
        {steps.map((step, idx) => {
          const isCompleted = idx <= activeStep;
          const isActive = idx === activeStep;
          return (
            <div key={step.key} className="flex-1 flex items-center">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-cyan-500 shadow-sm shadow-cyan-200"
                      : "bg-slate-100 border border-slate-200"
                  } ${isActive ? "ring-2 ring-cyan-300 ring-offset-1" : ""}`}
                >
                  {isCompleted ? (
                    <Check size={12} className="text-white" strokeWidth={3} />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  )}
                </div>
                <span className={`text-[10px] font-semibold whitespace-nowrap ${isCompleted ? "text-cyan-600" : "text-slate-400"}`}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-4 rounded-full ${isCompleted && idx < activeStep ? "bg-cyan-300" : "bg-slate-100"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
}: CustomerAppointmentsTabProps) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">

      {/* ── Title row ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lịch hẹn của tôi</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Theo dõi và lọc lịch hẹn chăm sóc thú cưng</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {onBookBoarding && (
            <button
              onClick={onBookBoarding}
              className="flex items-center gap-2 h-10 px-4 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
              style={{ background: "linear-gradient(135deg,#1D4ED8,#3B82F6)" }}
            >
              <BedDouble size={15} strokeWidth={2.5} />
              <span className="hidden sm:inline">Đặt phòng lưu trú</span>
            </button>
          )}
          <button
            onClick={onBookAppointment}
            className="flex items-center gap-2 h-10 px-5 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
            style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Đặt lịch mới</span>
          </button>
        </div>
      </div>

      {/* ── Status filter tabs ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex gap-1 overflow-x-auto">
        {[
          { id: "all"         as const, label: "Tất cả" },
          { id: "upcoming"    as const, label: "Sắp tới" },
          { id: "in_progress" as const, label: "Đang xử lý" },
          { id: "completed"   as const, label: "Đã hoàn thành" },
          { id: "cancelled"   as const, label: "Đã hủy" },
        ].map((status) => {
          const active = statusFilter === status.id;
          const count  = appointmentSummary.statusCounts.find((item) => item.status === status.id)?.count ?? 0;
          return (
            <button
              key={status.id}
              onClick={() => setStatusFilter(status.id)}
              className={`h-9 min-w-fit flex-1 whitespace-nowrap px-4 rounded-xl text-sm font-bold transition-all ${active ? "bg-cyan-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {status.label} <span className={active ? "opacity-80" : "text-slate-400"}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Inline filters (native select — no z-index issues) ─────────── */}
      <div className="flex gap-3 flex-wrap">
        {/* Pet filter */}
        <div className="relative flex-1 min-w-[160px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-rose-400">
            <svg viewBox="0 0 80 80" className="w-4 h-4" fill="currentColor">
              <ellipse cx="40" cy="54" rx="18" ry="15" />
              <ellipse cx="18" cy="35" rx="8.5" ry="10" />
              <ellipse cx="32" cy="27" rx="8" ry="9.5" />
              <ellipse cx="48" cy="27" rx="8" ry="9.5" />
              <ellipse cx="62" cy="35" rx="8.5" ry="10" />
            </svg>
          </div>
          <select
            value={petFilter}
            onChange={(e) => { setPetFilter(e.target.value); setAppointmentsPage(1 as unknown as number); }}
            className="w-full h-11 pl-9 pr-9 bg-white border border-slate-200 rounded-2xl text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all shadow-sm"
          >
            <option value="all">Tất cả thú cưng</option>
            {pets.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Service type filter */}
        <div className="relative flex-1 min-w-[160px]">
          <Stethoscope size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-500" />
          <select
            value={serviceTypeFilter}
            onChange={(e) => { setServiceTypeFilter(e.target.value as ServiceType | "all"); setAppointmentsPage(1 as unknown as number); }}
            className="w-full h-11 pl-9 pr-9 bg-white border border-slate-200 rounded-2xl text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all shadow-sm"
          >
            {serviceFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* ── Appointment list ────────────────────────────────────────────── */}

      {appointmentsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200">
          <Clock className="w-10 h-10 text-cyan-500 mb-4 animate-pulse" />
          <h3 className="text-base font-bold text-slate-700">Đang tải lịch hẹn</h3>
        </div>
      ) : appointmentsError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-red-200">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
          <h3 className="text-base font-bold text-slate-700">Không thể tải lịch hẹn</h3>
          <p className="text-sm text-red-500 mt-1">{appointmentsError}</p>
        </div>
      ) : appointmentSummary.filtered === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Calendar size={26} className="text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-700">Không tìm thấy lịch hẹn</h3>
          <p className="text-sm text-slate-400 mt-1 mb-5">Thử thay đổi bộ lọc hoặc đặt lịch mới</p>
          <button onClick={onBookAppointment} className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
            <Plus size={16} /> Đặt lịch ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const Icon = appointment.icon;
            const statusConfig      = getStatusConfig(appointment.status);
            const serviceTypeConfig = getServiceTypeConfig(appointment.serviceType);
            const isBoarding = appointment.serviceType === "Lưu trú";
            const canAction  = appointment.status === "PENDING" || appointment.status === "CONFIRMED";

            return (
              <div
                key={appointment.id}
                onClick={() => onViewAppointment(appointment)}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: appointment.iconBg }}>
                    <Icon size={24} style={{ color: appointment.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold text-slate-900">{appointment.service}</div>
                        <div className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{appointment.pet}</span>
                          {appointment.doctor && <><span>•</span>{appointment.doctor}</>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg" style={{ background: serviceTypeConfig.bg, color: serviceTypeConfig.color }}>
                          {appointment.serviceType}
                        </span>
                        <span className="px-3 py-1.5 text-xs font-bold rounded-lg ring-1 ring-inset" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 flex-wrap">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Calendar size={16} className="text-slate-400" />
                        {isBoarding ? (
                          <span>{appointment.date}{appointment.note ? ` → ${appointment.note.split("–")[1]?.trim() || ""}` : ""}</span>
                        ) : appointment.date}
                      </div>
                      {!isBoarding && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Clock size={16} className="text-slate-400" /> {appointment.time}
                        </div>
                      )}
                      {appointment.room && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <MapPin size={16} className="text-slate-400" /> {appointment.room}
                        </div>
                      )}
                      {appointment.queue && (
                        <span className="text-[11px] font-bold bg-cyan-50 text-cyan-700 px-2 py-1 rounded-md">Số thứ tự: {appointment.queue}</span>
                      )}
                      {isBoarding && (
                        <span className="text-[11px] font-bold bg-violet-50 text-violet-600 px-2 py-1 rounded-md flex items-center gap-1">
                          <BedDouble size={11} /> Lưu trú
                        </span>
                      )}
                    </div>

                    {appointment.hasPrescription && (
                      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 flex items-center gap-2">
                        <Pill size={14} className="text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-800">Có đơn thuốc kèm theo</span>
                      </div>
                    )}

                    <AppointmentProgressBar status={appointment.status} isBoarding={isBoarding} />

                    {/* Actions: hide Đổi lịch for boarding */}
                    {canAction && (
                      <div className="flex gap-3 mt-5" onClick={(e) => e.stopPropagation()}>
                        {!isBoarding && (
                          <button
                            onClick={() => onRescheduleAppointment(appointment)}
                            className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Đổi lịch
                          </button>
                        )}
                        <button
                          onClick={() => onCancelAppointment(appointment.id)}
                          className={`${isBoarding ? "flex-1" : "flex-1"} h-11 border border-red-100 text-red-600 bg-red-50 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors`}
                        >
                          {isBoarding ? "Hủy đặt phòng" : "Hủy lịch"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {!appointmentsLoading && !appointmentsError && appointmentSummary.filtered > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-slate-500">
            Hiển thị {appointmentPagination.from}–{appointmentPagination.to} / {appointmentPagination.total} lịch hẹn
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setAppointmentsPage((p) => Math.max(1, p - 1))} disabled={appointmentPagination.page === 1} className="h-9 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40">
              Trước
            </button>
            <span className="rounded-xl bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-700">
              {appointmentPagination.page}/{appointmentPagination.pageCount}
            </span>
            <button type="button" onClick={() => setAppointmentsPage((p) => Math.min(appointmentsPageCount, p + 1))} disabled={appointmentPagination.page === appointmentPagination.pageCount} className="h-9 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40">
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
