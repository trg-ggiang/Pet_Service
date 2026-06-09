import { useState, useEffect } from "react";
import { Key, User, ShieldAlert, CheckCircle } from "lucide-react";
import { fetchCustomerProfile, updateCustomerProfile, updateCustomerPassword, type CustomerProfile } from "../../../services/customerPets";

export function CustomerSettingsTab({
  userName,
  onProfileUpdate,
}: {
  userName: string;
  onProfileUpdate?: (newName: string) => void;
}) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [updateError, setUpdateError] = useState("");

  // Password Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError("");
      const data = await fetchCustomerProfile();
      setProfile(data);
      setFullName(data.fullName);
      setPhone(data.phone);
      setAddress(data.address);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Không thể tải thông tin hồ sơ.");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateSuccess("");
    setUpdateError("");

    try {
      if (!fullName.trim()) {
        throw new Error("Họ tên không được để trống.");
      }
      const updated = await updateCustomerProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      setProfile(updated);
      setUpdateSuccess("Cập nhật thông tin cá nhân thành công.");
      if (onProfileUpdate) {
        onProfileUpdate(updated.fullName);
      }
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      setUpdateLoading(false);
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
      await updateCustomerPassword({
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

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="w-8 h-8 text-cyan-600 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-semibold max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert size={18} />
          <span>Lỗi tải thông tin</span>
        </div>
        <p className="text-xs text-red-600">{profileError}</p>
        <button
          onClick={() => void loadProfile()}
          className="mt-3 text-xs text-cyan-600 font-bold hover:underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Thông tin cá nhân</h3>
              <p className="text-xs text-slate-500 font-medium font-sans">Cập nhật thông tin tài khoản của bạn</p>
            </div>
          </div>

          {updateSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={14} className="flex-shrink-0" />
              {updateSuccess}
            </div>
          )}

          {updateError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert size={14} className="flex-shrink-0" />
              {updateError}
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Địa chỉ email (không thể thay đổi)</label>
              <input
                type="text"
                value={profile?.email || ""}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={updateLoading}
              className="w-full h-11 rounded-xl text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {updateLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Key size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Đổi mật khẩu</h3>
              <p className="text-xs text-slate-500 font-medium">Bảo vệ an toàn cho tài khoản</p>
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
