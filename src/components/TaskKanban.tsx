import React, { useState } from 'react';
import { Plus, Trash2, Clock, CheckCircle2, User, ChevronRight, ChevronLeft, PlusCircle } from 'lucide-react';
import { Task } from '../types';

interface TaskKanbanProps {
  tasks: Task[];
  employees: any[];
  onCreateTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateTaskStatus: (taskId: string, status: Task['status']) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function TaskKanban({ tasks, employees, onCreateTask, onUpdateTaskStatus, onDeleteTask }: TaskKanbanProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newIntervention, setNewIntervention] = useState('');
  const [newTaskEmp, setNewTaskEmp] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssignee, setNewAssignee] = useState('hr-bp@company.com');

  const columns: { id: Task['status']; title: string; color: string }[] = [
    { id: 'TODO', title: 'To Do', color: 'border-slate-800 text-slate-300' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-cyan-900/60 text-cyan-400' },
    { id: 'DONE', title: 'Completed', color: 'border-emerald-900/60 text-emerald-400' },
    { id: 'CANCELLED', title: 'Cancelled', color: 'border-slate-800 text-slate-500' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskEmp) return;

    const selectedEmpObj = employees.find(e => e.id === newTaskEmp);
    const empName = selectedEmpObj ? `Employee ${selectedEmpObj.employee_ref}` : 'Slicer Custom Employee';

    onCreateTask({
      employee_id: newTaskEmp,
      employee_name: empName,
      title: newTaskTitle,
      description: newTaskDesc,
      intervention: newIntervention,
      status: 'TODO',
      due_date: newDueDate || new Date(Date.now() + 7 * 24 * 3600000).toISOString().split('T')[0],
      assigned_to: newAssignee
    });

    // Reset Form
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewIntervention('');
    setNewTaskEmp('');
    setNewDueDate('');
    setShowAddForm(false);
  };

  const moveCard = (taskId: string, currentStatus: Task['status'], direction: 'left' | 'right') => {
    const statuses: Task['status'][] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
    const idx = statuses.indexOf(currentStatus);
    if (direction === 'left' && idx > 0) {
      onUpdateTaskStatus(taskId, statuses[idx - 1]);
    } else if (direction === 'right' && idx < statuses.length - 1) {
      onUpdateTaskStatus(taskId, statuses[idx + 1]);
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100 tracking-tight">Operations Board</h1>
          <p className="text-slate-400 text-sm mt-1">Operationalize the retention plan. Assign, track, and close stay interviews and mitigation tasks.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          CREATE STAY TASK
        </button>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start select-text">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="border border-slate-800/80 bg-slate-900/10 rounded-xl p-4 flex flex-col min-h-[500px]">
              
              {/* Column Header */}
              <div className="flex justify-between items-center mb-4 border-b border-slate-800/60 pb-2">
                <span className={`text-xs font-mono uppercase font-semibold ${col.color}`}>{col.title}</span>
                <span className="text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] scrollbar-thin">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 border border-slate-800/80 bg-slate-950/40 rounded-lg hover:border-slate-700 transition-all flex flex-col gap-3 group relative shadow-md"
                  >
                    {/* Trash can */}
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="absolute top-2.5 right-2.5 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-900 cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm leading-snug pr-5">{task.title}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">{task.employee_name}</p>
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">{task.description}</p>
                    )}

                    {task.intervention && (
                      <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded text-[10px] text-cyan-400 font-mono">
                        <span className="font-bold text-slate-400 block mb-0.5">INTERVENTION:</span>
                        {task.intervention}
                      </div>
                    )}

                    {/* Metadata strip */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1.5 border-t border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{task.due_date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        <span className="truncate max-w-[80px]">{task.assigned_to?.split('@')[0]}</span>
                      </div>
                    </div>

                    {/* Movement Triggers */}
                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => moveCard(task.id, task.status, 'left')}
                        className={`p-1 bg-slate-900 border border-slate-800 text-slate-400 rounded hover:text-slate-200 cursor-pointer disabled:opacity-20 ${task.status === 'TODO' ? 'invisible' : ''}`}
                        disabled={task.status === 'TODO'}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveCard(task.id, task.status, 'right')}
                        className={`p-1 bg-slate-900 border border-slate-800 text-slate-400 rounded hover:text-slate-200 cursor-pointer disabled:opacity-20 ${task.status === 'CANCELLED' ? 'invisible' : ''}`}
                        disabled={task.status === 'CANCELLED'}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="py-12 text-center text-slate-600 font-mono text-[10px] border border-dashed border-slate-800/60 rounded-lg">
                    Lane is Empty
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Manual Task Creator Dialog */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="border-b border-slate-800 p-4 bg-slate-950/40 flex justify-between items-center">
              <h3 className="font-display font-medium text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-4.5 h-4.5 text-cyan-500" />
                Schedule Stay Intervention
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-500 hover:text-slate-300 text-sm font-mono cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-300">
              <div className="space-y-1">
                <label className="text-slate-400 block font-mono">Assign Target Employee *</label>
                <select
                  value={newTaskEmp}
                  onChange={(e) => setNewTaskEmp(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none"
                >
                  <option value="">Select Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.employee_ref} ({emp.job_role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-mono">Task Summary Title *</label>
                <input
                  type="text" required
                  placeholder="e.g. Schedule Career Mapping Check-in"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-mono">Task Details / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes from predictive logs or manager talking track..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-mono">Actionable SHAP Intervention</label>
                <input
                  type="text"
                  placeholder="e.g. Initiate Overtime cap policy."
                  value={newIntervention}
                  onChange={(e) => setNewIntervention(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-mono">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 block font-mono">HR Representative</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none"
                  >
                    <option value="hr-bp@company.com">General HRBP</option>
                    <option value="cpo@company.com">Chief People Officer</option>
                    <option value="hr-partner-sales@company.com">HR Sales Partner</option>
                    <option value="hr-partner-tech@company.com">HR R&D Partner</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-lg font-mono transition-all mt-2 cursor-pointer"
              >
                CONFIRM TASK ALLOCATION
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
