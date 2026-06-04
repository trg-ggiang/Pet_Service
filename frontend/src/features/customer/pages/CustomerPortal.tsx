import { useEffect, useState } from "react";
import { Bell, Calendar, CheckCircle2, Clock, Heart, LogOut, Star, X } from "lucide-react";
import { CustomerPetProfilesModule } from "./CustomerPetsPage";
import { fetchCustomerPetDashboard } from "../../../services/customer/customerPetsApi";
import {
  dismissCustomerNotification,
  fetchCustomerNotifications,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
} from "../../../services/customer/customerNotificationsApi";
import {
  cancelCustomerAppointment,
  createCustomerAppointment,
  fetchCustomerAppointmentOptions,
  fetchCustomerAppointmentProviders,
  fetchCustomerAppointments,
  rescheduleCustomerAppointment,
} from "../../../services/customer/customerAppointmentsApi";
import { fetchCustomerServiceHistory } from "../../../services/customer/customerServiceHistoryApi";
import type {
  CustomerAppointmentListPayload,
  CustomerAppointmentOptions,
  CustomerAppointmentStatusFilter,
} from "../../../types/customer/appointments";
import type { CustomerServiceHistoryListPayload, CustomerServiceHistoryTypeFilter } from "../../../types/customer/serviceHistory";
import type { Apt, CustomerPortalNotification, HistoryRecord, Pet, ServiceType } from "../../../types/customer/portal";
import { CustomerAppointmentsTab } from "../../../components/customer/appointments/CustomerAppointmentsTab";
import { NewAppointmentModal, AppointmentDetailModal, RescheduleModal } from "../../../components/customer/appointments/CustomerAppointmentModals";
import { CustomerHistoryTab } from "../../../components/customer/history/CustomerHistoryTab";
import { HistoryDetailModal } from "../../../components/customer/history/HistoryDetailModal";
import { CustomerHomeTab } from "../../../components/customer/home/CustomerHomeTab";
import { CustomerNotificationsTab } from "../../../components/customer/notifications/CustomerNotificationsTab";
import { getNotifConfig, mapCustomerAppointment, mapCustomerNotification } from "../../../utils/customer/portalConfig";

type CustomerTab = "home" | "apts" | "pets" | "history" | "notifications";

function PawSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="currentColor">
      <ellipse cx="40" cy="54" rx="18" ry="15" />
      <ellipse cx="18" cy="35" rx="8.5" ry="10" />
      <ellipse cx="32" cy="27" rx="8" ry="9.5" />
      <ellipse cx="48" cy="27" rx="8" ry="9.5" />
      <ellipse cx="62" cy="35" rx="8.5" ry="10" />
    </svg>
  );
}

