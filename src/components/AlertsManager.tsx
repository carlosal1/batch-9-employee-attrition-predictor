import React, { useState } from 'react';
import { Search, Filter, AlertCircle, RefreshCw, FileDown, Eye, CheckCircle } from 'lucide-react';
import { Alert } from '../types';

interface AlertsManagerProps {
  alerts: Alert[];
  onUpdateAlertStatus: (alertId: string, status: Alert['status']) => void;
  onAssignAlert: (alertId: string, email: string) => void;
  onNavigate: (tab: string) => void;
  onSelectEmployee: (empId: string) => void;
}

export default function AlertsManager({ alerts, onUpdateAlertStatus, onAssignAlert, onNavigate, onSelectEmployee }: AlertsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Filter Alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          alert.job_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          alert.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || alert.status === statusFilter;
    const matchesDept = deptFilter === 'ALL' || alert.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const getStatusBadge = (status: Alert['status']) => {
    switch (status) {
      case 'OPEN':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'ACKNOWLEDGED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  const exportAlertsToCSV = () => {
    if (filteredAlerts.length === 0) return;
    const headers = ['Alert ID', 'Employee Name', 'Department', 'Job Role', 'Attrition Probability', 'Threshold', 'Status', 'Assigned To', 'Triggered Date'];
    const rows = filteredAlerts.map(a => [
      a.id,
      a.employee_name,
      a.department,
      a.job_role,
      `${(a.attrition_probability * 100).toFixed(1)}%`,
      `${(a.threshold * 100).toFixed(0)}%`,
      a.status,
      a.assigned_to || 'Unassigned',
      a.created_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'triggered_turnover_alerts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100 tracking-tight">Attrition Alerts</h1>
          <p className="text-slate-400 text-sm mt-1">Operational incident logs showing triggers when prediction probabilities exceed defined organizational thresholds.</p>
        </div>
        {filteredAlerts.length > 0 && (
          <button
            onClick={exportAlertsToCSV}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-slate-100 text-slate-300 px-3.5 py-2 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export Alert Registry
          </button>
        )}
      </div>

      {/* Filters Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/20 border border-slate-800 p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by staff name, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Status: All Alerts</option>
            <option value="OPEN">Status: Open / Unresolved</option>
            <option value="ACKNOWLEDGED">Status: Acknowledged</option>
            <option value="RESOLVED">Status: Resolved / Stayed</option>
          </select>
        </div>

        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Department: All</option>
            <option value="Research & Development">Research & Development</option>
            <option value="Sales">Sales</option>
            <option value="Human Resources">Human Resources</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs font-mono text-slate-500 gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {filteredAlerts.length} records matching filters
        </div>
      </div>

      {/* Alerts Table */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden shadow-xl backdrop-blur-md select-text">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/20 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Employee Details</th>
                <th className="py-3.5 px-4">Department & Role</th>
                <th className="py-3.5 px-4">Attrition Risk</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Advisor</th>
                <th className="py-3.5 px-4 text-center">Interventions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-semibold text-slate-200">{alert.employee_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {alert.employee_id} • Ref: {alert.prediction_id}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-200 font-medium block">{alert.job_role}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{alert.department}</span>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-100">
                    <span className="font-bold text-slate-200">{Math.round(alert.attrition_probability * 100)}%</span>
                    <span className="text-[10px] text-slate-500 block">Threshold: {Math.round(alert.threshold * 100)}%</span>
                  </td>
                  <td className="py-4 px-4">
                    <select
                      value={alert.status}
                      onChange={(e) => onUpdateAlertStatus(alert.id, e.target.value as Alert['status'])}
                      className={`text-[10px] font-mono border px-2 py-0.5 rounded-full bg-slate-950/40 text-center focus:outline-none cursor-pointer ${getStatusBadge(alert.status)}`}
                    >
                      <option value="OPEN" className="bg-slate-900 text-rose-400">OPEN</option>
                      <option value="ACKNOWLEDGED" className="bg-slate-900 text-amber-400">ACKNOWLEDGED</option>
                      <option value="RESOLVED" className="bg-slate-900 text-emerald-400">RESOLVED</option>
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    <select
                      value={alert.assigned_to || ''}
                      onChange={(e) => onAssignAlert(alert.id, e.target.value)}
                      className="bg-slate-950/40 border border-slate-800 text-xs rounded px-2 py-1 text-slate-400 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">Unassigned</option>
                      <option value="cpo@company.com">Chief People Officer (CPO)</option>
                      <option value="hr-partner-sales@company.com">HR Partner - Sales</option>
                      <option value="hr-partner-tech@company.com">HR Partner - R&D</option>
                    </select>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          onNavigate('predict');
                          onSelectEmployee(alert.employee_id);
                        }}
                        title="Analyze individual SHAP waterfall drivers"
                        className="p-1.5 border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-cyan-400 hover:border-cyan-800/40 rounded transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {alert.status !== 'RESOLVED' && (
                        <button
                          onClick={() => onUpdateAlertStatus(alert.id, 'RESOLVED')}
                          title="Resolve alert & record stay interview outcome"
                          className="p-1.5 border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-emerald-400 hover:border-emerald-800/40 rounded transition-all cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                    <AlertCircle className="w-8 h-8 text-slate-600 mb-2 mx-auto" />
                    No active alerts matching current search parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
