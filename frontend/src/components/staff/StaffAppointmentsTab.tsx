import { useEffect, useMemo, useState } from "react";
import {
  Activity, Calendar, CheckCircle2,
  Eye, Search, Send, Stethoscope, Trash2, User,
} from "lucide-react";
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

const PAGE_SIZE = 12;

/* ── Shared sub-components ──────────────────────────────────────────── */

function ProviderBadge({
  doctorName, roomName, staffName,
}: {
  doctorName?: string | null;
  roomName?: string | null;
  staffName?: string | null;
}) {
  if (doctorName) {
    return (
      <div className="flex items-center gap-1 text-xs font-semibold text-cyan-700">
        <Stethoscope size={10} className="flex-shrink-0" />
        <span>{doctorName}</span>
        {roomName && <span className="font-normal text-slate-400">· {roomName}</span>}
      </div>
    );
  }
  if (staffName) {
    return (
      <div className="flex items-center gap-1 text-xs font-semibold text-orange-600">
        <User size={10} className="flex-shrink-0" />
        <span>{staffName}</span>
      </div>
    );
  }
  return <span className="text-[11px] text-slate-400">Chưa phân công</span>;
}

function PendingRequestBadge({ request }: {
  request: NonNullable<StaffAppointment["pendingRequest"]>;
}) {
  const isReschedule = request.type === "RESCHEDULE";
  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-relaxed">
      <span className="font-bold text-amber-800">
        {isReschedule ? "Yêu cầu đổi lịch" : "Yêu cầu hủy lịch"}
      </span>
      {isReschedule && request.date && (
        <span className="ml-1 font-semibold text-amber-700">
          → {request.date} {String(request.time || "").slice(0, 5)}
        </span>
      )}
      {request.reason && (
        <div className="mt-0.5 text-amber-700">Lý do: {request.reason}</div>
      )}
    </div>
  );
}

/* ── Left column: Pending confirmation queue ────────────────────────── */

