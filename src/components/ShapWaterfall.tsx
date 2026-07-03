/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShapExplanation } from '../types';
import { HelpCircle, AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown } from 'lucide-react';

interface ShapWaterfallProps {
  explanation: ShapExplanation;
}

export default function ShapWaterfall({ explanation }: ShapWaterfallProps) {
  const { baseProbability, finalProbability, shapValues, employeeName } = explanation;

  // Filter out tiny values to keep chart readable, keep top 7
  const activeShaps = shapValues
    .filter(s => Math.abs(s.shapValue) > 0.05)
    .slice(0, 7);

  // Math for probability sequence
  // We want to construct a sequence of probability points to map to the waterfall:
  // p_0 = BaseProb
  // p_k = sigmoid( logit(p_{k-1}) + shap_k )
  // Let's calculate actual probability steps
  const logit = (p: number) => Math.log(p / (1 - p));
  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

  let currentLogit = logit(baseProbability);
  const steps: Array<{
    featureName: string;
    displayName: string;
    startProb: number;
    endProb: number;
    diff: number;
    effect: 'increase' | 'decrease';
    description: string;
  }> = [];

  activeShaps.forEach(shap => {
    const startProb = sigmoid(currentLogit);
    currentLogit += shap.shapValue;
    const endProb = sigmoid(currentLogit);
    const diff = endProb - startProb;

    steps.push({
      featureName: shap.feature,
      displayName: shap.displayName,
      startProb,
      endProb,
      diff,
      effect: shap.effect,
      description: shap.description
    });
  });

  // Coordinates for the SVG waterfall chart
  const svgWidth = 500;
  const barHeight = 24;
  const gap = 12;
  const paddingLeft = 140; // Space for labels
  const paddingRight = 60; // Space for values at the end
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  
  // Total steps: Base value + active features + Final prediction
  const totalRows = steps.length + 2;
  const svgHeight = totalRows * (barHeight + gap) + 20;

  // Function to translate 0.0 - 1.0 probability to SVG X pixel
  const getX = (prob: number) => {
    return paddingLeft + prob * chartWidth;
  };

  return (
    <div className="bg-white border border-slate-200 p-6 shadow-sm flex flex-col rounded font-sans" id="shap-waterfall-card">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            SHAP Attribution Waterfall
          </h3>
          <p className="text-xs text-slate-400 mt-1">Mathematical contribution of factors explaining {employeeName}'s risk</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-tighter block font-bold">Baseline Risk</span>
          <span className="text-xs font-mono font-bold text-slate-700">{Math.round(baseProbability * 100)}%</span>
        </div>
      </div>

      {/* SVG Waterfall plot */}
      <div className="bg-slate-50 border border-slate-100 p-4 overflow-x-auto rounded">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[440px] h-auto font-sans select-none overflow-visible">
          {/* Vertical Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((tick) => {
            const x = getX(tick);
            return (
              <g key={tick} className="opacity-40">
                <line x1={x} y1="10" x2={x} y2={svgHeight - 25} stroke="#cbd5e1" strokeDasharray="3,3" />
                <text x={x} y={svgHeight - 10} className="text-[9px] fill-slate-400 font-mono" textAnchor="middle">
                  {Math.round(tick * 100)}%
                </text>
              </g>
            );
          })}

          {/* Row 0: Base Probability */}
          {(() => {
            const y = 15;
            const xVal = getX(baseProbability);
            return (
              <g>
                <text x="10" y={y + 16} className="text-[11px] fill-slate-500 font-medium">
                  Baseline (Company Avg)
                </text>
                <rect
                  x={getX(0)}
                  y={y}
                  width={xVal - getX(0)}
                  height={barHeight}
                  fill="#94a3b8"
                  rx="3"
                  className="opacity-80"
                />
                <text x={xVal + 6} y={y + 16} className="text-[10px] font-bold fill-slate-600 font-mono">
                  {Math.round(baseProbability * 100)}%
                </text>
              </g>
            );
          })()}

          {/* Sequential feature rows */}
          {steps.map((step, idx) => {
            const rowIdx = idx + 1;
            const y = rowIdx * (barHeight + gap) + 15;
            const xStart = getX(step.startProb);
            const xEnd = getX(step.endProb);
            const width = Math.abs(xEnd - xStart);
            const isIncrease = step.effect === 'increase';
            
            // Draw connector dotted line from previous
            const prevY = (rowIdx - 1) * (barHeight + gap) + 15 + barHeight;

            return (
              <g key={idx}>
                {/* Connector line */}
                <line
                  x1={xStart}
                  y1={prevY}
                  x2={xStart}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />

                {/* Feature Label */}
                <text x="10" y={y + 16} className="text-[11px] font-medium fill-slate-700 truncate max-w-[125px]">
                  {step.displayName}
                </text>

                {/* Waterfall Bar */}
                <rect
                  x={isIncrease ? xStart : xEnd}
                  y={y}
                  width={Math.max(2, width)}
                  height={barHeight}
                  fill={isIncrease ? '#f43f5e' : '#10b981'}
                  rx="3"
                  className="transition-all duration-300 hover:opacity-90 cursor-help"
                >
                  <title>{step.description}</title>
                </rect>

                {/* Step change text */}
                <text
                  x={isIncrease ? xEnd + 6 : xStart + 6}
                  y={y + 16}
                  className={`text-[10px] font-semibold font-mono ${isIncrease ? 'fill-rose-600' : 'fill-emerald-600'}`}
                >
                  {isIncrease ? '+' : ''}{Math.round(step.diff * 100)}%
                </text>
              </g>
            );
          })}

          {/* Final Row: Final Predicted Probability */}
          {(() => {
            const rowIdx = steps.length + 1;
            const y = rowIdx * (barHeight + gap) + 15;
            const xVal = getX(finalProbability);
            const isHighRisk = finalProbability > 0.70;
            
            // Connector line from the final step's end point
            const prevY = (rowIdx - 1) * (barHeight + gap) + 15 + barHeight;
            const finalStartVal = steps.length > 0 ? steps[steps.length - 1].endProb : baseProbability;

            return (
              <g>
                <line
                  x1={getX(finalStartVal)}
                  y1={prevY}
                  x2={getX(finalStartVal)}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />

                <text x="10" y={y + 16} className="text-[11px] font-semibold fill-slate-900">
                  Calculated Risk Score
                </text>
                <rect
                  x={getX(0)}
                  y={y}
                  width={xVal - getX(0)}
                  height={barHeight}
                  fill={isHighRisk ? '#e11d48' : '#4f46e5'}
                  rx="3"
                />
                <text x={xVal + 6} y={y + 16} className="text-[11px] font-extrabold fill-slate-900 font-mono">
                  {Math.round(finalProbability * 100)}%
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Narrative & Insight Interpretation box */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="bg-slate-50 border border-slate-150 p-4 rounded">
          <div className="flex items-start gap-2">
            {finalProbability > 0.70 ? (
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="text-[10px] font-bold text-slate-800 uppercase block tracking-wider mb-1">
                Model Explanation
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {explanation.narrative}
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Individual Feature Impact Drivers</span>
          <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
            {activeShaps.map((s, idx) => {
              const isIncrease = s.effect === 'increase';
              return (
                <div key={idx} className="flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-2 rounded text-xs transition-colors">
                  <div className="flex items-center gap-2">
                    {isIncrease ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                    <span className="font-medium text-slate-700">{s.displayName}</span>
                  </div>
                  <span className={`font-mono text-[11px] font-medium shrink-0 ${isIncrease ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {s.description.split(':')[1]?.trim() || s.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
