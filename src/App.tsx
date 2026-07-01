import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  LayoutDashboard, 
  SlidersHorizontal, 
  UploadCloud, 
  BellRing, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  Radio, 
  Brain,
  Menu,
  X,
  Lock,
  ArrowRight,
  LogOut,
  ShieldCheck,
  Award,
  Terminal,
  Activity,
  Bot
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import SlicerPredictor from './components/SlicerPredictor';
import BatchPredictor from './components/BatchPredictor';
import AlertsManager from './components/AlertsManager';
import TaskKanban from './components/TaskKanban';
import ModelInsights from './components/ModelInsights';
import SettingsPanel from './components/SettingsPanel';
import RetentionCopilot from './components/RetentionCopilot';
import FloatingChatbot from './components/FloatingChatbot';
import { Employee, Alert, Task, PredictionResult } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('attrition_pro_auth') === 'true';
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  
  // App System Stats
  const [systemPrompt, setSystemPrompt] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(0.70);
  const [serverOnline, setServerOnline] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    setTimeout(() => {
      if (loginUsername.trim().toLowerCase() === 'masterclass' && loginPassword === 'agentic2026') {
        setIsAuthenticated(true);
        localStorage.setItem('attrition_pro_auth', 'true');
        setLoginError('');
      } else {
        setLoginError('Invalid username or password.');
      }
      setIsLoggingIn(false);
    }, 600);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('attrition_pro_auth');
    setActiveTab('dashboard');
  };

  // Initial Fetch Loops
  useEffect(() => {
    async function initApp() {
      try {
        const hRes = await fetch('/api/health');
        if (hRes.ok) setServerOnline(true);

        const sRes = await fetch('/api/settings');
        if (sRes.ok) {
          const sData = await sRes.json();
          setSystemPrompt(sData.system_prompt);
          setAlertThreshold(sData.alert_threshold);
        }

        await Promise.all([
          fetchEmployees(),
          fetchAlerts(),
          fetchTasks()
        ]);
      } catch (e) {
        console.error('Initialization fetch error:', e);
      }
    }
    initApp();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (e) { console.error('Failed to load employees:', e); }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) { console.error('Failed to load alerts:', e); }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) { console.error('Failed to load tasks:', e); }
  };

  // State Transition Actions

  const handleUpdateAlertStatus = async (alertId: string, status: Alert['status']) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setAlerts(prev => prev.map(a => a.id === alertId ? updated : a));
      }
    } catch (e) { console.error('Error updating alert:', e); }
  };

  const handleAssignAlert = async (alertId: string, email: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: email })
      });
      if (res.ok) {
        const updated = await res.json();
        setAlerts(prev => prev.map(a => a.id === alertId ? updated : a));
      }
    } catch (e) { console.error('Error assigning alert:', e); }
  };

  const handleSaveAlert = async (result: PredictionResult) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prediction_id: result.prediction_id,
          employee_id: result.employee_id,
          employee_name: result.employee_name,
          department: employees.find(e => e.id === result.employee_id)?.department || 'Research & Development',
          job_role: employees.find(e => e.id === result.employee_id)?.job_role || 'Research Scientist',
          threshold: alertThreshold,
          attrition_probability: result.attrition_probability,
          status: 'OPEN'
        })
      });
      if (res.ok) {
        await fetchAlerts();
      }
    } catch (e) { console.error('Error saving alert:', e); }
  };

  const handleSaveBatchAlerts = async (results: PredictionResult[]) => {
    try {
      for (const res of results) {
        await handleSaveAlert(res);
      }
    } catch (e) { console.error('Error batch saving alerts:', e); }
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks(prev => [newTask, ...prev]);
      }
    } catch (e) { console.error('Error creating task:', e); }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      }
    } catch (e) { console.error('Error updating task:', e); }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (e) { console.error('Error deleting task:', e); }
  };

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
  };

  const handleSettingsUpdated = (thresh: number, pr: string) => {
    setAlertThreshold(thresh);
    setSystemPrompt(pr);
  };

  // Nav items mappings
  const navItems = [
    { id: 'dashboard', label: 'HR Dashboard', icon: LayoutDashboard },
    { id: 'predict', label: 'Talent Sandbox', icon: SlidersHorizontal },
    { id: 'batch', label: 'Batch Assessment', icon: UploadCloud },
    { id: 'copilot', label: 'AI Retention Copilot', icon: Bot },
    { id: 'alerts', label: 'Alerts Logs', icon: BellRing, badge: alerts.filter(a => a.status === 'OPEN').length },
    { id: 'tasks', label: 'Operations Board', icon: CheckSquare, badge: tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length },
    { id: 'model', label: 'Model Metrics', icon: BarChart3 },
    { id: 'settings', label: 'System Controls', icon: Settings }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            alerts={alerts}
            tasks={tasks}
            employeesCount={employees.length || 1470}
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectEmployee={handleSelectEmployee}
          />
        );
      case 'predict':
        return (
          <SlicerPredictor
            employees={employees}
            selectedEmployeeId={selectedEmployeeId}
            onSaveAlert={handleSaveAlert}
            systemPrompt={systemPrompt}
          />
        );
      case 'batch':
        return (
          <BatchPredictor
            onSaveBatchAlerts={handleSaveBatchAlerts}
          />
        );
      case 'copilot':
        return (
          <RetentionCopilot
            employees={employees}
          />
        );
      case 'alerts':
        return (
          <AlertsManager
            alerts={alerts}
            onUpdateAlertStatus={handleUpdateAlertStatus}
            onAssignAlert={handleAssignAlert}
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectEmployee={handleSelectEmployee}
          />
        );
      case 'tasks':
        return (
          <TaskKanban
            tasks={tasks}
            employees={employees}
            onCreateTask={handleCreateTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
          />
        );
      case 'model':
        return <ModelInsights />;
      case 'settings':
        return (
          <SettingsPanel
            onSettingsUpdated={handleSettingsUpdated}
          />
        );
      default:
        return <div className="text-white text-xs font-mono">Select Tab.</div>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-y-auto select-none font-sans p-4 md:p-8">
        {/* Background Ambience Dots & Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none animate-pulse" />

        {/* Header Branding */}
        <header className="w-full max-w-7xl mx-auto flex items-center justify-between pb-8 border-b border-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Brain className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white uppercase">
              ATTRITION<span className="text-cyan-500 underline decoration-2 underline-offset-4">PRO</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Model Status: Standard Active
          </div>
        </header>

        {/* Hero & Authentication Grid */}
        <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-10 z-10">
          
          {/* Left Hero Description (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-mono text-indigo-300">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>PRESCRIPTIVE TALENT MANAGEMENT PLATFORM</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Predict Employee <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-indigo-400">Attrition Risk</span> Before It Occurs
            </h1>
            
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl">
              AttritionPro operates on a robust machine learning classification pipeline to quantify staff turnover risks, evaluate what-if scenarios in real-time, and prescribe immediate, AI-driven retention plans.
            </p>

            {/* Feature Checkmarks list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wide">Talent Sandbox</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Adjust sliders to simulate employee parameters and visualize direct SHAP contributions.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wide">Batch Predictor</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Upload a CSV profile batch to run bulk classification evaluations instantly.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wide">Shapley Values Chart</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Zero-centered horizontal plot displaying precise feature influence breakdown.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wide">Stay Task Kanban</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Track and organize actionable stay agreements and retention checklists.</p>
                </div>
              </div>
            </div>

            {/* Model Metadata Snapshot Card */}
            <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-sm flex items-center gap-4">
              <Terminal className="w-8 h-8 text-indigo-400 shrink-0" />
              <div className="text-left font-mono text-[10px] space-y-1 text-slate-400">
                <p className="text-slate-200 font-bold uppercase tracking-wider">HARRY PATRIA MODEL SPECIFICATIONS</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-4">
                  <p>• Algorithm: <span className="text-cyan-400">GradientBoosting</span></p>
                  <p>• Estimators: <span className="text-cyan-400">300</span></p>
                  <p>• Max Depth: <span className="text-cyan-400">4</span></p>
                  <p>• Learning Rate: <span className="text-cyan-400">0.05</span></p>
                  <p>• CV ROC-AUC Mean: <span className="text-cyan-400">82.34%</span></p>
                  <p>• Holdout Test AUC: <span className="text-cyan-400">80.02%</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Authentication Form (lg:col-span-5) */}
          <div className="lg:col-span-5 w-full">
            <div className="border border-slate-800 bg-slate-900/40 rounded-sm p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
              
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" /> Unlock Portal Access
                </h2>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">Authorized stay leaders authentication</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1.5">Username</label>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter system username"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm py-2 px-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter security password"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm py-2 px-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                  />
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xs rounded-sm font-mono flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <p>{loginError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-sm text-xs font-mono tracking-widest transition-all uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-500/10 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>Verifying Credentials...</>
                  ) : (
                    <>
                      <span>Enter Stay Center</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>


            </div>
          </div>

        </main>

        {/* Footer Brand Info */}
        <footer className="w-full max-w-7xl mx-auto border-t border-slate-900 pt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-slate-500 gap-4 z-10">
          <div>
            © 2026 AttritionPro Prescriptive Analytics • Dr Harry Patria & Patria & Co.
          </div>
          <div className="flex gap-4">
            <span>MODEL: gb_v1_dp_harry</span>
            <span>DATASET: IBM HR ATTRITION</span>
          </div>
        </footer>
        <FloatingChatbot />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-300 overflow-hidden relative select-none">
      
      {/* Background Ambience Dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* Sidebar - Desktop Layout */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 z-10">
        
        {/* Brand Banner */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-slate-950" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white uppercase">
            ATTRITION<span className="text-cyan-500 underline decoration-2 underline-offset-4">PRO</span>
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-sm text-xs font-medium font-mono tracking-wide transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700/60'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isActive ? (
                    <div className="w-1.5 h-3.5 bg-cyan-500 rounded-full shrink-0"></div>
                  ) : (
                    <item.icon className="w-4 h-4 text-slate-500 ml-4 shrink-0" />
                  )}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-cyan-500 text-slate-950' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Terminate Session Logout Control */}
        <div className="p-4 border-t border-slate-850">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-900/30 text-rose-400 font-bold py-2 rounded text-xs font-mono transition-all cursor-pointer uppercase tracking-wider"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminate Session</span>
          </button>
        </div>

        {/* User Profile Info Card */}
        <div className="p-4 border-t border-slate-850 bg-slate-950/20">
          <div className="flex items-center gap-3 p-2 border border-slate-800/40 rounded bg-slate-900/50">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 text-slate-100 font-bold text-xs shrink-0 select-none">
              JD
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-200 truncate">Jordan Davis</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest truncate">Chief People Officer</div>
            </div>
          </div>
        </div>

        {/* Server Health Status Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-[10px] font-mono text-slate-500 select-none">
          <span className="flex items-center gap-1.5">
            <Radio className={`w-3.5 h-3.5 ${serverOnline ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
            EXPRESS BACKEND
          </span>
          <span className={serverOnline ? 'text-cyan-400' : 'text-slate-600'}>
            {serverOnline ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-5 z-20 select-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-cyan-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-slate-950" />
          </div>
          <span className="text-xs uppercase font-bold text-slate-200 font-mono tracking-wider">ATTRITION<span className="text-cyan-400 underline decoration-1 underline-offset-2">PRO</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="text-rose-400 hover:text-rose-300 p-2 bg-rose-950/10 border border-rose-900/20 rounded cursor-pointer text-[10px] font-mono uppercase tracking-wider"
          >
            Logout
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-400 p-2 hover:text-slate-200 bg-slate-850 border border-slate-800 rounded cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Slide-over */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/90 z-30 lg:hidden pt-16 flex flex-col select-none">
          <nav className="flex-1 p-6 space-y-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-850 text-white border border-slate-700 font-mono'
                      : 'text-slate-400 hover:bg-slate-900 font-mono'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4.5 h-4.5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-xs font-mono bg-cyan-500 text-slate-950 px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Content Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden pt-16 lg:pt-0">
        <main className="flex-1 p-5 lg:p-8 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="h-full max-w-7xl mx-auto"
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Status Bar Footer */}
        <footer className="h-8 bg-slate-900 border-t border-slate-800 px-8 flex items-center justify-between text-[10px] font-mono select-none text-slate-500 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> SYSTEM LIVE
            </span>
            <span className="hidden sm:inline">NODE: US-EAST-1</span>
            <span className="hidden sm:inline">DB: SUPABASE-PRIMARY</span>
          </div>
          <div className="uppercase tracking-widest text-right">
            ITDO Framework v4.21.0
          </div>
        </footer>
      </div>
      <FloatingChatbot />
    </div>
  );
}
