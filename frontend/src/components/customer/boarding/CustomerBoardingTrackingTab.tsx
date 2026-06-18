import { useEffect, useState } from "react";
import {
  BedDouble, Calendar, CheckCircle2, ChevronDown, ChevronUp,
  Clock, Edit3, ImageOff, Loader2, PawPrint, Plus, X,
} from "lucide-react";
import {
  fetchMyBoardings, updateBoardingCare, extendBoardingStay,
  type CustomerBoarding, type BoardingDailyUpdateItem,
} from "../../../services/customer/customerBoardingApi";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function todayYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr + "T00:00:00").getTime() - new Date(todayYmd() + "T00:00:00").getTime();
  return Math.ceil(diff / 86400000);
}

function parseEating(s: string): string[] {
  const map: Record<string, string> = { BREAKFAST: "Sáng", LUNCH: "Trưa", DINNER: "Tối" };
  return s.split(",").map((t) => map[t.trim()]).filter(Boolean);
}

function statusLabel(s: string): string {
  return ({ BOOKED: "Đã đặt", CHECKED_IN: "Đã check-in", STAYING: "Đang lưu trú", CHECKED_OUT: "Đã checkout" } as Record<string, string>)[s] ?? s;
}

const SIZE_LABELS: Record<string, string> = { SMALL: "Nhỏ", MEDIUM: "Vừa", LARGE: "Lớn", VIP: "VIP" };

