import { useEffect, useState } from "react";
import {
  ArrowLeft, ChevronRight, AlertTriangle, Thermometer, Heart,
  Wind, Weight, Check, ChevronDown, Plus, X, Clock,
  Pill, Calendar, FileText, Stethoscope, Activity,
  ClipboardList, FlaskConical,
} from "lucide-react";
import { adminService, type AdminExamContext } from "../services/admin";

// --- Vital sign component ─────────────────────────────────────────────────────

function VitalChip({
  icon: Icon, label, value, unit, state,
}: {
  icon: React.ElementType; label: string; value: string; unit: string;
  state: "normal" | "warn" | "critical";
}) {
  const cls = {
    normal:   "bg-emerald-50 border-emerald-200 text-emerald-700",
    warn:     "bg-amber-50 border-amber-200 text-amber-700",
    critical: "bg-red-50 border-red-200 text-red-700",
  }[state];
  const dotCls = {
    normal:   "bg-emerald-400",
    warn:     "bg-amber-400",
    critical: "bg-red-500 animate-pulse",
  }[state];
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cls} min-w-0`}>
      <Icon size={16} className="flex-shrink-0 opacity-80" />
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wide opacity-60">{label}</div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-mono font-bold text-[18px] leading-none">{value}</span>
          <span className="text-[11px] opacity-70 font-medium">{unit}</span>
        </div>
      </div>
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ml-auto ${dotCls}`} />
    </div>
  );
}

// ─── Step 0: Symptoms ─────────────────────────────────────────────────────────

