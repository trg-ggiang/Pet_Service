import { useState } from "react";
import { Calendar as CalendarIcon, Check, CheckCircle2, ChevronLeft, ClipboardList, Download, Eye, Heart, Image as ImageIcon, Loader2, Pencil, Scissors, X } from "lucide-react";
import { createPortal } from "react-dom";
import { downloadCustomerInvoicePdf } from "../../../services/customer/customerPetsApi";
import type { PetDetail, PetSummary } from "../../../types/customer/pets";

const PET_COLOR_PRESETS = [
  { id: "amber", from: "#FB923C", to: "#EA580C", ring: "#FBBF24" },
  { id: "slate", from: "#94A3B8", to: "#475569", ring: "#64748B" },
  { id: "cyan", from: "#22D3EE", to: "#0891B2", ring: "#06B6D4" },
  { id: "rose", from: "#FB7185", to: "#E11D48", ring: "#F43F5E" },
  { id: "violet", from: "#A78BFA", to: "#7C3AED", ring: "#8B5CF6" },
  { id: "emerald", from: "#34D399", to: "#059669", ring: "#10B981" },
];

const PET_COVER_IMAGES: Record<string, string> = {
  "Chó": "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1200&h=420&fit=crop",
  "Mèo": "https://images.unsplash.com/photo-1513245543132-31f507417b26?w=1200&h=420&fit=crop",
  "Thỏ": "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=1200&h=420&fit=crop",
  default: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1200&h=420&fit=crop",
};

function getPetColorById(id: string) {
  return PET_COLOR_PRESETS.find((item) => item.id === id) ?? PET_COLOR_PRESETS[0];
}

function getPetCoverImage(species?: string) {
  return (species && PET_COVER_IMAGES[species]) || PET_COVER_IMAGES.default;
}


function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa có" : date.toLocaleDateString("vi-VN");
}

function formatCurrency(amount?: number | null) {
  if (amount == null) return "0₫";
  return new Intl.NumberFormat("vi-VN").format(amount) + "₫";
}

function getBoardingStatusLabel(status: string) {
  const labels: Record<string, string> = {
    BOOKED: "Đã đặt",
    CHECKED_IN: "Đã check-in",
    STAYING: "Đang lưu trú",
    CHECKED_OUT: "Đã checkout",
    CANCELLED: "Đã hủy",
  };
  return labels[status] || status;
}

function getBoardingCareItems(update: {
  eating_status: string | null;
  health_status: string | null;
  activity_status: string | null;
  note: string | null;
}) {
  const eating = String(update.eating_status || "").toUpperCase();
  const activity = String(update.activity_status || "").toUpperCase();
  const health = String(update.health_status || "").toUpperCase();
  const note = String(update.note || "").toUpperCase();
  return [
    eating.includes("BREAKFAST") || note.includes("BREAKFAST") ? "Bữa sáng" : "",
    eating.includes("LUNCH") || note.includes("LUNCH") ? "Bữa trưa" : "",
    eating.includes("DINNER") || note.includes("DINNER") ? "Bữa tối" : "",
    note.includes("CLEANED") ? "Vệ sinh phòng" : "",
    activity.includes("EXERCISED") || note.includes("EXERCISED") ? "Vận động" : "",
    health.includes("CHECKED") || note.includes("HEALTHCHECK") ? "Kiểm tra sức khỏe" : "",
  ].filter(Boolean);
}

function getBoardingDisplayNote(note?: string | null) {
  const tokens = new Set(["BREAKFAST", "LUNCH", "DINNER", "CLEANED", "EXERCISED", "HEALTHCHECK"]);
  return String(note || "")
    .split(/\r?\n|,/)
    .map((part) => part.trim())
    .filter((part) => part && !tokens.has(part.toUpperCase()))
    .join("\n");
}

function getLatestBoardingUpdatesByDate(records: NonNullable<PetDetail["boardingRecords"][number]["boarding_daily_updates"]>) {
  const latestByDate = new Map<string, typeof records[number]>();
  [...records]
    .sort((left, right) => {
      const dateDelta = new Date(right.date).getTime() - new Date(left.date).getTime();
      if (dateDelta !== 0) return dateDelta;
      return Number(right.id || 0) - Number(left.id || 0);
    })
    .forEach((record) => {
      const key = String(record.date || "").slice(0, 10);
      if (key && !latestByDate.has(key)) latestByDate.set(key, record);
    });
  return Array.from(latestByDate.values());
}

function getGenderLabel(gender: PetSummary["gender"]) {
  if (gender === "MALE") return "Đực";
  if (gender === "FEMALE") return "Cái";
  return "Chưa xác định";
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDateForInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) return date;
    return null;
  }

  const viMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (viMatch) {
    const day = Number(viMatch[1]);
    const month = Number(viMatch[2]);
    const year = Number(viMatch[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) return date;
    return null;
  }

  return null;
}

