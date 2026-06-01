import { useEffect, useState } from "react";
import { AdminReportsView } from "../../../components/admin/AdminReportsView";
import { adminService, type AdminReports } from "../services/admin";

export function ReportsPage() {
  const [reports, setReports] = useState<AdminReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    adminService
      .getReports()
      .then((data) => {
        if (!mounted) return;
        setReports(data.reports);
        setError("");
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Không thể tải báo cáo.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return <AdminReportsView reports={reports} loading={loading} error={error} />;
}
