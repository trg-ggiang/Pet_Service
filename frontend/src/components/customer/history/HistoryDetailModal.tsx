import { useState } from "react";
import { Calendar, Download, Scissors, Star, Stethoscope, Syringe, X } from "lucide-react";
import { downloadCustomerInvoicePdf } from "../../../services/customer/customerPetsApi";
import type { HistoryRecord } from "../../../types/customer/portal";

// ─────────────────────────────────────────────────────────────────────────────
// History Detail Modal
// ─────────────────────────────────────────────────────────────────────────────

export function HistoryDetailModal({ record, onClose }: { record: HistoryRecord; onClose: () => void }) {
  const typeIcons: Record<HistoryRecord["type"], React.ElementType> = {
    medical: Stethoscope,
    vaccine: Syringe,
    grooming: Star,
    boarding: Calendar,
  };
  const typeColors: Record<HistoryRecord["type"], { bg: string; color: string }> = {
    medical: { bg: "#ECFEFF", color: "#0891B2" },
    vaccine: { bg: "#ECFDF5", color: "#059669" },
    grooming: { bg: "#FFFBEB", color: "#D97706" },
    boarding: { bg: "#F5F3FF", color: "#7C3AED" },
  };
  const Icon = typeIcons[record.type];
  const clr = typeColors[record.type];
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadError("");
      if (!record.invoiceId) {
        throw new Error("Hóa đơn này chưa có mã từ hệ thống.");
      }
      await downloadCustomerInvoicePdf(record.invoiceId);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Không thể tải hóa đơn PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: clr.bg }}>
              <Icon size={24} style={{ color: clr.color }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{record.service}</h3>
              {record.services.length > 1 && (
                <p className="text-xs font-semibold text-slate-400 mt-0.5">{record.services.join(" • ")}</p>
              )}
              <p className="text-sm text-slate-500 mt-0.5">Mã: {record.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Thông tin dịch vụ</h4>
                <div className="space-y-3">
                  {[
                    { label: "Thú cưng", value: record.pet },
                    { label: "Người phụ trách", value: record.staff },
                    { label: "Ngày thực hiện", value: record.date },
                    { label: "Loại dịch vụ", value: record.type === "medical" ? "Khám bệnh" : record.type === "vaccine" ? "Tiêm phòng" : record.type === "grooming" ? "Grooming" : "Lưu trú" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm font-medium text-slate-500">{item.label}</span>
                      <span className="text-sm font-bold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Chi tiết</h4>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="space-y-3">
                    {record.items.map((item) => (
                      <div key={`${item.id}-${item.description}`} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-bold text-slate-900">{item.description}</div>
                            <div className="text-xs font-semibold text-slate-400 mt-1">
                              SL {item.quantity} • Đơn giá {item.unitPrice}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-cyan-600 whitespace-nowrap">{item.totalPrice}</div>
                        </div>
                      </div>
                    ))}
                    {record.details && (
                      <p className="text-sm text-slate-700 leading-relaxed">{record.details}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Hóa đơn</h4>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <div className="space-y-3 mb-3">
                    {record.items.map((item) => (
                      <div key={`${item.id}-${item.description}-invoice`} className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-700">{item.description}</div>
                          <div className="text-xs font-semibold text-slate-400 mt-0.5">SL {item.quantity} • {item.unitPrice}</div>
                        </div>
                        <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{item.totalPrice}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <span className="text-sm font-bold text-slate-700">Tổng tiền</span>
                    <span className="text-lg font-bold text-cyan-600">{record.cost}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Trạng thái thanh toán</span>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">Đã thanh toán</span>
                    </div>
                  </div>
                </div>
              </div>

              {downloadError && (
                <p className="text-sm font-medium text-red-600">{downloadError}</p>
              )}
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={isDownloading}
                className="w-full h-11 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                Tải hóa đơn PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


