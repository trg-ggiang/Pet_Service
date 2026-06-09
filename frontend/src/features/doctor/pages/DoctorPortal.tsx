import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";

import { DoctorSidebar, type DoctorPortalNavId } from "../../../components/doctor/DoctorSidebar";
import { DoctorScheduleHeader } from "../../../components/doctor/DoctorScheduleHeader";
import { DoctorScheduleStats } from "../../../components/doctor/DoctorScheduleStats";
import { DoctorScheduleTable, type DoctorScheduleFilter } from "../../../components/doctor/DoctorScheduleTable";
import { DoctorLogoutConfirm } from "../../../components/doctor/DoctorSettingsView";
import { DoctorExamScreen } from "./DoctorExamScreen";
import { DoctorRecordsPage } from "./DoctorRecordsPage";
import { DoctorStatsPage } from "./DoctorStatsPage";
import { DoctorSettingsPage } from "./DoctorSettingsPage";
import { doctorDataService, type DoctorMedicalRecord } from "../services/doctorData";
import { DoctorRecordDetail } from "../../../components/doctor/DoctorRecordDetail";
import {
  doctorAppointmentsService,
  type DoctorAppointment,
  type DoctorNotification,
  type DoctorScheduleMeta,
  type DoctorScheduleSummary,
} from "../services/doctorAppointments";
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
  roomLabel: "Phòng 1",
  activityLabel: "Phòng 1 · Đang hoạt động",
};

export function DoctorPortal({ onLogout }: { onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState<DoctorPortalNavId>("schedule");
  const [examPatient, setExamPatient] = useState<DoctorAppointment | null>(null);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<DoctorMedicalRecord | null>(null);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [appointmentFilter, setAppointmentFilter] = useState<DoctorScheduleFilter>("all");
  const [summary, setSummary] = useState<DoctorScheduleSummary>(EMPTY_SUMMARY);
  const [meta, setMeta] = useState<DoctorScheduleMeta>(EMPTY_META);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

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
    if (activeNav === "schedule") {
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

  async function handleOpenExam(appointment: DoctorAppointment) {
    if (appointment.statusKey === "scheduled") {
      try {
        await doctorAppointmentsService.startExam(appointment.appointmentId);
        await loadAppointments();
      } catch (error) {
        console.error("[FRONTEND] Failed to start exam:", error);
        return;
      }
    }

    if (appointment.statusKey === "completed") {
      try {
        const record = await doctorDataService.getRecordByAppointmentId(appointment.appointmentId);
        setSelectedRecordDetail(record);
      } catch (error) {
        console.error("[FRONTEND] Failed to fetch medical record:", error);
        alert(error instanceof Error ? error.message : "Không thể tải thông tin bệnh án");
      }
      return;
    }

    setExamPatient(appointment);
  }

  async function handleFinishExam() {
    setExamPatient(null);
    setActiveNav("schedule");
    await loadAppointments();
  }

  const completedToday = useMemo(() => {
    return appointments.filter((appointment) => {
      const isCompleted = appointment.statusKey === "completed";
      const isTodayVal = (dateStr: string) => {
        const d = new Date(dateStr);
        const t = new Date();
        return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
      };
      return isCompleted && isTodayVal(appointment.date);
    });
  }, [appointments]);

  const pendingAndInProgressAppointments = useMemo(() => {
    if (appointmentFilter === "completed") {
      return appointments.filter((appointment) => appointment.statusKey === "completed");
    }
    if (appointmentFilter === "all") {
      return appointments.filter((appointment) => appointment.statusKey !== "completed");
    }
    return appointments.filter((appointment) => appointment.statusKey === appointmentFilter);
  }, [appointments, appointmentFilter]);

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
        onNavigate={setActiveNav}
        onLogoutClick={() => setLogoutConfirmOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {selectedRecordDetail && (
          <DoctorRecordDetail
            record={selectedRecordDetail}
            onClose={() => setSelectedRecordDetail(null)}
          />
        )}

        {!selectedRecordDetail && examPatient && (
          <DoctorExamScreen
            appointmentId={examPatient.appointmentId}
            onBack={() => setExamPatient(null)}
            onFinish={() => void handleFinishExam()}
          />
        )}

        {!selectedRecordDetail && !examPatient && activeNav === "records" && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <DoctorRecordsPage />
          </div>
        )}

        {!selectedRecordDetail && !examPatient && activeNav === "reports" && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <DoctorStatsPage profile={doctorProfile} />
          </div>
        )}

        {!selectedRecordDetail && !examPatient && activeNav === "settings" && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <DoctorSettingsPage />
          </div>
        )}

        {!selectedRecordDetail && !examPatient && activeNav === "schedule" && (
          <div className="flex-1 flex flex-col min-h-0">
            <DoctorScheduleHeader
              meta={meta}
              notifications={notifications}
              unreadCount={notificationUnreadCount}
              onMarkNotificationRead={(id) => void handleMarkNotificationRead(id)}
              onMarkAllNotificationsRead={() => void handleMarkAllNotificationsRead()}
            />
            <main className="flex-1 min-h-0 overflow-hidden p-6 flex flex-col gap-4">
              <DoctorScheduleStats summary={summary} />
              <div className="flex-1 flex gap-5 min-h-0 overflow-hidden">
                <div className="flex-[2] flex flex-col min-h-0 min-w-0">
                  <DoctorScheduleTable
                    appointments={pendingAndInProgressAppointments}
                    loading={appointmentsLoading}
                    error={appointmentsError}
                    meta={meta}
                    filter={appointmentFilter}
                    onFilterChange={setAppointmentFilter}
                    onOpenExam={(appointment) => void handleOpenExam(appointment)}
                  />
                </div>
                
                <div className="flex-[1] min-w-[320px] max-w-[420px] hidden lg:flex flex-col bg-white border border-border rounded-2xl overflow-hidden min-h-0">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-slate-50 flex-shrink-0">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Đã khám hôm nay</h3>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      {completedToday.length} ca
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {completedToday.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <CheckCircle2 size={32} className="text-slate-300 mb-2" />
                        <p className="text-xs font-medium text-slate-400">Chưa có ca nào hoàn thành hôm nay</p>
                      </div>
                    ) : (
                      completedToday.map((appointment) => (
                        <div key={appointment.appointmentId} className="bg-slate-50 border border-slate-100 rounded-xl p-3 hover:border-emerald-200 transition-all flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-slate-500">{appointment.id}</span>
                            <span className="text-[11px] font-bold text-slate-800">{appointment.time}</span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              {appointment.petName} <span className="text-[10px] text-slate-500 font-normal">({appointment.species})</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">Chủ: {appointment.owner}</div>
                            <div className="text-[10px] text-slate-600 bg-white px-2 py-1 rounded border border-slate-100 mt-1 font-semibold truncate">
                              Dịch vụ: {appointment.service}
                            </div>
                          </div>
                          <button
                            onClick={() => void handleOpenExam(appointment)}
                            className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 transition-colors flex items-center justify-end gap-0.5 mt-1 self-end"
                          >
                            Xem bệnh án <ChevronRight size={10} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
