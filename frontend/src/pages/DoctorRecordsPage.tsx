import { useState } from "react";
import {
  Search, Filter, ChevronRight, Calendar, Stethoscope,
  Thermometer, Heart, Wind, Activity, Weight,
  Pill, ClipboardList, AlertTriangle, CheckCircle2,
  FileText, User, Clock, ArrowLeft, Printer, Download,
} from "lucide-react";

// ── Pet photos ─────────────────────────────────────────────────────────────────
const PET_PHOTOS: Record<string, string> = {
  Luna:     "https://images.unsplash.com/photo-1570723649488-f5cc599360ac?w=400&q=80",
  Mochi:    "https://images.unsplash.com/photo-1611250282006-4484dd3fba6b?w=400&q=80",
  Kiwi:     "https://images.unsplash.com/photo-1611843275167-a9bba9aa65dd?w=400&q=80",
  Snowball: "https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=400&q=80",
  Nala:     "https://images.unsplash.com/photo-1559624989-7b9303bd9792?w=400&q=80",
  Buddy:    "https://images.unsplash.com/photo-1602241628512-459cdd3234fe?w=400&q=80",
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface Vital { temp: string; heart: string; resp: string; spo2: string; weight: string }

interface SysResult { system: string; status: "normal" | "abnormal"; note?: string }

interface Prescription {
  drug: string; dose: string; route: string; frequency: string; duration: string;
}

interface MedRecord {
  id: string;
  date: string;
  dateShort: string;
  pet: string;
  species: string;
  breed: string;
  owner: string;
  phone: string;
  sex: string;
  age: string;
  weight: string;
  doctor: string;
  service: string;
  serviceColor: string;
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  onset: string;
  severity: number;
  vitals: Vital;
  sysResults: SysResult[];
  diagnosis: string;
  diagnosisCode: string;
  clinicalNote: string;
  prescriptions: Prescription[];
  followUp: string;
  followUpDate: string;
  allergy: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────────
const RECORDS: MedRecord[] = [
  {
    id: "MR-2026-0412",
    date: "Thứ Tư, 22 tháng 5 năm 2026",
    dateShort: "22/05/2026",
    pet: "Luna",         species: "Mèo", breed: "British Shorthair",
    owner: "Trần Minh Khoa", phone: "0901 234 567",
    sex: "Cái", age: "2 tuổi 4 tháng", weight: "4.2 kg",
    doctor: "BS. Trần Hoài Nam", service: "Khám da liễu", serviceColor: "bg-violet-100 text-violet-700",
    chiefComplaint: "Mèo bị ngứa, cào liên tục vùng cổ và lưng, lông rụng từng mảng nhỏ trong 2 tuần qua.",
    symptoms: ["Ngứa da", "Rụng lông", "Bỏ ăn"],
    duration: "1–2 tuần", onset: "Từ từ", severity: 3,
    vitals: { temp: "38.9", heart: "168", resp: "28", spo2: "98", weight: "4.2" },
    sysResults: [
      { system: "Tổng thể",         status: "normal" },
      { system: "Da & Lông",        status: "abnormal", note: "Rụng lông vùng cổ và lưng, da đỏ ửng, có vết trầy xước do cào. Gàu nhỏ quan sát được." },
      { system: "Mắt & Tai",        status: "normal" },
      { system: "Hạch bạch huyết",  status: "normal" },
      { system: "Tim mạch",         status: "normal" },
      { system: "Hô hấp",           status: "normal" },
      { system: "Tiêu hoá",         status: "normal" },
      { system: "Cơ xương khớp",    status: "normal" },
    ],
    diagnosis: "Viêm da dị ứng (Allergic Dermatitis)",
    diagnosisCode: "ICD-10: L23",
    clinicalNote: "Nghi ngờ dị ứng thức ăn hoặc môi trường. Khuyến nghị đổi sang thức ăn thuỷ phân protein trong 8 tuần. Theo dõi phản ứng và tái khám sau 3 tuần.",
    prescriptions: [
      { drug: "Prednisolone",       dose: "5mg",    route: "Uống", frequency: "1 lần/ngày", duration: "7 ngày" },
      { drug: "Chlorphenamine",     dose: "2mg",    route: "Uống", frequency: "2 lần/ngày", duration: "14 ngày" },
      { drug: "Shampoo Malaseb",    dose: "Dùng ngoài", route: "Tắm", frequency: "2 lần/tuần", duration: "4 tuần" },
    ],
    followUp: "Tái khám kiểm tra da, đánh giá phản ứng với thuốc và thức ăn mới.",
    followUpDate: "12/06/2026",
    allergy: "Penicillin · Thức ăn hải sản",
  },
  {
    id: "MR-2026-0389",
    date: "Thứ Tư, 12 tháng 3 năm 2026",
    dateShort: "12/03/2026",
    pet: "Mochi",        species: "Chó", breed: "Golden Retriever",
    owner: "Nguyễn Thị Mai", phone: "0912 345 678",
    sex: "Đực", age: "3 tuổi 1 tháng", weight: "28.5 kg",
    doctor: "BS. Trần Hoài Nam", service: "Khám tổng quát", serviceColor: "bg-cyan-100 text-cyan-700",
    chiefComplaint: "Khám định kỳ hàng quý, chủ nhân phản ánh chó hay bị đầy bụng sau ăn.",
    symptoms: ["Bỏ ăn", "Đau bụng"],
    duration: "3–7 ngày", onset: "Từ từ", severity: 2,
    vitals: { temp: "38.4", heart: "92", resp: "22", spo2: "99", weight: "28.5" },
    sysResults: [
      { system: "Tổng thể",         status: "normal" },
      { system: "Da & Lông",        status: "normal" },
      { system: "Mắt & Tai",        status: "normal" },
      { system: "Hạch bạch huyết",  status: "normal" },
      { system: "Tim mạch",         status: "normal" },
      { system: "Hô hấp",           status: "normal" },
      { system: "Tiêu hoá",         status: "abnormal", note: "Bụng có âm thanh nhu động tăng, sờ vùng thượng vị có phản ứng nhẹ. Không có đau cấp tính." },
      { system: "Cơ xương khớp",    status: "normal" },
    ],
    diagnosis: "Rối loạn tiêu hoá nhẹ (Mild GI Disturbance)",
    diagnosisCode: "ICD-10: K30",
    clinicalNote: "Khuyến nghị chia nhỏ bữa ăn thành 3 lần/ngày, tránh thức ăn giàu chất béo. Bổ sung men tiêu hoá. Xét nghiệm phân nếu không cải thiện sau 2 tuần.",
    prescriptions: [
      { drug: "Probiotic FortiFlora", dose: "1 gói", route: "Trộn thức ăn", frequency: "1 lần/ngày", duration: "30 ngày" },
      { drug: "Simethicone",          dose: "40mg",   route: "Uống",         frequency: "2 lần/ngày", duration: "7 ngày" },
    ],
    followUp: "Xét nghiệm phân nếu triệu chứng không giảm. Tái khám định kỳ sau 3 tháng.",
    followUpDate: "12/06/2026",
    allergy: "Không ghi nhận",
  },
  {
    id: "MR-2026-0341",
    date: "Thứ Hai, 05 tháng 1 năm 2026",
    dateShort: "05/01/2026",
    pet: "Kiwi",         species: "Mèo", breed: "Scottish Fold",
    owner: "Phạm Văn Đức", phone: "0908 765 432",
    sex: "Đực", age: "4 tuổi", weight: "5.1 kg",
    doctor: "BS. Lê Thị Hoa", service: "Tiêm phòng dại", serviceColor: "bg-emerald-100 text-emerald-700",
    chiefComplaint: "Tiêm phòng dại định kỳ hàng năm. Mèo khoẻ mạnh, không có triệu chứng bất thường.",
    symptoms: [],
    duration: "Không có", onset: "Không có", severity: 0,
    vitals: { temp: "38.6", heart: "155", resp: "24", spo2: "99", weight: "5.1" },
    sysResults: [
      { system: "Tổng thể",         status: "normal" },
      { system: "Da & Lông",        status: "normal" },
      { system: "Mắt & Tai",        status: "normal" },
      { system: "Hạch bạch huyết",  status: "normal" },
      { system: "Tim mạch",         status: "normal" },
      { system: "Hô hấp",           status: "normal" },
      { system: "Tiêu hoá",         status: "normal" },
      { system: "Cơ xương khớp",    status: "normal" },
    ],
    diagnosis: "Khoẻ mạnh — Tiêm phòng định kỳ",
    diagnosisCode: "ICD-10: Z23",
    clinicalNote: "Tiêm vaccine Rabies 1 mũi. Mèo phản ứng tốt, không có dấu hiệu phản ứng dị ứng sau 15 phút theo dõi tại chỗ. Cấp giấy chứng nhận tiêm phòng.",
    prescriptions: [
      { drug: "Vaccine Rabies (Nobivac)", dose: "1 mL", route: "Tiêm dưới da", frequency: "1 lần", duration: "Hiệu lực 1 năm" },
    ],
    followUp: "Nhắc tiêm phòng lại vào tháng 01/2027. Tiêm combo FVRCP định kỳ tháng 03/2026.",
    followUpDate: "05/01/2027",
    allergy: "Không ghi nhận",
  },
  {
    id: "MR-2025-1198",
    date: "Thứ Sáu, 14 tháng 11 năm 2025",
    dateShort: "14/11/2025",
    pet: "Snowball",     species: "Mèo", breed: "Persian",
    owner: "Đặng Quốc Hùng", phone: "0977 111 222",
    sex: "Cái", age: "5 tuổi 8 tháng", weight: "4.8 kg",
    doctor: "BS. Nguyễn Đức Trung", service: "Khám tổng quát", serviceColor: "bg-cyan-100 text-cyan-700",
    chiefComplaint: "Mèo ho kéo dài 5 ngày, có đờm, ăn ít hơn bình thường.",
    symptoms: ["Ho", "Bỏ ăn", "Mệt mỏi"],
    duration: "3–7 ngày", onset: "Đột ngột", severity: 3,
    vitals: { temp: "39.2", heart: "172", resp: "36", spo2: "96", weight: "4.8" },
    sysResults: [
      { system: "Tổng thể",         status: "abnormal", note: "Mèo kém linh hoạt, mệt mỏi rõ." },
      { system: "Da & Lông",        status: "normal" },
      { system: "Mắt & Tai",        status: "normal" },
      { system: "Hạch bạch huyết",  status: "normal" },
      { system: "Tim mạch",         status: "normal" },
      { system: "Hô hấp",           status: "abnormal", note: "Âm phổi thô, nghe thấy ran ẩm nhẹ vùng thuỳ phổi trái. Nhịp thở tăng 36 lần/phút." },
      { system: "Tiêu hoá",         status: "normal" },
      { system: "Cơ xương khớp",    status: "normal" },
    ],
    diagnosis: "Viêm phế quản cấp (Acute Bronchitis)",
    diagnosisCode: "ICD-10: J20",
    clinicalNote: "Nhiệt độ tăng 39.2°C, nhịp thở tăng. Nghe phổi có ran ẩm. Kê kháng sinh và thuốc long đờm. Theo dõi thân nhiệt tại nhà, tái khám nếu sốt > 39.5°C hoặc khó thở tăng.",
    prescriptions: [
      { drug: "Doxycycline",    dose: "50mg",  route: "Uống", frequency: "1 lần/ngày", duration: "10 ngày" },
      { drug: "Bromhexine",     dose: "4mg",   route: "Uống", frequency: "2 lần/ngày", duration: "7 ngày" },
      { drug: "Paracetamol",    dose: "10mg/kg", route: "Uống", frequency: "Khi sốt > 39°C", duration: "Theo dõi" },
    ],
    followUp: "Tái khám sau 5 ngày hoặc sớm hơn nếu triệu chứng nặng thêm.",
    followUpDate: "19/11/2025",
    allergy: "Không ghi nhận",
  },
];

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
  const photo = PET_PHOTOS[rec.pet];

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
  const [selected, setSelected] = useState<MedRecord | null>(RECORDS[0]);

  const filtered = RECORDS.filter((r) => {
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
              const photo = PET_PHOTOS[r.pet];
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
          <p className="text-[11px] text-muted-foreground">{RECORDS.length} hồ sơ</p>
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

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-6">
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
                const photo = PET_PHOTOS[r.pet];
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
      </div>
    </div>
  );
}
