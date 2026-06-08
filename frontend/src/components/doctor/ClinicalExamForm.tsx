import type { DoctorExamDetail, DoctorExamRecord, ExamSystemEntry } from "../../services/doctorAppointments";
import { VitalInput } from "./VitalInput";
import { SystemRow } from "./SystemRow";
import { PrescriptionForm } from "./PrescriptionForm";

function getTodayValue() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function getCurrentTimeValue() {
  const now = new Date();
  return String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
}

const FOLLOW_UP_TIME_OPTIONS = Array.from({ length: 22 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
});

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
    patchRecord({
      vitals: {
        ...record.vitals,
        [key]: value,
      },
    });
  }

  function updateSystem(systemId: string, entry: ExamSystemEntry) {
    patchRecord({
      systems: {
        ...record.systems,
        [systemId]: entry,
      },
    });
  }

  const today = getTodayValue();
  const minTime = record.nextVisitDate === today ? getCurrentTimeValue() : "";
  const timeOptions = FOLLOW_UP_TIME_OPTIONS.filter((time) => !minTime || time > minTime);

  return (
    <div className="overflow-y-auto">
      <div className="p-5 flex flex-col gap-5">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-0.5">Khám lâm sàng</h3>
          <p className="text-[12px] text-muted-foreground">
            Đo lường sinh hiệu và khám từng hệ cơ quan.
          </p>
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

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
              Ngày tái khám dự kiến
            </label>
            <input
              type="date"
              min={today}
              value={record.nextVisitDate ?? ""}
              onChange={(event) => patchRecord({ nextVisitDate: event.target.value || null, nextVisitTime: "" })}
              className="h-10 px-3 bg-white border border-border rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
              Giờ tái khám dự kiến
            </label>
            <select
              disabled={!record.nextVisitDate || timeOptions.length === 0}
              value={record.nextVisitTime ?? ""}
              onChange={(event) => patchRecord({ nextVisitTime: event.target.value })}
              className="h-10 px-3 bg-white border border-border rounded-xl text-[13px] text-foreground disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
            >
              <option value="">Chọn giờ</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
