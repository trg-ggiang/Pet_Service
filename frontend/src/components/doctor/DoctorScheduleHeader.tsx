import { Bell } from "lucide-react";
import type { DoctorScheduleMeta } from "../../features/doctor/services/doctorAppointments";

export function DoctorScheduleHeader({ meta }: { meta: DoctorScheduleMeta }) {
  return (
    <header className="h-14 border-b border-border bg-white px-6 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-sm font-bold text-foreground">{meta.title}</h1>
        <p className="text-[11px] text-muted-foreground">{meta.dateLabel}</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 rounded-xl border border-border bg-white flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
          <Bell size={14} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
