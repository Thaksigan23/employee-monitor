import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";

function buildTimeSeries(activities) {
  // Group by minute (HH:MM)
  const map = new Map();

  activities.forEach((a) => {
    if (!a.createdAt) return;
    const d = new Date(a.createdAt);
    const key = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    map.set(key, (map.get(key) || 0) + 1);
  });

  // Convert to sorted array
  const arr = Array.from(map.entries()).map(([time, count]) => ({ time, count }));
  arr.sort((a, b) => (a.time > b.time ? 1 : -1));

  return arr;
}

export default function ActivityLineChart({ activities }) {
  const data = useMemo(() => buildTimeSeries(activities), [activities]);

  return (
    <div className="bg-white shadow rounded p-4 mt-6">
      <h2 className="text-lg font-semibold mb-3">Activity Over Time</h2>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}