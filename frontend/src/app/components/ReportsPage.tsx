import { useState } from "react";
import {
  TrendingUp, TrendingDown, Calendar, Download, BarChart3,
  Users, Stethoscope, Scissors, Syringe, BedDouble,
  Star, ArrowUpRight, ArrowDownRight, ChevronDown,
  FileText, Clock, CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
  PieChart, Pie, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "week" | "month" | "quarter" | "year";

// ─── Data ─────────────────────────────────────────────────────────────────────

const REVENUE_DATA: Record<Period, { t: string; clinic: number; vaccination: number; grooming: number; boarding: number }[]> = {
  week: [
    { t: "T2", clinic: 2.1, vaccination: 0.8, grooming: 1.9, boarding: 2.0 },
    { t: "T3", clinic: 3.2, vaccination: 1.2, grooming: 2.4, boarding: 1.4 },
    { t: "T4", clinic: 2.8, vaccination: 0.9, grooming: 1.6, boarding: 2.2 },
    { t: "T5", clinic: 4.1, vaccination: 1.5, grooming: 2.8, boarding: 0.7 },
    { t: "T6", clinic: 5.2, vaccination: 1.8, grooming: 3.1, boarding: 1.2 },
    { t: "T7", clinic: 1.4, vaccination: 0.5, grooming: 1.0, boarding: 0.3 },
    { t: "CN", clinic: 0.8, vaccination: 0.3, grooming: 0.6, boarding: 0.8 },
  ],
  month: [
    { t: "T1",   clinic: 10.2, vaccination: 4.1, grooming: 8.4,  boarding: 5.8  },
    { t: "T2",   clinic: 9.8,  vaccination: 3.6, grooming: 7.9,  boarding: 4.9  },
    { t: "T3",   clinic: 12.1, vaccination: 4.8, grooming: 9.2,  boarding: 6.1  },
    { t: "T4",   clinic: 11.4, vaccination: 4.2, grooming: 8.8,  boarding: 5.5  },
    { t: "T5",   clinic: 14.3, vaccination: 5.6, grooming: 11.2, boarding: 7.2  },
    { t: "T6",   clinic: 13.2, vaccination: 5.1, grooming: 10.4, boarding: 6.8  },
    { t: "T7",   clinic: 15.8, vaccination: 6.2, grooming: 12.1, boarding: 8.0  },
    { t: "T8",   clinic: 14.5, vaccination: 5.8, grooming: 11.8, boarding: 7.5  },
    { t: "T9",   clinic: 13.1, vaccination: 5.2, grooming: 10.2, boarding: 6.4  },
    { t: "T10",  clinic: 16.2, vaccination: 6.4, grooming: 12.9, boarding: 8.8  },
    { t: "T11",  clinic: 14.8, vaccination: 5.9, grooming: 11.6, boarding: 7.4  },
    { t: "T12",  clinic: 18.4, vaccination: 7.2, grooming: 14.2, boarding: 9.6  },
  ],
  quarter: [
    { t: "Q1/25", clinic: 28.4, vaccination: 11.2, grooming: 22.8, boarding: 14.6 },
    { t: "Q2/25", clinic: 32.1, vaccination: 12.8, grooming: 25.4, boarding: 16.3 },
    { t: "Q3/25", clinic: 36.5, vaccination: 14.5, grooming: 29.1, boarding: 18.4 },
    { t: "Q4/25", clinic: 41.2, vaccination: 16.2, grooming: 32.8, boarding: 20.9 },
    { t: "Q1/26", clinic: 38.4, vaccination: 15.1, grooming: 30.2, boarding: 19.2 },
    { t: "Q2/26", clinic: 44.8, vaccination: 17.6, grooming: 35.2, boarding: 22.1 },
  ],
  year: [
    { t: "2022", clinic: 98.4, vaccination: 38.2, grooming: 82.4, boarding: 51.6 },
    { t: "2023", clinic: 118.2, vaccination: 45.6, grooming: 98.1, boarding: 62.4 },
    { t: "2024", clinic: 142.4, vaccination: 54.8, grooming: 118.6, boarding: 76.8 },
    { t: "2025", clinic: 138.2, vaccination: 54.7, grooming: 110.1, boarding: 70.2 },
    { t: "2026", clinic: 83.2, vaccination: 32.7, grooming: 65.4, boarding: 41.3 },
  ],
};

const TOP_SERVICES = [
  { id: "SV-G01", name: "Tắm & sấy tiêu chuẩn",   category: "grooming",    bookings: 44, revenue: 9900000,  growth: 12.4,  rating: 4.8 },
  { id: "SV-C01", name: "Khám tổng quát",           category: "clinic",      bookings: 38, revenue: 9500000,  growth: 8.1,   rating: 4.9 },
  { id: "SV-G06", name: "Cắt móng",                 category: "grooming",    bookings: 38, revenue: 1900000,  growth: 5.2,   rating: 4.6 },
  { id: "SV-G04", name: "Grooming đầy đủ",          category: "grooming",    bookings: 18, revenue: 10440000, growth: 21.3,  rating: 4.9 },
  { id: "SV-G02", name: "Tắm & sấy cao cấp",        category: "grooming",    bookings: 29, revenue: 9280000,  growth: 15.6,  rating: 4.7 },
  { id: "SV-V01", name: "Tiêm phòng dại",            category: "vaccination", bookings: 32, revenue: 5760000,  growth: 3.8,   rating: 4.8 },
  { id: "SV-V02", name: "Combo 5 bệnh (chó)",        category: "vaccination", bookings: 21, revenue: 6720000,  growth: 9.2,   rating: 4.7 },
  { id: "SV-C02", name: "Khám da liễu",              category: "clinic",      bookings: 24, revenue: 7680000,  growth: 6.5,   rating: 4.6 },
  { id: "SV-G03", name: "Cắt tỉa lông",              category: "grooming",    bookings: 22, revenue: 8360000,  growth: -2.1,  rating: 4.5 },
  { id: "SV-B02", name: "Lưu trú tiêu chuẩn",       category: "boarding",    bookings: 16, revenue: 9600000,  growth: 18.4,  rating: 4.7 },
];

const STAFF_PERF = [
  { name: "BS. Trần Hoài Nam",    dept: "Nội khoa",      exams: 142, revenue: 28400000, satisfaction: 4.9, completion: 96, growth: 12.4, avatar: "TN", color: "from-cyan-400 to-cyan-600" },
  { name: "BS. Lê Thị Hoa",       dept: "Thú y đa khoa", exams: 128, revenue: 25600000, satisfaction: 4.8, completion: 94, growth: 8.2,  avatar: "LH", color: "from-emerald-400 to-emerald-600" },
  { name: "BS. Nguyễn Đức Trung", dept: "Ngoại khoa",    exams: 96,  revenue: 38400000, satisfaction: 4.7, completion: 91, growth: 5.1,  avatar: "NT", color: "from-violet-400 to-violet-600" },
  { name: "NV. Vũ Minh Tuấn",     dept: "Grooming",      exams: 184, revenue: 27600000, satisfaction: 4.8, completion: 98, growth: 22.3, avatar: "VT", color: "from-amber-400 to-amber-600" },
  { name: "NV. Đinh Thị Lan",     dept: "Lưu trú",       exams: 68,  revenue: 40800000, satisfaction: 4.6, completion: 99, growth: 18.4, avatar: "ĐL", color: "from-pink-400 to-pink-600" },
];

const APPT_STATS: Record<Period, { completed: number; cancelled: number; noshow: number; total: number }> = {
  week:    { completed: 58,  cancelled: 4,  noshow: 2,   total: 64  },
  month:   { completed: 241, cancelled: 18, noshow: 9,   total: 268 },
  quarter: { completed: 724, cancelled: 52, noshow: 28,  total: 804 },
  year:    { completed: 2841, cancelled: 196, noshow: 98, total: 3135 },
};

const PERIOD_LABELS: Record<Period, string> = {
  week: "Tuần này", month: "Tháng này", quarter: "Quý này", year: "Năm nay",
};

const PERIOD_PREV_LABELS: Record<Period, string> = {
  week: "tuần trước", month: "tháng trước", quarter: "quý trước", year: "năm ngoái",
};

const CATEGORY_CFG = {
  clinic:      { label: "Khám bệnh",   color: "#0891B2", bg: "bg-cyan-50",    text: "text-cyan-700",    icon: Stethoscope },
  vaccination: { label: "Tiêm chủng",  color: "#10B981", bg: "bg-emerald-50", text: "text-emerald-700", icon: Syringe },
  grooming:    { label: "Grooming",    color: "#A855F7", bg: "bg-violet-50",  text: "text-violet-700",  icon: Scissors },
  boarding:    { label: "Lưu trú",     color: "#F59E0B", bg: "bg-amber-50",   text: "text-amber-700",   icon: BedDouble },
};

// ─── Summary numbers by period ─────────────────────────────────────────────────

const SUMMARY: Record<Period, {
  revenue: number; revenueChange: number;
  customers: number; customersChange: number;
  bookings: number; bookingsChange: number;
  avgRevenue: number; avgRevenueChange: number;
}> = {
  week:    { revenue: 19.7,  revenueChange: 8.2,   customers: 64,  customersChange: 14.3, bookings: 64,  bookingsChange: 14.3, avgRevenue: 308000, avgRevenueChange: -0.8 },
  month:   { revenue: 48.5,  revenueChange: 17.7,  customers: 268, customersChange: 9.4,  bookings: 268, bookingsChange: 9.4,  avgRevenue: 318000, avgRevenueChange: 3.2  },
  quarter: { revenue: 119.6, revenueChange: -3.8,  customers: 804, customersChange: 5.2,  bookings: 804, bookingsChange: 5.2,  avgRevenue: 311000, avgRevenueChange: -1.4 },
  year:    { revenue: 222.6, revenueChange: -3.1,  customers: 2835, customersChange: 6.8, bookings: 3135, bookingsChange: 6.8, avgRevenue: 298000, avgRevenueChange: 2.1  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtM(val: number) {
  if (val >= 1000) return `${(val / 1000).toFixed(1)}B`;
  return `${val.toFixed(1)}M`;
}

function fmtK(val: number) {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  return `${Math.round(val / 1000)}K`;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11}
          className={i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
      ))}
      <span className="ml-1 text-xs font-semibold text-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

function PerfBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + p.value, 0);
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 min-w-[160px]">
      <p className="text-xs font-bold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            {CATEGORY_CFG[p.dataKey as keyof typeof CATEGORY_CFG]?.label ?? p.dataKey}
          </span>
          <span className="text-xs font-semibold text-foreground">{p.value.toFixed(1)}M</span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t border-border flex justify-between">
        <span className="text-xs font-bold text-foreground">Tổng</span>
        <span className="text-xs font-bold text-primary">{total.toFixed(1)}M₫</span>
      </div>
    </div>
  );
}

