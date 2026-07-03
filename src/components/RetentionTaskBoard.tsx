/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RetentionTask } from '../types';
import { ClipboardList, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Trash2, Calendar, User, Eye, X, Building } from 'lucide-react';

interface RetentionTaskBoardProps {
  tasks: RetentionTask[];
  onUpdateStatus: (taskId: string, newStatus: RetentionTask['status']) => void;
  onUpdatePriority: (taskId: string, newPriority: RetentionTask['priority']) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function RetentionTaskBoard({
  tasks,
  onUpdateStatus,
  onUpdatePriority,
  onDeleteTask
}: RetentionTaskBoardProps) {
  const [selectedTask, setSelectedTask] = useState<RetentionTask | null>(null);

  const columns: Array<{ id: RetentionTask['status']; name: string; color: string; border: string }> = [
    { id: 'Open', name: 'Open Alerts', color: 'bg-rose-50 text-rose-800', border: 'border-rose-100' },
    { id: 'InProgress', name: 'In Progress Interventions', color: 'bg-amber-50 text-amber-800', border: 'border-amber-100' },
    { id: 'Resolved', name: 'Resolved / Secured', color: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-100' }
  ];

  const getPriorityColor = (p: RetentionTask['priority']) => {
    switch (p) {
      case 'High': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans" id="retention-task-board-container">
      {/* Executive Task Header */}
      <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wider">Talent Retention Pipeline</h3>
        </div>
        <div className="flex gap-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">
          <div>
            <span>Active Tasks:</span>{' '}
            <span className="font-bold text-slate-800">{tasks.filter(t => t.status !== 'Resolved').length}</span>
          </div>
          <div>
            <span>Total Interventions:</span>{' '}
            <span className="font-bold text-indigo-600">{tasks.length}</span>
          </div>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);

          return (
            <div key={col.id} className="bg-slate-50 border border-slate-200 p-4 flex flex-col min-h-[480px] rounded">
              {/* Column Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm ${col.color} border ${col.border}`}>
                  {col.name}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200/50 w-5 h-5 rounded-full flex items-center justify-center">
                  {colTasks.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[550px] pr-1">
                {colTasks.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 bg-white/50 rounded">
                    No active tasks in this stage
                  </div>
                ) : (
                  colTasks.map(task => {
                    const probPercent = Math.round(task.riskScore * 100);

                    return (
                      <div
                        key={task.id}
                        className="bg-white border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col gap-3 relative group rounded"
                      >
                        {/* Task Card Header */}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[9px] font-bold text-indigo-600 block mb-1 font-mono uppercase tracking-wider">{task.id}</span>
                            <h4 className="font-semibold text-slate-800 text-xs leading-snug">{task.title}</h4>
                          </div>
                          
                          {/* Risk Badge */}
                          <div className="text-right shrink-0">
                            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-sm ${
                              probPercent > 70 ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              {probPercent}% Risk
                            </span>
                          </div>
                        </div>

                        {/* Employee Meta details */}
                        <div className="bg-slate-50 border border-slate-100 p-2 text-[11px] text-slate-500 flex flex-col gap-1 rounded-sm">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {task.employeeName}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {task.jobRole} ({task.department})
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                          {/* Move Buttons */}
                          <div className="flex items-center gap-1.5">
                            {task.status !== 'Open' && (
                              <button
                                onClick={() => {
                                  const prevMap: Record<string, RetentionTask['status']> = {
                                    'InProgress': 'Open',
                                    'Resolved': 'InProgress'
                                  };
                                  onUpdateStatus(task.id, prevMap[task.status]);
                                }}
                                className="p-1 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer rounded-sm"
                                title="Move Left"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {task.status !== 'Resolved' && (
                              <button
                                onClick={() => {
                                  const nextMap: Record<string, RetentionTask['status']> = {
                                    'Open': 'InProgress',
                                    'InProgress': 'Resolved'
                                  };
                                  onUpdateStatus(task.id, nextMap[task.status]);
                                }}
                                className="p-1 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider border border-slate-200 rounded px-1.5"
                                title="Advance Stage"
                              >
                                <span className="hidden sm:inline">Advance</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Quick details */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="p-1 hover:bg-indigo-50 hover:text-indigo-600 rounded text-slate-400 transition-colors cursor-pointer"
                              title="View ITDO Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1 hover:bg-rose-50 hover:text-rose-600 rounded text-slate-400 transition-colors cursor-pointer"
                              title="Delete Task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Expansion Modal Tray (ITDO pipeline details) */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex justify-between items-start bg-slate-50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] bg-indigo-100 text-indigo-800 font-extrabold font-mono px-2 py-0.5 rounded-sm uppercase tracking-wider border border-indigo-200">
                    ITDO ACTION PLAN
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-500">{selectedTask.id}</span>
                </div>
                <h3 className="font-bold text-slate-800 text-base">{selectedTask.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Targeting {selectedTask.employeeName} ({selectedTask.jobRole})</p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Employee Quick Info Bar */}
              <div className="grid grid-cols-3 gap-4 bg-indigo-50/40 border border-indigo-100 p-3 rounded text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[9px] font-bold">Department</span>
                  <span className="font-semibold text-slate-800">{selectedTask.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[9px] font-bold">Calculated Risk</span>
                  <span className="font-bold text-rose-600 font-mono">{Math.round(selectedTask.riskScore * 100)}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[9px] font-bold">Current Owner</span>
                  <span className="font-semibold text-slate-800">{selectedTask.assignedTo}</span>
                </div>
              </div>

              {/* ITDO grid breakdown */}
              <div className="space-y-4">
                {/* Insights */}
                <div className="border border-slate-150 rounded p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[10px] uppercase tracking-wider mb-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    Insight (Root Cause Findings)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedTask.itdoPipeline.insight}
                  </p>
                </div>

                {/* Triggers */}
                <div className="border border-slate-150 rounded p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[10px] uppercase tracking-wider mb-2">
                    <AlertTriangle className="w-4 h-4 text-indigo-600" />
                    Trigger (Alert Indicator Event)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedTask.itdoPipeline.trigger}
                  </p>
                </div>

                {/* Decisions */}
                <div className="border border-slate-150 rounded p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[10px] uppercase tracking-wider mb-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    Decision (Strategic Adjustments)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedTask.itdoPipeline.decision}
                  </p>
                </div>

                {/* Operations */}
                <div className="border border-slate-150 rounded p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[10px] uppercase tracking-wider mb-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Operations (Operational Step Timeline)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {selectedTask.itdoPipeline.operation}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono">Task logged on {new Date(selectedTask.createdAt).toLocaleDateString()}</span>
              <button
                onClick={() => setSelectedTask(null)}
                className="bg-slate-900 border border-slate-900 text-white text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded transition-all cursor-pointer hover:bg-slate-800"
              >
                Close Action Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
