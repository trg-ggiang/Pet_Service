import { Activity, Calendar, CheckCircle2, Clock, Eye, Search, Send } from "lucide-react";
import type { StaffAppointment } from "../../features/staff/services/staffAppointments";
import { EmptyState, LoadingState } from "./StaffCommon";
import { APT_STATUS_CONFIG, SERVICE_ICONS } from "./staffPortalConfig";

export function AppointmentsTab({
  appointments,
  loading,
  error,
  onViewDetails,
  onCheckIn,
  onApproveRequest,
  approvingAppointmentId,
}: {
  appointments: StaffAppointment[];
  loading: boolean;
  error: string | null;
  onViewDetails: (apt: StaffAppointment) => void;
  onCheckIn: (apt: StaffAppointment) => void;
  onApproveRequest: (apt: StaffAppointment) => void;
  approvingAppointmentId?: number | null;
}) {
  const scheduled = appointments.filter((a) => a.status === "scheduled").length;
  const checkedIn = appointments.filter((a) => a.status === "checked_in").length;
  const inProgress = appointments.filter((a) => a.status === "in_progress").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng lịch hẹn", value: appointments.length, icon: Calendar, color: "#0891B2", bg: "#ECFEFF" },
          { label: "Chờ check-in", value: scheduled, icon: Clock, color: "#2563EB", bg: "#EFF6FF" },
          { label: "Đã check-in", value: checkedIn, icon: CheckCircle2, color: "#7C3AED", bg: "#F5F3FF" },
          { label: "Đang thực hiện", value: inProgress, icon: Activity, color: "#D97706", bg: "#FFFBEB" },
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

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Danh sách lịch hẹn hôm nay</h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
            />
          </div>
        </div>
        {loading ? (
          <LoadingState label="Đang tải danh sách lịch hẹn..." />
        ) : error ? (
          <EmptyState icon={Calendar} label={error} />
        ) : appointments.length === 0 ? (
          <EmptyState icon={Calendar} label="Không có lịch hẹn nào chờ xử lý" />
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((apt) => {
              const statusCfg = APT_STATUS_CONFIG[apt.status];
              const svcIcon = SERVICE_ICONS[apt.serviceType] || SERVICE_ICONS.exam;
              const Icon = svcIcon.icon;

              return (
                <div key={apt.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="w-20 text-center flex-shrink-0">
                    <div className="text-sm font-bold font-mono text-slate-900">{apt.time || "--:--"}</div>
                    <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{apt.date || "Chưa có ngày"}</div>
                    {apt.queue && <div className="text-[10px] font-semibold text-cyan-500 mt-0.5">{apt.queue}</div>}
                  </div>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: svcIcon.bg }}>
                      <Icon size={18} style={{ color: svcIcon.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900">
                        {apt.petName}
                        <span className="ml-2 text-xs font-normal text-slate-500">{apt.species} - {apt.breed}</span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">{apt.owner} - {apt.service}</div>
                      {apt.pendingRequest && (
                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                          <div>{apt.pendingRequest.type === "RESCHEDULE" ? "Yêu cầu đổi lịch" : "Yêu cầu hủy lịch"}</div>
                          {apt.pendingRequest.type === "RESCHEDULE" && (
                            <div className="mt-0.5 text-amber-700">Lịch mới: {apt.pendingRequest.date || "--"} {String(apt.pendingRequest.time || "").slice(0, 5)}</div>
                          )}
                          {apt.pendingRequest.reason && <div className="mt-0.5 text-amber-700">Lý do: {apt.pendingRequest.reason}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0" style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}>
                    {statusCfg.label}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => onViewDetails(apt)} className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                      <Eye size={14} /> Chi tiết
                    </button>
                    {apt.pendingRequest && (
                      <button
                        onClick={() => onApproveRequest(apt)}
                        disabled={approvingAppointmentId === apt.appointmentId}
                        className="h-9 px-4 rounded-lg text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-wait"
                      >
                        <Send size={14} /> {approvingAppointmentId === apt.appointmentId ? "Đang duyệt..." : "Duyệt yêu cầu"}
                      </button>
                    )}
                    {!apt.pendingRequest && apt.status === "scheduled" && (
                      <button onClick={() => onCheckIn(apt)} className="h-9 px-4 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-1.5" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
                        <CheckCircle2 size={14} /> Check-in
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
