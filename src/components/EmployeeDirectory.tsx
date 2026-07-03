/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Employee } from '../types';
import { Search, Filter, AlertTriangle, ChevronRight, Briefcase, DollarSign, Clock, Smile, Sparkles } from 'lucide-react';

interface EmployeeDirectoryProps {
  employees: Employee[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDept: string;
  setSelectedDept: (dept: string) => void;
  selectedRisk: string;
  setSelectedRisk: (risk: string) => void;
}

export default function EmployeeDirectory({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  searchQuery,
  setSearchQuery,
  selectedDept,
  setSelectedDept,
  selectedRisk,
  setSelectedRisk
}: EmployeeDirectoryProps) {
  
  const depts = ['All', 'Engineering', 'Sales', 'HR', 'Marketing', 'Product', 'Operations'];

  const getRiskColor = (prob: number) => {
    if (prob >= 0.70) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (prob >= 0.30) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  };

  const getRiskBarColor = (prob: number) => {
    if (prob >= 0.70) return 'bg-rose-500';
    if (prob >= 0.30) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getSatisfactionEmoji = (rating: number) => {
    if (rating <= 2) return '😟';
    if (rating === 3) return '😐';
    return '😊';
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col rounded" id="employee-directory-card">
      {/* Search & Filters Bar */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID, or job role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 bg-white rounded focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
          />
        </div>

        {/* Filter drop downs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold uppercase tracking-wider text-[10px]">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="border border-slate-200 bg-white rounded px-2 py-1 text-xs text-slate-700 font-sans focus:outline-hidden focus:border-indigo-500"
            >
              {depts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Risk Level filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold uppercase tracking-wider text-[10px]">Risk:</span>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="border border-slate-200 bg-white rounded px-2 py-1 text-xs text-slate-700 font-sans focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">All Tiers</option>
              <option value="high">High Risk (&gt;70%)</option>
              <option value="medium">Medium Risk (30%-70%)</option>
              <option value="low">Low Risk (&lt;30%)</option>
            </select>
          </div>

          <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-sm">
            Count: {employees.length}
          </span>
        </div>
      </div>

      {/* Roster Table Layout */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold tracking-wider text-[10px]">
              <th className="py-3 px-5">Employee Info</th>
              <th className="py-3 px-4">Job Details</th>
              <th className="py-3 px-4">Attrition Risk Probability</th>
              <th className="py-3 px-4">Satisfaction Indices</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                  No employee profiles matched the active query filter
                </td>
              </tr>
            ) : (
              employees.map(emp => {
                const isSelected = selectedEmployeeId === emp.id;
                const probPercent = Math.round((emp.predictedProbability || 0) * 100);
                const riskStyle = getRiskColor(emp.predictedProbability || 0);

                return (
                  <tr
                    key={emp.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    {/* Employee Info */}
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800 text-[13px]">{emp.name}</span>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <span className="font-mono text-slate-500">{emp.id}</span>
                          <span>&bull;</span>
                          <span>{emp.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Job Details */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700">{emp.jobRole}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span>{emp.department}</span>
                          <span>&bull;</span>
                          <DollarSign className="w-3 h-3 text-slate-400 -mr-0.5" />
                          <span>${emp.monthlyIncome.toLocaleString()}/mo</span>
                        </div>
                      </div>
                    </td>

                    {/* Attrition Risk Probability bar */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1.5 max-w-[180px]">
                        <div className="flex justify-between items-center">
                          <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-sm border ${riskStyle}`}>
                            {probPercent}%
                          </span>
                          {probPercent >= 70 && (
                            <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-0.5 animate-pulse">
                              <AlertTriangle className="w-3 h-3 shrink-0" /> Critical Alert
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getRiskBarColor(emp.predictedProbability || 0)}`}
                            style={{ width: `${probPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Satisfactions and Overtime */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5 text-[11px]">
                          <div className="flex items-center gap-1 text-slate-500">
                            <Smile className="w-3.5 h-3.5 text-slate-400" />
                            <span>Job Sat:</span>
                            <span className="font-bold text-slate-700">{getSatisfactionEmoji(emp.jobSatisfaction)} {emp.jobSatisfaction}/4</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Work-Life:</span>
                            <span className="font-bold text-slate-700">{emp.workLifeBalance}/4</span>
                          </div>
                        </div>

                        {/* OverTime Indicator */}
                        {emp.overTime === 1 && (
                          <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0" title="Works regular overtime - High burnout factor">
                            OT Regular
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectEmployee(emp.id)}
                        className={`text-[10px] uppercase font-bold tracking-wider py-2 px-3.5 rounded border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm'
                            : 'bg-white hover:bg-indigo-50 hover:text-indigo-600 border-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                            <span>Analyzing Risk</span>
                          </>
                        ) : (
                          <>
                            <span>Assess Drivers</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
