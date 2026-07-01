import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronRight, 
  HelpCircle, 
  Sparkles, 
  Save, 
  RotateCcw, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  CheckCircle,
  Briefcase,
  TrendingUp,
  Heart,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';
import { EmployeeFeatures, RiskFactor, PredictionResult } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';

interface SlicerPredictorProps {
  employees: any[];
  selectedEmployeeId?: string;
  onSaveAlert: (result: PredictionResult) => void;
  systemPrompt: string;
}

// Medians/Defaults based on the IBM HR Attrition dataset
const DEFAULT_FEATURES: EmployeeFeatures = {
  Age: 35,
  BusinessTravel: 'Travel_Rarely',
  DailyRate: 800,
  Department: 'Research & Development',
  DistanceFromHome: 6,
  Education: 3,
  EducationField: 'Life Sciences',
  EnvironmentSatisfaction: 3,
  Gender: 'Male',
  HourlyRate: 65,
  JobInvolvement: 3,
  JobLevel: 2,
  JobRole: 'Research Scientist',
  JobSatisfaction: 3,
  MaritalStatus: 'Married',
  MonthlyIncome: 5000,
  MonthlyRate: 15000,
  NumCompaniesWorked: 1,
  OverTime: 'No',
  PercentSalaryHike: 14,
  PerformanceRating: 3,
  RelationshipSatisfaction: 3,
  StockOptionLevel: 1,
  TotalWorkingYears: 10,
  TrainingTimesLastYear: 2,
  WorkLifeBalance: 3,
  YearsAtCompany: 5,
  YearsInCurrentRole: 3,
  YearsSinceLastPromotion: 1,
  YearsWithCurrManager: 3
};

