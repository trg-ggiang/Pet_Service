import { useState, useEffect } from "react";
import {
  LogOut, Bell, Calendar, Clock, CheckCircle2,
  ChevronRight, Activity, FileText, BarChart3, Settings,
  Stethoscope, Loader2, User,
} from "lucide-react";
import { DoctorExamScreen } from "./DoctorExamScreen";
import { DoctorRecordsPage } from "./DoctorRecordsPage";
import { DoctorStatsPage } from "./DoctorStatsPage";
import { DoctorSettingsPage } from "./DoctorSettingsPage";
import { doctorAppointmentsService, type DoctorAppointment } from "../services/doctorAppointments";
import { doctorProfileService, type DoctorProfile } from "../services/doctorProfile";

function PawSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="currentColor">
      <ellipse cx="40" cy="54" rx="18" ry="15" />
      <ellipse cx="18" cy="35" rx="8.5" ry="10" />
      <ellipse cx="32" cy="27" rx="8" ry="9.5" />
      <ellipse cx="48" cy="27" rx="8" ry="9.5" />
      <ellipse cx="62" cy="35" rx="8.5" ry="10" />
    </svg>
  );
}

const STATUS_CFG = {
  completed:   { label: "Hoàn thành", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  in_progress: { label: "Đang khám",  cls: "bg-amber-50 text-amber-700 ring-amber-200",       dot: "bg-amber-500" },
  scheduled:   { label: "Chờ khám",   cls: "bg-blue-50 text-blue-700 ring-blue-200",           dot: "bg-blue-500" },
};

const NAV_ITEMS = [
  { id: "schedule", label: "Lịch hôm nay",  icon: Calendar },
  { id: "records",  label: "Hồ sơ bệnh án", icon: FileText },
  { id: "reports",  label: "Thống kê",       icon: BarChart3 },
  { id: "settings", label: "Cài đặt",        icon: Settings },
];

export function DoctorPortal({ onLogout }: { onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState("schedule");
  const [examPatient, setExamPatient] = useState<DoctorAppointment | null>(null);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);

  // Fetch doctor profile
  useEffect(() => {
    doctorProfileService.fetchProfile()
      .then((profile) => {
        setDoctorProfile(profile);
      })
      .catch((error) => {
        console.error("[FRONTEND] Failed to load doctor profile:", error);
      });
  }, []);

  // Fetch appointments từ API
  useEffect(() => {
    if (activeNav === "schedule") {
      setAppointmentsLoading(true);
      doctorAppointmentsService.fetchAppointments()
        .then((data) => {
          setAppointments(data);
        })
        .catch((error) => {
          console.error("[FRONTEND] Failed to load appointments:", error);
        })
        .finally(() => {
          setAppointmentsLoading(false);
        });
    }
  }, [activeNav]);

  // Convert API appointments to local format for compatibility
  const scheduleItems = appointments.map(apt => ({
    id: apt.id,
    time: apt.time || "--:--",
    patient: apt.petName,
    species: apt.species,
    owner: apt.owner,
    service: apt.service,
    status: apt.status.label === "Đang khám" ? "in_progress" :
            apt.status.label === "Hoàn thành" ? "completed" : "scheduled",
    room: "P.1",
    appointmentId: apt.appointmentId,
  }));

  const completed   = scheduleItems.filter(s => s.status === "completed").length;
  const inProgress  = scheduleItems.filter(s => s.status === "in_progress").length;
  const scheduled   = scheduleItems.filter(s => s.status === "scheduled").length;

  return (
    <div className="min-h-screen flex" style={{ background: "#F8FAFC" }}>
      {/* Sidebar */}
      <aside className="w-60 flex flex-col border-r border-border bg-white flex-shrink-0">
        {/* logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0891B2,#06B6D4)" }}>
              <PawSVG className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">PetCare</div>
              <div className="text-[10px] text-muted-foreground">Cổng bác sĩ</div>
            </div>
          </div>
        </div>

        {/* doctor info */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0">
              {doctorProfile?.fullName ? (
                <span className="text-xs font-bold text-white">
                  {doctorProfile.fullName.split(" ").pop()?.slice(0, 2).toUpperCase() || "BS"}
                </span>
              ) : (
                <User size={16} className="text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground truncate">
                {doctorProfile?.fullName || "BS. Đang tải..."}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {doctorProfile?.specialization || "Nội khoa"} · {doctorProfile?.roomName || "Phòng 1"}
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-600 font-semibold">Đang làm việc</span>
          </div>
        </div>

        {/* nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => setActiveNav(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-cyan-50 text-cyan-700"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </nav>

      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Exam screen overlay */}
        {examPatient && (
          <DoctorExamScreen
            patient={examPatient}
            onBack={() => setExamPatient(null)}
            onFinish={() => setExamPatient(null)}
          />
        )}

        {/* Records page */}
        {!examPatient && activeNav === "records" && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <DoctorRecordsPage />
          </div>
        )}

        {/* Stats page */}
        {!examPatient && activeNav === "reports" && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <DoctorStatsPage />
          </div>
        )}

        {/* Settings page */}
        {!examPatient && activeNav === "settings" && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <DoctorSettingsPage onLogout={onLogout} />
          </div>
        )}

        {/* topbar — schedule only */}
        {!examPatient && activeNav === "schedule" && <header className="h-14 border-b border-border bg-white px-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-sm font-bold text-foreground">Lịch khám hôm nay</h1>
            <p className="text-[11px] text-muted-foreground">Thứ Sáu, 22 tháng 5 năm 2026</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-xl border border-border bg-white flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell size={14} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
          </div>
        </header>}

        {!examPatient && activeNav === "schedule" && <main className="flex-1 overflow-y-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Tổng ca hôm nay", value: scheduleItems.length, icon: Calendar, bg: "bg-blue-50", color: "text-blue-600" },
              { label: "Đã hoàn thành",   value: completed,        icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
              { label: "Đang khám",        value: inProgress,       icon: Activity, bg: "bg-amber-50", color: "text-amber-600" },
              { label: "Còn lại",          value: scheduled,        icon: Clock, bg: "bg-violet-50", color: "text-violet-600" },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white border border-border rounded-2xl px-5 py-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                    <Icon size={18} className={s.color} />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">{s.value}</div>
                    <div className="text-[11px] text-muted-foreground">{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Schedule table */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Danh sách ca khám</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-muted-foreground font-medium">Phòng 1 · Đang hoạt động</span>
              </div>
            </div>
            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-cyan-500" />
                <span className="ml-3 text-sm text-slate-500">Đang tải danh sách lịch hẹn...</span>
              </div>
            ) : scheduleItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Calendar size={48} className="text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">Không có lịch hẹn nào</p>
              </div>
            ) : (
            <div className="divide-y divide-border/60">
              {scheduleItems.map(apt => {
                const cfg = STATUS_CFG[apt.status as keyof typeof STATUS_CFG];
                const isActive = apt.status === "in_progress";
                return (
                  <div key={apt.id} className={`flex items-center gap-4 px-6 py-4 transition-colors ${isActive ? "bg-amber-50/50" : "hover:bg-muted/20"}`}>
                    {/* time */}
                    <div className="w-14 text-center flex-shrink-0">
                      <div className="text-sm font-bold text-foreground font-mono">{apt.time}</div>
                      {isActive && <div className="text-[9px] text-amber-600 font-bold mt-0.5 animate-pulse">ĐANG KHÁM</div>}
                    </div>

                    {/* patient */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                        <Stethoscope size={14} className="text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground">
                          {apt.patient}
                          <span className="ml-2 text-[10px] font-normal text-muted-foreground">{apt.species}</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{apt.owner} · {apt.id}</div>
                      </div>
                    </div>

                    {/* service */}
                    <div className="hidden md:block text-xs text-foreground font-medium w-44 truncate">{apt.service}</div>

                    {/* status */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ring-1 ring-inset ${cfg.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      {cfg.label}
                    </span>

                    {/* action */}
                    {apt.status !== "completed" && (
                      <button
                        onClick={() => {
                          const fullApt = appointments.find(a => a.id === apt.id);
                          if (fullApt) setExamPatient(fullApt);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex-shrink-0 ${
                          isActive
                            ? "bg-cyan-500 text-white hover:bg-cyan-600"
                            : "border border-border text-foreground hover:bg-muted"
                        }`}>
                        {isActive ? "Tiếp tục khám" : "Bắt đầu"} <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </main>}
      </div>
    </div>
  );
}

