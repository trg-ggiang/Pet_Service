import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, ChevronDown, FlaskConical, Loader2, Plus, Trash2, X } from "lucide-react";
import {
  doctorAppointmentsService,
  SPECIALIST_ROOM_LABELS,
  type ServiceOrder,
  type SpecialistService,
} from "../../features/doctor/services/doctorAppointments";

const STATUS_CONFIG = {
  PENDING:     { label: "Đang chờ",    cls: "bg-slate-100 text-slate-600" },
  IN_PROGRESS: { label: "Đang thực hiện", cls: "bg-amber-50 text-amber-700" },
  COMPLETED:   { label: "Có kết quả", cls: "bg-emerald-50 text-emerald-700" },
  CANCELLED:   { label: "Đã hủy",     cls: "bg-red-50 text-red-500" },
} as const;

function fmtPrice(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export function ServiceOrderPanel({ appointmentId }: { appointmentId: number }) {
  const [services, setServices]     = useState<SpecialistService[]>([]);
  const [orders, setOrders]         = useState<ServiceOrder[]>([]);
  const [loading, setLoading]       = useState(true);
  const [adding, setAdding]         = useState(false);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [note, setNote]             = useState("");
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewResult, setViewResult] = useState<ServiceOrder | null>(null);
  const [error, setError]           = useState("");

  const reload = useCallback(async () => {
    try {
      const [svcs, ords] = await Promise.all([
        doctorAppointmentsService.listSpecialistServices(),
        doctorAppointmentsService.listServiceOrders(appointmentId),
      ]);
      setServices(svcs);
      setOrders(ords);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => { void reload(); }, [reload]);

  async function handleAdd() {
    if (!selectedId || saving) return;
    setSaving(true);
    setError("");
    try {
      await doctorAppointmentsService.createServiceOrder(appointmentId, Number(selectedId), note.trim() || undefined);
      setSelectedId("");
      setNote("");
      setAdding(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể chỉ định dịch vụ");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(orderId: number) {
    if (deletingId) return;
    setDeletingId(orderId);
    try {
      await doctorAppointmentsService.cancelServiceOrder(orderId);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể hủy chỉ định");
    } finally {
      setDeletingId(null);
    }
  }

  const pendingCount  = orders.filter(o => o.status === "PENDING").length;
  const doneCount     = orders.filter(o => o.status === "COMPLETED").length;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Chỉ định dịch vụ bổ sung</h3>
          {orders.length > 0 && (
            <p className="text-[11.5px] text-muted-foreground mt-0.5">
              {orders.length} chỉ định · {doneCount} có kết quả · {pendingCount} đang chờ
            </p>
          )}
        </div>
        <button
          onClick={() => { setAdding(a => !a); setError(""); }}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700 transition-colors"
        >
          {adding ? <X size={13} /> : <Plus size={13} />}
          {adding ? "Hủy" : "Thêm chỉ định"}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-3.5 flex flex-col gap-3">
          <div className="relative">
            <FlaskConical size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 pointer-events-none" />
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full h-9 appearance-none rounded-lg border border-border bg-white pl-8 pr-7 text-[13px] font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
            >
              <option value="">Chọn dịch vụ chuyên khoa...</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  [{SPECIALIST_ROOM_LABELS[s.specialist_room_type]}] {s.name} — {fmtPrice(s.price)}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ghi chú cho phòng thực hiện (tùy chọn)..."
            className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[12.5px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
          />
          <button
            onClick={() => void handleAdd()}
            disabled={!selectedId || saving}
            className="h-9 w-full rounded-lg bg-cyan-600 text-white text-[13px] font-bold disabled:opacity-40 hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? "Đang lưu..." : "Xác nhận chỉ định"}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">
          <AlertTriangle size={13} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Order list */}
      {loading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 py-7 text-center">
          <FlaskConical size={22} className="mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-[12.5px] text-muted-foreground">Chưa có chỉ định dịch vụ bổ sung</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map(order => {
            const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
            const hasResult = !!order.service_order_results;
            return (
              <div key={order.id} className="rounded-xl border border-border bg-white px-3.5 py-2.5 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-bold text-foreground truncate">{order.services.name}</span>
                    <span className="text-[10px] font-semibold rounded-md px-1.5 py-0.5 bg-slate-100 text-slate-500">
                      {SPECIALIST_ROOM_LABELS[order.services.specialist_room_type]}
                    </span>
                    <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 ${statusCfg.cls}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[11.5px] text-muted-foreground">{fmtPrice(order.unit_price)}</span>
                    {order.note && (
                      <span className="text-[11px] text-slate-400 italic truncate">· {order.note}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {hasResult && (
                    <button
                      onClick={() => setViewResult(viewResult?.id === order.id ? null : order)}
                      className="h-7 px-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      Xem KQ
                    </button>
                  )}
                  {order.status === "PENDING" && (
                    <button
                      onClick={() => void handleCancel(order.id)}
                      disabled={deletingId === order.id}
                      className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      {deletingId === order.id
                        ? <Loader2 size={13} className="animate-spin text-red-400" />
                        : <Trash2 size={13} className="text-muted-foreground hover:text-red-500" />
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Result viewer */}
      {viewResult?.service_order_results && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-emerald-700">
              Kết quả: {viewResult.services.name}
            </span>
            <button onClick={() => setViewResult(null)} className="text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          </div>
          {viewResult.service_order_results.result_text && (
            <p className="text-[12.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">
              {viewResult.service_order_results.result_text}
            </p>
          )}
          {viewResult.service_order_results.notes && (
            <p className="mt-1.5 text-[11.5px] text-slate-500 italic">
              {viewResult.service_order_results.notes}
            </p>
          )}
          {viewResult.service_order_results.image_urls.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {viewResult.service_order_results.image_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Kết quả ${i + 1}`} className="h-20 w-20 rounded-lg object-cover border border-emerald-200 hover:opacity-80 transition-opacity" />
                </a>
              ))}
            </div>
          )}
          <p className="mt-2 text-[10.5px] text-slate-400">
            Thực hiện lúc: {new Date(viewResult.service_order_results.performed_at).toLocaleString("vi-VN")}
          </p>
        </div>
      )}
    </div>
  );
}
