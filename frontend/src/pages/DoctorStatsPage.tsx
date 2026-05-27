import { useState } from "react";
import {
  Calendar, CheckCircle2, Activity, TrendingUp, TrendingDown,
  Users, Clock, Star, Award, Stethoscope,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
  PieChart, Pie,
} from "recharts";

// ── Data per period ────────────────────────────────────────────────────────────
const DATA = {
  week: {
    kpis: [
      { label: "Ca khám",       value: 28,   sub: "tuần này",       change: +4,  icon: Calendar,     bg: "bg-cyan-50",    color: "text-cyan-600" },
      { label: "Hoàn thành",    value: 25,   sub: "tỷ lệ 89%",      change: +2,  icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
      { label: "Bệnh nhân mới", value: 9,    sub: "lần đầu khám",   change: +3,  icon: Users,        bg: "bg-violet-50",  color: "text-violet-600" },
      { label: "Thời gian TB",  value: "22", sub: "phút/ca",        change: -2,  icon: Clock,        bg: "bg-amber-50",   color: "text-amber-600", unit: "ph" },
    ],
    trend: [
      { label: "T2", total: 5, completed: 5 },
      { label: "T3", total: 6, completed: 5 },
      { label: "T4", total: 7, completed: 6 },
      { label: "T5", total: 4, completed: 4 },
      { label: "T6", total: 6, completed: 5 },
      { label: "T7", total: 0, completed: 0 },
      { label: "CN", total: 0, completed: 0 },
    ],
    byDay: [
      { label: "T2", value: 5 },
      { label: "T3", value: 6 },
      { label: "T4", value: 7 },
      { label: "T5", value: 4 },
      { label: "T6", value: 6 },
    ],
  },
  month: {
    kpis: [
      { label: "Ca khám",       value: 112,  sub: "tháng này",      change: +18, icon: Calendar,     bg: "bg-cyan-50",    color: "text-cyan-600" },
      { label: "Hoàn thành",    value: 104,  sub: "tỷ lệ 93%",      change: +5,  icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
      { label: "Bệnh nhân mới", value: 34,   sub: "lần đầu khám",   change: +8,  icon: Users,        bg: "bg-violet-50",  color: "text-violet-600" },
      { label: "Thời gian TB",  value: "21", sub: "phút/ca",        change: -3,  icon: Clock,        bg: "bg-amber-50",   color: "text-amber-600", unit: "ph" },
    ],
    trend: [
      { label: "T1", total: 18, completed: 17 },
      { label: "T2", total: 22, completed: 20 },
      { label: "T3", total: 19, completed: 18 },
      { label: "T4", total: 25, completed: 23 },
      { label: "T1/2", total: 28, completed: 26 },
    ],
    byDay: [
      { label: "T2", value: 24 },
      { label: "T3", value: 21 },
      { label: "T4", value: 28 },
      { label: "T5", value: 19 },
      { label: "T6", value: 20 },
    ],
  },
  quarter: {
    kpis: [
      { label: "Ca khám",       value: 318,  sub: "quý này",        change: +42, icon: Calendar,     bg: "bg-cyan-50",    color: "text-cyan-600" },
      { label: "Hoàn thành",    value: 301,  sub: "tỷ lệ 95%",      change: +12, icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
      { label: "Bệnh nhân mới", value: 87,   sub: "lần đầu khám",   change: +21, icon: Users,        bg: "bg-violet-50",  color: "text-violet-600" },
      { label: "Thời gian TB",  value: "20", sub: "phút/ca",        change: -4,  icon: Clock,        bg: "bg-amber-50",   color: "text-amber-600", unit: "ph" },
    ],
    trend: [
      { label: "T3", total: 98, completed: 91 },
      { label: "T4", total: 108, completed: 103 },
      { label: "T5", total: 112, completed: 107 },
    ],
    byDay: [
      { label: "T2", value: 68 },
      { label: "T3", value: 62 },
      { label: "T4", value: 74 },
      { label: "T5", value: 58 },
      { label: "T6", value: 56 },
    ],
  },
};

const SERVICE_PIE = [
  { name: "Khám tổng quát", value: 42, color: "#0891B2" },
  { name: "Da liễu",        value: 24, color: "#8B5CF6" },
  { name: "Nội khoa",       value: 18, color: "#10B981" },
  { name: "Tiêm phòng",     value: 10, color: "#F59E0B" },
  { name: "Khác",           value: 6,  color: "#94A3B8" },
];

const SPECIES_PIE = [
  { name: "Mèo",  value: 58, color: "#06B6D4" },
  { name: "Chó",  value: 38, color: "#6366F1" },
  { name: "Khác", value: 4,  color: "#94A3B8" },
];

const TOP_SERVICES = [
  { name: "Khám tổng quát",  count: 47, pct: 100 },
  { name: "Khám da liễu",    count: 27, pct: 57 },
  { name: "Khám nội khoa",   count: 21, pct: 45 },
  { name: "Tiêm phòng",      count: 11, pct: 23 },
  { name: "Kiểm tra định kỳ",count: 6,  pct: 13 },
];

const RECENT_PATIENTS = [
  { name: "Luna",     species: "Mèo", diagnosis: "Viêm da dị ứng",    date: "22/05", rating: 5 },
  { name: "Mochi",    species: "Chó", diagnosis: "Rối loạn tiêu hoá", date: "20/05", rating: 5 },
  { name: "Snowball", species: "Mèo", diagnosis: "Viêm phế quản",     date: "18/05", rating: 4 },
  { name: "Biscuit",  species: "Chó", diagnosis: "Khám tổng quát",    date: "16/05", rating: 5 },
  { name: "Nala",     species: "Mèo", diagnosis: "Tiêm phòng",        date: "14/05", rating: 4 },
];

type Period = "week" | "month" | "quarter";

const PERIOD_LABELS: Record<Period, string> = { week: "Tuần này", month: "Tháng này", quarter: "Quý này" };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg px-3.5 py-2.5 text-[12px]">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name === "completed" ? "Hoàn thành" : "Tổng ca"}: <b>{p.value}</b>
        </p>
      ))}
    </div>
  );
};

