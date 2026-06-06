import { useEffect, useState } from "react";
import { AdminSettingsView } from "../../../components/admin/AdminSettingsView";
import { adminService, type AdminEmailTemplates, type AdminSettings } from "../services/admin";

export function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [emailTemplates, setEmailTemplates] = useState<AdminEmailTemplates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    Promise.all([adminService.getSettings(), adminService.getEmailTemplates()])
      .then(([settingsData, templatesData]) => {
        if (!mounted) return;
        setSettings(settingsData.settings);
        setEmailTemplates(templatesData.templates);
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

  async function saveSettings(next: AdminSettings) {
    try {
      const result = await adminService.updateSettings(next);
      setSettings(result.settings);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu cài đặt.");
      throw err;
    }
  }

  async function saveEmailTemplates(next: AdminEmailTemplates) {
    const result = await adminService.updateEmailTemplates(next);
    setEmailTemplates(result.templates);
  }

  async function sendTestEmail(input: { to: string; subject: string; heading: string; message: string }) {
    await adminService.sendTestEmail(input);
  }

  return (
    <AdminSettingsView
      settings={settings}
      emailTemplates={emailTemplates}
      loading={loading}
      error={error}
      onSave={saveSettings}
      onSaveEmailTemplates={saveEmailTemplates}
      onSendTestEmail={sendTestEmail}
    />
  );
}
