import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Sliders, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';

interface SettingsPanelProps {
  onSettingsUpdated: (threshold: number, prompt: string) => void;
}

export default function SettingsPanel({ onSettingsUpdated }: SettingsPanelProps) {
  const [threshold, setThreshold] = useState(0.70);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load active configurations from server
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setThreshold(data.alert_threshold);
        setPrompt(data.system_prompt);
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_threshold: threshold,
          system_prompt: prompt
        })
      });

      if (res.ok) {
        onSettingsUpdated(threshold, prompt);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !prompt) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500 font-mono">
        Loading organization settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-sm font-bold text-slate-100 tracking-wider uppercase flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-500 rounded-none"></span>
          System Controls
        </h1>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-1">Configure predictive alert thresholds and customise systemic GenAI directives for the coaching advisor.</p>
      </div>

      <div className="max-w-2xl border border-slate-800 bg-slate-900/60 rounded-sm p-6 shadow-lg select-text">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Section 1: Alert Trigger Configuration */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold flex items-center gap-2 border-b border-slate-800/60 pb-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Organizational Alert Risk Threshold
            </h3>

            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-slate-200">Trigger Threshold Limit</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono uppercase tracking-wider">Predictions above this level trigger an incident alert block.</p>
                </div>
                <span className="font-mono text-cyan-400 text-lg font-bold">{Math.round(threshold * 100)}%</span>
              </div>

              <input
                type="range" min="0.40" max="0.90" step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>40% (Aggressive Alerts)</span>
                <span>70% (Standard Risk)</span>
                <span>90% (Critical Only)</span>
              </div>
            </div>
          </div>

          {/* Section 2: AI Advisor Directives Prompt */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold flex items-center gap-2 border-b border-slate-800/60 pb-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Cognitive Coach Instructions Directive
            </h3>

            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 font-mono">System Persona & Advice Construction Directives</label>
              <textarea
                rows={6}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Persona instructions to pass to Gemini..."
                className="w-full bg-slate-950/60 border border-slate-800 rounded-sm p-4 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
              />
              <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5 text-cyan-500" />
                Changing these system directives modifies how Gemini 3.5 Flash formats the generated stay templates.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center gap-4">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              SETTINGS SYNC ACTIVE
            </div>

            <button
              type="submit"
              disabled={saveSuccess}
              className={`font-semibold px-6 py-2.5 rounded-sm text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                saveSuccess
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
              }`}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  SETTINGS COMMITTED
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  SAVE CONFIGURATION
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