export function DoctorStatsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const d = DATA[period];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-border">
        <div>
          <h2 className="text-sm font-bold text-foreground">Thống kê cá nhân</h2>
          <p className="text-[11px] text-muted-foreground">BS. Trần Hoài Nam · Nội khoa · Phòng 1</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                period === p ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

        {/* ── KPI row ── */}
        <div className="grid grid-cols-4 gap-4">
          {d.kpis.map((k) => {
            const Icon = k.icon;
            const isPos = k.change > 0;
            return (
              <div key={k.label} className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.bg}`}>
                    <Icon size={17} className={k.color} />
                  </div>
                  <div className={`flex items-center gap-1 text-[11px] font-bold ${isPos ? "text-emerald-600" : "text-red-500"}`}>
                    {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isPos ? "+" : ""}{k.change}{(k as any).unit ?? ""}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {k.value}{(k as any).unit && <span className="text-sm text-muted-foreground ml-1">{(k as any).unit}</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{k.label} · {k.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-3 gap-5">

          {/* Area chart */}
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
              <AreaChart data={d.trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
                <Area type="monotone" dataKey="total"     stroke="#0891B2" strokeWidth={2} fill="url(#gTotal)" name="total" />
                <Area type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} fill="url(#gDone)"  name="completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Species pie */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="text-[13px] font-bold text-foreground mb-1">Loại thú cưng</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Phân bố theo loài</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={SPECIES_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={68}
                  dataKey="value" paddingAngle={3}>
                  {SPECIES_PIE.map((e, i) => <Cell key={`species-${i}`} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 mt-1">
              {SPECIES_PIE.map((e) => (
                <div key={e.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                    <span className="text-[12px] text-foreground">{e.name}</span>
                  </div>
                  <span className="text-[12px] font-bold text-foreground">{e.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="grid grid-cols-3 gap-5">

          {/* Bar — by weekday */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="text-[13px] font-bold text-foreground mb-1">Ca khám theo ngày</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Thứ trong tuần</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={d.byDay} barSize={22} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(8,145,178,0.05)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {d.byDay.map((_, i) => (
                    <Cell key={`bar-${i}`} fill={i === 2 ? "#0891B2" : "#E0F2FE"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top services */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="text-[13px] font-bold text-foreground mb-1">Dịch vụ hay khám nhất</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Tháng này</p>
            <div className="flex flex-col gap-3">
              {TOP_SERVICES.map((s, i) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-[12px] font-semibold text-foreground">{s.name}</span>
                    </div>
                    <span className="text-[12px] font-bold text-foreground">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${s.pct}%`, background: i === 0 ? "#0891B2" : "#BAE6FD" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent patients + rating */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold text-foreground">Bệnh nhân gần đây</h3>
              <div className="flex items-center gap-1">
                <Award size={13} className="text-amber-500" />
                <span className="text-[12px] font-bold text-amber-600">4.8 / 5</span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {RECENT_PATIENTS.map((p) => (
                <div key={p.name + p.date} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center flex-shrink-0">
                    <Stethoscope size={13} className="text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-foreground">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground">{p.species}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{p.diagnosis}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <div className="flex">
                      {Array.from({ length: p.rating }).map((_, i) => (
                        <Star key={i} size={9} className="text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{p.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
