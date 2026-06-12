import { useState } from "react";
import {
  Activity, BedDouble, Calendar, ChevronRight,
  Download, Pill, Receipt, Scissors, Stethoscope, X,
} from "lucide-react";
import { downloadCustomerInvoicePdf } from "../../../services/customer/customerPetsApi";
import type { HistoryRecord } from "../../../types/customer/portal";

/* ── Config ────────────────────────────────────────────────────────── */

const TYPE_CFG = {
  medical:  { label: "Khám bệnh", icon: Stethoscope, bg: "#ECFEFF", color: "#0891B2" },
  grooming: { label: "Grooming",  icon: Scissors,    bg: "#FFFBEB", color: "#D97706" },
  boarding: { label: "Lưu trú",   icon: BedDouble,   bg: "#F5F3FF", color: "#7C3AED" },
};

const STATUS_CFG = {
  completed: { label: "Hoàn thành", bg: "bg-emerald-50", text: "text-emerald-700" },
  pending:   { label: "Chờ TT",     bg: "bg-amber-50",   text: "text-amber-700"   },
  cancelled: { label: "Đã hủy",     bg: "bg-red-50",     text: "text-red-600"     },
};

const SYSTEM_STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  normal:   { label: "Bình thường", dot: "bg-emerald-400", text: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-100" },
  abnormal: { label: "Bất thường",  dot: "bg-red-400",     text: "text-red-700",     bg: "bg-red-50",      border: "border-red-100"     },
};

const VITAL_TONE: Record<string, string> = {
  temp:   "text-orange-600",
  heart:  "text-red-600",
  resp:   "text-blue-600",
  spo2:   "text-cyan-600",
  weight: "text-violet-600",
};

/* ── Sub-components ────────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </h4>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0">
      <span className="flex-shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

/* ── Main modal ────────────────────────────────────────────────────── */

