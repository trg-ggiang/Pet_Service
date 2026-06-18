import { useEffect, useRef, useState } from "react";
import { Bell, BedDouble, CalendarCheck, DollarSign, LogOut } from "lucide-react";
import { staffAppointmentsService, type StaffProfile } from "../../features/staff/services/staffAppointments";
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
  pendingPayments,
  onNavigate,
}: {
  activeNav: StaffNavId;
  pendingCheckIn: number;
  needsFed: number;
  pendingPayments: number;
  onNavigate: (id: StaffNavId) => void;
}) {
  const titles: Record<StaffNavId, string> = {
    appointments: "Quản lý lịch hẹn",
    grooming: "Dịch vụ Grooming",
    boarding: "Khu lưu trú",
    payments: "Quản lý thanh toán",
    settings: "Cài đặt",
  };

  const [showNotif, setShowNotif] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!bellRef.current?.contains(e.target as Node) && !dropdownRef.current?.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const totalAlerts = pendingCheckIn + needsFed + pendingPayments;

  const notifItems = [
    pendingCheckIn > 0 ? { label: `${pendingCheckIn} lịch hẹn chờ check-in`, navId: "appointments" as StaffNavId, icon: CalendarCheck, color: "#D97706" } : null,
    needsFed > 0 ? { label: `${needsFed} thú cưng cần cho ăn`, navId: "boarding" as StaffNavId, icon: BedDouble, color: "#7C3AED" } : null,
    pendingPayments > 0 ? { label: `${pendingPayments} hóa đơn chờ thanh toán`, navId: "payments" as StaffNavId, icon: DollarSign, color: "#059669" } : null,
  ].filter(Boolean) as { label: string; navId: StaffNavId; icon: typeof BedDouble; color: string }[];

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-base font-bold text-slate-900">{titles[activeNav]}</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>
      <div className="relative">
        <button
          ref={bellRef}
          onClick={() => setShowNotif((v) => !v)}
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors relative"
        >
          <Bell size={16} />
          {totalAlerts > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 border-2 border-white text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {totalAlerts}
            </span>
          )}
        </button>
        {showNotif && (
          <div ref={dropdownRef} className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Thông báo</span>
              {totalAlerts > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">{totalAlerts} cần xử lý</span>
              )}
            </div>
            {notifItems.length === 0 ? (
              <div className="px-4 py-5 text-sm text-slate-400 text-center">Không có thông báo mới</div>
            ) : (
              <div className="py-1">
                {notifItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.navId}
                      onClick={() => { onNavigate(item.navId); setShowNotif(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color + "20" }}>
                        <Icon size={15} style={{ color: item.color }} />
                      </div>
                      <span className="font-medium text-slate-800">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export function StaffSettingsTab({ profile }: { profile: StaffProfile | null }) {
  const fields = [
    { label: "Họ tên", value: profile?.fullName || "Chưa cập nhật" },
    { label: "Chức vụ", value: profile?.roleLabel || "Nhân viên chăm sóc" },
    { label: "Email", value: profile?.email || "Chưa cập nhật" },
    { label: "Số điện thoại", value: profile?.phone || "Chưa cập nhật" },
  ];

  const [inputHours, setInputHours] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    staffAppointmentsService.fetchAutoConfirmHours().then(h => setInputHours(String(h))).catch(() => {});
  }, []);

  async function handleSave() {
    const val = Number(inputHours);
    if (!Number.isFinite(val) || val < 0 || val > 72) {
      setSaveMsg({ type: "err", text: "Vui lòng nhập số từ 0 đến 72" });
      return;
    }
    setSaving(true);
    try {
      await staffAppointmentsService.updateAutoConfirmHours(val);
      setSaveMsg({ type: "ok", text: "Đã lưu" });
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg({ type: "err", text: "Lưu thất bại" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Thông tin tài khoản</h3>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
            Chỉ đọc
          </span>
        </div>
        <div className="space-y-1">
          {fields.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
              <span className="text-sm font-medium text-slate-500">{item.label}</span>
              <span className="text-sm font-semibold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-base font-bold text-slate-900 mb-1">Tự động xác nhận lịch hẹn</h3>
        <p className="text-xs text-slate-500 mb-4">
          Lịch hẹn chờ xác nhận quá số giờ dưới đây sẽ tự động chuyển thành "Đã xác nhận". Đặt 0 để tắt tính năng.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:border-cyan-400 transition-colors">
            <input
              type="number"
              min={0}
              max={72}
              value={inputHours}
              onChange={e => setInputHours(e.target.value)}
              className="w-14 bg-transparent text-sm font-semibold text-slate-900 outline-none text-center"
            />
            <span className="text-xs text-slate-500 font-medium">giờ</span>
          </div>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="h-9 px-4 rounded-xl text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Đang lưu…" : "Lưu"}
          </button>
          {saveMsg && (
            <span className={`text-xs font-semibold ${saveMsg.type === "ok" ? "text-emerald-600" : "text-red-500"}`}>
              {saveMsg.text}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-xs font-semibold text-slate-500">
          Để thay đổi thông tin tài khoản, liên hệ quản trị viên hoặc bộ phận nhân sự.
        </p>
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