function ConfirmQueue({
  appointments, loading,
  onViewDetails, onConfirm, onApproveRequest, onDelete,
  approvingAppointmentId,
}: {
  appointments: StaffAppointment[];
  loading: boolean;
  onViewDetails: (apt: StaffAppointment) => void;
  onConfirm: (apt: StaffAppointment) => void;
  onApproveRequest: (apt: StaffAppointment) => void;
  onDelete: (apt: StaffAppointment) => void;
  approvingAppointmentId?: number | null;
}) {
  return (
    <div className="flex flex-col min-h-0 h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-amber-100"
        style={{ background: "#FFFBEB" }}
      >
        <div>
          <h3 className="text-sm font-black text-amber-900">Chờ xác nhận</h3>
          <p className="mt-0.5 text-[11px] font-medium text-amber-700">Sắp tới · Từ hôm nay</p>
        </div>
        <span className="min-w-[28px] rounded-full bg-amber-500 px-2.5 py-1 text-center text-xs font-black text-white">
          {appointments.length}
        </span>
      </div>

      {loading ? (
        <LoadingState label="Đang tải..." />
      ) : appointments.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 size={36} className="mb-3 text-emerald-300" />
          <p className="text-sm font-semibold text-slate-500">Không có lịch chờ xác nhận</p>
          <p className="mt-1 text-xs text-slate-400">Tất cả đã được xử lý</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 divide-y divide-slate-100 overflow-y-auto">
          {appointments.map((apt) => {
            const svcCfg  = SERVICE_ICONS[apt.serviceType] ?? SERVICE_ICONS.exam;
            const SvcIcon = svcCfg.icon;
            const isApproving = approvingAppointmentId === apt.appointmentId;

            return (
              <div
                key={apt.id}
                className="relative px-4 py-4 hover:bg-slate-50/60 transition-colors"
                style={{ borderLeft: `3px solid ${svcCfg.color}` }}
              >
                {/* Service row + date */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ background: svcCfg.bg }}
                    >
                      <SvcIcon size={15} style={{ color: svcCfg.color }} />
                    </div>
                    <span className="truncate text-sm font-bold text-slate-800">{apt.service}</span>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs font-bold text-slate-700">{apt.date}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400">{apt.time || "--:--"}</div>
                  </div>
                </div>

                {/* Pet + owner */}
                <div className="mb-2.5">
                  <div className="text-sm font-bold text-slate-900">
                    {apt.petName}
                    <span className="ml-1.5 text-xs font-normal text-slate-500">{apt.species}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {apt.owner} · {apt.phone}
                  </div>
                  <div className="mt-1">
                    <ProviderBadge doctorName={apt.doctorName} roomName={apt.roomName} staffName={apt.staffName} />
                  </div>
                </div>

                {apt.pendingRequest && <PendingRequestBadge request={apt.pendingRequest} />}

                {/* Action buttons */}
                <div className="mt-3 flex items-center gap-1.5">
                  <button
                    onClick={() => onViewDetails(apt)}
                    className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <Eye size={12} /> Chi tiết
                  </button>
                  <button
                    onClick={() => apt.pendingRequest ? onApproveRequest(apt) : onConfirm(apt)}
                    disabled={isApproving}
                    className="flex flex-1 h-8 items-center justify-center gap-1 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-60"
                    style={{
                      background: apt.pendingRequest
                        ? "linear-gradient(135deg,#059669,#10B981)"
                        : "linear-gradient(135deg,#0891B2,#06B6D4)",
                    }}
                  >
                    {apt.pendingRequest ? (
                      <><Send size={12} />{isApproving ? "Đang duyệt..." : "Duyệt"}</>
                    ) : (
                      <><CheckCircle2 size={12} />Xác nhận</>
                    )}
                  </button>
                  <button
                    onClick={() => onDelete(apt)}
                    title="Xóa lịch hẹn"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Right column tabs ──────────────────────────────────────────────── */

type ActiveTab = "all" | "confirmed" | "in_progress";

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "all",         label: "Tất cả"       },
  { id: "confirmed",   label: "Chờ check-in" },
  { id: "in_progress", label: "Đang xử lý"   },
];

/* ── Main export ────────────────────────────────────────────────────── */

export function AppointmentsTab({
  appointments,
  loading,
  error,
  onViewDetails,
  onConfirm,
  onCheckIn,
  onCompleteGrooming,
  onApproveRequest,
  onDelete,
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
  onDelete: (apt: StaffAppointment) => void;
  approvingAppointmentId?: number | null;
  completingGroomingAppointmentId?: number | null;
}) {
  const today = todayYmd();
  const [activeTab, setActiveTab]   = useState<ActiveTab>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(getDefaultDateFilter);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);

  const pendingConfirmation = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "scheduled" && (!a.rawDate || a.rawDate >= today))
        .sort((a, b) => {
          const da = a.rawDate || "9999";
          const db = b.rawDate || "9999";
          return da !== db ? (da < db ? -1 : 1) : (a.time || "") < (b.time || "") ? -1 : 1;
        }),
    [appointments, today],
  );

  const confirmedCount  = useMemo(() => appointments.filter((a) => a.status === "confirmed").length,   [appointments]);
  const inProgressCount = useMemo(() => appointments.filter((a) => a.status === "in_progress").length, [appointments]);

  const activeBase = useMemo(
    () => appointments.filter((a) => a.status === "confirmed" || a.status === "in_progress"),
    [appointments],
  );

  useEffect(() => { setPage(1); }, [activeTab, dateFilter, search]);

  const filtered = useMemo(() => {
    const base = activeTab === "all"
      ? activeBase
      : activeBase.filter((a) => a.status === activeTab);
    const q = search.trim().toLowerCase();
    return base.filter((apt) => {
      if (!matchesDateFilter(apt.date, dateFilter)) return false;
      if (q && !apt.petName.toLowerCase().includes(q) && !apt.owner.toLowerCase().includes(q) && !apt.service.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeBase, activeTab, dateFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage  = Math.min(page, pageCount);
  const pageData  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">

      {/* Two-column layout */}
      <div className="flex-1 min-h-0 grid gap-5" style={{ gridTemplateColumns: "380px 1fr", alignItems: "stretch" }}>

        {/* LEFT — confirmation queue */}
        <ConfirmQueue
          appointments={pendingConfirmation}
          loading={loading}
          onViewDetails={onViewDetails}
          onConfirm={onConfirm}
          onApproveRequest={onApproveRequest}
          onDelete={onDelete}
          approvingAppointmentId={approvingAppointmentId}
        />

        {/* RIGHT — active appointments */}
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Panel header */}
          <div className="flex-shrink-0 space-y-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Status tabs */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                {TABS.map((tab) => {
                  const count =
                    tab.id === "confirmed"   ? confirmedCount  :
                    tab.id === "in_progress" ? inProgressCount :
                    activeBase.length;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold transition-all ${
                        isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab.label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                        isActive ? "bg-slate-100 text-slate-700" : "bg-slate-200/60 text-slate-500"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {dateFilter.mode === "today" ? "Hôm nay"
                  : dateFilter.mode === "week" ? "Tuần này"
                  : dateFilter.date}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
              <div className="relative ml-auto flex-shrink-0">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tên thú cưng, chủ nuôi..."
                  className="h-9 w-52 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs placeholder:text-slate-400 transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {loading ? (
              <LoadingState label="Đang tải danh sách lịch hẹn..." />
            ) : error ? (
              <EmptyState icon={Calendar} label={error} />
            ) : pageData.length === 0 ? (
              <EmptyState
                icon={Calendar}
                label={filtered.length === 0
                  ? "Không có lịch hẹn nào trong khoảng thời gian này"
                  : "Không tìm thấy kết quả"}
              />
            ) : (
              <>
                <div className="flex-1 min-h-0 divide-y divide-slate-100 overflow-y-auto">
                  {pageData.map((apt) => {
                    const statusCfg   = APT_STATUS_CONFIG[apt.status];
                    const svcCfg      = SERVICE_ICONS[apt.serviceType] ?? SERVICE_ICONS.exam;
                    const SvcIcon     = svcCfg.icon;
                    const isDone      = completingGroomingAppointmentId === apt.appointmentId;
                    const isApproving = approvingAppointmentId === apt.appointmentId;
                    const canDelete   = apt.status === "confirmed";

                    return (
                      <div
                        key={apt.id}
                        className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-slate-50/60"
                        style={{ borderLeft: `3px solid ${svcCfg.color}` }}
                      >
                        {/* Time */}
                        <div className="w-14 flex-shrink-0 pt-0.5 text-center">
                          <div className="font-mono text-sm font-bold text-slate-900">{apt.time || "--:--"}</div>
                          <div className="mt-0.5 text-[10px] font-semibold text-slate-400">{apt.date}</div>
                          {apt.queue && <div className="mt-0.5 text-[10px] font-bold text-cyan-500">{apt.queue}</div>}
                        </div>

                        {/* Service icon */}
                        <div
                          className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                          style={{ background: svcCfg.bg }}
                        >
                          <SvcIcon size={16} style={{ color: svcCfg.color }} />
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-slate-900">
                            {apt.petName}
                            <span className="ml-1.5 text-xs font-normal text-slate-500">{apt.species} · {apt.breed}</span>
                          </div>
                          <div className="mt-0.5 truncate text-xs text-slate-500">{apt.owner} · {apt.service}</div>
                          <div className="mt-1">
                            <ProviderBadge doctorName={apt.doctorName} roomName={apt.roomName} staffName={apt.staffName} />
                          </div>
                          {apt.pendingRequest && <PendingRequestBadge request={apt.pendingRequest} />}
                        </div>

                        {/* Status + actions */}
                        <div className="flex flex-shrink-0 items-center gap-2 pt-0.5">
                          <span
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                            style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}
                          >
                            {statusCfg.label}
                          </span>

                          <button
                            onClick={() => onViewDetails(apt)}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <Eye size={13} /> Chi tiết
                          </button>

                          {apt.pendingRequest ? (
                            <button
                              onClick={() => onApproveRequest(apt)}
                              disabled={isApproving}
                              className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
                            >
                              <Send size={13} />
                              {isApproving ? "Duyệt..." : "Duyệt yêu cầu"}
                            </button>
                          ) : apt.status === "in_progress" && apt.serviceType === "grooming" ? (
                            <button
                              onClick={() => onCompleteGrooming(apt)}
                              disabled={isDone}
                              className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
                            >
                              <CheckCircle2 size={13} />
                              {isDone ? "Đang hoàn thành..." : "Hoàn thành"}
                            </button>
                          ) : apt.status === "in_progress" ? (
                            <span className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500">
                              <Activity size={13} />
                              {apt.serviceType === "boarding" ? "Đang lưu trú" : "Đang khám"}
                            </span>
                          ) : apt.status === "confirmed" ? (
                            <button
                              onClick={() => onCheckIn(apt)}
                              className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-white transition-colors"
                              style={{ background: "linear-gradient(135deg,#7C3AED,#8B5CF6)" }}
                            >
                              <CheckCircle2 size={13} /> Check-in
                            </button>
                          ) : null}

                          {canDelete && (
                            <button
                              onClick={() => onDelete(apt)}
                              title="Xóa lịch hẹn"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Pagination
                  page={safePage}
                  pageCount={pageCount}
                  total={filtered.length}
                  pageSize={PAGE_SIZE}
                  onChange={setPage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
