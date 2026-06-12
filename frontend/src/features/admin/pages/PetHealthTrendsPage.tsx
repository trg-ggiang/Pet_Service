import { useEffect, useState } from "react";
import { AdminPetHealthTrendsView } from "../../../components/admin/AdminPetHealthTrendsView";
import { adminService, type AdminHealthTrends } from "../services/admin";

export function PetHealthTrendsPage() {
  const [trends, setTrends] = useState<AdminHealthTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    adminService
      .getHealthTrends()
      .then((data) => {
        if (!mounted) return;
        setTrends(data.trends);
        setError("");
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu sức khỏe.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return <AdminPetHealthTrendsView trends={trends} loading={loading} error={error} />;
}
