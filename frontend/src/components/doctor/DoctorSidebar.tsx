import { BarChart3, Calendar, FileText, LogOut, Settings, User } from "lucide-react";

export type DoctorPortalNavId = "schedule" | "records" | "reports" | "settings";

interface DoctorSidebarProfile {
  fullName?: string;
  specialization?: string;
  roomName?: string;
}

const NAV_ITEMS: Array<{ id: DoctorPortalNavId; label: string; icon: typeof Calendar }> = [
  { id: "schedule", label: "Lịch khám", icon: Calendar },
  { id: "records", label: "Hồ sơ bệnh án", icon: FileText },
  { id: "reports", label: "Thống kê", icon: BarChart3 },
  { id: "settings", label: "Cài đặt", icon: Settings },
];

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

export function DoctorSidebar({
  activeNav,
  profile,
  onNavigate,
  onLogoutClick,
}: {
  activeNav: DoctorPortalNavId;
  profile: DoctorSidebarProfile | null;
  onNavigate: (id: DoctorPortalNavId) => void;
  onLogoutClick: () => void;
}) {
  return (
    <aside className="w-60 flex flex-col border-r border-border bg-white flex-shrink-0">
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

      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0">
            {profile?.fullName ? (
              <span className="text-xs font-bold text-white">
                {profile.fullName.split(" ").pop()?.slice(0, 2).toUpperCase() || "BS"}
              </span>
            ) : (
              <User size={16} className="text-white" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-foreground truncate">
              {profile?.fullName || "BS. Đang tải..."}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {profile?.specialization || "Nội khoa"} · {profile?.roomName || "Phòng 1"}
            </div>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-600 font-semibold">Đang làm việc</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeNav === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
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

      <div className="p-3 border-t border-border">
        <button
          onClick={onLogoutClick}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={15} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
