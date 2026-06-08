import { useEffect, useMemo, useState } from "react";
import { BedDouble, CheckCircle2, Clock, Eye, Search } from "lucide-react";
import type { BoardingDailyStatus, BoardingGuest } from "../../features/staff/services/staffAppointments";
import {
  DateFilterBar,
  EmptyState,
  LoadingState,
  Pagination,
  getDefaultDateFilter,
  matchesDateFilter,
  parseAnyDateToYmd,
  type DateFilterState,
} from "./StaffCommon";

const PAGE_SIZE = 8;

function guestMatchesDateFilter(guest: BoardingGuest, filter: DateFilterState): boolean {
  const checkInYmd = parseAnyDateToYmd(guest.checkIn);
  const checkOutYmd = parseAnyDateToYmd(guest.checkOut);

  if (!checkInYmd && !checkOutYmd) return matchesDateFilter("", filter);

  // For "today"/"date"/"week" modes, check if the filtered date range overlaps the stay
  const filterStart = filter.mode === "today"
    ? (() => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().split("T")[0]; })()
    : filter.mode === "date"
      ? filter.date
      : filter.weekStart;

  const filterEnd = filter.mode === "today"
    ? filterStart
    : filter.mode === "date"
      ? filter.date
      : (() => { const d = new Date(filter.weekStart + "T00:00:00"); d.setDate(d.getDate() + 6); return d.toISOString().split("T")[0]; })();

  const stayStart = checkInYmd ?? "0000-00-00";
  const stayEnd = checkOutYmd ?? "9999-99-99";

  return stayStart <= filterEnd && stayEnd >= filterStart;
}

export function BoardingTab({
  guests,
  loading,
  error,
  onViewDetails,
  onToggleStatus,
}: {
  guests: BoardingGuest[];
  loading: boolean;
  error: string | null;
  onViewDetails: (guest: BoardingGuest) => void;
  onToggleStatus: (guest: BoardingGuest, field: keyof BoardingDailyStatus) => void;
}) {
  const [dateFilter, setDateFilter] = useState<DateFilterState>(getDefaultDateFilter);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [dateFilter, search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      if (!guestMatchesDateFilter(g, dateFilter)) return false;
      if (q && !g.petName.toLowerCase().includes(q) && !g.owner.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [guests, dateFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const needsBreakfast = filtered.filter((g) => !g.todayStatus.breakfast).length;
  const needsCleaning = filtered.filter((g) => !g.todayStatus.cleaned).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng phòng", value: filtered.length.toString(), sub: "Từ dữ liệu lưu trú", color: "#0891B2" },
          { label: "Đang lưu trú", value: filtered.length.toString(), sub: "Thú cưng hiện tại", color: "#7C3AED" },
          { label: "Cần cho ăn", value: needsBreakfast.toString(), sub: "Chưa ăn sáng", color: "#D97706" },
          { label: "Cần vệ sinh", value: needsCleaning.toString(), sub: "Chưa dọn phòng", color: "#059669" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-semibold text-slate-700 mt-1">{s.label}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-bold text-slate-900">Thú cưng đang lưu trú</h3>
            <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
          </div>
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
          <LoadingState label="Đang tải danh sách lưu trú..." />
        ) : error ? (
          <EmptyState icon={BedDouble} label={error} />
        ) : pageData.length === 0 ? (
          <EmptyState icon={BedDouble} label={filtered.length === 0 ? "Không có thú cưng lưu trú trong khoảng thời gian này" : "Không tìm thấy kết quả"} />
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {pageData.map((guest) => (
                <div key={guest.id} className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                      <BedDouble size={18} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{guest.petName}</span>
                        <span className="text-xs text-slate-500">{guest.species} · {guest.breed}</span>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Phòng {guest.room}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {guest.owner} · Check-in: {guest.checkIn || "--"} · Check-out: {guest.checkOut || "--"} ({guest.nights} đêm)
                      </div>
                      <div className="text-xs text-slate-600 mt-1.5 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                        <strong>Thức ăn:</strong> {guest.foodType} · <strong>Bữa/ngày:</strong> {guest.mealsPerDay}
                        {guest.specialNotes && <div className="mt-1 text-slate-500"><strong>Ghi chú:</strong> {guest.specialNotes}</div>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {[
                          { label: "Bữa sáng", field: "breakfast" as const },
                          { label: "Bữa trưa", field: "lunch" as const },
                          { label: "Bữa tối", field: "dinner" as const },
                          { label: "Vệ sinh", field: "cleaned" as const },
                          { label: "Vận động", field: "exercised" as const },
                          { label: "Kiểm tra SK", field: "healthCheck" as const },
                        ].map((item) => {
                          const done = guest.todayStatus[item.field];
                          return (
                            <button
                              key={item.field}
                              onClick={() => onToggleStatus(guest, item.field)}
                              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              {done ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => onViewDetails(guest)}
                      className="h-9 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Eye size={14} /> Chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
