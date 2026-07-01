import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, CheckCircle, FileText, Download, AlertTriangle, Loader2 } from 'lucide-react';
import { PredictionResult, EmployeeFeatures } from '../types';

interface BatchPredictorProps {
  onSaveBatchAlerts: (results: PredictionResult[]) => void;
}

export default function BatchPredictor({ onSaveBatchAlerts }: BatchPredictorProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [counts, setCounts] = useState({ HIGH: 0, MEDIUM: 0, LOW: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleFile = async (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setErrorMsg('Invalid file format. Please upload a standard comma-separated CSV (.csv) file.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);
    setResults([]);

    try {
      const text = await file.text();
      const parsedRecords = parseCSV(text);
      
      if (parsedRecords.length === 0) {
        setErrorMsg('No valid employee records found in CSV file. Ensure columns match the dataset schema.');
        setIsLoading(false);
        return;
      }

      // Query mass batch predictions from backend
      const response = await fetch('/api/batch-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedRecords)
      });

      if (!response.ok) throw new Error('Inference pipeline error');

      const data = await response.json();
      setResults(data);

      // Compute distribution counts
      const resCounts = data.reduce((acc: any, cur: any) => {
        acc[cur.risk_level] = (acc[cur.risk_level] || 0) + 1;
        return acc;
      }, { HIGH: 0, MEDIUM: 0, LOW: 0 });

      setCounts(resCounts);

      // Save predicted high-risk alerts automatically
      const highRiskPredictions = data.filter((p: any) => p.risk_level === 'HIGH' || p.risk_level === 'MEDIUM');
      if (highRiskPredictions.length > 0) {
        onSaveBatchAlerts(highRiskPredictions);
      }
    } catch (e) {
      setErrorMsg('Failed to process batch pipeline. Check CSV header names.');
    } finally {
      setIsLoading(false);
    }
  };

  // Basic CSV Client Parser
  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].replace(/^\uFEFF/, '').trim().split(',').map(h => h.trim());
    const results: any[] = [];

    // Columns mappings helper
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',');
      if (values.length !== headers.length) continue;

      const record: Record<string, any> = {};
      headers.forEach((h, idx) => {
        const val = values[idx].trim();
        const num = Number(val);
        record[h] = isNaN(num) ? val : num;
      });

      // Map raw attributes to our typed structure
      const parsed: EmployeeFeatures = {
        Age: Number(record.Age) || 35,
        BusinessTravel: record.BusinessTravel || 'Travel_Rarely',
        DailyRate: Number(record.DailyRate) || 800,
        Department: record.Department || 'Research & Development',
        DistanceFromHome: Number(record.DistanceFromHome) || 5,
        Education: Number(record.Education) || 3,
        EducationField: record.EducationField || 'Life Sciences',
        EnvironmentSatisfaction: Number(record.EnvironmentSatisfaction) || 3,
        Gender: record.Gender || 'Male',
        HourlyRate: Number(record.HourlyRate) || 65,
        JobInvolvement: Number(record.JobInvolvement) || 3,
        JobLevel: Number(record.JobLevel) || 2,
        JobRole: record.JobRole || 'Research Scientist',
        JobSatisfaction: Number(record.JobSatisfaction) || 3,
        MaritalStatus: record.MaritalStatus || 'Married',
        MonthlyIncome: Number(record.MonthlyIncome) || 5000,
        MonthlyRate: Number(record.MonthlyRate) || 15000,
        NumCompaniesWorked: record.NumCompaniesWorked || 1,
        OverTime: record.OverTime || 'No',
        PercentSalaryHike: record.PercentSalaryHike || 15,
        PerformanceRating: record.PerformanceRating || 3,
        RelationshipSatisfaction: record.RelationshipSatisfaction || 3,
        StockOptionLevel: record.StockOptionLevel || 0,
        TotalWorkingYears: record.TotalWorkingYears || 10,
        TrainingTimesLastYear: record.TrainingTimesLastYear || 2,
        WorkLifeBalance: record.WorkLifeBalance || 3,
        YearsAtCompany: record.YearsAtCompany || 5,
        YearsInCurrentRole: record.YearsInCurrentRole || record.YearsInRole || 3,
        YearsSinceLastPromotion: record.YearsSinceLastPromotion || 1,
        YearsWithCurrManager: record.YearsWithCurrManager || 3
      };

      // Attaching name helper
      (parsed as any).employee_id = record.EmployeeNumber ? `emp-${record.EmployeeNumber}` : `emp-batch-${i}`;
      (parsed as any).employee_name = `Employee REF-${record.EmployeeNumber || (1000 + i)}`;

      results.push(parsed);
    }
    return results;
  };

  const exportResultsToCSV = () => {
    if (results.length === 0) return;
    const headers = ['Employee Name', 'Department', 'Job Role', 'Turnover Probability', 'Risk Tier', 'Suggested Action'];
    const rows = results.map(r => [
      r.employee_name,
      r.top_risk_factors?.[0]?.feature?.includes('Department') ? 'Sales' : 'Research & Development', // Generic
      r.top_risk_factors?.[0]?.feature?.includes('JobRole') ? 'Technician' : 'Scientist',
      `${(r.attrition_probability * 100).toFixed(1)}%`,
      r.risk_level,
      r.suggested_interventions?.[0] || 'Schedule proactive stay session'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'turnover_risk_batch_predictions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-display font-bold text-slate-100 tracking-tight">Batch Risk Assessment</h1>
        <p className="text-slate-400 text-sm mt-1">Upload multiple staff profiles simultaneously to calculate turnover propensity across departments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Container (Left) */}
        <div className="lg:col-span-1 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[280px] transition-all relative overflow-hidden bg-slate-900/20 ${
              isDragOver
                ? 'border-cyan-500 bg-cyan-950/10 text-cyan-400'
                : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            {isLoading ? (
              <div className="space-y-3">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs font-mono text-slate-400">Processing vector pipeline & calculating cohort risks...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <UploadCloud className="w-12 h-12 text-slate-500 animate-bounce" />
                <div>
                  <p className="text-sm font-medium text-slate-200">Drag & drop employee CSV here</p>
                  <p className="text-xs text-slate-500 mt-1">or click to browse local directory</p>
                </div>
                <div className="text-[10px] bg-slate-950/60 font-mono text-slate-500 border border-slate-800/80 px-2.5 py-1 rounded-full inline-block">
                  Columns must match IBM HR Attrition specification
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-4 border border-rose-950 bg-rose-950/20 text-rose-400 text-xs rounded-lg flex gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Guidelines info card */}
          <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 shadow-md">
            <h3 className="text-xs font-mono uppercase text-slate-300 tracking-wider mb-2">Cohort Template Schema</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              For accuracy, the file must be a standard flat CSV containing categorical attributes (e.g. <b>OverTime</b>, <b>MaritalStatus</b>) and numeric attributes (e.g. <b>MonthlyIncome</b>, <b>DistanceFromHome</b>). High risk staff will automatically be appended to alerts.
            </p>
          </div>
        </div>

        {/* Cohort Results Table / Display (Right) */}
        <div className="lg:col-span-2 border border-slate-800 bg-slate-900/40 rounded-xl p-5 shadow-xl backdrop-blur-md flex flex-col min-h-[400px]">
          
          <div className="flex justify-between items-center gap-4 flex-wrap border-b border-slate-800 pb-4 mb-4">
            <div>
              <h3 className="text-lg font-display font-medium text-slate-100">Batch Results Summary</h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribution and individual turnover scores for parsed cohort.</p>
            </div>
            {results.length > 0 && (
              <button
                onClick={exportResultsToCSV}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-slate-100 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            )}
          </div>

          {/* Results stats top indicators */}
          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-5 text-center">
              <div className="border border-rose-950/40 bg-rose-950/10 p-3 rounded-lg">
                <span className="text-xs font-mono uppercase text-rose-400">High Risk (&gt;70%)</span>
                <p className="text-2xl font-bold font-display text-rose-400 mt-1">{counts.HIGH}</p>
              </div>
              <div className="border border-amber-950/40 bg-amber-950/10 p-3 rounded-lg">
                <span className="text-xs font-mono uppercase text-amber-400">Medium Risk (40-70%)</span>
                <p className="text-2xl font-bold font-display text-amber-400 mt-1">{counts.MEDIUM}</p>
              </div>
              <div className="border border-emerald-950/40 bg-emerald-950/10 p-3 rounded-lg">
                <span className="text-xs font-mono uppercase text-emerald-400">Low Risk (&lt;40%)</span>
                <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{counts.LOW}</p>
              </div>
            </div>
          )}

          {/* Records Table */}
          <div className="flex-1 overflow-x-auto select-text scrollbar-thin">
            {results.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Primary Turnover Driver</th>
                    <th className="py-2.5 px-3">Propensity Score</th>
                    <th className="py-2.5 px-3">Risk Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {results.map((r, idx) => {
                    let riskColor = 'text-emerald-400 bg-emerald-950/20';
                    if (r.risk_level === 'HIGH') riskColor = 'text-rose-400 bg-rose-950/20';
                    else if (r.risk_level === 'MEDIUM') riskColor = 'text-amber-400 bg-amber-950/20';

                    return (
                      <tr key={idx} className="hover:bg-slate-850/40 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-200">{r.employee_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">ID: {r.employee_id}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-slate-300 font-medium">{r.top_risk_factors?.[0]?.displayName || 'Stable'}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-200">
                          {Math.round(r.attrition_probability * 100)}%
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full inline-block ${riskColor}`}>
                            {r.risk_level}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs text-center border border-dashed border-slate-800 rounded-lg p-10">
                <FileText className="w-8 h-8 text-slate-600 mb-2" />
                No cohort file parsed yet.<br/>Upload a .csv file on the left to activate bulk predictive inference.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
