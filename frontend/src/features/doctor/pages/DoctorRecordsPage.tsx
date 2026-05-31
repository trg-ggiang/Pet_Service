import { useEffect, useState } from "react";
import {
  Search, Filter, ChevronRight, Calendar, Stethoscope,
  Thermometer, Heart, Wind, Activity, Weight,
  Pill, ClipboardList, AlertTriangle, CheckCircle2,
  FileText, User, Clock, ArrowLeft, Printer, Download, Loader2,
} from "lucide-react";
import { doctorDataService, type DoctorMedicalRecord as MedRecord } from "../services/doctorData";

// ── Pet photos ─────────────────────────────────────────────────────────────────
const DEFAULT_PET_PHOTO = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80";

const SEVERITY_LABEL = ["", "Rất nhẹ", "Nhẹ", "Trung bình", "Nặng", "Rất nặng"];
const SEVERITY_COLOR = ["", "text-emerald-600", "text-lime-600", "text-amber-600", "text-orange-600", "text-red-600"];
const SEVERITY_BG    = ["", "bg-emerald-50 text-emerald-700", "bg-lime-50 text-lime-700", "bg-amber-50 text-amber-700", "bg-orange-50 text-orange-700", "bg-red-50 text-red-600"];

// ── Sub-components ─────────────────────────────────────────────────────────────

