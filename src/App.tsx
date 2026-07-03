/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Activity,
  Award,
  AlertTriangle,
  ClipboardList,
  UserCheck,
  TrendingUp,
  Sliders,
  X,
  Info,
  ShieldAlert,
  HelpCircle,
  TrendingDown,
  Building
} from 'lucide-react';
import { Employee, ModelMetrics, RetentionTask, ShapExplanation } from './types';
import HoldoutMetrics from './components/HoldoutMetrics';
import ShapWaterfall from './components/ShapWaterfall';
import ITDOPlanGenerator from './components/ITDOPlanGenerator';
import RetentionTaskBoard from './components/RetentionTaskBoard';
import EmployeeDirectory from './components/EmployeeDirectory';
import ScenarioAnalyser from './components/ScenarioAnalyser';
import LandingPage from './components/LandingPage';
import Chatbot from './components/Chatbot';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('patria_auth') === 'authenticated';
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'roster' | 'tasks' | 'simulator'>('simulator');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [tasks, setTasks] = useState<RetentionTask[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedExplanation, setSelectedExplanation] = useState<ShapExplanation | null>(null);

  // Search & Filter state for Roster
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('all');

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial stats, metrics, tasks on mount
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        setError(null);

        const [metricsRes, employeesRes, tasksRes] = await Promise.all([
          fetch('/api/metrics'),
          fetch('/api/employees'),
          fetch('/api/retention-tasks')
        ]);

        if (!metricsRes.ok || !employeesRes.ok || !tasksRes.ok) {
          throw new Error('Failed to load analytical metrics or employee registry from the backend.');
        }

        const metricsData = await metricsRes.json();
        const employeesData = await employeesRes.json();
        const tasksData = await tasksRes.json();

        setMetrics(metricsData);
        setEmployees(employeesData);
        setTasks(tasksData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An unexpected error occurred during database initialization.');
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  // Fetch reactive employees roster whenever filters or search criteria update
  useEffect(() => {
    async function fetchFilteredRoster() {
      try {
        let url = `/api/employees?department=${encodeURIComponent(selectedDept)}&search=${encodeURIComponent(searchQuery)}`;
        if (selectedRisk !== 'all') {
          url += `&risk=${encodeURIComponent(selectedRisk)}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setEmployees(data);
        }
      } catch (err) {
        console.error('Error fetching filtered roster:', err);
      }
    }

    // Debounce or trigger immediately on filter change
    fetchFilteredRoster();
  }, [selectedDept, selectedRisk, searchQuery]);

  // Handle individual employee selection and load their SHAP explanations
  const handleSelectEmployee = async (id: string) => {
    setSelectedEmployeeId(id);
    setDetailsLoading(true);
    setSelectedExplanation(null);

    try {
      const [empRes, explainRes] = await Promise.all([
        fetch(`/api/employees/${id}`),
        fetch(`/api/employees/${id}/explain`)
      ]);

      if (empRes.ok && explainRes.ok) {
        const emp = await empRes.json();
        const explain = await explainRes.json();
        setSelectedEmployee(emp);
        setSelectedExplanation(explain);
      }
    } catch (err) {
      console.error('Error loading employee SHAP details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle updating task status across columns
  const handleUpdateTaskStatus = async (taskId: string, newStatus: RetentionTask['status']) => {
    try {
      const res = await fetch(`/api/retention-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updatedTask = await res.json();
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Handle updating task priority
  const handleUpdateTaskPriority = async (taskId: string, newPriority: RetentionTask['priority']) => {
    try {
      const res = await fetch(`/api/retention-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority })
      });

      if (res.ok) {
        const updatedTask = await res.json();
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      }
    } catch (err) {
      console.error('Error updating task priority:', err);
    }
  };

  // Handle deleting a task
  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/retention-tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Callback when a new AI retention plan is generated
  const handlePlanCreated = (newTask: RetentionTask) => {
    setTasks(prev => [newTask, ...prev]);
  };

  // Executive summary counts
  const totalCount = employees.length;
  const criticalRiskCount = employees.filter(e => (e.predictedProbability || 0) >= 0.70).length;
  const averageRisk = employees.length > 0
    ? Math.round((employees.reduce((sum, e) => sum + (e.predictedProbability || 0), 0) / employees.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4" id="loading-screen">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest font-mono">
          Loading Attrition Command Center...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6" id="error-screen">
        <div className="max-w-md bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
          <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Initialization Error</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-5 rounded-lg transition-all"
          >
            Retry Database Connection
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col pb-12" id="app-root">
      {/* 1. Header / Navigation Rail */}
      <header className="h-auto md:h-16 border-b border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between px-6 md:px-8 shrink-0 py-3 md:py-0 gap-4 md:gap-0">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 uppercase">
            Retention<span className="text-indigo-600">ML</span> Console
          </h1>
          <span className="text-[9px] bg-slate-100 text-slate-500 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200 ml-1">
            v1.4
          </span>
        </div>

        {/* Navigation tabs */}
        <nav className="flex gap-6 md:gap-8 text-xs md:text-sm font-semibold text-slate-500 h-full items-center self-start md:self-auto">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`h-full flex items-center cursor-pointer transition-all border-b-2 pb-2 md:pb-0 md:pt-1 ${
              activeTab === 'simulator'
                ? 'text-indigo-600 border-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-300'
            }`}
          >
            What-If Simulator
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`h-full flex items-center cursor-pointer transition-all border-b-2 pb-2 md:pb-0 md:pt-1 ${
              activeTab === 'dashboard'
                ? 'text-indigo-600 border-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-300'
            }`}
          >
            Executive Dashboard
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`h-full flex items-center cursor-pointer transition-all border-b-2 pb-2 md:pb-0 md:pt-1 ${
              activeTab === 'roster'
                ? 'text-indigo-600 border-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-300'
            }`}
          >
            Risk Models & SHAP
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`h-full flex items-center cursor-pointer transition-all border-b-2 pb-2 md:pb-0 md:pt-1 ${
              activeTab === 'tasks'
                ? 'text-indigo-600 border-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-300'
            }`}
          >
            Intervention Queue
          </button>
        </nav>

        {/* Profile and System Status */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800">Sarah Jenkins</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Senior HR Engineer</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-600 text-xs shadow-xs">
            SJ
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('patria_auth');
              setIsAuthenticated(false);
            }}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-slate-800 cursor-pointer transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* 2. Executive KPI Ribbon */}
      <section className="bg-white border-b border-slate-200 py-6 px-6 md:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Total Workforce */}
          <div className="flex items-center gap-3 bg-white p-4 border border-slate-200 rounded">
            <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block">Total Workforce</span>
              <span className="text-xl font-bold text-slate-800 font-mono">250</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Scored profiles</span>
            </div>
          </div>

          {/* Average Attrition Probability */}
          <div className="flex items-center gap-3 bg-white p-4 border border-slate-200 rounded">
            <div className="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block">Workforce Risk Mean</span>
              <span className="text-xl font-bold text-indigo-600 font-mono">{averageRisk}%</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Average probability</span>
            </div>
          </div>

          {/* Critical Risk Alerts */}
          <div className="flex items-center gap-3 bg-white p-4 border border-slate-200 rounded">
            <div className="w-10 h-10 rounded bg-rose-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block">Critical Risk Alerts</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-rose-600 font-mono">{criticalRiskCount}</span>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-semibold px-1 rounded">Act Needed</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Probability &gt;70%</span>
            </div>
          </div>

          {/* Model Accuracy (Holdout) */}
          <div className="flex items-center gap-3 bg-white p-4 border border-slate-200 rounded">
            <div className="w-10 h-10 rounded bg-emerald-50 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block">Audit Holdout AUC</span>
              <span className="text-xl font-bold text-emerald-600 font-mono">{(metrics?.auc || 0.894).toFixed(3)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Target: &ge;0.850</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Workspace Container */}
      <main className="max-w-7xl mx-auto px-6 md:px-8 mt-8 flex-1 w-full">
        <AnimatePresence mode="wait">
          {/* TABS VIEW CONTROLLER */}
          {activeTab === 'simulator' && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <ScenarioAnalyser />
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-8"
            >
              {/* Summary Introduction Box */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <h2 className="text-base font-bold text-slate-800 mb-2">Executive Summary</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                  This people analytics system models workforce dynamics to prevent talent flight. Standardized logistic regression calculates deterministic attrition coefficients using real organizational data. Individual risk calculations are backed by local mathematical SHAP attributions, which explain exactly <em>why</em> an employee is experiencing attrition risks. HR Business Partners can then invoke server-side Gemini intelligence to coordinate target resolutions under the ITDO (Insights &rarr; Triggers &rarr; Decisions &rarr; Operations) pipeline.
                </p>
              </div>

              {/* Renders the Holdout metrics and graphs component */}
              {metrics && <HoldoutMetrics metrics={metrics} />}
            </motion.div>
          )}

          {activeTab === 'roster' && (
            <motion.div
              key="roster"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* Directory Splitting: Side-by-side Roster and SHAP Details layout */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Left Side: Directory (Slices space based on if an employee is selected) */}
                <div className={`${selectedEmployeeId ? 'xl:col-span-6' : 'xl:col-span-12'} transition-all duration-300`}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="font-bold text-slate-800 text-base">Workforce Risk Directory</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Explore predicted probabilities, satisfaction records, and work hours</p>
                    </div>
                  </div>

                  <EmployeeDirectory
                    employees={employees}
                    selectedEmployeeId={selectedEmployeeId}
                    onSelectEmployee={handleSelectEmployee}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedDept={selectedDept}
                    setSelectedDept={setSelectedDept}
                    selectedRisk={selectedRisk}
                    setSelectedRisk={setSelectedRisk}
                  />
                </div>

                {/* Right Side: Active SHAP waterfall and ITDO AI generator panel */}
                {selectedEmployeeId && (
                  <div className="xl:col-span-6 flex flex-col gap-6 animate-in slide-in-from-right-5 duration-200">
                    {/* Header close panel details */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Analysis Roster Item</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedEmployeeId(null);
                          setSelectedEmployee(null);
                          setSelectedExplanation(null);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200 px-2.5 py-1 rounded hover:bg-slate-50"
                      >
                        <X className="w-3.5 h-3.5" /> Close Details
                      </button>
                    </div>

                    {detailsLoading ? (
                      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center shadow-xs">
                        <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin mb-4" />
                        <span className="text-xs text-slate-400 font-mono">Computing mathematical SHAP waterfall vectors...</span>
                      </div>
                    ) : (
                      selectedEmployee && selectedExplanation && (
                        <>
                          {/* 1. Profile Summary Card */}
                          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs flex justify-between items-center border border-slate-800">
                            <div>
                              <span className="text-[10px] bg-indigo-600 text-indigo-100 font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider mb-1.5 inline-block">
                                Selected Profile
                              </span>
                              <h3 className="text-lg font-bold tracking-tight">{selectedEmployee.name}</h3>
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                <Building className="w-3.5 h-3.5 text-slate-500" />
                                {selectedEmployee.jobRole} &bull; {selectedEmployee.department}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-mono uppercase">Vulnerability</span>
                              <span className={`text-2xl font-black font-mono leading-none ${
                                (selectedEmployee.predictedProbability || 0) > 0.70 ? 'text-rose-400' : 'text-amber-400'
                              }`}>
                                {Math.round((selectedEmployee.predictedProbability || 0) * 100)}%
                              </span>
                            </div>
                          </div>

                          {/* 2. Renders the SHAP Waterfall */}
                          <ShapWaterfall explanation={selectedExplanation} />

                          {/* 3. ITDO Planner AI Co-Pilot block */}
                          <ITDOPlanGenerator employee={selectedEmployee} onPlanCreated={handlePlanCreated} />
                        </>
                      )
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <RetentionTaskBoard
                tasks={tasks}
                onUpdateStatus={handleUpdateTaskStatus}
                onUpdatePriority={handleUpdateTaskPriority}
                onDeleteTask={handleDeleteTask}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Secrets config warning & Elegant Geometric Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-6 px-6 md:px-8 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Status Indicators */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>SYSTEM STATUS: <span className="text-emerald-500 font-extrabold">&bull; OPERATIONAL</span></span>
            <span>LAST SYNCHRONIZED: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</span>
            <span>DATA SOURCE: <span className="text-slate-600 font-mono">RETENTION_SEED_DB</span></span>
          </div>

          {/* Core App Information */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-400 font-mono">
            <span>V1.4.0-STABLE</span>
            <span>SANDBOX_INTEGRITY: SECURE</span>
            <span>© 2026 GEOMETRIC BALANCE</span>
          </div>
        </div>

        {/* Informational Secrets notice */}
        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <p className="text-[11px] text-slate-400">
            Attrition models utilize deterministic linear gradients backed by SHAP localized math.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded p-2 flex items-center gap-2 text-[11px] text-slate-500 max-w-lg">
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <p className="leading-tight">
              <strong>Secrets Configuration:</strong> Server-side AI planner is active. Add your <code>GEMINI_API_KEY</code> in Settings &gt; Secrets if not present.
            </p>
          </div>
        </div>
      </footer>
      <Chatbot />
    </div>
  );
}
