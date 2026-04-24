import { useState, useEffect, useMemo } from "react";
import { fetchBlockedApps, addBlockedApp, removeBlockedApp, scanViolations, fetchViolations, acknowledgeViolation } from "../services/api";

const SEVERITY_COLORS = {
  low: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
  medium: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  high: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
};

export default function BlockedApps() {
  const [apps, setApps] = useState([]);
  const [violations, setViolations] = useState([]);
  const [tab, setTab] = useState("apps");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [form, setForm] = useState({ name: "", keywords: "", severity: "medium" });

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const isAdmin = user?.role === "admin";

  async function load() {
    try {
      const [a, v] = await Promise.all([fetchBlockedApps(), fetchViolations()]);
      setApps(a); setViolations(v);
    } catch (e) { setError(e.message); }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      const keywords = form.keywords.split(",").map((k) => k.trim()).filter(Boolean);
      await addBlockedApp(form.name, keywords, form.severity);
      setSuccess("Blocked app added!"); setShowForm(false);
      setForm({ name: "", keywords: "", severity: "medium" }); load();
    } catch (err) { setError(err.message); }
  }

  async function handleRemove(id) {
    if (!confirm("Remove this blocked app?")) return;
    try { await removeBlockedApp(id); setSuccess("Removed"); load(); } catch (err) { setError(err.message); }
  }

  async function handleScan() {
    setScanning(true); setError(""); setSuccess("");
    try {
      const result = await scanViolations();
      setSuccess(`Scanned ${result.scanned} activities, found ${result.violations} new violation(s)`);
      load();
    } catch (err) { setError(err.message); }
    setScanning(false);
  }

  async function handleAcknowledge(id) {
    try { await acknowledgeViolation(id); load(); } catch (err) { setError(err.message); }
  }

  const unacknowledgedCount = violations.filter((v) => !v.acknowledged).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🚫 App Blocking & Alerts</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={handleScan} disabled={scanning} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50">
              {scanning ? "⏳ Scanning..." : "🔍 Scan Now"}
            </button>
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
              {showForm ? "✕" : "＋ Block App"}
            </button>
          </div>
        )}
      </div>

      {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-lg">{success}</div>}

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("apps")} className={`px-4 py-2 rounded-lg font-medium transition ${tab === "apps" ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}>
          🚫 Blocked Apps ({apps.length})
        </button>
        <button onClick={() => setTab("violations")} className={`px-4 py-2 rounded-lg font-medium transition ${tab === "violations" ? "bg-red-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}>
          ⚠️ Violations ({unacknowledgedCount})
        </button>
      </div>

      {/* Add Form */}
      {showForm && isAdmin && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Add Blocked Application</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">App Name</label>
              <input className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. YouTube" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Keywords (comma-separated)</label>
              <input className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="e.g. youtube, youtu.be" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Block App</button>
        </form>
      )}

      {tab === "apps" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => (
            <div key={app._id} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">🚫 {app.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${SEVERITY_COLORS[app.severity]}`}>{app.severity}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(app.keywords || []).map((kw) => <span key={kw} className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700">{kw}</span>)}
              </div>
              {isAdmin && (
                <button onClick={() => handleRemove(app._id)} className="text-sm text-red-500 hover:text-red-700 transition">Remove</button>
              )}
            </div>
          ))}
          {apps.length === 0 && <div className="col-span-full text-center text-gray-500 py-8">No blocked apps configured yet.</div>}
        </div>
      )}

      {tab === "violations" && (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                <th className="p-3">Employee</th>
                <th className="p-3">App</th>
                <th className="p-3">Window Title</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Time</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {violations.map((v) => (
                <tr key={v._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${!v.acknowledged ? "bg-red-50 dark:bg-red-900/10" : ""}`}>
                  <td className="p-3 border-b dark:border-gray-700">{v.user?.email || "—"}</td>
                  <td className="p-3 border-b dark:border-gray-700 font-medium">{v.appName}</td>
                  <td className="p-3 border-b dark:border-gray-700 text-sm max-w-[200px] truncate">{v.windowTitle}</td>
                  <td className="p-3 border-b dark:border-gray-700"><span className={`px-2 py-1 text-xs rounded-full ${SEVERITY_COLORS[v.severity]}`}>{v.severity}</span></td>
                  <td className="p-3 border-b dark:border-gray-700 text-sm">{new Date(v.createdAt).toLocaleString()}</td>
                  <td className="p-3 border-b dark:border-gray-700">
                    {v.acknowledged ? (
                      <span className="text-green-500 text-sm">✅ Ack</span>
                    ) : (
                      <button onClick={() => handleAcknowledge(v._id)} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition">Acknowledge</button>
                    )}
                  </td>
                </tr>
              ))}
              {violations.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No violations found. Run a scan to check for policy violations.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
