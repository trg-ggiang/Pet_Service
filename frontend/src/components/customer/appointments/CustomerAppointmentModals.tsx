import { useEffect, useState } from "react";
import { Calendar, Check, CheckCircle2, ChevronDown, Heart, Pill, Star, Stethoscope, Syringe, X } from "lucide-react";
import type { CustomerAppointmentOptions, CustomerAppointmentProvider } from "../../../types/customer/appointments";
import type { Apt, Pet, ServiceType } from "../../../types/customer/portal";
import { getServiceTypeConfig, getStatusConfig } from "../../../utils/customer/portalConfig";
import { fetchAvailableCages, fetchCustomerReview, submitCustomerReview } from "../../../services/customer/customerAppointmentsApi";

// ─────────────────────────────────────────────────────────────────────────────
// New Appointment Modal
// ─────────────────────────────────────────────────────────────────────────────

function getServiceIcon(iconKey: string) {
  if (iconKey === "vaccine") return Syringe;
  if (iconKey === "grooming") return Star;
  if (iconKey === "boarding") return Calendar;
  return Stethoscope;
}

const INPUT_CLS = "w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all";
const LABEL_CLS = "block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide";

function getFriendlyAppointmentNoteLines(note?: string) {
  const raw = String(note || "").trim();
  if (!raw) return [];

  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("[CUSTOMER_REQUEST]") && !line.startsWith("{") && !line.endsWith("}"));
}

function formatCurrency(value?: number) {
  if (!Number.isFinite(value)) return "Chưa có";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value ?? 0);
}

