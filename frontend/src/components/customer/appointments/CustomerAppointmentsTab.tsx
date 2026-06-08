import type { Dispatch, SetStateAction } from "react";
import { AlertTriangle, Calendar, Check, ChevronDown, Clock, Heart, MapPin, Pill, Plus, Stethoscope } from "lucide-react";
import type {
  CustomerAppointmentListPayload,
  CustomerAppointmentStatusFilter,
} from "../../../types/customer/appointments";
import type { Apt, Pet, ServiceType } from "../../../types/customer/portal";
import { getServiceTypeConfig, getStatusConfig } from "../../../utils/customer/portalConfig";

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
  onViewAppointment: (appointment: Apt) => void;
  onRescheduleAppointment: (appointment: Apt) => void;
  onCancelAppointment: (appointmentId: string) => void;
  setStatusFilter: (status: CustomerAppointmentStatusFilter) => void;
  setPetFilter: (pet: string) => void;
  setServiceTypeFilter: (serviceType: ServiceType | "all") => void;
  setOpenAptFilter: Dispatch<SetStateAction<AppointmentFilterMenu>>;
  setAppointmentsPage: Dispatch<SetStateAction<number>>;
};

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
  openAptFilter,
  serviceFilterOptions,
  selectedPetLabel,
  selectedServiceLabel,
  onBookAppointment,
  onViewAppointment,
  onRescheduleAppointment,
  onCancelAppointment,
  setStatusFilter,
  setPetFilter,
  setServiceTypeFilter,
  setOpenAptFilter,
  setAppointmentsPage,
}: CustomerAppointmentsTabProps) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lịch hẹn của tôi</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Theo dõi và lọc lịch hẹn chăm sóc thú cưng</p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex w-full flex-1 gap-1 overflow-x-auto">
            {[
              { id: "all" as const, label: "Tất cả" },
              { id: "upcoming" as const, label: "Sắp tới" },
              { id: "in_progress" as const, label: "Đang xử lý" },
              { id: "completed" as const, label: "Đã hoàn thành" },
              { id: "cancelled" as const, label: "Đã hủy" },
            ].map((status) => {
              const active = statusFilter === status.id;
              const count = appointmentSummary.statusCounts.find((item) => item.status === status.id)?.count ?? 0;
              return (
                <button
                  key={status.id}
                  onClick={() => setStatusFilter(status.id)}
                  className={`h-10 min-w-fit flex-1 whitespace-nowrap px-4 rounded-xl text-sm font-bold transition-all ${
                    active ? "bg-cyan-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {status.label} <span className={active ? "opacity-80" : "text-slate-400"}>({count})</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={onBookAppointment}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-95 lg:h-11"
            style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
          >
            <Plus size={16} strokeWidth={2.5} /> Đặt lịch mới
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="group relative flex h-14 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all focus-within:border-cyan-300 focus-within:ring-4 focus-within:ring-cyan-500/10">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <Heart size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <label className="block text-[12px] font-bold uppercase tracking-wide text-slate-400">Thú cưng</label>
              <button
                type="button"
                onClick={() => setOpenAptFilter((current) => current === "pet" ? null : "pet")}
                className="mt-0.5 flex w-full items-center justify-between gap-3 text-left text-[15px] font-extrabold leading-tight text-slate-900 outline-none"
              >
                <span className="truncate">{selectedPetLabel}</span>
                <ChevronDown size={17} className={`flex-shrink-0 text-slate-700 transition-transform ${openAptFilter === "pet" ? "rotate-180" : ""}`} strokeWidth={2.75} />
              </button>
            </div>
            {openAptFilter === "pet" && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                {[{ value: "all", label: "Tất cả" }, ...pets.map((pet) => ({ value: pet.name, label: pet.name }))].map((option) => {
                  const selected = petFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setPetFilter(option.value);
                        setOpenAptFilter(null);
                      }}
                      className={`flex h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-extrabold transition-colors ${
                        selected ? "bg-cyan-50 text-cyan-700" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{option.label}</span>
                      {selected && <Check size={15} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="group relative flex h-14 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all focus-within:border-cyan-300 focus-within:ring-4 focus-within:ring-cyan-500/10">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <Stethoscope size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <label className="block text-[12px] font-bold uppercase tracking-wide text-slate-400">Dịch vụ</label>
              <button
                type="button"
                onClick={() => setOpenAptFilter((current) => current === "service" ? null : "service")}
                className="mt-0.5 flex w-full items-center justify-between gap-3 text-left text-[15px] font-extrabold leading-tight text-slate-900 outline-none"
              >
                <span className="truncate">{selectedServiceLabel}</span>
                <ChevronDown size={17} className={`flex-shrink-0 text-slate-700 transition-transform ${openAptFilter === "service" ? "rotate-180" : ""}`} strokeWidth={2.75} />
              </button>
            </div>
            {openAptFilter === "service" && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                {serviceFilterOptions.map((option) => {
                  const selected = serviceTypeFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setServiceTypeFilter(option.value);
                        setOpenAptFilter(null);
                      }}
                      className={`flex h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-extrabold transition-colors ${
                        selected ? "bg-cyan-50 text-cyan-700" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{option.label}</span>
                      {selected && <Check size={15} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

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
            <button
              onClick={onBookAppointment}
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
            >
              <Plus size={16} /> Đặt lịch ngay
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const Icon = appointment.icon;
              const statusConfig = getStatusConfig(appointment.status);
              const serviceTypeConfig = getServiceTypeConfig(appointment.serviceType);
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
                            <span className="font-semibold text-slate-700">{appointment.pet}</span> • {appointment.doctor}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg" style={{ background: serviceTypeConfig.bg, color: serviceTypeConfig.color }}>
                            {appointment.serviceType}
                          </span>
                          <span className="px-3 py-1.5 text-xs font-bold rounded-lg ring-1 ring-inset" style={{ background: statusConfig.bg, color: statusConfig.color, ringColor: statusConfig.ring }}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 flex-wrap">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Calendar size={16} className="text-slate-400" /> {appointment.date}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Clock size={16} className="text-slate-400" /> {appointment.time}
                        </div>
                        {appointment.room && (
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <MapPin size={16} className="text-slate-400" /> {appointment.room}
                          </div>
                        )}
                        {appointment.queue && (
                          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-600">
                            <span className="text-[11px] font-bold bg-cyan-50 px-2 py-1 rounded-md">Số thứ tự: {appointment.queue}</span>
                          </div>
                        )}
                      </div>
                      {appointment.prescriptions && appointment.prescriptions.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-800">
                            <Pill size={16} />
                            Đơn thuốc
                          </div>
                          <div className="space-y-2">
                            {appointment.prescriptions.map((item, index) => (
                              <div key={`${item.medicineName}-${index}`} className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-emerald-100">
                                <span className="font-bold text-slate-900">{item.medicineName}</span>
                                {[item.dosage, item.frequency, item.durationDays ? `${item.durationDays} ngày` : "", item.instructions]
                                  .filter(Boolean)
                                  .map((value) => ` · ${value}`)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
                    <div className="flex gap-3 mt-5" onClick={(event) => event.stopPropagation()}>
                      <button
                        onClick={() => onRescheduleAppointment(appointment)}
                        className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Đổi lịch
                      </button>
                      <button
                        onClick={() => onCancelAppointment(appointment.id)}
                        className="flex-1 h-11 border border-red-100 text-red-600 bg-red-50 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                      >
                        Hủy lịch
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!appointmentsLoading && !appointmentsError && appointmentSummary.filtered > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-slate-500">
              Hiển thị {appointmentPagination.from}-{appointmentPagination.to} / {appointmentPagination.total} lịch hẹn
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAppointmentsPage((page) => Math.max(1, page - 1))}
                disabled={appointmentPagination.page === 1}
                className="h-9 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                Trước
              </button>
              <span className="rounded-xl bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-700">
                {appointmentPagination.page}/{appointmentPagination.pageCount}
              </span>
              <button
                type="button"
                onClick={() => setAppointmentsPage((page) => Math.min(appointmentsPageCount, page + 1))}
                disabled={appointmentPagination.page === appointmentPagination.pageCount}
                className="h-9 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
