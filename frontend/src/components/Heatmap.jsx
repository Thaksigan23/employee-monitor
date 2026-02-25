import { useMemo } from "react";

function buildHourlyCounts(activities) {
  // Create array of 24 hours, start with 0
  const hours = Array(24).fill(0);

  activities.forEach((a) => {
    const d = new Date(a.createdAt);
    const h = d.getHours();
    hours[h] += 1;
  });

  return hours.map((count, hour) => ({ hour, count }));
}

export default function Heatmap({ activities }) {
  const data = useMemo(() => buildHourlyCounts(activities), [activities]);

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white shadow rounded p-4 mt-6">
      <h2 className="text-lg font-semibold mb-3">Daily Activity Pulse</h2>

      <div className="grid grid-cols-12 gap-2">
        {data.map((d) => {
          const intensity = d.count / max; // 0 → 1
          const bg = `rgba(34, 197, 94, ${0.2 + intensity * 0.8})`; // green shades

          return (
            <div
              key={d.hour}
              title={`Hour ${d.hour}: ${d.count} events`}
              className="h-10 flex items-center justify-center text-xs text-white rounded"
              style={{ backgroundColor: bg }}
            >
              {d.hour}:00
            </div>
          );
        })}
      </div>
    </div>
  );
}