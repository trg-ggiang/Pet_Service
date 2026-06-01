import { useCallback, useEffect, useState } from "react";

import { DoctorSidebar, type DoctorPortalNavId } from "../../../components/doctor/DoctorSidebar";
import { DoctorScheduleHeader } from "../../../components/doctor/DoctorScheduleHeader";
import { DoctorScheduleStats } from "../../../components/doctor/DoctorScheduleStats";
import { DoctorScheduleTable } from "../../../components/doctor/DoctorScheduleTable";
import { DoctorExamScreen } from "./DoctorExamScreen";
import { DoctorRecordsPage } from "./DoctorRecordsPage";
import { DoctorStatsPage } from "./DoctorStatsPage";
import { DoctorSettingsPage } from "./DoctorSettingsPage";
import {
  doctorAppointmentsService,
  type DoctorAppointment,
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
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [summary, setSummary] = useState<DoctorScheduleSummary>(EMPTY_SUMMARY);
  const [meta, setMeta] = useState<DoctorScheduleMeta>(EMPTY_META);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);

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
    doctorProfileService.fetchProfile()
      .then(setDoctorProfile)
      .catch((error) => {
        console.error("[FRONTEND] Failed to load doctor profile:", error);
      });
  }, []);

  useEffect(() => {
    if (activeNav === "schedule") {
      void loadAppointments();
    }
  }, [activeNav, loadAppointments]);

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

    setExamPatient(appointment);
  }

  async function handleFinishExam() {
    setExamPatient(null);
    setActiveNav("schedule");
    await loadAppointments();
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#F8FAFC" }}>
      <DoctorSidebar
        activeNav={activeNav}
        profile={doctorProfile}
        onNavigate={setActiveNav}
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
            <DoctorRecordsPage />
          </div>
        )}

        {!examPatient && activeNav === "reports" && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <DoctorStatsPage profile={doctorProfile} />
          </div>
        )}

        {!examPatient && activeNav === "settings" && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <DoctorSettingsPage onLogout={onLogout} />
          </div>
        )}

        {!examPatient && activeNav === "schedule" && (
          <>
            <DoctorScheduleHeader meta={meta} />
            <main className="flex-1 overflow-y-auto p-6">
              <DoctorScheduleStats summary={summary} />
              <DoctorScheduleTable
                appointments={appointments}
                loading={appointmentsLoading}
                error={appointmentsError}
                meta={meta}
                onOpenExam={(appointment) => void handleOpenExam(appointment)}
              />
            </main>
          </>
        )}
      </div>
    </div>
  );
}
