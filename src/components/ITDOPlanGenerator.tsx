/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Employee, RetentionTask } from '../types';
import { Sparkles, Loader2, ArrowRight, ShieldAlert, CheckSquare, ClipboardList, Calendar, Users } from 'lucide-react';

interface ITDOPlanGeneratorProps {
  employee: Employee;
  onPlanCreated: (task: RetentionTask) => void;
}

const REASSURING_MESSAGES = [
  "Analyzing employee satisfaction indices and compensation benchmarking...",
  "Correlating overtime hours with historical organizational burnout models...",
  "Synthesizing SHAP impact weights to isolate high-leverage intervention points...",
  "Generating step-by-step operational steps under the ITDO framework...",
  "Structuring retention plan with C-suite and HRBP-level directives..."
];

export default function ITDOPlanGenerator({ employee, onPlanCreated }: ITDOPlanGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [generatedPlan, setGeneratedPlan] = useState<RetentionTask['itdoPipeline'] | null>(null);
  const [createdTask, setCreatedTask] = useState<RetentionTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Rotate loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setMsgIdx((prev) => (prev + 1) % REASSURING_MESSAGES.length);
      }, 2500);
    } else {
      setMsgIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setGeneratedPlan(null);
    setCreatedTask(null);

    try {
      const response = await fetch('/api/generate-retention-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId: employee.id }),
      });

      if (!response.ok) {
        throw new Error('Server failed to generate retention plan. Please try again.');
      }

      const data = await response.json();
      setGeneratedPlan(data.task.itdoPipeline);
      setCreatedTask(data.task);
      onPlanCreated(data.task);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during generation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 p-6 shadow-sm flex flex-col rounded font-sans" id="itdo-generator-container">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wider">ITDO Action Planner</h3>
        </div>
        <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-sm border border-indigo-150 uppercase tracking-wider">AI Co-Pilot</span>
      </div>

      <p className="text-xs text-slate-400 mb-6 leading-relaxed">
        Leverage our server-side generative AI to synthesize a bespoke retention campaign. The model analyzes the employee's exact satisfaction weights and promotion history under the <strong>Insights &rarr; Triggers &rarr; Decisions &rarr; Operations (ITDO)</strong> design.
      </p>

      {/* Error display */}
      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 rounded p-3 text-xs flex gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Plan Generation Failed:</strong> {error}
          </div>
        </div>
      )}

      {/* Button to Trigger */}
      {!loading && !generatedPlan && (
        <button
          onClick={handleGenerate}
          className="w-full bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-[10px] py-3 px-4 rounded shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
        >
          <Sparkles className="w-4 h-4" />
          Generate Bespoke ITDO Retention Campaign
        </button>
      )}

      {/* Loading state with reassuring messages */}
      {loading && (
        <div className="py-12 flex flex-col items-center text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">Analyzing employee vector...</span>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed animate-pulse">
            {REASSURING_MESSAGES[msgIdx]}
          </p>
        </div>
      )}

      {/* Generated ITDO Layout */}
      {generatedPlan && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded p-3 flex items-center justify-between">
            <span className="font-bold">Plan generated and committed to the Task Board!</span>
            <span className="text-[9px] bg-emerald-600 text-white font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase">Success</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* INSIGHTS */}
            <div className="border border-slate-150 rounded p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[10px] uppercase tracking-wider mb-2">
                <Users className="w-4 h-4 text-indigo-600" />
                1. Insight (Why)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {generatedPlan.insight}
              </p>
            </div>

            {/* TRIGGERS */}
            <div className="border border-slate-150 rounded p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[10px] uppercase tracking-wider mb-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                2. Trigger (Signal)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {generatedPlan.trigger}
              </p>
            </div>

            {/* DECISIONS */}
            <div className="border border-slate-150 rounded p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[10px] uppercase tracking-wider mb-2">
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                3. Decision (Strategy)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {generatedPlan.decision}
              </p>
            </div>

            {/* OPERATIONS */}
            <div className="border border-slate-150 rounded p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[10px] uppercase tracking-wider mb-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                4. Operation (Deployment)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                {generatedPlan.operation}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleGenerate}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-850 flex items-center gap-1 cursor-pointer uppercase tracking-wider"
            >
              Re-generate alternate plan <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
