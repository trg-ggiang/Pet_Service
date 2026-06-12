import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BedDouble,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Crown,
  Eye,
  Loader2,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import { staffAppointmentsService } from "../../features/staff/services/staffAppointments";
import type {
  BoardingDailyStatus,
  BoardingGuest,
  PendingBoarding,
  StaffBoardingRoom,
} from "../../features/staff/services/staffAppointments";
import { EmptyState, LoadingState, Pagination, parseAnyDateToYmd, todayYmd } from "./StaffCommon";

/** Tính số đêm thực tế từ ngày check-in đến hôm nay */
function computeActualNights(checkInStr: string): number {
  const checkInYmd = parseAnyDateToYmd(checkInStr);
  if (!checkInYmd) return 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIn = new Date(checkInYmd + "T00:00:00");
  return Math.max(1, Math.ceil((today.getTime() - checkIn.getTime()) / 86400000));
}

/** Số ngày quá hạn so với lịch check-out (0 = đúng hạn hoặc chưa đến hạn) */
function overdueDays(scheduledCheckOut: string): number {
  const ymd = parseAnyDateToYmd(scheduledCheckOut);
  if (!ymd) return 0;
  const today = todayYmd();
  if (today <= ymd) return 0;
  return Math.ceil((new Date(today + "T00:00:00").getTime() - new Date(ymd + "T00:00:00").getTime()) / 86400000);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

const SIZE_CFG: Record<string, { icon: typeof BedDouble; color: string; bg: string; border: string; label: string }> = {
  SMALL:  { icon: Minimize2, color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", label: "Nhỏ" },
  MEDIUM: { icon: BedDouble, color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", label: "Vừa" },
  LARGE:  { icon: Maximize2, color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", label: "Lớn" },
  VIP:    { icon: Crown,     color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "VIP" },
};

const BOARDING_STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  BOOKED:      { label: "Đã đặt",     color: "#D97706", bg: "#FFFBEB" },
  CHECKED_IN:  { label: "Đã check-in",color: "#059669", bg: "#ECFDF5" },
  STAYING:     { label: "Đang ở",     color: "#7C3AED", bg: "#F5F3FF" },
  CHECKED_OUT: { label: "Đã checkout",color: "#475569", bg: "#F1F5F9" },
  CANCELLED:   { label: "Đã hủy",     color: "#DC2626", bg: "#FEF2F2" },
};

const SIZE_ORDER = ["SMALL", "MEDIUM", "LARGE", "VIP"];

// ─── Booking card (shared for pending & confirmed lists) ──────────────────────

function BookingCard({
  booking,
  actionLabel,
  actionColor,
  onAction,
  secondaryLabel,
  secondaryColor,
  onSecondary,
  busy,
}: {
  booking: PendingBoarding;
  actionLabel: string;
  actionColor: string;
  onAction: (id: number) => void;
  secondaryLabel?: string;
  secondaryColor?: string;
  onSecondary?: (id: number) => void;
  busy: boolean;
}) {
  const cfg = SIZE_CFG[booking.sizeType] ?? SIZE_CFG.MEDIUM;
  const Icon = cfg.icon;
  return (
    <div className="px-6 py-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
          <Icon size={17} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900">{booking.petName}</span>
            <span className="text-xs text-slate-500">{booking.species}{booking.breed ? ` · ${booking.breed}` : ""}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ color: cfg.color, background: cfg.bg }}>
              Phòng {booking.room} · {booking.sizeLabel}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{booking.owner}{booking.phone ? ` · ${booking.phone}` : ""}</div>
          <div className="text-xs text-slate-600 mt-1 flex items-center gap-3 flex-wrap">
            <span>📅 {booking.checkIn} → {booking.checkOut}</span>
            <span className="font-semibold text-slate-700">({booking.nights} đêm)</span>
            <span className="text-violet-600 font-semibold">{(booking.pricePerDay * booking.nights).toLocaleString("vi-VN")} ₫</span>
          </div>
          {booking.feedingInstruction && (
            <div className="text-xs text-slate-500 mt-1 bg-slate-50 px-2 py-1 rounded-lg">🍽 {booking.feedingInstruction}</div>
          )}
          {booking.specialNote && (
            <div className="text-xs text-amber-700 mt-1 bg-amber-50 px-2 py-1 rounded-lg">⚠ {booking.specialNote}</div>
          )}
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => onAction(booking.id)}
            disabled={busy}
            className="h-8 px-3 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
            style={{ background: actionColor }}
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {actionLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button
              onClick={() => onSecondary(booking.id)}
              disabled={busy}
              className="h-8 px-3 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
              style={{ background: secondaryColor || "#475569" }}
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Checkout Modal ────────────────────────────────────────────────────────────

function CheckoutModal({
  guest, pricePerDay, onClose, onConfirm,
}: {
  guest: BoardingGuest;
  pricePerDay: number;
  onClose: () => void;
  onConfirm: (foodFeePerDay: number, extraServiceFee: number, paymentMethod: string) => Promise<void>;
}) {
  const [foodFeePerDay, setFoodFeePerDay] = useState(0);
  const [extraServiceFee, setExtraServiceFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const overdue = overdueDays(guest.checkOut);
  const todayDisplay = new Date().toLocaleDateString("vi-VN");
  const roomFee = guest.nights * pricePerDay;
  const foodFeeTotal = foodFeePerDay * guest.nights;
  const total = roomFee + foodFeeTotal + extraServiceFee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Checkout · Phòng {guest.room}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{guest.petName} · {guest.owner}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {overdue > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle size={16} className="flex-shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Quá hạn check-out {overdue} ngày</p>
                <p className="text-xs text-amber-600 mt-0.5">Liên hệ chủ nuôi để thông báo và thu thêm phí phát sinh</p>
              </div>
            </div>
          )}
          <div className={`rounded-xl px-4 py-3 text-sm space-y-1.5 ${overdue > 0 ? "bg-amber-50 border border-amber-100" : "bg-slate-50"}`}>
            <div className="flex justify-between text-slate-600">
              <span>Check-in</span><span className="font-semibold text-slate-800">{guest.checkIn}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Lịch check-out</span>
              <span className={`font-semibold ${overdue > 0 ? "text-amber-600" : "text-slate-800"}`}>{guest.checkOut}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span className="font-semibold text-slate-700">Check-out thực tế</span>
              <span className="font-bold text-slate-900">{todayDisplay}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Số đêm tính tiền</span><span className="font-bold text-violet-700">{guest.nights} đêm</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Phí thức ăn / ngày (₫)</label>
            <input type="number" min={0} step={1000} value={foodFeePerDay || ""} onChange={(e) => setFoodFeePerDay(Math.max(0, Number(e.target.value)))} placeholder="0" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Phí dịch vụ thêm (₫)</label>
            <input type="number" min={0} step={1000} value={extraServiceFee || ""} onChange={(e) => setExtraServiceFee(Math.max(0, Number(e.target.value)))} placeholder="0" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Hình thức thanh toán</label>
            <div className="relative">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full h-11 px-4 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all">
                <option value="CASH">Tiền mặt</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
                <option value="VNPAY">VNPay</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
            {[
              { label: `Phí phòng (${guest.nights} đêm × ${pricePerDay.toLocaleString("vi-VN")} ₫)`, value: roomFee },
              ...(foodFeeTotal > 0 ? [{ label: `Phí thức ăn (${guest.nights} đêm × ${foodFeePerDay.toLocaleString("vi-VN")} ₫)`, value: foodFeeTotal }] : []),
              ...(extraServiceFee > 0 ? [{ label: "Phí dịch vụ thêm", value: extraServiceFee }] : []),
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center px-4 py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-semibold text-slate-800">{item.value.toLocaleString("vi-VN")} ₫</span>
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 font-bold">
              <span className="text-slate-800">Tổng cộng</span>
              <span className="text-violet-700 text-base">{total.toLocaleString("vi-VN")} ₫</span>
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3">{error}</div>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} disabled={submitting} className="h-11 px-5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0">Hủy</button>
            <button
              onClick={async () => { setSubmitting(true); setError(""); try { await onConfirm(foodFeePerDay, extraServiceFee, paymentMethod); } catch (err: unknown) { setError(err instanceof Error ? err.message : "Checkout thất bại"); setSubmitting(false); } }}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              style={{ background: "#7C3AED" }}
            >
              {submitting ? <><Loader2 size={15} className="animate-spin" /> Đang xử lý...</> : <><Check size={15} /> Xác nhận checkout</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Room Modal ────────────────────────────────────────────────────────

function CreateRoomModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [cageNumber, setCageNumber] = useState("");
  const [sizeType, setSizeType] = useState("MEDIUM");
  const [pricePerDay, setPricePerDay] = useState(150000);
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!cageNumber.trim()) { setError("Vui lòng nhập số phòng"); return; }
    setSubmitting(true); setError("");
    try {
      await staffAppointmentsService.createBoardingRoom({ cageNumber: cageNumber.trim(), sizeType, pricePerDay, description, note });
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Tạo phòng thất bại");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tạo phòng mới</h3>
            <p className="text-xs text-slate-500 mt-0.5">Thêm phòng lưu trú vào hệ thống</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Số phòng *</label>
              <input value={cageNumber} onChange={(e) => setCageNumber(e.target.value)} placeholder="VD: P01, B-05..." className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Kích cỡ</label>
              <div className="relative">
                <select value={sizeType} onChange={(e) => setSizeType(e.target.value)} className="w-full h-11 px-4 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all">
                  <option value="SMALL">Nhỏ</option>
                  <option value="MEDIUM">Vừa</option>
                  <option value="LARGE">Lớn</option>
                  <option value="VIP">VIP</option>
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Giá / đêm (₫)</label>
            <input type="number" min={0} step={10000} value={pricePerDay} onChange={(e) => setPricePerDay(Math.max(0, Number(e.target.value)))} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Mô tả phòng</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tiện nghi, diện tích, đặc điểm..." rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Ghi chú nội bộ</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú cho nhân viên..." className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl px-4 py-3">{error}</div>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} disabled={submitting} className="h-11 px-5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Hủy</button>
            <button onClick={() => void handleSubmit()} disabled={submitting} className="flex-1 h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-60" style={{ background: "#7C3AED" }}>
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Đang tạo...</> : <><Plus size={14} /> Tạo phòng</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Room Detail Modal (click vào phòng) ──────────────────────────────────────

function RoomDetailModal({
  room,
  guest,
  onClose,
  onToggleStatus,
  onCheckIn,
  onCheckout,
  onStatusChange,
  onDelete,
}: {
  room: StaffBoardingRoom;
  guest: BoardingGuest | undefined;
  onClose: () => void;
  onToggleStatus: (guest: BoardingGuest, field: keyof BoardingDailyStatus) => void;
  onCheckIn: (boardingId: number) => void;
  onCheckout: (room: StaffBoardingRoom) => void;
  onStatusChange: (cageId: number, status: string) => void;
  onDelete: (room: StaffBoardingRoom) => void;
}) {
  const cfg = SIZE_CFG[room.sizeType] ?? SIZE_CFG.MEDIUM;
  const Icon = cfg.icon;
  const boarding = room.currentBoarding;
  const boardingStatus = boarding?.boardingStatus || "";
  const statusCfg = BOARDING_STATUS_CFG[boardingStatus] || { label: "", color: "#64748B", bg: "#F1F5F9" };
  const [changingStatus, setChangingStatus] = useState(false);

  const ROOM_STATUSES = ["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"];
  const ROOM_STATUS_LABELS: Record<string, string> = {
    AVAILABLE: "Trống", OCCUPIED: "Đang dùng", CLEANING: "Đang dọn", MAINTENANCE: "Bảo trì",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
              <Icon size={18} style={{ color: cfg.color }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Phòng {room.cageNumber} · {cfg.label}</h3>
              <p className="text-xs text-slate-500 font-medium">{room.pricePerDay.toLocaleString("vi-VN")} ₫/đêm</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Room info */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-2 text-sm">
            {room.description && <p className="text-slate-600">{room.description}</p>}
            {room.note && <p className="text-xs text-slate-400 italic">{room.note}</p>}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Trạng thái phòng</span>
              {changingStatus ? (
                <div className="relative">
                  <select
                    defaultValue={room.status}
                    onChange={(e) => { onStatusChange(room.id, e.target.value); setChangingStatus(false); }}
                    onBlur={() => setChangingStatus(false)}
                    autoFocus
                    className="h-8 pr-7 pl-3 bg-white border border-slate-300 rounded-lg text-xs font-semibold appearance-none focus:outline-none"
                  >
                    {ROOM_STATUSES.map((s) => <option key={s} value={s}>{ROOM_STATUS_LABELS[s]}</option>)}
                  </select>
                  <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              ) : (
                <button onClick={() => setChangingStatus(true)} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors" style={{ color: "#64748B" }}>
                  <span style={{ color: boarding ? "#7C3AED" : room.status === "CLEANING" ? "#D97706" : room.status === "MAINTENANCE" ? "#DC2626" : "#059669" }}>
                    {boarding ? boardingStatus === "BOOKED" ? "Đã đặt" : boardingStatus === "CHECKED_IN" ? "Đã check-in" : "Đang lưu trú" : ROOM_STATUS_LABELS[room.status] || room.status}
                  </span>
                  <Pencil size={10} className="text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Active boarding */}
          {!boarding && (
            <button
              onClick={() => onDelete(room)}
              className="w-full h-9 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <X size={14} /> Xóa phòng này
            </button>
          )}

          {boarding ? (
            <div className="space-y-4">
              <div className="border rounded-xl p-4" style={{ borderColor: cfg.border, background: cfg.bg + "55" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{boarding.petName}</span>
                      <span className="text-xs text-slate-500">{boarding.species}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ color: statusCfg.color, background: statusCfg.bg }}>{statusCfg.label}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{boarding.owner}{boarding.phone ? ` · ${boarding.phone}` : ""}</div>
                    <div className="text-xs text-slate-600 mt-1">📅 Check-in: <strong>{boarding.checkIn}</strong> · Check-out: <strong>{boarding.checkOut}</strong></div>
                  </div>
                </div>
              </div>

              {/* Daily status (only if we have the full guest record) */}
              {guest && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Chăm sóc hôm nay</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { label: "Bữa sáng",  field: "breakfast"   as const },
                      { label: "Bữa trưa",  field: "lunch"       as const },
                      { label: "Bữa tối",   field: "dinner"      as const },
                      { label: "Vệ sinh",   field: "cleaned"     as const },
                      { label: "Vận động",  field: "exercised"   as const },
                      { label: "Kiểm tra SK",field: "healthCheck" as const },
                    ] as { label: string; field: keyof BoardingDailyStatus }[]).map((item) => {
                      const done = guest.todayStatus[item.field];
                      return (
                        <button
                          key={item.field}
                          onClick={() => onToggleStatus(guest, item.field)}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                        >
                          {done ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {boardingStatus === "BOOKED" && (
                  <button
                    onClick={() => { onCheckIn(boarding.boardingId); onClose(); }}
                    className="flex-1 h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors"
                    style={{ background: "#7C3AED" }}
                  >
                    <Check size={14} /> Check-in ngay
                  </button>
                )}
                {(boardingStatus === "CHECKED_IN" || boardingStatus === "STAYING") && (
                  <button
                    onClick={() => { onCheckout(room); onClose(); }}
                    className="flex-1 h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors"
                    style={{ background: "#DC2626" }}
                  >
                    Checkout
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <BedDouble size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Phòng đang trống</p>
              <p className="text-xs mt-1">Chưa có thú cưng nào đang lưu trú</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pending Boarding Tab (Chờ duyệt + Đã xác nhận) ─────────────────────────

function PendingBoardingTab({
  pendingBookings,
  confirmedBookings,
  loading,
  error,
  busyId,
  onApprove,
  onCheckIn,
}: {
  pendingBookings: PendingBoarding[];
  confirmedBookings: PendingBoarding[];
  loading: boolean;
  error: string | null;
  busyId: number | null;
  onApprove: (id: number) => void;
  onCheckIn: (id: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [pendingPage, setPendingPage] = useState(1);
  const [confirmedPage, setConfirmedPage] = useState(1);

  useEffect(() => { setPendingPage(1); setConfirmedPage(1); }, [search]);

  function filterList(list: PendingBoarding[]) {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) =>
      b.petName.toLowerCase().includes(q) || b.owner.toLowerCase().includes(q) || b.room.toLowerCase().includes(q),
    );
  }

  const filteredPending   = filterList(pendingBookings);
  const filteredConfirmed = filterList(confirmedBookings);

  const pendingPages   = Math.max(1, Math.ceil(filteredPending.length / PAGE_SIZE));
  const confirmedPages = Math.max(1, Math.ceil(filteredConfirmed.length / PAGE_SIZE));

  const pendingData   = filteredPending.slice((Math.min(pendingPage,   pendingPages)   - 1) * PAGE_SIZE, Math.min(pendingPage,   pendingPages)   * PAGE_SIZE);
  const confirmedData = filteredConfirmed.slice((Math.min(confirmedPage, confirmedPages) - 1) * PAGE_SIZE, Math.min(confirmedPage, confirmedPages) * PAGE_SIZE);

  if (loading) return <LoadingState label="Đang tải..." />;
  if (error)   return <EmptyState icon={BedDouble} label={error} />;

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm thú cưng, chủ nhân..." className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500" />
        </div>
      </div>

      {/* Section 1: Chờ duyệt */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <h3 className="text-sm font-bold text-slate-900">Chờ duyệt ({filteredPending.length})</h3>
          <span className="text-xs text-slate-400">— Xem xét và phê duyệt đặt phòng</span>
        </div>
        {pendingData.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">Không có lịch đặt phòng nào đang chờ duyệt</div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {pendingData.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  actionLabel="Duyệt"
                  actionColor="#059669"
                  onAction={onApprove}
                  busy={busyId === b.id}
                />
              ))}
            </div>
            <Pagination page={Math.min(pendingPage, pendingPages)} pageCount={pendingPages} total={filteredPending.length} pageSize={PAGE_SIZE} onChange={setPendingPage} />
          </>
        )}
      </div>

      {/* Section 2: Đã xác nhận — chờ check-in */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500" />
          <h3 className="text-sm font-bold text-slate-900">Đã xác nhận · Chờ check-in ({filteredConfirmed.length})</h3>
          <span className="text-xs text-slate-400">— Check-in khi khách hàng đến</span>
        </div>
        {confirmedData.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">Không có lịch đặt phòng nào đang chờ check-in</div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {confirmedData.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  actionLabel="Check-in"
                  actionColor="#7C3AED"
                  onAction={onCheckIn}
                  busy={busyId === b.id}
                />
              ))}
            </div>
            <Pagination page={Math.min(confirmedPage, confirmedPages)} pageCount={confirmedPages} total={filteredConfirmed.length} pageSize={PAGE_SIZE} onChange={setConfirmedPage} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Room Map Tab ─────────────────────────────────────────────────────────────

function RoomMapTab({
  rooms,
  loading,
  error,
  guestsMap,
  onCheckIn,
  onCheckout,
  onRoomClick,
  onCreateRoom,
}: {
  rooms: StaffBoardingRoom[];
  loading: boolean;
  error: string | null;
  guestsMap: Map<string, BoardingGuest>;
  onCheckIn: (id: number) => void;
  onCheckout: (room: StaffBoardingRoom) => void;
  onRoomClick: (room: StaffBoardingRoom) => void;
  onCreateRoom: () => void;
}) {
  if (loading) return <LoadingState label="Đang tải sơ đồ phòng..." />;
  if (error)   return <EmptyState icon={BedDouble} label={error} />;

  const groupedBySize: Record<string, StaffBoardingRoom[]> = {};
  for (const room of rooms) {
    if (!groupedBySize[room.sizeType]) groupedBySize[room.sizeType] = [];
    groupedBySize[room.sizeType].push(room);
  }

  const available = rooms.filter((r) => !r.currentBoarding && r.status === "AVAILABLE").length;
  const occupied  = rooms.filter((r) => !!r.currentBoarding).length;
  const cleaning  = rooms.filter((r) => r.status === "CLEANING").length;

  return (
    <div className="space-y-5">
      {/* Stats + create button */}
      <div className="flex items-center gap-3">
        <div className="grid grid-cols-3 gap-3 flex-1">
          {[
            { label: "Còn trống", value: available, color: "#059669", bg: "#ECFDF5" },
            { label: "Đang có thú", value: occupied, color: "#7C3AED", bg: "#F5F3FF" },
            { label: "Đang dọn",   value: cleaning, color: "#D97706", bg: "#FFFBEB" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <button
          onClick={onCreateRoom}
          className="flex items-center gap-2 h-12 px-4 rounded-xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-95 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7C3AED,#8B5CF6)" }}
        >
          <Plus size={16} /> Thêm phòng
        </button>
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <BedDouble size={40} className="mx-auto mb-3 opacity-25" />
          <p className="text-sm font-semibold">Chưa có phòng nào trong hệ thống</p>
          <p className="text-xs mt-1">Nhấn "Thêm phòng" để tạo phòng đầu tiên</p>
        </div>
      )}

      {/* Room grid by size */}
      <div className="space-y-5">
        {SIZE_ORDER.map((size) => {
          const sizeRooms = groupedBySize[size];
          if (!sizeRooms?.length) return null;
          const cfg = SIZE_CFG[size] ?? SIZE_CFG.MEDIUM;
          const Icon = cfg.icon;

          return (
            <div key={size}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: cfg.bg }}>
                  <Icon size={13} style={{ color: cfg.color }} />
                </div>
                <span className="text-sm font-bold text-slate-700">
                  Phòng {cfg.label}
                  <span className="ml-2 text-xs font-medium text-slate-400">
                    {sizeRooms[0]?.pricePerDay.toLocaleString("vi-VN")} ₫/đêm
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {sizeRooms.map((room) => {
                  const boarding = room.currentBoarding;
                  const boardingStatus = boarding?.boardingStatus || "";
                  const statusCfg = BOARDING_STATUS_CFG[boardingStatus] || { label: "", color: "#64748B", bg: "#F1F5F9" };

                  if (room.status === "MAINTENANCE") {
                    return (
                      <button key={room.id} onClick={() => onRoomClick(room)} className="bg-slate-100 border border-slate-200 rounded-2xl p-3 opacity-60 text-left hover:opacity-80 transition-opacity">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-500">{room.cageNumber}</span>
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-md">Bảo trì</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{room.note || "Đang bảo trì"}</div>
                      </button>
                    );
                  }

                  if (room.status === "CLEANING") {
                    return (
                      <button key={room.id} onClick={() => onRoomClick(room)} className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-left hover:bg-amber-100/60 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-amber-800">{room.cageNumber}</span>
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md">Đang dọn</span>
                        </div>
                        <div className="text-[11px] text-amber-600">Đang vệ sinh phòng</div>
                        {room.description && <div className="text-[10px] text-amber-500 mt-1 truncate">{room.description}</div>}
                      </button>
                    );
                  }

                  if (!boarding) {
                    return (
                      <button key={room.id} onClick={() => onRoomClick(room)} className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-left hover:bg-emerald-100/60 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-emerald-800">{room.cageNumber}</span>
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md">Trống</span>
                        </div>
                        <div className="text-[11px] text-emerald-600">Sẵn sàng</div>
                        {room.description && <div className="text-[10px] text-emerald-500 mt-1 truncate">{room.description}</div>}
                      </button>
                    );
                  }

                  const isOverdue = overdueDays(boarding.checkOut) > 0;
                  const daysOver = overdueDays(boarding.checkOut);
                  return (
                    <button key={room.id} onClick={() => onRoomClick(room)}
                      className={`border-2 rounded-2xl p-3 shadow-sm text-left hover:shadow-md transition-shadow ${isOverdue ? "bg-amber-50" : "bg-white"}`}
                      style={{ borderColor: isOverdue ? "#F59E0B" : cfg.border }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold" style={{ color: cfg.color }}>{room.cageNumber}</span>
                        {isOverdue ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 flex items-center gap-0.5">
                            <AlertTriangle size={9} /> +{daysOver}n
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ color: statusCfg.color, background: statusCfg.bg }}>
                            {statusCfg.label}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate">{boarding.petName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{boarding.species}</div>
                      <div className="text-[11px] text-slate-500 truncate">{boarding.owner}</div>
                      <div className={`text-[11px] mt-1 ${isOverdue ? "text-amber-600 font-bold" : "text-slate-500"}`}>→ {boarding.checkOut}</div>
                      {room.description && <div className="text-[10px] text-slate-400 mt-1 truncate italic">{room.description}</div>}

                      <div className="flex gap-1.5 mt-2.5" onClick={(e) => e.stopPropagation()}>
                        {boardingStatus === "BOOKED" && (
                          <button onClick={() => onCheckIn(boarding.boardingId)} className="flex-1 h-7 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1 transition-colors" style={{ background: "#7C3AED" }}>
                            Check-in
                          </button>
                        )}
                        {(boardingStatus === "CHECKED_IN" || boardingStatus === "STAYING") && (
                          <button onClick={() => onCheckout(room)} className="flex-1 h-7 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1 transition-colors" style={{ background: "#DC2626" }}>
                            Checkout
                          </button>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Staying Tab ──────────────────────────────────────────────────────────────

function StayingTab({
  guests, loading, error, roomsMap,
  onViewDetails, onToggleStatus, onCheckout,
}: {
  guests: BoardingGuest[];
  loading: boolean;
  error: string | null;
  roomsMap: Map<string, StaffBoardingRoom>;
  onViewDetails: (guest: BoardingGuest) => void;
  onToggleStatus: (guest: BoardingGuest, field: keyof BoardingDailyStatus) => void;
  onCheckout: (guest: BoardingGuest) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter((g) =>
      g.petName.toLowerCase().includes(q) || g.owner.toLowerCase().includes(q) || g.room.toLowerCase().includes(q),
    );
  }, [guests, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage  = Math.min(page, pageCount);
  const pageData  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const needsBreakfast = guests.filter((g) => !g.todayStatus.breakfast).length;
  const needsCleaning  = guests.filter((g) => !g.todayStatus.cleaned).length;
  const totalNights    = guests.reduce((sum, g) => sum + (g.nights || 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Đang lưu trú",   value: guests.length,  sub: "Thú cưng hiện tại",  color: "#7C3AED" },
          { label: "Tổng đêm",       value: totalNights,    sub: "Đêm lưu trú hôm nay", color: "#0891B2" },
          { label: "Cần ăn sáng",     value: needsBreakfast, sub: "Chưa ăn sáng",        color: "#D97706" },
          { label: "Cần vệ sinh",    value: needsCleaning,  sub: "Chưa dọn phòng",      color: "#059669" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-semibold text-slate-700 mt-1">{s.label}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Thú cưng đang lưu trú</h3>
          <div className="relative flex-shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm thú cưng, chủ nhân..." className="h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 w-52" />
          </div>
        </div>
        {loading ? <LoadingState label="Đang tải..." /> : error ? <EmptyState icon={BedDouble} label={error} /> : pageData.length === 0 ? (
          <EmptyState icon={BedDouble} label={filtered.length === 0 ? "Không có thú cưng đang lưu trú" : "Không tìm thấy kết quả"} />
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {pageData.map((guest) => {
                const room = roomsMap.get(guest.room);
                return (
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
                        <div className="text-xs text-slate-500 mt-1">{guest.owner} · Check-in: {guest.checkIn || "--"} · Check-out: {guest.checkOut || "--"} ({guest.nights} đêm)</div>
                        {room && <div className="text-xs text-slate-500 mt-0.5">Phí phòng: <span className="font-semibold text-violet-600">{room.pricePerDay.toLocaleString("vi-VN")} ₫/đêm</span></div>}
                        <div className="text-xs text-slate-600 mt-1.5 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                          <strong>Thức ăn:</strong> {guest.foodType} · <strong>Bữa/ngày:</strong> {guest.mealsPerDay}
                          {guest.specialNotes && <div className="mt-1 text-slate-500"><strong>Ghi chú:</strong> {guest.specialNotes}</div>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          {([
                            { label: "Bữa sáng",   field: "breakfast"    as const },
                            { label: "Bữa trưa",   field: "lunch"        as const },
                            { label: "Bữa tối",    field: "dinner"       as const },
                            { label: "Vệ sinh",    field: "cleaned"      as const },
                            { label: "Vận động",   field: "exercised"    as const },
                            { label: "Kiểm tra SK",field: "healthCheck"  as const },
                          ] as { label: string; field: keyof BoardingDailyStatus }[]).map((item) => {
                            const done = guest.todayStatus[item.field];
                            return (
                              <button key={item.field} onClick={() => onToggleStatus(guest, item.field)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                                {done ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button onClick={() => onViewDetails(guest)} className="h-9 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                          <Eye size={14} /> Cập nhật nhật ký
                        </button>
                        <button onClick={() => onCheckout(guest)} className="h-9 px-4 rounded-lg text-sm font-bold text-white flex items-center gap-1.5 transition-colors" style={{ background: "#DC2626" }}>
                          Checkout
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type BoardingSubTab = "pending" | "staying" | "rooms";

export function BoardingTab({
  guests,
  loading,
  error,
  onViewDetails,
  onToggleStatus,
  onRefresh,
}: {
  guests: BoardingGuest[];
  loading: boolean;
  error: string | null;
  onViewDetails: (guest: BoardingGuest) => void;
  onToggleStatus: (guest: BoardingGuest, field: keyof BoardingDailyStatus) => void;
  onRefresh?: () => void;
}) {
  const [subTab, setSubTab] = useState<BoardingSubTab>("pending");
  const [pendingBookings,   setPendingBookings]   = useState<PendingBoarding[]>([]);
  const [confirmedBookings, setConfirmedBookings] = useState<PendingBoarding[]>([]);
  const [pendingLoading,    setPendingLoading]    = useState(false);
  const [pendingError,      setPendingError]      = useState<string | null>(null);
  const [rooms,             setRooms]             = useState<StaffBoardingRoom[]>([]);
  const [roomsLoading,      setRoomsLoading]      = useState(false);
  const [roomsError,        setRoomsError]        = useState<string | null>(null);
  const [busyId,            setBusyId]            = useState<number | null>(null);
  const [checkoutTarget,    setCheckoutTarget]    = useState<{ guest: BoardingGuest; pricePerDay: number } | null>(null);
  const [showCreateRoom,    setShowCreateRoom]    = useState(false);
  const [detailRoom,        setDetailRoom]        = useState<StaffBoardingRoom | null>(null);

  const roomsMap = useMemo(() => {
    const map = new Map<string, StaffBoardingRoom>();
    for (const r of rooms) map.set(r.cageNumber, r);
    return map;
  }, [rooms]);

  // Build a map from cage number → BoardingGuest for room detail modal
  const guestsMap = useMemo(() => {
    const map = new Map<string, BoardingGuest>();
    for (const g of guests) map.set(g.room, g);
    return map;
  }, [guests]);

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    setPendingError(null);
    try {
      const [pending, confirmed] = await Promise.all([
        staffAppointmentsService.fetchPendingBoardings(),
        staffAppointmentsService.fetchConfirmedBoardings(),
      ]);
      setPendingBookings(pending);
      setConfirmedBookings(confirmed);
    } catch (err: unknown) {
      setPendingError(err instanceof Error ? err.message : "Không thể tải danh sách");
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const loadRooms = useCallback(async () => {
    setRoomsLoading(true);
    setRoomsError(null);
    try {
      setRooms(await staffAppointmentsService.fetchBoardingRooms());
    } catch (err: unknown) {
      setRoomsError(err instanceof Error ? err.message : "Không thể tải sơ đồ phòng");
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (subTab === "pending") void loadPending();
    if (subTab === "rooms")   void loadRooms();
  }, [subTab, loadPending, loadRooms]);

  async function handleApprove(boardingId: number) {
    setBusyId(boardingId);
    try {
      await staffAppointmentsService.approveBoardingBooking(boardingId);
      await loadPending();
      onRefresh?.();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Duyệt thất bại");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCheckIn(boardingId: number) {
    setBusyId(boardingId);
    try {
      await staffAppointmentsService.checkInBoarding(boardingId);
      await loadPending();
      onRefresh?.();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Check-in thất bại");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCheckInFromRooms(boardingId: number) {
    setBusyId(boardingId);
    try {
      await staffAppointmentsService.checkInBoarding(boardingId);
      await loadRooms();
      onRefresh?.();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Check-in thất bại");
    } finally {
      setBusyId(null);
    }
  }

  function openCheckoutFromGuest(guest: BoardingGuest) {
    const room = roomsMap.get(guest.room);
    const actualNights = computeActualNights(guest.checkIn);
    setCheckoutTarget({ guest: { ...guest, nights: actualNights }, pricePerDay: room?.pricePerDay || 150000 });
  }

  function openCheckoutFromRoom(room: StaffBoardingRoom) {
    if (!room.currentBoarding) return;
    const actualNights = computeActualNights(room.currentBoarding.checkIn);
    const realGuest = guestsMap.get(room.cageNumber);
    if (realGuest) {
      // Use real guest data (food info, notes etc.) but override nights with actual stay
      setCheckoutTarget({ guest: { ...realGuest, nights: actualNights }, pricePerDay: room.pricePerDay });
      return;
    }
    // Fallback from room metadata only
    const fallbackGuest: BoardingGuest = {
      id: room.currentBoarding.boardingId,
      room: room.cageNumber,
      petName: room.currentBoarding.petName,
      species: room.currentBoarding.species,
      breed: "",
      owner: room.currentBoarding.owner,
      phone: room.currentBoarding.phone,
      checkIn: room.currentBoarding.checkIn,
      checkOut: room.currentBoarding.checkOut,
      nights: actualNights,
      foodType: "",
      mealsPerDay: 2,
      specialNotes: "",
      todayStatus: { breakfast: false, lunch: false, dinner: false, cleaned: false, exercised: false, healthCheck: false },
    };
    setCheckoutTarget({ guest: fallbackGuest, pricePerDay: room.pricePerDay });
  }

  async function handleCheckout(foodFeePerDay: number, extraServiceFee: number, paymentMethod: string) {
    if (!checkoutTarget) return;
    await staffAppointmentsService.checkOutBoarding(checkoutTarget.guest.id, { foodFeePerDay, extraServiceFee, paymentMethod });
    setCheckoutTarget(null);
    onRefresh?.();
    if (subTab === "rooms") await loadRooms();
  }

  async function handleRoomStatusChange(cageId: number, status: string) {
    try {
      await staffAppointmentsService.updateBoardingRoom(cageId, { status });
      await loadRooms();
      setDetailRoom(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Cập nhật thất bại");
    }
  }

  async function handleDeleteRoom(room: StaffBoardingRoom) {
    if (!confirm(`Xóa phòng ${room.cageNumber}? Hành động này không thể hoàn tác.`)) return;
    try {
      await staffAppointmentsService.deleteBoardingRoom(room.id);
      setDetailRoom(null);
      await loadRooms();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Xóa phòng thất bại");
    }
  }

  const totalPendingBadge = pendingBookings.length; // only count bookings needing staff action

  const SUB_TABS: { id: BoardingSubTab; label: string; badge?: number }[] = [
    { id: "pending",  label: "Đặt phòng",     badge: totalPendingBadge || undefined },
    { id: "staying",  label: "Đang lưu trú",  badge: guests.length     || undefined },
    { id: "rooms",    label: "Sơ đồ phòng" },
  ];

  return (
    <div className="space-y-5">
      {/* Sub-tab navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex gap-1">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 h-9 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${subTab === t.id ? "bg-violet-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"}`}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${subTab === t.id ? "bg-white/25 text-white" : "bg-violet-100 text-violet-700"}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {subTab === "pending" && (
        <PendingBoardingTab
          pendingBookings={pendingBookings}
          confirmedBookings={confirmedBookings}
          loading={pendingLoading}
          error={pendingError}
          busyId={busyId}
          onApprove={handleApprove}
          onCheckIn={handleCheckIn}
        />
      )}
      {subTab === "staying" && (
        <StayingTab
          guests={guests}
          loading={loading}
          error={error}
          roomsMap={roomsMap}
          onViewDetails={onViewDetails}
          onToggleStatus={onToggleStatus}
          onCheckout={openCheckoutFromGuest}
        />
      )}
      {subTab === "rooms" && (
        <RoomMapTab
          rooms={rooms}
          loading={roomsLoading}
          error={roomsError}
          guestsMap={guestsMap}
          onCheckIn={handleCheckInFromRooms}
          onCheckout={openCheckoutFromRoom}
          onRoomClick={setDetailRoom}
          onCreateRoom={() => setShowCreateRoom(true)}
        />
      )}

      {checkoutTarget && (
        <CheckoutModal
          guest={checkoutTarget.guest}
          pricePerDay={checkoutTarget.pricePerDay}
          onClose={() => setCheckoutTarget(null)}
          onConfirm={handleCheckout}
        />
      )}

      {showCreateRoom && (
        <CreateRoomModal
          onClose={() => setShowCreateRoom(false)}
          onCreated={() => { setShowCreateRoom(false); void loadRooms(); }}
        />
      )}

      {detailRoom && (
        <RoomDetailModal
          room={detailRoom}
          guest={guestsMap.get(detailRoom.cageNumber)}
          onClose={() => setDetailRoom(null)}
          onToggleStatus={(guest, field) => { onToggleStatus(guest, field); }}
          onCheckIn={(id) => { setDetailRoom(null); void handleCheckInFromRooms(id); }}
          onCheckout={(room) => { setDetailRoom(null); openCheckoutFromRoom(room); }}
          onStatusChange={handleRoomStatusChange}
          onDelete={(room) => void handleDeleteRoom(room)}
        />
      )}
    </div>
  );
}
