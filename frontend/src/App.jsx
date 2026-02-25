import { useEffect, useState } from "react";
import { fetchActivities } from "./services/api";

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

function App() {
  const [activities, setActivities] = useState([]);

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
      </div>
    </div>
  );
}

export default App;