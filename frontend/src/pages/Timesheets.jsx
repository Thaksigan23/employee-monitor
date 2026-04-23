import { useState, useEffect, useMemo } from "react";
import { fetchTimesheets } from "../services/api";

export default function Timesheets() {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadTimesheets();
  }, []);

  async function loadTimesheets() {
    try {
      setLoading(true);
      const data = await fetchTimesheets();
      setTimesheets(data);
      setError("");
    } catch (err) {
      setError("Failed to load timesheets");
    } finally {
      setLoading(false);
    }
  }

  const exportCSV = () => {
    if (timesheets.length === 0) return;

    const headers = ["Date", "Employee Email", "Active Minutes", "Idle Minutes", "Suspicious Minutes", "Productivity Score (%)"];
    const rows = timesheets.map(t => [
      t.date,
      t.email,
      t.activeMinutes,
      t.idleMinutes,
      t.suspiciousMinutes,
      t.productivityScore
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `timesheets_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Timesheets & Productivity</h1>
        {isAdmin && (
          <button
            onClick={exportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow flex items-center gap-2"
          >
            <span>📥</span> Export Payroll CSV
          </button>
        )}
      </div>

      {error && <div className="text-red-500 bg-red-100 p-3 rounded">{error}</div>}

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading timesheets...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-4 border-b dark:border-gray-600 font-semibold">Date</th>
                  <th className="p-4 border-b dark:border-gray-600 font-semibold">Employee</th>
                  <th className="p-4 border-b dark:border-gray-600 font-semibold">Active Time</th>
                  <th className="p-4 border-b dark:border-gray-600 font-semibold">Idle Time</th>
                  <th className="p-4 border-b dark:border-gray-600 font-semibold">Suspicious Time</th>
                  <th className="p-4 border-b dark:border-gray-600 font-semibold">Productivity Score</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">No timesheet records found.</td>
                  </tr>
                ) : (
                  timesheets.map((t, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="p-4 border-b dark:border-gray-700">{t.date}</td>
                      <td className="p-4 border-b dark:border-gray-700">{t.email}</td>
                      <td className="p-4 border-b dark:border-gray-700 font-medium text-green-600 dark:text-green-400">
                        {Math.floor(t.activeMinutes / 60)}h {t.activeMinutes % 60}m
                      </td>
                      <td className="p-4 border-b dark:border-gray-700 text-yellow-600 dark:text-yellow-400">
                        {Math.floor(t.idleMinutes / 60)}h {t.idleMinutes % 60}m
                      </td>
                      <td className="p-4 border-b dark:border-gray-700 text-red-600 dark:text-red-400">
                        {Math.floor(t.suspiciousMinutes / 60)}h {t.suspiciousMinutes % 60}m
                      </td>
                      <td className="p-4 border-b dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 flex-1">
                            <div 
                              className={`h-2.5 rounded-full ${t.productivityScore >= 75 ? 'bg-green-500' : t.productivityScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                              style={{ width: `${t.productivityScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{t.productivityScore}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
