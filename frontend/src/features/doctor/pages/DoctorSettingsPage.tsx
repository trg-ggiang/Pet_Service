import { useEffect, useState } from "react";
import {
  DoctorNotificationSettings,
  DoctorProfileSettings,
  DoctorScheduleSettings,
  DoctorSecuritySettings,
  DoctorSettingsError,
  DoctorSettingsHeader,
  DoctorSettingsLoading,
  DoctorSettingsNav,
  type DoctorSettingsTabId,
} from "../../../components/doctor/DoctorSettingsView";
import {
  doctorDataService,
  type DoctorSettingsPayload,
} from "../services/doctorData";

export function DoctorSettingsPage() {
  const [tab, setTab] = useState<DoctorSettingsTabId>("profile");
  const [settings, setSettings] = useState<DoctorSettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSettings() {
    try {
      setLoading(true);
      const payload = await doctorDataService.getSettings();
      setSettings(payload);
      setError(null);
    } catch (err) {
      setSettings(null);
      setError(err instanceof Error ? err.message : "Không thể tải cài đặt bác sĩ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        setLoading(true);
        const payload = await doctorDataService.getSettings();
        if (!active) return;
        setSettings(payload);
        setError(null);
      } catch (err) {
        if (!active) return;
        setSettings(null);
        setError(err instanceof Error ? err.message : "Không thể tải cài đặt bác sĩ");
      } finally {
        if (active) setLoading(false);
      }
    }

    void init();

    return () => {
      active = false;
    };
  }, []);

  function renderContent() {
    if (loading) return <DoctorSettingsLoading />;
    if (error) return <DoctorSettingsError message={error} />;
    if (!settings) return <DoctorSettingsError message="Không có dữ liệu cài đặt" />;

    if (tab === "schedule") return <DoctorScheduleSettings schedule={settings.schedule} />;
    if (tab === "notifications") return <DoctorNotificationSettings notifications={settings.notifications} />;
    if (tab === "security") return <DoctorSecuritySettings security={settings.security} />;
    return <DoctorProfileSettings profile={settings.profile} />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <DoctorSettingsHeader />

      <div className="flex-1 overflow-hidden flex min-h-0">
        <DoctorSettingsNav
          tab={tab}
          onTabChange={setTab}
        />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
