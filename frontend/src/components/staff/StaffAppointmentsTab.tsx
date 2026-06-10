import { useEffect, useMemo, useState } from "react";
import { Activity, Calendar, CheckCircle2, Clock, Eye, Search, Send, Stethoscope, User } from "lucide-react";
import type { StaffAppointment } from "../../features/staff/services/staffAppointments";
import {
  DateFilterBar,
  EmptyState,
  LoadingState,
  Pagination,
  getDefaultDateFilter,
  matchesDateFilter,
  todayYmd,
  type DateFilterState,
} from "./StaffCommon";
import { APT_STATUS_CONFIG, SERVICE_ICONS } from "./staffPortalConfig";

const PAGE_SIZE = 10;

function ProviderBadge({
  doctorName,
  roomName,
  staffName,
}: {
  doctorName?: string | null;
  roomName?: string | null;
  staffName?: string | null;
}) {
  if (doctorName) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-cyan-700 font-medium">
        <Stethoscope size={11} className="flex-shrink-0" />
        <span>{doctorName}</span>
        {roomName && <span className="text-slate-400 font-normal">· {roomName}</span>}
      </div>
    );
  }
  if (staffName) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-orange-600 font-medium">
        <User size={11} className="flex-shrink-0" />
        <span>{staffName}</span>
      </div>
    );
  }
  return <span className="text-xs text-slate-400">Chưa phân công</span>;
}

