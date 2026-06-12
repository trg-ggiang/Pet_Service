import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Edit3, Loader2, Mail, MapPin, Phone, UserRound, X } from "lucide-react";
import type { CustomerGender, CustomerProfile } from "../../../services/customer/customerProfileApi";

const GENDER_LABELS: Record<CustomerGender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
  UNKNOWN: "Chưa cập nhật",
};

function fieldValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "Chưa cập nhật" : String(value);
}

export function CustomerProfileTab({
  profile,
  loading,
  error,
  onRefresh,
  onSave,
}: {
  profile: CustomerProfile | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onSave: (input: {
    fullName: string;
    phone: string;
    address: string;
    dateOfBirth: string | null;
    gender: CustomerGender;
  }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<CustomerGender>("UNKNOWN");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName || "");
    setPhone(profile.phone || "");
    setAddress(profile.address || "");
    setDateOfBirth(profile.dateOfBirth || "");
    setGender(profile.gender || "UNKNOWN");
  }, [profile]);

  async function handleSave() {
    if (!fullName.trim() || saving) return;
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      await onSave({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        dateOfBirth: dateOfBirth || null,
        gender,
      });
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Không thể lưu hồ sơ.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-600" />
        <div className="mt-3 text-sm font-semibold text-slate-500">Đang tải hồ sơ...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center">
        <div className="text-sm font-semibold text-red-700">{error}</div>
        <button onClick={onRefresh} className="mt-4 h-10 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700">
          Tải lại
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const fields = [
    { icon: UserRound, label: "Họ tên", value: profile.fullName },
    { icon: Mail, label: "Email đăng nhập", value: profile.email },
    { icon: Phone, label: "Số điện thoại", value: profile.phone },
    { icon: Calendar, label: "Ngày sinh", value: profile.dateOfBirth },
    { icon: Calendar, label: "Tuổi", value: profile.age === null ? null : `${profile.age} tuổi` },
    { icon: UserRound, label: "Giới tính", value: GENDER_LABELS[profile.gender] },
    { icon: MapPin, label: "Địa chỉ", value: profile.address },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <UserRound size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Hồ sơ chủ thú cưng</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditing((value) => !value);
              setSaved(false);
              setSaveError("");
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            {editing ? <X size={15} /> : <Edit3 size={15} />}
            {editing ? "Hủy chỉnh sửa" : "Chỉnh sửa"}
          </button>
        </div>

        {saved && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={16} className="mr-2 inline-block" />
            Hồ sơ đã được cập nhật.
          </div>
        )}

        {!editing ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {fields.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <Icon size={13} />
                  {label}
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900">{fieldValue(value)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Họ tên</span>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Email đăng nhập</span>
              <input value={profile.email} disabled className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-500" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Số điện thoại</span>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Ngày sinh</span>
              <input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Giới tính</span>
              <select value={gender} onChange={(event) => setGender(event.target.value as CustomerGender)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20">
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
                <option value="UNKNOWN">Chưa cập nhật</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Địa chỉ</span>
              <textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={3} className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
            </label>
            {saveError && <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{saveError}</div>}
            <div className="md:col-span-2 flex justify-end gap-3">
              <button onClick={() => setEditing(false)} disabled={saving} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                Hủy
              </button>
              <button onClick={() => void handleSave()} disabled={saving || !fullName.trim()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-60">
                {saving && <Loader2 size={15} className="animate-spin" />}
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
