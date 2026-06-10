import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, DollarSign, Search } from "lucide-react";
import type { PaymentItem } from "../../features/staff/services/staffAppointments";
import {
  DateFilterBar,
  EmptyState,
  LoadingState,
  Pagination,
  getDefaultDateFilter,
  matchesDateFilter,
  type DateFilterState,
} from "./StaffCommon";

const PAGE_SIZE = 10;

export function PaymentsTab({
  payments,
  loading,
  error,
  onProcess,
}: {
  payments: PaymentItem[];
  loading: boolean;
  error: string | null;
  onProcess: (payment: PaymentItem) => void;
}) {
  const [dateFilter, setDateFilter] = useState<DateFilterState>(getDefaultDateFilter);
  const [search, setSearch] = useState("");
  const [pendingPage, setPendingPage] = useState(1);
  const [paidPage, setPaidPage] = useState(1);

  useEffect(() => { setPendingPage(1); setPaidPage(1); }, [dateFilter, search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      // Pending invoices always show; only apply date filter to paid invoices
      if (p.status !== "pending" && !matchesDateFilter(p.date, dateFilter)) return false;
      if (q && !p.petName.toLowerCase().includes(q) && !p.owner.toLowerCase().includes(q) && !p.service.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [payments, dateFilter, search]);

  const pending = filtered.filter((p) => p.status === "pending");
  const paid = filtered.filter((p) => p.status === "paid");
  const totalPending = pending.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = paid.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng hóa đơn", value: filtered.length.toString(), sub: "Đã lọc", color: "#0891B2" },
          { label: "Chờ thanh toán", value: pending.length.toString(), sub: `${(totalPending / 1000).toFixed(0)}K VND`, color: "#D97706" },
          { label: "Đã thanh toán", value: paid.length.toString(), sub: `${(totalPaid / 1000).toFixed(0)}K VND`, color: "#059669" },
          { label: "Tổng doanh thu", value: `${((totalPaid + totalPending) / 1000000).toFixed(1)}M`, sub: "VND", color: "#7C3AED" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-semibold text-slate-700 mt-1">{s.label}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        <div className="relative flex-shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm thú cưng, chủ nhân..."
            className="h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all w-52"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <LoadingState label="Đang tải hóa đơn..." />
        </div>
      ) : error ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <EmptyState icon={DollarSign} label={error} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <EmptyState icon={DollarSign} label="Không có hóa đơn nào trong khoảng thời gian này" />
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <PaymentList
              title="Chờ thanh toán"
              payments={pending}
              page={pendingPage}
              onPageChange={setPendingPage}
              onProcess={onProcess}
            />
          )}
          <PaymentList
            title="Đã thanh toán"
            payments={paid}
            page={paidPage}
            onPageChange={setPaidPage}
          />
        </>
      )}
    </div>
  );
}

function PaymentList({
  title,
  payments,
  page,
  onPageChange,
  onProcess,
}: {
  title: string;
  payments: PaymentItem[];
  page: number;
  onPageChange: (page: number) => void;
  onProcess?: (payment: PaymentItem) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(payments.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageData = payments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (payments.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {pageData.map((p) => (
          <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${p.status === "paid" ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}>
              {p.status === "paid" ? <CheckCircle2 size={18} className="text-emerald-600" /> : <DollarSign size={18} className="text-amber-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900">{p.petName} · {p.service}</div>
              <div className="text-xs text-slate-500 mt-0.5">{p.owner} · {p.date} · Mã: {p.id}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-slate-900">{(p.amount / 1000).toFixed(0)}K</div>
              <div className="text-xs text-slate-500">VND</div>
            </div>
            {p.status === "pending" && onProcess ? (
              <button
                onClick={() => onProcess(p)}
                className="h-9 px-4 rounded-lg text-sm font-bold text-white transition-colors"
                style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}
              >
                Thanh toán
              </button>
            ) : (
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                Đã thanh toán
              </span>
            )}
          </div>
        ))}
      </div>
      <Pagination page={safePage} pageCount={pageCount} total={payments.length} pageSize={PAGE_SIZE} onChange={onPageChange} />
    </div>
  );
}
