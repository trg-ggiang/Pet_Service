import { useEffect, useState } from "react";
import { AdminSettingsView } from "../../../components/admin/AdminSettingsView";
import { adminService, type AdminSettings } from "../services/admin";

export function SettingsPage({ onLogout }: { onLogout?: () => void }) {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    adminService
      .getSettings()
      .then((data) => {
        if (!mounted) return;
        setSettings(data.settings);
        setError("");
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Không thể tải cài đặt.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return <AdminSettingsView settings={settings} loading={loading} error={error} onLogout={onLogout} />;
}