// ─── Category Donut ───────────────────────────────────────────────────────────

function CategoryBreakdown({ period }: { period: Period }) {
  const data = REVENUE_DATA[period];
  const totals = {
    clinic:      data.reduce((s, d) => s + d.clinic, 0),
    vaccination: data.reduce((s, d) => s + d.vaccination, 0),
    grooming:    data.reduce((s, d) => s + d.grooming, 0),
    boarding:    data.reduce((s, d) => s + d.boarding, 0),
  };
  const grand = Object.values(totals).reduce((s, v) => s + v, 0);
  const pieData = (Object.keys(totals) as Array<keyof typeof totals>).map(k => ({
    name: CATEGORY_CFG[k].label,
    value: totals[k],
    color: CATEGORY_CFG[k].color,
    key: k,
  }));

  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <h3 className="text-sm font-bold text-foreground mb-4">Doanh thu theo danh mục</h3>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0" style={{ width: 140, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={64}
                dataKey="value" paddingAngle={2} strokeWidth={0}>
                {pieData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v.toFixed(1)}M₫`, ""]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2.5">
          {pieData.map((item) => {
            const pct = ((item.value / grand) * 100).toFixed(1);
            const Icon = CATEGORY_CFG[item.key as keyof typeof CATEGORY_CFG].icon;
            return (
              <div key={item.key} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <Icon size={13} className="text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground flex-1 truncate">{item.name}</span>
                <span className="text-xs font-bold text-foreground">{item.value.toFixed(1)}M</span>
                <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Appointment Stats ─────────────────────────────────────────────────────────

function ApptStats({ period }: { period: Period }) {
  const s = APPT_STATS[period];
  const completionRate = Math.round((s.completed / s.total) * 100);
  const cancelRate = Math.round((s.cancelled / s.total) * 100);
  const noshowRate = Math.round((s.noshow / s.total) * 100);

  const items = [
    { label: "Hoàn thành", value: s.completed, pct: completionRate, color: "#10B981", icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-50" },
    { label: "Đã huỷ",     value: s.cancelled, pct: cancelRate,     color: "#EF4444", icon: XCircle,      cls: "text-red-600 bg-red-50" },
    { label: "Không đến",  value: s.noshow,    pct: noshowRate,     color: "#F59E0B", icon: RefreshCw,    cls: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Thống kê lịch hẹn</h3>
        <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">{s.total} tổng</span>
      </div>
      <div className="space-y-3">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${item.cls}`}>
                    <Icon size={12} />
                  </div>
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">{item.value}</span>
                  <span className="text-[10px] text-muted-foreground w-8 text-right">{item.pct}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${item.pct}%`, background: item.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, unit = "", change, positive, sub, icon: Icon, iconBg, iconColor,
}: {
  label: string; value: string; unit?: string; change: string;
  positive: boolean | null; sub: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white border border-border rounded-2xl px-5 py-4 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.06em] truncate">{label}</p>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-xl font-bold text-foreground">{value}</span>
          {unit && <span className="text-sm font-semibold text-muted-foreground">{unit}</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {positive !== null && (
            positive
              ? <ArrowUpRight size={13} className="text-emerald-500" />
              : <ArrowDownRight size={13} className="text-red-400" />
          )}
          <span className={`text-xs font-semibold ${
            positive === null ? "text-muted-foreground" :
            positive ? "text-emerald-600" : "text-red-500"
          }`}>{change}</span>
          <span className="text-xs text-muted-foreground">{sub}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Category Badge ───────────────────────────────────────────────────────────

function CatBadge({ cat }: { cat: string }) {
  const cfg = CATEGORY_CFG[cat as keyof typeof CATEGORY_CFG];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon size={9} />
      {cfg.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [sortBy, setSortBy] = useState<"revenue" | "bookings">("revenue");

  const summary = SUMMARY[period];
  const revenueData = REVENUE_DATA[period];
  const prevLabel = PERIOD_PREV_LABELS[period];

  const sortedServices = [...TOP_SERVICES].sort((a, b) =>
    sortBy === "revenue" ? b.revenue - a.revenue : b.bookings - a.bookings
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Báo cáo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Phân tích doanh thu, dịch vụ và hiệu suất nhân viên</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            {(["week", "month", "quarter", "year"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <button className="h-9 flex items-center gap-2 px-3.5 border border-border bg-white rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-colors">
            <Download size={13} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Doanh thu"
          value={`${summary.revenue.toFixed(1)}M`}
          unit="₫"
          change={`${summary.revenueChange >= 0 ? "+" : ""}${summary.revenueChange}%`}
          positive={summary.revenueChange >= 0}
          sub={`vs. ${prevLabel}`}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <KpiCard
          label="Lịch hẹn"
          value={summary.bookings.toString()}
          change={`${summary.bookingsChange >= 0 ? "+" : ""}${summary.bookingsChange}%`}
          positive={summary.bookingsChange >= 0}
          sub={`vs. ${prevLabel}`}
          icon={Calendar}
          iconBg="bg-cyan-50"
          iconColor="text-cyan-600"
        />
        <KpiCard
          label="Khách hàng phục vụ"
          value={summary.customers.toString()}
          change={`${summary.customersChange >= 0 ? "+" : ""}${summary.customersChange}%`}
          positive={summary.customersChange >= 0}
          sub={`vs. ${prevLabel}`}
          icon={Users}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <KpiCard
          label="Doanh thu / lịch hẹn"
          value={fmtK(summary.avgRevenue)}
          unit="₫"
          change={`${summary.avgRevenueChange >= 0 ? "+" : ""}${summary.avgRevenueChange}%`}
          positive={summary.avgRevenueChange >= 0}
          sub={`vs. ${prevLabel}`}
          icon={BarChart3}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
      </div>

      {/* Revenue chart + right column */}
      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Area chart */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Doanh thu theo thời gian</h3>
            <div className="flex items-center gap-3">
              {(["clinic","vaccination","grooming","boarding"] as const).map(k => (
                <div key={k} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_CFG[k].color }} />
                  <span className="text-[10px] font-medium text-muted-foreground">{CATEGORY_CFG[k].label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  {(["clinic","vaccination","grooming","boarding"] as const).map(k => (
                    <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CATEGORY_CFG[k].color} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={CATEGORY_CFG[k].color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${v}M`} />
                <Tooltip content={<RevenueTooltip />} />
                {(["boarding","vaccination","grooming","clinic"] as const).map(k => (
                  <Area key={k} type="monotone" dataKey={k}
                    stroke={CATEGORY_CFG[k].color} strokeWidth={1.5}
                    fill={`url(#grad-${k})`} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right col: donut + appt stats */}
        <div className="flex flex-col gap-4">
          <CategoryBreakdown period={period} />
          <ApptStats period={period} />
        </div>
      </div>

      {/* Bottom: top services + staff perf */}
      <div className="grid grid-cols-[1fr_380px] gap-4">
        {/* Top services */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Dịch vụ nổi bật</h3>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {(["revenue", "bookings"] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    sortBy === s ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {s === "revenue" ? "Doanh thu" : "Lịch hẹn"}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground w-6">#</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Dịch vụ</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Lịch hẹn</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Doanh thu</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Tăng trưởng</th>
                <th className="px-5 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {sortedServices.map((svc, i) => (
                <tr key={svc.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-xs text-foreground truncate max-w-[180px]">{svc.name}</div>
                    <div className="mt-0.5"><CatBadge cat={svc.category} /></div>
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-semibold text-foreground">{svc.bookings}</td>
                  <td className="px-3 py-3 text-right text-xs font-bold text-foreground">{fmtK(svc.revenue)}₫</td>
                  <td className="px-3 py-3 text-right">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${svc.growth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {svc.growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {Math.abs(svc.growth)}%
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end"><Stars rating={svc.rating} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Staff performance */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Hiệu suất nhân viên</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{PERIOD_LABELS[period].toLowerCase()}</p>
          </div>
          <div className="divide-y divide-border/60">
            {STAFF_PERF.map((s, i) => (
              <div key={s.name} className="px-5 py-3.5 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-[10px] font-bold text-white">{s.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground truncate">{s.name}</span>
                      <span className={`text-[10px] font-bold ${s.growth >= 0 ? "text-emerald-600" : "text-red-500"} flex items-center gap-0.5`}>
                        {s.growth >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {Math.abs(s.growth)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{s.dept}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-[10px] font-medium text-foreground">{s.exams} ca</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-[10px] font-semibold text-primary">{fmtK(s.revenue)}₫</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">Hoàn thành</span>
                      <span className="text-[10px] font-bold text-foreground">{s.completion}%</span>
                    </div>
                    <PerfBar pct={s.completion} color={
                      i === 0 ? "#0891B2" : i === 1 ? "#10B981" : i === 2 ? "#A855F7" : i === 3 ? "#F59E0B" : "#EC4899"
                    } />
                  </div>
                  <Stars rating={s.satisfaction} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
