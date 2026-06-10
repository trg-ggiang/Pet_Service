import {
  Activity,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Star,
  Stethoscope,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DoctorStatsPayload, DoctorStatsPeriod } from "../../features/doctor/services/doctorData";

const PERIOD_LABELS: Record<DoctorStatsPeriod, string> = {
  month: "Tháng",
  week: "Tuần",
  day: "Ngày",
};

const ICONS: Record<string, typeof Calendar> = {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg px-3.5 py-2.5 text-[12px]">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((item: any) => (
        <p key={item.name} style={{ color: item.color }} className="font-medium">
          {item.name === "completed" ? "Hoàn thành" : "Tổng ca"}: <b>{item.value}</b>
        </p>
      ))}
    </div>
  );
}

export function DoctorStatsToolbar({
  subtitle,
  period,
  onPeriodChange,
}: {
  subtitle: string;
  period: DoctorStatsPeriod;
  onPeriodChange: (period: DoctorStatsPeriod) => void;
}) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-border">
      <div>
        <h2 className="text-sm font-bold text-foreground">Thống kê cá nhân</h2>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
        {(Object.keys(PERIOD_LABELS) as DoctorStatsPeriod[]).map((item) => (
          <button
            key={item}
            onClick={() => onPeriodChange(item)}
            className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
              period === item ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {PERIOD_LABELS[item]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DoctorStatsLoading() {
  return (
    <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
      <Loader2 size={22} className="animate-spin text-cyan-500 mr-2" />
      Đang tải thống kê...
    </div>
  );
}

export function DoctorStatsError({ message }: { message: string }) {
  return <div className="flex-1 flex items-center justify-center text-sm text-red-600">{message}</div>;
}

export function DoctorStatsContent({ data }: { data: DoctorStatsPayload }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-4">
        {data.kpiCards.map((card) => {
          const Icon = ICONS[card.icon] || Activity;
          return (
            <div key={card.key} className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg}`}>
                  <Icon size={17} className={card.color} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {card.value}{card.unit && <span className="text-sm text-muted-foreground ml-1">{card.unit}</span>}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{card.label} · {card.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-bold text-foreground">Xu hướng ca khám</h3>
              <p className="text-[11px] text-muted-foreground">Tổng ca vs hoàn thành</p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-cyan-400 inline-block" /> Tổng</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-emerald-400 inline-block" /> Hoàn thành</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891B2" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0891B2" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#0891B2" strokeWidth={2} fill="url(#gTotal)" name="total" />
              <Area type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} fill="url(#gDone)" name="completed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Loại thú cưng</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Phân bố theo loài</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={data.speciesPie} cx="50%" cy="50%" innerRadius={45} outerRadius={68} dataKey="value" paddingAngle={3}>
                {data.speciesPie.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value: any) => [`${value}%`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-1">
            {data.speciesPie.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                  <span className="text-[12px] text-foreground">{entry.name}</span>
                </div>
                <span className="text-[12px] font-bold text-foreground">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Ca khám theo ngày</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Thứ trong tuần</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data.byDay} barSize={22} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(8,145,178,0.05)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.byDay.map((_, index) => (
                  <Cell key={`bar-${index}`} fill={index === 2 ? "#0891B2" : "#E0F2FE"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Dịch vụ hay khám nhất</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Tháng này</p>
          <div className="flex flex-col gap-3">
            {data.topServices.map((service, index) => (
              <div key={service.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-muted-foreground w-4">{index + 1}</span>
                    <span className="text-[12px] font-semibold text-foreground">{service.name}</span>
                  </div>
                  <span className="text-[12px] font-bold text-foreground">{service.count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${service.pct}%`, background: index === 0 ? "#0891B2" : "#BAE6FD" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-foreground">Bệnh nhân gần đây</h3>
            <div className="flex items-center gap-1">
              <Award size={13} className="text-amber-500" />
              <span className="text-[12px] font-bold text-amber-600">{data.averageRating || 0} / 5</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {data.recentPatients.map((patient) => (
              <div key={patient.name + patient.date} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center flex-shrink-0">
                  <Stethoscope size={13} className="text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-foreground">{patient.name}</span>
                    <span className="text-[10px] text-muted-foreground">{patient.species}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{patient.diagnosis}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <div className="flex">
                    {Array.from({ length: patient.rating }).map((_, index) => (
                      <Star key={index} size={9} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{patient.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
