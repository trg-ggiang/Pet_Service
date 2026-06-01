import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Heart,
  Pill,
  Printer,
  Stethoscope,
  Thermometer,
  Weight,
  Wind,
} from "lucide-react";
import type { DoctorMedicalRecord } from "../../features/doctor/services/doctorData";

const DEFAULT_PET_PHOTO = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80";
const SEVERITY_LABEL = ["", "Rất nhẹ", "Nhẹ", "Trung bình", "Nặng", "Rất nặng"];
const SEVERITY_COLOR = ["", "text-emerald-600", "text-lime-600", "text-amber-600", "text-orange-600", "text-red-600"];
const SEVERITY_BG = ["", "bg-emerald-50 text-emerald-700", "bg-lime-50 text-lime-700", "bg-amber-50 text-amber-700", "bg-orange-50 text-orange-700", "bg-red-50 text-red-600"];

function VitalChip({ icon: Icon, label, value, unit, color, bg }: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  color: string;
  bg: string;
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

export function DoctorRecordDetail({ record, onClose }: { record: DoctorMedicalRecord; onClose: () => void }) {
  const photo = record.petImage || DEFAULT_PET_PHOTO;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      <div className="flex-shrink-0 bg-white border-b border-border px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Danh sách
          </button>
          <div className="w-px h-4 bg-border" />
          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{record.id}</span>
          <span className="text-[12px] text-muted-foreground">{record.dateShort}</span>
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

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-border overflow-hidden flex">
            <div className="relative w-36 flex-shrink-0">
              <img src={photo} alt={record.pet} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
            </div>
            <div className="flex-1 px-5 py-4 flex flex-col justify-center gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-foreground">{record.pet}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${record.serviceColor}`}>{record.service}</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-0.5">{record.species} · {record.breed} · {record.sex}</p>
                </div>
                {record.allergy !== "Không ghi nhận" && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl flex-shrink-0">
                    <AlertTriangle size={12} className="text-red-500" />
                    <span className="text-[11px] font-bold text-red-600">Dị ứng: {record.allergy}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-5 flex-wrap">
                {[
                  { label: "Tuổi", value: record.age },
                  { label: "Cân nặng", value: record.weight },
                  { label: "Chủ nhân", value: record.owner },
                  { label: "SĐT", value: record.phone },
                  { label: "Bác sĩ", value: record.doctor },
                  { label: "Ngày khám", value: record.dateShort },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
                    <div className="text-[13px] font-semibold text-foreground">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-5">
              <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <ClipboardList size={14} className="text-cyan-500" />
                  Triệu chứng & Lý do khám
                </h3>
                <p className="text-[13px] text-foreground leading-relaxed">{record.chiefComplaint}</p>
                {record.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {record.symptoms.map((symptom) => (
                      <span key={symptom} className="px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-[12px] font-semibold text-cyan-700">{symptom}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 pt-1">
                  {record.duration !== "Không có" && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Thời gian</span>
                      <p className="text-[12px] font-semibold text-foreground">{record.duration}</p>
                    </div>
                  )}
                  {record.onset !== "Không có" && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Khởi phát</span>
                      <p className="text-[12px] font-semibold text-foreground">{record.onset}</p>
                    </div>
                  )}
                  {record.severity > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mức độ</span>
                      <span className={`mt-0.5 flex items-center text-[12px] font-bold ${SEVERITY_COLOR[record.severity]}`}>
                        {SEVERITY_LABEL[record.severity]}
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${SEVERITY_BG[record.severity]}`}>
                          {record.severity}/5
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <Activity size={14} className="text-cyan-500" />
                  Sinh hiệu
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <VitalChip icon={Thermometer} label="Nhiệt độ" value={record.vitals.temp} unit="°C" color="text-orange-500" bg="bg-orange-50/60" />
                  <VitalChip icon={Heart} label="Nhịp tim" value={record.vitals.heart} unit="lần/ph" color="text-red-500" bg="bg-red-50/60" />
                  <VitalChip icon={Wind} label="Nhịp thở" value={record.vitals.resp} unit="lần/ph" color="text-cyan-500" bg="bg-cyan-50/60" />
                  <VitalChip icon={Activity} label="SpO₂" value={record.vitals.spo2} unit="%" color="text-violet-500" bg="bg-violet-50/60" />
                </div>
                <VitalChip icon={Weight} label="Cân nặng" value={record.vitals.weight} unit="kg" color="text-emerald-600" bg="bg-emerald-50/60" />
              </div>

              <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-2.5">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <Calendar size={14} className="text-cyan-500" />
                  Lịch tái khám
                </h3>
                <div className="flex items-start gap-3 p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                  <Clock size={14} className="text-cyan-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-bold text-cyan-800">{record.followUpDate}</p>
                    <p className="text-[12px] text-cyan-700 mt-0.5 leading-relaxed">{record.followUp}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <Stethoscope size={14} className="text-cyan-500" />
                  Khám lâm sàng theo hệ cơ quan
                </h3>
                <div className="flex flex-col gap-1.5">
                  {record.sysResults.map((system) => (
                    <div key={system.system} className={`rounded-xl border overflow-hidden ${system.status === "abnormal" ? "border-red-200" : "border-border"}`}>
                      <div className={`flex items-center gap-3 px-3.5 py-2 ${system.status === "abnormal" ? "bg-red-50/60" : ""}`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${system.status === "normal" ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className="text-[12px] font-semibold text-foreground flex-1">{system.system}</span>
                        <span className={`text-[11px] font-bold ${system.status === "normal" ? "text-emerald-600" : "text-red-600"}`}>
                          {system.status === "normal" ? "Bình thường" : "Bất thường"}
                        </span>
                      </div>
                      {system.note && (
                        <div className="px-3.5 pb-2.5 bg-red-50/40">
                          <p className="text-[11px] text-red-700 leading-relaxed">{system.note}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <FileText size={14} className="text-cyan-500" />
                  Chẩn đoán & Ghi chú
                </h3>
                <div className="p-3 bg-slate-50 rounded-xl border border-border">
                  <p className="text-[13px] font-bold text-foreground">{record.diagnosis}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{record.diagnosisCode}</p>
                </div>
                <p className="text-[12px] text-foreground leading-relaxed">{record.clinicalNote}</p>
              </div>

              <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <Pill size={14} className="text-cyan-500" />
                  Đơn thuốc
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-[11px] font-bold">{record.prescriptions.length} thuốc</span>
                </h3>
                <div className="flex flex-col gap-2">
                  {record.prescriptions.map((rx, index) => (
                    <div key={`${rx.drug}-${index}`} className="flex items-start gap-3 px-3.5 py-3 bg-slate-50 rounded-xl border border-border">
                      <div className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-cyan-700">{index + 1}</span>
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
