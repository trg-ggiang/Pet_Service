import { Bell, LogOut } from "lucide-react";
import type { StaffProfile } from "../../features/staff/services/staffAppointments";
import { PawSVG } from "./StaffCommon";
import { NAV_ITEMS, type StaffNavId } from "./staffPortalConfig";

export function StaffSidebar({
  activeNav,
  profile,
  doneGrooming,
  totalGrooming,
  pendingCheckIn,
  needsFed,
  pendingPayments,
  onNavigate,
  onLogoutClick,
}: {
  activeNav: StaffNavId;
  profile: StaffProfile | null;
  doneGrooming: number;
  totalGrooming: number;
  pendingCheckIn: number;
  needsFed: number;
  pendingPayments: number;
  onNavigate: (id: StaffNavId) => void;
  onLogoutClick: () => void;
}) {
  const initials = profile?.initials || "--";

  return (
    <aside className="w-64 flex flex-col border-r border-slate-200 bg-white flex-shrink-0">
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
            <PawSVG className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">PetCare Center</div>
            <div className="text-[10px] text-slate-500 font-medium">Cổng nhân viên</div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">{profile?.fullName || "Nhân viên"}</div>
            <div className="text-[11px] text-slate-500 font-medium">{profile?.roleLabel || "Nhân viên chăm sóc"}</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-500 font-semibold">Tiến độ Grooming hôm nay</span>
            <span className="text-[11px] font-bold text-slate-900">{doneGrooming}/{totalGrooming}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${totalGrooming > 0 ? (doneGrooming / totalGrooming) * 100 : 0}%`,
                background: "linear-gradient(90deg,#0891B2,#06B6D4)",
              }}
            />
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeNav === id;
          const badge =
            id === "appointments" && pendingCheckIn > 0 ? pendingCheckIn :
            id === "boarding" && needsFed > 0 ? needsFed :
            id === "payments" && pendingPayments > 0 ? pendingPayments :
            null;

          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active ? "bg-cyan-50 text-cyan-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon size={16} />
              {label}
              {badge !== null && (
                <span className="ml-auto text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200">
        <button
          onClick={onLogoutClick}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

export function StaffHeader({
  activeNav,
  pendingCheckIn,
  needsFed,
  onBellClick,
}: {
  activeNav: StaffNavId;
  pendingCheckIn: number;
  needsFed: number;
  onBellClick?: () => void;
}) {
  const titles: Record<StaffNavId, string> = {
    appointments: "Quản lý lịch hẹn",
    grooming: "Dịch vụ Grooming",
    boarding: "Khu lưu trú",
    payments: "Quản lý thanh toán",
    settings: "Cài đặt",
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-base font-bold text-slate-900">{titles[activeNav]}</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>
      <button
        onClick={onBellClick}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors relative"
      >
        <Bell size={16} />
        {(pendingCheckIn > 0 || needsFed > 0) && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        )}
      </button>
    </header>
  );
}

export function StaffSettingsTab({ profile }: { profile: StaffProfile | null }) {
  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Cài đặt tài khoản</h3>
        <div className="space-y-3">
          {[
            { label: "Họ tên", value: profile?.fullName || "Chưa cập nhật" },
            { label: "Chức vụ", value: profile?.roleLabel || "Nhân viên chăm sóc" },
            { label: "Email", value: profile?.email || "Chưa cập nhật" },
            { label: "Số điện thoại", value: profile?.phone || "Chưa cập nhật" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
              <span className="text-sm font-semibold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LogoutConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-80 p-6" onClick={(event) => event.stopPropagation()}>
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <LogOut size={24} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-900 text-center">Xác nhận đăng xuất</h3>
        <p className="text-sm text-slate-500 text-center mt-2">Bạn có chắc muốn đăng xuất khỏi Cổng nhân viên?</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 h-10 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Hủy</button>
          <button onClick={onConfirm} className="flex-1 h-10 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">Đăng xuất</button>
        </div>
      </div>
    </div>
  );
}
