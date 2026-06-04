import { Bell, Check, Clock, X } from "lucide-react";
import type { CustomerPortalNotification } from "../../../types/customer/portal";
import { getNotifConfig } from "../../../utils/customer/portalConfig";

type CustomerNotificationsTabProps = {
  notifications: CustomerPortalNotification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (notificationId: number) => void;
  onDismiss: (notificationId: number) => void;
  onOpenAppointments: () => void;
  onNotificationClick: (notification: CustomerPortalNotification) => void;
};

export function CustomerNotificationsTab({
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  onDismiss,
  onOpenAppointments,
  onNotificationClick,
}: CustomerNotificationsTabProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Thông báo</h2>
          <p className="text-sm text-slate-500 mt-0.5">{unreadCount > 0 ? `${unreadCount} chưa đọc` : "Tất cả đã đọc"}</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
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
          {notifications.map((notification) => {
            const cfg = getNotifConfig(notification.type);
            const Icon = cfg.icon;
            return (
              <div
                key={notification.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${notification.read ? "border-slate-200 opacity-80" : "border-slate-200"}`}
              >
                {!notification.read && <div className="h-0.5" style={{ background: `linear-gradient(to right, ${cfg.color}, transparent)` }} />}
                <div className="flex gap-4 p-5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: cfg.bg }}>
                    <Icon size={18} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[14px] font-bold ${notification.read ? "text-slate-700" : "text-slate-900"}`}>{notification.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <button onClick={(event) => { event.stopPropagation(); onDismiss(notification.id); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">{notification.desc}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[12px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock size={11} /> {notification.time}
                      </span>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={(event) => { event.stopPropagation(); onMarkRead(notification.id); }}
                            className="text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                        {(notification.type === "high" || notification.type === "medium") && (
                          <button
                            onClick={(event) => { event.stopPropagation(); onNotificationClick(notification); onOpenAppointments(); }}
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
  );
}