export default function SlicerPredictor({ employees, selectedEmployeeId, onSaveAlert, systemPrompt }: SlicerPredictorProps) {
  const [features, setFeatures] = useState<EmployeeFeatures>(DEFAULT_FEATURES);
  const [selectedEmp, setSelectedEmp] = useState<string>('');
  
  // Real-time calculation state
  const [prediction, setPrediction] = useState<any>(null);
  const [isCalculating, setIsToggling] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI Retention Coach State
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Sync to outer selectedEmployeeId changes (like when clicking alert in Dashboard)
  useEffect(() => {
    if (selectedEmployeeId && employees.length > 0) {
      const found = employees.find(e => e.id === selectedEmployeeId);
      if (found) {
        setFeatures(found);
        setSelectedEmp(selectedEmployeeId);
      }
    }
  }, [selectedEmployeeId, employees]);

  // Debounced Predictor Calculation
  useEffect(() => {
    setIsToggling(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(features)
        });
        const data = await response.json();
        setPrediction(data);
      } catch (e) {
        console.error('Prediction query failed:', e);
      } finally {
        setIsToggling(false);
      }
    }, 250); // 250ms debounce

    return () => clearTimeout(timer);
  }, [features]);

  // Employee Selection Loader
  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    setSelectedEmp(empId);
    if (!empId) {
      setFeatures(DEFAULT_FEATURES);
      return;
    }
    const found = employees.find(emp => emp.id === empId);
    if (found) {
      // Exclude identifiers, load pure features
      const { id, employee_ref, created_at, ...pureFeatures } = found;
      setFeatures(pureFeatures);
    }
  };

  const updateNumericFeature = (key: keyof EmployeeFeatures, value: number) => {
    setFeatures(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateStringFeature = (key: keyof EmployeeFeatures, value: string) => {
    setFeatures(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetToDefault = () => {
    setFeatures(DEFAULT_FEATURES);
    setSelectedEmp('');
    setSaveSuccess(false);
  };

  // Trigger Gemini API Assistant via the Fullstack /api/ai/coach endpoint
  const askAICoach = async () => {
    if (!prediction) return;
    setIsLoadingAi(true);
    setShowAiModal(true);
    setAiResponse('');

    try {
      const activeName = selectedEmp 
        ? employees.find(e => e.id === selectedEmp)?.employee_ref || 'Target Employee'
        : 'Slicer Custom Employee';

      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: activeName,
          attritionProb: prediction.attrition_probability,
          riskLevel: prediction.risk_level,
          riskFactors: prediction.top_risk_factors,
          department: features.Department,
          jobRole: features.JobRole
        })
      });
      const data = await res.json();
      setAiResponse(data.plan || 'Unable to fetch coaching plan.');
    } catch (e) {
      setAiResponse('Error contacting GenAI retention coach. Please verify backend configurations.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSaveToAlerts = () => {
    if (!prediction) return;
    const alertLabel = selectedEmp
      ? `Employee ${employees.find(e => e.id === selectedEmp)?.employee_ref} (${selectedEmp === 'emp-1' ? 'Sonali M.' : selectedEmp === 'emp-3' ? 'Narsinh K.' : 'Staff Member'})`
      : 'Slicer Custom Simulation Profile';

    onSaveAlert({
      employee_id: selectedEmp || 'custom-slicer',
      employee_name: alertLabel,
      attrition_probability: prediction.attrition_probability,
      risk_level: prediction.risk_level,
      top_risk_factors: prediction.top_risk_factors,
      suggested_interventions: prediction.suggested_interventions,
      prediction_id: prediction.prediction_id,
      model_version: '1.0.0',
      created_at: new Date().toISOString()
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Build Recharts SHAP Waterfall data
  const waterfallData = prediction?.top_risk_factors?.map((f: RiskFactor) => ({
    name: f.displayName,
    'SHAP Impact': parseFloat((f.impact * 100).toFixed(1)),
    color: f.impact >= 0 ? '#f43f5e' : '#10b981'
  })) || [];

  const getRiskBadgeColorStyle = (prob: number) => {
    if (prob >= 0.70) return 'text-rose-400 border-rose-500/40 bg-rose-950/20';
    if (prob >= 0.40) return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
  };

  return (
    <div className="relative select-none text-slate-200">
      
      {/* Top Header Bar */}
      <div className="bg-[#485cb4] rounded-sm p-4 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold tracking-wide uppercase flex items-center gap-2">
            👤 Employee Attrition Scenario Analyser
          </h2>
          <p className="text-xs text-indigo-100/90 font-mono uppercase tracking-wider mt-0.5">
            Interactive what-if simulator • Dr Harry Patria • Patria & Co.
          </p>
        </div>
        
        {/* Profile Selector */}
        <div className="flex items-center gap-3 bg-slate-950/60 border border-white/10 px-3 py-1.5 rounded-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-200">Load Profile:</span>
          <select
            value={selectedEmp}
            onChange={handleEmployeeChange}
            className="bg-slate-900 border border-slate-800 rounded-sm py-1 px-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono max-w-[240px]"
          >
            <option value="">-- [Custom Simulation] --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.employee_ref} ({emp.job_role} • {emp.department === 'Research & Development' ? 'R&D' : emp.department === 'Human Resources' ? 'HR' : 'Sales'})
              </option>
            ))}
          </select>
          {selectedEmp && (
            <button
              onClick={resetToDefault}
              className="text-[10px] font-mono text-cyan-400 hover:underline hover:text-cyan-300 cursor-pointer uppercase tracking-widest font-bold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Form Fields Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Left Card: Personal & Job Profile */}
        <div className="border border-slate-800 bg-slate-900/60 rounded-sm p-5 shadow-lg space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            🏛️ PERSONAL & JOB PROFILE
          </h3>
          <div className="space-y-4">
            <SlicerRow
              label="Age"
              value={features.Age}
              min={18}
              max={60}
              unit="years"
              onChange={(v) => updateNumericFeature('Age', v)}
            />
            <SlicerRow
              label="Monthly Income"
              value={features.MonthlyIncome}
              min={1000}
              max={20000}
              step={100}
              unit="$"
              onChange={(v) => updateNumericFeature('MonthlyIncome', v)}
            />
            <SlicerRow
              label="Job Satisfaction"
              value={features.JobSatisfaction}
              min={1}
              max={4}
              unit="/ 4"
              onChange={(v) => updateNumericFeature('JobSatisfaction', v)}
            />
            <SlicerRow
              label="Work-Life Balance"
              value={features.WorkLifeBalance}
              min={1}
              max={4}
              unit="/ 4"
              onChange={(v) => updateNumericFeature('WorkLifeBalance', v)}
            />
            <SlicerRow
              label="Environment Satisfaction"
              value={features.EnvironmentSatisfaction}
              min={1}
              max={4}
              unit="/ 4"
              onChange={(v) => updateNumericFeature('EnvironmentSatisfaction', v)}
            />
            <SlicerRow
              label="Distance from Home"
              value={features.DistanceFromHome}
              min={1}
              max={29}
              unit="km"
              onChange={(v) => updateNumericFeature('DistanceFromHome', v)}
            />
            <SlicerRow
              label="Years at Company"
              value={features.YearsAtCompany}
              min={0}
              max={40}
              unit="years"
              onChange={(v) => updateNumericFeature('YearsAtCompany', v)}
            />
            <SlicerRow
              label="Years Since Last Promotion"
              value={features.YearsSinceLastPromotion}
              min={0}
              max={15}
              unit="years"
              onChange={(v) => updateNumericFeature('YearsSinceLastPromotion', v)}
            />
            <SlicerRow
              label="Stock Option Level"
              value={features.StockOptionLevel}
              min={0}
              max={3}
              unit="level"
              onChange={(v) => updateNumericFeature('StockOptionLevel', v)}
            />
          </div>
        </div>

        {/* Right Card: Work Context */}
        <div className="border border-slate-800 bg-slate-900/60 rounded-sm p-5 shadow-lg space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            📅 WORK CONTEXT
          </h3>
          <div className="space-y-4">
            <DropdownRow
              label="Marital Status"
              value={features.MaritalStatus}
              options={[
                { label: 'Single', value: 'Single' },
                { label: 'Married', value: 'Married' },
                { label: 'Divorced', value: 'Divorced' }
              ]}
              onChange={(v) => updateStringFeature('MaritalStatus', v)}
            />
            <DropdownRow
              label="Business Travel"
              value={features.BusinessTravel}
              options={[
                { label: 'Travel Rarely', value: 'Travel_Rarely' },
                { label: 'Travel Frequently', value: 'Travel_Frequently' },
                { label: 'Non-Travel', value: 'Non-Travel' }
              ]}
              onChange={(v) => updateStringFeature('BusinessTravel', v)}
            />
            <DropdownRow
              label="Department"
              value={features.Department}
              options={[
                { label: 'R&D', value: 'Research & Development' },
                { label: 'Sales', value: 'Sales' },
                { label: 'HR', value: 'Human Resources' }
              ]}
              onChange={(v) => updateStringFeature('Department', v)}
            />
            <DropdownRow
              label="Job Role"
              value={features.JobRole}
              options={[
                { label: 'Research Scientist', value: 'Research Scientist' },
                { label: 'Sales Executive', value: 'Sales Executive' },
                { label: 'Laboratory Technician', value: 'Laboratory Technician' },
                { label: 'Manufacturing Director', value: 'Manufacturing Director' },
                { label: 'Healthcare Representative', value: 'Healthcare Representative' },
                { label: 'Manager', value: 'Manager' },
                { label: 'Sales Representative', value: 'Sales Representative' },
                { label: 'Research Director', value: 'Research Director' },
                { label: 'Human Resources', value: 'Human Resources' }
              ]}
              onChange={(v) => updateStringFeature('JobRole', v)}
            />

            {/* Overtime Toggle */}
            <div className="flex items-center justify-between bg-slate-950/40 border border-slate-850 p-3 rounded-sm">
              <span className="text-xs font-sans font-medium text-slate-300 flex items-center gap-1.5">
                ⚡ Works Overtime?
              </span>
              <button
                type="button"
                onClick={() => updateStringFeature('OverTime', features.OverTime === 'Yes' ? 'No' : 'Yes')}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  features.OverTime === 'Yes' ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                    features.OverTime === 'Yes' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <SlicerRow
              label="Job Involvement"
              value={features.JobInvolvement}
              min={1}
              max={4}
              unit="/ 4"
              onChange={(v) => updateNumericFeature('JobInvolvement', v)}
            />
            <SlicerRow
              label="Number of Companies Worked"
              value={features.NumCompaniesWorked}
              min={0}
              max={9}
              unit="companies"
              onChange={(v) => updateNumericFeature('NumCompaniesWorked', v)}
            />
            <SlicerRow
              label="Training Times Last Year"
              value={features.TrainingTimesLastYear}
              min={0}
              max={6}
              unit="times"
              onChange={(v) => updateNumericFeature('TrainingTimesLastYear', v)}
            />
            <SlicerRow
              label="Relationship Satisfaction"
              value={features.RelationshipSatisfaction}
              min={1}
              max={4}
              unit="/ 4"
              onChange={(v) => updateNumericFeature('RelationshipSatisfaction', v)}
            />
          </div>
        </div>

      </div>

      {/* Bottom Panel Block: Gauge & Factors */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-sm p-6 shadow-lg space-y-6">
        
        {/* Pipeline & Model Source Badges */}
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-850 pb-4">
          <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Active Sandbox Pipeline:</span>
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 px-2.5 py-1 rounded-sm text-[10px] font-mono text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            SCALER: preprocessing.pkl (loaded)
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 px-2.5 py-1 rounded-sm text-[10px] font-mono text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            CLASSIFIER: model.pkl (loaded)
          </div>
          <span className="text-[9px] text-slate-500 font-mono ml-auto">
            METADATA HASH: gb_v1_dp_harry
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Estimated Attrition Risk Segmented Gauge Card */}
          <div className="lg:col-span-4 border border-slate-800 bg-slate-950/40 rounded-sm p-4 flex flex-col items-center justify-between text-center relative overflow-hidden min-h-[300px]">
            <div className="w-full">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-2 font-bold">Estimated Attrition Risk</div>
              
              {isCalculating ? (
                <div className="h-[110px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                </div>
              ) : (
                <SemiCircularGauge probability={prediction ? prediction.attrition_probability : 0} />
              )}
            </div>

            <div className="w-full space-y-2 mt-2">
              <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
                {prediction ? `${Math.round(prediction.attrition_probability * 100)}%` : '0%'}
              </div>
              
              <div className="flex justify-center">
                <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-sm border uppercase tracking-widest ${
                  prediction ? getRiskBadgeColorStyle(prediction.attrition_probability) : 'text-slate-400 border-slate-800'
                }`}>
                  {prediction?.risk_level || 'LOW'} RISK
                </span>
              </div>
            </div>

            {/* Action Buttons: Ask AI Coach & Save Alert */}
            <div className="flex gap-2 w-full mt-4">
              <button
                onClick={askAICoach}
                disabled={!prediction}
                className="flex-1 bg-slate-950 border border-cyan-805 hover:bg-slate-900 hover:text-cyan-400 text-cyan-400 font-bold py-1.5 rounded-sm text-[10px] font-mono transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                AI COACH
              </button>
              <button
                onClick={handleSaveToAlerts}
                disabled={!prediction || saveSuccess}
                className={`flex-1 font-bold py-1.5 rounded-sm text-[10px] font-mono transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md ${
                  saveSuccess
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    SAVED
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    SAVE ALERT
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Zero-Centered Horizontal SHAP Value Bar Chart Card */}
          <div className="lg:col-span-8 border border-slate-800 bg-slate-950/20 rounded-sm p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-300 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-cyan-500"></span> SHAP FEATURE ATTRIBUTION (TOP 5 DRIVERS)
                </h4>
                <div className="flex items-center gap-3 text-[9px] font-mono">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-sm"></span> RISKS</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-sm"></span> PROTECTIVE</span>
                </div>
              </div>

              {prediction?.top_risk_factors && prediction.top_risk_factors.length > 0 ? (
                <div className="w-full mt-2 select-none">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={prediction.top_risk_factors.slice(0, 5).map((f: RiskFactor) => ({
                        name: f.displayName,
                        value: parseFloat((f.impact * 100).toFixed(1)),
                        color: f.impact >= 0 ? '#f43f5e' : '#10b981'
                      }))}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis 
                        type="number" 
                        domain={[-100, 100]} 
                        stroke="#475569" 
                        fontSize={9} 
                        tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}%`}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#94a3b8" 
                        fontSize={9} 
                        width={130} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '10px' }}
                        formatter={(value: any) => [`${value > 0 ? '+' : ''}${value}%`, 'SHAP Impact']}
                      />
                      <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
                      <Bar dataKey="value">
                        {prediction.top_risk_factors.slice(0, 5).map((f: RiskFactor, index: number) => (
                          <Cell key={`cell-${index}`} fill={f.impact >= 0 ? '#f43f5e' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-xs text-slate-500 italic font-mono uppercase tracking-wider">
                  Select employee or tweak sliders to calculate feature drivers
                </div>
              )}
            </div>

            <p className="text-[9px] text-slate-500 uppercase font-mono tracking-wider mt-2 border-t border-slate-900 pt-2 leading-relaxed">
              *Shapley values represent each feature's direct contribution score in percentage points relative to the baseline attrition likelihood. Scaled using standard metadata.
            </p>
          </div>

        </div>

        {/* Recommended HR Actions Banner */}
        <div className="bg-[#5c4484]/10 border border-[#5c4484]/30 rounded-sm p-4 space-y-2">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#a88ed4] font-bold flex items-center gap-2">
            📋 Recommended HR Actions
          </h4>
          <div className="space-y-1.5">
            {prediction?.suggested_interventions?.length > 0 ? (
              prediction.suggested_interventions.slice(0, 3).map((item: string, idx: number) => (
                <div key={idx} className="flex gap-2 items-start text-xs text-slate-300 font-sans leading-relaxed">
                  <span className="text-[#a88ed4]">•</span>
                  <p>{item}</p>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 font-mono italic">
                No immediate actions required — continue regular check-ins.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* AI Retention Coach Drawer/Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-sm shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="border-b border-slate-800 p-5 flex justify-between items-center bg-slate-950/40 rounded-t-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-100">GenAI Retention Coach</h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-0.5">Real-time coaching recommendations powered by Gemini 3.5 Flash.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-200 text-[10px] font-mono p-2 hover:bg-slate-800 rounded-sm cursor-pointer uppercase tracking-widest"
              >
                Close [Esc]
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-300 text-sm scrollbar-thin select-text">
              {isLoadingAi ? (
                <div className="h-full flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Synthesizing SHAP drivers & compiling stay coaching track...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-cyan max-w-none text-xs md:text-sm font-sans whitespace-pre-wrap leading-relaxed">
                  {aiResponse}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 p-4 bg-slate-950/20 text-center rounded-b-sm flex justify-between items-center gap-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">SYSTEM AGENT: gemini-3.5-flash</span>
              <button
                onClick={askAICoach}
                disabled={isLoadingAi}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-1.5 rounded-sm text-[10px] font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50 uppercase tracking-wider"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Regenerate Plan
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

// Slider Row sub-component
interface SlicerRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (val: number) => void;
}

function SlicerRow({ label, value, min, max, step = 1, unit, onChange }: SlicerRowProps) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5 select-none">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-300 font-sans font-medium w-1/3 text-left">{label}</span>
        <span className="font-bold text-slate-100 text-center w-1/3">{value.toLocaleString()}</span>
        <span className="text-slate-500 text-[10px] text-right w-1/3 uppercase">{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-sm appearance-none cursor-pointer focus:outline-none accent-cyan-500"
        style={{
          background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${percent}%, #1e293b ${percent}%, #1e293b 100%)`
        }}
      />
    </div>
  );
}

// Dropdown Selector sub-component
interface DropdownRowProps {
  label: string;
  value: string | number;
  options: { label: string; value: string | number }[];
  onChange: (val: any) => void;
}

function DropdownRow({ label, value, options, onChange }: DropdownRowProps) {
  return (
    <div className="space-y-1 select-none">
      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-950 border border-slate-850 rounded-sm py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all font-mono"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Custom SemiCircular Gauge sub-component with milestones (0.4, 0.7)
function SemiCircularGauge({ probability }: { probability: number }) {
  const getCoordinatesForPercent = (percent: number, radius: number = 70) => {
    // 0% is at Math.PI (180 deg), 100% is at 0 (0 deg)
    const angle = Math.PI - (percent * Math.PI);
    const x = 100 + radius * Math.cos(angle);
    const y = 90 - radius * Math.sin(angle);
    return { x, y };
  };

  const lowEnd = getCoordinatesForPercent(0.4);
  const medEnd = getCoordinatesForPercent(0.7);

  // SVG Path for arc slice: d="M startX startY A radius radius 0 0 1 endX endY"
  // Low arc path (0 to 40%): green
  const lowArc = `M 30 90 A 70 70 0 0 1 ${lowEnd.x} ${lowEnd.y}`;
  // Medium arc path (40% to 70%): amber
  const medArc = `M ${lowEnd.x} ${lowEnd.y} A 70 70 0 0 1 ${medEnd.x} ${medEnd.y}`;
  // High arc path (70% to 100%): rose
  const highArc = `M ${medEnd.x} ${medEnd.y} A 70 70 0 0 1 170 90`;

  // Needle length
  const needleLen = 65;
  const needlePos = getCoordinatesForPercent(probability, needleLen);

  return (
    <div className="relative w-full max-w-[200px] h-[110px] flex items-center justify-center select-none mx-auto">
      <svg className="w-full h-full" viewBox="0 0 200 110">
        {/* Background Grey Arc */}
        <path d="M 30 90 A 70 70 0 0 1 170 90" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
        
        {/* Segmented Color-coded segments */}
        <path d={lowArc} fill="none" stroke="#10b981" strokeWidth="12" />
        <path d={medArc} fill="none" stroke="#f59e0b" strokeWidth="12" />
        <path d={highArc} fill="none" stroke="#f43f5e" strokeWidth="12" strokeLinecap="round" />

        {/* Milestone Tick Lines & Labels */}
        {/* 0.4 Tick */}
        <line x1={lowEnd.x} y1={lowEnd.y} x2={lowEnd.x + (lowEnd.x - 100)*0.15} y2={lowEnd.y + (lowEnd.y - 90)*0.15} stroke="#ffffff" strokeWidth="1.5" />
        <text x={lowEnd.x - 8} y={lowEnd.y - 8} className="fill-slate-400 text-[8px] font-mono font-bold">0.4</text>

        {/* 0.7 Tick */}
        <line x1={medEnd.x} y1={medEnd.y} x2={medEnd.x + (medEnd.x - 100)*0.15} y2={medEnd.y + (medEnd.y - 90)*0.15} stroke="#ffffff" strokeWidth="1.5" />
        <text x={medEnd.x + 4} y={medEnd.y - 8} className="fill-slate-400 text-[8px] font-mono font-bold">0.7</text>

        {/* Start/End labels */}
        <text x="20" y="105" className="fill-slate-500 text-[7px] font-mono font-bold">0.0</text>
        <text x="170" y="105" className="fill-slate-500 text-[7px] font-mono font-bold">1.0</text>

        {/* Pivot Center Pin */}
        <circle cx="100" cy="90" r="7" className="fill-slate-900 stroke-slate-500" strokeWidth="1.5" />
        <circle cx="100" cy="90" r="2.5" className="fill-cyan-400" />

        {/* Needle */}
        <line 
          x1="100" 
          y1="90" 
          x2={needlePos.x} 
          y2={needlePos.y} 
          stroke="#22d3ee" 
          strokeWidth="3" 
          strokeLinecap="round" 
          className="transition-all duration-300 ease-out" 
        />
      </svg>
    </div>
  );
}


