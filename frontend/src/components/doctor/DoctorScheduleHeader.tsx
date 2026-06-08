import { useState } from "react";
import { Bell } from "lucide-react";
import type { DoctorNotification, DoctorScheduleMeta } from "../../features/doctor/services/doctorAppointments";

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function DoctorScheduleHeader({
  meta,
  notifications,
  unreadCount,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}: {
  meta: DoctorScheduleMeta;
  notifications: DoctorNotification[];
  unreadCount: number;
  onMarkNotificationRead: (id: number) => void;
  onMarkAllNotificationsRead: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="h-14 border-b border-border bg-white px-6 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-sm font-bold text-foreground">{meta.title}</h1>
        <p className="text-[11px] text-muted-foreground">{meta.dateLabel}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setOpen((value) => !value)}
            className="w-8 h-8 rounded-xl border border-border bg-white flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative"
            aria-label="Thông báo"
          >
            <Bell size={14} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-10 z-40 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Thông báo</span>
                    {unreadCount > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{unreadCount}</span>}
                  </div>
                  <button onClick={onMarkAllNotificationsRead} className="text-xs font-semibold text-cyan-600 hover:underline">Đánh dấu đã đọc</button>
                </div>

                <div className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm font-semibold text-slate-500">Chưa có thông báo</div>
                  ) : notifications.slice(0, 8).map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => onMarkNotificationRead(notification.id)}
                      className={`block w-full px-4 py-3 text-left transition-colors ${notification.isRead ? "hover:bg-slate-50" : "bg-cyan-50/60 hover:bg-cyan-50"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-bold leading-snug text-slate-900">{notification.title}</div>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{notification.content}</p>
                          <div className="mt-1 text-[11px] font-semibold text-slate-400">{formatNotificationTime(notification.createdAt)}</div>
                        </div>
                        {!notification.isRead && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
