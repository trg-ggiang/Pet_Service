import { useCallback, useEffect, useMemo, useState } from "react";

import { DoctorSidebar, type DoctorPortalNavId } from "../../../components/doctor/DoctorSidebar";
import { DoctorScheduleHeader } from "../../../components/doctor/DoctorScheduleHeader";
import { DoctorScheduleStats } from "../../../components/doctor/DoctorScheduleStats";
import { DoctorScheduleTable, type DoctorScheduleFilter } from "../../../components/doctor/DoctorScheduleTable";
import { DoctorLogoutConfirm } from "../../../components/doctor/DoctorSettingsView";
import { DoctorExamScreen } from "./DoctorExamScreen";
import { DoctorRecordsPage } from "./DoctorRecordsPage";
import { DoctorStatsPage } from "./DoctorStatsPage";
import { DoctorSettingsPage } from "./DoctorSettingsPage";
import { PixelDogOverlay } from "../../../components/ui/PixelDogLoader";
import {
  doctorAppointmentsService,
  type DoctorAppointment,
  type DoctorNotification,
  type DoctorScheduleMeta,
  type DoctorScheduleSummary,
} from "../services/doctorAppointments";
import { todayYmd } from "../../../components/staff/StaffCommon";
import { doctorProfileService, type DoctorProfile } from "../services/doctorProfile";

const EMPTY_SUMMARY: DoctorScheduleSummary = {
  total: 0,
  completed: 0,
  inProgress: 0,
  scheduled: 0,
};

const EMPTY_META: DoctorScheduleMeta = {
  title: "Lịch khám của bác sĩ",
  dateLabel: "",
  roomLabel: "",
  activityLabel: "",
};

