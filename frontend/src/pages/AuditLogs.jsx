import { useState, useEffect } from "react";
import { fetchAuditLogs } from "../services/api";

const ACTION_ICONS = {
  leave_approved: "✅",
  leave_rejected: "❌",
  announcement_created: "📣",
  user_deleted: "🗑️",
  user_created: "➕",
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      setLoading(true);
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch {
      setError("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) +
      " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">🔍 Audit Logs</h1>
      <p className="text-gray-500 dark:text-gray-400">Track every admin action for compliance and transparency.</p>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p>No audit logs recorded yet</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {logs.map((log) => (
              <div key={log._id} className="p-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg flex-shrink-0">
                  {ACTION_ICONS[log.action] || "📝"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{log.actor?.email || "System"}</span>
                    <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-xs font-mono">
                      {log.action}
                    </span>
                    {log.target && (
                      <span className="text-sm text-gray-500">→ {log.target}</span>
                    )}
                  </div>
                  {log.details && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{log.details}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDate(log.createdAt)}
                    {log.ip && <span className="ml-2">IP: {log.ip}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
