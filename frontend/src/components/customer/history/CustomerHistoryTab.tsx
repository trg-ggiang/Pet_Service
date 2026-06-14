import { useState, type ElementType } from "react";
import {
  AlertTriangle, BedDouble, Calendar, ChevronDown,
  Pill, Receipt, Scissors, Star, Stethoscope,
} from "lucide-react";
import type { CustomerServiceHistoryListPayload, CustomerServiceHistoryTypeFilter } from "../../../types/customer/serviceHistory";
import type { HistoryRecord } from "../../../types/customer/portal";

type CustomerHistoryTabProps = {
  historyRecords: HistoryRecord[];
  historySummary: CustomerServiceHistoryListPayload["summary"];
  historyTypeFilter: CustomerServiceHistoryTypeFilter;
  historyLoading: boolean;
  historyError: string;
  onChangeTypeFilter: (type: CustomerServiceHistoryTypeFilter) => void;
  onViewHistory: (record: HistoryRecord) => void;
  onRate?: (record: HistoryRecord, score: number, comment: string) => Promise<void>;
};

/* ── Type config ───────────────────────────────────────────────────── */

const TYPE_META: Record<
  HistoryRecord["type"],
  { label: string; icon: ElementType; accentBg: string; accentText: string; accentBorder: string; dot: string }
> = {
  medical:  { label: "Khám bệnh", icon: Stethoscope, accentBg: "bg-cyan-50",    accentText: "text-cyan-700",    accentBorder: "border-cyan-100",    dot: "bg-cyan-400"    },
  grooming: { label: "Grooming",  icon: Scissors,    accentBg: "bg-amber-50",   accentText: "text-amber-700",   accentBorder: "border-amber-100",   dot: "bg-amber-400"   },
  boarding: { label: "Lưu trú",   icon: BedDouble,   accentBg: "bg-violet-50",  accentText: "text-violet-700",  accentBorder: "border-violet-100",  dot: "bg-violet-400"  },
};

