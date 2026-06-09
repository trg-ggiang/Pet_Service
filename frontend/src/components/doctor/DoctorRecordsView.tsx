import { useState } from "react";
import { Calendar, Check, ChevronDown, Loader2, Search } from "lucide-react";
import type { DoctorMedicalRecord } from "../../features/doctor/services/doctorData";

const DEFAULT_PET_PHOTO = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80";

const SPECIES_FILTER_OPTIONS = [
  { label: "Tất cả", value: "all" },
  { label: "Chó", value: "Chó" },
  { label: "Mèo", value: "Mèo" },
];

export interface DoctorPatientRecords {
  id: string;
  name: string;
  image: string | null;
  species: string;
  breed: string;
  owner: string;
  phone: string;
  allergy: string;
  latestDate: string;
  recordCount: number;
  records: DoctorMedicalRecord[];
}

export function DoctorRecordsToolbar({
  total,
  search,
  speciesFilter,
  onSearchChange,
  onSpeciesFilterChange,
}: {
  total: number;
  search: string;
  speciesFilter: string;
  onSearchChange: (value: string) => void;
  onSpeciesFilterChange: (value: string) => void;
}) {
  const [speciesOpen, setSpeciesOpen] = useState(false);
  const selectedSpecies = SPECIES_FILTER_OPTIONS.find((option) => option.value === speciesFilter)
    || SPECIES_FILTER_OPTIONS[0];

  return (
    <div className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-border">
      <div>
        <h2 className="text-sm font-bold text-foreground">Hồ sơ bệnh án</h2>
        <p className="text-[11px] text-muted-foreground">{total} thú cưng</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-36">
          <button
            type="button"
            onClick={() => setSpeciesOpen((current) => !current)}
            className={`flex h-9 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left text-[12px] font-bold transition-all ${
              speciesOpen ? "border-cyan-300 ring-2 ring-cyan-500/15" : "border-border hover:border-slate-300"
            }`}
          >
            <span className="truncate text-foreground">{selectedSpecies.label}</span>
            <ChevronDown size={15} className={`flex-shrink-0 text-slate-500 transition-transform ${speciesOpen ? "rotate-180" : ""}`} />
          </button>

          {speciesOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setSpeciesOpen(false)} />
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                {SPECIES_FILTER_OPTIONS.map((option) => {
                  const selected = option.value === speciesFilter;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onSpeciesFilterChange(option.value);
                        setSpeciesOpen(false);
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

        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm thú cưng, chủ nhân, SĐT..."
            className="w-64 h-9 pl-8 pr-4 bg-slate-50 border border-border rounded-xl text-[12px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

export function DoctorRecordsLoading({ text }: { text: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
      <Loader2 size={22} className="animate-spin text-cyan-500 mr-2" />
      {text}
    </div>
  );
}

export function DoctorRecordsError({ message }: { message: string }) {
  return <div className="flex-1 flex items-center justify-center text-sm text-red-600">{message}</div>;
}

export function DoctorRecordsPetList({
  patients,
  selectedId,
  onSelect,
}: {
  patients: DoctorPatientRecords[];
  selectedId: string;
  onSelect: (patient: DoctorPatientRecords) => void;
}) {
  return (
    <aside className="w-[320px] flex-shrink-0 bg-white border-r border-border flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          Danh sách thú cưng
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-border/70">
        {patients.map((patient) => {
          const photo = patient.image || DEFAULT_PET_PHOTO;
          const active = selectedId === patient.id;
          return (
            <button
              key={patient.id}
              onClick={() => onSelect(patient)}
              className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                active ? "bg-cyan-50 border-l-2 border-cyan-400" : "hover:bg-muted/40 border-l-2 border-transparent"
              }`}
            >
              <img src={photo} alt={patient.name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[13px] font-bold truncate ${active ? "text-cyan-700" : "text-foreground"}`}>
                    {patient.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{patient.latestDate}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{patient.species} · {patient.breed}</p>
                <p className="text-[11px] text-muted-foreground truncate">Chủ: {patient.owner}</p>
                <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                  {patient.recordCount} lần khám
                </span>
              </div>
            </button>
          );
        })}
        {patients.length === 0 && (
          <div className="px-6 py-16 text-center text-muted-foreground text-sm">
            Không tìm thấy thú cưng phù hợp
          </div>
        )}
      </div>
    </aside>
  );
}

export function DoctorRecordsHistory({
  patient,
  onSelectRecord,
}: {
  patient: DoctorPatientRecords | null;
  onSelectRecord: (record: DoctorMedicalRecord) => void;
}) {
  if (!patient) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Chọn một thú cưng để xem lịch sử khám.
      </div>
    );
  }

  const photo = patient.image || DEFAULT_PET_PHOTO;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-5">
        <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4">
          <img src={photo} alt={patient.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg font-bold text-foreground">{patient.name}</h3>
              <span className="px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-[11px] font-bold">
                {patient.recordCount} lần khám
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {patient.species} · {patient.breed} · Chủ: {patient.owner} · {patient.phone || "Chưa có SĐT"}
            </p>
            {patient.allergy && patient.allergy !== "Không ghi nhận" && (
              <p className="text-[12px] text-red-600 font-semibold mt-1">Dị ứng: {patient.allergy}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {patient.records.map((record) => (
            <article
              key={record.id}
              onClick={() => onSelectRecord(record)}
              className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-3 hover:border-cyan-400 hover:shadow-sm cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-cyan-600" />
                    <span className="text-[13px] font-bold text-foreground">{record.dateShort}</span>
                    <span className="text-[11px] font-mono text-muted-foreground">{record.id}</span>
                  </div>
                  <h4 className="text-[15px] font-bold text-foreground mt-2">{record.diagnosis}</h4>
                  <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{record.clinicalNote}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 ${record.serviceColor}`}>
                  {record.service}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 border border-border px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Lý do khám</div>
                  <div className="text-[12px] font-semibold text-foreground mt-0.5 line-clamp-2">{record.chiefComplaint}</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-border px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bác sĩ</div>
                  <div className="text-[12px] font-semibold text-foreground mt-0.5">{record.doctor}</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-border px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Đơn thuốc</div>
                  <div className="text-[12px] font-semibold text-foreground mt-0.5">{record.prescriptions.length} thuốc</div>
                </div>
              </div>

              {record.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {record.symptoms.map((symptom) => (
                    <span key={symptom} className="px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-[12px] font-semibold text-cyan-700">
                      {symptom}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
