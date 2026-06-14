import { useEffect, useState } from "react";
import { Bell, Calendar, Dog, Heart, History, LogOut, Pill, UserRound, X } from "lucide-react";
import { useCallback, useRef } from "react";
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
  confirmCustomerAppointment,
  createCustomerAppointment,
  fetchCustomerAppointmentOptions,
  fetchCustomerAppointmentProviders,
  fetchCustomerAppointments,
  rescheduleCustomerAppointment,
} from "../../../services/customer/customerAppointmentsApi";
import { fetchCustomerServiceHistory } from "../../../services/customer/customerServiceHistoryApi";
import { submitCustomerRating } from "../../../services/customer/customerRatingsApi";
import type {
  CustomerAppointmentListPayload,
  CustomerAppointmentOptions,
  CustomerAppointmentStatusFilter,
} from "../../../types/customer/appointments";
import type { CustomerServiceHistoryListPayload, CustomerServiceHistoryTypeFilter } from "../../../types/customer/serviceHistory";
import type { Apt, CustomerPortalNotification, HistoryRecord, Pet, ServiceType } from "../../../types/customer/portal";
import { CustomerAppointmentsTab } from "../../../components/customer/appointments/CustomerAppointmentsTab";
import { NewAppointmentModal, AppointmentDetailModal, RescheduleModal, BoardingRescheduleModal } from "../../../components/customer/appointments/CustomerAppointmentModals";
import { BoardingBookingModal } from "../../../components/customer/boarding/BoardingBookingModal";
import { CustomerHistoryTab } from "../../../components/customer/history/CustomerHistoryTab";
import { CustomerMedicationsTab } from "../../../components/customer/medications/CustomerMedicationsTab";
import { fetchActiveMedications } from "../../../services/customer/customerMedicationsApi";
import type { ActiveMedicationsPayload } from "../../../types/customer/medications";
import { HistoryDetailModal } from "../../../components/customer/history/HistoryDetailModal";
import { CustomerHomeTab } from "../../../components/customer/home/CustomerHomeTab";
import { CustomerNotificationsTab } from "../../../components/customer/notifications/CustomerNotificationsTab";
import { CustomerProfileTab } from "../../../components/customer/profile/CustomerProfileTab";
import { fetchCustomerProfile, updateCustomerProfile, type CustomerProfile } from "../../../services/customer/customerProfileApi";
import { getNotifConfig, mapCustomerAppointment, mapCustomerNotification } from "../../../utils/customer/portalConfig";

