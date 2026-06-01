import { Search, Filter, ChevronRight, Calendar, User, Loader2 } from "lucide-react";
import type { DoctorMedicalRecord } from "../../features/doctor/services/doctorData";

const DEFAULT_PET_PHOTO = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80";

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
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-border">
      <div>
        <h2 className="text-sm font-bold text-foreground">Hồ sơ bệnh án</h2>
        <p className="text-[11px] text-muted-foreground">{total} ho so</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {["all", "Chó", "Mèo"].map((filter) => (
            <button
              key={filter}
              onClick={() => onSpeciesFilterChange(filter)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                speciesFilter === filter ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter === "all" ? "Tất cả" : filter}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm tên, chủ nhân, chẩn đoán..."
            className="w-60 h-9 pl-8 pr-4 bg-slate-50 border border-border rounded-xl text-[12px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
          />
        </div>
        <button className="flex items-center gap-1.5 h-9 px-3 border border-border rounded-xl text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
          <Filter size={13} /> Lọc
        </button>
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

export function DoctorRecordsTable({
  records,
  onSelect,
}: {
  records: DoctorMedicalRecord[];
  onSelect: (record: DoctorMedicalRecord) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-border">
              {["Thú cưng", "Chủ nhân", "Dịch vụ", "Chẩn đoán", "Bác sĩ", "Ngày khám"].map((header, index) => (
                <th key={header} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-left ${index === 0 ? "pl-5" : ""}`}>
                  {header}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {records.map((record) => {
              const photo = record.petImage || DEFAULT_PET_PHOTO;
              return (
                <tr
                  key={record.id}
                  onClick={() => onSelect(record)}
                  className="hover:bg-slate-50/80 cursor-pointer group transition-colors"
                >
                  <td className="pl-5 pr-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <img src={photo} alt={record.pet} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                      <div>
                        <div className="text-[13px] font-bold text-foreground">{record.pet}</div>
                        <div className="text-[11px] text-muted-foreground">{record.species} · {record.breed}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0">
                        <User size={11} className="text-white" />
                      </div>
                      <span className="text-[13px] text-foreground font-medium">{record.owner}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${record.serviceColor}`}>{record.service}</span>
                  </td>
                  <td className="px-4 py-3.5 max-w-[220px]">
                    <div className="text-[13px] font-semibold text-foreground truncate">{record.diagnosis}</div>
                    <div className="text-[11px] font-mono text-muted-foreground/60 mt-0.5">{record.id}</div>
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-muted-foreground font-medium">{record.doctor}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-muted-foreground" />
                      <span className="text-[12px] text-foreground font-medium">{record.dateShort}</span>
                    </div>
                  </td>
                  <td className="pr-4 py-3.5">
                    <ChevronRight size={15} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              );
            })}
            {records.length === 0 && (
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
  );
}

export function DoctorRecordsSideList({
  records,
  selectedId,
  search,
  onSearchChange,
  onSelect,
}: {
  records: DoctorMedicalRecord[];
  selectedId: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (record: DoctorMedicalRecord) => void;
}) {
  return (
    <aside className="w-[260px] flex-shrink-0 bg-white border-r border-border flex flex-col overflow-hidden">
      <div className="p-3 border-b border-border flex-shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm hồ sơ..."
            className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-border rounded-xl text-[12px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {records.map((record) => {
          const photo = record.petImage || DEFAULT_PET_PHOTO;
          const active = selectedId === record.id;
          return (
            <button
              key={record.id}
              onClick={() => onSelect(record)}
              className={`w-full flex items-start gap-2.5 px-3 py-3 text-left transition-colors ${active ? "bg-cyan-50 border-l-2 border-cyan-400" : "hover:bg-muted/40"}`}
            >
              <img src={photo} alt={record.pet} className="w-9 h-9 rounded-xl object-cover flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[13px] font-bold truncate ${active ? "text-cyan-700" : "text-foreground"}`}>{record.pet}</span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{record.dateShort}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{record.diagnosis}</p>
                <span className="text-[10px] font-mono text-muted-foreground/60">{record.id}</span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
