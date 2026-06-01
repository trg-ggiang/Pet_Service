import { useEffect, useState } from "react";
import {
  DoctorStatsContent,
  DoctorStatsError,
  DoctorStatsLoading,
  DoctorStatsToolbar,
} from "../../../components/doctor/DoctorStatsView";
import {
  doctorDataService,
  type DoctorStatsPeriod,
  type DoctorStatsResponse,
} from "../services/doctorData";
import type { DoctorProfile } from "../services/doctorProfile";

export function DoctorStatsPage({ profile }: { profile?: DoctorProfile | null }) {
  const [period, setPeriod] = useState<DoctorStatsPeriod>("month");
  const [stats, setStats] = useState<DoctorStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const data = stats?.[period];
  const subtitle = profile ? `${profile.fullName} - ${profile.specialization} - ${profile.roomName}` : "Bac si";

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        setLoading(true);
        const nextStats = await doctorDataService.getStats();
        if (!active) return;
        setStats(nextStats);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Khong the tai thong ke bac si");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadStats();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <DoctorStatsToolbar
        subtitle={subtitle}
        period={period}
        onPeriodChange={setPeriod}
      />
      {loading && <DoctorStatsLoading />}
      {!loading && error && <DoctorStatsError message={error} />}
      {!loading && !error && data && <DoctorStatsContent data={data} />}
    </div>
  );
}
