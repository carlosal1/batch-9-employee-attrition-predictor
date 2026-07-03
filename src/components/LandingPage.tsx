import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Cpu, TrendingUp, Sliders, BarChart3, AlertCircle } from 'lucide-react';

interface LandingPageProps {
  onLoginSuccess: () => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate small high-quality network verification
    setTimeout(() => {
      if (username.trim().toLowerCase() === 'masterclass' && password === 'agentic2026') {
        localStorage.setItem('patria_auth', 'authenticated');
        onLoginSuccess();
      } else {
        setError('Invalid credentials. Please verify your security token.');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white" id="landing-root">
      {/* Background radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-lg text-white">PATRIA &amp; CO.</span>
            <span className="text-[10px] block text-indigo-400 font-semibold tracking-wider uppercase font-mono">Enterprise Suite</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Engine v2.4 Live</span>
        </div>
      </header>

      {/* Main Content split into Hero & Secure Login Form */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 md:py-20 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* LEFT COLUMN: HERO INFORMATION */}
        <div className="lg:col-span-7 flex flex-col gap-6 lg:pr-8">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-4">
              <Cpu className="w-3.5 h-3.5" /> High-Fidelity Agentic AI ML Simulator
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Predictive Talent Churn <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200">
                &amp; Attrition Engine
              </span>
            </h1>
            <p className="text-slate-400 mt-4 text-sm sm:text-base max-w-xl leading-relaxed">
              An advanced decision-support platform designed by Dr Harry Patria to foresee organizational attrition risks. Simulate what-if scenarios in real-time, backed by GradientBoostingClassifier pipeline models and high-resolution SHAP explanations.
            </p>
          </motion.div>

          {/* Feature Grid */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-850 flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">What-If Simulation</h3>
                <p className="text-[11px] text-slate-400 mt-1">Manipulate employee context parameters and forecast probability instant changes.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-850 flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">SHAP Explainers</h3>
                <p className="text-[11px] text-slate-400 mt-1">High-resolution horizontal bar charts break down mathematical force contributions.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-850 flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Gradient Boosting</h3>
                <p className="text-[11px] text-slate-400 mt-1">Dual-engine support: Logistic Regression Baseline and pickle Gradient Boosting model.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-850 flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Intervention Engine</h3>
                <p className="text-[11px] text-slate-400 mt-1">Automated prescriptive action planner maps risks straight to tailored HR remedies.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: SECURE SIGN-IN FORM */}
        <div className="lg:col-span-5 flex justify-center">
          <motion.div 
            className="w-full max-w-sm p-8 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400" />
            
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Authorized Access</h2>
              <p className="text-xs text-slate-400 mt-1">Please enter your master credentials to initialize.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. masterclass"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans placeholder:text-slate-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Password</label>
                <input
                  type="password"
                  required
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans placeholder:text-slate-600"
                />
              </div>

              <div className="text-[11px] text-slate-500 leading-normal bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-center font-mono select-none">
                Hint: Use default masterclass security credentials to evaluate.
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 text-xs font-bold py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Access Simulator</span>
                )}
              </button>
            </form>
          </motion.div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>&copy; 2026 Patria &amp; Co. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Charter</a>
          <a href="#" className="hover:text-slate-300 transition-colors">System Diagnostics</a>
        </div>
      </footer>
    </div>
  );
}
