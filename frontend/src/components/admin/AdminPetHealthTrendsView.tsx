import { Activity, AlertTriangle, Heart, PawPrint, RefreshCw, Stethoscope, TrendingUp, Weight } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminHealthTrends } from "../../features/admin/services/admin";

const SPECIES_COLORS = ["#0891B2", "#A855F7", "#F59E0B", "#10B981", "#EF4444", "#6366F1", "#EC4899", "#14B8A6"];
const DISEASE_COLOR = "#EF4444";
const MEDICINE_COLOR = "#0891B2";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
        <div className="mt-1 text-xl font-bold text-foreground">{value}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

const CustomTooltipBar = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-muted-foreground">Số lượt: <span className="font-bold text-foreground">{payload[0].value}</span></p>
    </div>
  );
};

const CustomTooltipPie = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground">{payload[0].name}</p>
      <p className="mt-1 text-muted-foreground">Số thú cưng: <span className="font-bold text-foreground">{payload[0].value}</span></p>
    </div>
  );
};

export function AdminPetHealthTrendsView({
  trends,
  loading,
  error,
}: {
  trends: AdminHealthTrends | null;
  loading: boolean;
  error: string;
}) {
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center gap-3 text-muted-foreground">
        <RefreshCw size={18} className="animate-spin" />
        <span className="text-sm">Đang tải dữ liệu phân tích...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
        {error}
      </div>
    );
  }

  if (!trends) return null;

  const { summary, topDiseases, visitTrend, speciesDistribution, avgWeightBySpecies, topMedicines, petGrowthTrend } = trends;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Phân tích xu hướng sức khỏe thú cưng</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Tổng quan dịch bệnh, dinh dưỡng và tình trạng sức khỏe từ dữ liệu khám thực tế</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Tổng thú cưng" value={String(summary.totalPets)} sub="Đã đăng ký" icon={PawPrint} tone="bg-cyan-50 text-cyan-600" />
        <StatCard label="Lượt khám" value={String(summary.totalVisits)} sub="Tất cả lịch sử" icon={Stethoscope} tone="bg-indigo-50 text-indigo-600" />
        <StatCard label="Tỷ lệ tái khám" value={`${summary.revisitRate}%`} sub="Có lịch tái khám" icon={RefreshCw} tone="bg-emerald-50 text-emerald-600" />
        <StatCard label="Trung bình/thú cưng" value={String(summary.avgVisitsPerPet)} sub="Lượt khám" icon={Activity} tone="bg-violet-50 text-violet-600" />
        <StatCard label="Có dị ứng" value={String(summary.petsWithAllergies)} sub={`${summary.totalPets ? Math.round((summary.petsWithAllergies / summary.totalPets) * 100) : 0}% tổng số`} icon={AlertTriangle} tone="bg-amber-50 text-amber-600" />
        <StatCard label="Bệnh nền" value={String(summary.petsWithChronic)} sub={`${summary.totalPets ? Math.round((summary.petsWithChronic / summary.totalPets) * 100) : 0}% tổng số`} icon={Heart} tone="bg-rose-50 text-rose-600" />
      </div>

      {/* Row 1: Disease chart + Species pie */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        {/* Top diseases bar chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader title="Bệnh phổ biến nhất" sub="Dựa trên chẩn đoán từ các lần khám" />
          {topDiseases.length === 0 ? (
            <div className="h-64"><EmptyChart label="Chưa có dữ liệu bệnh" /></div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDiseases} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={130}
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltipBar />} />
                  <Bar dataKey="count" fill={DISEASE_COLOR} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Species distribution pie */}
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader title="Phân bố loài" sub="Tỷ lệ các loài thú cưng" />
          {speciesDistribution.length === 0 ? (
            <div className="h-64"><EmptyChart label="Chưa có dữ liệu loài" /></div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={speciesDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={3}
                  >
                    {speciesDistribution.map((_, i) => (
                      <Cell key={i} fill={SPECIES_COLORS[i % SPECIES_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipPie />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ fontSize: 11, color: "#64748B" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Visit trend + Pet growth */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Visit trend area chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader title="Xu hướng khám bệnh theo tháng" sub="Số lượt khám 12 tháng gần nhất" />
          {visitTrend.length === 0 ? (
            <div className="h-56"><EmptyChart label="Chưa có dữ liệu" /></div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visitTrend} margin={{ left: 0, right: 10, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891B2" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0891B2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [v, "Lượt khám"]} />
                  <Area type="monotone" dataKey="count" stroke="#0891B2" strokeWidth={2} fill="url(#visitGrad)" dot={{ r: 3, fill: "#0891B2" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pet growth trend */}
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader title="Tăng trưởng đăng ký thú cưng" sub="Số thú cưng đăng ký mới theo tháng" />
          {petGrowthTrend.length === 0 ? (
            <div className="h-56"><EmptyChart label="Chưa có dữ liệu" /></div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={petGrowthTrend} margin={{ left: 0, right: 10, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="petGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [v, "Thú cưng mới"]} />
                  <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} fill="url(#petGrad)" dot={{ r: 3, fill: "#10B981" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Top medicines + Avg weight by species */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Top medicines */}
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader title="Thuốc được kê đơn nhiều nhất" sub="Tổng số lượng theo đơn kê" />
          {topMedicines.length === 0 ? (
            <div className="h-56"><EmptyChart label="Chưa có dữ liệu đơn thuốc" /></div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMedicines} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={130}
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltipBar />} />
                  <Bar dataKey="count" fill={MEDICINE_COLOR} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Average weight by species */}
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader title="Cân nặng trung bình theo loài" sub="Đơn vị: kg" />
          {avgWeightBySpecies.length === 0 ? (
            <div className="h-56"><EmptyChart label="Chưa có dữ liệu cân nặng" /></div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avgWeightBySpecies} margin={{ left: 0, right: 10, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} unit=" kg" />
                  <Tooltip formatter={(v: number) => [`${v} kg`, "Trung bình"]} />
                  <Bar dataKey="avgWeight" radius={[6, 6, 0, 0]}>
                    {avgWeightBySpecies.map((_, i) => (
                      <Cell key={i} fill={SPECIES_COLORS[i % SPECIES_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2">
            <Weight size={13} className="text-amber-600 flex-shrink-0" />
            <span className="text-xs text-amber-700">Chỉ tính thú cưng có dữ liệu cân nặng trong hệ thống</span>
          </div>
        </div>
      </div>

      {/* Row 4: Health risk table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <SectionHeader title="Tình trạng sức khỏe tổng quan" sub="Phân loại thú cưng theo tình trạng ghi nhận" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Thú cưng không có vấn đề",
              value: summary.totalPets - summary.petsWithAllergies - summary.petsWithChronic,
              color: "text-emerald-700",
              bg: "bg-emerald-50",
              border: "border-emerald-200",
              icon: Heart,
            },
            {
              label: "Có bệnh nền",
              value: summary.petsWithChronic,
              color: "text-amber-700",
              bg: "bg-amber-50",
              border: "border-amber-200",
              icon: AlertTriangle,
            },
            {
              label: "Có dị ứng",
              value: summary.petsWithAllergies,
              color: "text-rose-700",
              bg: "bg-rose-50",
              border: "border-rose-200",
              icon: AlertTriangle,
            },
            {
              label: "Có lịch tái khám",
              value: Math.round((summary.revisitRate / 100) * summary.totalVisits),
              color: "text-indigo-700",
              bg: "bg-indigo-50",
              border: "border-indigo-200",
              icon: TrendingUp,
            },
          ].map((item) => {
            const Icon = item.icon;
            const pct = summary.totalPets > 0 ? Math.round((item.value / summary.totalPets) * 100) : 0;
            return (
              <div key={item.label} className={`rounded-xl border ${item.border} ${item.bg} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={15} className={item.color} />
                  <span className={`text-xs font-bold ${item.color}`}>{item.label}</span>
                </div>
                <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                <div className={`mt-2 h-1.5 rounded-full bg-white/60`}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: "currentColor" }}
                  />
                </div>
                <div className={`mt-1 text-xs font-semibold ${item.color} opacity-70`}>{pct}% tổng số thú cưng</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
