import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white font-sans flex flex-col">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 lg:px-20 border-b border-white/10">
        <div className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
          Employee Monitor
        </div>
        <div className="space-x-4 flex items-center">
          <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-4xl space-y-8 animate-fade-in-up">
          <div className="inline-block px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-medium tracking-wide mb-4">
            Next-Gen Workforce Analytics
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter">
            Empower your team with <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
              smart monitoring.
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Boost productivity, ensure compliance, and gain real-time insights into your remote workforce seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link
              to="/register"
              className="px-8 py-4 w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold rounded-full text-lg shadow-xl shadow-green-500/20 transition-all hover:-translate-y-1"
            >
              Start For Free
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white font-bold rounded-full text-lg backdrop-blur-sm border border-white/10 transition-all"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full mt-24 mb-16">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl mb-4">
              ⏱️
            </div>
            <h3 className="text-xl font-bold mb-2">Real-Time Tracking</h3>
            <p className="text-gray-400">Monitor active windows and idle time to ensure maximum productivity.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl mb-4">
              📊
            </div>
            <h3 className="text-xl font-bold mb-2">Advanced Analytics</h3>
            <p className="text-gray-400">Generate powerful insights and heatmaps based on workforce activity.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="w-12 h-12 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-2xl mb-4">
              🛡️
            </div>
            <h3 className="text-xl font-bold mb-2">Secure & Compliant</h3>
            <p className="text-gray-400">Role-based access control and strict privacy standards for your team.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
