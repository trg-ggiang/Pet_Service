import { useEffect, useState } from "react";
import { Activity, BedDouble, CheckCircle2, Coffee, Eye, Image as ImageIcon, ImagePlus, Loader2, Stethoscope, Star, Upload, X } from "lucide-react";
import type {
  BoardingDailyStatus,
  BoardingGuest,
  PaymentItem,
  PaymentMethod,
  StaffAppointment,
} from "../../features/staff/services/staffAppointments";
import { APT_STATUS_CONFIG, SERVICE_ICONS } from "./staffPortalConfig";

export function AppointmentDetailModal({ apt, onClose, onConfirm, onCheckIn, onCompleteGrooming, onApproveRequest, approving, completingGrooming }: {
  apt: StaffAppointment;
  onClose: () => void;
  onConfirm: () => void;
  onCheckIn: () => void;
  onCompleteGrooming: () => void;
  onApproveRequest: () => void;
  approving?: boolean;
  completingGrooming?: boolean;
}) {
  const statusCfg = APT_STATUS_CONFIG[apt.status];
  const svcIcon = SERVICE_ICONS[apt.serviceType] || SERVICE_ICONS.exam;
  const Icon = svcIcon.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg" onClick={(event) => event.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: svcIcon.bg }}>
              <Icon size={20} style={{ color: svcIcon.color }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{apt.service}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Mã: {apt.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg inline-block" style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}>
            {statusCfg.label}
          </span>
          {[
            { label: "Thú cưng", value: `${apt.petName} (${apt.species}${apt.breed ? ` · ${apt.breed}` : ""})` },
            { label: "Chủ nuôi", value: apt.owner },
            { label: "Số điện thoại", value: apt.phone },
            { label: "Ngày khám", value: apt.date || "--" },
            { label: "Giờ khám", value: apt.time || "--" },
            { label: "Phòng/Số thứ tự", value: apt.queue || "--" },
            { label: "Loại dịch vụ", value: apt.service },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">{item.label}</span>
              <span className="text-sm font-bold text-slate-900">{item.value}</span>
            </div>
          ))}
          {apt.note && (
            <div className="py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">Ghi chú</span>
              <p className="text-sm font-medium text-slate-700 mt-1">{apt.note}</p>
            </div>
          )}
          {apt.pendingRequest && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              <div>{apt.pendingRequest.type === "RESCHEDULE" ? "Yêu cầu đổi lịch" : "Yêu cầu hủy lịch"}</div>
              {apt.pendingRequest.type === "RESCHEDULE" && (
                <div className="mt-1 text-amber-700">Lịch mới: {apt.pendingRequest.date || "--"} {String(apt.pendingRequest.time || "").slice(0, 5)}</div>
              )}
              {apt.pendingRequest.reason && <div className="mt-1 text-amber-700">Lý do: {apt.pendingRequest.reason}</div>}
            </div>
          )}
        </div>
        {(apt.status === "scheduled" || apt.status === "confirmed" || (apt.status === "in_progress" && apt.serviceType === "grooming")) && (
          <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
            {apt.status === "scheduled" && apt.pendingRequest ? (
              <button onClick={onApproveRequest} disabled={approving} className="w-full h-11 rounded-xl bg-emerald-500 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> {approving ? "Đang duyệt..." : "Duyệt yêu cầu"}
              </button>
            ) : apt.status === "scheduled" ? (
              <button onClick={onConfirm} className="w-full h-11 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
                <CheckCircle2 size={16} /> Xác nhận lịch hẹn
              </button>
            ) : apt.status === "confirmed" ? (
              <button onClick={onCheckIn} className="w-full h-11 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg,#7C3AED,#8B5CF6)" }}>
                <CheckCircle2 size={16} /> Check-in · Bắt đầu khám
              </button>
            ) : apt.status === "in_progress" && apt.serviceType === "grooming" ? (
              <button onClick={onCompleteGrooming} disabled={completingGrooming} className="w-full h-11 rounded-xl bg-emerald-500 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> {completingGrooming ? "Đang hoàn thành..." : "Hoàn thành grooming"}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function BoardingDetailModal({ guest, onClose, onToggleStatus, onSaveDailyUpdate }: {
  guest: BoardingGuest;
  onClose: () => void;
  onToggleStatus: (field: keyof BoardingDailyStatus) => void;
  onSaveDailyUpdate: (dailyNote: string, imageDataUrl: string | null) => Promise<void>;
}) {
  const [dailyNote, setDailyNote] = useState(guest.todayNote || "");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState(guest.todayImageUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [viewingImage, setViewingImage] = useState<{ src: string; label: string } | null>(null);

  const statusItems = [
    { label: "Bữa sáng", field: "breakfast" as const, icon: Coffee },
    { label: "Bữa trưa", field: "lunch" as const, icon: Coffee },
    { label: "Bữa tối", field: "dinner" as const, icon: Coffee },
    { label: "Vệ sinh phòng", field: "cleaned" as const, icon: Star },
    { label: "Vận động", field: "exercised" as const, icon: Activity },
    { label: "Kiểm tra sức khỏe", field: "healthCheck" as const, icon: Stethoscope },
  ];
  const dailyHistory = guest.dailyUpdates || [];
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  useEffect(() => {
    setDailyNote(guest.todayNote || "");
    setPreviewUrl(guest.todayImageUrl || "");
    setImageDataUrl(null);
    setError("");
    setSavedMessage("");
  }, [guest.id, guest.todayNote, guest.todayImageUrl]);

  function handleImageChange(file: File | undefined) {
    setError("");
    setSavedMessage("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      setImageDataUrl(value);
      setPreviewUrl(value);
    };
    reader.onerror = () => setError("Không thể đọc ảnh đã chọn.");
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await onSaveDailyUpdate(dailyNote.trim(), imageDataUrl);
      setImageDataUrl(null);
      setSavedMessage("Đã lưu nhật ký lưu trú hôm nay. Chủ nuôi có thể xem cập nhật mới trong hồ sơ thú cưng.");
    } catch (err) {
      setSavedMessage("");
      setError(err instanceof Error ? err.message : "Không thể lưu cập nhật lưu trú.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <BedDouble size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{guest.petName} · Phòng {guest.room}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{guest.species} · {guest.breed}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Thông tin chủ nuôi</h4>
            {[
              { label: "Họ tên", value: guest.owner },
              { label: "Số điện thoại", value: guest.phone },
              { label: "Check-in", value: guest.checkIn || "--" },
              { label: "Check-out", value: guest.checkOut || "--" },
              { label: "Số đêm", value: `${guest.nights} đêm` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-xs py-1">
                <span className="text-slate-500 font-medium">{item.label}:</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Chế độ ăn uống</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Loại thức ăn:</span>
                <span className="font-bold text-slate-900">{guest.foodType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Số bữa/ngày:</span>
                <span className="font-bold text-slate-900">{guest.mealsPerDay} bữa</span>
              </div>
              {guest.specialNotes && <div className="pt-2 border-t border-slate-200 text-slate-700">{guest.specialNotes}</div>}
            </div>
          </div>
          <div className="bg-cyan-50 rounded-2xl p-4 border border-cyan-100">
            <h4 className="text-sm font-bold text-cyan-900 mb-3">Cập nhật trạng thái hôm nay</h4>
            <div className="grid grid-cols-2 gap-2">
              {statusItems.map((item) => {
                const Icon = item.icon;
                const done = guest.todayStatus[item.field];
                return (
                  <button key={item.field} onClick={() => onToggleStatus(item.field)} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                    done ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}>
                    {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h4 className="text-sm font-bold text-slate-900">Ảnh và ghi chú hôm nay</h4>
              <label className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2 cursor-pointer">
                <ImagePlus size={14} />
                Chọn ảnh
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => handleImageChange(event.target.files?.[0])}
                />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-[180px,1fr]">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {previewUrl ? (
                  <img src={previewUrl} alt={`Cập nhật lưu trú của ${guest.petName}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                    <Upload size={24} />
                    <span className="mt-2 text-xs font-semibold">Chưa có ảnh</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <textarea
                  value={dailyNote}
                  onChange={(event) => {
                    setDailyNote(event.target.value);
                    setSavedMessage("");
                  }}
                  rows={4}
                  maxLength={500}
                  placeholder="Tình trạng ăn uống, tinh thần, dấu hiệu cần theo dõi..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />
                {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</div>}
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="h-10 w-full rounded-xl bg-cyan-600 text-sm font-bold text-white transition-colors hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {saving ? "Đang lưu..." : "Lưu cập nhật hôm nay"}
                </button>
                {savedMessage && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-emerald-800">Lưu nhật ký thành công</div>
                        <p className="mt-1 text-xs font-semibold leading-5 text-emerald-700">{savedMessage}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-3 h-9 w-full rounded-xl bg-emerald-600 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                    >
                      Đóng
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Nhật ký các ngày</h4>
            {dailyHistory.length > 0 ? (
              <div className="space-y-3">
                {dailyHistory.map((update) => {
                  const doneItems = statusItems.filter((item) => update.status[item.field]);
                  return (
                    <div key={`${update.id}-${update.date}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative h-28 w-full overflow-hidden rounded-xl border border-slate-200 bg-white sm:w-36 sm:flex-shrink-0">
                          {update.imageUrl ? (
                            <>
                              <img src={update.imageUrl} alt={`Nhật ký lưu trú ngày ${update.date}`} className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setViewingImage({ src: update.imageUrl || "", label: update.date })}
                                className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/90 text-slate-700 shadow-sm transition-colors hover:bg-white hover:text-cyan-700 flex items-center justify-center"
                                aria-label="Xem ảnh"
                              >
                                <Eye size={15} />
                              </button>
                            </>
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center text-slate-300">
                              <ImageIcon size={22} />
                              <span className="mt-1 text-xs font-semibold">Chưa có ảnh</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-bold text-slate-900">{update.date}</div>
                            {update.date === todayKey && (
                              <span className="rounded-full bg-cyan-50 px-2 py-1 text-[11px] font-bold text-cyan-700">Hôm nay</span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {doneItems.length > 0 ? doneItems.map((item) => (
                              <span key={item.field} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                                {item.label}
                              </span>
                            )) : (
                              <span className="text-xs font-semibold text-slate-400">Chưa cập nhật trạng thái</span>
                            )}
                          </div>
                          {update.note && (
                            <div className="mt-3 rounded-xl border border-cyan-100 bg-white px-3 py-2">
                              <div className="text-[11px] font-bold uppercase tracking-wide text-cyan-700">Cập nhật tình trạng</div>
                              <p className="mt-1 whitespace-pre-line text-xs font-semibold leading-5 text-slate-700">{update.note}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-400">
                Chưa có nhật ký lưu trú.
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex-shrink-0">
          <button onClick={onClose} className="w-full h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-white transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
    {viewingImage && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4" onClick={() => setViewingImage(null)}>
        <div className="relative max-h-[92vh] w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={() => setViewingImage(null)}
            className="absolute right-3 top-3 z-10 h-10 w-10 rounded-full bg-white/90 text-slate-700 shadow-sm transition-colors hover:bg-white flex items-center justify-center"
            aria-label="Đóng ảnh"
          >
            <X size={18} />
          </button>
          <img src={viewingImage.src} alt={`Ảnh lưu trú ngày ${viewingImage.label}`} className="max-h-[92vh] w-full rounded-2xl object-contain" />
        </div>
      </div>
    )}
    </>
  );
}

export function PaymentProcessModal({ payment, onClose, onComplete }: {
  payment: PaymentItem;
  onClose: () => void;
  onComplete: (method: PaymentMethod) => Promise<void>;
}) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md" onClick={(event) => event.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Xác nhận thanh toán</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Mã: {payment.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: "Thú cưng", value: payment.petName },
            { label: "Chủ nuôi", value: payment.owner },
            { label: "Dịch vụ", value: payment.service },
            { label: "Ngày", value: payment.date },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">{item.label}</span>
              <span className="text-sm font-bold text-slate-900">{item.value}</span>
            </div>
          ))}
          <div className="bg-cyan-50 rounded-2xl p-4 border border-cyan-100">
            <div className="text-sm text-slate-500 font-medium mb-1">Tổng tiền</div>
            <div className="text-3xl font-bold text-cyan-700">{payment.amount.toLocaleString()} VND</div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Phương thức thanh toán</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "cash" as const, label: "Tiền mặt" },
                { id: "transfer" as const, label: "Chuyển khoản" },
                { id: "card" as const, label: "Thẻ" },
              ].map((item) => (
                <button key={item.id} onClick={() => setMethod(item.id)} className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  method === item.id ? "bg-cyan-50 border-cyan-500 text-cyan-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {error && <div className="px-6 pb-2"><div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3">{error}</div></div>}
        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex gap-3">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-white transition-colors disabled:opacity-50">
            Hủy
          </button>
          <button
            onClick={async () => {
              setSubmitting(true);
              setError("");
              try { await onComplete(method); }
              catch (err) { setError(err instanceof Error ? err.message : "Thanh toán thất bại"); setSubmitting(false); }
            }}
            disabled={submitting}
            className="flex-1 h-11 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
          >
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Đang xử lý...</> : "Xác nhận thanh toán"}
          </button>
        </div>
      </div>
    </div>
  );
}
