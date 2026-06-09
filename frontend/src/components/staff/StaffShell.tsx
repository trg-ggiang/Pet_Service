import { useState, useEffect } from "react";
import { Bell, LogOut, Key, User, ShieldAlert, CheckCircle } from "lucide-react";
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
}: {
  activeNav: StaffNavId;
  pendingCheckIn: number;
  needsFed: number;
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
      <button className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors relative">
        <Bell size={16} />
        {(pendingCheckIn > 0 || needsFed > 0) && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        )}
      </button>
    </header>
  );
}

export function StaffSettingsTab({
  profile,
  onProfileUpdate,
}: {
  profile: StaffProfile | null;
  onProfileUpdate?: (profile: StaffProfile) => void;
}) {
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setPhone(profile.phone);
      setAddress(profile.address);
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      if (!fullName.trim()) {
        throw new Error("Họ tên không được để trống.");
      }
      const updated = await staffAppointmentsService.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      setProfileSuccess("Cập nhật thông tin cá nhân thành công.");
      if (onProfileUpdate) {
        onProfileUpdate(updated);
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess("");
    setPasswordError("");

    try {
      if (!oldPassword || !newPassword || !confirmPassword) {
        throw new Error("Vui lòng điền đầy đủ thông tin mật khẩu.");
      }
      if (newPassword.length < 6) {
        throw new Error("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("Mật khẩu mới và xác nhận mật khẩu không trùng khớp.");
      }
      await staffAppointmentsService.updatePassword({
        oldPassword,
        newPassword,
      });
      setPasswordSuccess("Đổi mật khẩu thành công.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Đổi mật khẩu thất bại.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Edit Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Thông tin cá nhân</h3>
              <p className="text-xs text-slate-500 font-medium">Cập nhật thông tin liên hệ của bạn</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={14} className="flex-shrink-0" />
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert size={14} className="flex-shrink-0" />
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Họ và tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/10"
                placeholder="Nhập họ tên"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Số điện thoại</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/10"
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Địa chỉ</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/10 resize-none"
                placeholder="Nhập địa chỉ"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Chức vụ / Phòng ban</label>
              <input
                type="text"
                value={`${profile?.roleLabel || "Nhân viên"} (${profile?.department || "reception"})`}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full h-11 rounded-xl text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {profileLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Key size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Đổi mật khẩu</h3>
              <p className="text-xs text-slate-500 font-medium">Bảo vệ tài khoản của bạn</p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={14} className="flex-shrink-0" />
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert size={14} className="flex-shrink-0" />
              {passwordError}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Mật khẩu cũ</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/10"
                placeholder="Nhập mật khẩu cũ"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/10"
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/10"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full h-11 rounded-xl text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {passwordLoading ? "Đang đổi mật khẩu..." : "Cập nhật mật khẩu"}
            </button>
          </form>
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