function StepSymptoms({ symptoms, initialNote }: { symptoms: AdminExamContext["options"]["symptoms"]; initialNote: string }) {
  const [chips, setChips] = useState(symptoms);
  const [newTag, setNewTag] = useState("");
  const [notes, setNotes] = useState(initialNote);
  const [onset, setOnset] = useState("");
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe">("mild");

  const toggle = (id: string) => setChips((cs) => cs.map((c) => c.id === id ? { ...c, active: !c.active } : c));
  const add = () => {
    const t = newTag.trim();
    if (!t) return;
    setChips((cs) => [...cs, { id: Date.now().toString(), label: t, active: true }]);
    setNewTag("");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Triệu chứng chính</div>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button key={chip.id} onClick={() => toggle(chip.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium transition-all ${
                chip.active
                  ? "bg-cyan-50 border-cyan-300 text-cyan-700"
                  : "bg-white border-border text-muted-foreground hover:border-slate-300"
              }`}>
              {chip.active && <Check size={11} className="text-cyan-600" />}
              {chip.label}
            </button>
          ))}
          <div className="flex items-center gap-1">
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Thêm triệu chứng..."
              className="h-8 px-3 rounded-full border border-dashed border-slate-300 text-[13px] focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 w-36 placeholder:text-slate-400 bg-white" />
            <button onClick={add} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-slate-200 transition-colors">
              <Plus size={13} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Thời gian khởi phát</div>
          <div className="flex items-center gap-2">
            <input type="number" value={onset} onChange={(e) => setOnset(e.target.value)}
              className="w-20 h-9 px-3 border border-border rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white" />
            <span className="text-sm text-muted-foreground">ngày trước</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Mức độ nghiêm trọng</div>
          <div className="flex gap-2">
            {(["mild", "moderate", "severe"] as const).map((s) => {
              const labels = { mild: "Nhẹ", moderate: "Vừa", severe: "Nặng" };
              const cls = {
                mild: "border-emerald-300 bg-emerald-50 text-emerald-700",
                moderate: "border-amber-300 bg-amber-50 text-amber-700",
                severe: "border-red-300 bg-red-50 text-red-700",
              };
              return (
                <button key={s} onClick={() => setSeverity(s)}
                  className={`px-3 py-1.5 rounded-lg border text-[13px] font-semibold transition-all ${severity === s ? cls[s] : "border-border bg-white text-muted-foreground hover:bg-muted"}`}>
                  {labels[s]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Ghi chú từ chủ thú cưng</div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-border rounded-xl text-[13.5px] leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white resize-none"
          placeholder="Mô tả chi tiết triệu chứng, lịch sử bệnh, thuốc đang dùng..."
        />
      </div>
    </div>
  );
}

// ─── Step 1: Clinical Exam ────────────────────────────────────────────────────

function StepClinical({ bodySystems }: { bodySystems: AdminExamContext["options"]["bodySystems"] }) {
  const [systems, setSystems] = useState<BodySystem[]>(bodySystems);
  const [expandedId, setExpandedId] = useState<string | null>(bodySystems[0]?.id ?? null);

  const setStatus = (id: string, status: BodySystem["status"]) =>
    setSystems((ss) => ss.map((s) => s.id === id ? { ...s, status } : s));
  const setNote = (id: string, note: string) =>
    setSystems((ss) => ss.map((s) => s.id === id ? { ...s, note } : s));

  const statusCls = {
    normal:      "bg-emerald-50 border-emerald-200 text-emerald-700",
    abnormal:    "bg-red-50 border-red-200 text-red-700",
    not_checked: "bg-muted/60 border-border text-muted-foreground",
  };
  const statusLabel = {
    normal: "Bình thường", abnormal: "Bất thường", not_checked: "Chưa kiểm tra",
  };

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Hệ thống cơ quan</div>
      {systems.map((sys) => (
        <div key={sys.id} className={`rounded-xl border transition-all ${sys.status === "abnormal" ? "border-red-200 bg-red-50/30" : sys.status === "normal" ? "border-emerald-200/60 bg-white" : "border-border bg-white"}`}>
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(expandedId === sys.id ? null : sys.id)}>
            <div className="flex-1">
              <span className="text-[13.5px] font-semibold text-foreground">{sys.label}</span>
              {sys.note && sys.status === "abnormal" && (
                <div className="text-[12px] text-red-600 mt-0.5 line-clamp-1">{sys.note}</div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(["normal", "abnormal", "not_checked"] as const).map((s) => (
                <button key={s} onClick={(e) => { e.stopPropagation(); setStatus(sys.id, s); }}
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all ${sys.status === s ? statusCls[s] : "border-border bg-white text-muted-foreground hover:bg-muted"}`}>
                  {statusLabel[s]}
                </button>
              ))}
              <ChevronDown size={14} className={`text-muted-foreground transition-transform ${expandedId === sys.id ? "rotate-180" : ""}`} />
            </div>
          </div>
          {expandedId === sys.id && (
            <div className="px-4 pb-4">
              <textarea
                value={sys.note}
                onChange={(e) => setNote(sys.id, e.target.value)}
                rows={2}
                placeholder="Ghi chú kết quả khám..."
                className="w-full px-3 py-2.5 border border-border rounded-lg text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white resize-none"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 2: Diagnosis ────────────────────────────────────────────────────────

function StepDiagnosis() {
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [confidence, setConfidence] = useState<"confirmed" | "probable" | "differential">("confirmed");
  const [labs] = useState<Array<{ id: number; test: string; result: string; done: boolean }>>([]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Mức độ chẩn đoán</div>
        <div className="flex gap-2">
          {([
            { v: "confirmed",   label: "Xác định",          cls: "border-emerald-300 bg-emerald-50 text-emerald-700" },
            { v: "probable",    label: "Nghi ngờ chính",    cls: "border-cyan-300 bg-cyan-50 text-cyan-700" },
            { v: "differential", label: "Chẩn đoán phân biệt", cls: "border-amber-300 bg-amber-50 text-amber-700" },
          ] as const).map(({ v, label, cls }) => (
            <button key={v} onClick={() => setConfidence(v)}
              className={`px-4 py-2 rounded-lg border text-[13px] font-semibold transition-all ${confidence === v ? cls : "border-border bg-white text-muted-foreground hover:bg-muted"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Chẩn đoán chính</div>
        <input
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          className="w-full h-11 px-4 border border-border rounded-xl text-[14px] font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
          placeholder="Tên bệnh / tình trạng chẩn đoán..."
        />
      </div>

      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Chẩn đoán phụ / ghi chú</div>
        <textarea
          value={secondary}
          onChange={(e) => setSecondary(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 border border-border rounded-xl text-[13.5px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white resize-none"
        />
      </div>

      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Kết quả xét nghiệm / cận lâm sàng</div>
        <div className="space-y-2">
          {labs.map((lab) => (
            <div key={lab.id} className={`flex items-start gap-3 p-4 rounded-xl border ${lab.done ? "border-border bg-white" : "border-dashed border-slate-300 bg-slate-50"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${lab.done ? "bg-emerald-100" : "bg-muted"}`}>
                {lab.done ? <Check size={11} className="text-emerald-600" /> : <Clock size={11} className="text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-foreground">{lab.test}</div>
                {lab.done ? (
                  <div className="text-[12.5px] text-muted-foreground mt-0.5">{lab.result}</div>
                ) : (
                  <div className="text-[12px] text-muted-foreground italic mt-0.5">Chờ kết quả</div>
                )}
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${lab.done ? "bg-emerald-50 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                {lab.done ? "Có kết quả" : "Đang chờ"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Prescription ─────────────────────────────────────────────────────

function StepPrescription({ drugs: initialDrugs }: { drugs: Drug[] }) {
  const [drugs, setDrugs] = useState<Drug[]>(initialDrugs);
  const [instructions, setInstructions] = useState("");

  const removeDrug = (id: number) => setDrugs((ds) => ds.filter((d) => d.id !== id));
  const addDrug = () => setDrugs((ds) => [
    ...ds,
    { id: Date.now(), name: "", dose: "", frequency: "", duration: "", note: "" }
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Đơn thuốc</div>
        <button onClick={addDrug} className="flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline underline-offset-2">
          <Plus size={13} /> Thêm thuốc
        </button>
      </div>

      <div className="space-y-3">
        {drugs.map((drug, idx) => (
          <div key={drug.id} className="border border-border rounded-xl overflow-hidden bg-white">
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
              <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                {idx + 1}
              </div>
              <input
                value={drug.name}
                onChange={(e) => setDrugs((ds) => ds.map((d) => d.id === drug.id ? { ...d, name: e.target.value } : d))}
                placeholder="Tên thuốc..."
                className="flex-1 bg-transparent text-[14px] font-bold text-foreground focus:outline-none placeholder:text-muted-foreground"
              />
              <button onClick={() => removeDrug(drug.id)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-100 transition-colors">
                <X size={12} className="text-muted-foreground hover:text-red-500" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {[
                { field: "dose",      label: "Liều dùng",     placeholder: "VD: 1 viên / ngày" },
                { field: "frequency", label: "Thời điểm",     placeholder: "VD: Sáng sau ăn" },
                { field: "duration",  label: "Thời gian",     placeholder: "VD: 7 ngày" },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{label}</div>
                  <input
                    value={(drug as any)[field]}
                    onChange={(e) => setDrugs((ds) => ds.map((d) => d.id === drug.id ? { ...d, [field]: e.target.value } : d))}
                    placeholder={placeholder}
                    className="w-full h-8 px-3 border border-border rounded-lg text-[12.5px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
                  />
                </div>
              ))}
            </div>
            <div className="px-4 pb-4">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Ghi chú đặc biệt</div>
              <input
                value={drug.note}
                onChange={(e) => setDrugs((ds) => ds.map((d) => d.id === drug.id ? { ...d, note: e.target.value } : d))}
                placeholder="Cảnh báo, hướng dẫn thêm..."
                className="w-full h-8 px-3 border border-dashed border-amber-300 rounded-lg text-[12.5px] bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20 placeholder:text-amber-400/60"
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Hướng dẫn chăm sóc tại nhà</div>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-border rounded-xl text-[13.5px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white resize-none"
          placeholder="Hướng dẫn chế độ ăn, chăm sóc, điều kiện sinh hoạt..."
        />
      </div>
    </div>
  );
}

// ─── Step 4: Follow-up ────────────────────────────────────────────────────────

function StepFollowup() {
  const [days, setDays] = useState(14);
  const [preferred, setPreferred] = useState("09:00");
  const [note, setNote] = useState("");

  const followupDate = new Date();
  followupDate.setDate(followupDate.getDate() + days);
  const dateStr = followupDate.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

  const presets = [7, 10, 14, 21, 30];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Thời gian tái khám</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {presets.map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg border text-[13px] font-semibold transition-all ${days === d ? "bg-cyan-50 border-cyan-300 text-cyan-700" : "bg-white border-border text-muted-foreground hover:bg-muted"}`}>
              {d} ngày
            </button>
          ))}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-white">
            <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))}
              className="w-14 text-center text-[13px] font-mono font-bold text-foreground focus:outline-none" />
            <span className="text-[13px] text-muted-foreground">ngày (tuỳ chỉnh)</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-cyan-600" />
            </div>
            <div>
              <div className="text-[12px] text-cyan-600 font-semibold uppercase tracking-wide">Ngày tái khám dự kiến</div>
              <div className="text-[17px] font-bold text-cyan-900 mt-0.5">{dateStr}</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Giờ hẹn ưa thích</div>
        <div className="flex gap-2 flex-wrap">
          {["08:30", "09:00", "09:30", "10:00", "14:00", "14:30"].map((t) => (
            <button key={t} onClick={() => setPreferred(t)}
              className={`px-3 py-2 rounded-lg border font-mono text-[13px] font-semibold transition-all ${preferred === t ? "bg-cyan-50 border-cyan-300 text-cyan-700" : "bg-white border-border text-muted-foreground hover:bg-muted"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Mục tiêu tái khám</div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-border rounded-xl text-[13.5px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white resize-none"
        />
      </div>

      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <div className="flex items-start gap-3">
          <Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[13px] font-bold text-emerald-800">Sẵn sàng hoàn tất cuộc khám</div>
            <div className="text-[12px] text-emerald-700 mt-0.5">Nhấn "Hoàn thành & Lưu hồ sơ" để lưu toàn bộ thông tin và gửi thông báo tái khám đến chủ thú cưng.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ExamPage ─────────────────────────────────────────────────────────────────

export function ExamPage({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<ExamStep>(0);
  const [exam, setExam] = useState<AdminExamContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    adminService
      .getExamContext()
      .then((data) => {
        if (!mounted) return;
        setExam(data.exam);
        setLoadError("");
      })
      .catch((error) => {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : "Không thể tải dữ liệu khám.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background text-sm text-muted-foreground">
        Đang tải dữ liệu khám...
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background text-center">
        <div className="text-sm font-semibold text-foreground">Không có dữ liệu khám</div>
        {loadError && <div className="text-sm text-amber-600">{loadError}</div>}
        <button onClick={onBack} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">
          Quay lại lịch hẹn
        </button>
      </div>
    );
  }

  const stepComponents = [
    <StepSymptoms key="s0" symptoms={exam.options.symptoms} initialNote={exam.pet.note} />,
    <StepClinical key="s1" bodySystems={exam.options.bodySystems} />,
    <StepDiagnosis key="s2" />,
    <StepPrescription key="s3" drugs={exam.options.drugs} />,
    <StepFollowup key="s4" />,
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Exam header */}
      <div className="h-[52px] flex items-center justify-between px-6 bg-white border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} />
            <span>Lịch hẹn</span>
          </button>
          <ChevronRight size={13} className="text-muted-foreground/40" />
          <span className="text-[13px] font-semibold text-foreground">{exam.header.appointmentCode} · {exam.pet.name}</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">{exam.header.status}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-mono">
            <Clock size={12} /> {[exam.header.time, exam.header.room, exam.header.provider].filter(Boolean).join(" · ")}
          </div>
          <div className="w-px h-5 bg-border" />
          <button className="flex items-center gap-1.5 h-8 px-4 border border-border bg-white text-[13px] font-medium text-foreground rounded-lg hover:bg-muted transition-colors">
            <FileText size={13} /> Hồ sơ cũ
          </button>
          <button className="flex items-center gap-1.5 h-8 px-4 bg-primary text-primary-foreground text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity">
            Lưu hồ sơ
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — patient info */}
        <div className="w-[272px] flex-shrink-0 border-r border-border bg-white flex flex-col overflow-y-auto">
          {/* Allergy alert */}
          <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
            <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-red-600">Dị ứng</div>
              <div className="text-[12.5px] font-bold text-red-700">{exam.pet.note || "Không ghi nhận"}</div>
            </div>
          </div>

          {/* Pet info */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-[18px]">🐱</span>
              </div>
              <div>
                <div className="text-[17px] font-bold text-foreground">{exam.pet.name || "Chưa có tên"}</div>
                <div className="text-[12.5px] text-muted-foreground">{[exam.pet.breed, exam.pet.species, exam.pet.gender].filter(Boolean).join(" · ")}</div>
                <div className="text-[11.5px] text-muted-foreground font-mono mt-0.5">{exam.pet.weightKg ? `${exam.pet.weightKg} kg` : ""}</div>
              </div>
            </div>

            {/* Owner */}
            <div className="space-y-1.5 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Chủ sở hữu</span>
                <span className="font-semibold text-foreground">{exam.pet.owner}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">SĐT</span>
                <span className="font-mono text-foreground">{exam.pet.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Mã lịch hẹn</span>
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-foreground">{exam.header.appointmentCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dịch vụ</span>
                <span className="font-semibold text-foreground text-right">{exam.pet.service}</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-border mx-4" />

          {/* Vitals */}
          <div className="px-4 py-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Chỉ số sinh tồn</div>
            <div className="space-y-2">
              {exam.vitals.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
                  Chưa có chỉ số sinh tồn.
                </div>
              )}
              {exam.vitals.map((vital, index) => (
                <VitalChip
                  key={`${vital.label}-${index}`}
                  icon={index === 0 ? Thermometer : index === 1 ? Heart : index === 2 ? Wind : Weight}
                  label={vital.label}
                  value={vital.value}
                  unit={vital.unit}
                  state={vital.state}
                />
              ))}
            </div>
          </div>

          <div className="h-px bg-border mx-4" />

          {/* History */}
          <div className="px-4 py-4 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Lịch sử khám gần đây</div>
            <div className="space-y-2.5">
              {exam.history.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
                  Chưa có lịch sử khám.
                </div>
              )}
              {exam.history.map((h, i) => (
                <div key={i} className="border-l-2 border-slate-200 pl-3">
                  <div className="font-mono text-[11px] text-muted-foreground">{h.date}</div>
                  <div className="text-[12.5px] font-medium text-foreground">{h.service}</div>
                  <div className="text-[11.5px] text-muted-foreground">{h.outcome}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Step progress bar */}
          <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-border">
            <div className="flex items-center gap-0">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === step;
                const isDone = i < step;
                return (
                  <div key={i} className="flex items-center flex-1 last:flex-none">
                    <button
                      onClick={() => setStep(i as ExamStep)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isActive ? "bg-primary text-primary-foreground" : isDone ? "text-emerald-600 hover:bg-emerald-50" : "text-muted-foreground hover:bg-muted"}`}>
                      {isDone ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Check size={11} className="text-emerald-600" />
                        </div>
                      ) : (
                        <Icon size={14} className="flex-shrink-0" />
                      )}
                      <span className="text-[12.5px] font-semibold whitespace-nowrap">{s.label}</span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 mx-1 h-px ${i < step ? "bg-emerald-300" : "bg-border"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step content area */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="max-w-[760px] mx-auto">
              {stepComponents[step]}
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-border flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1) as ExamStep)}
              disabled={step === 0}
              className="flex items-center gap-1.5 h-9 px-5 border border-border rounded-lg text-[13px] font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              ← Quay lại
            </button>

            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-emerald-400" : "w-3 bg-border"}`} />
              ))}
            </div>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => Math.min(4, s + 1) as ExamStep)}
                className="flex items-center gap-1.5 h-9 px-5 bg-primary text-primary-foreground rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity">
                Tiếp theo →
              </button>
            ) : (
              <button className="flex items-center gap-1.5 h-9 px-6 bg-emerald-600 text-white rounded-lg text-[13px] font-semibold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20">
                <Check size={14} /> Hoàn thành & Lưu hồ sơ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
