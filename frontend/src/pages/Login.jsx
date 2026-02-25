import { useState } from "react";
import { login } from "../services/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin();
    } catch {
      setError("Invalid credentials");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6">
          Admin Login
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>
              Email
            </label>
            <input
              className="w-full border rounded px-3 py-2 mt-1 dark:bg-gray-700 dark:border-gray-600"
              type="email"
              placeholder="admin@test.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label>
              Password
            </label>
            <input
              className="w-full border rounded px-3 py-2 mt-1 dark:bg-gray-700 dark:border-gray-600"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
          >
            Login
          </button>
        </form>

        <div className="text-xs text-gray-500 mt-4 text-center">
          Use: admin@test.com / admin123
        </div>
      </div>
    </div>
  );
}