export function NewAppointmentModal({
  pets,
  options,
  defaultPet,
  onClose,
  onLoadProviders,
  onAdd,
}: {
  pets: Pet[];
  options: CustomerAppointmentOptions;
  defaultPet?: string;
  onClose: () => void;
  onLoadProviders: (input: { serviceId?: number; serviceType: ServiceType; date: string; time: string }) => Promise<CustomerAppointmentProvider[]>;
  onAdd: (input: any) => Promise<Apt>;
}) {
  const services = options.services;
  const [form, setForm] = useState({
    pet: defaultPet ?? pets[0]?.name ?? "",
    serviceIdx: 0,
    date: "",
    time: "",
    note: "",
    checkOutDate: "",
    cageId: "",
  });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [newAptId, setNewAptId] = useState("");
  const [providers, setProviders] = useState<CustomerAppointmentProvider[]>([]);
  const [selectedProviderKey, setSelectedProviderKey] = useState("");
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerError, setProviderError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [availableCages, setAvailableCages] = useState<any[]>([]);
  const [cagesLoading, setCagesLoading] = useState(false);
  const [cagesError, setCagesError] = useState("");

  const svc = services[form.serviceIdx] ?? services[0];
  const isBoarding = svc?.serviceType === "Lưu trú";
  
  // Điều kiện để bấm "Tiếp theo" ở Bước 1
  const selectedProvider = providers.find((provider) => `${provider.role}:${provider.id}` === selectedProviderKey) ?? null;
  const canStep2 = !!(
    svc &&
    form.pet &&
    form.date &&
    form.time &&
    selectedProvider &&
    !providerError &&
    !providerLoading &&
    (!isBoarding || (form.checkOutDate && form.cageId && !cagesError && !cagesLoading))
  );
  // Điều kiện để bấm "Xác nhận" ở Bước 2
  const canNext = !!(canStep2 && selectedProvider);

  useEffect(() => {
    let ignore = false;
    if (!isBoarding || !form.date || !form.checkOutDate) {
      setAvailableCages([]);
      setForm((f) => ({ ...f, cageId: "" }));
      return;
    }

    async function loadCages() {
      try {
        setCagesLoading(true);
        setCagesError("");
        const cages = await fetchAvailableCages(form.date, form.checkOutDate);
        if (!ignore) {
          setAvailableCages(cages);
          setForm((f) => ({ ...f, cageId: cages[0]?.id ? String(cages[0].id) : "" }));
          if (cages.length === 0) {
            setCagesError("Không còn phòng/chuồng trống nào trong thời gian này.");
          }
        }
      } catch (err) {
        if (!ignore) {
          setAvailableCages([]);
          setForm((f) => ({ ...f, cageId: "" }));
          setCagesError(err instanceof Error ? err.message : "Không thể tải phòng trống.");
        }
      } finally {
        if (!ignore) setCagesLoading(false);
      }
    }

    void loadCages();
    return () => {
      ignore = true;
    };
  }, [form.date, form.checkOutDate, isBoarding]);

  useEffect(() => {
    let ignore = false;

    async function loadProviderOptions() {
      if (!svc || !form.date || !form.time) {
        setProviders([]);
        setSelectedProviderKey("");
        setProviderError("");
        return;
      }

      try {
        setProviderLoading(true);
        setProviderError("");
        const nextProviders = await onLoadProviders({
          serviceId: svc.id,
          serviceType: svc.serviceType,
          date: form.date,
          time: form.time,
        });
        if (!ignore) {
          setProviders(nextProviders);
          setSelectedProviderKey(nextProviders[0] ? `${nextProviders[0].role}:${nextProviders[0].id}` : "");
          if (nextProviders.length === 0) setProviderError("Không có người phụ trách trống trong khung giờ này.");
        }
      } catch (err) {
        if (!ignore) {
          setProviders([]);
          setSelectedProviderKey("");
          const message = err instanceof Error ? err.message : "";
          setProviderError(
            message.includes("không có quyền truy cập")
              ? "Phiên đăng nhập không hợp lệ. Vui lòng đăng xuất và đăng nhập lại bằng tài khoản khách hàng."
              : message || "Không tìm thấy người phụ trách phù hợp.",
          );
        }
      } finally {
        if (!ignore) setProviderLoading(false);
      }
    }

    void loadProviderOptions();

    return () => {
      ignore = true;
    };
  }, [form.date, form.time, form.serviceIdx, onLoadProviders, svc]);

  const handleConfirm = async () => {
    if (!svc) {
      setError("Không có dịch vụ khả dụng.");
      return;
    }
    if (!selectedProvider) {
      setError("Vui lòng chọn người phụ trách.");
      return;
    }
    const serviceType: ServiceType = svc.serviceType;

    try {
      setSaving(true);
      setError("");
      const appointment = await onAdd({
        date: form.date,
        time: form.time,
        serviceId: svc.id,
        service: svc.name,
        pet: form.pet,
        serviceType,
        providerRole: selectedProvider.role,
        providerId: selectedProvider.id,
        note: form.note,
        ...(isBoarding ? {
          cageId: Number(form.cageId),
          checkIn: form.date,
          checkOut: form.checkOutDate,
        } : {}),
      });
      setNewAptId(appointment.id);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đặt lịch hẹn.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={step === 3 ? onClose : undefined}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {error && (
          <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {step !== 3 && (
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Đặt lịch mới</h3>
              <p className="text-xs text-slate-400 mt-0.5">Bước {step}/2</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className={LABEL_CLS}>Dịch vụ</label>
                <div className="grid grid-cols-3 gap-2">
                  {services.map((s, i) => {
                    const Icon = getServiceIcon(s.iconKey);
                    const active = form.serviceIdx === i;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setForm({ ...form, serviceIdx: i })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all ${
                          active ? "border-cyan-400 bg-cyan-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.iconBg }}>
                          <Icon size={16} style={{ color: s.iconColor }} />
                        </div>
                        <span className={`text-[11px] font-bold leading-tight ${active ? "text-cyan-700" : "text-slate-600"}`}>{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>Thú cưng</label>
                <div className="relative">
                  <select value={form.pet} onChange={(e) => setForm({ ...form, pet: e.target.value })} className={INPUT_CLS + " appearance-none"}>
                    {pets.map((p) => <option key={p.id} value={p.name}>{p.name} ({p.species})</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>{isBoarding ? "Ngày nhận phòng" : "Ngày khám"}</label>
                  <input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setForm({ ...form, date: e.target.value, checkOutDate: "" })}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>{isBoarding ? "Giờ nhận phòng" : "Giờ khám"}</label>
                  <div className="relative">
                    <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={INPUT_CLS + " appearance-none"}>
                      <option value="">Chọn giờ</option>
                      {["08:00","08:30","09:00","09:30","10:00","10:30","11:00","13:30","14:00","14:30","15:00","15:30","16:00"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {isBoarding && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLS}>Ngày trả phòng</label>
                    <input
                      type="date"
                      value={form.checkOutDate}
                      min={form.date || new Date().toISOString().split("T")[0]}
                      disabled={!form.date}
                      onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Chọn phòng / chuồng</label>
                    <div className="relative">
                      <select
                        value={form.cageId}
                        onChange={(e) => setForm({ ...form, cageId: e.target.value })}
                        className={INPUT_CLS + " appearance-none"}
                        disabled={cagesLoading || availableCages.length === 0}
                      >
                        {cagesLoading ? (
                          <option value="">Đang tải...</option>
                        ) : availableCages.length === 0 ? (
                          <option value="">Không có phòng trống</option>
                        ) : (
                          availableCages.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                              {c.cage_number} ({c.status})
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {isBoarding && cagesError && (
                <p className="text-xs font-semibold text-red-600 mt-1">{cagesError}</p>
              )}

              <div>
                <label className={LABEL_CLS}>Hệ thống phân công</label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {!form.date || !form.time ? (
                    <p className="text-sm font-semibold text-slate-500">Chọn ngày và khung giờ để hệ thống tìm người phụ trách.</p>
                  ) : providerLoading ? (
                    <p className="text-sm font-semibold text-slate-500">Đang kiểm tra lịch trống...</p>
                  ) : providerError ? (
                    <p className="text-sm font-semibold text-red-600">{providerError}</p>
                  ) : providers.length > 0 ? (
                    <div className="space-y-3">
                      {providers.map((provider) => {
                        const providerKey = `${provider.role}:${provider.id}`;
                        const selected = selectedProviderKey === providerKey;
                        return (
                          <button
                            key={providerKey}
                            type="button"
                            onClick={() => setSelectedProviderKey(providerKey)}
                            className={`w-full rounded-2xl border p-3 text-left transition-all ${selected ? "border-cyan-400 bg-cyan-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-slate-900">{provider.name}</div>
                                <div className="mt-0.5 text-xs font-semibold text-slate-500">
                                  {provider.role === "doctor" ? "Bác sĩ" : "Nhân viên"}
                                  {provider.title ? ` · ${provider.title}` : ""}
                                </div>
                              </div>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${selected ? "bg-cyan-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                                {selected ? "Đã chọn" : "Chọn"}
                              </span>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                              {provider.experienceYears != null && <span>Kinh nghiệm: {provider.experienceYears} năm</span>}
                              {provider.room && <span>Phòng: {provider.room}</span>}
                              {provider.phone && <span>SĐT: {provider.phone}</span>}
                            </div>
                            {provider.description && (
                              <p className="mt-2 text-xs text-slate-500 leading-relaxed">{provider.description}</p>
                            )}
                          </button>
                        );
                      })}
                      <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                        Lịch sẽ ở trạng thái chờ xác nhận sau khi gửi yêu cầu.
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>Ghi chú (tuỳ chọn)</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={2}
                  placeholder="Triệu chứng, yêu cầu đặc biệt..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (() => {
            const selectedCageObj = availableCages.find(c => String(c.id) === form.cageId);
            const reviewRows = [
              { label: "Dịch vụ",   value: svc?.name ?? "" },
              { label: "Thú cưng",  value: form.pet },
              { label: selectedProvider?.role === "staff" ? "Nhân viên" : "Bác sĩ", value: selectedProvider?.name ?? "Chưa chọn" },
              ...(isBoarding ? [
                { label: "Ngày nhận phòng", value: form.date },
                { label: "Giờ nhận phòng",  value: form.time },
                { label: "Ngày trả phòng", value: form.checkOutDate },
                { label: "Phòng / chuồng", value: selectedCageObj ? `${selectedCageObj.cage_number} (${selectedCageObj.status})` : "Chưa chọn" }
              ] : [
                { label: "Ngày khám", value: form.date },
                { label: "Giờ khám",  value: form.time },
              ]),
              { label: "Trạng thái", value: "Chờ xác nhận" },
            ];
            return (
              <div className="space-y-1">
                <p className="text-sm text-slate-500 mb-4">Vui lòng kiểm tra thông tin trước khi xác nhận.</p>
                {reviewRows.map((r) => (
                  <div key={r.label} className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500 font-medium">{r.label}</span>
                    <span className="text-sm font-bold text-slate-900">{r.value}</span>
                  </div>
                ))}
                {form.note && (
                  <div className="flex justify-between items-start pt-3">
                    <span className="text-sm text-slate-500 font-medium">Ghi chú</span>
                    <span className="text-sm font-semibold text-slate-700 max-w-[200px] text-right">{form.note}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5 border-4 border-emerald-100">
                <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Đã gửi yêu cầu đặt lịch</h3>
              <p className="text-sm text-slate-500 mb-1">Lịch hẹn của bạn đang chờ trung tâm xác nhận.</p>
              <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl mt-4 mb-8">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã lịch hẹn</span>
                <span className="text-base font-bold text-cyan-600">{newAptId}</span>
              </div>
              <div className="space-y-3 w-full">
                <button
                  onClick={onClose}
                  className="w-full h-12 rounded-xl text-sm font-bold text-white shadow-sm transition-all"
                  style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
                >
                  Xem lịch hẹn của tôi
                </button>
                <button
                  onClick={() => { setStep(1); setProviders([]); setSelectedProviderKey(""); setForm({ ...form, serviceIdx: 0, date: "", time: "", note: "" }); }}
                  className="w-full h-11 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Đặt thêm lịch khác
                </button>
              </div>
            </div>
          )}
        </div>

        {step !== 3 && (
          <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex gap-3">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="h-12 px-5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                Quay lại
              </button>
            )}
            <button
              onClick={step === 1 ? () => setStep(2) : handleConfirm}
              disabled={step === 1 ? !canStep2 : !canNext || saving}
              className="flex-1 h-12 rounded-xl text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
            >
              {saving ? "Đang đặt lịch..." : step === 1 ? "Tiếp theo →" : "Xác nhận đặt lịch"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Review Modal
// ─────────────────────────────────────────────────────────────────────────────

export function ReviewModal({
  aptId,
  onClose,
  onSuccess,
}: {
  aptId: number;
  onClose: () => void;
  onSuccess: (review: any) => void;
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError("");
      const review = await submitCustomerReview({
        appointmentId: aptId,
        rating,
        feedback: feedback.trim() || undefined,
      });
      onSuccess(review);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi đánh giá.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={submitting ? undefined : onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Đánh giá dịch vụ</h3>
          <button onClick={onClose} disabled={submitting} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <div className="text-sm font-semibold text-slate-600">Đánh giá của bạn</div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = hoverRating !== null ? star <= hoverRating : star <= rating;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  disabled={submitting}
                  className="p-1 transition-transform active:scale-90"
                >
                  <Star
                    size={32}
                    className={`transition-colors ${active ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                  />
                </button>
              );
            })}
          </div>
          <div className="text-xs font-bold text-cyan-600 uppercase tracking-wider mt-1">
            {rating === 5 && "Tuyệt vời"}
            {rating === 4 && "Rất tốt"}
            {rating === 3 && "Bình thường"}
            {rating === 2 && "Tệ"}
            {rating === 1 && "Rất tệ"}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Ý kiến phản hồi (tuỳ chọn)</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            disabled={submitting}
            placeholder="Chia sẻ trải nghiệm của bạn với chúng tôi..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 h-11 rounded-xl text-sm font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
          >
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Appointment Detail Modal
// ─────────────────────────────────────────────────────────────────────────────

export function AppointmentDetailModal({ apt, onClose, onReschedule, onCancel, onConfirm }: { apt: Apt; onClose: () => void; onReschedule: (apt: Apt) => void; onCancel: (id: string) => void; onConfirm: (id: string) => void }) {
  const Icon = apt.icon;
  const statusCfg = getStatusConfig(apt.status);
  const serviceTypeCfg = getServiceTypeConfig(apt.serviceType);
  const [confirming, setConfirming] = useState(false);
  const appointmentDate = apt.date || "Chưa lưu";
  const appointmentTime = apt.time || "Chưa lưu";
  const hasConfirmed = ["CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED"].includes(apt.status);
  const hasCheckedIn = ["CHECKED_IN", "IN_PROGRESS", "COMPLETED"].includes(apt.status);
  const hasInProgress = ["IN_PROGRESS", "COMPLETED"].includes(apt.status);
  const noteLines = getFriendlyAppointmentNoteLines(apt.note);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    if (apt.status === "COMPLETED") {
      setReviewLoading(true);
      fetchCustomerReview(Number(apt.id))
        .then((res) => {
          setExistingReview(res);
        })
        .catch(() => {})
        .finally(() => setReviewLoading(false));
    }
  }, [apt.id, apt.status]);

  const timeline: { label: string; time: string; completed: boolean }[] = [
    { label: "Đặt lịch", time: apt.createdAtLabel || "-", completed: true },
    { label: "Xác nhận", time: hasConfirmed ? (apt.updatedAtLabel || "-") : "-", completed: hasConfirmed },
    { label: "Check-in", time: hasCheckedIn ? `${appointmentDate} ${apt.time || ""}`.trim() : "-", completed: hasCheckedIn },
    { label: "Đang thực hiện", time: hasInProgress ? (apt.updatedAtLabel || "-") : "-", completed: hasInProgress },
    { label: "Hoàn thành", time: apt.status === "COMPLETED" ? "-" : "-", completed: apt.status === "COMPLETED" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: apt.iconBg }}>
              <Icon size={24} style={{ color: apt.iconColor }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{apt.service}</h3>
              <p className="text-sm text-slate-500 mt-0.5">Mã: {apt.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 text-xs font-bold rounded-lg ring-1 ring-inset" style={{ background: statusCfg.bg, color: statusCfg.color, ringColor: statusCfg.ring }}>
              {statusCfg.label}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Thông tin chính</h4>
                <div className="space-y-3">
                  {[
                    { label: "Thú cưng", value: apt.pet },
                    { label: "Loại dịch vụ", value: apt.serviceType, badge: true },
                    { label: "Ngày hẹn", value: appointmentDate },
                    { label: "Giờ hẹn", value: appointmentTime },
                    { label: "Người phụ trách", value: apt.doctor },
                    ...(apt.room ? [{ label: "Phòng/Chuồng", value: apt.room }] : []),
                    ...(apt.queue ? [{ label: "Số thứ tự", value: apt.queue }] : []),
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm font-medium text-slate-500">{item.label}</span>
                      {item.badge ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: serviceTypeCfg.bg, color: serviceTypeCfg.color }}>
                          {item.value}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-slate-900">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Chi phí dự kiến</h4>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Phí dịch vụ</span>
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(apt.serviceFee)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-sm font-bold text-slate-700">Tổng tạm tính</span>
                    <span className="text-base font-bold text-cyan-600">{formatCurrency(apt.totalCost)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Timeline trạng thái</h4>
                <div className="space-y-3">
                  {timeline.map((step, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.completed ? "bg-cyan-500" : "bg-slate-200"}`}>
                          {step.completed ? <Check size={16} className="text-white" strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                        </div>
                        {idx < timeline.length - 1 && <div className={`w-0.5 h-8 ${step.completed ? "bg-cyan-200" : "bg-slate-200"}`} />}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className={`text-sm font-bold ${step.completed ? "text-slate-900" : "text-slate-400"}`}>{step.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{step.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ghi chú</h4>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  {noteLines.length > 0 ? (
                    <div className="space-y-1.5">
                      {noteLines.map((line) => (
                        <p key={line} className="text-sm text-slate-700 leading-relaxed">{line}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed">Không có ghi chú.</p>
                  )}
                </div>
              </div>

              {apt.prescriptions && apt.prescriptions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Đơn thuốc</h4>
                  <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    {apt.prescriptions.map((item, index) => (
                      <div key={`${item.medicineName}-${index}`} className="rounded-xl bg-white p-3 ring-1 ring-emerald-100">
                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                          <Pill size={15} />
                          {item.medicineName}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          {[item.dosage, item.frequency, item.durationDays ? `${item.durationDays} ngày` : "", item.instructions]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {apt.status === "COMPLETED" && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Đánh giá dịch vụ</h4>
                  {reviewLoading ? (
                    <p className="text-sm text-slate-500 font-medium">Đang tải đánh giá...</p>
                  ) : existingReview ? (
                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={15}
                              className={s <= existingReview.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(existingReview.createdAt || existingReview.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      {existingReview.feedback && (
                        <p className="text-sm text-slate-700 font-semibold leading-relaxed">
                          {existingReview.feedback}
                        </p>
                      )}
                      {existingReview.replyContent && (
                        <div className="mt-3 rounded-xl bg-white p-3 border border-slate-100 space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phản hồi của trung tâm:</div>
                          <p className="text-xs text-slate-600 leading-relaxed font-semibold">{existingReview.replyContent}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center">
                      <p className="text-xs text-slate-500 font-medium mb-3">Lịch hẹn này chưa được đánh giá.</p>
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                        style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
                      >
                        <Star size={14} className="fill-white" />
                        Viết đánh giá
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {(apt.status === "PENDING" || apt.status === "CONFIRMED" || (apt.status === "COMPLETED" && !existingReview && !reviewLoading)) && (
          <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex gap-3">
            {apt.status === "PENDING" && (
              <button
                onClick={async () => {
                  if (confirming) return;
                  setConfirming(true);
                  try { await onConfirm(apt.id); } catch { setConfirming(false); }
                }}
                disabled={confirming}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {confirming && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {confirming ? "Đang xử lý..." : "Xác nhận lịch"}
              </button>
            )}
            {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
              <>
                <button
                  onClick={() => onReschedule(apt)}
                  className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  Đổi lịch
                </button>
                <button
                  onClick={() => onCancel(apt.id)}
                  className="flex-1 h-11 border border-red-100 text-red-600 bg-red-50 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                >
                  Hủy lịch
                </button>
              </>
            )}
            {apt.status === "COMPLETED" && !existingReview && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
              >
                <Star size={16} className="fill-white" />
                Đánh giá dịch vụ
              </button>
            )}
          </div>
        )}
      </div>

      {showReviewModal && (
        <ReviewModal
          aptId={Number(apt.id)}
          onClose={() => setShowReviewModal(false)}
          onSuccess={(newReview) => {
            setExistingReview(newReview);
            setShowReviewModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reschedule Modal
// ─────────────────────────────────────────────────────────────────────────────

export function RescheduleModal({ apt, onClose, onSave }: { apt: any; onClose: () => void; onSave: (id: string, date: string, time: string, reason: string) => Promise<void> }) {
  const [date, setDate] = useState(apt.date);
  const [time, setTime] = useState(apt.time);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!date || !time || !reason.trim() || saving) return;
    try {
      setSaving(true);
      setError("");
      await onSave(apt.id, date, time, reason.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đổi lịch. Vui lòng thử lại.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={saving ? undefined : onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Đổi lịch hẹn</h3>
            <p className="text-xs text-slate-400 mt-0.5">{apt.service} · {apt.pet}</p>
          </div>
          <button onClick={onClose} disabled={saving} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-slate-400 font-medium text-xs uppercase tracking-wide mb-1">Lịch hiện tại</p>
            <p className="font-bold text-slate-700 text-sm">{apt.date} · {apt.time}</p>
          </div>

          <div>
            <label className={LABEL_CLS}>Ngày mới</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
              disabled={saving}
              className={INPUT_CLS + " disabled:opacity-50"}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Giờ mới</label>
            <div className="relative">
              <select value={time} onChange={(e) => setTime(e.target.value)} disabled={saving} className={INPUT_CLS + " appearance-none disabled:opacity-50"}>
                {["08:00","08:30","09:00","09:30","10:00","10:30","11:00","13:30","14:00","14:30","15:00","15:30","16:00"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Lý do đổi lịch</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={saving}
              placeholder="Nhập lý do đổi lịch..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none disabled:opacity-50"
            />
          </div>
        </div>

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
          <button
            onClick={() => void handleSave()}
            disabled={!date || !time || !reason.trim() || saving}
            className="w-full h-12 rounded-xl text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
          >
            {saving && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {saving ? "Đang xử lý..." : "Xác nhận đổi lịch"}
          </button>
        </div>
      </div>
    </div>
  );
}