export function CustomerPortal({ onLogout, userName }: { onLogout: () => void; userName: string }) {
  const [tab, setTab] = useState<CustomerTab>("home");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [apts, setApts] = useState<Apt[]>([]);
  const [appointmentRows, setAppointmentRows] = useState<Apt[]>([]);
  const [appointmentSummary, setAppointmentSummary] = useState<CustomerAppointmentListPayload["summary"]>({
    total: 0,
    filtered: 0,
    statusCounts: [],
    petOptions: [],
    serviceTypeOptions: [],
  });
  const [appointmentPagination, setAppointmentPagination] = useState<CustomerAppointmentListPayload["pagination"]>({
    page: 1,
    pageSize: 5,
    pageCount: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [appointmentOptions, setAppointmentOptions] = useState<CustomerAppointmentOptions>({ services: [], doctors: [] });
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [historySummary, setHistorySummary] = useState<CustomerServiceHistoryListPayload["summary"]>({
    total: 0,
    filtered: 0,
    typeCounts: [],
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [notifications, setNotifications] = useState<CustomerPortalNotification[]>([]);
  const [notificationsSummary, setNotificationsSummary] = useState({ total: 0, unreadCount: 0 });
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const [statusFilter, setStatusFilter] = useState<CustomerAppointmentStatusFilter>("all");
  const [petFilter, setPetFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | "all">("all");
  const [openAptFilter, setOpenAptFilter] = useState<"pet" | "service" | null>(null);
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<CustomerServiceHistoryTypeFilter>("all");

  const [isNewAptOpen, setIsNewAptOpen] = useState(false);
  const [bookingPetName, setBookingPetName] = useState<string | null>(null);
  const [viewingApt, setViewingApt] = useState<Apt | null>(null);
  const [viewingHistory, setViewingHistory] = useState<HistoryRecord | null>(null);
  const [reschedulingApt, setReschedulingApt] = useState<Apt | null>(null);
  const [cancellingAptId, setCancellingAptId] = useState<string | null>(null);

  const unreadCount = notificationsSummary.unreadCount;
  const appointmentsPageSize = 5;
  const appointmentsPageCount = appointmentPagination.pageCount;
  const serviceFilterOptions: Array<{ value: ServiceType | "all"; label: string }> = [
    { value: "all", label: "Tất cả" },
    { value: "Khám bệnh", label: "Khám bệnh" },
    { value: "Tiêm phòng", label: "Tiêm phòng" },
    { value: "Grooming", label: "Grooming" },
    { value: "Lưu trú", label: "Lưu trú" },
  ];
  const selectedPetLabel = petFilter === "all" ? "Tất cả" : petFilter;
  const selectedServiceLabel = serviceFilterOptions.find((option) => option.value === serviceTypeFilter)?.label ?? "Tất cả";

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const dash = await fetchCustomerPetDashboard();
        if (!mounted) return;

        setPets(
          (dash.pets ?? []).map((pet) => ({
            id: pet.id,
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            age: pet.age,
            weight: pet.weight,
            colorId: pet.colorId,
            initials: pet.initials,
            lastVisit: pet.lastVisit,
            nextVaccine: pet.nextVaccine,
            healthy: pet.healthy,
            image: pet.image ?? "",
          })),
        );
      } catch (error) {
        console.error("Failed to load customer pets dashboard", error);
        if (mounted) setPets([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setAppointmentsPage(1);
  }, [statusFilter, petFilter, serviceTypeFilter]);

  useEffect(() => {
    let ignore = false;

    async function loadAppointmentRows() {
      try {
        setAppointmentsLoading(true);
        setAppointmentsError("");
        const payload = await fetchCustomerAppointments({
          status: statusFilter,
          pet: petFilter,
          serviceType: serviceTypeFilter,
          page: appointmentsPage,
          pageSize: appointmentsPageSize,
        });
        if (ignore) return;
        setAppointmentRows(payload.appointments.map(mapCustomerAppointment));
        setAppointmentSummary(payload.summary);
        setAppointmentPagination(payload.pagination);
      } catch (error) {
        if (!ignore) {
          setAppointmentsError(error instanceof Error ? error.message : "Không thể tải lịch hẹn.");
          setAppointmentRows([]);
          setAppointmentSummary({ total: 0, filtered: 0, statusCounts: [], petOptions: [], serviceTypeOptions: [] });
          setAppointmentPagination({ page: 1, pageSize: appointmentsPageSize, pageCount: 1, total: 0, from: 0, to: 0 });
        }
      } finally {
        if (!ignore) setAppointmentsLoading(false);
      }
    }

    void loadAppointmentRows();

    return () => {
      ignore = true;
    };
  }, [statusFilter, petFilter, serviceTypeFilter, appointmentsPage]);

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsError("");
      const payload = await fetchCustomerNotifications();
      setNotifications(payload.notifications.map(mapCustomerNotification));
      setNotificationsSummary(payload.summary);
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Không thể tải thông báo.");
      setNotifications([]);
      setNotificationsSummary({ total: 0, unreadCount: 0 });
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllCustomerNotificationsRead();
      await loadNotifications();
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Không thể cập nhật thông báo.");
    }
  };

  const markRead = async (id: number) => {
    const targetNotification = notifications.find((notification) => notification.id === id);
    if (!targetNotification || targetNotification.read) return;

    try {
      await markCustomerNotificationRead(id);
      await loadNotifications();
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Không thể cập nhật thông báo.");
    }
  };

  const dismissNotif = async (id: number) => {
    try {
      await dismissCustomerNotification(id);
      await loadNotifications();
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Không thể xóa thông báo.");
    }
  };

  const refreshAppointments = async (page = appointmentsPage) => {
    const [allPayload, viewPayload] = await Promise.all([
      fetchCustomerAppointments({ pageSize: 50 }),
      fetchCustomerAppointments({
        status: statusFilter,
        pet: petFilter,
        serviceType: serviceTypeFilter,
        page,
        pageSize: appointmentsPageSize,
      }),
    ]);

    setApts(allPayload.appointments.map(mapCustomerAppointment));
    setAppointmentRows(viewPayload.appointments.map(mapCustomerAppointment));
    setAppointmentSummary(viewPayload.summary);
    setAppointmentPagination(viewPayload.pagination);
  };

  const handleNotificationClick = (notification: CustomerPortalNotification) => {
    if (!notification.read) {
      void markRead(notification.id);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadHistoryRecords() {
      try {
        setHistoryLoading(true);
        setHistoryError("");
        const payload = await fetchCustomerServiceHistory({ type: historyTypeFilter });
        if (ignore) return;
        setHistoryRecords(payload.history);
        setHistorySummary(payload.summary);
      } catch (error) {
        if (!ignore) {
          setHistoryError(error instanceof Error ? error.message : "Không thể tải lịch sử dịch vụ.");
          setHistoryRecords([]);
          setHistorySummary({ total: 0, filtered: 0, typeCounts: [] });
        }
      } finally {
        if (!ignore) setHistoryLoading(false);
      }
    }

    void loadHistoryRecords();

    return () => {
      ignore = true;
    };
  }, [historyTypeFilter]);

  useEffect(() => {
    let ignore = false;

    async function loadCustomerData() {
      try {
        setAppointmentsLoading(true);
        setAppointmentsError("");
        const appointmentsPayload = await fetchCustomerAppointments({ pageSize: 50 });
        if (ignore) return;

        setApts(appointmentsPayload.appointments.map(mapCustomerAppointment));
        const options = await fetchCustomerAppointmentOptions();
        if (!ignore) setAppointmentOptions(options);
      } catch (error) {
        if (!ignore) {
          setAppointmentsError(error instanceof Error ? error.message : "Không thể tải lịch hẹn.");
          setApts([]);
        }
      } finally {
        if (!ignore) setAppointmentsLoading(false);
      }
    }

    void loadCustomerData();

    return () => {
      ignore = true;
    };
  }, []);

  const navItems = [
    { id: "home" as const, label: "Trang chủ", icon: Heart },
    { id: "apts" as const, label: "Lịch hẹn", icon: Calendar },
    { id: "pets" as const, label: "Thú cưng", icon: Star },
    { id: "history" as const, label: "Lịch sử", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
            <PawSVG className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-foreground text-[15px] tracking-tight">PetCare Center</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => { setShowNotifDropdown((value) => !value); }}
              className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-foreground transition-colors relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
              )}
            </button>

            {showNotifDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNotifDropdown(false)} />
                <div className="absolute right-0 top-12 z-40 w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-slate-900">Thông báo</span>
                      {unreadCount > 0 && (
                        <span className="text-[11px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">{unreadCount}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => void markAllRead()} className="text-[12px] text-cyan-600 font-semibold hover:underline">Đánh dấu đã đọc</button>
                      <button onClick={() => { setShowNotifDropdown(false); setTab("notifications"); }} className="text-[12px] text-slate-500 font-semibold hover:text-slate-700">Xem tất cả</button>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                    {notifications.slice(0, 4).map((notification) => {
                      const config = getNotifConfig(notification.type);
                      const Icon = config.icon;
                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`flex gap-3 px-4 py-3.5 cursor-pointer transition-colors ${notification.read ? "hover:bg-slate-50" : "bg-cyan-50/40 hover:bg-cyan-50/70"}`}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: config.bg }}>
                            <Icon size={15} style={{ color: config.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-[13px] font-semibold leading-snug ${notification.read ? "text-slate-700" : "text-slate-900"}`}>{notification.title}</span>
                              {!notification.read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: "#0891B2" }} />}
                            </div>
                            <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{notification.desc}</p>
                            <span className="text-[11px] text-slate-400 font-medium mt-1 block">{notification.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
              <span className="text-sm font-bold text-white">{userName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "KH"}</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-foreground">{userName}</div>
              <div className="text-[11px] font-medium text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full inline-flex mt-0.5">Khách hàng</div>
            </div>
          </div>
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      <div className="bg-slate-50 border-b border-slate-200/80 sticky top-[73px] z-40">
        <div className="flex justify-center max-w-4xl mx-auto w-full px-5">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${
                    active ? "text-cyan-600" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                  <span className="hidden sm:inline">{item.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-cyan-500 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmLogout(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-[320px] p-6" onClick={(event) => event.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5 border border-red-100">
              <LogOut size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Xác nhận đăng xuất</h3>
            <p className="text-sm text-slate-500 text-center mt-2">Bạn có chắc muốn đăng xuất khỏi tài khoản?</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmLogout(false)} className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Hủy</button>
              <button onClick={onLogout} className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">Đăng xuất</button>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-0 flex-1 px-5 py-8 max-w-7xl mx-auto w-full">
        {tab === "home" && (
          <CustomerHomeTab
            userName={userName}
            apts={apts}
            pets={pets}
            notifications={notifications}
            notificationsLoading={notificationsLoading}
            notificationsError={notificationsError}
            unreadCount={unreadCount}
            onBookAppointment={() => setIsNewAptOpen(true)}
            onOpenAppointments={() => setTab("apts")}
            onOpenPets={() => setTab("pets")}
            onOpenHistory={() => setTab("history")}
            onOpenNotifications={() => setTab("notifications")}
            onNotificationClick={handleNotificationClick}
          />
        )}

        {tab === "apts" && (
          <CustomerAppointmentsTab
            pets={pets}
            appointments={appointmentRows}
            appointmentSummary={appointmentSummary}
            appointmentPagination={appointmentPagination}
            appointmentsPageCount={appointmentsPageCount}
            appointmentsLoading={appointmentsLoading}
            appointmentsError={appointmentsError}
            statusFilter={statusFilter}
            petFilter={petFilter}
            serviceTypeFilter={serviceTypeFilter}
            openAptFilter={openAptFilter}
            serviceFilterOptions={serviceFilterOptions}
            selectedPetLabel={selectedPetLabel}
            selectedServiceLabel={selectedServiceLabel}
            onBookAppointment={() => setIsNewAptOpen(true)}
            onViewAppointment={setViewingApt}
            onRescheduleAppointment={setReschedulingApt}
            onCancelAppointment={setCancellingAptId}
            setStatusFilter={setStatusFilter}
            setPetFilter={setPetFilter}
            setServiceTypeFilter={setServiceTypeFilter}
            setOpenAptFilter={setOpenAptFilter}
            setAppointmentsPage={setAppointmentsPage}
          />
        )}

        {tab === "pets" && <CustomerPetProfilesModule />}

        {tab === "history" && (
          <CustomerHistoryTab
            historyRecords={historyRecords}
            historySummary={historySummary}
            historyTypeFilter={historyTypeFilter}
            historyLoading={historyLoading}
            historyError={historyError}
            onChangeTypeFilter={setHistoryTypeFilter}
            onViewHistory={setViewingHistory}
          />
        )}

        {tab === "notifications" && (
          <CustomerNotificationsTab
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={() => void markAllRead()}
            onMarkRead={(id) => void markRead(id)}
            onDismiss={(id) => void dismissNotif(id)}
            onOpenAppointments={() => setTab("apts")}
            onNotificationClick={handleNotificationClick}
          />
        )}
      </main>

      {isNewAptOpen && (
        <NewAppointmentModal
          pets={pets}
          options={appointmentOptions}
          defaultPet={bookingPetName ?? undefined}
          onLoadProviders={fetchCustomerAppointmentProviders}
          onClose={() => { setIsNewAptOpen(false); setBookingPetName(null); }}
          onAdd={async (input) => {
            const selectedPet = pets.find((pet) => pet.name === input.pet) ?? pets.find((pet) => pet.id === input.petId);
            if (!selectedPet) {
              throw new Error("Vui lòng chọn thú cưng hợp lệ.");
            }

            const appointment = await createCustomerAppointment({
              petId: selectedPet.id,
              serviceId: input.serviceId,
              serviceName: input.serviceName ?? input.service,
              serviceType: input.serviceType,
              providerRole: input.providerRole,
              providerId: input.providerId,
              date: input.date,
              time: input.time,
              note: input.note,
            });
            const apt = mapCustomerAppointment(appointment);
            await refreshAppointments(1);
            setAppointmentsPage(1);
            setIsNewAptOpen(false);
            setBookingPetName(null);
            setTab("apts");
            return apt;
          }}
        />
      )}

      {reschedulingApt && (
        <RescheduleModal
          apt={reschedulingApt}
          onClose={() => setReschedulingApt(null)}
          onSave={async (id, date, time) => {
            await rescheduleCustomerAppointment(id, { date, time });
            await refreshAppointments();
            setReschedulingApt(null);
          }}
        />
      )}

      {viewingApt && (
        <AppointmentDetailModal
          apt={viewingApt}
          onClose={() => setViewingApt(null)}
          onReschedule={(appointment) => { setViewingApt(null); setReschedulingApt(appointment); }}
          onCancel={(id) => { setViewingApt(null); setCancellingAptId(id); }}
        />
      )}

      {viewingHistory && (
        <HistoryDetailModal
          record={viewingHistory}
          onClose={() => setViewingHistory(null)}
        />
      )}

      {cancellingAptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setCancellingAptId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-[320px] p-6" onClick={(event) => event.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5 border border-red-100">
              <X size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Hủy lịch hẹn?</h3>
            <p className="text-sm text-slate-500 text-center mt-2">Lịch hẹn sẽ bị xóa và không thể khôi phục.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCancellingAptId(null)} className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Giữ lại</button>
              <button
                onClick={async () => {
                  await cancelCustomerAppointment(cancellingAptId);
                  await refreshAppointments();
                  setCancellingAptId(null);
                }}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
