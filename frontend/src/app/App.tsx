import { useEffect, useState } from "react";
import {
  BarChart3,
  Calendar,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Settings,
  Users,
} from "lucide-react";
import { AdminDashboardPage } from "../features/admin/pages/AdminDashboardPage";
import { AppointmentsPage } from "../features/admin/pages/AppointmentsPage";
import { HelpPage } from "../features/admin/pages/HelpPage";
import { ReportsPage } from "../features/admin/pages/ReportsPage";
import { ServicesPage } from "../features/admin/pages/ServicesPage";
import { SettingsPage } from "../features/admin/pages/SettingsPage";
import { StaffPage } from "../features/admin/pages/StaffPage";
import { UsersPage } from "../features/admin/pages/UsersPage";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { SplashScreen } from "../features/auth/pages/SplashScreen";
import { WelcomePage } from "../features/auth/pages/WelcomePage";
import { CustomerPortal } from "../features/customer/pages/CustomerPortal";
import { DoctorPortal } from "../features/doctor/pages/DoctorPortal";
import { StaffPortal } from "../features/staff/pages/StaffPortal";
import { clearSession, login, register, restoreSession, type AuthSession } from "../services/auth";

type AdminPageId = "dashboard" | "appointments" | "users" | "services" | "staff" | "reports" | "settings" | "help";
type AuthScreen = "welcome" | "login" | "register" | "forgot" | "app";

const ADMIN_NAV: Array<{ id: AdminPageId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Bảng điều khiển", icon: LayoutDashboard },
  { id: "appointments", label: "Lịch hẹn", icon: Calendar },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "services", label: "Dịch vụ", icon: Scissors },
  { id: "staff", label: "Nhân sự", icon: Users },
  { id: "reports", label: "Báo cáo", icon: BarChart3 },
  { id: "settings", label: "Cài đặt", icon: Settings },
  { id: "help", label: "Trợ giúp", icon: CircleHelp },
];

function AdminRoot({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState<AdminPageId>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className={`flex flex-shrink-0 flex-col border-r border-border bg-white transition-[width] duration-200 ${sidebarCollapsed ? "w-20" : "w-60"}`}>
        <div className={`flex h-[100px] items-center border-b border-border ${sidebarCollapsed ? "justify-center px-3" : "justify-between px-5"}`}>
          {!sidebarCollapsed && (
            <div>
              <div className="text-lg font-bold text-foreground">Pet Service</div>
              <div className="text-xs font-medium text-muted-foreground">Admin portal</div>
            </div>
          )}
          <button
            type="button"
            title={sidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
            aria-label={sidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
            onClick={() => setSidebarCollapsed((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Menu size={19} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {ADMIN_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              title={sidebarCollapsed ? label : undefined}
              onClick={() => setPage(id)}
              className={`flex w-full items-center rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"
              } ${
                page === id ? "bg-cyan-50 text-cyan-700" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!sidebarCollapsed && label}
            </button>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <button
            title={sidebarCollapsed ? "Đăng xuất" : undefined}
            onClick={onLogout}
            className={`flex w-full items-center rounded-xl py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 ${
              sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"
            }`}
          >
            <LogOut size={17} className="flex-shrink-0" />
            {!sidebarCollapsed && "Đăng xuất"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1280px] px-6 py-6">
          {page === "dashboard" && <AdminDashboardPage onNav={setPage} />}
          {page === "appointments" && <AppointmentsPage />}
          {page === "users" && <UsersPage />}
          {page === "services" && <ServicesPage />}
          {page === "staff" && <StaffPage />}
          {page === "reports" && <ReportsPage />}
          {page === "settings" && <SettingsPage />}
          {page === "help" && <HelpPage />}
        </div>
      </main>
    </div>
  );
}

const validRoles = new Set(["admin", "doctor", "staff", "customer"]);

export default function App() {
  const [screen, setScreen] = useState<AuthScreen>("welcome");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let mounted = true;
    void restoreSession().then((restoredSession) => {
      if (!mounted) return;
      if (restoredSession && validRoles.has(restoredSession.user.role)) {
        setSession(restoredSession);
        setScreen("app");
      } else if (restoredSession) {
        clearSession();
      }
      setBooting(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (booting) return <SplashScreen onDone={() => setBooting(false)} />;
  if (screen === "welcome") return <WelcomePage onLogin={() => setScreen("login")} onRegister={() => setScreen("register")} />;
  if (screen === "login") {
    return (
      <LoginPage
        onLogin={async (input) => {
          setSession(await login(input));
          setScreen("app");
        }}
        onRegister={() => setScreen("register")}
        onForgotPassword={() => setScreen("forgot")}
      />
    );
  }
  if (screen === "register") {
    return (
      <RegisterPage
        onBack={() => setScreen("login")}
        onRegister={async (input) => {
          setSession(await register(input));
          setScreen("app");
        }}
      />
    );
  }
  if (screen === "forgot") return <ForgotPasswordPage onBack={() => setScreen("login")} />;

  const logout = () => {
    clearSession();
    setSession(null);
    setScreen("welcome");
  };
  const role = session?.user.role;
  if (role === "admin") return <AdminRoot onLogout={logout} />;
  if (role === "doctor") return <DoctorPortal onLogout={logout} />;
  if (role === "staff") return <StaffPortal onLogout={logout} />;
  if (role === "customer") return <CustomerPortal onLogout={logout} userName={session?.user.fullName ?? session?.user.email ?? "Khách hàng"} />;

  clearSession();
  return <WelcomePage onLogin={() => setScreen("login")} onRegister={() => setScreen("register")} />;
}