export function DoctorPortal({ onLogout }: { onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState<DoctorPortalNavId>("schedule");
  const [examPatient, setExamPatient] = useState<DoctorAppointment | null>(null);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [appointmentFilter, setAppointmentFilter] = useState<DoctorScheduleFilter>("all");
  const [summary, setSummary] = useState<DoctorScheduleSummary>(EMPTY_SUMMARY);
  const [meta, setMeta] = useState<DoctorScheduleMeta>(EMPTY_META);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [recordsTarget, setRecordsTarget] = useState<{ petId?: number | null; appointmentId?: number | null } | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const [urgentAlertTarget, setUrgentAlertTarget] = useState<DoctorAppointment | null>(null);
  const [urgentAlertMessage, setUrgentAlertMessage] = useState("");
  const [urgentAlertSending, setUrgentAlertSending] = useState(false);
  const [urgentAlertError, setUrgentAlertError] = useState("");
  const [urgentAlertSuccess, setUrgentAlertSuccess] = useState("");

  const todaySummary = useMemo<DoctorScheduleSummary>(() => {
    const today = todayYmd();
    const todayAppts = appointments.filter(
      (apt) => (apt.scheduleRow?.date || apt.date) === today,
    );
    return {
      total: todayAppts.length,
      completed: todayAppts.filter((a) => a.statusKey === "completed").length,
      inProgress: todayAppts.filter((a) => a.statusKey === "in_progress").length,
      scheduled: todayAppts.filter((a) => a.statusKey === "scheduled").length,
    };
  }, [appointments]);

  const loadNotifications = useCallback(async () => {
    try {
      const payload = await doctorAppointmentsService.fetchNotifications();
      setNotifications(payload.notifications);
      setNotificationUnreadCount(payload.summary.unreadCount);
    } catch (error) {
      console.error("[FRONTEND] Failed to load doctor notifications:", error);
      setNotifications([]);
      setNotificationUnreadCount(0);
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      setAppointmentsLoading(true);
      const payload = await doctorAppointmentsService.fetchAppointments();
      setAppointments(payload.appointments);
      setSummary(payload.summary);
      setMeta(payload.meta);
      setAppointmentsError(null);
    } catch (error) {
      console.error("[FRONTEND] Failed to load appointments:", error);
      setAppointments([]);
      setSummary(EMPTY_SUMMARY);
      setMeta(EMPTY_META);
      setAppointmentsError(error instanceof Error ? error.message : "Không tải được lịch hẹn từ backend");
    } finally {
      setAppointmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();

    doctorProfileService.fetchProfile()
      .then(setDoctorProfile)
      .catch((error) => {
        console.error("[FRONTEND] Failed to load doctor profile:", error);
      });
  }, [loadNotifications]);

  useEffect(() => {
    if (activeNav === "schedule" || activeNav === "scheduleHistory") {
      void loadAppointments();
    }
  }, [activeNav, loadAppointments]);

  async function handleMarkNotificationRead(notificationId: number) {
    try {
      await doctorAppointmentsService.markNotificationRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error("[FRONTEND] Failed to mark doctor notification read:", error);
    }
  }

  async function handleMarkAllNotificationsRead() {
    try {
      await doctorAppointmentsService.markAllNotificationsRead();
      await loadNotifications();
    } catch (error) {
      console.error("[FRONTEND] Failed to mark all doctor notifications read:", error);
    }
  }

  function handleOpenExam(appointment: DoctorAppointment) {
    if (appointment.statusKey !== "in_progress") return;

    setExamPatient(appointment);
  }

  function handleOpenRecordDetail(appointment: DoctorAppointment) {
    setNavLoading(true);
    setRecordsTarget({
      petId: appointment.petId,
      appointmentId: appointment.appointmentId,
    });
    setActiveNav("records");
    window.setTimeout(() => setNavLoading(false), 420);
  }

  function handleNavigate(navId: DoctorPortalNavId) {
    if (navId === activeNav && !recordsTarget) return;
    setNavLoading(true);
    setRecordsTarget(null);
    setActiveNav(navId);
    window.setTimeout(() => setNavLoading(false), 420);
  }

  async function handleFinishExam() {
    setExamPatient(null);
    setActiveNav("schedule");
    await loadAppointments();
  }

  function handleOpenUrgentAlert(appointment: DoctorAppointment) {
    setUrgentAlertTarget(appointment);
    setUrgentAlertMessage("");
    setUrgentAlertError("");
    setUrgentAlertSuccess("");
  }

  async function handleSendUrgentAlert() {
    const content = urgentAlertMessage.trim();
    if (!content || !urgentAlertTarget) return;

    try {
      setUrgentAlertSending(true);
      setUrgentAlertError("");
      setUrgentAlertSuccess("");
      const result = await doctorAppointmentsService.sendUrgentAlert(urgentAlertTarget.appointmentId, content);
      setUrgentAlertSuccess(result || "Đã gửi cảnh báo khẩn đến chủ thú cưng");
      setUrgentAlertMessage("");
    } catch (err) {
      setUrgentAlertError(err instanceof Error ? err.message : "Không thể gửi cảnh báo khẩn");
    } finally {
      setUrgentAlertSending(false);
    }
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "#F8FAFC" }}>
      {navLoading && <PixelDogOverlay label="Đang chuyển trang..." />}
      {logoutConfirmOpen && (
        <DoctorLogoutConfirm
          onCancel={() => setLogoutConfirmOpen(false)}
          onConfirm={() => {
            setLogoutConfirmOpen(false);
            onLogout();
          }}
        />
      )}

      {urgentAlertTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={() => !urgentAlertSending && setUrgentAlertTarget(null)}>
          <div className="w-full max-w-[460px] rounded-2xl border border-red-100 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-500">Cảnh báo khẩn cấp</div>
                <h3 className="mt-1 text-lg font-bold text-slate-950">Gửi cảnh báo đến chủ thú cưng</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {urgentAlertTarget.petName} · {urgentAlertTarget.owner}
                </p>
              </div>
              <button
                type="button"
                disabled={urgentAlertSending}
                onClick={() => setUrgentAlertTarget(null)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {urgentAlertError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{urgentAlertError}</div>
            )}
            {urgentAlertSuccess && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{urgentAlertSuccess}</div>
            )}

            <label className="mt-5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Nội dung gửi cho chủ thú cưng
            </label>
            <textarea
              value={urgentAlertMessage}
              onChange={(e) => setUrgentAlertMessage(e.target.value)}
              rows={5}
              maxLength={1000}
              disabled={urgentAlertSending}
              placeholder="Ví dụ: Bé có dấu hiệu bất thường, chủ nuôi vui lòng theo dõi sát và liên hệ ngay nếu tình trạng nặng hơn."
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/10 disabled:opacity-60"
            />
            <div className="mt-2 text-right text-[11px] font-semibold text-slate-400">
              {urgentAlertMessage.length}/1000
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={urgentAlertSending}
                onClick={() => setUrgentAlertTarget(null)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={urgentAlertSending || !urgentAlertMessage.trim()}
                onClick={() => void handleSendUrgentAlert()}
                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {urgentAlertSending ? "Đang gửi..." : "Gửi cảnh báo"}
              </button>
            </div>
          </div>
        </div>
      )}

      <DoctorSidebar
        activeNav={activeNav}
        profile={doctorProfile}
        onNavigate={handleNavigate}
        onLogoutClick={() => setLogoutConfirmOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {examPatient && (
          <DoctorExamScreen
            appointmentId={examPatient.appointmentId}
            onBack={() => setExamPatient(null)}
            onFinish={() => void handleFinishExam()}
          />
        )}

        {!examPatient && activeNav === "records" && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <DoctorRecordsPage target={recordsTarget} />
          </div>
        )}

        {!examPatient && activeNav === "reports" && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <DoctorStatsPage profile={doctorProfile} />
          </div>
        )}

        {!examPatient && activeNav === "settings" && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <DoctorSettingsPage />
          </div>
        )}

        {!examPatient && activeNav === "schedule" && (
          <div className="flex-1 flex flex-col min-h-0">
            <DoctorScheduleHeader
              meta={meta}
              notifications={notifications}
              unreadCount={notificationUnreadCount}
              onMarkNotificationRead={(id) => void handleMarkNotificationRead(id)}
              onMarkAllNotificationsRead={() => void handleMarkAllNotificationsRead()}
            />
            <main className="flex-1 min-h-0 overflow-hidden p-6 flex flex-col">
              <DoctorScheduleStats summary={todaySummary} />
              <DoctorScheduleTable
                appointments={appointments}
                loading={appointmentsLoading}
                error={appointmentsError}
                meta={meta}
                filter={appointmentFilter}
                view="today"
                onFilterChange={setAppointmentFilter}
                onOpenExam={handleOpenExam}
                onUrgentAlert={handleOpenUrgentAlert}
              />
            </main>
          </div>
        )}

        {!examPatient && activeNav === "scheduleHistory" && (
          <div className="flex-1 flex flex-col min-h-0">
            <DoctorScheduleHeader
              meta={meta}
              notifications={notifications}
              unreadCount={notificationUnreadCount}
              onMarkNotificationRead={(id) => void handleMarkNotificationRead(id)}
              onMarkAllNotificationsRead={() => void handleMarkAllNotificationsRead()}
            />
            <main className="flex-1 min-h-0 overflow-hidden p-6 flex flex-col">
              <DoctorScheduleStats summary={summary} />
              <DoctorScheduleTable
                appointments={appointments}
                loading={appointmentsLoading}
                error={appointmentsError}
                meta={meta}
                filter={appointmentFilter}
                view="history"
                onFilterChange={setAppointmentFilter}
                onOpenExam={handleOpenExam}
                onOpenRecordDetail={handleOpenRecordDetail}
                onUrgentAlert={handleOpenUrgentAlert}
              />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
