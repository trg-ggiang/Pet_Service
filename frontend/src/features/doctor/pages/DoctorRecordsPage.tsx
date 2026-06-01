import { useEffect, useState } from "react";
import { DoctorRecordDetail } from "../../../components/doctor/DoctorRecordDetail";
import {
  DoctorRecordsError,
  DoctorRecordsLoading,
  DoctorRecordsSideList,
  DoctorRecordsTable,
  DoctorRecordsToolbar,
} from "../../../components/doctor/DoctorRecordsView";
import { doctorDataService, type DoctorMedicalRecord } from "../services/doctorData";

export function DoctorRecordsPage() {
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [records, setRecords] = useState<DoctorMedicalRecord[]>([]);
  const [selected, setSelected] = useState<DoctorMedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      try {
        setLoading(true);
        const data = await doctorDataService.listRecords({
          search,
          species: speciesFilter,
        });
        if (!active) return;
        setRecords(data);
        setSelected((current) => current && data.some((record) => record.id === current.id) ? current : data[0] ?? null);
        setError(null);
      } catch (err) {
        if (!active) return;
        setRecords([]);
        setSelected(null);
        setError(err instanceof Error ? err.message : "Khong the tai ho so benh an");
      } finally {
        if (active) setLoading(false);
      }
    }

    const timer = window.setTimeout(() => {
      void loadRecords();
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, speciesFilter]);

  if (selected) {
    return (
      <div className="flex h-full min-h-0">
        <DoctorRecordsSideList
          records={records}
          selectedId={selected.id}
          search={search}
          onSearchChange={setSearch}
          onSelect={setSelected}
        />
        <DoctorRecordDetail record={selected} onClose={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <DoctorRecordsToolbar
        total={records.length}
        search={search}
        speciesFilter={speciesFilter}
        onSearchChange={setSearch}
        onSpeciesFilterChange={setSpeciesFilter}
      />

      {loading && <DoctorRecordsLoading text="Dang tai ho so benh an..." />}
      {!loading && error && <DoctorRecordsError message={error} />}
      {!loading && !error && <DoctorRecordsTable records={records} onSelect={setSelected} />}
    </div>
  );
}