export function HistoryDetailModal({
  record,
  onClose,
}: {
  record: HistoryRecord;
  onClose: () => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const cfg       = TYPE_CFG[record.type];
  const statusCfg = STATUS_CFG[record.status] ?? STATUS_CFG.completed;
  const Icon      = cfg.icon;
  const mr        = record.medicalRecord;

  const handleDownload = async () => {
    if (!record.invoiceId) { setDownloadError("Hóa đơn này chưa có mã."); return; }
    try {
      setIsDownloading(true);
      setDownloadError("");
      await downloadCustomerInvoicePdf(record.invoiceId);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Không thể tải hóa đơn.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        style={{ maxHeight: "94vh" }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-shrink-0 items-center gap-4 border-b border-slate-100 px-6 py-4">
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
            style={{ background: cfg.bg }}
          >
            <Icon size={20} style={{ color: cfg.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-bold text-slate-900">{record.service}</h3>
              <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${statusCfg.bg} ${statusCfg.text}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {record.pet} · {record.staff} · {record.date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* Medical record — full examination data */}
          {record.type === "medical" && mr && (
            <div className="border-b border-slate-100 px-6 py-5 space-y-5">

              {/* Chief complaint + meta */}
              {(mr.chiefComplaint || mr.selectedSymptoms.length > 0 || mr.duration || mr.onset || mr.severity || mr.ownerNotes) && (
                <div>
                  <SectionTitle><Activity size={11} />Lý do & Triệu chứng</SectionTitle>
                  <div className="space-y-3">
                    {mr.chiefComplaint && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Lý do khám</p>
                        <p className="text-sm font-semibold text-slate-800">{mr.chiefComplaint}</p>
                      </div>
                    )}
                    {mr.selectedSymptoms.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Triệu chứng</p>
                        <div className="flex flex-wrap gap-1.5">
                          {mr.selectedSymptoms.map(s => (
                            <span
                              key={s}
                              className="rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-1 text-[12px] font-semibold text-orange-700"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {mr.duration && (
                        <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700">
                          <ChevronRight size={11} className="text-slate-400" />
                          Thời gian: <b>{mr.duration}</b>
                        </span>
                      )}
                      {mr.onset && (
                        <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700">
                          <ChevronRight size={11} className="text-slate-400" />
                          Khởi phát: <b>{mr.onset}</b>
                        </span>
                      )}
                      {mr.severity && (
                        <span className="flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-700">
                          Mức độ: <b>{mr.severity}</b>
                        </span>
                      )}
                    </div>
                    {mr.ownerNotes && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600 mb-1">Ghi chú của chủ</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{mr.ownerNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vitals */}
              {mr.vitals.length > 0 && (
                <div>
                  <SectionTitle><Activity size={11} />Sinh hiệu</SectionTitle>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {mr.vitals.map(v => (
                      <div
                        key={v.key}
                        className="flex flex-col items-center gap-0.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-center"
                      >
                        <span className="text-[11px] font-semibold text-slate-500">{v.label}</span>
                        <span className={`text-xl font-black leading-tight ${VITAL_TONE[v.key] ?? "text-slate-800"}`}>
                          {v.value}
                        </span>
                        <span className="text-[10px] text-slate-400">{v.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Systems */}
              {mr.systems.length > 0 && (
                <div>
                  <SectionTitle><Stethoscope size={11} />Khám lâm sàng theo hệ thống</SectionTitle>
                  <div className="space-y-1.5">
                    {mr.systems.map(sys => {
                      const sc = SYSTEM_STATUS_CFG[sys.status];
                      return (
                        <div
                          key={sys.id}
                          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${sc?.bg ?? "bg-slate-50"} ${sc?.border ?? "border-slate-100"}`}
                        >
                          <div className="flex items-center gap-2 w-[120px] flex-shrink-0">
                            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${sc?.dot ?? "bg-slate-300"}`} />
                            <span className="text-[12px] font-bold text-slate-700">{sys.label}</span>
                          </div>
                          <div className="flex-1">
                            <span className={`text-[11px] font-bold ${sc?.text ?? "text-slate-500"}`}>
                              {sc?.label ?? sys.status}
                            </span>
                            {sys.notes && (
                              <p className="mt-0.5 text-[12px] text-slate-600 leading-snug">{sys.notes}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Diagnosis + next visit */}
              {(mr.diagnosisNote || mr.nextVisitDate) && (
                <div>
                  <SectionTitle><Stethoscope size={11} />Kết luận</SectionTitle>
                  {mr.diagnosisNote && (
                    <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-700 mb-1">Chẩn đoán</p>
                      <p className="text-sm font-semibold text-slate-900 leading-relaxed">{mr.diagnosisNote}</p>
                    </div>
                  )}
                  {mr.nextVisitDate && (
                    <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                      <Calendar size={14} className="flex-shrink-0 text-violet-600" />
                      <span className="text-[12px] font-semibold text-slate-600">Ngày tái khám:</span>
                      <span className="text-sm font-bold text-violet-700">{mr.nextVisitDate}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Prescriptions */}
              {record.prescriptions && record.prescriptions.length > 0 && (
                <div>
                  <SectionTitle>
                    <Pill size={11} />
                    Đơn thuốc
                    <span className="ml-1 rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-700">
                      {record.prescriptions.length}
                    </span>
                  </SectionTitle>
                  <div className="space-y-2">
                    {record.prescriptions.map((rx, i) => (
                      <div
                        key={`${rx.medicineName}-${i}`}
                        className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3"
                      >
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-emerald-200 mt-0.5">
                          <span className="text-[9px] font-bold text-emerald-700">{i + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">{rx.medicineName}</p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                            {rx.dosage       && <span className="text-[11px] text-slate-500">Liều: <b className="text-slate-700">{rx.dosage}</b></span>}
                            {rx.frequency    && <span className="text-[11px] text-slate-500">Tần suất: <b className="text-slate-700">{rx.frequency}</b></span>}
                            {rx.durationDays && <span className="text-[11px] text-slate-500">Thời gian: <b className="text-slate-700">{rx.durationDays} ngày</b></span>}
                          </div>
                          {rx.instructions && (
                            <p className="mt-1 text-[11px] italic text-slate-500">{rx.instructions}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grooming / Boarding notes */}
          {record.type !== "medical" && record.details && (
            <div className="border-b border-slate-100 px-6 py-5">
              <SectionTitle>Ghi chú</SectionTitle>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-700 leading-relaxed">{record.details}</p>
              </div>
            </div>
          )}

          {/* ── Invoice ─────────────────────────────────────────────── */}
          <div className="px-6 py-5 space-y-4">
            <SectionTitle><Receipt size={11} />Hóa đơn</SectionTitle>
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="divide-y divide-slate-100 bg-white">
                {record.items.map((item, idx) => (
                  <div key={item.id ?? idx} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">{item.description}</p>
                      <p className="mt-0.5 text-xs text-slate-400">SL {item.quantity} · {item.unitPrice}</p>
                    </div>
                    <span className="flex-shrink-0 text-sm font-bold text-slate-900">{item.totalPrice}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3.5">
                <span className="text-sm font-bold text-slate-700">Tổng tiền</span>
                <span className="text-lg font-bold text-cyan-600">{record.cost}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3">
                <span className="text-sm text-slate-500">Trạng thái thanh toán</span>
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Đã thanh toán</span>
              </div>
            </div>

            {downloadError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{downloadError}</p>
            )}
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={isDownloading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={15} />
              {isDownloading ? "Đang tải..." : "Tải hóa đơn PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
