import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, Check, ChevronDown, FlaskConical,
  ImagePlus, Loader2, Play, RefreshCw, X,
} from "lucide-react";
import { getAuthHeaders } from "../../utils/authSession";
import { apiUrl } from "../../utils/apiUrl";

type RoomType = "XRAY" | "LAB" | "SURGERY" | "ENDOSCOPY" | "ULTRASOUND" | "DENTAL" | "OTHER_SPECIALIST";

const ROOM_OPTIONS: { value: RoomType; label: string }[] = [
  { value: "XRAY",             label: "X-quang" },
  { value: "LAB",              label: "Xét nghiệm" },
  { value: "ULTRASOUND",       label: "Siêu âm" },
  { value: "ENDOSCOPY",        label: "Nội soi" },
  { value: "SURGERY",          label: "Phẫu thuật" },
  { value: "DENTAL",           label: "Nha khoa" },
  { value: "OTHER_SPECIALIST", label: "Chuyên khoa khác" },
];

interface QueueItem {
  id: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  unit_price: number;
  note: string | null;
  ordered_at: string;
  services: { id: number; name: string; specialist_room_type: RoomType };
  appointments: {
    id: number;
    pets: {
      name: string;
      species: { name: string } | null;
      breed: { name: string } | null;
      customers: { full_name: string; phone: string } | null;
    };
  };
  ordered_by: { doctor: { full_name: string } | null } | null;
  service_order_results: {
    result_text: string | null;
    image_urls: string[];
    performed_at: string;
  } | null;
}

const STATUS_CFG = {
  PENDING:     { label: "Đang chờ",       cls: "bg-slate-100 text-slate-600",    dot: "bg-slate-400" },
  IN_PROGRESS: { label: "Đang thực hiện", cls: "bg-amber-50 text-amber-700",     dot: "bg-amber-400" },
  COMPLETED:   { label: "Có kết quả",    cls: "bg-emerald-50 text-emerald-700",  dot: "bg-emerald-500" },
} as const;

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(url), {
    ...options,
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...options?.headers },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? "Lỗi hệ thống");
  return data as T;
}

function fmtPrice(n: number) { return n.toLocaleString("vi-VN") + "đ"; }
function fmtTime(iso: string) { return new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }); }

