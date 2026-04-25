import { useMemo, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Settings() {
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);

  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));
  const [clearConfirm, setClearConfirm] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  // Password change state
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

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

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError(""); setPwSuccess("");

    if (!currentPw || !newPw || !confirmPw) { setPwError("All fields are required."); return; }
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwError("New passwords do not match."); return; }

    try {
      setPwLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setPwSuccess("Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setShowPwForm(false);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  }

  const PasswordStrength = ({ password }) => {
    if (!password) return null;
    const score = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
    const labels = ["Too Weak", "Weak", "Fair", "Strong", "Very Strong"];
    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-400", "bg-green-500"];
    return (
      <div className="mt-2">
        <div className="flex gap-1 h-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex-1 rounded-full ${i <= score ? colors[score] : "bg-gray-200 dark:bg-gray-600"} transition-all`} />
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-1">{labels[score]}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">⚙️ Settings</h1>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">👤 Profile</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
            {(user.email || "?")[0].toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-lg">{user.name || user.email?.split("@")[0] || "Unknown"}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
            <div className="text-xs text-green-500 font-medium capitalize">{user.role || "employee"}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">Email</div>
            <div className="font-medium">{user.email || "—"}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">Role</div>
            <div className="font-medium capitalize">{user.role || "employee"}</div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">🎨 Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Theme</div>
            <div className="text-sm text-gray-500">Currently: {dark ? "Dark" : "Light"} mode</div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${dark ? "bg-indigo-600" : "bg-gray-300"}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 flex items-center justify-center text-xs ${dark ? "translate-x-7" : "translate-x-0"}`}>
              {dark ? "🌙" : "☀️"}
            </div>
          </button>
        </div>
      </div>

      {/* Security / Password */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">🔐 Security</h2>

        {pwSuccess && <div className="mb-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-3 rounded-lg text-sm">✅ {pwSuccess}</div>}

        <button
          onClick={() => setShowPwForm(!showPwForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
        >
          🔑 {showPwForm ? "Cancel" : "Change Password"}
        </button>

        {showPwForm && (
          <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
            {pwError && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">⚠️ {pwError}</div>}
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
              <PasswordStrength password={newPw} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
            </div>
            <button type="submit" disabled={pwLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50">
              {pwLoading ? "Saving..." : "Save Password"}
            </button>
          </form>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-red-200 dark:border-red-900 p-6">
        <h2 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">⚠️ Danger Zone</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium text-sm">Sign Out</div>
              <div className="text-xs text-gray-400">End your current session</div>
            </div>
            <button onClick={() => setLogoutConfirm(true)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition">
              🚪 Logout
            </button>
          </div>
          <div className="border-t dark:border-gray-700 flex items-center justify-between py-2">
            <div>
              <div className="font-medium text-sm">Clear Local Data</div>
              <div className="text-xs text-gray-400">Clears all cached data and settings</div>
            </div>
            <button onClick={() => setClearConfirm(true)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition">
              🧹 Clear
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        open={logoutConfirm}
        title="Sign Out"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
        cancelLabel="Stay"
        onConfirm={logout}
        onCancel={() => setLogoutConfirm(false)}
        danger
      />
      <ConfirmModal
        open={clearConfirm}
        title="Clear Local Data"
        message="This will clear all cached data including your login session. You'll need to log in again."
        confirmLabel="Clear Data"
        cancelLabel="Cancel"
        onConfirm={() => { localStorage.clear(); window.location.reload(); }}
        onCancel={() => setClearConfirm(false)}
        danger
      />
    </div>
  );
}
