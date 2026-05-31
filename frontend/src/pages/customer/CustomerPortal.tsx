import { useState, useEffect } from "react";
import { Calendar, Clock, Bell, LogOut, ChevronDown, Plus, Heart, Star, CheckCircle2, Stethoscope, Syringe, MapPin, X, Check, AlertTriangle } from "lucide-react";
import { CustomerPetProfilesModule } from "./CustomerPetsPage";
import { fetchCustomerPetDashboard } from "../../services/customer/customerPetsApi";
import {
  fetchCustomerNotifications,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
} from "../../services/customer/customerNotificationsApi";
import {
  cancelCustomerAppointment,
  createCustomerAppointment,
  fetchCustomerAppointmentProviders,
  fetchCustomerAppointmentOptions,
  fetchCustomerAppointments,
  rescheduleCustomerAppointment,
} from "../../services/customer/customerAppointmentsApi";
import { fetchCustomerServiceHistory } from "../../services/customer/customerServiceHistoryApi";
import type { CustomerAppointmentOptions } from "../../types/customer/appointments";
import type { Apt, HistoryRecord, Pet, ServiceType } from "../../types/customer/portal";
import { NewAppointmentModal, AppointmentDetailModal, RescheduleModal } from "../../components/customer/appointments/CustomerAppointmentModals";
import { HistoryDetailModal } from "../../components/customer/history/HistoryDetailModal";
import { CustomerHomeTab } from "../../components/customer/home/CustomerHomeTab";
import { getPetColorById, getNotifConfig, getServiceTypeConfig, getStatusConfig, mapCustomerAppointment, mapCustomerNotification } from "../../utils/customer/portalConfig";

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