type CustomerTab = "home" | "apts" | "pets" | "history" | "medications" | "notifications" | "profile";

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
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [urgentNotification, setUrgentNotification] = useState<CustomerPortalNotification | null>(null);
  const shownUrgentNotificationIdsRef = useRef<Set<number>>(new Set());
  const [medications, setMedications] = useState<ActiveMedicationsPayload | null>(null);
  const [medicationsLoading, setMedicationsLoading] = useState(false);
  const [medicationsError, setMedicationsError] = useState("");

  const [statusFilter, setStatusFilter] = useState<CustomerAppointmentStatusFilter>("all");
  const [petFilter, setPetFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | "all">("all");
  const [openAptFilter, setOpenAptFilter] = useState<"pet" | "service" | null>(null);
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<CustomerServiceHistoryTypeFilter>("all");

  const [isNewAptOpen, setIsNewAptOpen] = useState(false);
  const [isBoardingOpen, setIsBoardingOpen] = useState(false);
  const [bookingPetName, setBookingPetName] = useState<string | null>(null);
  const [viewingApt, setViewingApt] = useState<Apt | null>(null);
  const [viewingHistory, setViewingHistory] = useState<HistoryRecord | null>(null);
  const [reschedulingApt, setReschedulingApt] = useState<Apt | null>(null);
  const [reschedulingBoardingApt, setReschedulingBoardingApt] = useState<Apt | null>(null);
  const [cancellingAptId, setCancellingAptId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const unreadCount = notificationsSummary.unreadCount;
  const displayName = profile?.fullName || userName;
  const appointmentsPageSize = 5;
  const appointmentsPageCount = appointmentPagination.pageCount;
  const serviceFilterOptions: Array<{ value: ServiceType | "all"; label: string }> = [
    { value: "all", label: "Tất cả" },
    { value: "Khám bệnh", label: "Khám bệnh" },
    { value: "Grooming", label: "Grooming" },
    { value: "Lưu trú", label: "Lưu trú" },
  ];
  const selectedPetLabel = petFilter === "all" ? "Tất cả" : petFilter;
  const selectedServiceLabel = serviceFilterOptions.find((option) => option.value === serviceTypeFilter)?.label ?? "Tất cả";

  const loadPetsDashboard = useCallback(async () => {
    try {
      const dash = await fetchCustomerPetDashboard();
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
      setPets([]);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      setProfileError("");
      const payload = await fetchCustomerProfile();
      setProfile(payload.profile);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Không thể tải hồ sơ khách hàng.");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPetsDashboard();
    void loadProfile();
  }, [loadPetsDashboard, loadProfile]);

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
      const mappedNotifications = payload.notifications.map(mapCustomerNotification);
      setNotifications(mappedNotifications);
      setNotificationsSummary(payload.summary);
      const nextUrgentNotification = mappedNotifications.find(
        (notification) => notification.isUrgent && !notification.read && !shownUrgentNotificationIdsRef.current.has(notification.id),
      );
      if (nextUrgentNotification) {
        shownUrgentNotificationIdsRef.current.add(nextUrgentNotification.id);
        setUrgentNotification(nextUrgentNotification);
      }
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

  const saveProfile = async (input: Parameters<typeof updateCustomerProfile>[0]) => {
    const payload = await updateCustomerProfile(input);
    setProfile(payload.profile);
  };

  const closeUrgentNotification = () => {
    setUrgentNotification(null);
  };

  const acknowledgeUrgentNotification = async () => {
    if (!urgentNotification) return;
    await markRead(urgentNotification.id);
    setUrgentNotification(null);
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 15000);

    return () => window.clearInterval(intervalId);
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
    async function loadMeds() {
      try {
        setMedicationsLoading(true);
        setMedicationsError("");
        const data = await fetchActiveMedications();
        if (!ignore) setMedications(data);
      } catch (err) {
        if (!ignore) setMedicationsError(err instanceof Error ? err.message : "Không thể tải lịch thuốc");
      } finally {
        if (!ignore) setMedicationsLoading(false);
      }
    }
    void loadMeds();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadCustomerData() {
      try {
        setAppointmentsLoading(true);
        setAppointmentsError("");
        const appointmentsPayload = await fetchCustomerAppointments({ status: "upcoming", pageSize: 50 });
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

  const urgentMedCount = medications?.pets
    .flatMap(p => p.medications)
    .filter(m => m.daysRemaining <= 2).length ?? 0;

  const urgentMedications = medications?.pets.flatMap(p =>
    p.medications
      .filter(m => m.daysRemaining <= 2)
      .map(m => ({ petName: p.petName, medicineName: m.medicineName, daysRemaining: m.daysRemaining }))
  ) ?? [];

  const navItems = [
    { id: "home"        as const, label: "Trang chủ",  icon: Heart    },
    { id: "apts"        as const, label: "Lịch hẹn",   icon: Calendar, badge: apts.length || undefined          },
    { id: "pets"        as const, label: "Thú cưng",   icon: Dog                                               },
    { id: "medications" as const, label: "Lịch thuốc", icon: Pill,     badge: urgentMedCount || undefined      },
    { id: "history"     as const, label: "Lịch sử",    icon: History                                          },
    { id: "notifications" as const, label: "Thông báo", icon: Bell,    badge: unreadCount || undefined         },
    { id: "profile"     as const, label: "Hồ sơ",      icon: UserRound                                        },
  ];

  const tabMeta: Record<CustomerTab, { title: string; subtitle: string }> = {
    home: { title: "Tổng quan", subtitle: "Theo dõi lịch hẹn, thú cưng và thông báo mới nhất." },
    apts: { title: "Lịch hẹn", subtitle: "Quản lý lịch khám, grooming và lưu trú của thú cưng." },
    pets: { title: "Thú cưng", subtitle: "Xem hồ sơ, lịch sử chăm sóc và dịch vụ của từng thú cưng." },
    history: { title: "Lịch sử", subtitle: "Tra cứu các dịch vụ đã sử dụng và đánh giá trải nghiệm." },
    medications: { title: "Lịch thuốc", subtitle: "Theo dõi thuốc đang dùng và lịch uống thuốc của từng thú cưng." },
    notifications: { title: "Thông báo", subtitle: "Cập nhật từ phòng khám và các cảnh báo cần chú ý." },
    profile: { title: "Hồ sơ chủ nuôi", subtitle: "Cập nhật thông tin liên hệ và hồ sơ cá nhân." },
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 shadow-sm">
            <PawSVG className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold tracking-tight text-slate-950">PetCare Center</div>
            <div className="truncate text-[11px] font-semibold text-slate-400">Cổng khách hàng</div>
          </div>
        </div>

        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-cyan-100 shadow-sm">
              <span className="text-xs font-bold text-cyan-700">{displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "KH"}</span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-950">{displayName}</div>
              <div className="truncate text-xs font-medium text-slate-500">{profile?.email || "Chủ thú cưng"}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex w-full items-center justify-between py-2.5 pr-3 text-sm font-semibold transition-colors ${
                  active
                    ? "border-l-2 border-cyan-500 bg-cyan-50 pl-[10px] text-cyan-700"
                    : "border-l-2 border-transparent pl-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge && (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-500"}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-950">{tabMeta[tab].title}</h1>
            <p className="truncate text-xs font-medium text-slate-500">{tabMeta[tab].subtitle}</p>
          </div>

          <div className="relative">
            <button
              onClick={() => { setShowNotifDropdown((value) => !value); }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
              )}
            </button>

            {showNotifDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNotifDropdown(false)} />
                <div className="absolute right-0 top-12 z-40 w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-slate-900">Thông báo</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{unreadCount}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => void markAllRead()} className="text-[12px] font-semibold text-cyan-600 hover:underline">Đánh dấu đã đọc</button>
                      <button onClick={() => { setShowNotifDropdown(false); setTab("notifications"); }} className="text-[12px] font-semibold text-slate-500 hover:text-slate-700">Xem tất cả</button>
                    </div>
                  </div>
                  <div className="max-h-[380px] divide-y divide-slate-100 overflow-y-auto">
                    {notifications.slice(0, 4).map((notification) => {
                      const config = getNotifConfig(notification.type);
                      const Icon = config.icon;
                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`flex cursor-pointer gap-3 px-4 py-3.5 transition-colors ${notification.read ? "hover:bg-slate-50" : "bg-cyan-50/40 hover:bg-cyan-50/70"}`}
                        >
                          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: config.bg }}>
                            <Icon size={15} style={{ color: config.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-[13px] font-semibold leading-snug ${notification.read ? "text-slate-700" : "text-slate-900"}`}>{notification.title}</span>
                              {!notification.read && <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: "#0891B2" }} />}
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-slate-500">{notification.desc}</p>
                            <span className="mt-1 block text-[11px] font-medium text-slate-400">{notification.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmLogout(false)}>
          <div className="bg-white rounded-xl shadow-md w-[320px] p-6" onClick={(event) => event.stopPropagation()}>
            <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-5 border border-red-100">
              <LogOut size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Xác nhận đăng xuất</h3>
            <p className="text-sm text-slate-500 text-center mt-2">Bạn có chắc muốn đăng xuất khỏi tài khoản?</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmLogout(false)} className="flex-1 h-11 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Hủy</button>
              <button onClick={onLogout} className="flex-1 h-11 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">Đăng xuất</button>
            </div>
          </div>
        </div>
      )}

      {urgentNotification && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={closeUrgentNotification}>
          <div className="w-full max-w-[460px] overflow-hidden rounded-xl border border-red-100 bg-white shadow-md" onClick={(event) => event.stopPropagation()}>
            <div className="h-1.5 bg-red-600" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Bell size={20} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-500">Thông báo khẩn từ bác sĩ</div>
                    <h3 className="mt-1 text-lg font-bold leading-snug text-slate-950">{urgentNotification.title}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeUrgentNotification}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mt-4 whitespace-pre-line rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                {urgentNotification.desc}
              </p>
              <div className="mt-3 text-xs font-semibold text-slate-400">{urgentNotification.time}</div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeUrgentNotification}
                  className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => void acknowledgeUrgentNotification()}
                  className="h-10 rounded-lg bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        <main className="relative z-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-6">
        {tab === "home" && (
          <CustomerHomeTab
            userName={displayName}
            apts={apts}
            pets={pets}
            notifications={notifications}
            notificationsLoading={notificationsLoading}
            notificationsError={notificationsError}
            unreadCount={unreadCount}
            onBookAppointment={() => setIsNewAptOpen(true)}
            onBookBoarding={() => setIsBoardingOpen(true)}
            onOpenAppointments={() => setTab("apts")}
            onOpenPets={() => setTab("pets")}
            onOpenHistory={() => setTab("history")}
            onOpenNotifications={() => setTab("notifications")}
            onOpenMedications={() => setTab("medications")}
            onNotificationClick={handleNotificationClick}
            urgentMedications={urgentMedications}
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
            onBookBoarding={() => setIsBoardingOpen(true)}
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

        {tab === "pets" && (
          <CustomerPetProfilesModule
            onPetsChange={loadPetsDashboard}
            onBookAppointment={(petName) => {
              setBookingPetName(petName);
              setIsNewAptOpen(true);
            }}
          />
        )}

        {tab === "history" && (
          <CustomerHistoryTab
            historyRecords={historyRecords}
            historySummary={historySummary}
            historyTypeFilter={historyTypeFilter}
            historyLoading={historyLoading}
            historyError={historyError}
            onChangeTypeFilter={setHistoryTypeFilter}
            onViewHistory={setViewingHistory}
            onRate={async (record, score, comment) => {
              if (!record.appointmentId) return;
              await submitCustomerRating(record.appointmentId, score, comment);
              const payload = await fetchCustomerServiceHistory({ type: historyTypeFilter });
              setHistoryRecords(payload.history);
              setHistorySummary(payload.summary);
            }}
          />
        )}

        {tab === "medications" && (
          <CustomerMedicationsTab
            data={medications}
            loading={medicationsLoading}
            error={medicationsError}
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

        {tab === "profile" && (
          <CustomerProfileTab
            profile={profile}
            loading={profileLoading}
            error={profileError}
            onRefresh={loadProfile}
            onSave={saveProfile}
          />
        )}
          </div>
        </main>

      {isBoardingOpen && (
        <BoardingBookingModal
          pets={pets}
          onClose={() => setIsBoardingOpen(false)}
          onSuccess={async () => {
            await refreshAppointments(1);
            setAppointmentsPage(1);
            setTab("apts");
          }}
        />
      )}

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
          onSave={async (id, date, time, reason) => {
            await rescheduleCustomerAppointment(id, { date, time, reason });
            await refreshAppointments();
            await loadNotifications();
            setReschedulingApt(null);
          }}
        />
      )}

      {viewingApt && (
        <AppointmentDetailModal
          apt={viewingApt}
          onClose={() => setViewingApt(null)}
          onReschedule={(appointment) => { setViewingApt(null); setReschedulingApt(appointment); }}
          onRescheduleBoardingDates={(apt) => { setViewingApt(null); setReschedulingBoardingApt(apt); }}
          onCancel={(id) => { setViewingApt(null); setCancelReason(""); setCancellingAptId(id); }}
          onConfirm={async (id) => {
            await confirmCustomerAppointment(id);
            await refreshAppointments();
            await loadNotifications();
            setViewingApt(null);
          }}
        />
      )}

      {reschedulingBoardingApt && (
        <BoardingRescheduleModal
          apt={reschedulingBoardingApt}
          onClose={() => setReschedulingBoardingApt(null)}
          onSuccess={async () => {
            setReschedulingBoardingApt(null);
            await refreshAppointments();
          }}
        />
      )}

      {viewingHistory && (
        <HistoryDetailModal
          record={viewingHistory}
          onClose={() => setViewingHistory(null)}
        />
      )}

      {cancellingAptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={cancelLoading ? undefined : () => { setCancellingAptId(null); setCancelReason(""); }}>
          <div className="bg-white rounded-xl shadow-md w-[320px] p-6" onClick={(event) => event.stopPropagation()}>
            <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-5 border border-red-100">
              <X size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Hủy lịch hẹn?</h3>
            <p className="text-sm text-slate-500 text-center mt-2">Nhập lý do hủy lịch để hoàn tất.</p>
            <div className="mt-5">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Lý do hủy lịch</label>
              <textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                rows={3}
                disabled={cancelLoading}
                placeholder="Nhập lý do hủy lịch..."
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold transition-colors focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/10 disabled:opacity-50"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setCancellingAptId(null); setCancelReason(""); }}
                disabled={cancelLoading}
                className="flex-1 h-11 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                Giữ lại
              </button>
              <button
                onClick={async () => {
                  if (cancelLoading) return;
                  setCancelLoading(true);
                  try {
                    await cancelCustomerAppointment(cancellingAptId, { reason: cancelReason.trim() });
                    await refreshAppointments();
                    await loadNotifications();
                    setCancellingAptId(null);
                    setCancelReason("");
                  } finally {
                    setCancelLoading(false);
                  }
                }}
                disabled={!cancelReason.trim() || cancelLoading}
                className="flex-1 h-11 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelLoading && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {cancelLoading ? "Đang xử lý..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
