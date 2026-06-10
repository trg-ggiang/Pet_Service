import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BedDouble,
  Calendar,
  Check,
  ChevronDown,
  Crown,
  Dog,
  Info,
  Loader2,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import type { BoardingRoom } from "../../../services/customer/customerBoardingApi";
import { bookBoardingRoom, fetchBoardingRooms } from "../../../services/customer/customerBoardingApi";
import type { Pet } from "../../../types/customer/portal";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getLocalDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateVN(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function computeNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  return Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
}

// ─── Size config ────────────────────────────────────────────────────────────

const SIZE_CONFIG: Record<string, { icon: typeof BedDouble; color: string; bg: string; border: string; label: string }> = {
  SMALL:  { icon: Minimize2, color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", label: "Nhỏ" },
  MEDIUM: { icon: BedDouble, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", label: "Vừa" },
  LARGE:  { icon: Maximize2, color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", label: "Lớn" },
  VIP:    { icon: Crown,     color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "VIP" },
};
const SIZE_ORDER = ["SMALL", "MEDIUM", "LARGE", "VIP"];

// ─── Room Card ────────────────────────────────────────────────────────────────

function RoomCard({ room, selected, onClick }: { room: BoardingRoom; selected: boolean; onClick: () => void }) {
  const cfg = SIZE_CONFIG[room.sizeType] ?? SIZE_CONFIG.MEDIUM;
  const Icon = cfg.icon;

  if (!room.isAvailable) {
    return (
      <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-slate-100 bg-slate-50 opacity-55 select-none cursor-not-allowed">
        <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center">
          <BedDouble size={15} className="text-slate-400" />
        </div>
        <span className="text-[10px] font-bold text-slate-400">{room.cageNumber}</span>
        <span className="text-[9px] font-semibold text-slate-400 bg-slate-200 px-1 py-0.5 rounded">Đã đặt</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={selected ? { borderColor: cfg.color, background: cfg.bg } : {}}
      className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all cursor-pointer select-none ${
        selected ? "shadow-md" : "border-transparent bg-white hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      {selected && (
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: cfg.color }}>
          <Check size={9} className="text-white" />
        </div>
      )}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: selected ? cfg.bg : "#F8FAFC", border: `1.5px solid ${selected ? cfg.border : "#E2E8F0"}` }}>
        <Icon size={15} style={{ color: cfg.color }} />
      </div>
      <span className="text-[10px] font-bold text-slate-800">{room.cageNumber}</span>
      <span className="text-[9px] font-medium text-slate-500">{(room.pricePerDay / 1000).toFixed(0)}k/đêm</span>
    </button>
  );
}

// ─── Room grid panel (embeds into Step 1) ─────────────────────────────────────

