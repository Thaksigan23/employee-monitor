const API_URL = "http://localhost:5000/api/activity";

export async function fetchActivities() {
  const res = await fetch(API_URL);
  return res.json();
}