const STATUS_META: Record<string, { label: string; bg: string; text: string; border: string }> = {
  completed: { label: "Hoàn thành", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  pending:   { label: "Chờ thanh toán", bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
  cancelled: { label: "Đã hủy",     bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200"     },
};

const HISTORY_FILTERS: Array<{ id: CustomerServiceHistoryTypeFilter; label: string; icon: ElementType }> = [
  { id: "all",      label: "Tất cả",    icon: Receipt     },
  { id: "medical",  label: "Khám bệnh", icon: Stethoscope },
  { id: "grooming", label: "Grooming",  icon: Scissors    },
  { id: "boarding", label: "Lưu trú",   icon: BedDouble   },
];

/* ── Rating modal ──────────────────────────────────────────────────── */

function RatingModal({
  record,
  onClose,
  onSubmit,
}: {
  record: HistoryRecord;
  onClose: () => void;
  onSubmit: (score: number, comment: string) => Promise<void>;
}) {
  const [score,      setScore]      = useState(0);
  const [hovered,    setHovered]    = useState(0);
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const display = hovered || score;
  const LABELS  = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"];

  const handleSubmit = async () => {
    if (score === 0) { setError("Vui lòng chọn số sao"); return; }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(score, comment);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-base font-bold text-slate-900">Đánh giá dịch vụ</h3>
          <p className="mt-0.5 text-sm text-slate-500">{record.service} · {record.pet} · {record.date}</p>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setScore(i)}
                className=""
              >
                <Star size={36} className={i <= display ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"} />
              </button>
            ))}
          </div>
          {score > 0 && (
            <p className="text-center text-sm font-bold text-amber-600">{LABELS[score]}</p>
          )}
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="Nhận xét thêm (không bắt buộc)..."
            className="w-full resize-none rounded-lg border border-slate-200 px-3.5 py-2.5 text-[13px] focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
          />
          {error && <p className="text-[12.5px] font-semibold text-red-600">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="h-10 flex-1 rounded-lg border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={submitting || score === 0}
            className="h-10 flex-1 rounded-lg bg-cyan-500 text-[13px] font-bold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────── */

export function CustomerHistoryTab({
  historyRecords,
  historySummary,
  historyTypeFilter,
  historyLoading,
  historyError,
  onChangeTypeFilter,
  onViewHistory,
  onRate,
}: CustomerHistoryTabProps) {
  const [ratingRecord, setRatingRecord] = useState<HistoryRecord | null>(null);
  const [petFilter,    setPetFilter]    = useState("all");

  /* Derive pet list from loaded records */
  const petOptions = Array.from(new Set(historyRecords.map(r => r.pet))).sort();

  /* Client-side pet filter */
  const displayed = petFilter === "all"
    ? historyRecords
    : historyRecords.filter(r => r.pet === petFilter);

  const medicalCount  = historySummary.typeCounts.find(t => t.type === "medical")?.count  ?? 0;
  const groomingCount = historySummary.typeCounts.find(t => t.type === "grooming")?.count ?? 0;
  const boardingCount = historySummary.typeCounts.find(t => t.type === "boarding")?.count ?? 0;

  return (
    <div className="w-full space-y-4">

      {/* ── Title ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Lịch sử dịch vụ</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {historySummary.total} dịch vụ đã sử dụng
        </p>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {(["medical", "grooming", "boarding"] as const).map(type => {
          const meta    = TYPE_META[type];
          const Icon    = meta.icon;
          const count   = type === "medical" ? medicalCount : type === "grooming" ? groomingCount : boardingCount;
          const active  = historyTypeFilter === type;
          return (
            <button
              key={type}
              onClick={() => onChangeTypeFilter(active ? "all" : type)}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                active
                  ? `${meta.accentBg} ${meta.accentBorder}`
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${meta.accentBg}`}>
                <Icon size={18} className={meta.accentText} />
              </div>
              <div>
                <div className={`text-xl font-black leading-tight ${meta.accentText}`}>{count}</div>
                <div className="text-[11px] font-semibold text-slate-500">{meta.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Filters row ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Type tabs */}
        <div className="flex flex-1 gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5">
          {HISTORY_FILTERS.map(f => {
            const active = historyTypeFilter === f.id;
            const Icon   = f.icon;
            const count  = f.id === "all"
              ? historySummary.total
              : (historySummary.typeCounts.find(t => t.type === f.id)?.count ?? 0);
            return (
              <button
                key={f.id}
                onClick={() => onChangeTypeFilter(f.id)}
                className={`flex min-w-fit flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-bold transition-colors ${
                  active ? "bg-cyan-500 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon size={13} strokeWidth={active ? 2.5 : 2} />
                {f.label}
                <span className={`text-[11px] ${active ? "opacity-70" : "text-slate-400"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Pet filter */}
        <div className="relative w-full sm:w-48 flex-shrink-0">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-rose-400">
            <svg viewBox="0 0 80 80" className="h-3.5 w-3.5" fill="currentColor">
              <ellipse cx="40" cy="54" rx="18" ry="15" /><ellipse cx="18" cy="35" rx="8.5" ry="10" />
              <ellipse cx="32" cy="27" rx="8" ry="9.5" /><ellipse cx="48" cy="27" rx="8" ry="9.5" />
              <ellipse cx="62" cy="35" rx="8.5" ry="10" />
            </svg>
          </div>
          <select
            value={petFilter}
            onChange={e => setPetFilter(e.target.value)}
            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-semibold focus:border-cyan-400 focus:outline-none"
          >
            <option value="all">Tất cả thú cưng</option>
            {petOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Count badge */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500 whitespace-nowrap h-10 flex-shrink-0">
          {displayed.length} kết quả
        </div>
      </div>

      {/* ── History list ──────────────────────────────────────────── */}
      {historyLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="w-[88px] flex-shrink-0 animate-pulse bg-slate-100" />
              <div className="flex-1 space-y-3 p-5">
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                <div className="h-2 w-full animate-pulse rounded-full bg-slate-100" />
                <div className="h-2 w-3/4 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : historyError ? (
        <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-5">
          <AlertTriangle size={20} className="flex-shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-bold text-red-700">Không thể tải lịch sử</p>
            <p className="text-xs text-red-500 mt-0.5">{historyError}</p>
          </div>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Receipt size={24} className="text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">Không có lịch sử</p>
            <p className="mt-1 text-xs text-slate-400">
              {petFilter !== "all" ? `${petFilter} chưa có lịch sử dịch vụ` : "Lịch sử sẽ xuất hiện sau khi sử dụng dịch vụ"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(record => {
            const meta      = TYPE_META[record.type];
            const statusM   = STATUS_META[record.status] ?? STATUS_META.completed;
            const TypeIcon  = meta.icon;
            const canRate   = onRate && record.status === "completed" && record.appointmentId && !record.isRated;
            const hasItems  = record.items && record.items.length > 0;
            const hasRx     = record.prescriptions && record.prescriptions.length > 0;

            return (
              <div
                key={record.id}
                onClick={() => onViewHistory(record)}
                className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300 cursor-pointer"
              >
                {/* ── Date / type accent column ──────────────────── */}
                <div className={`flex w-[88px] flex-shrink-0 flex-col items-center justify-center gap-1 border-r py-4 ${meta.accentBg} ${meta.accentBorder}`}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.accentBg} border ${meta.accentBorder}`}>
                    <TypeIcon size={16} className={meta.accentText} />
                  </div>
                  <div className={`text-[10px] font-bold text-center leading-tight px-1 ${meta.accentText}`}>
                    {meta.label}
                  </div>
                  <div className={`mt-1 h-1 w-1 rounded-full ${meta.dot}`} />
                  <div className={`mt-1 text-[10px] font-semibold ${meta.accentText} opacity-70`}>
                    {record.date}
                  </div>
                </div>

                {/* ── Main content ───────────────────────────────── */}
                <div className="min-w-0 flex-1 px-5 py-4">

                  {/* Row 1: service name + badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-bold text-slate-900">{record.service}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                        <span className="font-semibold text-slate-800">{record.pet}</span>
                        {record.staff && (
                          <><span className="text-slate-300">·</span><span className="truncate">{record.staff}</span></>
                        )}
                        <span className="text-slate-300">·</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} className="text-slate-400" />
                          {record.date}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-start gap-2">
                      <span
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${statusM.bg} ${statusM.text} ${statusM.border}`}
                      >
                        {statusM.label}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: medical diagnosis preview */}
                  {record.type === "medical" && record.medicalRecord?.diagnosisNote && (
                    <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-cyan-100 bg-cyan-50/60 px-3.5 py-2.5">
                      <Stethoscope size={13} className="mt-0.5 flex-shrink-0 text-cyan-600" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-cyan-700">Chẩn đoán: </span>
                        <span className="text-[12px] text-slate-700 line-clamp-2">{record.medicalRecord.diagnosisNote}</span>
                      </div>
                    </div>
                  )}

                  {/* Row 3: items (service details) */}
                  {hasItems && (
                    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 overflow-hidden">
                      <div className="flex items-center gap-2 border-b border-slate-100 px-3.5 py-2">
                        <Receipt size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Chi tiết dịch vụ</span>
                        <span className="ml-auto text-[11px] font-bold text-slate-900">{record.cost}</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {record.items.map((item, idx) => (
                          <div key={item.id ?? idx} className="flex items-center justify-between gap-3 px-3.5 py-2">
                            <div className="min-w-0 flex-1">
                              <span className="text-[12.5px] font-semibold text-slate-700 line-clamp-1">{item.description}</span>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-3 text-[12px]">
                              <span className="text-slate-400">x{item.quantity}</span>
                              <span className="font-bold text-slate-700">{item.totalPrice}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Row 3: prescriptions */}
                  {hasRx && (
                    <div className="mt-2.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3.5 py-2.5">
                      <div className="mb-2 flex items-center gap-1.5">
                        <Pill size={12} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Đơn thuốc</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {record.prescriptions!.map((rx, i) => (
                          <span
                            key={i}
                            className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-800"
                          >
                            {rx.medicineName}
                            {rx.durationDays ? ` · ${rx.durationDays} ngày` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Row 4: rating action */}
                  {record.status === "completed" && (
                    <div className="mt-3.5 flex items-center justify-end" onClick={e => e.stopPropagation()}>
                      {record.isRated ? (
                        <span className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          <Star size={11} className="fill-emerald-400 text-emerald-400" /> Đã đánh giá
                        </span>
                      ) : canRate ? (
                        <button
                          onClick={() => setRatingRecord(record)}
                          className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-[12px] font-bold text-amber-700 transition-colors hover:bg-amber-100"
                        >
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          Đánh giá dịch vụ
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rating modal ──────────────────────────────────────────── */}
      {ratingRecord && onRate && (
        <RatingModal
          record={ratingRecord}
          onClose={() => setRatingRecord(null)}
          onSubmit={async (score, comment) => {
            await onRate(ratingRecord, score, comment);
            setRatingRecord(null);
          }}
        />
      )}
    </div>
  );
}