function isFutureDate(value: string) {
  if (!value) return false;
  const selected = new Date(`${value}T00:00:00`);
  if (Number.isNaN(selected.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected > today;
}


const HISTORY_TABS = [
  { id: "overview", label: "Tổng quan", icon: Heart },
  { id: "medical", label: "Lịch sử khám", icon: ClipboardList },
  { id: "grooming", label: "Grooming", icon: Scissors },
  { id: "boarding", label: "Lưu trú", icon: ChevronLeft },
  { id: "invoice", label: "Hóa đơn", icon: CheckCircle2 },
] as const;

type PetDetailTab = typeof HISTORY_TABS[number]["id"];


export function PetDetailModal({
  pet,
  detail,
  loading,
  onEdit,
  onClose,
}: {
  pet: PetSummary;
  detail: PetDetail | null;
  loading: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<PetDetailTab>("overview");
  const [downloadError, setDownloadError] = useState("");
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);
  const [viewingImage, setViewingImage] = useState<{ src: string; label: string } | null>(null);
  const clr = getPetColorById(pet.colorId);
  const latestMedicalVisit = detail?.medicalVisits?.[0] ?? null;

  const handleDownloadInvoice = async (invoiceId: number) => {
    try {
      setDownloadingInvoiceId(invoiceId);
      setDownloadError("");
      await downloadCustomerInvoicePdf(invoiceId);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Không thể tải hóa đơn PDF.");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center overflow-hidden bg-slate-900/40 p-3 backdrop-blur-sm sm:p-5" onClick={onClose}>
      <div className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {pet.image ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-100 flex-shrink-0">
                <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${clr.from}, ${clr.to})` }}>
                <span className="text-base font-bold text-white">{pet.initials}</span>
              </div>
            )}
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">{pet.name}</h3>
              <p className="truncate text-xs text-slate-500 sm:text-sm">{pet.species} • {pet.breed} • {getGenderLabel(pet.gender)}</p>
            </div>
            <span className={`hidden shrink-0 px-2.5 py-1 text-[11px] font-bold rounded-lg ring-1 ring-inset sm:inline-flex ${pet.healthy ? "bg-emerald-50 text-emerald-700 ring-emerald-200/50" : "bg-amber-50 text-amber-700 ring-amber-200/50"}`}>
              {pet.healthy ? "Khoẻ mạnh" : "Cần theo dõi"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={onEdit} className="h-8 px-3 rounded-full flex items-center gap-2 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors sm:text-sm">
              <Pencil size={15} />
              Chỉnh sửa
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-1 overflow-x-auto border-b border-slate-100 px-5">
          {HISTORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs font-bold transition-all relative whitespace-nowrap flex items-center gap-2 sm:text-sm ${active ? "text-cyan-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Icon size={14} />
                {tab.label}
                {active && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500 rounded-t-full" />}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải chi tiết thú cưng...
            </div>
          )}

          {downloadError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {downloadError}
            </div>
          )}

          {!loading && detail && activeTab === "overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {[
                  { label: "Ngày sinh", value: formatDate(pet.dob) },
                  { label: "Cân nặng", value: pet.weight },
                  { label: "Khám gần nhất", value: pet.lastVisit },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
                    <div className="text-base font-bold text-slate-800">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <SummaryCard title="Thông tin sức khoẻ" items={[
                  { label: "Dị ứng", value: pet.allergies ?? "Không có" },
                  { label: "Bệnh nền", value: pet.chronicDiseases ?? "Không có" },
                  { label: "Ghi chú", value: pet.specialNote ?? "Không có" },
                ]} />
                <SummaryCard title="Lần khám gần nhất" items={latestMedicalVisit ? [
                  { label: "Triệu chứng", value: latestMedicalVisit.symptoms ?? "Không có" },
                  { label: "Chẩn đoán", value: latestMedicalVisit.diagnosis_note ?? "Không có" },
                  { label: "Tái khám", value: formatDate(latestMedicalVisit.next_visit_date) },
                ] : [{ label: "Trạng thái", value: "Chưa có lịch khám" }]} />
              </div>

              <SummaryCard title="Thống kê nhanh" items={[
                  { label: "Lịch hẹn", value: String(detail.appointments.length) },
                  { label: "Hóa đơn", value: String(detail.invoices.length) },
                ]} />
            </div>
          )}

          {!loading && detail && activeTab === "medical" && <TimelineList rows={detail.medicalVisits.map((row) => ({ title: row.diagnosis_note ?? "Khám thú y", subtitle: row.symptoms ?? "", meta: formatDate(row.created_at) }))} emptyText="Chưa có lịch sử khám." />}
          {!loading && detail && activeTab === "grooming" && <TimelineList rows={detail.groomingRecords.map((row) => ({ title: row.status, subtitle: row.notes ?? "", meta: formatDate(row.started_at) }))} emptyText="Chưa có dữ liệu grooming." />}
          {!loading && detail && activeTab === "boarding" && <BoardingStayList records={detail.boardingRecords} onViewImage={setViewingImage} />}
          {!loading && detail && activeTab === "invoice" && (
            detail.invoices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500">Chưa có hóa đơn.</div>
            ) : (
              <div className="space-y-3">
                {detail.invoices.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{formatCurrency(row.total_amount)} · {row.payment_status}</div>
                        <div className="text-sm text-slate-500 mt-1">{row.transaction_code ?? row.status}</div>
                        <div className="text-xs font-semibold text-slate-400 mt-1">{formatDate(row.created_at)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDownloadInvoice(row.id)}
                        disabled={downloadingInvoiceId === row.id}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingInvoiceId === row.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        Tải PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
      {viewingImage && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 p-4" onClick={() => setViewingImage(null)}>
          <div className="relative max-h-[92vh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setViewingImage(null)}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg transition-colors hover:bg-white"
              aria-label="Đóng ảnh"
            >
              <X size={18} />
            </button>
            <img src={viewingImage.src} alt={viewingImage.label} className="max-h-[92vh] w-full rounded-2xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

function SummaryCard({ title, items }: { title: string; items: Array<{ label: string; value: string }> }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-bold text-slate-900 mb-3">{title}</div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-4">
            <div className="text-sm text-slate-500">{item.label}</div>
            <div className="text-sm font-semibold text-slate-900 text-right max-w-[65%]">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardingStayList({
  records,
  onViewImage,
}: {
  records: PetDetail["boardingRecords"];
  onViewImage: (image: { src: string; label: string }) => void;
}) {
  if (records.length === 0) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500">Chưa có dữ liệu lưu trú.</div>;
  }

  return (
    <div className="space-y-3">
      {records.map((record) => {
        const updates = getLatestBoardingUpdatesByDate(record.boarding_daily_updates || []);

        return (
          <div key={record.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="break-words text-sm font-bold text-slate-900">{getBoardingStatusLabel(record.current_status)}</div>
                <div className="mt-1 break-words text-xs font-semibold text-slate-500">{formatDate(record.check_in)} → {formatDate(record.check_out)}</div>
              </div>
              <span className="inline-flex w-fit shrink-0 rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100">Phòng #{record.cage_id}</span>
            </div>

            {(record.feeding_instruction || record.special_note || record.habit_note) && (
              <div className="mt-2 space-y-1 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {record.feeding_instruction && <div className="break-words"><span className="font-bold text-slate-700">Thức ăn:</span> {record.feeding_instruction}</div>}
                {(record.special_note || record.habit_note) && <div className="break-words"><span className="font-bold text-slate-700">Ghi chú:</span> {record.special_note || record.habit_note}</div>}
              </div>
            )}

            <div className="mt-2.5">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Nhật ký chăm sóc</div>
              {updates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-sm font-medium text-slate-400">Chưa có cập nhật hằng ngày.</div>
              ) : (
                <div className="space-y-2.5">
                  {updates.map((update) => {
                    const careItems = getBoardingCareItems(update);
                    const displayNote = getBoardingDisplayNote(update.note);
                    return (
                      <div key={update.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-2">
                        <div className="grid min-w-0 gap-2.5 md:grid-cols-[128px_minmax(0,1fr)]">
                        <div className="relative h-32 overflow-hidden rounded-xl border border-slate-200 bg-white md:h-24">
                          {update.img_url ? (
                            <>
                              <img src={update.img_url} alt={`Ảnh lưu trú ngày ${formatDate(update.date)}`} className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => onViewImage({ src: update.img_url || "", label: `Ảnh lưu trú ngày ${formatDate(update.date)}` })}
                                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition-colors hover:bg-white"
                                aria-label="Xem ảnh lưu trú"
                              >
                                <Eye size={16} />
                              </button>
                            </>
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center text-slate-300">
                              <ImageIcon size={24} />
                              <span className="mt-2 text-xs font-semibold">Chưa có ảnh</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <div className="break-words text-sm font-bold text-slate-900">{formatDate(update.date)}</div>
                          {careItems.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {careItems.map((item) => (
                                <span key={item} className="max-w-full break-words rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">{item}</span>
                              ))}
                            </div>
                          )}
                          {displayNote && <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-slate-600">{displayNote}</p>}
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimelineList({ rows, emptyText }: { rows: Array<{ title: string; subtitle: string; meta: string }>; emptyText: string }) {
  if (rows.length === 0) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500">{emptyText}</div>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={`${row.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-slate-900">{row.title}</div>
              <div className="text-sm text-slate-500 mt-1">{row.subtitle}</div>
            </div>
            <div className="text-xs font-semibold text-slate-400 whitespace-nowrap">{row.meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}


