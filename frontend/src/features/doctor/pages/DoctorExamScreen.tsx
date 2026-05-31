import { useEffect, useState } from "react";
import {
  ArrowLeft, Save, CheckCircle2, Thermometer, Heart, Wind,
  Activity, Weight, AlertTriangle, User, ChevronDown, ChevronUp,
  Syringe, Clock, CalendarDays, Fingerprint, MapPin, Loader2,
} from "lucide-react";
import { doctorDataService, type DoctorExamContext } from "../services/doctorData";

// ── Pet image map (keyed by patient name in schedule) ──────────────────────
const DEFAULT_PET_PHOTO = "https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?w=600&q=80";

const SYMPTOM_TAGS = [
  "Bỏ ăn", "Nôn mửa", "Tiêu chảy", "Sốt", "Ho", "Hắt hơi",
  "Ngứa da", "Rụng lông", "Mệt mỏi", "Đi khập khiễng", "Uống nhiều nước", "Tiểu nhiều",
  "Chảy nước mắt", "Sưng hạch", "Thở khó", "Đau bụng",
];

const BODY_SYSTEMS = [
  { id: "general",    label: "Tổng thể" },
  { id: "skin",       label: "Da & Lông" },
  { id: "eyes_ears",  label: "Mắt & Tai" },
  { id: "lymph",      label: "Hạch bạch huyết" },
  { id: "cardiac",    label: "Tim mạch" },
  { id: "respiratory",label: "Hô hấp" },
  { id: "gastro",     label: "Tiêu hoá" },
  { id: "musculo",    label: "Cơ xương khớp" },
  { id: "neuro",      label: "Thần kinh" },
];

type SysStatus = "normal" | "abnormal" | "not_examined";

interface SysEntry { status: SysStatus; notes: string }

interface ExamPatient {
  id: string;
  appointmentId?: number;
  patient?: string;
  petName?: string;
  petImage?: string | null;
  species: string;
  breed?: string;
  owner: string;
  ownerPhone?: string;
  service: string;
  time: string;
  note?: string;
}

function VitalInput({
  icon: Icon, label, value, unit, color, bg,
  onChange,
}: {
  icon: React.ElementType; label: string; value: string; unit: string;
  color: string; bg: string; onChange: (v: string) => void;
}) {
  return (
    <div className={`flex flex-col gap-2 p-3.5 rounded-xl border border-border ${bg}`}>
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0`}>
          <Icon size={14} className={color} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className="w-full bg-transparent text-xl font-bold text-foreground focus:outline-none placeholder:text-slate-300"
        />
        <span className="text-xs text-slate-400 flex-shrink-0">{unit}</span>
      </div>
    </div>
  );
}

function SysRow({
  label, entry, onChange,
}: {
  label: string;
  entry: SysEntry;
  onChange: (e: SysEntry) => void;
}) {
  const [open, setOpen] = useState(false);

  const statusCfg: Record<SysStatus, { label: string; cls: string; dot: string }> = {
    normal:       { label: "Bình thường",  cls: "border-emerald-300 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
    abnormal:     { label: "Bất thường",   cls: "border-red-300 bg-red-50 text-red-600",             dot: "bg-red-500" },
    not_examined: { label: "Chưa khám",    cls: "border-slate-200 bg-slate-50 text-slate-400",        dot: "bg-slate-300" },
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <span className="text-[13px] font-semibold text-foreground flex-1">{label}</span>
        {/* status buttons */}
        <div className="flex items-center gap-1">
          {(["normal", "abnormal", "not_examined"] as SysStatus[]).map((s) => {
            const cfg = statusCfg[s];
            const active = entry.status === s;
            return (
              <button
                key={s}
                onClick={() => {
                  const next = { ...entry, status: s };
                  onChange(next);
                  if (s === "abnormal") setOpen(true);
                  else setOpen(false);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                  active ? cfg.cls + " shadow-sm" : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${active ? cfg.dot : "bg-slate-200"}`} />
                {cfg.label}
              </button>
            );
          })}
        </div>
        {entry.status === "abnormal" && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-6 h-6 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
          >
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>
      {open && entry.status === "abnormal" && (
        <div className="px-3.5 pb-3 border-t border-red-100 bg-red-50/40">
          <textarea
            rows={2}
            value={entry.notes}
            onChange={(e) => onChange({ ...entry, notes: e.target.value })}
            placeholder="Mô tả chi tiết bất thường..."
            className="mt-2.5 w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-300 transition-all resize-none"
          />
        </div>
      )}
    </div>
  );
}

