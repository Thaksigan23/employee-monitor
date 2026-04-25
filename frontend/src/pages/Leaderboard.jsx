import { useState, useEffect, useMemo } from "react";
import { fetchLeaderboard } from "../services/api";

const MEDALS = ["🥇", "🥈", "🥉"];

function ScoreBar({ score, color }) {
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color || "#10b981" }} />
    </div>
  );
}

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState("week");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError("");
    try {
      const result = await fetchLeaderboard(period);
      setData(result);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [period]);

  const departments = useMemo(() => ["ALL", ...new Set(data.map((d) => d.department).filter(Boolean))], [data]);
  const filtered = deptFilter === "ALL" ? data : data.filter((d) => d.department === deptFilter);

  const topThree = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-3xl font-bold">🏆 Team Leaderboard</h1>
        <div className="flex gap-2 flex-wrap">
          {["day", "week", "month"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg font-medium capitalize transition ${period === p ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"}`}>
              {p}
            </button>
          ))}
          {departments.length > 1 && (
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none">
              {departments.map((d) => <option key={d} value={d}>{d === "ALL" ? "All Departments" : d}</option>)}
            </select>
          )}
        </div>
      </div>

      {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading leaderboard...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12"><div className="text-5xl mb-3">🏆</div><div className="text-gray-500">No activity data for this period yet.</div></div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((entry, idx) => {
              const podiumColors = ["from-yellow-400 to-amber-500", "from-gray-300 to-gray-400", "from-amber-600 to-orange-700"];
              const podiumSizes = ["p-8", "p-6", "p-6"];
              return (
                <div key={entry.userId} className={`bg-white dark:bg-gray-800 shadow-xl rounded-2xl ${podiumSizes[idx]} text-center relative overflow-hidden`}>
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${podiumColors[idx]}`} />
                  <div className="text-5xl mb-2">{MEDALS[idx]}</div>
                  <div className="text-xl font-bold">{entry.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{entry.email}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">{entry.department}</div>
                  <div className="text-4xl font-extrabold mb-2" style={{ color: entry.productivityScore >= 70 ? "#10b981" : entry.productivityScore >= 40 ? "#f59e0b" : "#ef4444" }}>
                    {entry.productivityScore}%
                  </div>
                  <ScoreBar score={entry.productivityScore} color={entry.productivityScore >= 70 ? "#10b981" : entry.productivityScore >= 40 ? "#f59e0b" : "#ef4444"} />
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div><div className="font-bold text-green-500">{entry.activeMinutes}</div><div className="text-gray-500">Active</div></div>
                    <div><div className="font-bold text-yellow-500">{entry.idleMinutes}</div><div className="text-gray-500">Idle</div></div>
                    <div><div className="font-bold text-red-500">{entry.suspiciousMinutes}</div><div className="text-gray-500">Flag</div></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rest of the leaderboard */}
          {rest.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                    <th className="p-3 w-12">#</th>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Active</th>
                    <th className="p-3">Idle</th>
                    <th className="p-3 w-48">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((entry) => (
                    <tr key={entry.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3 border-b dark:border-gray-700 font-bold text-gray-400">#{entry.rank}</td>
                      <td className="p-3 border-b dark:border-gray-700">
                        <div className="font-medium">{entry.name}</div>
                        <div className="text-xs text-gray-500">{entry.email}</div>
                      </td>
                      <td className="p-3 border-b dark:border-gray-700 text-sm">{entry.department}</td>
                      <td className="p-3 border-b dark:border-gray-700 text-green-500 font-medium">{entry.activeMinutes}m</td>
                      <td className="p-3 border-b dark:border-gray-700 text-yellow-500">{entry.idleMinutes}m</td>
                      <td className="p-3 border-b dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="font-bold min-w-[40px]" style={{ color: entry.productivityScore >= 70 ? "#10b981" : entry.productivityScore >= 40 ? "#f59e0b" : "#ef4444" }}>
                            {entry.productivityScore}%
                          </span>
                          <ScoreBar score={entry.productivityScore} color={entry.productivityScore >= 70 ? "#10b981" : entry.productivityScore >= 40 ? "#f59e0b" : "#ef4444"} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
