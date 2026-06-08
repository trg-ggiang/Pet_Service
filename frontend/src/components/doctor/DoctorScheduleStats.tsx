import { Activity, Calendar, CheckCircle2, Clock } from "lucide-react";
import type { DoctorScheduleSummary } from "../../features/doctor/services/doctorAppointments";

export function DoctorScheduleStats({ summary }: { summary: DoctorScheduleSummary }) {
  const stats = [
    { label: "Tổng ca khám", value: summary.total, icon: Calendar, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Đã hoàn thành", value: summary.completed, icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Đang khám", value: summary.inProgress, icon: Activity, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "Chờ khám", value: summary.scheduled, icon: Clock, bg: "bg-violet-50", color: "text-violet-600" },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-white border border-border rounded-2xl px-5 py-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
              <Icon size={18} className={stat.color} />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
              <div className="text-[11px] text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