export function DoctorExamScreen({
  patient,
  onBack,
  onFinish,
}: {
  patient: ExamPatient;
  onBack: () => void;
  onFinish: () => void;
}) {
  const patientName = patient.patient || patient.petName || "Thu cung";
  const [examContext, setExamContext] = useState<DoctorExamContext | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const photo = examContext?.pet.image || patient.petImage || DEFAULT_PET_PHOTO;

  // ── state ──────────────────────────────────────────────────────────────────
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [ownerNotes, setOwnerNotes] = useState("");
  const [duration, setDuration] = useState("");
  const [onset, setOnset] = useState<"" | "sudden" | "gradual">("");
  const [severity, setSeverity] = useState(0);

  const [vitals, setVitals] = useState({
    temp: "", heart: "", resp: "", spo2: "", weight: "",
  });

  const initSys = (): SysEntry => ({ status: "not_examined", notes: "" });
  const [sysExam, setSysExam] = useState<Record<string, SysEntry>>(() =>
    Object.fromEntries(BODY_SYSTEMS.map((s) => [s.id, initSys()]))
  );

  useEffect(() => {
    let active = true;
    const appointmentId = patient.appointmentId ?? Number(String(patient.id).replace(/\D/g, ""));

    if (!Number.isFinite(appointmentId)) {
      setContextLoading(false);
      setContextError("Khong tim thay ma lich hen");
      return;
    }

    setContextLoading(true);
    doctorDataService.getExamContext(appointmentId)
      .then((context) => {
        if (!active) return;
        setExamContext(context);
        setChiefComplaint(context.initialForm.chiefComplaint || "");
        setOwnerNotes(context.initialForm.ownerNotes || "");
        setVitals(context.initialForm.vitals);
        setContextError(null);
      })
      .catch((err) => {
        if (!active) return;
        setContextError(err instanceof Error ? err.message : "Khong the tai du lieu ca kham");
      })
      .finally(() => {
        if (active) setContextLoading(false);
      });

    return () => {
      active = false;
    };
  }, [patient.appointmentId, patient.id]);

  function toggleSymptom(tag: string) {
    setSymptoms((prev) =>
      prev.includes(tag) ? prev.filter((s) => s !== tag) : [...prev, tag]
    );
  }

  function updateVital(key: keyof typeof vitals, val: string) {
    setVitals((v) => ({ ...v, [key]: val }));
  }

  const petInfo = [
    { icon: CalendarDays, label: "Tuoi",     value: examContext?.pet.age || "Chua cap nhat" },
    { icon: Weight,       label: "Can nang", value: examContext?.pet.weight || "Chua cap nhat" },
    { icon: MapPin,       label: "Giong",    value: examContext?.pet.breed || patient.breed || "Chua cap nhat" },
    { icon: Fingerprint,  label: "Ma lich",  value: examContext?.appointment.code || patient.id },
  ];

  const vaccines = examContext?.vaccinations || [];
  const visitHistory = examContext?.visitHistory || [];
  const displayedPetName = examContext?.pet.name || patientName;
  const displayedSpecies = examContext?.pet.species || patient.species;
  const displayedSex = examContext?.pet.sex || "";
  const displayedService = examContext?.appointment.service || patient.service;
  const displayedOwner = examContext?.pet.owner || patient.owner;
  const displayedOwnerPhone = examContext?.pet.ownerPhone || patient.ownerPhone || "Chua cap nhat";
  const displayedAllergies = examContext?.pet.allergies || "Khong ghi nhan";

  const severityLabels = ["", "Rất nhẹ", "Nhẹ", "Trung bình", "Nặng", "Rất nặng"];
  const severityColors = ["", "text-emerald-600", "text-lime-600", "text-amber-600", "text-orange-600", "text-red-600"];

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-0">

      {/* ── Top action bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3.5 bg-white border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Quay lại
          </button>
          <div className="w-px h-4 bg-border" />
          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{patient.id}</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[12px] font-semibold text-amber-600">Đang khám</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 h-9 px-4 border border-border rounded-xl text-[13px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <Save size={14} /> Lưu nháp
          </button>
          <button
            onClick={onFinish}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)", boxShadow: "0 3px 12px rgba(8,145,178,0.3)" }}
          >
            <CheckCircle2 size={14} /> Kết thúc khám
          </button>
        </div>
      </div>

      {/* ── Three-column body ── */}
      <div className="flex-1 overflow-hidden grid grid-cols-[300px_1fr_1fr] gap-0 min-h-0">

        {/* ════ Col 1: Pet Information ════════════════════════════════════════ */}
        <div className="border-r border-border bg-white overflow-y-auto flex flex-col">

          {/* Photo */}
          <div className="relative flex-shrink-0">
            <img
              src={photo}
              alt={displayedPetName}
              className="w-full h-52 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3.5">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{displayedPetName}</h2>
                  <span className="text-[11px] font-semibold text-white/70">
                    {displayedSpecies}{displayedSex ? ` · ${displayedSex}` : ""}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/90 text-amber-900 text-[10px] font-bold">
                  {displayedService}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-4 flex-1">
            {contextLoading && (
              <div className="flex items-center gap-2 px-3 py-2 bg-cyan-50 border border-cyan-100 rounded-xl text-[12px] text-cyan-700">
                <Loader2 size={14} className="animate-spin" />
                Dang tai du lieu tu database...
              </div>
            )}

            {!contextLoading && contextError && (
              <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-[12px] text-red-600">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                {contextError}
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2">
              {petInfo.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col gap-1 bg-slate-50 rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5">
                    <Icon size={11} className="text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                  </div>
                  <span className="text-[13px] font-semibold text-foreground truncate">{value}</span>
                </div>
              ))}
            </div>

            {/* Owner */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-0.5">Chủ nhân</p>
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0">
                  <User size={13} className="text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-foreground truncate">{displayedOwner}</div>
                  <div className="text-[11px] text-muted-foreground">{displayedOwnerPhone}</div>
                </div>
              </div>
            </div>

            {displayedAllergies !== "Không ghi nhận" && displayedAllergies !== "Khong ghi nhan" && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-red-700">Di ung</p>
                  <p className="text-[12px] text-red-600 mt-0.5">{displayedAllergies}</p>
                </div>
              </div>
            )}

            {/* Vaccination */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-0.5">Tiêm phòng</p>
              <div className="flex flex-col gap-1.5">
                {!contextLoading && vaccines.length === 0 && (
                  <div className="px-3 py-2 bg-slate-50 rounded-xl text-[12px] text-muted-foreground">Chua co du lieu tiem phong</div>
                )}
                {vaccines.map((v) => (
                  <div key={v.name} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Syringe size={12} className={v.ok ? "text-emerald-500" : "text-red-400"} />
                      <span className="text-[12px] font-semibold text-foreground">{v.name}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-bold ${v.ok ? "text-emerald-600" : "text-red-500"}`}>
                        {v.ok ? "Còn hạn" : "Cần nhắc"}
                      </div>
                      <div className="text-[9px] text-muted-foreground">{v.date} → {v.due}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visit history */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-0.5">Lịch sử khám</p>
              <div className="px-3 py-2 bg-slate-50 rounded-xl text-[12px] text-muted-foreground">Chua co lich su kham tu backend</div>
            </div>

          </div>
        </div>

        {/* ════ Col 2: Symptoms ════════════════════════════════════════════════ */}
        <div className="overflow-y-auto border-r border-border">
          <div className="p-5 flex flex-col gap-5">

            <div>
              <h3 className="text-sm font-bold text-foreground mb-0.5">Triệu chứng</h3>
              <p className="text-[12px] text-muted-foreground">Ghi nhận triệu chứng từ chủ nhân và quan sát ban đầu.</p>
            </div>

            {/* Chief complaint */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Lý do đến khám
              </label>
              <textarea
                rows={3}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Mô tả lý do chính đưa thú cưng đến khám..."
                className="w-full px-3.5 py-3 bg-white border border-border rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all resize-none"
              />
            </div>

            {/* Symptom tags */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Triệu chứng ghi nhận
              </label>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_TAGS.map((tag) => {
                  const active = symptoms.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleSymptom(tag)}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                        active
                          ? "bg-cyan-50 border-cyan-300 text-cyan-700 shadow-sm"
                          : "bg-white border-border text-muted-foreground hover:border-cyan-200 hover:text-foreground"
                      }`}
                    >
                      {active && <span className="mr-1">✓</span>}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration + Onset */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                  Thời gian xuất hiện
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-10 px-3 bg-white border border-border rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all appearance-none"
                >
                  <option value="">Chọn...</option>
                  <option value="<1d">Dưới 1 ngày</option>
                  <option value="1-3d">1–3 ngày</option>
                  <option value="3-7d">3–7 ngày</option>
                  <option value="1-2w">1–2 tuần</option>
                  <option value=">2w">Hơn 2 tuần</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                  Khởi phát
                </label>
                <div className="flex gap-2">
                  {[
                    { val: "sudden", label: "Đột ngột" },
                    { val: "gradual", label: "Từ từ" },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => setOnset(val as "sudden" | "gradual")}
                      className={`flex-1 h-10 rounded-xl border text-[12px] font-semibold transition-all ${
                        onset === val
                          ? "bg-cyan-50 border-cyan-300 text-cyan-700"
                          : "bg-white border-border text-muted-foreground hover:border-cyan-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Severity */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                  Mức độ nghiêm trọng
                </label>
                {severity > 0 && (
                  <span className={`text-[12px] font-bold ${severityColors[severity]}`}>
                    {severityLabels[severity]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSeverity(n)}
                    className={`flex-1 h-8 rounded-lg border-2 text-[11px] font-bold transition-all ${
                      severity >= n
                        ? n <= 2 ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                          : n === 3 ? "bg-amber-50 border-amber-400 text-amber-700"
                          : "bg-red-50 border-red-400 text-red-600"
                        : "border-border bg-white text-muted-foreground hover:border-slate-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Owner's description */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Mô tả từ chủ nhân
              </label>
              <textarea
                rows={4}
                value={ownerNotes}
                onChange={(e) => setOwnerNotes(e.target.value)}
                placeholder="Ghi lại những gì chủ nhân chia sẻ thêm về tình trạng thú cưng..."
                className="w-full px-3.5 py-3 bg-white border border-border rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all resize-none"
              />
            </div>

          </div>
        </div>

        {/* ════ Col 3: Clinical Examination ═══════════════════════════════════ */}
        <div className="overflow-y-auto">
          <div className="p-5 flex flex-col gap-5">

            <div>
              <h3 className="text-sm font-bold text-foreground mb-0.5">Khám lâm sàng</h3>
              <p className="text-[12px] text-muted-foreground">Đo lường sinh hiệu và khám từng hệ cơ quan.</p>
            </div>

            {/* Vital signs */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Sinh hiệu
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <VitalInput
                  icon={Thermometer} label="Nhiệt độ" unit="°C"
                  value={vitals.temp} onChange={(v) => updateVital("temp", v)}
                  color="text-orange-500" bg="bg-orange-50/60"
                />
                <VitalInput
                  icon={Heart} label="Nhịp tim" unit="lần/phút"
                  value={vitals.heart} onChange={(v) => updateVital("heart", v)}
                  color="text-red-500" bg="bg-red-50/60"
                />
                <VitalInput
                  icon={Wind} label="Nhịp thở" unit="lần/phút"
                  value={vitals.resp} onChange={(v) => updateVital("resp", v)}
                  color="text-cyan-500" bg="bg-cyan-50/60"
                />
                <VitalInput
                  icon={Activity} label="SpO₂" unit="%"
                  value={vitals.spo2} onChange={(v) => updateVital("spo2", v)}
                  color="text-violet-500" bg="bg-violet-50/60"
                />
                <div className="col-span-2">
                  <VitalInput
                    icon={Weight} label="Cân nặng thực tế" unit="kg"
                    value={vitals.weight} onChange={(v) => updateVital("weight", v)}
                    color="text-emerald-600" bg="bg-emerald-50/60"
                  />
                </div>
              </div>
            </div>

            {/* Physical exam by system */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Khám theo hệ cơ quan
              </label>
              <div className="flex flex-col gap-2">
                {BODY_SYSTEMS.map((sys) => (
                  <SysRow
                    key={sys.id}
                    label={sys.label}
                    entry={sysExam[sys.id]}
                    onChange={(e) => setSysExam((prev) => ({ ...prev, [sys.id]: e }))}
                  />
                ))}
              </div>
            </div>

            {/* Clinical notes */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Nhận xét lâm sàng
              </label>
              <textarea
                rows={4}
                placeholder="Nhận xét tổng thể, chẩn đoán sơ bộ, kế hoạch điều trị..."
                className="w-full px-3.5 py-3 bg-white border border-border rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all resize-none"
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
