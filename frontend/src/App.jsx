import { useEffect, useState } from "react";
import { fetchActivities } from "./services/api";
import Heatmap from "./components/Heatmap";
function StatusBadge({ status }) {
  const colors = {
    Active: "bg-green-500",
    Idle: "bg-yellow-500",
    Suspicious: "bg-red-500"
  };

  return (
    <span className={`px-2 py-1 text-white rounded ${colors[status] || "bg-gray-500"}`}>
      {status}
    </span>
  );
}

function getLatestStatusByEmployee(activities) {
  const map = new Map();

  // activities are already sorted newest → oldest from backend
  for (const a of activities) {
    if (!map.has(a.employeeId)) {
      map.set(a.employeeId, a.status);
    }
  }

  const counts = { Active: 0, Idle: 0, Suspicious: 0 };

  for (const status of map.values()) {
    if (counts[status] !== undefined) counts[status]++;
  }

  return counts;
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white shadow rounded p-4 flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
      <div className={`w-3 h-3 rounded-full ${color}`} />
    </div>
  );
}

function App() {
  const [activities, setActivities] = useState([]);
const stats = getLatestStatusByEmployee(activities);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // refresh every 5 sec
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    const data = await fetchActivities();
    setActivities(data);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Employee Activity Dashboard</h1>

<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  <StatCard label="Active Now" value={stats.Active} color="bg-green-500" />
  <StatCard label="Idle Now" value={stats.Idle} color="bg-yellow-500" />
  <StatCard label="Suspicious Now" value={stats.Suspicious} color="bg-red-500" />
</div>

      <div className="bg-white shadow rounded p-4">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Employee</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Window</th>
              <th className="p-2 border">Time</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a._id}>
                <td className="p-2 border">{a.employeeId}</td>
                <td className="p-2 border">
                  <StatusBadge status={a.status} />
                </td>
                <td className="p-2 border">{a.windowTitle}</td>
                <td className="p-2 border">
                  {new Date(a.createdAt).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Heatmap activities={activities} />
      </div>
    </div>
  );
}

export default App;