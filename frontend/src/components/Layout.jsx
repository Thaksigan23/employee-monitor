import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const routerLocation = useLocation();   // 👈 rename it, avoid "location" name clash

  const [dark, setDark] = useState(localStorage.getItem("theme") === "dark");

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

  const active = routerLocation.pathname; // 👈 use renamed variable

  const MenuItem = ({ path, icon, label }) => (
    <button
      onClick={() => navigate(path)}
      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition
        ${
          active === path
            ? "bg-green-500 text-white"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          Employee Monitor
        </h2>

        <nav className="space-y-2 flex-1">
          <MenuItem path="/dashboard" icon="📊" label="Dashboard" />
          <MenuItem path="/activity" icon="🕒" label="Activity" />
          {isAdmin && <MenuItem path="/users" icon="👥" label="Users" />}
          <MenuItem path="/settings" icon="⚙️" label="Settings" />
        </nav>

        <div className="space-y-3 pt-4 border-t dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Logged in as:
            <div className="font-semibold break-all">
              {user?.email || "Unknown"}
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
            className="w-full px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
          >
            🚪 Logout
          </button>

          <button
            onClick={() => setDark(!dark)}
            className="w-full px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 text-gray-900 dark:text-gray-100 overflow-auto">
        {children}
      </main>
    </div>
  );
}