import { useState, useEffect } from "react";
import { fetchSecurityAlerts, resolveSecurityAlert } from "../services/api";

const ALERT_TYPES = {
  USB_INSERTION: { icon: "🔌", label: "USB Insertion", severity: "high" },
  SUSPICIOUS_APP: { icon: "⚠️", label: "Suspicious App", severity: "medium" },
  AFTER_HOURS_LOGIN: { icon: "🌙", label: "After-Hours Login", severity: "medium" },
  DATA_EXFILTRATION: { icon: "📤", label: "Data Exfiltration", severity: "critical" },
  DEFAULT: { icon: "🚨", label: "Security Alert", severity: "low" },
};

const SEVERITY_STYLES = {
  critical: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
  high: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
  medium: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
  low: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
};

const SEVERITY_BADGE = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
};

export default function Security() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("unresolved");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  async function load() {
    setLoading(true);
    try {
      const data = await fetchSecurityAlerts();
      setAlerts(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleResolve(id) {
    try {
      await resolveSecurityAlert(id);
      setAlerts(alerts.map((a) => (a._id === id ? { ...a, resolved: true } : a)));
    } catch { alert("Failed to resolve alert"); }
  }

  const filtered = alerts.filter((a) => {
    if (typeFilter !== "ALL" && a.type !== typeFilter) return false;
    if (statusFilter === "unresolved" && a.resolved) return false;
    if (statusFilter === "resolved" && !a.resolved) return false;
    return true;
  });

  const unresolvedCount = alerts.filter((a) => !a.resolved).length;
  const uniqueTypes = [...new Set(alerts.map((a) => a.type))];

  const stats = {
    total: alerts.length,
    unresolved: unresolvedCount,
    resolved: alerts.length - unresolvedCount,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            🛡️ Security Center
            {unresolvedCount > 0 && (
              <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-semibold animate-pulse">
                {unresolvedCount} Active
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor security events and incidents</p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition self-start">
          🔄 Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Alerts", value: stats.total, color: "text-blue-500" },
          { label: "Active", value: stats.unresolved, color: "text-red-500" },
          { label: "Resolved", value: stats.resolved, color: "text-green-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          {["unresolved", "resolved", "all"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition ${statusFilter === s ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"}`}>
              {s}
            </button>
          ))}
        </div>
        {uniqueTypes.length > 0 && (
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none">
            <option value="ALL">All Types</option>
            {uniqueTypes.map((t) => <option key={t} value={t}>{(ALERT_TYPES[t] || ALERT_TYPES.DEFAULT).label}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500 animate-pulse border dark:border-gray-700">Loading alerts...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border dark:border-gray-700">
          <div className="text-5xl mb-3">{statusFilter === "unresolved" ? "✅" : "🔍"}</div>
          <div className="text-gray-500 font-medium">
            {statusFilter === "unresolved" ? "No active alerts — system is secure!" : "No alerts found for this filter."}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const info = ALERT_TYPES[alert.type] || ALERT_TYPES.DEFAULT;
            return (
              <div
                key={alert._id}
                className={`p-5 rounded-xl border ${alert.resolved ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-70" : SEVERITY_STYLES[info.severity] || SEVERITY_STYLES.low}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`text-3xl ${alert.resolved ? "grayscale opacity-50" : ""}`}>{info.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-bold text-base ${alert.resolved ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                          {info.label}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY_BADGE[info.severity]}`}>
                          {info.severity.toUpperCase()}
                        </span>
                        {alert.resolved && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">✓ Resolved</span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{alert.details}</p>
                      <div className="text-xs text-gray-400 mt-2 flex flex-wrap gap-3">
                        <span>👤 {alert.user?.email || "Unknown User"}</span>
                        <span>🕒 {new Date(alert.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {isAdmin && !alert.resolved && (
                    <button
                      onClick={() => handleResolve(alert._id)}
                      className="flex-shrink-0 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium shadow transition"
                    >
                      ✓ Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
