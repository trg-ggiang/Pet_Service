import { AlertTriangle, BedDouble, Calendar, ChevronRight, Clock, Heart, Pill, Plus } from "lucide-react";
import type { Apt, CustomerPortalNotification, Pet } from "../../../types/customer/portal";
import { getNotifConfig, getPetColorById } from "../../../utils/customer/portalConfig";

const HERO_IMG = "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1200&h=560&fit=crop";
const PETS_IMG = "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=400&fit=crop";

type UrgentMed = { petName: string; medicineName: string; daysRemaining: number };

export function CustomerHomeTab({
  userName,
  apts,
  pets,
  notifications,
  notificationsLoading,
  notificationsError,
  unreadCount,
  onBookAppointment,
  onBookBoarding,
  onOpenAppointments,
  onOpenPets,
  onOpenHistory,
  onOpenNotifications,
  onOpenMedications,
  onNotificationClick,
  urgentMedications,
}: {
  userName: string;
  apts: Apt[];
  pets: Pet[];
  notifications: CustomerPortalNotification[];
  notificationsLoading: boolean;
  notificationsError: string;
  unreadCount: number;
  onBookAppointment: () => void;
  onBookBoarding?: () => void;
  onOpenAppointments: () => void;
  onOpenPets: () => void;
  onOpenHistory: () => void;
  onOpenNotifications: () => void;
  onOpenMedications?: () => void;
  onNotificationClick: (notification: CustomerPortalNotification) => void;
  urgentMedications?: UrgentMed[];
}) {
  return (
    <div className="space-y-4">

      {/* Urgent medications alert — shown only when ≤2 days remaining */}
      {urgentMedications && urgentMedications.length > 0 && (
        <button
          onClick={onOpenMedications}
          className="flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-left transition-all hover:border-red-300 hover:bg-red-100 active:scale-[0.99]"
        >
          <AlertTriangle size={18} className="flex-shrink-0 text-red-500" />
          <div className="min-w-0 flex-1">
            <span className="text-sm font-bold text-red-700">
              {urgentMedications.length === 1
                ? `${urgentMedications[0].petName} sắp hết thuốc`
                : `${urgentMedications.length} loại thuốc sắp hết trong 2 ngày`}
            </span>
            <span className="ml-2 text-xs text-red-500">
              {urgentMedications.slice(0, 2).map((m) => `${m.medicineName} (còn ${m.daysRemaining}n)`).join(" · ")}
              {urgentMedications.length > 2 && "..."}
            </span>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 shadow-sm">
            <Pill size={12} className="text-red-500" />
            <span className="text-xs font-bold text-red-600">Xem thuốc</span>
          </div>
        </button>
      )}

    <div className="grid grid-cols-6 gap-4 auto-rows-[88px]">

      {/* Hero welcome card */}
      <div className="relative col-span-6 md:col-span-4 md:col-start-1 md:row-start-1 row-span-3 rounded-3xl overflow-hidden shadow-sm">
        <img
          src={HERO_IMG}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-slate-900/55" />
        <div className="relative z-10 flex h-full flex-col p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
            Xin chào trở lại
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">{userName}</h2>
          <div className="mt-3 flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2">
            <Calendar size={13} className="flex-shrink-0 text-white/70" />
            <span className="text-sm font-semibold text-white">
              {apts.length > 0 ? `${apts.length} lịch hẹn sắp tới` : "Chưa có lịch hẹn"}
            </span>
          </div>
          <button
            onClick={onOpenAppointments}
            className="mt-auto flex w-fit items-center gap-1.5 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 active:scale-[0.98]"
          >
            Xem lịch hẹn <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Book appointment */}
      <button
        onClick={onBookAppointment}
        className="col-span-6 md:col-span-2 md:col-start-5 md:row-start-1 group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-cyan-200 hover:shadow-md active:scale-[0.98]"
      >
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-50 transition-transform group-hover:scale-110">
          <Plus size={20} className="text-cyan-600" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900">Đặt lịch mới</div>
          <div className="mt-0.5 text-xs text-slate-500">Chọn dịch vụ & bác sĩ</div>
        </div>
      </button>

      {/* History */}
      <button
        onClick={onOpenHistory}
        className="col-span-3 md:col-span-2 md:col-start-5 md:row-start-2 group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-violet-200 hover:shadow-md active:scale-[0.98]"
      >
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 transition-transform group-hover:scale-110">
          <Clock size={20} className="text-violet-600" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900">Lịch sử dịch vụ</div>
          <div className="mt-0.5 text-xs text-slate-500">Tất cả giao dịch</div>
        </div>
      </button>

      {/* Boarding */}
      <button
        onClick={onBookBoarding}
        className="col-span-3 md:col-span-2 md:col-start-5 md:row-start-3 group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-amber-200 hover:shadow-md active:scale-[0.98]"
      >
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 transition-transform group-hover:scale-110">
          <BedDouble size={20} className="text-amber-600" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900">Đặt phòng lưu trú</div>
          <div className="mt-0.5 text-xs text-slate-500">Chọn phòng & ngày lưu trú</div>
        </div>
      </button>

      {/* Upcoming appointments */}
      <div className="col-span-6 md:col-span-4 md:col-start-1 md:row-start-4 row-span-6 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Lịch hẹn sắp tới</h3>
            <p className="mt-0.5 text-xs text-slate-400">{apts.length} cuộc hẹn đang theo dõi</p>
          </div>
          <button
            onClick={onOpenAppointments}
            className="text-sm font-semibold text-cyan-600 transition-colors hover:text-cyan-700"
          >
            Xem tất cả
          </button>
        </div>

        {apts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="h-24 w-32 overflow-hidden rounded-2xl">
              <img src={HERO_IMG} alt="" className="h-full w-full object-cover opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-500">Chưa có lịch hẹn sắp tới</p>
              <button
                onClick={onBookAppointment}
                className="mt-2 text-xs font-bold text-cyan-600 hover:underline"
              >
                Đặt lịch ngay →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {apts.slice(0, 4).map((apt) => {
              const Icon = apt.icon;
              return (
                <div
                  key={apt.id}
                  className="flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 transition-colors hover:border-cyan-100 hover:bg-cyan-50/20"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm">
                    <Icon size={18} style={{ color: apt.iconColor }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-900">{apt.service}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{apt.pet}</span>
                      {apt.doctor && <> · {apt.doctor}</>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-right shadow-sm">
                    <div className="text-xs font-bold text-slate-900">{apt.date}</div>
                    <div className="mt-0.5 text-[11px] font-semibold text-cyan-600">{apt.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pet profiles card */}
      <button
        onClick={onOpenPets}
        className="col-span-3 md:col-span-2 md:col-start-5 md:row-start-4 row-span-3 group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all hover:border-rose-200 hover:shadow-md active:scale-[0.98]"
      >
        <div className="relative h-[100px] flex-shrink-0 overflow-hidden">
          <img
            src={PETS_IMG}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-slate-900/20" />
          <div className="absolute bottom-2 left-3">
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-rose-600 shadow-sm">
              {pets.length} thú cưng
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center gap-2">
            <Heart size={14} className="flex-shrink-0 text-rose-500" />
            <span className="text-sm font-bold text-slate-900">Hồ sơ thú cưng</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">Sức khoẻ & lịch sử khám</p>
          {pets.length > 0 && (
            <div className="mt-auto flex items-center gap-1 pt-3">
              {pets.slice(0, 3).map((pet) => {
                const clr = getPetColorById(pet.colorId);
                return (
                  <div
                    key={pet.id}
                    className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${clr.from}, ${clr.to})` }}
                  >
                    {pet.image ? (
                      <img src={pet.image} alt={pet.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
                        {pet.initials}
                      </div>
                    )}
                  </div>
                );
              })}
              {pets.length > 3 && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-500 shadow-sm">
                  +{pets.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Notifications preview */}
      <div className="col-span-6 md:col-span-2 md:col-start-5 md:row-start-7 row-span-3 flex flex-col rounded-3xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">Thông báo mới</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {notificationsLoading && (
            <div className="rounded-xl bg-slate-50 p-3 text-center text-xs font-semibold text-slate-400">
              Đang tải...
            </div>
          )}
          {!notificationsLoading && notificationsError && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
              {notificationsError}
            </div>
          )}
          {!notificationsLoading && !notificationsError && unreadCount === 0 && (
            <div className="flex flex-col items-center gap-2 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">
                🔔
              </div>
              <p className="text-xs font-semibold text-slate-400">Không có thông báo mới</p>
            </div>
          )}
          {!notificationsLoading &&
            !notificationsError &&
            notifications
              .filter((n) => !n.read)
              .slice(0, 3)
              .map((n) => {
                const cfg = getNotifConfig(n.type);
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => onNotificationClick(n)}
                    className="flex cursor-pointer gap-2.5 rounded-xl border p-3 transition-all hover:shadow-sm"
                    style={{ borderColor: cfg.borderColor, background: cfg.bg }}
                  >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Icon size={13} style={{ color: cfg.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="line-clamp-1 text-xs font-bold"
                        style={{ color: cfg.color }}
                      >
                        {n.title}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-600">
                        {n.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
        </div>

        <button
          onClick={onOpenNotifications}
          className="mt-3 text-center text-xs font-bold text-cyan-600 transition-colors hover:text-cyan-700"
        >
          Xem tất cả →
        </button>
      </div>
    </div>
    </div>
  );
}
