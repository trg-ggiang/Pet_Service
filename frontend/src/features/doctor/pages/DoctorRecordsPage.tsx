import { useEffect, useMemo, useState } from "react";
import {
  DoctorRecordsError,
  DoctorRecordsHistory,
  DoctorRecordsLoading,
  DoctorRecordsPetList,
  DoctorRecordsToolbar,
} from "../../../components/doctor/DoctorRecordsView";
import { DoctorRecordDetail } from "../../../components/doctor/DoctorRecordDetail";
import { doctorDataService, type DoctorMedicalRecord } from "../services/doctorData";

function patientKey(record: DoctorMedicalRecord) {
  return String(record.petId || `${record.pet}-${record.owner}`);
}

export function DoctorRecordsPage() {
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [records, setRecords] = useState<DoctorMedicalRecord[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<DoctorMedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const patients = useMemo(() => {
    const grouped = new Map<string, DoctorMedicalRecord[]>();
    records.forEach((record) => {
      const key = patientKey(record);
      grouped.set(key, [...(grouped.get(key) || []), record]);
    });

    return [...grouped.entries()].map(([id, patientRecords]) => {
      const sortedRecords = [...patientRecords].sort((a, b) => {
        const dateA = new Date(a.dateShort.split("/").reverse().join("-")).getTime() || 0;
        const dateB = new Date(b.dateShort.split("/").reverse().join("-")).getTime() || 0;
        return dateB - dateA;
      });
      const latest = sortedRecords[0];

      return {
        id,
        name: latest.pet,
        image: latest.petImage,
        species: latest.species,
        breed: latest.breed,
        owner: latest.owner,
        phone: latest.phone,
        allergy: latest.allergy,
        latestDate: latest.dateShort,
        recordCount: sortedRecords.length,
        records: sortedRecords,
      };
    });
  }, [records]);

  const selectedPatient = patients.find((patient) => patient.id === selectedPetId) || patients[0] || null;

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
        setSelectedPetId((current) => {
          const keys = new Set(data.map(patientKey));
          return current && keys.has(current) ? current : data[0] ? patientKey(data[0]) : null;
        });
        setError(null);
      } catch (err) {
        if (!active) return;
        setRecords([]);
        setSelectedPetId(null);
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

  if (selectedRecord) {
    return (
      <DoctorRecordDetail
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <DoctorRecordsToolbar
        total={patients.length}
        search={search}
        speciesFilter={speciesFilter}
        onSearchChange={setSearch}
        onSpeciesFilterChange={setSpeciesFilter}
      />

      {loading && <DoctorRecordsLoading text="Đang tải hồ sơ bệnh án..." />}
      {!loading && error && <DoctorRecordsError message={error} />}
      {!loading && !error && (
        <div className="flex-1 overflow-hidden flex min-h-0">
          <DoctorRecordsPetList
            patients={patients}
            selectedId={selectedPatient?.id || ""}
            onSelect={(patient) => setSelectedPetId(patient.id)}
          />
          <DoctorRecordsHistory
            patient={selectedPatient}
            onSelectRecord={setSelectedRecord}
          />
        </div>
      )}
    </div>
  );
}
