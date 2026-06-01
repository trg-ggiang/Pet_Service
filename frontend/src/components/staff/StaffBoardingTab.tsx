import { BedDouble, CheckCircle2, Clock, Eye } from "lucide-react";
import type { BoardingDailyStatus, BoardingGuest } from "../../features/staff/services/staffAppointments";
import { EmptyState, LoadingState } from "./StaffCommon";

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
  const needsBreakfast = guests.filter((g) => !g.todayStatus.breakfast).length;
  const needsCleaning = guests.filter((g) => !g.todayStatus.cleaned).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng phòng", value: guests.length.toString(), sub: "Từ dữ liệu lưu trú", color: "#0891B2" },
          { label: "Đang lưu trú", value: guests.length.toString(), sub: "Thú cưng hiện tại", color: "#7C3AED" },
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
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Thú cưng đang lưu trú</h3>
        </div>
        {loading ? (
          <LoadingState label="Đang tải danh sách lưu trú..." />
        ) : error ? (
          <EmptyState icon={BedDouble} label={error} />
        ) : guests.length === 0 ? (
          <EmptyState icon={BedDouble} label="Không có thú cưng đang lưu trú" />
        ) : (
          <div className="divide-y divide-slate-100">
            {guests.map((guest) => (
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
                          <button key={item.field} onClick={() => onToggleStatus(guest, item.field)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}>
                            {done ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button onClick={() => onViewDetails(guest)} className="h-9 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 flex-shrink-0">
                    <Eye size={14} /> Chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
