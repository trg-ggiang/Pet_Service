import type { DoctorExamDetail, DoctorExamRecord } from "../../services/doctorAppointments";

export function SymptomForm({
  schema,
  record,
  onChange,
}: {
  schema: DoctorExamDetail["formSchema"];
  record: DoctorExamRecord;
  onChange: (record: DoctorExamRecord) => void;
}) {
  function patchRecord(patch: Partial<DoctorExamRecord>) {
    onChange({ ...record, ...patch });
  }

  function toggleSymptom(label: string) {
    const selectedSymptoms = record.selectedSymptoms.includes(label)
      ? record.selectedSymptoms.filter((item) => item !== label)
      : [...record.selectedSymptoms, label];

    patchRecord({ selectedSymptoms });
  }

  const severityLabel = schema.severityOptions.find(
    (option) => option.value === String(record.severity),
  )?.label;

  return (
    <div className="overflow-y-auto border-r border-border">
      <div className="p-5 flex flex-col gap-5">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-0.5">Triệu chứng</h3>
          <p className="text-[12px] text-muted-foreground">
            Ghi nhận triệu chứng từ chủ nhân và quan sát ban đầu.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
            Lý do đến khám
          </label>
          <textarea
            rows={3}
            value={record.chiefComplaint}
            onChange={(event) => patchRecord({ chiefComplaint: event.target.value })}
            placeholder="Mô tả lý do chính đưa thú cưng đến khám..."
            className="w-full px-3.5 py-3 bg-white border border-border rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
            Triệu chứng ghi nhận
          </label>
          <div className="flex flex-wrap gap-2">
            {schema.symptomOptions.map((symptom) => {
              const active = record.selectedSymptoms.includes(symptom.label);
              return (
                <button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.label)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                    active
                      ? "bg-cyan-50 border-cyan-300 text-cyan-700 shadow-sm"
                      : "bg-white border-border text-muted-foreground hover:border-cyan-200 hover:text-foreground"
                  }`}
                >
                  {active && <span className="mr-1">✓</span>}
                  {symptom.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
              Thời gian xuất hiện
            </label>
            <select
              value={record.duration}
              onChange={(event) => patchRecord({ duration: event.target.value })}
              className="h-10 px-3 bg-white border border-border rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
            >
              <option value="">Chọn...</option>
              {schema.durationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
              Khởi phát
            </label>
            <div className="flex gap-2">
              {schema.onsetOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => patchRecord({ onset: option.value })}
                  className={`flex-1 h-10 rounded-xl border text-[12px] font-semibold transition-all ${
                    record.onset === option.value
                      ? "bg-cyan-50 border-cyan-300 text-cyan-700"
                      : "bg-white border-border text-muted-foreground hover:border-cyan-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
              Mức độ nghiêm trọng
            </label>
            {record.severity > 0 && (
              <span className="text-[12px] font-bold text-cyan-700">
                {severityLabel || `Mức ${record.severity}/5`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {schema.severityOptions.map((option) => {
              const value = Number(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => patchRecord({ severity: value })}
                  className={`flex-1 h-8 rounded-lg border-2 text-[11px] font-bold transition-all ${
                    record.severity >= value
                      ? "bg-cyan-50 border-cyan-400 text-cyan-700"
                      : "border-border bg-white text-muted-foreground hover:border-slate-300"
                  }`}
                >
                  {option.value}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
            Mô tả từ chủ nhân
          </label>
          <textarea
            rows={4}
            value={record.ownerNotes}
            onChange={(event) => patchRecord({ ownerNotes: event.target.value })}
            placeholder="Ghi lại những gì chủ nhân chia sẻ thêm về tình trạng thú cưng..."
            className="w-full px-3.5 py-3 bg-white border border-border rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}
