import type { DoctorExamDetail } from "../../services/doctorAppointments";
import { pickIcon, TONE_CLASS } from "./utils";

export function VitalInput({
  field,
  value,
  onChange,
}: {
  field: DoctorExamDetail["formSchema"]["vitalFields"][number];
  value: string;
  onChange: (value: string) => void;
}) {
  const Icon = pickIcon(field.icon);
  const tone = TONE_CLASS[field.tone] || TONE_CLASS.slate;

  return (
    <div className={`flex flex-col gap-2 p-3.5 rounded-xl border border-border ${tone.bg}`}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className={tone.icon} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
          {field.label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="—"
          className="w-full bg-transparent text-xl font-bold text-foreground focus:outline-none placeholder:text-slate-300"
        />
        <span className="text-xs text-slate-400 flex-shrink-0">{field.unit}</span>
      </div>
    </div>
  );
}
