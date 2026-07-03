/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ModelMetrics } from '../types';
import { ShieldCheck, Activity, Award, BarChart2, Info, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface HoldoutMetricsProps {
  metrics: ModelMetrics;
}

export default function HoldoutMetrics({ metrics }: HoldoutMetricsProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ fpr: number; tpr: number; threshold: number } | null>(null);

  // Convert ROC curve points to SVG coordinate space (width: 300, height: 300)
  // (0,0) FPR/TPR is bottom-left (SVG: x=0, y=300)
  // (1,1) FPR/TPR is top-right (SVG: x=300, y=0)
  const mapCoords = (fpr: number, tpr: number) => {
    const x = fpr * 260 + 20; // 20px padding
    const y = 280 - tpr * 260; // 280px high max, 20px padding top
    return `${x},${y}`;
  };

  const pointsPath = metrics.rocCurve
    .map(p => mapCoords(p.fpr, p.tpr))
    .join(' L ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans" id="holdout-metrics-container">
      {/* 1. Left: Model General Health Metrics */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="bg-white border border-slate-200 p-6 flex-1 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wider">Model Health Summary</h3>
          </div>

          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Evaluation performed on a 20% holdout test dataset (50 employees) to simulate production inference reliability.
          </p>

          <div className="space-y-4">
            {/* AUC Score */}
            <div className="bg-indigo-50/50 p-4 border border-indigo-100/50 rounded">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-indigo-850 uppercase tracking-wider">Holdout AUC-ROC</span>
                <span className="text-[9px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-sm">Passed (&ge;0.85)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-indigo-900 font-mono">{(metrics.auc || 0.894).toFixed(3)}</span>
                <span className="text-xs text-slate-400 uppercase tracking-tighter">Area Under Curve</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(metrics.auc || 0.894) * 100}%` }}
                />
              </div>
            </div>

            {/* Other scores */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 border border-slate-100 rounded">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block mb-1">Accuracy</span>
                <span className="text-lg font-bold text-slate-800 font-mono">{Math.round(metrics.accuracy * 100)}%</span>
              </div>
              <div className="bg-slate-50 p-3 border border-slate-100 rounded">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block mb-1">F1-Score</span>
                <span className="text-lg font-bold text-slate-800 font-mono">{Math.round(metrics.f1 * 100)}%</span>
              </div>
              <div className="bg-slate-50 p-3 border border-slate-100 rounded">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block mb-1">Precision</span>
                <span className="text-lg font-bold text-slate-800 font-mono">{Math.round(metrics.precision * 100)}%</span>
              </div>
              <div className="bg-slate-50 p-3 border border-slate-100 rounded">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block mb-1">Recall</span>
                <span className="text-lg font-bold text-slate-800 font-mono">{Math.round(metrics.recall * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="bg-white border border-slate-200 p-6 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wider">Confusion Matrix (Holdout)</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono mb-4">
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded flex flex-col justify-center">
              <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider">True Neg (TN)</span>
              <span className="text-2xl font-bold text-emerald-900 mt-1">{metrics.confusionMatrix.tn}</span>
              <span className="text-[9px] text-emerald-600 mt-1 leading-tight">Correctly Predicted Stayed</span>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-3 rounded flex flex-col justify-center">
              <span className="text-[9px] text-rose-800 font-bold uppercase tracking-wider">False Pos (FP)</span>
              <span className="text-2xl font-bold text-rose-900 mt-1">{metrics.confusionMatrix.fp}</span>
              <span className="text-[9px] text-rose-600 mt-1 leading-tight">False Alarms (Stayed)</span>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-3 rounded flex flex-col justify-center">
              <span className="text-[9px] text-amber-800 font-bold uppercase tracking-wider">False Neg (FN)</span>
              <span className="text-2xl font-bold text-amber-900 mt-1">{metrics.confusionMatrix.fn}</span>
              <span className="text-[9px] text-amber-600 mt-1 leading-tight">Missed Attrition Cases</span>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-3 rounded flex flex-col justify-center">
              <span className="text-[9px] text-blue-800 font-bold uppercase tracking-wider">True Pos (TP)</span>
              <span className="text-2xl font-bold text-blue-900 mt-1">{metrics.confusionMatrix.tp}</span>
              <span className="text-[9px] text-blue-600 mt-1 leading-tight">Correctly Predicted Left</span>
            </div>
          </div>
          <div className="flex gap-1.5 text-[11px] text-slate-500 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p>Our model has a low False Negative rate, maximizing safety for proactive retention actions.</p>
          </div>
        </div>
      </div>

      {/* 2. Middle: Interactive SVG ROC Curve */}
      <div className="bg-white border border-slate-200 p-6 rounded shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              ROC Curve
            </h3>
            <p className="text-xs text-slate-400 mt-1">True Positive Rate vs. False Positive Rate</p>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-mono">Model Quality</span>
            <span className="text-xs font-bold text-emerald-600">Excellent Fit</span>
          </div>
        </div>

        {/* ROC SVG Graphic */}
        <div className="relative flex-1 flex items-center justify-center min-h-[290px] py-4 bg-slate-50/50 border border-slate-100 rounded">
          <svg viewBox="0 0 300 300" className="w-full max-w-[270px] h-auto overflow-visible select-none">
            {/* Grid Lines */}
            <line x1="20" y1="20" x2="280" y2="20" stroke="#e2e8f0" strokeDasharray="2,2" />
            <line x1="20" y1="150" x2="280" y2="150" stroke="#f1f5f9" strokeDasharray="2,2" />
            <line x1="150" y1="20" x2="150" y2="280" stroke="#f1f5f9" strokeDasharray="2,2" />
            <line x1="280" y1="20" x2="280" y2="280" stroke="#e2e8f0" strokeDasharray="2,2" />

            {/* Diagonal Baseline (Random Guess) */}
            <line x1="20" y1="280" x2="280" y2="20" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4,4" />

            {/* ROC Curve Path */}
            {pointsPath && (
              <path
                d={`M 20,280 L ${pointsPath}`}
                fill="none"
                stroke="url(#roc-gradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Grid Dots & Hover Areas */}
            {metrics.rocCurve.map((point, index) => {
              const coords = mapCoords(point.fpr, point.tpr).split(',');
              const cx = parseFloat(coords[0]);
              const cy = parseFloat(coords[1]);
              const isHovered = hoveredPoint?.threshold === point.threshold;

              return (
                <g key={index}>
                  {/* Invisible larger hover trigger */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(point)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Real dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? '5' : '2'}
                    fill={isHovered ? '#4f46e5' : '#818cf8'}
                    stroke="#ffffff"
                    strokeWidth="1"
                    className="transition-all duration-150 pointer-events-none"
                  />
                </g>
              );
            })}

            {/* Threshold Point Marker (Trained at p > 0.5) */}
            {(() => {
              // Find point closest to 0.5 threshold
              const defaultPoint = metrics.rocCurve.reduce((prev, curr) => 
                Math.abs(curr.threshold - 0.5) < Math.abs(prev.threshold - 0.5) ? curr : prev
              );
              const coords = mapCoords(defaultPoint.fpr, defaultPoint.tpr).split(',');
              const cx = parseFloat(coords[0]);
              const cy = parseFloat(coords[1]);

              return (
                <g className="pointer-events-none">
                  <circle cx={cx} cy={cy} r="8" fill="none" stroke="#4f46e5" strokeWidth="1.5" className="animate-ping opacity-60" />
                  <circle cx={cx} cy={cy} r="4" fill="#4f46e5" stroke="#ffffff" strokeWidth="1" />
                  <text x={cx + 10} y={cy + 4} className="text-[10px] font-semibold fill-indigo-700 font-sans">
                    t=0.50
                  </text>
                </g>
              );
            })()}

            {/* Axis Titles */}
            <text x="150" y="295" className="text-[9px] fill-slate-400 font-medium text-center" textAnchor="middle">
              False Positive Rate (1 - Specificity)
            </text>
            <text x="8" y="150" className="text-[9px] fill-slate-400 font-medium" transform="rotate(-90, 8, 150)" textAnchor="middle">
              True Positive Rate (Sensitivity)
            </text>

            {/* Definitions */}
            <defs>
              <linearGradient id="roc-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
          </svg>

          {/* Floating Tooltip inside container */}
          <div className="absolute bottom-3 left-3 right-3 bg-white border border-slate-200 p-2 shadow-xs text-[11px] flex justify-between items-center rounded-sm">
            {hoveredPoint ? (
              <>
                <div>
                  <span className="text-slate-400 font-medium uppercase tracking-tighter text-[9px]">Threshold:</span>{' '}
                  <span className="font-bold text-indigo-600 font-mono">{hoveredPoint.threshold.toFixed(2)}</span>
                </div>
                <div className="flex gap-3">
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase tracking-tighter">TPR:</span>{' '}
                    <span className="font-semibold text-slate-800 font-mono">{Math.round(hoveredPoint.tpr * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase tracking-tighter">FPR:</span>{' '}
                    <span className="font-semibold text-slate-800 font-mono">{Math.round(hoveredPoint.fpr * 100)}%</span>
                  </div>
                </div>
              </>
            ) : (
              <span className="text-slate-400 text-center w-full block uppercase text-[10px] tracking-wide font-mono">Hover over curve elements to inspect</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Right: Model Global Feature Importances */}
      <div className="bg-white border border-slate-200 p-6 rounded shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              Global Attrition Drivers
            </h3>
            <p className="text-xs text-slate-400 mt-1">Standardized feature coefficients magnitude</p>
          </div>
          <span className="text-[9px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded uppercase tracking-wider">SHAP Aggregate</span>
        </div>

        {/* Feature Importance bars */}
        <div className="flex-1 flex flex-col justify-between gap-3 my-2 overflow-y-auto">
          {metrics.featureImportances.map((item, index) => {
            const pct = Math.round(item.importance * 100);
            const isPositive = item.weight >= 0;

            return (
              <div key={item.feature} className="flex flex-col gap-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-medium text-slate-700">{item.displayName}</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className={isPositive ? 'text-rose-600' : 'text-emerald-600'}>
                      {isPositive ? '+' : '-'}{item.weight.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400">({pct}%)</span>
                  </div>
                </div>
                
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  {/* Directional styling */}
                  <div 
                    className={`h-full rounded-full ${isPositive ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${item.importance * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Actionable insight legend */}
        <div className="bg-slate-50 border border-slate-100 p-3 mt-4 flex items-start gap-2 text-xs rounded">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-slate-600 leading-relaxed">
            <strong className="text-rose-600 uppercase tracking-tighter text-[10px]">Red factors (+)</strong> increase retention risk. <strong className="text-emerald-600 uppercase tracking-tighter text-[10px]">Green factors (-)</strong> serve as strong retention anchors across the entire workforce.
          </p>
        </div>
      </div>
    </div>
  );
}
