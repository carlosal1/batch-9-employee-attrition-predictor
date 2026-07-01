import React from 'react';
import { motion } from 'motion/react';
import { Users, AlertTriangle, CheckSquare, ShieldAlert, Sparkles, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Alert, Task } from '../types';

interface DashboardProps {
  alerts: Alert[];
  tasks: Task[];
  employeesCount: number;
  onNavigate: (tab: string) => void;
  onSelectEmployee: (empId: string) => void;
}

export default function Dashboard({ alerts, tasks, employeesCount, onNavigate, onSelectEmployee }: DashboardProps) {
  const activeAlerts = alerts.filter(a => a.status === 'OPEN').length;
  const highRiskCount = alerts.filter(a => a.status === 'OPEN' && a.attrition_probability >= 0.70).length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const pendingTasks = tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;

  // Calculate high-level HR stats
  const retentionRate = 100 - parseFloat(((activeAlerts / (employeesCount || 1)) * 100).toFixed(1));

  // Prep heat map data (Attrition Rate & count by department)
  const deptRiskMap = alerts.reduce((acc, alert) => {
    if (!acc[alert.department]) {
      acc[alert.department] = { name: alert.department, count: 0, sumProb: 0 };
    }
    acc[alert.department].count += 1;
    acc[alert.department].sumProb += alert.attrition_probability;
    return acc;
  }, {} as Record<string, { name: string; count: number; sumProb: number }>);

  const heatmapData = Object.values(deptRiskMap).map(d => ({
    name: d.name,
    'Average Probability (%)': Math.round((d.sumProb / d.count) * 100),
    'Alert Count': d.count
  }));

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-sm font-bold text-slate-100 tracking-wider uppercase">Insight Layer: Portfolio Attrition Analysis</h1>
          <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-widest">Model v1.0.4 • Trained 12h ago • AUC 0.88</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => onNavigate('batch')}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-sm flex items-center gap-2 cursor-pointer transition-all uppercase tracking-wider shadow-sm font-mono"
          >
            RUN BATCH PREDICTION
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Active Headcount',
            value: employeesCount || 1470,
            sub: 'Active Employee Pool',
            icon: Users,
            barClass: 'bg-cyan-500'
          },
          {
            title: 'High Risk Count',
            value: highRiskCount,
            sub: `Risk threshold > 70%`,
            icon: ShieldAlert,
            barClass: 'bg-rose-500'
          },
          {
            title: 'Retention Value',
            value: `${retentionRate}%`,
            sub: 'Goal threshold > 90%',
            icon: TrendingDown,
            barClass: 'bg-emerald-500',
            italic: true
          },
          {
            title: 'Resolved Tasks',
            value: `${completedTasks} / ${tasks.length || 0}`,
            sub: `${pendingTasks} Interventions Remaining`,
            icon: CheckSquare,
            barClass: 'bg-slate-600'
          }
        ].map((kpi, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="bg-slate-900 border border-slate-800 p-5 rounded-sm relative overflow-hidden shadow-md"
          >
            <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1 flex items-center justify-between">
              <span>{kpi.title}</span>
              <kpi.icon className="w-3.5 h-3.5 opacity-40 text-slate-400" />
            </div>
            <h3 className={`text-3xl font-light text-white tracking-tight ${kpi.italic ? 'italic' : ''}`}>{kpi.value}</h3>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-mono">{kpi.sub}</p>
            <div className={`absolute bottom-0 left-0 h-1 ${kpi.barClass} w-full opacity-30`}></div>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Heatmap (Recharts) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 border border-slate-800 bg-slate-900/60 rounded-sm p-5 shadow-lg flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-none"></span>
                Risk Intensity Heatmap <span className="text-slate-500">/ BY DEPARTMENT</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-mono">Aggregated predictive probability and alert volume by department.</p>
            </div>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-none bg-emerald-500/20 border border-emerald-500/50"></div>
              <div className="w-3 h-3 rounded-none bg-amber-500/20 border border-amber-500/50"></div>
              <div className="w-3 h-3 rounded-none bg-rose-500/20 border border-rose-500/50"></div>
            </div>
          </div>

          <div className="h-72 w-full mt-auto">
            {heatmapData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmapData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#06b6d4" fontSize={11} tickLine={false} label={{ value: 'Avg Probability (%)', angle: -90, position: 'insideLeft', style: { fill: '#06b6d4', fontSize: '10px' } }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#e2e8f0" fontSize={11} tickLine={false} label={{ value: 'Active Alerts', angle: 90, position: 'insideRight', style: { fill: '#e2e8f0', fontSize: '10px' } }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '2px' }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                    itemStyle={{ color: '#06b6d4' }}
                  />
                  <Bar yAxisId="left" dataKey="Average Probability (%)" fill="#06b6d4" radius={[0, 0, 0, 0]} barSize={40} />
                  <Bar yAxisId="right" dataKey="Alert Count" fill="#94a3b8" radius={[0, 0, 0, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono uppercase tracking-wider">
                No departmental heatmap data available.
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between">
            <div className="text-[10px] text-slate-500 italic uppercase tracking-wider font-mono">N=1470 Employees | SMOTE Balanced Dataset | XGBoost v2</div>
            <button onClick={() => onNavigate('model')} className="text-[10px] text-cyan-400 font-bold hover:underline cursor-pointer tracking-widest font-mono uppercase">VIEW FULL REPORT →</button>
          </div>
        </motion.div>

        {/* Priority Alert Queue */}
        <motion.div
          variants={itemVariants}
          className="border border-slate-800 bg-slate-900/60 rounded-sm p-5 shadow-lg flex flex-col h-full"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-none"></span>
                Critical Triggers
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-mono">Top attrition risks needing intervention.</p>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest font-bold"
            >
              MANAGE ALL
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[290px] pr-1 flex-1 scrollbar-thin">
            {alerts.filter(a => a.status === 'OPEN').slice(0, 5).map((alert, idx) => {
              const borderClass = alert.attrition_probability >= 0.70 ? 'border-rose-500 bg-rose-500/10' : 'border-amber-500 bg-amber-500/10';
              const textClass = alert.attrition_probability >= 0.70 ? 'text-rose-400' : 'text-amber-400';
              return (
                <div
                  key={alert.id}
                  className={`p-3.5 border-l-2 ${borderClass} bg-slate-950/40 hover:bg-slate-900/40 transition-all group flex items-center justify-between cursor-pointer`}
                  onClick={() => {
                    onNavigate('predict');
                    onSelectEmployee(alert.employee_id);
                  }}
                >
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs group-hover:text-cyan-400 transition-colors">{alert.employee_name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">{alert.job_role} • {alert.department}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-mono font-bold ${textClass}`}>{Math.round(alert.attrition_probability * 100)}%</div>
                    <div className="text-[9px] text-slate-500 font-mono uppercase">PROB.</div>
                  </div>
                </div>
              );
            })}
            {alerts.filter(a => a.status === 'OPEN').length === 0 && (
              <div className="h-44 flex flex-col items-center justify-center text-slate-500 font-mono text-[10px] text-center border border-dashed border-slate-800 rounded-sm p-5 uppercase tracking-wider">
                <Users className="w-5 h-5 text-slate-600 mb-2" />
                No pending high-risk triggers detected.<br/>Organization retention is healthy!
              </div>
            )}
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="mt-4 w-full py-2 border border-slate-700 text-slate-400 text-[10px] font-bold tracking-widest rounded-sm hover:bg-slate-800 uppercase font-mono cursor-pointer transition-all"
          >
            MANAGE ALL ALERTS
          </button>
        </motion.div>
      </div>

      {/* ITDO Framework Guide Banner */}
      <motion.div
        variants={itemVariants}
        className="border border-slate-800 bg-slate-900/40 rounded-sm p-5 shadow-lg flex flex-col md:flex-row gap-5 items-center justify-between"
      >
        <div className="space-y-1 text-center md:text-left">
          <h4 className="text-slate-200 font-bold uppercase tracking-wider text-sm flex items-center justify-center md:justify-start gap-2">
            <AlertTriangle className="w-4 h-4 text-cyan-400 animate-pulse" />
            The ITDO People Analytics Framework
          </h4>
          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
            We model Employee Lifecycle retention using the <strong className="text-cyan-400 font-bold font-mono">Insights</strong> layer (predictive probabilities) → <strong className="text-cyan-400 font-bold font-mono">Triggers</strong> layer (automatic risk threshold alerts) → <strong className="text-cyan-400 font-bold font-mono">Decisions</strong> layer (SHAP factor analysis) → <strong className="text-cyan-400 font-bold font-mono">Operations</strong> layer (Kanban tasks).
          </p>
        </div>
        <button
          onClick={() => onNavigate('predict')}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-sm text-xs transition-all shadow-md active:scale-95 font-mono cursor-pointer uppercase tracking-wider shrink-0"
        >
          ANALYZE TALENT RISK
        </button>
      </motion.div>
    </motion.div>
  );
}