export function StaffSpecialistQueueTab() {
  const [roomType, setRoomType] = useState<RoomType>("XRAY");
  const [queue, setQueue]       = useState<QueueItem[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [actingId, setActingId] = useState<number | null>(null);
  const [resultModal, setResultModal] = useState<QueueItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ ok: boolean; queue: QueueItem[] }>(
        `/api/staff/specialist-queue?roomType=${roomType}`,
      );
      setQueue(data.queue ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách");
    } finally {
      setLoading(false);
    }
  }, [roomType]);

  useEffect(() => { void load(); }, [load]);

  async function handleStart(item: QueueItem) {
    setActingId(item.id);
    try {
      await apiFetch(`/api/staff/service-orders/${item.id}/start`, { method: "PATCH" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể bắt đầu");
    } finally {
      setActingId(null);
    }
  }

  const pendingCount  = queue.filter(q => q.status === "PENDING").length;
  const inProgCount   = queue.filter(q => q.status === "IN_PROGRESS").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <FlaskConical size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 pointer-events-none" />
          <select
            value={roomType}
            onChange={e => setRoomType(e.target.value as RoomType)}
            className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-8 text-sm font-bold text-slate-700 focus:outline-none focus:border-cyan-400"
          >
            {ROOM_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          {!loading && (
            <>
              <span className="font-semibold text-amber-600">{pendingCount} chờ</span>
              <span>·</span>
              <span className="font-semibold text-cyan-600">{inProgCount} đang thực hiện</span>
            </>
          )}
        </div>

        <button
          onClick={() => void load()}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          <AlertTriangle size={15} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Queue list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : queue.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <FlaskConical size={22} className="text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">Không có chỉ định nào đang chờ</p>
            <p className="mt-1 text-xs text-slate-400">
              Phòng {ROOM_OPTIONS.find(o => o.value === roomType)?.label} hiện không có bệnh nhân
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {queue.map(item => {
            const sCfg = STATUS_CFG[item.status];
            const doctorName = item.ordered_by?.doctor?.full_name ?? "Không rõ";
            const petSpecies = item.appointments.pets.species?.name ?? "";
            const petBreed = item.appointments.pets.breed?.name ?? null;
            const customer = item.appointments.pets.customers;
            return (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Status bar */}
                <div className={`flex items-center gap-2 px-4 py-2 border-b border-slate-100 ${item.status === "IN_PROGRESS" ? "bg-amber-50" : item.status === "COMPLETED" ? "bg-emerald-50" : "bg-slate-50"}`}>
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${sCfg.dot}`} />
                  <span className={`text-[11px] font-bold ${sCfg.cls.split(" ")[1]}`}>{sCfg.label}</span>
                  <span className="ml-auto text-[11px] text-slate-400">{fmtTime(item.ordered_at)}</span>
                </div>

                <div className="px-4 py-3.5 flex items-start gap-4">
                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-slate-900">
                          {item.appointments.pets.name}
                          <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                            {petSpecies}{petBreed ? ` · ${petBreed}` : ""}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-500">
                          Chủ: {customer?.full_name ?? "—"} · {customer?.phone ?? "—"}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-slate-400">
                          BS chỉ định: {doctorName}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-slate-800">{item.services.name}</span>
                      <span className="text-[11px] text-slate-500">{fmtPrice(item.unit_price)}</span>
                      {item.note && (
                        <span className="text-[11px] text-slate-400 italic bg-slate-50 border border-slate-100 rounded-md px-2 py-0.5">
                          {item.note}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {item.status === "PENDING" && (
                      <button
                        onClick={() => void handleStart(item)}
                        disabled={actingId === item.id}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors disabled:opacity-40"
                      >
                        {actingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                        Bắt đầu
                      </button>
                    )}
                    {item.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => setResultModal(item)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700 transition-colors"
                      >
                        <Check size={12} />
                        Nhập kết quả
                      </button>
                    )}
                    {item.status === "COMPLETED" && item.service_order_results && (
                      <button
                        onClick={() => setResultModal(item)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
                      >
                        Xem kết quả
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Result modal */}
      {resultModal && (
        <ResultModal
          item={resultModal}
          onClose={() => setResultModal(null)}
          onSubmitted={() => { setResultModal(null); void load(); }}
        />
      )}
    </div>
  );
}

/* ── Result Modal ─────────────────────────────────────────────────────── */

function ResultModal({
  item,
  onClose,
  onSubmitted,
}: {
  item: QueueItem;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const isReadOnly = item.status === "COMPLETED";
  const existing   = item.service_order_results;

  const [resultText, setResultText] = useState(existing?.result_text ?? "");
  const [notes, setNotes]           = useState("");
  const [imageUrls, setImageUrls]   = useState<string[]>(existing?.image_urls ?? []);
  const [urlInput, setUrlInput]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (!resultText.trim() && imageUrls.length === 0) {
      setError("Cần nhập kết quả hoặc thêm ảnh");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiFetch(`/api/staff/service-orders/${item.id}/result`, {
        method: "POST",
        body: JSON.stringify({ resultText: resultText.trim() || null, imageUrls, notes: notes.trim() || null }),
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu kết quả");
    } finally {
      setSubmitting(false);
    }
  }

  function addUrl() {
    const u = urlInput.trim();
    if (!u) return;
    setImageUrls(prev => [...prev, u]);
    setUrlInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={onClose}>
      <div className="w-full max-w-[500px] rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isReadOnly ? "Kết quả" : "Nhập kết quả"}
            </p>
            <h3 className="text-[15px] font-bold text-slate-900 mt-0.5">{item.services.name}</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {item.appointments.pets.name} · BS: {item.ordered_by?.doctor?.full_name ?? "—"}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3.5">
          {/* Result text */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Mô tả kết quả</label>
            <textarea
              value={resultText}
              onChange={e => setResultText(e.target.value)}
              readOnly={isReadOnly}
              rows={4}
              placeholder="Nhập nhận xét, chỉ số, kết luận..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 resize-none read-only:bg-slate-50 read-only:text-slate-600"
            />
          </div>

          {/* Images */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Hình ảnh ({imageUrls.length})
            </label>
            {!isReadOnly && (
              <div className="flex gap-2 mb-2">
                <input
                  ref={inputRef}
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addUrl()}
                  placeholder="Dán URL hình ảnh rồi nhấn Enter..."
                  className="flex-1 h-8 rounded-lg border border-slate-200 bg-white px-3 text-[12.5px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                />
                <button onClick={addUrl} className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                  <ImagePlus size={14} className="text-slate-500" />
                </button>
              </div>
            )}
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                    {!isReadOnly && (
                      <button
                        onClick={() => setImageUrls(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isReadOnly && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Ghi chú thêm</label>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ghi chú bổ sung (tùy chọn)..."
                className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-[12.5px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
              />
            </div>
          )}

          {isReadOnly && existing?.performed_at && (
            <p className="text-[11px] text-slate-400">
              Thực hiện lúc: {new Date(existing.performed_at).toLocaleString("vi-VN")}
            </p>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">
              <AlertTriangle size={13} className="flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isReadOnly && (
          <div className="px-5 py-4 border-t border-slate-100 flex gap-2.5">
            <button onClick={onClose} disabled={submitting} className="flex-1 h-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40">
              Hủy
            </button>
            <button
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="flex-1 h-10 rounded-xl bg-cyan-600 text-sm font-bold text-white hover:bg-cyan-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {submitting ? "Đang lưu..." : "Lưu kết quả"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
