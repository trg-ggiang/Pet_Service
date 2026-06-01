import { useCallback, useEffect, useState } from "react";
import {
  AppointmentDetailModal,
  AppointmentsTab,
  BoardingDetailModal,
  BoardingTab,
  GroomingTab,
  LogoutConfirmModal,
  PaymentProcessModal,
  PaymentsTab,
  StaffHeader,
  StaffSettingsTab,
  StaffSidebar,
  type StaffNavId,
} from "../../../components/staff/StaffPortalView";
import {
  staffAppointmentsService,
  type BoardingDailyStatus,
  type BoardingGuest,
  type GroomingTask,
  type PaymentItem,
  type PaymentMethod,
  type StaffAppointment,
  type StaffProfile,
} from "../services/staffAppointments";

type DataKey = "appointments" | "grooming" | "boarding" | "payments";
type LoadingState = Record<DataKey, boolean>;
type ErrorState = Record<DataKey, string | null>;

const INITIAL_LOADING: LoadingState = {
  appointments: true,
  grooming: true,
  boarding: true,
  payments: true,
};

const INITIAL_ERRORS: ErrorState = {
  appointments: null,
  grooming: null,
  boarding: null,
  payments: null,
};

export function StaffPortal({ onLogout }: { onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState<StaffNavId>("appointments");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [appointments, setAppointments] = useState<StaffAppointment[]>([]);
  const [groomingTasks, setGroomingTasks] = useState<GroomingTask[]>([]);
  const [boardingGuests, setBoardingGuests] = useState<BoardingGuest[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState<LoadingState>(INITIAL_LOADING);
  const [errors, setErrors] = useState<ErrorState>(INITIAL_ERRORS);
  const [viewingApt, setViewingApt] = useState<StaffAppointment | null>(null);
  const [viewingBoarding, setViewingBoarding] = useState<BoardingGuest | null>(null);
  const [processingPayment, setProcessingPayment] = useState<PaymentItem | null>(null);

  const setDataLoading = useCallback((key: DataKey, value: boolean) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setDataError = useCallback((key: DataKey, value: string | null) => {
    setErrors((prev) => ({ ...prev, [key]: value }));
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await staffAppointmentsService.fetchProfile());
    } catch (error) {
      console.error("[FRONTEND] Failed to load staff profile:", error);
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      setDataLoading("appointments", true);
      setAppointments(await staffAppointmentsService.fetchPendingAppointments());
      setDataError("appointments", null);
    } catch (error) {
      console.error("[FRONTEND] Failed to load appointments:", error);
      setAppointments([]);
      setDataError("appointments", error instanceof Error ? error.message : "Không tải được lịch hẹn từ backend");
    } finally {
      setDataLoading("appointments", false);
    }
  }, [setDataError, setDataLoading]);

  const loadGrooming = useCallback(async () => {
    try {
      setDataLoading("grooming", true);
      setGroomingTasks(await staffAppointmentsService.fetchGroomingTasks());
      setDataError("grooming", null);
    } catch (error) {
      console.error("[FRONTEND] Failed to load grooming tasks:", error);
      setGroomingTasks([]);
      setDataError("grooming", error instanceof Error ? error.message : "Không tải được danh sách grooming");
    } finally {
      setDataLoading("grooming", false);
    }
  }, [setDataError, setDataLoading]);

  const loadBoarding = useCallback(async () => {
    try {
      setDataLoading("boarding", true);
      setBoardingGuests(await staffAppointmentsService.fetchBoardingGuests());
      setDataError("boarding", null);
    } catch (error) {
      console.error("[FRONTEND] Failed to load boarding guests:", error);
      setBoardingGuests([]);
      setDataError("boarding", error instanceof Error ? error.message : "Không tải được danh sách lưu trú");
    } finally {
      setDataLoading("boarding", false);
    }
  }, [setDataError, setDataLoading]);

  const loadPayments = useCallback(async () => {
    try {
      setDataLoading("payments", true);
      setPayments(await staffAppointmentsService.fetchPayments());
      setDataError("payments", null);
    } catch (error) {
      console.error("[FRONTEND] Failed to load payments:", error);
      setPayments([]);
      setDataError("payments", error instanceof Error ? error.message : "Không tải được danh sách hóa đơn");
    } finally {
      setDataLoading("payments", false);
    }
  }, [setDataError, setDataLoading]);

  useEffect(() => {
    void loadProfile();
    void loadAppointments();
  }, [loadAppointments, loadProfile]);

  useEffect(() => {
    if (activeNav === "grooming") void loadGrooming();
    if (activeNav === "boarding") void loadBoarding();
    if (activeNav === "payments") void loadPayments();
  }, [activeNav, loadBoarding, loadGrooming, loadPayments]);

  const doneGrooming = groomingTasks.filter((task) => task.status === "completed").length;
  const totalGrooming = groomingTasks.length;
  const pendingCheckIn = appointments.filter((appointment) => appointment.status === "scheduled").length;
  const needsFed = boardingGuests.filter((guest) => !guest.todayStatus.breakfast || !guest.todayStatus.lunch || !guest.todayStatus.dinner).length;
  const pendingPayments = payments.filter((payment) => payment.status === "pending").length;

  async function handleCheckIn(appointment: StaffAppointment) {
    try {
      await staffAppointmentsService.checkInAppointment(appointment.appointmentId);
      setViewingApt(null);
      await loadAppointments();
    } catch (error) {
      console.error("[FRONTEND] Check-in failed:", error);
      alert("Không thể check-in: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    }
  }

  async function handleUpdateGrooming(task: GroomingTask) {
    try {
      await staffAppointmentsService.updateGroomingStatus(
        task.id,
        task.status === "in_progress" ? "COMPLETED" : "IN_PROGRESS",
      );
      await loadGrooming();
    } catch (error) {
      console.error("[FRONTEND] Update grooming failed:", error);
      alert("Không thể cập nhật grooming: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    }
  }

  async function handleToggleBoardingStatus(guest: BoardingGuest, field: keyof BoardingDailyStatus) {
    const nextGuest = {
      ...guest,
      todayStatus: {
        ...guest.todayStatus,
        [field]: !guest.todayStatus[field],
      },
    };

    setBoardingGuests((prev) => prev.map((item) => item.id === guest.id ? nextGuest : item));
    setViewingBoarding((prev) => prev?.id === guest.id ? nextGuest : prev);

    try {
      await staffAppointmentsService.updateBoardingDailyStatus(guest.id, nextGuest.todayStatus);
    } catch (error) {
      console.error("[FRONTEND] Update boarding failed:", error);
      await loadBoarding();
      alert("Không thể cập nhật lưu trú: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    }
  }

  async function handleCompletePayment(payment: PaymentItem, method: PaymentMethod) {
    try {
      await staffAppointmentsService.markPaymentPaid(payment.invoiceId, method);
      setProcessingPayment(null);
      await loadPayments();
    } catch (error) {
      console.error("[FRONTEND] Payment failed:", error);
      alert("Không thể xác nhận thanh toán: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <StaffSidebar
        activeNav={activeNav}
        profile={profile}
        doneGrooming={doneGrooming}
        totalGrooming={totalGrooming}
        pendingCheckIn={pendingCheckIn}
        needsFed={needsFed}
        pendingPayments={pendingPayments}
        onNavigate={setActiveNav}
        onLogoutClick={() => setConfirmLogout(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <StaffHeader activeNav={activeNav} pendingCheckIn={pendingCheckIn} needsFed={needsFed} />
        <main className="flex-1 overflow-y-auto p-6">
          {activeNav === "appointments" && (
            <AppointmentsTab
              appointments={appointments}
              loading={loading.appointments}
              error={errors.appointments}
              onViewDetails={setViewingApt}
              onCheckIn={(appointment) => void handleCheckIn(appointment)}
            />
          )}
          {activeNav === "grooming" && (
            <GroomingTab
              tasks={groomingTasks}
              loading={loading.grooming}
              error={errors.grooming}
              onUpdateStatus={(task) => void handleUpdateGrooming(task)}
            />
          )}
          {activeNav === "boarding" && (
            <BoardingTab
              guests={boardingGuests}
              loading={loading.boarding}
              error={errors.boarding}
              onViewDetails={setViewingBoarding}
              onToggleStatus={(guest, field) => void handleToggleBoardingStatus(guest, field)}
            />
          )}
          {activeNav === "payments" && (
            <PaymentsTab
              payments={payments}
              loading={loading.payments}
              error={errors.payments}
              onProcess={setProcessingPayment}
            />
          )}
          {activeNav === "settings" && <StaffSettingsTab profile={profile} />}
        </main>
      </div>

      {confirmLogout && (
        <LogoutConfirmModal
          onCancel={() => setConfirmLogout(false)}
          onConfirm={onLogout}
        />
      )}
      {viewingApt && (
        <AppointmentDetailModal
          apt={viewingApt}
          onClose={() => setViewingApt(null)}
          onCheckIn={() => void handleCheckIn(viewingApt)}
        />
      )}
      {viewingBoarding && (
        <BoardingDetailModal
          guest={viewingBoarding}
          onClose={() => setViewingBoarding(null)}
          onToggleStatus={(field) => void handleToggleBoardingStatus(viewingBoarding, field)}
        />
      )}
      {processingPayment && (
        <PaymentProcessModal
          payment={processingPayment}
          onClose={() => setProcessingPayment(null)}
          onComplete={(method) => void handleCompletePayment(processingPayment, method)}
        />
      )}
    </div>
  );
}
