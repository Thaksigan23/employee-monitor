import { useState, useEffect } from "react";
import { fetchSecurityAlerts, resolveSecurityAlert } from "../services/api";

export default function Security() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setAlerts(alerts.map(a => a._id === id ? { ...a, resolved: true } : a));
    } catch (e) { alert("Failed to resolve alert"); }
  }

  const unresolvedCount = alerts.filter(a => !a.resolved).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          🛡️ Security Center 
          {unresolvedCount > 0 && <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full">{unresolvedCount} Active Alerts</span>}
        </h1>
        <button onClick={load} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">🔄 Refresh</button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">✅</div>
          <div className="text-gray-500">System is secure. No alerts logged.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert._id} className={`p-5 rounded-xl border ${alert.resolved ? 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 opacity-70' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className={`text-3xl ${alert.resolved ? 'grayscale opacity-50' : ''}`}>
                    {alert.type === "USB_INSERTION" ? "🔌" : "⚠️"}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${alert.resolved ? 'text-gray-600 dark:text-gray-400' : 'text-red-700 dark:text-red-400'}`}>
                      {alert.type.replace(/_/g, " ")}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{alert.details}</p>
                    <div className="text-sm text-gray-500 mt-2 flex gap-4">
                      <span>👤 {alert.user?.email || "Unknown User"}</span>
                      <span>🕒 {new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                {isAdmin && !alert.resolved && (
                  <button 
                    onClick={() => handleResolve(alert._id)} 
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow transition"
                  >
                    Mark Resolved
                  </button>
                )}
                {alert.resolved && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-medium">
                    ✓ Resolved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
