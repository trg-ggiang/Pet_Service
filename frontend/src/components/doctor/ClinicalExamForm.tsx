import type { DoctorExamDetail, DoctorExamRecord, ExamSystemEntry } from "../../services/doctorAppointments";
import { VitalInput } from "./VitalInput";
import { SystemRow } from "./SystemRow";
import { PrescriptionForm } from "./PrescriptionForm";

export function ClinicalExamForm({
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

  const prescriptions = record.prescriptions ?? [];

  function updateVital(key: keyof DoctorExamRecord["vitals"], value: string) {
    patchRecord({ vitals: { ...record.vitals, [key]: value } });
  }

  function updateSystem(systemId: string, entry: ExamSystemEntry) {
    patchRecord({ systems: { ...record.systems, [systemId]: entry } });
  }

  return (
    <div className="p-5 flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-bold text-foreground mb-0.5">Khám lâm sàng</h3>
        <p className="text-[12px] text-muted-foreground">Đo lường sinh hiệu và khám từng hệ cơ quan.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
          Sinh hiệu
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {schema.vitalFields.map((field) => (
            <div key={field.key} className={field.key === "weight" ? "col-span-2" : undefined}>
              <VitalInput
                field={field}
                value={record.vitals[field.key]}
                onChange={(value) => updateVital(field.key, value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
          Khám theo hệ cơ quan
        </label>
        <div className="flex flex-col gap-2">
          {schema.bodySystems.map((system) => (
            <SystemRow
              key={system.id}
              label={system.label}
              statusOptions={schema.systemStatusOptions}
              entry={record.systems[system.id] ?? { status: "not_examined", notes: "" }}
              onChange={(entry) => updateSystem(system.id, entry)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
          Nhận xét lâm sàng / chẩn đoán sơ bộ
        </label>
        <textarea
          rows={4}
          value={record.clinicalNote}
          onChange={(event) => patchRecord({ clinicalNote: event.target.value })}
          placeholder="Nhận xét tổng thể, chẩn đoán sơ bộ, kế hoạch điều trị..."
          className="w-full px-3.5 py-3 bg-white border border-border rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all resize-none"
        />
      </div>

      <PrescriptionForm
        prescriptions={prescriptions}
        onChange={(prescriptions) => patchRecord({ prescriptions })}
      />
    </div>
  );
}
