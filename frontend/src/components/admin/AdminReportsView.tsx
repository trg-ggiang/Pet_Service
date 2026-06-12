import { BarChart3, Calendar, CheckCircle2, Download, Scissors, Stethoscope, Users, XCircle, BedDouble } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AdminReports } from "../../features/admin/services/admin";

const CATEGORY = {
  clinic: { label: "Khám bệnh", color: "#0891B2", icon: Stethoscope },
  grooming: { label: "Grooming", color: "#A855F7", icon: Scissors },
  boarding: { label: "Lưu trú", color: "#F59E0B", icon: BedDouble },
};

function money(value: number) {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  return value.toLocaleString("vi-VN");
}

function Kpi({ label, value, sub, icon: Icon, tone }: { label: string; value: string; sub: string; icon: React.ElementType; tone: string }) {
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

export function AdminReportsView({ reports, loading, error }: { reports: AdminReports | null; loading: boolean; error: string }) {
  const stats = reports?.appointmentStats;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Báo cáo</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Phân tích doanh thu, dịch vụ và hiệu suất từ dữ liệu backend</p>
        </div>
        <button className="flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
          <Download size={13} />
          Xuất báo cáo
        </button>
      </div>

      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{error}</div>}
      {!reports && loading && <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">Đang tải báo cáo...</div>}

      {reports && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Doanh thu" value={`${money(reports.summary.revenue)}đ`} sub="Theo hóa đơn" icon={BarChart3} tone="bg-emerald-50 text-emerald-600" />
            <Kpi label="Lịch hẹn" value={String(reports.summary.bookings)} sub="Tất cả trạng thái" icon={Calendar} tone="bg-cyan-50 text-cyan-600" />
            <Kpi label="Khách hàng" value={String(reports.summary.customers)} sub="Tài khoản customer" icon={Users} tone="bg-indigo-50 text-indigo-600" />
            <Kpi label="Trung bình/lịch" value={`${money(reports.summary.avgRevenue)}đ`} sub="Doanh thu bình quân" icon={BarChart3} tone="bg-violet-50 text-violet-600" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-bold text-foreground">Doanh thu theo danh mục</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reports.revenueByPeriod}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(value) => money(Number(value))} />
                    <Tooltip formatter={(value: number) => [`${money(value)}đ`, ""]} />
                    {(["boarding", "grooming", "clinic"] as const).map((key) => (
                      <Area key={key} type="monotone" dataKey={key} stackId="revenue" stroke={CATEGORY[key].color} fill={CATEGORY[key].color} fillOpacity={0.2} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                {Object.entries(CATEGORY).map(([key, cfg]) => (
                  <span key={key} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: cfg.color }} />
                    {cfg.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-bold text-foreground">Thống kê lịch hẹn</h2>
              {[
                { label: "Chờ khám", value: stats?.scheduled ?? 0, icon: Calendar, color: "bg-cyan-500" },
                { label: "Đang xử lý", value: stats?.inProgress ?? 0, icon: Calendar, color: "bg-amber-500" },
                { label: "Hoàn thành", value: stats?.completed ?? 0, icon: CheckCircle2, color: "bg-emerald-500" },
                { label: "Đã hủy", value: stats?.cancelled ?? 0, icon: XCircle, color: "bg-red-500" },
              ].map((item) => {
                const Icon = item.icon;
                const pct = stats?.total ? Math.round((item.value / stats.total) * 100) : 0;
                return (
                  <div key={item.label} className="mb-4 last:mb-0">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-medium text-foreground"><Icon size={13} />{item.label}</span>
                      <span className="font-bold">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-bold text-foreground">Dịch vụ nổi bật</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left">Dịch vụ</th>
                    <th className="px-3 py-3 text-right">Lịch hẹn</th>
                    <th className="px-5 py-3 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {reports.topServices.map((service) => {
                    const cfg = CATEGORY[service.category];
                    const Icon = cfg.icon;
                    return (
                      <tr key={service.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3">
                          <div className="font-semibold text-foreground">{service.name}</div>
                          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            <Icon size={10} />
                            {cfg.label}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-semibold">{service.bookings}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold">{money(service.revenue)}đ</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-bold text-foreground">Hiệu suất nhân sự</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports.staffPerformance} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="completionRate" fill="#0891B2" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
