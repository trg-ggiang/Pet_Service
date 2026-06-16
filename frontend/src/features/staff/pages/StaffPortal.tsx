import { useCallback, useEffect, useState } from "react";
import {
  AppointmentDetailModal,
  AppointmentsTab,
  BoardingDetailModal,
  BoardingTab,
  DeleteAppointmentModal,
  GroomingTab,
  LogoutConfirmModal,
  PaymentProcessModal,
  PaymentsTab,
  StaffHeader,
  StaffSettingsTab,
  StaffSidebar,
  type StaffNavId,
} from "../../../components/staff/StaffPortalView";
import { PixelDogOverlay } from "../../../components/ui/PixelDogLoader";
import {
  staffAppointmentsService,
  type BoardingDailyStatus,
  type BoardingGuest,
  type GroomingTask,
  type PaymentItem,
  type PaymentMethod,
  type StaffAppointment,
  type StaffProfile,
  type StaffPortalSummary,
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

const EMPTY_BOARDING_STATUS: BoardingDailyStatus = {
  breakfast: false,
  lunch: false,
  dinner: false,
  cleaned: false,
  exercised: false,
  healthCheck: false,
};

function getLocalDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function normalizeBoardingGuestForToday(guest: BoardingGuest): BoardingGuest {
  const today = getLocalDateKey();
  const todayUpdate = (guest.dailyUpdates || []).find((update) => update.date === today);

  if (!todayUpdate) {
    return {
      ...guest,
      todayStatus: { ...EMPTY_BOARDING_STATUS },
      todayNote: "",
      todayImageUrl: null,
    };
  }

  return {
    ...guest,
    todayStatus: todayUpdate.status,
    todayNote: todayUpdate.note || "",
    todayImageUrl: todayUpdate.imageUrl || null,
  };
}

function upsertTodayBoardingUpdate(guest: BoardingGuest): BoardingGuest {
  const today = getLocalDateKey();
  const dailyUpdates = guest.dailyUpdates || [];
  const todayUpdate = {
    id: dailyUpdates.find((update) => update.date === today)?.id || Date.now(),
    date: today,
    status: guest.todayStatus,
    note: guest.todayNote || "",
    imageUrl: guest.todayImageUrl || null,
  };

  return {
    ...guest,
    dailyUpdates: [
      todayUpdate,
      ...dailyUpdates.filter((update) => update.date !== today),
    ],
  };
}

export function StaffPortal({ onLogout }: { onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState<StaffNavId>("appointments");
  const [navLoading, setNavLoading] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [summary, setSummary] = useState<StaffPortalSummary>({
    doneGrooming: 0,
    totalGrooming: 0,
    pendingCheckIn: 0,
    needsFed: 0,
    pendingPayments: 0,
  });
  const [appointments, setAppointments] = useState<StaffAppointment[]>([]);
  const [groomingTasks, setGroomingTasks] = useState<GroomingTask[]>([]);
  const [boardingGuests, setBoardingGuests] = useState<BoardingGuest[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState<LoadingState>(INITIAL_LOADING);
  const [errors, setErrors] = useState<ErrorState>(INITIAL_ERRORS);
  const [viewingApt, setViewingApt] = useState<StaffAppointment | null>(null);
  const [deletingApt, setDeletingApt] = useState<StaffAppointment | null>(null);
  const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);
  const [approvingAppointmentId, setApprovingAppointmentId] = useState<number | null>(null);
  const [completingGroomingAppointmentId, setCompletingGroomingAppointmentId] = useState<number | null>(null);
  const [viewingBoarding, setViewingBoarding] = useState<BoardingGuest | null>(null);
  const [processingPayment, setProcessingPayment] = useState<PaymentItem | null>(null);
  const [boardingDateKey, setBoardingDateKey] = useState(getLocalDateKey());

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

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await staffAppointmentsService.fetchSummary());
    } catch (error) {
      console.error("[FRONTEND] Failed to load staff summary:", error);
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
      const guests = (await staffAppointmentsService.fetchBoardingGuests()).map(normalizeBoardingGuestForToday);
      setBoardingGuests(guests);
      setViewingBoarding((prev) => {
        if (!prev) return prev;
        return guests.find((guest) => guest.id === prev.id) || null;
      });
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
    void loadSummary();
  }, [loadProfile, loadSummary]);

  useEffect(() => {
    if (activeNav === "appointments") void loadAppointments();
    if (activeNav === "grooming") void loadGrooming();
    if (activeNav === "boarding") void loadBoarding();
    if (activeNav === "payments") void loadPayments();
  }, [activeNav, loadAppointments, loadBoarding, loadGrooming, loadPayments]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nextDateKey = getLocalDateKey();
      setBoardingDateKey((prevDateKey) => prevDateKey === nextDateKey ? prevDateKey : nextDateKey);
    }, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Auto-refresh summary badges every 60s so sidebar stays current when other staff act
  useEffect(() => {
    const id = window.setInterval(() => void loadSummary(), 60000);
    return () => window.clearInterval(id);
  }, [loadSummary]);

  useEffect(() => {
    setBoardingGuests((prev) => prev.map(normalizeBoardingGuestForToday));
    setViewingBoarding((prev) => prev ? normalizeBoardingGuestForToday(prev) : prev);

    if (activeNav === "boarding") {
      void loadBoarding();
      void loadSummary();
    }
  }, [boardingDateKey, activeNav, loadBoarding, loadSummary]);

  const { doneGrooming, totalGrooming, pendingCheckIn, needsFed, pendingPayments } = summary;

  function navigateStaffNav(nextNav: StaffNavId) {
    if (nextNav === activeNav) return;
    setNavLoading(true);
    setActiveNav(nextNav);
    window.setTimeout(() => setNavLoading(false), 420);
  }

  async function handleConfirmAppointment(appointment: StaffAppointment) {
    try {
      await staffAppointmentsService.confirmAppointment(appointment.appointmentId);
      setViewingApt(null);
      await loadAppointments();
      await loadSummary();
    } catch (error) {
      console.error("[FRONTEND] Confirm appointment failed:", error);
      alert("Không thể xác nhận lịch hẹn: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    }
  }

  async function handleApproveAppointmentRequest(appointment: StaffAppointment) {
    try {
      setApprovingAppointmentId(appointment.appointmentId);
      await staffAppointmentsService.approveAppointmentRequest(appointment.appointmentId);
      setViewingApt(null);
      await loadAppointments();
      await loadSummary();
    } catch (error) {
      console.error("[FRONTEND] Approve appointment request failed:", error);
      alert("Không thể duyệt yêu cầu: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    } finally {
      setApprovingAppointmentId(null);
    }
  }

  async function handleCheckIn(appointment: StaffAppointment) {
    try {
      await staffAppointmentsService.checkInAppointment(appointment.appointmentId);
      setViewingApt(null);
      await loadAppointments();
      await loadSummary();
    } catch (error) {
      console.error("[FRONTEND] Check-in failed:", error);
      alert("Không thể check-in: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    }
  }

  async function handleCompleteGroomingAppointment(appointment: StaffAppointment) {
    if (completingGroomingAppointmentId === appointment.appointmentId) return;

    try {
      setCompletingGroomingAppointmentId(appointment.appointmentId);
      await staffAppointmentsService.completeGroomingAppointment(appointment.appointmentId);
      setViewingApt(null);
    } catch (error) {
      console.error("[FRONTEND] Complete grooming appointment failed:", error);
      alert("Không thể hoàn thành grooming: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
      return;
    } finally {
      setCompletingGroomingAppointmentId(null);
    }

    const reloadResults = await Promise.allSettled([
      loadAppointments(),
      loadGrooming(),
      loadPayments(),
      loadSummary(),
    ]);

    const failedReloads = reloadResults.filter((result) => result.status === "rejected");
    if (failedReloads.length > 0) {
      console.warn("[FRONTEND] Complete grooming succeeded, but some staff data reloads failed:", failedReloads);
    }
  }

  async function handleUpdateGrooming(task: GroomingTask) {
    try {
      const nextStatus = "COMPLETED";
      await staffAppointmentsService.updateGroomingStatus(task.id, nextStatus);
      await Promise.all([loadGrooming(), loadAppointments(), loadPayments()]);
      await loadSummary();
    } catch (error) {
      console.error("[FRONTEND] Update grooming failed:", error);
      alert("Không thể cập nhật grooming: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    }
  }

  async function handleToggleBoardingStatus(guest: BoardingGuest, field: keyof BoardingDailyStatus) {
    const currentGuest = normalizeBoardingGuestForToday(guest);
    const nextGuest = upsertTodayBoardingUpdate({
      ...currentGuest,
      todayStatus: {
        ...currentGuest.todayStatus,
        [field]: !currentGuest.todayStatus[field],
      },
    });

    setBoardingGuests((prev) => prev.map((item) => item.id === guest.id ? nextGuest : item));
    setViewingBoarding((prev) => prev?.id === guest.id ? nextGuest : prev);

    try {
      await staffAppointmentsService.updateBoardingDailyStatus(guest.id, nextGuest.todayStatus);
      await loadSummary();
    } catch (error) {
      console.error("[FRONTEND] Update boarding failed:", error);
      await loadBoarding();
      alert("Không thể cập nhật lưu trú: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    }
  }

  async function handleSaveBoardingDailyUpdate(guest: BoardingGuest, dailyNote: string, imageDataUrl: string | null) {
    const currentGuest = normalizeBoardingGuestForToday(guest);
    try {
      await staffAppointmentsService.updateBoardingDailyStatus(currentGuest.id, currentGuest.todayStatus, {
        dailyNote,
        imageDataUrl,
      });
      const nextGuest = upsertTodayBoardingUpdate({
        ...currentGuest,
        todayNote: dailyNote,
        todayImageUrl: imageDataUrl || currentGuest.todayImageUrl || null,
      });
      setBoardingGuests((prev) => prev.map((item) => item.id === currentGuest.id ? nextGuest : item));
      setViewingBoarding((prev) => prev?.id === currentGuest.id ? nextGuest : prev);
      await loadBoarding();
      await loadSummary();
    } catch (error) {
      console.error("[FRONTEND] Save boarding daily update failed:", error);
      throw error;
    }
  }

  async function handleDeleteAppointment(appointment: StaffAppointment) {
    try {
      setIsDeletingAppointment(true);
      await staffAppointmentsService.deleteAppointment(appointment.appointmentId);
      setDeletingApt(null);
      setViewingApt(null);
      await loadAppointments();
      await loadSummary();
    } catch (error) {
      console.error("[FRONTEND] Delete appointment failed:", error);
      alert("Không thể xóa lịch hẹn: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    } finally {
      setIsDeletingAppointment(false);
    }
  }

  async function handleCompletePayment(payment: PaymentItem, method: PaymentMethod) {
    try {
      await staffAppointmentsService.markPaymentPaid(payment.invoiceId, method);
      setProcessingPayment(null);
      await loadPayments();
      await loadSummary();
    } catch (error) {
      console.error("[FRONTEND] Payment failed:", error);
      alert("Không thể xác nhận thanh toán: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      {navLoading && <PixelDogOverlay label="Đang chuyển trang..." />}
      <StaffSidebar
        activeNav={activeNav}
        profile={profile}
        doneGrooming={doneGrooming}
        totalGrooming={totalGrooming}
        pendingCheckIn={pendingCheckIn}
        needsFed={needsFed}
        pendingPayments={pendingPayments}
        onNavigate={navigateStaffNav}
        onLogoutClick={() => setConfirmLogout(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <StaffHeader
          activeNav={activeNav}
          pendingCheckIn={pendingCheckIn}
          needsFed={needsFed}
          pendingPayments={pendingPayments}
          onNavigate={navigateStaffNav}
        />
        <main className={`flex-1 min-h-0 p-6 ${activeNav === "appointments" ? "overflow-hidden flex flex-col" : "overflow-y-auto"}`}>
          {activeNav === "appointments" && (
            <AppointmentsTab
              appointments={appointments}
              loading={loading.appointments}
              error={errors.appointments}
              onViewDetails={setViewingApt}
              onConfirm={(appointment) => void handleConfirmAppointment(appointment)}
              onCheckIn={(appointment) => void handleCheckIn(appointment)}
              onCompleteGrooming={(appointment) => void handleCompleteGroomingAppointment(appointment)}
              onApproveRequest={(appointment) => void handleApproveAppointmentRequest(appointment)}
              onDelete={setDeletingApt}
              approvingAppointmentId={approvingAppointmentId}
              completingGroomingAppointmentId={completingGroomingAppointmentId}
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
              onRefresh={() => { void loadBoarding(); void loadSummary(); void loadPayments(); }}
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
          onConfirm={() => void handleConfirmAppointment(viewingApt)}
          onCheckIn={() => void handleCheckIn(viewingApt)}
          onCompleteGrooming={() => void handleCompleteGroomingAppointment(viewingApt)}
          onApproveRequest={() => void handleApproveAppointmentRequest(viewingApt)}
          onDelete={() => { setViewingApt(null); setDeletingApt(viewingApt); }}
          approving={approvingAppointmentId === viewingApt.appointmentId}
          completingGrooming={completingGroomingAppointmentId === viewingApt.appointmentId}
        />
      )}
      {viewingBoarding && (
        <BoardingDetailModal
          guest={viewingBoarding}
          onClose={() => setViewingBoarding(null)}
          onToggleStatus={(field) => void handleToggleBoardingStatus(viewingBoarding, field)}
          onSaveDailyUpdate={(dailyNote, imageDataUrl) => handleSaveBoardingDailyUpdate(viewingBoarding, dailyNote, imageDataUrl)}
        />
      )}
      {processingPayment && (
        <PaymentProcessModal
          payment={processingPayment}
          onClose={() => setProcessingPayment(null)}
          onComplete={(method) => handleCompletePayment(processingPayment, method)}
        />
      )}
      {deletingApt && (
        <DeleteAppointmentModal
          apt={deletingApt}
          onClose={() => setDeletingApt(null)}
          onConfirm={() => void handleDeleteAppointment(deletingApt)}
          deleting={isDeletingAppointment}
        />
      )}
    </div>
  );
}