function VitalChip({ icon: Icon, label, value, unit, color, bg }: {
  icon: React.ElementType; label: string; value: string; unit: string; color: string; bg: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 p-3 rounded-xl border border-border ${bg}`}>
      <div className="flex items-center gap-1.5">
        <Icon size={12} className={color} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-foreground">{value || "—"}</span>
        <span className="text-[10px] text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

function RecordDetail({ rec, onClose }: { rec: MedRecord; onClose: () => void }) {
  const photo = rec.petImage || DEFAULT_PET_PHOTO;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-border px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Danh sách
          </button>
          <div className="w-px h-4 bg-border" />
          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{rec.id}</span>
          <span className="text-[12px] text-muted-foreground">{rec.dateShort}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 h-8 px-3 border border-border rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
            <Printer size={13} /> In hồ sơ
          </button>
          <button className="flex items-center gap-1.5 h-8 px-3 border border-border rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
            <Download size={13} /> Xuất PDF
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-5">

          {/* ── Pet info banner ── */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden flex">
            <div className="relative w-36 flex-shrink-0">
              <img src={photo} alt={rec.pet} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
            </div>
            <div className="flex-1 px-5 py-4 flex flex-col justify-center gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-foreground">{rec.pet}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${rec.serviceColor}`}>{rec.service}</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-0.5">{rec.species} · {rec.breed} · {rec.sex}</p>
                </div>
                {rec.allergy !== "Không ghi nhận" && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl flex-shrink-0">
                    <AlertTriangle size={12} className="text-red-500" />
                    <span className="text-[11px] font-bold text-red-600">Dị ứng: {rec.allergy}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-5 flex-wrap">
                {[
                  { label: "Tuổi",      value: rec.age },
                  { label: "Cân nặng",  value: rec.weight },
                  { label: "Chủ nhân",  value: rec.owner },
                  { label: "SĐT",       value: rec.phone },
                  { label: "Bác sĩ",    value: rec.doctor },
                  { label: "Ngày khám", value: rec.dateShort },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
                    <div className="text-[13px] font-semibold text-foreground">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Two-column layout ── */}
          <div className="grid grid-cols-2 gap-5">

            {/* LEFT column */}
            <div className="flex flex-col gap-5">

              {/* Chief complaint + symptoms */}
              <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <ClipboardList size={14} className="text-cyan-500" />
                  Triệu chứng & Lý do khám
                </h3>
                <p className="text-[13px] text-foreground leading-relaxed">{rec.chiefComplaint}</p>

                {rec.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {rec.symptoms.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-[12px] font-semibold text-cyan-700">{s}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-1">
                  {rec.duration !== "Không có" && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Thời gian</span>
                      <p className="text-[12px] font-semibold text-foreground">{rec.duration}</p>
                    </div>
                  )}
                  {rec.onset !== "Không có" && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Khởi phát</span>
                      <p className="text-[12px] font-semibold text-foreground">{rec.onset}</p>
                    </div>
                  )}
                  {rec.severity > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mức độ</span>
                      <span className={`mt-0.5 flex items-center text-[12px] font-bold ${SEVERITY_COLOR[rec.severity]}`}>
                        {SEVERITY_LABEL[rec.severity]}
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${SEVERITY_BG[rec.severity]}`}>
                          {rec.severity}/5
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vitals */}
              <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <Activity size={14} className="text-cyan-500" />
                  Sinh hiệu
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <VitalChip icon={Thermometer} label="Nhiệt độ" value={rec.vitals.temp} unit="°C"        color="text-orange-500" bg="bg-orange-50/60" />
                  <VitalChip icon={Heart}       label="Nhịp tim" value={rec.vitals.heart} unit="lần/ph"   color="text-red-500"    bg="bg-red-50/60" />
                  <VitalChip icon={Wind}        label="Nhịp thở" value={rec.vitals.resp}  unit="lần/ph"   color="text-cyan-500"   bg="bg-cyan-50/60" />
                  <VitalChip icon={Activity}    label="SpO₂"     value={rec.vitals.spo2}  unit="%"        color="text-violet-500" bg="bg-violet-50/60" />
                </div>
                <div className="grid grid-cols-1">
                  <VitalChip icon={Weight}      label="Cân nặng" value={rec.vitals.weight} unit="kg"      color="text-emerald-600" bg="bg-emerald-50/60" />
                </div>
              </div>

              {/* Follow-up */}
              <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-2.5">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <Calendar size={14} className="text-cyan-500" />
                  Lịch tái khám
                </h3>
                <div className="flex items-start gap-3 p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                  <Clock size={14} className="text-cyan-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-bold text-cyan-800">{rec.followUpDate}</p>
                    <p className="text-[12px] text-cyan-700 mt-0.5 leading-relaxed">{rec.followUp}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT column */}
            <div className="flex flex-col gap-5">

              {/* Physical exam */}
              <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <Stethoscope size={14} className="text-cyan-500" />
                  Khám lâm sàng theo hệ cơ quan
                </h3>
                <div className="flex flex-col gap-1.5">
                  {rec.sysResults.map((sys) => (
                    <div key={sys.system} className={`rounded-xl border overflow-hidden ${sys.status === "abnormal" ? "border-red-200" : "border-border"}`}>
                      <div className={`flex items-center gap-3 px-3.5 py-2 ${sys.status === "abnormal" ? "bg-red-50/60" : ""}`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sys.status === "normal" ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className="text-[12px] font-semibold text-foreground flex-1">{sys.system}</span>
                        <span className={`text-[11px] font-bold ${sys.status === "normal" ? "text-emerald-600" : "text-red-600"}`}>
                          {sys.status === "normal" ? "Bình thường" : "Bất thường"}
                        </span>
                      </div>
                      {sys.note && (
                        <div className="px-3.5 pb-2.5 bg-red-50/40">
                          <p className="text-[11px] text-red-700 leading-relaxed">{sys.note}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnosis */}
              <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <FileText size={14} className="text-cyan-500" />
                  Chẩn đoán & Ghi chú
                </h3>
                <div className="p-3 bg-slate-50 rounded-xl border border-border">
                  <p className="text-[13px] font-bold text-foreground">{rec.diagnosis}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{rec.diagnosisCode}</p>
                </div>
                <p className="text-[12px] text-foreground leading-relaxed">{rec.clinicalNote}</p>
              </div>

              {/* Prescriptions */}
              <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <Pill size={14} className="text-cyan-500" />
                  Đơn thuốc
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-[11px] font-bold">{rec.prescriptions.length} thuốc</span>
                </h3>
                <div className="flex flex-col gap-2">
                  {rec.prescriptions.map((rx, i) => (
                    <div key={i} className="flex items-start gap-3 px-3.5 py-3 bg-slate-50 rounded-xl border border-border">
                      <div className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-cyan-700">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-foreground">{rx.drug}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">Liều: <b className="text-foreground">{rx.dose}</b></span>
                          <span className="text-[11px] text-muted-foreground">Đường dùng: <b className="text-foreground">{rx.route}</b></span>
                          <span className="text-[11px] text-muted-foreground">Tần suất: <b className="text-foreground">{rx.frequency}</b></span>
                          <span className="text-[11px] text-muted-foreground">Thời gian: <b className="text-foreground">{rx.duration}</b></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export function DoctorRecordsPage() {
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<"all" | "Chó" | "Mèo">("all");
  const [records, setRecords] = useState<MedRecord[]>([]);
  const [selected, setSelected] = useState<MedRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    doctorDataService.listRecords()
      .then((data) => {
        if (!active) return;
        setRecords(data);
        setSelected(data[0] ?? null);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Khong the tai ho so benh an");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchQ = !q || r.pet.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q) || r.diagnosis.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    const matchS = speciesFilter === "all" || r.species === speciesFilter;
    return matchQ && matchS;
  });

  if (selected) {
    return (
      <div className="flex h-full min-h-0">
        {/* Narrow list stays visible */}
        <aside className="w-[260px] flex-shrink-0 bg-white border-r border-border flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border flex-shrink-0">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm hồ sơ..."
                className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-border rounded-xl text-[12px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filtered.map((r) => {
              const photo = r.petImage || DEFAULT_PET_PHOTO;
              const isActive = selected?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`w-full flex items-start gap-2.5 px-3 py-3 text-left transition-colors ${isActive ? "bg-cyan-50 border-l-2 border-cyan-400" : "hover:bg-muted/40"}`}
                >
                  <img src={photo} alt={r.pet} className="w-9 h-9 rounded-xl object-cover flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[13px] font-bold truncate ${isActive ? "text-cyan-700" : "text-foreground"}`}>{r.pet}</span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{r.dateShort}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{r.diagnosis}</p>
                    <span className="text-[10px] font-mono text-muted-foreground/60">{r.id}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
        <RecordDetail rec={selected} onClose={() => setSelected(null)} />
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-border">
        <div>
          <h2 className="text-sm font-bold text-foreground">Hồ sơ bệnh án</h2>
          <p className="text-[11px] text-muted-foreground">{records.length} ho so</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Species filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(["all", "Chó", "Mèo"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setSpeciesFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  speciesFilter === f ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "Tất cả" : f}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, chủ nhân, chẩn đoán..."
              className="w-60 h-9 pl-8 pr-4 bg-slate-50 border border-border rounded-xl text-[12px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
            />
          </div>
          <button className="flex items-center gap-1.5 h-9 px-3 border border-border rounded-xl text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
            <Filter size={13} /> Lọc
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
          <Loader2 size={22} className="animate-spin text-cyan-500 mr-2" />
          Dang tai ho so benh an...
        </div>
      )}

      {!loading && error && (
        <div className="flex-1 flex items-center justify-center text-sm text-red-600">{error}</div>
      )}

      {/* Table */}
      {!loading && !error && <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                {["Thú cưng", "Chủ nhân", "Dịch vụ", "Chẩn đoán", "Bác sĩ", "Ngày khám"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-left ${i === 0 ? "pl-5" : ""}`}>
                    {h}
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((r) => {
                const photo = r.petImage || DEFAULT_PET_PHOTO;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="hover:bg-slate-50/80 cursor-pointer group transition-colors"
                  >
                    <td className="pl-5 pr-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <img src={photo} alt={r.pet} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                        <div>
                          <div className="text-[13px] font-bold text-foreground">{r.pet}</div>
                          <div className="text-[11px] text-muted-foreground">{r.species} · {r.breed}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0">
                          <User size={11} className="text-white" />
                        </div>
                        <span className="text-[13px] text-foreground font-medium">{r.owner}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${r.serviceColor}`}>{r.service}</span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[220px]">
                      <div className="text-[13px] font-semibold text-foreground truncate">{r.diagnosis}</div>
                      <div className="text-[11px] font-mono text-muted-foreground/60 mt-0.5">{r.id}</div>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-muted-foreground font-medium">{r.doctor}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-muted-foreground" />
                        <span className="text-[12px] text-foreground font-medium">{r.dateShort}</span>
                      </div>
                    </td>
                    <td className="pr-4 py-3.5">
                      <ChevronRight size={15} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground text-sm">
                    Không tìm thấy hồ sơ phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  );
}