function ConfirmQueue({
  appointments,
  loading,
  onViewDetails,
  onConfirm,
  onApproveRequest,
  approvingAppointmentId,
}: {
  appointments: StaffAppointment[];
  loading: boolean;
  onViewDetails: (apt: StaffAppointment) => void;
  onConfirm: (apt: StaffAppointment) => void;
  onApproveRequest: (apt: StaffAppointment) => void;
  approvingAppointmentId?: number | null;
}) {
  return (
    <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between" style={{ background: "#FFFBEB" }}>
        <div>
          <h3 className="text-sm font-bold text-amber-900">Lịch hẹn chờ xác nhận</h3>
          <p className="text-[11px] text-amber-700 mt-0.5 font-medium">Sắp tới · Từ hôm nay</p>
        </div>
        <span className="text-[11px] font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full">
          {appointments.length}
        </span>
      </div>

      {loading ? (
        <LoadingState label="Đang tải..." />
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14">
          <CheckCircle2 size={36} className="text-emerald-300 mb-2" />
          <p className="text-sm text-slate-500 font-medium">Không có lịch hẹn chờ xác nhận</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-y-auto" style={{ maxHeight: 580 }}>
          {appointments.map((apt) => {
            const svcIcon = SERVICE_ICONS[apt.serviceType] || SERVICE_ICONS.exam;
            const Icon = svcIcon.icon;
            const isApproving = approvingAppointmentId === apt.appointmentId;

            return (
              <div key={apt.id} className="px-5 py-4 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: svcIcon.bg }}>
                    <Icon size={16} style={{ color: svcIcon.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {apt.petName}
                          <span className="ml-1.5 text-xs font-normal text-slate-500">{apt.species}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">{apt.owner} · {apt.phone}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-bold text-slate-800">{apt.date}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{apt.time || "--:--"}</div>
                      </div>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">{apt.service}</span>
                      <ProviderBadge doctorName={apt.doctorName} roomName={apt.roomName} staffName={apt.staffName} />
                    </div>

                    {apt.pendingRequest && (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
                        {apt.pendingRequest.type === "RESCHEDULE" ? "Yêu cầu đổi lịch" : "Yêu cầu hủy lịch"}
                        {apt.pendingRequest.type === "RESCHEDULE" && apt.pendingRequest.date && (
                          <span className="ml-1 font-normal text-amber-700">
                            → {apt.pendingRequest.date} {String(apt.pendingRequest.time || "").slice(0, 5)}
                          </span>
                        )}
                        {apt.pendingRequest.reason && (
                          <div className="mt-0.5 font-normal text-amber-700">Lý do: {apt.pendingRequest.reason}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => onViewDetails(apt)}
                    className="flex-1 h-8 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye size={12} /> Chi tiết
                  </button>
                  {apt.pendingRequest ? (
                    <button
                      onClick={() => onApproveRequest(apt)}
                      disabled={isApproving}
                      className="flex-1 h-8 rounded-lg text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1 disabled:opacity-60"
                    >
                      <Send size={12} /> {isApproving ? "Đang duyệt..." : "Duyệt"}
                    </button>
                  ) : (
                    <button
                      onClick={() => onConfirm(apt)}
                      className="flex-1 h-8 rounded-lg text-xs font-bold text-white transition-colors flex items-center justify-center gap-1"
                      style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
                    >
                      <CheckCircle2 size={12} /> Xác nhận
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppointmentsTab({
  appointments,
  loading,
  error,
  onViewDetails,
  onConfirm,
  onCheckIn,
  onCompleteGrooming,
  onApproveRequest,
  approvingAppointmentId,
  completingGroomingAppointmentId,
}: {
  appointments: StaffAppointment[];
  loading: boolean;
  error: string | null;
  onViewDetails: (apt: StaffAppointment) => void;
  onConfirm: (apt: StaffAppointment) => void;
  onCheckIn: (apt: StaffAppointment) => void;
  onCompleteGrooming: (apt: StaffAppointment) => void;
  onApproveRequest: (apt: StaffAppointment) => void;
  approvingAppointmentId?: number | null;
  completingGroomingAppointmentId?: number | null;
}) {
  const [dateFilter, setDateFilter] = useState<DateFilterState>(getDefaultDateFilter);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const today = todayYmd();

  // Left column: PENDING (status="scheduled") from today onwards, sorted by date+time
  const pendingConfirmation = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "scheduled" && (!a.rawDate || a.rawDate >= today))
        .sort((a, b) => {
          const da = a.rawDate || "9999";
          const db = b.rawDate || "9999";
          if (da !== db) return da < db ? -1 : 1;
          return (a.time || "") < (b.time || "") ? -1 : 1;
        }),
    [appointments, today],
  );

  // Right column: confirmed (chờ check-in) + in_progress (đang thực hiện)
  const activeAppointments = useMemo(
    () => appointments.filter((a) => a.status === "confirmed" || a.status === "in_progress"),
    [appointments],
  );

  useEffect(() => { setPage(1); }, [dateFilter, search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeAppointments.filter((apt) => {
      if (!matchesDateFilter(apt.date, dateFilter)) return false;
      if (q && !apt.petName.toLowerCase().includes(q) && !apt.owner.toLowerCase().includes(q) && !apt.service.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeAppointments, dateFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Chờ xác nhận", value: pendingConfirmation.length, icon: Clock, color: "#D97706", bg: "#FFFBEB" },
          { label: "Chờ check-in", value: appointments.filter((a) => a.status === "confirmed").length, icon: CheckCircle2, color: "#0891B2", bg: "#ECFEFF" },
          { label: "Đang thực hiện", value: appointments.filter((a) => a.status === "in_progress").length, icon: Activity, color: "#DC2626", bg: "#FEF2F2" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <Icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 font-medium">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "420px 1fr" }}>
        {/* Left: confirmation queue */}
        <ConfirmQueue
          appointments={pendingConfirmation}
          loading={loading}
          onViewDetails={onViewDetails}
          onConfirm={onConfirm}
          onApproveRequest={onApproveRequest}
          approvingAppointmentId={approvingAppointmentId}
        />

        {/* Right: active appointments */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-bold text-slate-900">Lịch trong ngày</h3>
              <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
            </div>
            <div className="relative flex-shrink-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm thú cưng, chủ nhân..."
                className="h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all w-52"
              />
            </div>
          </div>

          {loading ? (
            <LoadingState label="Đang tải danh sách lịch hẹn..." />
          ) : error ? (
            <EmptyState icon={Calendar} label={error} />
          ) : pageData.length === 0 ? (
            <EmptyState
              icon={Calendar}
              label={
                filtered.length === 0
                  ? "Không có lịch hẹn đang hoạt động trong khoảng thời gian này"
                  : "Không tìm thấy kết quả"
              }
            />
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {pageData.map((apt) => {
                  const statusCfg = APT_STATUS_CONFIG[apt.status];
                  const svcIcon = SERVICE_ICONS[apt.serviceType] || SERVICE_ICONS.exam;
                  const Icon = svcIcon.icon;
                  const isCompletingGrooming = completingGroomingAppointmentId === apt.appointmentId;

                  return (
                    <div key={apt.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="w-20 text-center flex-shrink-0 pt-0.5">
                        <div className="text-sm font-bold font-mono text-slate-900">{apt.time || "--:--"}</div>
                        <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{apt.date || "Chưa có ngày"}</div>
                        {apt.queue && <div className="text-[10px] font-semibold text-cyan-500 mt-0.5">{apt.queue}</div>}
                      </div>
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: svcIcon.bg }}>
                          <Icon size={18} style={{ color: svcIcon.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-slate-900">
                            {apt.petName}
                            <span className="ml-2 text-xs font-normal text-slate-500">{apt.species} - {apt.breed}</span>
                          </div>
                          <div className="text-xs text-slate-500 truncate mt-0.5">{apt.owner} · {apt.service}</div>
                          <div className="mt-1">
                            <ProviderBadge doctorName={apt.doctorName} roomName={apt.roomName} staffName={apt.staffName} />
                          </div>
                          {apt.pendingRequest && (
                            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                              <div>{apt.pendingRequest.type === "RESCHEDULE" ? "Yêu cầu đổi lịch" : "Yêu cầu hủy lịch"}</div>
                              {apt.pendingRequest.type === "RESCHEDULE" && (
                                <div className="mt-0.5 text-amber-700">
                                  Lịch mới: {apt.pendingRequest.date || "--"} {String(apt.pendingRequest.time || "").slice(0, 5)}
                                </div>
                              )}
                              {apt.pendingRequest.reason && (
                                <div className="mt-0.5 text-amber-700">Lý do: {apt.pendingRequest.reason}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 mt-0.5"
                        style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}
                      >
                        {statusCfg.label}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => onViewDetails(apt)}
                          className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                        >
                          <Eye size={14} /> Chi tiết
                        </button>
                        {apt.pendingRequest ? (
                          <button
                            onClick={() => onApproveRequest(apt)}
                            disabled={approvingAppointmentId === apt.appointmentId}
                            className="h-9 px-4 rounded-lg text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-wait"
                          >
                            <Send size={14} /> {approvingAppointmentId === apt.appointmentId ? "Đang duyệt..." : "Duyệt yêu cầu"}
                          </button>
                        ) : apt.status === "in_progress" && apt.serviceType === "grooming" ? (
                          <button
                            onClick={() => onCompleteGrooming(apt)}
                            disabled={isCompletingGrooming}
                            className="h-9 px-4 rounded-lg bg-emerald-500 text-sm font-bold text-white transition-colors hover:bg-emerald-600 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-wait"
                          >
                            <CheckCircle2 size={14} /> {isCompletingGrooming ? "Đang hoàn thành..." : "Hoàn thành"}
                          </button>
                        ) : apt.status === "confirmed" && (
                          <button
                            onClick={() => onCheckIn(apt)}
                            className="h-9 px-4 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-1.5"
                            style={{ background: "linear-gradient(135deg,#7C3AED,#8B5CF6)" }}
                          >
                            <CheckCircle2 size={14} /> Check-in
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