interface Notification {
  id: number;
  type: "high" | "medium" | "info" | "promo";
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

export function CustomerPortal({ onLogout, userName }: { onLogout: () => void; userName: string }) {
  const [tab, setTab] = useState<"home" | "apts" | "pets" | "history" | "notifications">("home");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [apts, setApts] = useState<Apt[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [appointmentOptions, setAppointmentOptions] = useState<CustomerAppointmentOptions>({ services: [], doctors: [] });
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [petsLoading, setPetsLoading] = useState(true);

  // Appointments filters
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "in_progress" | "completed" | "cancelled">("all");
  const [petFilter, setPetFilter] = useState<string>("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | "all">("all");
  const [openAptFilter, setOpenAptFilter] = useState<"pet" | "service" | null>(null);
  const [appointmentsPage, setAppointmentsPage] = useState(1);

  // History filters
  const [historyTypeFilter, setHistoryTypeFilter] = useState<"all" | "medical" | "vaccine" | "grooming" | "boarding">("all");

  // Modals
  const [isNewAptOpen, setIsNewAptOpen] = useState(false);
  const [bookingPetName, setBookingPetName] = useState<string | null>(null);
  const [viewingApt, setViewingApt] = useState<Apt | null>(null);
  const [viewingHistory, setViewingHistory] = useState<HistoryRecord | null>(null);
  const [reschedulingApt, setReschedulingApt] = useState<Apt | null>(null);
  const [cancellingAptId, setCancellingAptId] = useState<string | null>(null);

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
        if (mounted) {
          setPets([]);
        }
      } finally {
        if (mounted) {
          setPetsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Filter logic for appointments
  const filteredApts = apts.filter((apt) => {
    // Status filter
    if (statusFilter === "upcoming" && !["PENDING", "CONFIRMED"].includes(apt.status)) return false;
    if (statusFilter === "in_progress" && !["CHECKED_IN", "IN_PROGRESS"].includes(apt.status)) return false;
    if (statusFilter === "completed" && apt.status !== "COMPLETED") return false;
    if (statusFilter === "cancelled" && !["CANCELLED", "NO_SHOW"].includes(apt.status)) return false;

    // Pet filter
    if (petFilter !== "all" && apt.pet !== petFilter) return false;

    // Service type filter
    if (serviceTypeFilter !== "all" && apt.serviceType !== serviceTypeFilter) return false;

    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const serviceFilterOptions: Array<{ value: ServiceType | "all"; label: string }> = [
    { value: "all", label: "Tất cả" },
    { value: "Khám bệnh", label: "Khám bệnh" },
    { value: "Tiêm phòng", label: "Tiêm phòng" },
    { value: "Grooming", label: "Grooming" },
    { value: "Lưu trú", label: "Lưu trú" },
  ];
  const selectedPetLabel = petFilter === "all" ? "Tất cả" : petFilter;
  const selectedServiceLabel = serviceFilterOptions.find((option) => option.value === serviceTypeFilter)?.label ?? "Tất cả";

  const filteredHistoryRecords = historyRecords.filter((record) => historyTypeFilter === "all" || record.type === historyTypeFilter);
  const appointmentsPageSize = 5;
  const appointmentsPageCount = Math.max(1, Math.ceil(filteredApts.length / appointmentsPageSize));
  const paginatedApts = filteredApts.slice((appointmentsPage - 1) * appointmentsPageSize, appointmentsPage * appointmentsPageSize);

  useEffect(() => {
    setAppointmentsPage(1);
  }, [statusFilter, petFilter, serviceTypeFilter]);

  useEffect(() => {
    setAppointmentsPage((page) => Math.min(page, appointmentsPageCount));
  }, [appointmentsPageCount]);

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsError("");
      const nextNotifications = await fetchCustomerNotifications();
      setNotifications(nextNotifications.map(mapCustomerNotification));
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Không thể tải thông báo.");
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markAllRead = async () => {
    const previousNotifications = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllCustomerNotificationsRead();
    } catch (error) {
      setNotifications(previousNotifications);
      setNotificationsError(error instanceof Error ? error.message : "Không thể cập nhật thông báo.");
    }
  };

  const markRead = async (id: number) => {
    const targetNotification = notifications.find((notification) => notification.id === id);
    if (!targetNotification || targetNotification.read) return;

    const previousNotifications = notifications;
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    try {
      await markCustomerNotificationRead(id);
    } catch (error) {
      setNotifications(previousNotifications);
      setNotificationsError(error instanceof Error ? error.message : "Không thể cập nhật thông báo.");
    }
  };
  const dismissNotif = (id: number) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      void markRead(notification.id);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadCustomerData() {
      try {
        setAppointmentsLoading(true);
        setHistoryLoading(true);
        setAppointmentsError("");
        setHistoryError("");
        const [appointments, history] = await Promise.all([
          fetchCustomerAppointments(),
          fetchCustomerServiceHistory(),
        ]);
        if (ignore) return;

        setApts(appointments.map(mapCustomerAppointment));
        setHistoryRecords(history);
        const options = await fetchCustomerAppointmentOptions();
        if (!ignore) setAppointmentOptions(options);
      } catch (error) {
        if (!ignore) {
          setAppointmentsError(error instanceof Error ? error.message : "Cannot load appointments.");
          setHistoryError(error instanceof Error ? error.message : "Không thể tải lịch sử dịch vụ.");
          setApts([]);
          setHistoryRecords([]);
        }
      } finally {
        if (!ignore) {
          setAppointmentsLoading(false);
          setHistoryLoading(false);
        }
      }
    }

    void loadCustomerData();

    return () => {
      ignore = true;
    };
  }, []);

  const NAV = [
    { id: "home" as const,    label: "Trang chủ", icon: Heart },
    { id: "apts" as const,    label: "Lịch hẹn",  icon: Calendar },
    { id: "pets" as const,    label: "Thú cưng",  icon: Star },
    { id: "history" as const, label: "Lịch sử",   icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
            <PawSVG className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-foreground text-[15px] tracking-tight">PetCare Center</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Bell with dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifDropdown((v) => !v); }}
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
                    {notifications.slice(0, 4).map((n) => {
                      const cfg = getNotifConfig(n.type);
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`flex gap-3 px-4 py-3.5 cursor-pointer transition-colors ${n.read ? "hover:bg-slate-50" : "bg-cyan-50/40 hover:bg-cyan-50/70"}`}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cfg.bg }}>
                            <Icon size={15} style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-[13px] font-semibold leading-snug ${n.read ? "text-slate-700" : "text-slate-900"}`}>{n.title}</span>
                              {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: "#0891B2" }} />}
                            </div>
                            <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.desc}</p>
                            <span className="text-[11px] text-slate-400 font-medium mt-1 block">{n.time}</span>
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

      {/* Tab nav — same background as content area */}
      <div className="bg-slate-50 border-b border-slate-200/80 sticky top-[73px] z-40">
        <div className="flex justify-center max-w-4xl mx-auto w-full px-5">
          <div className="flex gap-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.id;
              const isNotifTab = n.id === "notifications";
              return (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${
                    active ? "text-cyan-600" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <div className="relative">
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                    {isNotifTab && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:inline">{n.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-cyan-500 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logout confirm */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmLogout(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-[320px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5 border border-red-100">
              <LogOut size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Xác nhận đăng xuất</h3>
            <p className="text-sm text-slate-500 text-center mt-2">Bạn có chắc muốn đăng xuất khỏi tài khoản?</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmLogout(false)} className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Huỷ</button>
              <button onClick={onLogout} className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">Đăng xuất</button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="relative z-0 flex-1 px-5 py-8 max-w-7xl mx-auto w-full">

        {/* ── HOME ── */}
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
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Lịch hẹn của tôi</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Theo dõi và lọc lịch hẹn chăm sóc thú cưng</p>
            </div>

            {/* Status filter tabs */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex w-full flex-1 gap-1 overflow-x-auto">
                {[
                  { id: "all" as const,         label: "Tất cả" },
                  { id: "upcoming" as const,    label: "Sắp tới" },
                  { id: "in_progress" as const, label: "Đang xử lý" },
                  { id: "completed" as const,   label: "Đã hoàn thành" },
                  { id: "cancelled" as const,   label: "Đã hủy" },
                ].map((s) => {
                  const active = statusFilter === s.id;
                  const count = apts.filter((a) => {
                    if (s.id === "all") return true;
                    if (s.id === "upcoming") return ["PENDING", "CONFIRMED"].includes(a.status);
                    if (s.id === "in_progress") return ["CHECKED_IN", "IN_PROGRESS"].includes(a.status);
                    if (s.id === "completed") return a.status === "COMPLETED";
                    if (s.id === "cancelled") return ["CANCELLED", "NO_SHOW"].includes(a.status);
                    return false;
                  }).length;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStatusFilter(s.id)}
                      className={`h-10 min-w-fit flex-1 whitespace-nowrap px-4 rounded-xl text-sm font-bold transition-all ${
                        active ? "bg-cyan-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {s.label} <span className={active ? "opacity-80" : "text-slate-400"}>({count})</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setIsNewAptOpen(true)}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-95 lg:h-11"
                style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
              >
                <Plus size={16} strokeWidth={2.5} /> Đặt lịch mới
              </button>
            </div>

            {/* Quick filters */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="group relative flex h-14 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all focus-within:border-cyan-300 focus-within:ring-4 focus-within:ring-cyan-500/10">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                  <Heart size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <label className="block text-[12px] font-bold uppercase tracking-wide text-slate-400">Thú cưng</label>
                  <button
                    type="button"
                    onClick={() => setOpenAptFilter((current) => current === "pet" ? null : "pet")}
                    className="mt-0.5 flex w-full items-center justify-between gap-3 text-left text-[15px] font-extrabold leading-tight text-slate-900 outline-none"
                  >
                    <span className="truncate">{selectedPetLabel}</span>
                    <ChevronDown size={17} className={`flex-shrink-0 text-slate-700 transition-transform ${openAptFilter === "pet" ? "rotate-180" : ""}`} strokeWidth={2.75} />
                  </button>
                </div>
                {openAptFilter === "pet" && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                    {[{ value: "all", label: "Tất cả" }, ...pets.map((pet) => ({ value: pet.name, label: pet.name }))].map((option) => {
                      const selected = petFilter === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setPetFilter(option.value);
                            setOpenAptFilter(null);
                          }}
                          className={`flex h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-extrabold transition-colors ${
                            selected ? "bg-cyan-50 text-cyan-700" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{option.label}</span>
                          {selected && <Check size={15} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="group relative flex h-14 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all focus-within:border-cyan-300 focus-within:ring-4 focus-within:ring-cyan-500/10">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <Stethoscope size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <label className="block text-[12px] font-bold uppercase tracking-wide text-slate-400">Dịch vụ</label>
                  <button
                    type="button"
                    onClick={() => setOpenAptFilter((current) => current === "service" ? null : "service")}
                    className="mt-0.5 flex w-full items-center justify-between gap-3 text-left text-[15px] font-extrabold leading-tight text-slate-900 outline-none"
                  >
                    <span className="truncate">{selectedServiceLabel}</span>
                    <ChevronDown size={17} className={`flex-shrink-0 text-slate-700 transition-transform ${openAptFilter === "service" ? "rotate-180" : ""}`} strokeWidth={2.75} />
                  </button>
                </div>
                {openAptFilter === "service" && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                    {serviceFilterOptions.map((option) => {
                      const selected = serviceTypeFilter === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setServiceTypeFilter(option.value);
                            setOpenAptFilter(null);
                          }}
                          className={`flex h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-extrabold transition-colors ${
                            selected ? "bg-cyan-50 text-cyan-700" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{option.label}</span>
                          {selected && <Check size={15} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {appointmentsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200">
                <Clock className="w-10 h-10 text-cyan-500 mb-4 animate-pulse" />
                <h3 className="text-base font-bold text-slate-700">Đang tải lịch hẹn</h3>
              </div>
            ) : appointmentsError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-red-200">
                <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
                <h3 className="text-base font-bold text-slate-700">Không thể tải lịch hẹn</h3>
                <p className="text-sm text-red-500 mt-1">{appointmentsError}</p>
              </div>
            ) : filteredApts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Calendar size={26} className="text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-700">Không tìm thấy lịch hẹn</h3>
                <p className="text-sm text-slate-400 mt-1 mb-5">Thử thay đổi bộ lọc hoặc đặt lịch mới</p>
                <button
                  onClick={() => setIsNewAptOpen(true)}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
                >
                  <Plus size={16} /> Đặt lịch ngay
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedApts.map((apt) => {
                  const Icon = apt.icon;
                  const statusCfg = getStatusConfig(apt.status);
                  const serviceTypeCfg = getServiceTypeConfig(apt.serviceType);
                  return (
                    <div
                      key={apt.id}
                      onClick={() => setViewingApt(apt)}
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-5">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: apt.iconBg }}>
                          <Icon size={24} style={{ color: apt.iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="text-lg font-bold text-slate-900">{apt.service}</div>
                              <div className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                                <span className="font-semibold text-slate-700">{apt.pet}</span> • {apt.doctor}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="px-2.5 py-1 text-xs font-bold rounded-lg" style={{ background: serviceTypeCfg.bg, color: serviceTypeCfg.color }}>
                                {apt.serviceType}
                              </span>
                              <span className="px-3 py-1.5 text-xs font-bold rounded-lg ring-1 ring-inset" style={{ background: statusCfg.bg, color: statusCfg.color, ringColor: statusCfg.ring }}>
                                {statusCfg.label}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 flex-wrap">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                              <Calendar size={16} className="text-slate-400" /> {apt.date}
                            </div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                              <Clock size={16} className="text-slate-400" /> {apt.time}
                            </div>
                            {apt.room && (
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <MapPin size={16} className="text-slate-400" /> {apt.room}
                              </div>
                            )}
                            {apt.queue && (
                              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-600">
                                <span className="text-[11px] font-bold bg-cyan-50 px-2 py-1 rounded-md">Số thứ tự: {apt.queue}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                        <div className="flex gap-3 mt-5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setReschedulingApt(apt)}
                            className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Đổi lịch
                          </button>
                          <button
                            onClick={() => setCancellingAptId(apt.id)}
                            className="flex-1 h-11 border border-red-100 text-red-600 bg-red-50 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                          >
                            Huỷ lịch
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {!appointmentsLoading && !appointmentsError && filteredApts.length > 0 && (
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-semibold text-slate-500">
                  Hiển thị {(appointmentsPage - 1) * appointmentsPageSize + 1}-{Math.min(appointmentsPage * appointmentsPageSize, filteredApts.length)} / {filteredApts.length} lịch hẹn
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAppointmentsPage((page) => Math.max(1, page - 1))}
                    disabled={appointmentsPage === 1}
                    className="h-9 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <span className="rounded-xl bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-700">
                    {appointmentsPage}/{appointmentsPageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAppointmentsPage((page) => Math.min(appointmentsPageCount, page + 1))}
                    disabled={appointmentsPage === appointmentsPageCount}
                    className="h-9 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
          <aside className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-sm">
              <div className="relative h-44">
                <img
                  src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=900&h=520&fit=crop"
                  alt="Veterinary appointment"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-lg font-extrabold">Chọn đúng người phụ trách</div>
                  <p className="mt-1 text-xs font-semibold text-white/85">Bác sĩ cho khám/tiêm, nhân viên cho grooming/lưu trú.</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 p-4 text-center">
                <div className="rounded-2xl bg-cyan-50 p-3">
                  <div className="text-lg font-extrabold text-cyan-700">{apts.length}</div>
                  <div className="text-[11px] font-bold text-slate-500">Tổng lịch</div>
                </div>
                <div className="rounded-2xl bg-amber-50 p-3">
                  <div className="text-lg font-extrabold text-amber-700">{apts.filter((apt) => apt.status === "PENDING").length}</div>
                  <div className="text-[11px] font-bold text-slate-500">Chờ xác nhận</div>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <div className="text-lg font-extrabold text-emerald-700">{pets.length}</div>
                  <div className="text-[11px] font-bold text-slate-500">Thú cưng</div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900">Mẹo đặt lịch</h3>
              <div className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-black text-cyan-700">1</span>
                  Khám tổng quát, vaccine sẽ chỉ hiện danh sách bác sĩ.
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-black text-rose-700">2</span>
                  Grooming và lưu trú sẽ hiện nhân viên đang trống.
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-xs font-black text-amber-700">3</span>
                  Lịch mới luôn ở trạng thái chờ xác nhận.
                </div>
              </div>
            </div>
          </aside>
          </div>
        )}

        {/* ── PETS ── */}
        {tab === "pets" && <CustomerPetProfilesModule />}

        {/* ── HISTORY ── */}
        {tab === "history" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Lịch sử dịch vụ</h2>

            {/* Type filter tabs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex w-full gap-1 overflow-x-auto">
              {[
                { id: "all" as const,      label: "Tất cả", icon: CheckCircle2 },
                { id: "medical" as const,  label: "Khám bệnh", icon: Stethoscope },
                { id: "vaccine" as const,  label: "Tiêm phòng", icon: Syringe },
                { id: "grooming" as const, label: "Grooming", icon: Star },
                { id: "boarding" as const, label: "Lưu trú", icon: Calendar },
              ].map((t) => {
                const active = historyTypeFilter === t.id;
                const Icon = t.icon;
                const count = historyRecords.filter((h) => t.id === "all" || h.type === t.id).length;
                return (
                  <button
                    key={t.id}
                    onClick={() => setHistoryTypeFilter(t.id)}
                    className={`flex min-w-fit flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                      active ? "bg-cyan-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                    {t.label} <span className={active ? "opacity-80" : "text-slate-400"}>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* History list */}
            <div className="space-y-4">
              {historyLoading && (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
                  Đang tải lịch sử dịch vụ...
                </div>
              )}
              {!historyLoading && historyError && (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-sm font-semibold text-red-700">
                  {historyError}
                </div>
              )}
              {!historyLoading && !historyError && filteredHistoryRecords.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
                  Chưa có lịch sử dịch vụ.
                </div>
              )}
              {!historyLoading && !historyError && filteredHistoryRecords.map((h) => {
                const typeIcons: Record<HistoryRecord["type"], React.ElementType> = {
                  medical: Stethoscope,
                  vaccine: Syringe,
                  grooming: Star,
                  boarding: Calendar,
                };
                const typeColors: Record<HistoryRecord["type"], { bg: string; color: string }> = {
                  medical: { bg: "#ECFEFF", color: "#0891B2" },
                  vaccine: { bg: "#ECFDF5", color: "#059669" },
                  grooming: { bg: "#FFFBEB", color: "#D97706" },
                  boarding: { bg: "#F5F3FF", color: "#7C3AED" },
                };
                const Icon = typeIcons[h.type];
                const clr = typeColors[h.type];
                return (
                  <div
                    key={h.id}
                    onClick={() => setViewingHistory(h)}
                    className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: clr.bg }}>
                        <Icon size={22} style={{ color: clr.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold text-slate-900">{h.service}</div>
                        {h.services.length > 1 && (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {h.services.map((service) => (
                              <span key={service} className="rounded-lg bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                                {service}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-sm font-medium text-slate-500 mt-1">
                          <span className="text-slate-700">{h.pet}</span> • {h.staff} • {h.date}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-slate-900">{h.cost}</div>
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md ring-1 ring-inset ring-emerald-200/50">
                          {h.status === "completed" ? "Hoàn thành" : h.status === "pending" ? "Chờ thanh toán" : "Đã hủy"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab === "notifications" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Thông báo</h2>
                <p className="text-sm text-slate-500 mt-0.5">{unreadCount > 0 ? `${unreadCount} chưa đọc` : "Tất cả đã đọc"}</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => void markAllRead()}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Check size={14} /> Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Bell size={26} className="text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-700">Không có thông báo</h3>
                <p className="text-sm text-slate-400 mt-1">Mọi thứ đều ổn định. Chúng tôi sẽ thông báo khi có tin mới.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => {
                  const cfg = getNotifConfig(n.type);
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${n.read ? "border-slate-200 opacity-80" : "border-slate-200"}`}
                    >
                      {!n.read && <div className="h-0.5" style={{ background: `linear-gradient(to right, ${cfg.color}, transparent)` }} />}
                      <div className="flex gap-4 p-5">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: cfg.bg }}>
                          <Icon size={18} style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[14px] font-bold ${n.read ? "text-slate-700" : "text-slate-900"}`}>{n.title}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                            </div>
                            <button onClick={(event) => { event.stopPropagation(); dismissNotif(n.id); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0">
                              <X size={14} />
                            </button>
                          </div>
                          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">{n.desc}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-[12px] text-slate-400 font-medium flex items-center gap-1">
                              <Clock size={11} /> {n.time}
                            </span>
                            <div className="flex items-center gap-2">
                              {!n.read && (
                                <button
                                  onClick={(event) => { event.stopPropagation(); void markRead(n.id); }}
                                  className="text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                  Đánh dấu đã đọc
                                </button>
                              )}
                              {(n.type === "high" || n.type === "medium") && (
                                <button
                                  onClick={(event) => { event.stopPropagation(); handleNotificationClick(n); setTab("apts"); }}
                                  className="text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                                  style={{ background: cfg.bg, color: cfg.color }}
                                >
                                  Xử lý ngay →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* New Appointment Modal */}
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
            setApts((prev) => [apt, ...prev]);
            setIsNewAptOpen(false);
            setBookingPetName(null);
            setTab("apts");
            return apt;
          }}
        />
      )}

      {/* Reschedule Modal */}
      {reschedulingApt && (
        <RescheduleModal
          apt={reschedulingApt}
          onClose={() => setReschedulingApt(null)}
          onSave={async (id, date, time) => {
            const appointment = await rescheduleCustomerAppointment(id, { date, time });
            const updated = mapCustomerAppointment(appointment);
            setApts((prev) => prev.map((a) => a.id === id ? updated : a));
            setReschedulingApt(null);
          }}
        />
      )}

      {/* Appointment Detail Modal */}
      {viewingApt && (
        <AppointmentDetailModal
          apt={viewingApt}
          onClose={() => setViewingApt(null)}
          onReschedule={(apt) => { setViewingApt(null); setReschedulingApt(apt); }}
          onCancel={(id) => { setViewingApt(null); setCancellingAptId(id); }}
        />
      )}

      {/* History Detail Modal */}
      {viewingHistory && (
        <HistoryDetailModal
          record={viewingHistory}
          onClose={() => setViewingHistory(null)}
        />
      )}

      {/* Cancel Confirm */}
      {cancellingAptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setCancellingAptId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-[320px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5 border border-red-100">
              <X size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Huỷ lịch hẹn?</h3>
            <p className="text-sm text-slate-500 text-center mt-2">Lịch hẹn sẽ bị xoá và không thể khôi phục.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCancellingAptId(null)} className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Giữ lại</button>
              <button
                onClick={async () => {
                  const appointment = await cancelCustomerAppointment(cancellingAptId);
                  const updated = mapCustomerAppointment(appointment);
                  setApts((prev) => prev.map((a) => a.id === cancellingAptId ? updated : a));
                  setCancellingAptId(null);
                }}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Xác nhận huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