function RoomGrid({
  rooms,
  loading,
  error,
  selectedRoomId,
  onSelect,
}: {
  rooms: BoardingRoom[];
  loading: boolean;
  error: string;
  selectedRoomId: number | null;
  onSelect: (id: number) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-xs font-medium">Đang tải phòng trống...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-4 text-center text-xs font-medium text-red-500 bg-red-50 rounded-xl border border-red-100 px-4">{error}</div>
    );
  }
  if (rooms.length === 0) {
    return (
      <div className="py-6 text-center text-slate-400">
        <BedDouble size={28} className="mx-auto mb-1.5 opacity-30" />
        <p className="text-xs font-medium">Không có dữ liệu phòng</p>
      </div>
    );
  }

  const grouped: Record<string, BoardingRoom[]> = {};
  for (const r of rooms) {
    if (!grouped[r.sizeType]) grouped[r.sizeType] = [];
    grouped[r.sizeType].push(r);
  }
  const available = rooms.filter((r) => r.isAvailable).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-[11px] font-semibold">
        <span className="flex items-center gap-1 text-emerald-600">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300 inline-block" /> Trống ({available})
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-200 inline-block" /> Đã đặt ({rooms.length - available})
        </span>
        {selectedRoomId && (
          <span className="ml-auto flex items-center gap-1 text-blue-600">
            <Check size={11} /> {rooms.find((r) => r.id === selectedRoomId)?.cageNumber}
          </span>
        )}
      </div>

      {SIZE_ORDER.map((size) => {
        const list = grouped[size];
        if (!list?.length) return null;
        const cfg = SIZE_CONFIG[size];
        const SizeIcon = cfg.icon;
        return (
          <div key={size}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: cfg.bg }}>
                <SizeIcon size={10} style={{ color: cfg.color }} />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Phòng {cfg.label}
                <span className="ml-1 normal-case font-medium text-slate-400">
                  ({(list[0]?.pricePerDay / 1000).toFixed(0)}k/đêm)
                </span>
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {list.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  selected={room.id === selectedRoomId}
                  onClick={() => room.isAvailable && onSelect(room.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function BoardingBookingModal({
  pets,
  onClose,
  onSuccess,
}: {
  pets: Pet[];
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const today = getLocalDate();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 state
  const [petId, setPetId] = useState(pets.length === 1 ? String(pets[0].id) : "");
  const [checkIn, setCheckIn] = useState(getLocalDate(1));
  const [checkOut, setCheckOut] = useState(getLocalDate(3));
  const [rooms, setRooms] = useState<BoardingRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  // Step 2 state
  const [feedingInstruction, setFeedingInstruction] = useState("");
  const [habitNote, setHabitNote] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const loadRoomsRef = useRef(0);

  const datesValid = !!(checkIn && checkOut && checkIn < checkOut);

  // Auto-load rooms whenever dates change and are valid
  useEffect(() => {
    if (!datesValid) { setRooms([]); setSelectedRoomId(null); return; }
    const seq = ++loadRoomsRef.current;
    setRoomsLoading(true);
    setRoomsError("");
    setSelectedRoomId(null);
    fetchBoardingRooms(checkIn, checkOut)
      .then((data) => { if (seq === loadRoomsRef.current) { setRooms(data); setRoomsLoading(false); } })
      .catch((err: unknown) => {
        if (seq === loadRoomsRef.current) {
          setRoomsError(err instanceof Error ? err.message : "Không thể tải danh sách phòng");
          setRoomsLoading(false);
        }
      });
  }, [checkIn, checkOut, datesValid]);

  const nights = computeNights(checkIn, checkOut);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const canProceed = !!(petId && datesValid && nights >= 1 && selectedRoomId);

  async function handleSubmit() {
    if (!petId || !selectedRoomId || !checkIn || !checkOut) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await bookBoardingRoom({ petId: Number(petId), cageId: selectedRoomId, checkIn, checkOut, feedingInstruction, habitNote, specialNote });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Đặt phòng thất bại");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EFF6FF" }}>
              <BedDouble size={16} style={{ color: "#2563EB" }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Đặt phòng lưu trú</h3>
              <p className="text-[11px] text-slate-400 font-medium">{step === 1 ? "Chọn ngày, thú cưng & phòng" : "Thông tin thêm & xác nhận"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={17} />
          </button>
        </div>

        {/* Step dots */}
        <div className="px-6 pt-3 flex items-center gap-2 flex-shrink-0">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${s < step ? "bg-blue-500 text-white" : s === step ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                {s < step ? <Check size={10} /> : s}
              </div>
              <span className={`text-[11px] font-semibold ${s === step ? "text-blue-700" : "text-slate-400"}`}>
                {s === 1 ? "Chọn phòng" : "Xác nhận"}
              </span>
              {s < 2 && <div className={`flex-1 h-px ${s < step ? "bg-blue-300" : "bg-slate-100"}`} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 1 && (
            <div className="space-y-4">
              {/* No pets warning */}
              {pets.length === 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-xs font-medium text-amber-700">
                  <Dog size={14} /> Bạn chưa có thú cưng. Vui lòng thêm thú cưng trước.
                </div>
              )}

              {/* Pet selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Thú cưng</label>
                <div className="relative">
                  <select
                    value={petId}
                    onChange={(e) => setPetId(e.target.value)}
                    className="w-full h-10 px-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all"
                  >
                    <option value="">-- Chọn thú cưng --</option>
                    {pets.map((p) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      if (checkOut && e.target.value >= checkOut) setCheckOut("");
                    }}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn ? new Date(new Date(checkIn).getTime() + 86400000).toISOString().slice(0, 10) : today}
                    onChange={(e) => setCheckOut(e.target.value)}
                    disabled={!checkIn}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Date summary strip */}
              {nights > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Calendar size={13} className="text-blue-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-blue-800">
                    {formatDateVN(checkIn)} → {formatDateVN(checkOut)} · <strong>{nights} đêm</strong>
                  </span>
                </div>
              )}

              {/* Room grid — auto-loads when dates valid */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                  {datesValid ? "Chọn phòng" : "Chọn ngày để xem phòng trống"}
                </label>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                  {!datesValid ? (
                    <div className="py-5 text-center text-xs text-slate-400 font-medium">
                      <BedDouble size={24} className="mx-auto mb-1.5 opacity-25" />
                      Nhập ngày check-in và check-out để xem phòng trống
                    </div>
                  ) : (
                    <RoomGrid
                      rooms={rooms}
                      loading={roomsLoading}
                      error={roomsError}
                      selectedRoomId={selectedRoomId}
                      onSelect={setSelectedRoomId}
                    />
                  )}
                </div>
              </div>

              {/* Selected room detail */}
              {selectedRoom && (
                <div className="rounded-xl border px-3.5 py-2.5 text-sm" style={{ borderColor: SIZE_CONFIG[selectedRoom.sizeType]?.border || "#BFDBFE", background: SIZE_CONFIG[selectedRoom.sizeType]?.bg || "#EFF6FF" }}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm" style={{ color: SIZE_CONFIG[selectedRoom.sizeType]?.color || "#2563EB" }}>
                      Phòng {selectedRoom.cageNumber} · {selectedRoom.sizeLabel}
                    </span>
                    <span className="text-xs font-bold" style={{ color: SIZE_CONFIG[selectedRoom.sizeType]?.color || "#2563EB" }}>
                      {selectedRoom.pricePerDay.toLocaleString("vi-VN")} ₫/đêm
                    </span>
                  </div>
                  {selectedRoom.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{selectedRoom.description}</p>
                  )}
                  <p className="text-[11px] font-semibold mt-1" style={{ color: SIZE_CONFIG[selectedRoom.sizeType]?.color || "#2563EB" }}>
                    Tổng ước tính phòng: {(nights * selectedRoom.pricePerDay).toLocaleString("vi-VN")} ₫
                  </p>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!canProceed}
                className="w-full h-11 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: canProceed ? "#2563EB" : "#94A3B8" }}
              >
                {!petId ? "Chọn thú cưng để tiếp tục" : !datesValid ? "Chọn ngày hợp lệ" : !selectedRoomId ? "Chọn phòng để tiếp tục" : "Tiếp tục →"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {/* Summary box */}
              {selectedRoom && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-800">Phòng {selectedRoom.cageNumber} · {selectedRoom.sizeLabel}</span>
                    <span className="font-bold text-blue-600">{selectedRoom.pricePerDay.toLocaleString("vi-VN")} ₫/đêm</span>
                  </div>
                  <div className="text-[11px] text-blue-600 mt-0.5">
                    {formatDateVN(checkIn)} → {formatDateVN(checkOut)} · {nights} đêm
                  </div>
                  <div className="text-[11px] font-bold text-blue-700 mt-1">
                    Phí phòng ước tính: {(nights * selectedRoom.pricePerDay).toLocaleString("vi-VN")} ₫
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Hướng dẫn cho ăn <span className="normal-case text-slate-400 font-normal">(không bắt buộc)</span>
                </label>
                <textarea
                  value={feedingInstruction}
                  onChange={(e) => setFeedingInstruction(e.target.value)}
                  placeholder="Ví dụ: Hạt khô 2 lần/ngày, sáng 7h chiều 17h..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Thói quen / tính cách <span className="normal-case text-slate-400 font-normal">(không bắt buộc)</span>
                </label>
                <textarea
                  value={habitNote}
                  onChange={(e) => setHabitNote(e.target.value)}
                  placeholder="Ví dụ: Hay sợ tiếng ồn, thích được chải lông..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Ghi chú đặc biệt <span className="normal-case text-slate-400 font-normal">(không bắt buộc)</span>
                </label>
                <textarea
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  placeholder="Ví dụ: Dị ứng với X, đang uống thuốc Y..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-2 text-[11px] text-slate-500">
                <Info size={13} className="flex-shrink-0 text-slate-400 mt-0.5" />
                <span>Phòng chờ được nhân viên xác nhận. Phí cuối cùng bao gồm thêm phí thức ăn & dịch vụ tính khi checkout.</span>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl px-4 py-3">
                  {submitError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="h-11 px-5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ArrowLeft size={14} /> Quay lại
                </button>
                <button
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className="flex-1 h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors"
                  style={{ background: "#2563EB" }}
                >
                  {submitting
                    ? <><Loader2 size={14} className="animate-spin" /> Đang đặt...</>
                    : <><Check size={14} /> Xác nhận đặt phòng</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
