import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ExamSystemEntry, ExamSystemStatus } from "../../services/doctorAppointments";
import { SYSTEM_STATUS_CLASS } from "./utils";

export function SystemRow({
  label,
  entry,
  statusOptions,
  onChange,
}: {
  label: string;
  entry: ExamSystemEntry;
  statusOptions: Array<{ value: string; label: string }>;
  onChange: (entry: ExamSystemEntry) => void;
}) {
  const [open, setOpen] = useState(entry.status === "abnormal");

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <span className="text-[13px] font-semibold text-foreground flex-1">{label}</span>
        <div className="flex items-center gap-1">
          {statusOptions.map((option) => {
            const status = option.value as ExamSystemStatus;
            const active = entry.status === status;
            const cfg = SYSTEM_STATUS_CLASS[status] || SYSTEM_STATUS_CLASS.not_examined;

            return (
              <button
                key={option.value}
                onClick={() => {
                  onChange({ ...entry, status });
                  setOpen(status === "abnormal");
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                  active
                    ? `${cfg.cls} shadow-sm`
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${active ? cfg.dot : "bg-slate-200"}`} />
                {option.label}
              </button>
            );
          })}
        </div>

        {entry.status === "abnormal" && (
          <button
            onClick={() => setOpen((value) => !value)}
            className="w-6 h-6 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
          >
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {open && entry.status === "abnormal" && (
        <div className="px-3.5 pb-3 border-t border-red-100 bg-red-50/40">
          <textarea
            rows={2}
            value={entry.notes}
            onChange={(event) => onChange({ ...entry, notes: event.target.value })}
            placeholder="Mô tả chi tiết bất thường..."
            className="mt-2.5 w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-300 transition-all resize-none"
          />
        </div>
      )}
    </div>
  );
}
