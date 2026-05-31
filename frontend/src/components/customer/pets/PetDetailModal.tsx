import { useState } from "react";
import { Calendar as CalendarIcon, Check, CheckCircle2, ChevronLeft, ClipboardList, Download, Heart, Loader2, Pencil, Scissors, Syringe, X } from "lucide-react";
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
  { id: "vaccine", label: "Tiêm chủng", icon: Syringe },
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
  const clr = getPetColorById(pet.colorId);
  const latestVaccination = detail?.vaccinations?.[0] ?? null;
  const latestMedicalVisit = detail?.medicalVisits?.[0] ?? null;

  const handleDownloadInvoice = async (invoiceId: number) => {
    try {
      setDownloadingInvoiceId(invoiceId);
      setDownloadError("");
      await downloadCustomerInvoicePdf(invoiceId);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Khong the tai hoa don PDF.");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            {pet.image ? (
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex-shrink-0">
                <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${clr.from}, ${clr.to})` }}>
                <span className="text-xl font-bold text-white">{pet.initials}</span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900">{pet.name}</h3>
              <p className="text-sm text-slate-500">{pet.species} • {pet.breed} • {getGenderLabel(pet.gender)}</p>
            </div>
            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ring-1 ring-inset ${pet.healthy ? "bg-emerald-50 text-emerald-700 ring-emerald-200/50" : "bg-amber-50 text-amber-700 ring-amber-200/50"}`}>
              {pet.healthy ? "Khoẻ mạnh" : "Cần theo dõi"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="h-9 px-3 rounded-full flex items-center gap-2 text-sm font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors">
              <Pencil size={15} />
              Chỉnh sửa
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-100 px-6 flex gap-1 overflow-x-auto">
          {HISTORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${active ? "text-cyan-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Icon size={14} />
                {tab.label}
                {active && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500 rounded-t-full" />}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
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
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: "Ngày sinh", value: formatDate(pet.dob) },
                  { label: "Cân nặng", value: pet.weight },
                  { label: "Khám gần nhất", value: pet.lastVisit },
                  { label: "Tiêm nhắc", value: pet.nextVaccine },
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
                <SummaryCard title="Tiêm chủng gần nhất" items={latestVaccination ? [
                  { label: latestVaccination.vaccine_name, value: formatDate(latestVaccination.date_given) },
                  { label: "Lịch tiêm tiếp theo", value: formatDate(latestVaccination.next_due_date) },
                  { label: "Ghi chú", value: latestVaccination.note ?? "Không có" },
                ] : [{ label: "Trạng thái", value: "Chưa có lịch tiêm" }]} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <SummaryCard title="Lần khám gần nhất" items={latestMedicalVisit ? [
                  { label: "Triệu chứng", value: latestMedicalVisit.symptoms ?? "Không có" },
                  { label: "Chẩn đoán", value: latestMedicalVisit.diagnosis_note ?? "Không có" },
                  { label: "Tái khám", value: formatDate(latestMedicalVisit.next_visit_date) },
                ] : [{ label: "Trạng thái", value: "Chưa có lịch khám" }]} />
                <SummaryCard title="Thống kê nhanh" items={[
                  { label: "Lịch hẹn", value: String(detail.appointments.length) },
                  { label: "Vaccine", value: String(detail.vaccinations.length) },
                  { label: "Hóa đơn", value: String(detail.invoices.length) },
                ]} />
              </div>
            </div>
          )}

          {!loading && detail && activeTab === "medical" && <TimelineList rows={detail.medicalVisits.map((row) => ({ title: row.diagnosis_note ?? "Khám thú y", subtitle: row.symptoms ?? "", meta: formatDate(row.created_at) }))} emptyText="Chưa có lịch sử khám." />}
          {!loading && detail && activeTab === "vaccine" && <TimelineList rows={detail.vaccinations.map((row) => ({ title: row.vaccine_name, subtitle: row.note ?? "", meta: `${formatDate(row.date_given)} · nhắc ${formatDate(row.next_due_date)}` }))} emptyText="Chưa có lịch tiêm chủng." />}
          {!loading && detail && activeTab === "grooming" && <TimelineList rows={detail.groomingRecords.map((row) => ({ title: row.status, subtitle: row.notes ?? "", meta: formatDate(row.started_at) }))} emptyText="Chưa có dữ liệu grooming." />}
          {!loading && detail && activeTab === "boarding" && <TimelineList rows={detail.boardingRecords.map((row) => ({ title: row.current_status, subtitle: row.special_note ?? row.habit_note ?? "", meta: `${formatDate(row.check_in)} → ${formatDate(row.check_out)}` }))} emptyText="Chưa có dữ liệu lưu trú." />}
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
    </div>
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