// ─── sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    BOOKED:      "bg-amber-50 text-amber-700 border-amber-200",
    CHECKED_IN:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    STAYING:     "bg-violet-50 text-violet-700 border-violet-200",
    CHECKED_OUT: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg[status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "STAYING" || status === "CHECKED_IN" ? "bg-current" : "bg-current opacity-60"}`} />
      {statusLabel(status)}
    </span>
  );
}

function DailyUpdateCard({ update, isToday }: { update: BoardingDailyUpdateItem; isToday: boolean }) {
  const eating = update.eatingStatus ? parseEating(update.eatingStatus) : [];
  const healthOk = update.healthStatus === "CHECKED";
  const exercised = update.activityStatus === "EXERCISED";
  const careNote = update.note?.split("\n").slice(1).join("\n").trim() || "";
  const hasContent = eating.length > 0 || healthOk || exercised || careNote || update.imageUrl;

  return (
    <div className={`rounded-xl border p-4 ${isToday ? "border-cyan-200 bg-cyan-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${isToday ? "text-cyan-700" : "text-slate-700"}`}>
            {isToday ? "Hôm nay" : fmtDate(update.date)}
          </span>
          {isToday && <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-600">MỚI NHẤT</span>}
        </div>
        {update.staffName && (
          <span className="text-[11px] text-slate-400">bởi {update.staffName}</span>
        )}
      </div>

      {!hasContent && (
        <p className="text-xs text-slate-400 italic">Chưa có cập nhật cho ngày này.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {eating.length > 0 && eating.map((meal) => (
          <span key={meal} className="inline-flex items-center gap-1 rounded-lg bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-medium text-green-700">
            <CheckCircle2 size={11} /> Ăn {meal}
          </span>
        ))}
        {healthOk && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700">
            <CheckCircle2 size={11} /> Kiểm tra sức khỏe
          </span>
        )}
        {exercised && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 border border-orange-200 px-2.5 py-1 text-xs font-medium text-orange-700">
            <CheckCircle2 size={11} /> Vận động
          </span>
        )}
      </div>

      {careNote && (
        <p className="mt-2.5 text-sm text-slate-600 bg-white rounded-lg border border-slate-100 px-3 py-2">{careNote}</p>
      )}

      {update.imageUrl && (
        <div className="mt-3">
          <img
            src={update.imageUrl}
            alt={`Ảnh ngày ${fmtDate(update.date)}`}
            className="rounded-xl border border-slate-200 max-h-48 w-auto object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Care Edit Modal ──────────────────────────────────────────────────────────

function CareEditModal({
  boarding,
  onClose,
  onSaved,
}: {
  boarding: CustomerBoarding;
  onClose: () => void;
  onSaved: (updated: Pick<CustomerBoarding, "feedingInstruction" | "habitNote" | "specialNote">) => void;
}) {
  const [feeding, setFeeding] = useState(boarding.feedingInstruction);
  const [habit, setHabit] = useState(boarding.habitNote);
  const [special, setSpecial] = useState(boarding.specialNote);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateBoardingCare(boarding.id, {
        feedingInstruction: feeding,
        habitNote: habit,
        specialNote: special,
      });
      onSaved({ feedingInstruction: feeding, habitNote: habit, specialNote: special });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Cập nhật hướng dẫn chăm sóc</h3>
            <p className="text-xs text-slate-500 mt-0.5">{boarding.petName} · Phòng {boarding.roomNumber}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Khẩu phần ăn & thời gian ăn</label>
            <textarea
              value={feeding}
              onChange={(e) => setFeeding(e.target.value)}
              rows={3}
              placeholder="VD: Cho ăn 2 lần/ngày (7h sáng và 17h chiều), mỗi lần 100g thức ăn khô..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-cyan-400 focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Thuốc & lưu ý đặc biệt</label>
            <textarea
              value={special}
              onChange={(e) => setSpecial(e.target.value)}
              rows={3}
              placeholder="VD: Đang uống kháng sinh Amoxicillin 250mg, 1 viên/ngày sau bữa sáng. Dị ứng với..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-cyan-400 focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Thói quen & hành vi</label>
            <textarea
              value={habit}
              onChange={(e) => setHabit(e.target.value)}
              rows={2}
              placeholder="VD: Thích được vuốt ve, sợ tiếng ồn lớn, hay trốn dưới chăn khi lo lắng..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-cyan-400 focus:outline-none resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Hủy
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 h-10 rounded-xl bg-cyan-600 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Đang lưu…</> : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Extend Modal ─────────────────────────────────────────────────────────────

function ExtendModal({
  boarding,
  onClose,
  onExtended,
}: {
  boarding: CustomerBoarding;
  onClose: () => void;
  onExtended: (newCheckOut: string) => void;
}) {
  const minDate = boarding.checkOut
    ? new Date(new Date(boarding.checkOut + "T00:00:00").getTime() + 86400000).toLocaleDateString("en-CA")
    : todayYmd();

  const [newDate, setNewDate] = useState(minDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extraNights = boarding.checkOut && newDate > boarding.checkOut
    ? Math.ceil((new Date(newDate + "T00:00:00").getTime() - new Date(boarding.checkOut + "T00:00:00").getTime()) / 86400000)
    : 0;

  async function handleExtend() {
    if (!newDate || newDate <= (boarding.checkOut ?? "")) {
      setError("Vui lòng chọn ngày sau ngày check-out hiện tại");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await extendBoardingStay(boarding.id, newDate);
      onExtended(newDate);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gia hạn thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Gia hạn lưu trú</h3>
            <p className="text-xs text-slate-500 mt-0.5">{boarding.petName} · Phòng {boarding.roomNumber}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
            <div className="flex justify-between text-slate-500 mb-1">
              <span>Check-out hiện tại</span>
              <span className="font-semibold text-slate-700">{fmtDate(boarding.checkOut)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Đơn giá phòng</span>
              <span className="font-semibold text-slate-700">{boarding.pricePerDay.toLocaleString("vi-VN")} ₫/đêm</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ngày check-out mới</label>
            <input
              type="date"
              value={newDate}
              min={minDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {extraNights > 0 && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Thêm {extraNights} đêm</span>
                <span className="font-bold text-emerald-800">
                  +{(extraNights * boarding.pricePerDay).toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <p className="text-[11px] text-emerald-600 mt-1">Phí sẽ được tính khi checkout</p>
            </div>
          )}

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Hủy
          </button>
          <button
            onClick={() => void handleExtend()}
            disabled={saving || extraNights <= 0}
            className="flex-1 h-10 rounded-xl bg-violet-600 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Đang xử lý…</> : "Xác nhận gia hạn"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Single boarding card ─────────────────────────────────────────────────────

function BoardingCard({
  boarding: initialBoarding,
  onBookBoarding,
}: {
  boarding: CustomerBoarding;
  onBookBoarding?: () => void;
}) {
  const [boarding, setBoarding] = useState(initialBoarding);
  const [expanded, setExpanded] = useState(true);
  const [editingCare, setEditingCare] = useState(false);
  const [extending, setExtending] = useState(false);

  const today = todayYmd();
  const isActive = ["CHECKED_IN", "STAYING"].includes(boarding.status);
  const daysLeft = daysUntil(boarding.checkOut);
  const todayUpdate = boarding.dailyUpdates.find((u) => u.date === today);
  const pastUpdates = boarding.dailyUpdates.filter((u) => u.date !== today);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <PawPrint size={20} className="text-violet-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-slate-900">{boarding.petName}</span>
              <StatusBadge status={boarding.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{boarding.species}{boarding.breed ? ` · ${boarding.breed}` : ""}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <BedDouble size={12} />
            <span className="font-semibold text-slate-700">Phòng {boarding.roomNumber}</span>
            <span className="text-slate-300">·</span>
            <span>{SIZE_LABELS[boarding.roomSize] ?? boarding.roomSize}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <Calendar size={11} />
            <span>{fmtDate(boarding.checkIn)} — {fmtDate(boarding.checkOut)}</span>
          </div>
          {isActive && daysLeft !== null && (
            <div className={`mt-1 text-[11px] font-semibold ${daysLeft <= 1 ? "text-red-500" : daysLeft <= 3 ? "text-amber-600" : "text-slate-400"}`}>
              {daysLeft === 0 ? "Check-out hôm nay" : daysLeft < 0 ? `Quá hạn ${Math.abs(daysLeft)} ngày` : `Còn ${daysLeft} ngày`}
            </div>
          )}
        </div>
      </div>

      {/* Today's summary */}
      {isActive && (
        <div className="mx-5 mb-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Hôm nay</p>
          {todayUpdate ? (
            <div className="flex flex-wrap gap-2">
              {parseEating(todayUpdate.eatingStatus).map((m) => (
                <span key={m} className="inline-flex items-center gap-1 rounded-lg bg-green-50 border border-green-200 px-2 py-0.5 text-[11px] font-medium text-green-700">
                  <CheckCircle2 size={10} /> Ăn {m}
                </span>
              ))}
              {todayUpdate.healthStatus === "CHECKED" && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                  <CheckCircle2 size={10} /> Khám SK
                </span>
              )}
              {todayUpdate.activityStatus === "EXERCISED" && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 border border-orange-200 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                  <CheckCircle2 size={10} /> Vận động
                </span>
              )}
              {parseEating(todayUpdate.eatingStatus).length === 0 && todayUpdate.healthStatus !== "CHECKED" && todayUpdate.activityStatus !== "EXERCISED" && (
                <span className="text-xs text-slate-400 italic">Chưa có cập nhật hôm nay</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock size={12} />
              <span>Chưa có cập nhật từ nhân viên hôm nay</span>
            </div>
          )}
        </div>
      )}

      {/* Care notes */}
      <div className="mx-5 mb-4 rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm">
        {[
          { label: "Khẩu phần ăn", value: boarding.feedingInstruction },
          { label: "Thuốc & lưu ý đặc biệt", value: boarding.specialNote },
          { label: "Thói quen", value: boarding.habitNote },
        ].map(({ label, value }) => (
          <div key={label} className="flex px-3 py-2.5 gap-3">
            <span className="text-xs text-slate-400 font-medium w-36 shrink-0 pt-0.5">{label}</span>
            <span className={`text-xs ${value ? "text-slate-700" : "text-slate-400 italic"}`}>
              {value || "Chưa có thông tin"}
            </span>
          </div>
        ))}
      </div>

      {/* Action buttons (active boardings only) */}
      {isActive && (
        <div className="mx-5 mb-4 flex gap-2">
          <button
            onClick={() => setEditingCare(true)}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <Edit3 size={13} /> Cập nhật chăm sóc
          </button>
          <button
            onClick={() => setExtending(true)}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-violet-200 bg-violet-50 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
          >
            <Plus size={13} /> Gia hạn thêm
          </button>
        </div>
      )}

      {/* Daily updates timeline */}
      <div className="border-t border-slate-100">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <span>Nhật ký chăm sóc ({boarding.dailyUpdates.length} ngày)</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="px-5 pb-5 space-y-3">
            {boarding.dailyUpdates.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                <ImageOff size={24} className="opacity-50" />
                <p className="text-sm">Chưa có cập nhật nào từ nhân viên</p>
              </div>
            )}
            {todayUpdate && <DailyUpdateCard update={todayUpdate} isToday />}
            {pastUpdates.map((u) => (
              <DailyUpdateCard key={u.id} update={u} isToday={false} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {editingCare && (
        <CareEditModal
          boarding={boarding}
          onClose={() => setEditingCare(false)}
          onSaved={(updated) => {
            setBoarding((prev) => ({ ...prev, ...updated }));
            setEditingCare(false);
          }}
        />
      )}
      {extending && (
        <ExtendModal
          boarding={boarding}
          onClose={() => setExtending(false)}
          onExtended={(newCheckOut) => {
            setBoarding((prev) => ({ ...prev, checkOut: newCheckOut }));
            setExtending(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function CustomerBoardingTrackingTab({ onBookBoarding }: { onBookBoarding?: () => void }) {
  const [boardings, setBoardings] = useState<CustomerBoarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchMyBoardings()
      .then((data) => { setBoardings(data); setError(null); })
      .catch((e) => setError(e instanceof Error ? e.message : "Không tải được dữ liệu"))
      .finally(() => setLoading(false));
  }, []);

  const active = boardings.filter((b) => ["CHECKED_IN", "STAYING"].includes(b.status));
  const upcoming = boardings.filter((b) => b.status === "BOOKED");
  const history = boardings.filter((b) => b.status === "CHECKED_OUT");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 size={28} className="animate-spin text-cyan-500" />
        <span className="text-sm">Đang tải thông tin lưu trú…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
        <p className="text-sm font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="text-xs text-cyan-600 underline">Thử lại</button>
      </div>
    );
  }

  if (boardings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
          <BedDouble size={28} className="text-slate-300" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-600">Chưa có lịch lưu trú nào</p>
          <p className="text-xs text-slate-400 mt-1">Đặt phòng để nhân viên chăm sóc thú cưng khi bạn vắng nhà</p>
        </div>
        {onBookBoarding && (
          <button
            onClick={onBookBoarding}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-cyan-600 text-sm font-bold text-white hover:bg-cyan-700 transition-colors"
          >
            <Plus size={15} /> Đặt phòng ngay
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Đang lưu trú ({active.length})
          </h2>
          <div className="space-y-4">
            {active.map((b) => <BoardingCard key={b.id} boarding={b} onBookBoarding={onBookBoarding} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Sắp đến ({upcoming.length})
          </h2>
          <div className="space-y-4">
            {upcoming.map((b) => <BoardingCard key={b.id} boarding={b} onBookBoarding={onBookBoarding} />)}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            Lịch sử lưu trú
          </h2>
          <div className="space-y-4">
            {history.map((b) => <BoardingCard key={b.id} boarding={b} />)}
          </div>
        </section>
      )}
    </div>
  );
}
