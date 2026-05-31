import { useEffect, useState } from "react";
import {
  Calendar, CheckCircle2, Activity, TrendingUp, TrendingDown,
  Users, Clock, Star, Award, Stethoscope, Loader2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
  PieChart, Pie,
} from "recharts";
import { doctorDataService, type DoctorStatsResponse } from "../services/doctorData";
import type { DoctorProfile } from "../services/doctorProfile";

// ── Data per period ────────────────────────────────────────────────────────────
type Period = "week" | "month" | "quarter";

const PERIOD_LABELS: Record<Period, string> = { week: "Tuan nay", month: "Thang nay", quarter: "Quy nay" };

const KPI_VIEW = [
  { key: "total", label: "Ca kham", sub: "theo ky", icon: Calendar, bg: "bg-cyan-50", color: "text-cyan-600" },
  { key: "completed", label: "Hoan thanh", sub: "ca da xong", icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
  { key: "newPatients", label: "Benh nhan", sub: "thu cung duy nhat", icon: Users, bg: "bg-violet-50", color: "text-violet-600" },
  { key: "completionRate", label: "Ty le hoan thanh", sub: "trong ky", icon: Clock, bg: "bg-amber-50", color: "text-amber-600", unit: "%" },
] as const;

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

export function DoctorStatsPage({ profile }: { profile?: DoctorProfile | null }) {
  const [period, setPeriod] = useState<Period>("month");
  const [stats, setStats] = useState<DoctorStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const d = stats?.[period];
  const kpis = d
    ? KPI_VIEW.map((item) => ({
        ...item,
        value: d.kpis[item.key],
        change: 0,
      }))
    : [];

  useEffect(() => {
    let active = true;
    setLoading(true);

    doctorDataService.getStats()
      .then((data) => {
        if (!active) return;
        setStats(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Khong the tai thong ke bac si");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-border">
        <div>
          <h2 className="text-sm font-bold text-foreground">Thống kê cá nhân</h2>
          <p className="text-[11px] text-muted-foreground">{profile ? `${profile.fullName} - ${profile.specialization} - ${profile.roomName}` : "Bac si"}</p>
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

      {loading && (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
          <Loader2 size={22} className="animate-spin text-cyan-500 mr-2" />
          Dang tai thong ke...
        </div>
      )}

      {!loading && error && (
        <div className="flex-1 flex items-center justify-center text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && d && <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

        {/* ── KPI row ── */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((k) => {
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
                <Pie data={d.speciesPie} cx="50%" cy="50%" innerRadius={45} outerRadius={68}
                  dataKey="value" paddingAngle={3}>
                  {d.speciesPie.map((e, i) => <Cell key={`species-${i}`} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 mt-1">
              {d.speciesPie.map((e) => (
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
              {d.topServices.map((s, i) => (
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
                <span className="text-[12px] font-bold text-amber-600">{d.averageRating || 0} / 5</span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {d.recentPatients.map((p) => (
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
      </div>}
    </div>
  );
}
