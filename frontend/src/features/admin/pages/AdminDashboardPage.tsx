import { useCallback, useEffect, useState } from "react";
import { AdminDashboardView } from "../../../components/admin/AdminDashboardView";
import { adminService, type AdminDashboard } from "../services/admin";

type AdminPageId = "appointments" | "staff" | "users" | "services" | "reports";

export function AdminDashboardPage({ onNav }: { onNav?: (page: AdminPageId) => void }) {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(() => {
    setLoading(true);
    adminService
      .getDashboard()
      .then((data) => {
        setDashboard(data.dashboard);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu dashboard.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <AdminDashboardView
      dashboard={dashboard}
      loading={loading}
      error={error}
      onRefresh={loadDashboard}
      onNav={onNav}
    />
  );
}
