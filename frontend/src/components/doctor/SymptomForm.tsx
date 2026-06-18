import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { DoctorExamDetail, DoctorExamRecord } from "../../services/doctorAppointments";

function DoctorSelectField({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: Array<{ label: string; value: string }>;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) ?? null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left text-[13px] font-semibold transition-all ${
          open ? "border-cyan-300 ring-2 ring-cyan-500/15" : "border-border hover:border-slate-300"
        }`}
      >
        <span className={selectedOption ? "truncate text-foreground" : "truncate text-muted-foreground"}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown size={16} className={`flex-shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex h-9 w-full items-center justify-between rounded-xl px-3 text-left text-[12px] font-semibold transition-colors ${
                    selected ? "bg-cyan-50 text-cyan-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {selected && <Check size={15} strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

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
    <div>
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
            <DoctorSelectField
              value={record.duration}
              options={schema.durationOptions}
              placeholder="Chọn..."
              onChange={(value) => patchRecord({ duration: value })}
            />
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
