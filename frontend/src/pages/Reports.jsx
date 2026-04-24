import { useState, useEffect, useMemo } from "react";
import { fetchTrends, fetchPerformanceReport, fetchUsers } from "../services/api";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";

export default function Reports() {
  const [trends, setTrends] = useState([]);
  const [report, setReport] = useState(null);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("trends");
  const [weeks, setWeeks] = useState(4);
  const [reportUserId, setReportUserId] = useState("");
  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const isAdmin = user?.role === "admin";

  async function loadTrends() {
    setLoading(true);
    try { const data = await fetchTrends(weeks); setTrends(data); } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function loadReport() {
    setLoading(true); setError("");
    try {
      const data = await fetchPerformanceReport(reportUserId || null, reportStart || null, reportEnd || null);
      setReport(data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  useEffect(() => {
    loadTrends();
    if (isAdmin) { fetchUsers().then(setUsers).catch(() => {}); }
  }, [weeks]);

  function generatePDF() {
    if (!report) return;
    const w = window.open("", "_blank");
    const html = `<!DOCTYPE html><html><head><title>Performance Report</title>
<style>body{font-family:Arial,sans-serif;padding:40px;color:#333}
h1{color:#10b981;border-bottom:2px solid #10b981;padding-bottom:10px}
h2{color:#555;margin-top:30px}
table{width:100%;border-collapse:collapse;margin-top:15px}
th,td{border:1px solid #ddd;padding:10px;text-align:left}
th{background:#f3f4f6}
.stat{display:inline-block;margin:10px 20px 10px 0;padding:15px 25px;border-radius:10px;background:#f9fafb}
.stat .value{font-size:28px;font-weight:bold;color:#10b981}
.stat .label{font-size:12px;color:#888}
.score-high{color:#10b981} .score-mid{color:#f59e0b} .score-low{color:#ef4444}
</style></head><body>
<h1>📊 Performance Report</h1>
<p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
<p>Period: ${report.period.start} — ${report.period.end}</p>
<div>
<div class="stat"><div class="value">${report.summary.totalDays}</div><div class="label">Total Days</div></div>
<div class="stat"><div class="value">${report.summary.totalActiveMinutes}m</div><div class="label">Active Time</div></div>
<div class="stat"><div class="value">${report.summary.totalIdleMinutes}m</div><div class="label">Idle Time</div></div>
<div class="stat"><div class="value ${report.summary.avgProductivityScore >= 70 ? 'score-high' : report.summary.avgProductivityScore >= 40 ? 'score-mid' : 'score-low'}">${report.summary.avgProductivityScore}%</div><div class="label">Avg Productivity</div></div>
</div>
<h2>Daily Breakdown</h2>
<table><thead><tr><th>Date</th><th>Employee</th><th>Active</th><th>Idle</th><th>Suspicious</th><th>Score</th></tr></thead>
<tbody>${report.daily.map((d) => `<tr><td>${d.date}</td><td>${d.name} (${d.email})</td><td>${d.activeMinutes}m</td><td>${d.idleMinutes}m</td><td>${d.suspiciousMinutes}m</td><td class="${d.productivityScore >= 70 ? 'score-high' : d.productivityScore >= 40 ? 'score-mid' : 'score-low'}">${d.productivityScore}%</td></tr>`).join("")}</tbody></table>
${report.topApps.length > 0 ? `<h2>Top Applications</h2><table><thead><tr><th>App</th><th>Usage Count</th></tr></thead><tbody>${report.topApps.map((a) => `<tr><td>${a.app}</td><td>${a.count}</td></tr>`).join("")}</tbody></table>` : ""}
<script>setTimeout(()=>window.print(),500)</script></body></html>`;
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">📈 Reports & Trends</h1>

      <div className="flex gap-2">
        <button onClick={() => setTab("trends")} className={`px-4 py-2 rounded-lg font-medium transition ${tab === "trends" ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}>📊 Trend Graphs</button>
        <button onClick={() => setTab("report")} className={`px-4 py-2 rounded-lg font-medium transition ${tab === "report" ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}>📄 Performance Report</button>
      </div>

      {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg">{error}</div>}

      {tab === "trends" && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <label className="font-medium">Show last</label>
            <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none">
              {[2, 4, 6, 8, 12].map((w) => <option key={w} value={w}>{w} weeks</option>)}
            </select>
          </div>

          {loading ? <div className="text-center py-8 text-gray-500">Loading trends...</div> : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Trend */}
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                <h2 className="font-semibold mb-4">Activity Minutes (Week-over-Week)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} />
                    <Legend />
                    <Area type="monotone" dataKey="activeMinutes" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Active" />
                    <Area type="monotone" dataKey="idleMinutes" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Idle" />
                    <Area type="monotone" dataKey="suspiciousMinutes" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Suspicious" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Productivity Score Trend */}
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                <h2 className="font-semibold mb-4">Productivity Score Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} />
                    <Line type="monotone" dataKey="productivityScore" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: "#8b5cf6", r: 5 }} name="Score %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Users Active */}
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                <h2 className="font-semibold mb-4">Unique Users per Week</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} />
                    <Bar dataKey="uniqueUsers" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Total Minutes */}
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                <h2 className="font-semibold mb-4">Total Activity Minutes</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} />
                    <Bar dataKey="totalMinutes" fill="#10b981" radius={[4, 4, 0, 0]} name="Total Minutes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "report" && (
        <div className="space-y-6">
          {/* Report Filters */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
            <h2 className="font-semibold mb-4">Generate Performance Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium mb-1">Employee</label>
                  <select value={reportUserId} onChange={(e) => setReportUserId(e.target.value)} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none">
                    <option value="">All Employees</option>
                    {users.map((u) => <option key={u._id} value={u._id}>{u.email}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <button onClick={loadReport} disabled={loading} className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50">
                {loading ? "⏳ Loading..." : "📊 Generate"}
              </button>
            </div>
          </div>

          {report && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold">{report.summary.totalDays}</div>
                  <div className="text-sm text-gray-500">Total Days</div>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold text-green-500">{report.summary.totalActiveMinutes}m</div>
                  <div className="text-sm text-gray-500">Active Time</div>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold text-yellow-500">{report.summary.totalIdleMinutes}m</div>
                  <div className="text-sm text-gray-500">Idle Time</div>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold" style={{ color: report.summary.avgProductivityScore >= 70 ? "#10b981" : report.summary.avgProductivityScore >= 40 ? "#f59e0b" : "#ef4444" }}>
                    {report.summary.avgProductivityScore}%
                  </div>
                  <div className="text-sm text-gray-500">Avg Score</div>
                </div>
              </div>

              {/* Download PDF Button */}
              <div className="flex justify-end">
                <button onClick={generatePDF} className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition flex items-center gap-2">
                  📄 Export as PDF
                </button>
              </div>

              {/* Daily Table */}
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                      <th className="p-3">Date</th>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Active</th>
                      <th className="p-3">Idle</th>
                      <th className="p-3">Suspicious</th>
                      <th className="p-3">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.daily.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="p-3 border-b dark:border-gray-700">{d.date}</td>
                        <td className="p-3 border-b dark:border-gray-700">{d.name}</td>
                        <td className="p-3 border-b dark:border-gray-700 text-green-500">{d.activeMinutes}m</td>
                        <td className="p-3 border-b dark:border-gray-700 text-yellow-500">{d.idleMinutes}m</td>
                        <td className="p-3 border-b dark:border-gray-700 text-red-500">{d.suspiciousMinutes}m</td>
                        <td className="p-3 border-b dark:border-gray-700 font-bold" style={{ color: d.productivityScore >= 70 ? "#10b981" : d.productivityScore >= 40 ? "#f59e0b" : "#ef4444" }}>
                          {d.productivityScore}%
                        </td>
                      </tr>
                    ))}
                    {report.daily.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No data for this period.</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* Top Apps */}
              {report.topApps.length > 0 && (
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                  <h2 className="font-semibold mb-4">Top Applications</h2>
                  <div className="space-y-2">
                    {report.topApps.map((a, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-8 text-gray-400">#{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{a.app}</span>
                            <span className="text-gray-500">{a.count} uses</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(a.count / report.topApps[0].count) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!report && !loading && <div className="text-center py-12"><div className="text-5xl mb-3">📄</div><div className="text-gray-500">Select filters and click Generate to create a performance report.</div></div>}
        </div>
      )}
    </div>
  );
}
