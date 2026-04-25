import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const [dark, setDark] = useState(localStorage.getItem("theme") === "dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin";
  const active = routerLocation.pathname;

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [routerLocation.pathname]);

  const MenuItem = ({ path, icon, label }) => (
    <button
      onClick={() => navigate(path)}
      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm transition-all duration-150
        ${
          active === path
            ? "bg-green-500 text-white shadow-md shadow-green-500/20"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
    >
      <span className="text-base">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-5 border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
            EM
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Employee Monitor</h2>
            <p className="text-[10px] text-gray-400">Workforce Suite</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Overview</div>
        <MenuItem path="/dashboard" icon="📊" label="Dashboard" />
        <MenuItem path="/activity" icon="🕒" label="Activity Logs" />
        <MenuItem path="/screenshots" icon="📸" label="Screenshots" />

        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-3">Analytics</div>
        <MenuItem path="/timesheets" icon="📑" label="Timesheets" />
        <MenuItem path="/leaderboard" icon="🏆" label="Leaderboard" />
        <MenuItem path="/reports" icon="📈" label="Reports" />

        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-3">HR</div>
        <MenuItem path="/shifts" icon="📅" label="Shifts" />
        <MenuItem path="/leaves" icon="🏖️" label="Leaves" />
        <MenuItem path="/announcements" icon="📢" label="Announcements" />

        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-3">Communication</div>
        <MenuItem path="/chat" icon="💬" label="Chat" />

        {isAdmin && (
          <>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-3">Admin</div>
            <MenuItem path="/blocked-apps" icon="🚫" label="Blocked Apps" />
            <MenuItem path="/security" icon="🛡️" label="Security Center" />
            <MenuItem path="/users" icon="👥" label="Users" />
            <MenuItem path="/audit" icon="🔍" label="Audit Logs" />
          </>
        )}

        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-3">Account</div>
        <MenuItem path="/settings" icon="⚙️" label="Settings" />
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t dark:border-gray-700 space-y-2">
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-[10px] text-gray-400">Logged in as</div>
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{user?.email || "Unknown"}</div>
          <div className="text-[10px] text-green-500 capitalize">{user?.role || "employee"}</div>
        </div>

        <button
          onClick={() => setDark(!dark)}
          className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-medium transition text-left flex items-center gap-2"
        >
          <span>{dark ? "☀️" : "🌙"}</span>
          <span>{dark ? "Light Mode" : "Dark Mode"}</span>
        </button>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
          className="w-full px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition flex items-center gap-2"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop always visible, mobile slide-in */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            ☰
          </button>
          <span className="text-sm font-bold text-gray-900 dark:text-white">Employee Monitor</span>
        </header>

        <main className="flex-1 p-4 lg:p-6 text-gray-900 dark:text-gray-100 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}