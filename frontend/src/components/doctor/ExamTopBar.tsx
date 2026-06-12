import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Save } from "lucide-react";
import type { DoctorExamDetail } from "../../services/doctorAppointments";

export function ExamTopBar({
  appointment,
  saving,
  completing,
  error,
  message,
  onBack,
  onSaveDraft,
  onUrgentAlert,
  onComplete,
}: {
  appointment: DoctorExamDetail["appointment"];
  saving: boolean;
  completing: boolean;
  error: string;
  message: string;
  onBack: () => void;
  onSaveDraft: () => void;
  onUrgentAlert: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-6 py-3.5 bg-white border-b border-border">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Quay lại
        </button>

        <div className="w-px h-4 bg-border" />

        <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
          {appointment.displayId}
        </span>

        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[12px] font-semibold text-amber-600">
            {appointment.statusLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {message && <span className="text-xs font-semibold text-emerald-600">{message}</span>}
        {error && (
          <span className="text-xs font-semibold text-red-500 max-w-[360px] truncate">
            {error}
          </span>
        )}

        <button
          onClick={onSaveDraft}
          disabled={saving || completing}
          className="flex items-center gap-1.5 h-9 px-4 border border-border rounded-xl text-[13px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Lưu nháp
        </button>

        <button
          onClick={onUrgentAlert}
          disabled={saving || completing}
          className="flex items-center gap-1.5 h-9 px-4 border border-red-200 bg-red-50 rounded-xl text-[13px] font-bold text-red-600 hover:bg-red-100 transition-all disabled:opacity-50"
        >
          <AlertTriangle size={14} />
          Thông báo khẩn
        </button>

        <button
          onClick={onComplete}
          disabled={saving || completing}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 bg-cyan-600"
        >
          {completing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Kết thúc khám
        </button>
      </div>
    </div>
  );
}
