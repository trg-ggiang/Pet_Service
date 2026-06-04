import { BarChart3, BedDouble, Calendar, Heart, RefreshCw, Scissors, Stethoscope, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AdminDashboard } from "../../features/admin/services/admin";

type AdminPageId = "appointments" | "staff" | "users" | "services" | "reports";

const STATUS_COLORS = ["#0891B2", "#F59E0B", "#10B981", "#EF4444", "#64748B"];

function formatMoney(value: number) {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  return value.toLocaleString("vi-VN");
}

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
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardView({
  dashboard,
  loading,
  error,
  onRefresh,
  onNav,
}: {
  dashboard: AdminDashboard | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onNav?: (page: AdminPageId) => void;
}) {
  const totals = dashboard?.totals;
  const boardingCapacity = totals?.cages ? Math.round((totals.occupiedCages / totals.cages) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Bảng điều khiển quản trị</h1>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Admin</span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">Tổng quan dữ liệu đang lấy trực tiếp từ backend</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {error}
        </div>
      )}

      {!dashboard && loading && (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          Đang tải dữ liệu quản trị...
        </div>
      )}

      {dashboard && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Khách hàng" value={String(totals?.customers ?? 0)} sub={`${totals?.pets ?? 0} thú cưng`} icon={Users} tone="bg-indigo-50 text-indigo-600" />
            <StatCard label="Lịch hẹn" value={String(totals?.appointments ?? 0)} sub={`${totals?.scheduledAppointments ?? 0} đang chờ`} icon={Calendar} tone="bg-cyan-50 text-cyan-600" />
            <StatCard label="Dịch vụ" value={String(totals?.activeServices ?? 0)} sub={`${totals?.services ?? 0} dịch vụ tổng`} icon={Scissors} tone="bg-emerald-50 text-emerald-600" />
            <StatCard label="Doanh thu" value={formatMoney(totals?.revenue ?? 0)} sub="Theo hóa đơn đã ghi nhận" icon={BarChart3} tone="bg-violet-50 text-violet-600" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">Doanh thu theo tháng</h2>
                <button onClick={() => onNav?.("reports")} className="text-xs font-semibold text-primary hover:underline">Xem báo cáo</button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(value) => formatMoney(Number(value))} />
                    <Tooltip formatter={(value: number) => [`${formatMoney(value)}đ`, "Doanh thu"]} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#0891B2" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-bold text-foreground">Trạng thái lịch hẹn</h2>
              <div className="mt-3 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dashboard.appointmentsByStatus} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={54} outerRadius={82} paddingAngle={2}>
                      {dashboard.appointmentsByStatus.map((item, index) => (
                        <Cell key={item.status} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {dashboard.appointmentsByStatus.map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[index % STATUS_COLORS.length] }} />
                      {item.label}
                    </span>
                    <span className="font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Hoạt động gần đây</h2>
                  <p className="text-xs text-muted-foreground">Các lịch hẹn mới nhất</p>
                </div>
                <button onClick={() => onNav?.("appointments")} className="text-xs font-semibold text-primary hover:underline">Mở lịch hẹn</button>
              </div>
              <div className="divide-y divide-border/60">
                {dashboard.recentActivity.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">Chưa có hoạt động.</div>}
                {dashboard.recentActivity.map((item) => (
                  <div key={item.id} className="flex gap-3 px-5 py-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                      <Calendar size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                        <span className="font-mono text-xs text-muted-foreground">{item.time}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.description || "Chưa có thông tin phân công"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Lưu trú</h2>
                  <p className="text-xs text-muted-foreground">{totals?.occupiedCages ?? 0}/{totals?.cages ?? 0} chuồng đang sử dụng</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{boardingCapacity}%</div>
                  <div className="text-xs text-muted-foreground">công suất</div>
                </div>
              </div>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${boardingCapacity}%` }} />
              </div>
              <div className="grid grid-cols-5 gap-2">
                {dashboard.boardingRooms.map((room) => (
                  <div key={room.id} className={`rounded-lg border p-2 ${room.status === "occupied" ? "border-cyan-200 bg-cyan-50" : "border-dashed border-border bg-muted/30"}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-muted-foreground">{room.number}</span>
                      {room.status === "occupied" ? <Heart size={11} className="text-cyan-600" /> : <BedDouble size={11} className="text-muted-foreground" />}
                    </div>
                    <p className="mt-1 truncate text-[11px] font-bold text-foreground">{room.status === "occupied" ? room.pet : "Trống"}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{room.species || room.owner}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => onNav?.("staff")} className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary hover:underline">
                <Stethoscope size={12} />
                Xem nhân sự phụ trách
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
