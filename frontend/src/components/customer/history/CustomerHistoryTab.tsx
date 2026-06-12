import { useState, type ElementType } from "react";
import { Calendar, CheckCircle2, Star, Stethoscope, X } from "lucide-react";
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

function RatingModal({ record, onClose, onSubmit }: { record: HistoryRecord; onClose: () => void; onSubmit: (score: number, comment: string) => Promise<void> }) {
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  const display = hovered || score;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Đánh giá dịch vụ</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={15} className="text-slate-400" /></button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <p className="text-[13px] text-slate-600">{record.service} · {record.staff}</p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)} onClick={() => setScore(i)}>
                <Star size={32} className={i <= display ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
            placeholder="Nhận xét thêm (không bắt buộc)..."
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400" />
          {error && <p className="text-[12.5px] font-medium text-red-600">{error}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Hủy</button>
          <button onClick={() => void handleSubmit()} disabled={submitting || score === 0}
            className="flex-1 h-10 rounded-xl bg-cyan-500 text-white text-[13px] font-bold hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed">
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}

const HISTORY_TYPE_OPTIONS = [
  { id: "all" as const, label: "Tất cả", icon: CheckCircle2 },
  { id: "medical" as const, label: "Khám bệnh", icon: Stethoscope },
  { id: "grooming" as const, label: "Grooming", icon: Star },
  { id: "boarding" as const, label: "Lưu trú", icon: Calendar },
];

const TYPE_ICONS: Record<HistoryRecord["type"], ElementType> = {
  medical: Stethoscope,
  grooming: Star,
  boarding: Calendar,
};

const TYPE_COLORS: Record<HistoryRecord["type"], { bg: string; color: string }> = {
  medical: { bg: "#ECFEFF", color: "#0891B2" },
  grooming: { bg: "#FFFBEB", color: "#D97706" },
  boarding: { bg: "#F5F3FF", color: "#7C3AED" },
};

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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Lịch sử dịch vụ</h2>

      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex w-full gap-1 overflow-x-auto">
        {HISTORY_TYPE_OPTIONS.map((typeOption) => {
          const active = historyTypeFilter === typeOption.id;
          const Icon = typeOption.icon;
          const count = historySummary.typeCounts.find((item) => item.type === typeOption.id)?.count ?? 0;
          return (
            <button
              key={typeOption.id}
              onClick={() => onChangeTypeFilter(typeOption.id)}
              className={`flex min-w-fit flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                active ? "bg-cyan-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={14} strokeWidth={active ? 2.5 : 2} />
              {typeOption.label} <span className={active ? "opacity-80" : "text-slate-400"}>({count})</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {historyLoading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Đang tải lịch sử dịch vụ...
          </div>
        )}
        {!historyLoading && historyError && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-sm font-semibold text-red-700">
            {historyError}
          </div>
        )}
        {!historyLoading && !historyError && historyRecords.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Chưa có lịch sử dịch vụ.
          </div>
        )}
        {!historyLoading && !historyError && historyRecords.map((history) => {
          const Icon = TYPE_ICONS[history.type];
          const color = TYPE_COLORS[history.type];
          const canRate = onRate && history.status === "completed" && history.appointmentId && !history.isRated;
          return (
            <div
              key={history.id}
              onClick={() => onViewHistory(history)}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: color.bg }}>
                  <Icon size={22} style={{ color: color.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-slate-900">{history.service}</div>
                  {history.services.length > 1 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {history.services.map((service) => (
                        <span key={service} className="rounded-lg bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                          {service}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-sm font-medium text-slate-500 mt-1">
                    <span className="text-slate-700">{history.pet}</span> • {history.staff} • {history.date}
                  </div>
                </div>
                <div className="text-right space-y-1.5">
                  <div className="text-base font-bold text-slate-900">{history.cost}</div>
                  <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md ring-1 ring-inset ring-emerald-200/50">
                    {history.status === "completed" ? "Hoàn thành" : history.status === "pending" ? "Chờ thanh toán" : "Đã hủy"}
                  </span>
                  {history.isRated ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-emerald-200">
                      <Star size={11} className="fill-emerald-400 text-emerald-400" /> Đã đánh giá
                    </span>
                  ) : canRate && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setRatingRecord(history); }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[11px] font-bold hover:bg-amber-100 transition-colors border border-amber-200"
                    >
                      <Star size={11} className="fill-amber-400 text-amber-400" /> Đánh giá
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

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
    </div>
  );
}
