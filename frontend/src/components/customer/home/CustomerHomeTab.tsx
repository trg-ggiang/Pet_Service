import { Calendar, ChevronRight, Clock, Heart, MapPin, Plus } from "lucide-react";
import type { Apt, CustomerPortalNotification, Pet } from "../../../types/customer/portal";
import { getNotifConfig, getPetColorById } from "../../../utils/customer/portalConfig";

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

export function CustomerHomeTab({
  userName,
  apts,
  pets,
  notifications,
  notificationsLoading,
  notificationsError,
  unreadCount,
  onBookAppointment,
  onOpenAppointments,
  onOpenPets,
  onOpenHistory,
  onOpenNotifications,
  onNotificationClick,
}: {
  userName: string;
  apts: Apt[];
  pets: Pet[];
  notifications: CustomerPortalNotification[];
  notificationsLoading: boolean;
  notificationsError: string;
  unreadCount: number;
  onBookAppointment: () => void;
  onOpenAppointments: () => void;
  onOpenPets: () => void;
  onOpenHistory: () => void;
  onOpenNotifications: () => void;
  onNotificationClick: (notification: CustomerPortalNotification) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-4 auto-rows-[88px]">
                {/* Welcome Card - Large, spans 4 columns and 3 rows */}
                <div className="relative z-0 col-span-6 md:col-span-4 md:col-start-1 md:row-start-1 row-span-3 rounded-3xl p-6 text-white shadow-md overflow-hidden" style={{ background: "linear-gradient(135deg,#0891B2 0%,#06B6D4 100%)" }}>
                  <div className="relative z-0 h-full flex flex-col">
                    <p className="text-sm font-medium opacity-90 mb-1">Xin chào trở lại 👋</p>
                    <h2 className="text-2xl font-bold">{userName}</h2>
                    <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium w-fit">
                      <Calendar size={14} />
                      <span>Có <strong>{apts.length} lịch hẹn</strong> sắp tới</span>
                    </div>
                    <button
                      onClick={onOpenAppointments}
                      className="mt-auto flex items-center gap-1.5 bg-white text-cyan-700 hover:bg-cyan-50 transition-colors rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm w-fit"
                    >
                      Xem lịch hẹn <ChevronRight size={16} />
                    </button>
                  </div>
                  <PawSVG className="absolute -right-8 -bottom-8 w-48 h-48 text-white opacity-10 rotate-[-15deg]" />
                </div>
    
                {/* Quick Actions - 2 tall cards on the right */}
                <button
                  onClick={onBookAppointment}
                  className="col-span-6 md:col-span-2 md:col-start-5 md:row-start-1 bg-white border border-slate-200 rounded-2xl p-4 text-left hover:shadow-md hover:border-cyan-200 transition-all active:scale-[0.98] group grid grid-cols-[44px_1fr] items-center gap-x-3"
                >
                  <div className="w-11 h-11 row-span-2 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: "#ECFEFF" }}>
                    <Plus size={20} style={{ color: "#0891B2" }} />
                  </div>
                  <div className="self-end text-[15px] font-bold text-slate-900 leading-tight">Đặt lịch mới</div>
                  <div className="self-start text-xs font-medium text-slate-500 mt-0.5">Chọn dịch vụ & bác sĩ</div>
                </button>
    
                <button
                  onClick={onOpenPets}
                  className="col-span-3 md:col-span-2 row-span-3 bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-md hover:border-cyan-200 transition-all active:scale-[0.98] group flex flex-col overflow-hidden relative"
                >
                  <div className="absolute right-0 top-0 w-44 h-36 overflow-hidden rounded-bl-[2.5rem] pointer-events-none">
                    <img
                      src="https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=520&fit=crop"
                      alt="Pet care cover"
                      className="w-full h-full object-cover opacity-35"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-rose-50/20 via-rose-50/50 to-white" />
                  </div>
                  <div className="absolute right-4 top-4 w-20 h-20 rounded-full bg-rose-100/60 blur-2xl pointer-events-none" />
                  <div className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center mb-auto group-hover:scale-110 transition-transform" style={{ background: "#FFF1F2" }}>
                    <Heart size={22} style={{ color: "#E11D48" }} />
                  </div>
                  <div className="relative z-10 mt-6 flex flex-1 flex-col justify-end">
                    <div className="min-w-0 max-w-[82%]">
                      <div className="text-lg font-bold text-slate-900 leading-tight">Hồ sơ thú cưng</div>
                      <div className="text-xs font-medium text-slate-500 mt-1">Xem tình trạng sức khoẻ</div>
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold ring-1 ring-inset ring-rose-100 w-fit max-w-full">
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-white text-rose-600 text-[11px] leading-none flex items-center justify-center shadow-sm shrink-0">
                          {pets.length}
                        </span>
                        <span className="tracking-tight break-words">
                          hồ sơ đang theo dõi
                        </span>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-end gap-2 shrink-0 pb-1 self-end">
                      {pets.slice(0, 3).map((pet, index) => {
                        const clr = getPetColorById(pet.colorId);
                        return (
                          <div
                            key={pet.id}
                            className="w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${clr.from}, ${clr.to})`, transform: `translateY(${index % 2 === 0 ? 0 : 2}px)` }}
                          >
                            {pet.image ? (
                              <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">{pet.initials}</div>
                            )}
                          </div>
                        );
                      })}
                      {pets.length > 3 && (
                        <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-100 shadow-sm flex items-center justify-center text-slate-600 text-xs font-bold">
                          +{pets.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
    
                {/* Bottom Quick Actions - 2 smaller cards */}
                <button
                  onClick={onOpenHistory}
                  className="col-span-3 md:col-span-2 md:col-start-5 md:row-start-2 row-span-1 bg-white border border-slate-200 rounded-2xl p-4 text-left hover:shadow-md hover:border-cyan-200 transition-all active:scale-[0.98] group flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0" style={{ background: "#F5F3FF" }}>
                    <Clock size={20} style={{ color: "#7C3AED" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-slate-900 leading-tight">Lịch sử dịch vụ</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">Tất cả giao dịch</div>
                  </div>
                </button>
    
                <button
                  className="col-span-3 md:col-span-2 md:col-start-5 md:row-start-3 row-span-1 bg-white border border-slate-200 rounded-2xl p-4 text-left hover:shadow-md hover:border-cyan-200 transition-all active:scale-[0.98] group flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0" style={{ background: "#ECFDF5" }}>
                    <MapPin size={20} style={{ color: "#059669" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-slate-900 leading-tight">Tìm phòng khám</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">Địa chỉ & giờ mở cửa</div>
                  </div>
                </button>
    
                {/* Upcoming Appointments - Wide card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 col-span-6 md:col-span-4 row-span-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-slate-900">Lịch hẹn sắp tới</h3>
                    <button onClick={onOpenAppointments} className="text-sm font-semibold text-cyan-600 hover:text-cyan-700">Xem tất cả</button>
                  </div>
                  <div className="space-y-3">
                    {apts.slice(0, 4).map((apt) => {
                      const Icon = apt.icon;
                      return (
                        <div key={apt.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:border-cyan-100 transition-colors cursor-pointer">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm border border-slate-100">
                            <Icon size={20} style={{ color: apt.iconColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[15px] font-bold text-slate-900">{apt.service}</div>
                            <div className="text-sm font-medium text-slate-500 mt-0.5">
                              <span className="text-slate-700">{apt.pet}</span> • {apt.doctor}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                            <div className="text-sm font-bold text-slate-900">{apt.date}</div>
                            <div className="text-xs font-semibold text-cyan-600 mt-0.5">{apt.time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
    
                {/* Notification preview */}
                <div className="col-span-6 md:col-span-2 row-span-3 bg-white border border-slate-200 rounded-3xl p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">Thông báo mới</h3>
                      {unreadCount > 0 && (
                        <span className="text-[11px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">{unreadCount}</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {notificationsLoading && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center text-xs font-semibold text-slate-500">
                        Đang tải thông báo...
                      </div>
                    )}
                    {!notificationsLoading && notificationsError && (
                      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-xs font-semibold text-red-600">
                        {notificationsError}
                      </div>
                    )}
                    {!notificationsLoading && !notificationsError && unreadCount === 0 && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center text-xs font-semibold text-slate-500">
                        Không có thông báo mới
                      </div>
                    )}
                    {!notificationsLoading && !notificationsError && notifications.filter((n) => !n.read).slice(0, 3).map((n) => {
                        const cfg = getNotifConfig(n.type);
                        const Icon = cfg.icon;
                        return (
                          <div key={n.id} onClick={() => onNotificationClick(n)} className="flex gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-shadow" style={{ borderColor: cfg.borderColor, background: cfg.bg }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "white" }}>
                              <Icon size={14} style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold line-clamp-1" style={{ color: cfg.color }}>{n.title}</div>
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">{n.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <button onClick={onOpenNotifications} className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 mt-3 text-center">Xem tất cả →</button>
                </div>
              </div>
  );
}
