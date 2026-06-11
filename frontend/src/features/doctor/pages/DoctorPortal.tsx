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
    setRecordsTarget({
      petId: appointment.petId,
      appointmentId: appointment.appointmentId,
    });
    setActiveNav("records");
  }

  function handleNavigate(navId: DoctorPortalNavId) {
    setRecordsTarget(null);
    setActiveNav(navId);
  }

  async function handleFinishExam() {
    setExamPatient(null);
    setActiveNav("schedule");
    await loadAppointments();
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "#F8FAFC" }}>
      {logoutConfirmOpen && (
        <DoctorLogoutConfirm
          onCancel={() => setLogoutConfirmOpen(false)}
          onConfirm={() => {
            setLogoutConfirmOpen(false);
            onLogout();
          }}
        />
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
              />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
