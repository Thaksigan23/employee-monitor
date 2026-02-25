import { useMemo, useState } from "react";

export default function Settings() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [dark, setDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  function toggleTheme() {
    if (dark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDark(!dark);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  function clearData() {
    if (confirm("Are you sure you want to clear local data?")) {
      localStorage.clear();
      window.location.reload();
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-500">Email:</span>{" "}
            <span className="font-medium">{user.email || "Unknown"}</span>
          </div>
          <div>
            <span className="text-gray-500">Role:</span>{" "}
            <span className="font-medium capitalize">
              {user.role || "user"}
            </span>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Appearance</h2>

        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        >
          {dark ? "☀️ Switch to Light Mode" : "🌙 Switch to Dark Mode"}
        </button>
      </div>

      {/* Security */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Security</h2>

        <div className="space-y-3">
          <button
            onClick={() => alert("Change password feature coming soon")}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            🔐 Change Password
          </button>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            🚪 Logout
          </button>

          <button
            onClick={clearData}
            className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            🧹 Clear Local Data
          </button>
        </div>
      </div>
    </div>
  );
}