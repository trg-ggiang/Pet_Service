import type { ElementType } from "react";
import { Calendar, CheckCircle2, Star, Stethoscope, Syringe } from "lucide-react";
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
};

const HISTORY_TYPE_OPTIONS = [
  { id: "all" as const, label: "Tất cả", icon: CheckCircle2 },
  { id: "medical" as const, label: "Khám bệnh", icon: Stethoscope },
  { id: "vaccine" as const, label: "Tiêm phòng", icon: Syringe },
  { id: "grooming" as const, label: "Grooming", icon: Star },
  { id: "boarding" as const, label: "Lưu trú", icon: Calendar },
];

const TYPE_ICONS: Record<HistoryRecord["type"], ElementType> = {
  medical: Stethoscope,
  vaccine: Syringe,
  grooming: Star,
  boarding: Calendar,
};

const TYPE_COLORS: Record<HistoryRecord["type"], { bg: string; color: string }> = {
  medical: { bg: "#ECFEFF", color: "#0891B2" },
  vaccine: { bg: "#ECFDF5", color: "#059669" },
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
}: CustomerHistoryTabProps) {
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
                <div className="text-right">
                  <div className="text-base font-bold text-slate-900">{history.cost}</div>
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md ring-1 ring-inset ring-emerald-200/50">
                    {history.status === "completed" ? "Hoàn thành" : history.status === "pending" ? "Chờ thanh toán" : "Đã hủy"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
