/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sliders, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Smile, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  User, 
  Calendar, 
  Building, 
  HelpCircle,
  HelpCircle as QuestionIcon
} from 'lucide-react';

const ROLES_BY_DEPT: { [key: string]: string[] } = {
  Engineering: [
    'Research Scientist', 
    'Laboratory Technician', 
    'Senior Software Engineer', 
    'Software Engineer II', 
    'QA Lead', 
    'DevOps Specialist', 
    'Manufacturing Director', 
    'Healthcare Representative', 
    'Research Director'
  ],
  Sales: [
    'Sales Executive', 
    'Sales Representative', 
    'Account Executive', 
    'Sales Director', 
    'Business Development Representative'
  ],
  HR: [
    'Human Resources', 
    'HR Business Partner', 
    'Talent Acquisition Specialist', 
    'Compensation & Benefits Lead'
  ],
  Marketing: [
    'Growth Marketer', 
    'Content Strategist', 
    'SEO Specialist', 
    'Creative Director'
  ],
  Product: [
    'Product Manager', 
    'UX Designer', 
    'Product Analyst', 
    'Director of Product'
  ],
  Operations: [
    'Operations Manager', 
    'Operations Coordinator', 
    'Logistics Analyst'
  ]
};

export default function ScenarioAnalyser() {
  // --- STATE VARIABLES ---
  
  // 1. PERSONAL & JOB PROFILE (Left Column Sliders)
  const [age, setAge] = useState<number>(32);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(5009);
  const [jobSatisfaction, setJobSatisfaction] = useState<number>(3);
  const [workLifeBalance, setWorkLifeBalance] = useState<number>(3);
  const [environmentSatisfaction, setEnvironmentSatisfaction] = useState<number>(3);
  const [distanceFromHome, setDistanceFromHome] = useState<number>(7);
  const [yearsAtCompany, setYearsAtCompany] = useState<number>(5);
  const [yearsSinceLastPromotion, setYearsSinceLastPromotion] = useState<number>(1);
  const [stockOptionLevel, setStockOptionLevel] = useState<number>(1);

  // 2. WORK CONTEXT (Right Column Inputs)
  const [maritalStatus, setMaritalStatus] = useState<string>('Single');
  const [businessTravel, setBusinessTravel] = useState<string>('Travel Rarely');
  const [department, setDepartment] = useState<string>('Engineering');
  const [jobRole, setJobRole] = useState<string>('Research Scientist');
  const [worksOvertime, setWorksOvertime] = useState<boolean>(false);
  const [jobInvolvement, setJobInvolvement] = useState<number>(3);
  const [numCompaniesWorked, setNumCompaniesWorked] = useState<number>(2);
  const [trainingTimesLastYear, setTrainingTimesLastYear] = useState<number>(3);
  const [relationshipSatisfaction, setRelationshipSatisfaction] = useState<number>(3);

  // Calculated and derived variables
  const [attritionRisk, setAttritionRisk] = useState<number>(25);
  const [modelRisk, setModelRisk] = useState<number>(25);
  const [activeModelName, setActiveModelName] = useState<string>('LogisticRegression');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [protectiveFactors, setProtectiveFactors] = useState<string[]>([]);
  const [hrActions, setHrActions] = useState<string[]>([]);
  const [shapValues, setShapValues] = useState<any[]>([]);
  const [preprocessorActive, setPreprocessorActive] = useState<boolean>(false);

  // Update Job Role automatically if Department changes to a valid one
  useEffect(() => {
    const roles = ROLES_BY_DEPT[department] || [];
    if (roles.length > 0 && !roles.includes(jobRole)) {
      setJobRole(roles[0]);
    }
  }, [department]);

  // --- MODEL PREDICTION GATEWAY ---
  useEffect(() => {
    let active = true;
    
    async function fetchModelPrediction() {
      setIsLoading(true);
      try {
        const payload = {
          age,
          monthlyIncome,
          jobSatisfaction,
          workLifeBalance,
          environmentSatisfaction,
          yearsAtCompany,
          yearsSinceLastPromotion,
          stockOptionLevel,
          overTime: worksOvertime ? 1 : 0,
          department,
          jobRole,
          gender: "Male", // Placeholder
          distanceFromHome,
          maritalStatus,
          businessTravel,
          jobInvolvement,
          numCompaniesWorked,
          trainingTimesLastYear,
          relationshipSatisfaction
        };

        const res = await fetch('/api/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error('Prediction API failed');
        }

        const data = await res.json();
        
        if (active) {
          // Model base probability
          const rawProb = data.attrition_probability * 100;
          setModelRisk(rawProb);
          setActiveModelName(data.model_type || 'LogisticRegression');
          setShapValues(data.shap_values || []);
          setPreprocessorActive(!!data.preprocessor_loaded);
        }
      } catch (err) {
        console.error('Error fetching dynamic prediction:', err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    // Small debounce to avoid flooding
    const timeoutId = setTimeout(fetchModelPrediction, 80);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [
    age,
    monthlyIncome,
    jobSatisfaction,
    workLifeBalance,
    environmentSatisfaction,
    yearsAtCompany,
    yearsSinceLastPromotion,
    stockOptionLevel,
    worksOvertime,
    department,
    jobRole,
    distanceFromHome,
    maritalStatus,
    businessTravel,
    jobInvolvement,
    numCompaniesWorked,
    trainingTimesLastYear,
    relationshipSatisfaction
  ]);

  // --- WORKSPACE CONTEXT ADJUSTMENTS & DYNAMIC FACTORS ---
  useEffect(() => {
    let finalAdjustedProb = 0;

    // If the pickle GradientBoostingClassifier is running, it natively calculates
    // the true model probability with all 30 features. No client-side adjustments needed.
    if (activeModelName === 'GradientBoostingClassifier') {
      finalAdjustedProb = Math.min(98, Math.max(2, Math.round(modelRisk)));
      setAttritionRisk(finalAdjustedProb);
    } else {
      // Start with the logistic regression model risk
      let calculatedProb = modelRisk;

      // Apply adjustments for Work Context parameters that aren't inside the 9-feature model:
      // 1. Marital Status
      let maritalAdjustment = 0;
      if (maritalStatus === 'Single') {
        maritalAdjustment = 6; // +6% risk
      } else if (maritalStatus === 'Married') {
        maritalAdjustment = -4; // -4% risk
      } else if (maritalStatus === 'Divorced') {
        maritalAdjustment = -2; // -2% risk
      }

      // 2. Business Travel
      let travelAdjustment = 0;
      if (businessTravel === 'Travel Frequently') {
        travelAdjustment = 8; // +8% risk
      } else if (businessTravel === 'Travel Rarely') {
        travelAdjustment = 1; // +1% risk
      } else if (businessTravel === 'Non-Travel') {
        travelAdjustment = -4; // -4% risk
      }

      // 3. Distance From Home
      let distanceAdjustment = 0;
      if (distanceFromHome >= 18) {
        distanceAdjustment = 5; // +5% risk
      } else if (distanceFromHome < 8) {
        distanceAdjustment = -3; // -3% risk
      }

      // 4. Job Involvement
      let involvementAdjustment = 0;
      if (jobInvolvement <= 2) {
        involvementAdjustment = 6; // +6% risk
      } else if (jobInvolvement >= 4) {
        involvementAdjustment = -4; // -4% risk
      }

      // 5. Relationship Satisfaction
      let relationshipAdjustment = 0;
      if (relationshipSatisfaction <= 2) {
        relationshipAdjustment = 4; // +4% risk
      } else if (relationshipSatisfaction >= 4) {
        relationshipAdjustment = -3; // -3% risk
      }

      // 6. Number of Companies Worked (Job hopping index)
      let companiesAdjustment = 0;
      if (numCompaniesWorked >= 5) {
        companiesAdjustment = 5; // +5% risk
      } else if (numCompaniesWorked <= 1) {
        companiesAdjustment = -2; // -2% risk
      }

      // 7. Training Times Last Year (Lack of development)
      let trainingAdjustment = 0;
      if (trainingTimesLastYear <= 1) {
        trainingAdjustment = 3; // +3% risk
      } else if (trainingTimesLastYear >= 4) {
        trainingAdjustment = -2; // -2% risk
      }

      // Sum adjustments and clamp final probability to realistic boundaries (2% to 98%)
      finalAdjustedProb = Math.min(
        98, 
        Math.max(2, Math.round(calculatedProb + maritalAdjustment + travelAdjustment + distanceAdjustment + involvementAdjustment + relationshipAdjustment + companiesAdjustment + trainingAdjustment))
      );
      
      setAttritionRisk(finalAdjustedProb);
    }

    // --- DYNAMIC RISK FACTORS LIST ---
    const rFactors: string[] = [];
    if (maritalStatus === 'Single') rFactors.push(`Single — higher mobility (+6%)`);
    if (worksOvertime) rFactors.push(`Works Overtime — highly correlated with burnout (+12%)`);
    if (businessTravel === 'Travel Frequently') rFactors.push(`Frequent business travel (+8%)`);
    if (distanceFromHome >= 15) rFactors.push(`Long commute distance of ${distanceFromHome} km (+5%)`);
    if (jobSatisfaction <= 2) rFactors.push(`Low job satisfaction rating of ${jobSatisfaction}/4 (+10%)`);
    if (workLifeBalance <= 2) rFactors.push(`Imbalanced work-life score of ${workLifeBalance}/4 (+9%)`);
    if (environmentSatisfaction <= 2) rFactors.push(`Low environment satisfaction rating of ${environmentSatisfaction}/4 (+7%)`);
    if (yearsSinceLastPromotion >= 3) rFactors.push(`Career stagnation (${yearsSinceLastPromotion} years since promotion) (+8%)`);
    if (jobInvolvement <= 2) rFactors.push(`Low organizational job involvement of ${jobInvolvement}/4 (+6%)`);
    if (numCompaniesWorked >= 5) rFactors.push(`Job-hopping history (${numCompaniesWorked} companies worked) (+5%)`);
    if (monthlyIncome < 4000) rFactors.push(`Monthly income below market entry standard of $4,000 (+8%)`);
    if (stockOptionLevel === 0) rFactors.push(`No stock options participation (+5%)`);

    setRiskFactors(rFactors);

    // --- DYNAMIC PROTECTIVE FACTORS LIST ---
    const pFactors: string[] = [];
    if (!worksOvertime) pFactors.push(`No overtime required`);
    if (maritalStatus === 'Married') pFactors.push(`Married status — higher workforce stability`);
    if (businessTravel === 'Non-Travel') pFactors.push(`Non-travel role eliminates commuting fatigue`);
    if (distanceFromHome < 10) pFactors.push(`Short commute distance (${distanceFromHome} km)`);
    if (jobSatisfaction >= 3) pFactors.push(`High job satisfaction index (${jobSatisfaction}/4)`);
    if (workLifeBalance >= 3) pFactors.push(`Healthy work-life integration (${workLifeBalance}/4)`);
    if (environmentSatisfaction >= 3) pFactors.push(`Excellent environment satisfaction (${environmentSatisfaction}/4)`);
    if (yearsSinceLastPromotion <= 1) pFactors.push(`Recently promoted`);
    if (jobInvolvement >= 3) pFactors.push(`High organizational job involvement (${jobInvolvement}/4)`);
    if (relationshipSatisfaction >= 3) pFactors.push(`High relationship satisfaction (${relationshipSatisfaction}/4)`);
    if (monthlyIncome >= 8000) pFactors.push(`Income within highly competitive range ($${monthlyIncome.toLocaleString()}/mo)`);
    if (stockOptionLevel >= 1) pFactors.push(`Equity participation (Stock Option Level ${stockOptionLevel})`);
    if (yearsAtCompany >= 6) pFactors.push(`Stable organizational tenure (${yearsAtCompany} years)`);

    setProtectiveFactors(pFactors);

    // --- DYNAMIC HR ACTIONS ---
    const actions: string[] = [];
    if (finalAdjustedProb >= 70) {
      actions.push('Schedule urgent stay interview with HR Lead & Department Head immediately.');
      actions.push('Perform salary benchmarking and expedite compensation benchmarking/equity refresh.');
      actions.push('Enforce standard flexible work arrangements, cap overtime, and offer immediate remote options.');
    } else if (finalAdjustedProb >= 40) {
      actions.push('Conduct standard career development conversation and outline a clear promotion trajectory.');
      actions.push('Evaluate overtime hours and workload distribution with department manager.');
      actions.push('Establish a mentorship partner and schedule a 90-day progress/wellness check-in.');
    } else {
      actions.push('No immediate actions required — continue regular check-ins and performance tracking.');
      actions.push('Maintain standard feedback loops and ongoing professional development paths.');
    }
    setHrActions(actions);

  }, [
    modelRisk,
    maritalStatus,
    businessTravel,
    distanceFromHome,
    jobInvolvement,
    relationshipSatisfaction,
    numCompaniesWorked,
    trainingTimesLastYear,
    worksOvertime,
    jobSatisfaction,
    workLifeBalance,
    environmentSatisfaction,
    yearsSinceLastPromotion,
    monthlyIncome,
    stockOptionLevel,
    yearsAtCompany
  ]);

  // Determine risk categorization label and styles
  const getRiskDetails = () => {
    if (attritionRisk >= 70) {
      return { label: 'HIGH RISK', colorClass: 'text-rose-600 bg-rose-50 border-rose-100', textCol: 'text-rose-600', fillCol: 'bg-rose-500' };
    }
    if (attritionRisk >= 40) {
      return { label: 'MEDIUM RISK', colorClass: 'text-amber-600 bg-amber-50 border-amber-100', textCol: 'text-amber-500', fillCol: 'bg-amber-500' };
    }
    return { label: 'LOW RISK', colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-100', textCol: 'text-emerald-600', fillCol: 'bg-emerald-500' };
  };

  const riskDetails = getRiskDetails();

  return (
    <div className="flex flex-col gap-6" id="scenario-analyser-root">
      
      {/* 1. Styled Header Banner matching the mockup */}
      <div className="bg-indigo-750 text-white rounded-xl p-6 shadow-sm border border-indigo-900" style={{ backgroundColor: '#3b4cb4' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              👤 Employee Attrition Scenario Analyser
            </h1>
            <p className="text-xs text-indigo-100/90 mt-1">
              Interactive what-if simulator &middot; Dr Harry Patria &middot; Patria & Co.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-850/70 backdrop-blur-xs px-3.5 py-1.5 rounded-lg border border-indigo-100/10 self-start sm:self-auto text-xs">
            <Sliders className="w-4 h-4 text-indigo-200" />
            <span className="font-semibold text-indigo-100">
              {activeModelName === 'GradientBoostingClassifier' 
                ? '🔮 Engine: GradientBoostingClassifier' 
                : '📈 Engine: Logistic Regression (Baseline)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Simulation Grid (Two Column layout matching the mockup) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: PERSONAL & JOB PROFILE */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col gap-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold uppercase text-indigo-900 tracking-wider">
              🏛️ PERSONAL & JOB PROFILE
            </h2>
          </div>

          <div className="flex flex-col gap-5">
            {/* Age */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Age</span>
                <span className="font-bold font-mono">{age} <span className="text-slate-400 font-normal">years</span></span>
              </div>
              <input
                type="range"
                min="18"
                max="60"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
              />
            </div>

            {/* Monthly Income */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Monthly Income</span>
                <span className="font-bold font-mono">$ <span className="text-lg tracking-tight">{monthlyIncome.toLocaleString()}</span></span>
              </div>
              <input
                type="range"
                min="1000"
                max="20000"
                step="100"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
              />
            </div>

            {/* Job Satisfaction */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Job Satisfaction</span>
                <span className="font-bold font-mono">{jobSatisfaction} <span className="text-slate-400 font-normal">/ 4</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={jobSatisfaction}
                onChange={(e) => setJobSatisfaction(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
              />
            </div>

            {/* Work-Life Balance */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Work-Life Balance</span>
                <span className="font-bold font-mono">{workLifeBalance} <span className="text-slate-400 font-normal">/ 4</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={workLifeBalance}
                onChange={(e) => setWorkLifeBalance(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
              />
            </div>

            {/* Environment Satisfaction */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Environment Satisfaction</span>
                <span className="font-bold font-mono">{environmentSatisfaction} <span className="text-slate-400 font-normal">/ 4</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={environmentSatisfaction}
                onChange={(e) => setEnvironmentSatisfaction(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
              />
            </div>

            {/* Distance from Home */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Distance from Home</span>
                <span className="font-bold font-mono">{distanceFromHome} <span className="text-slate-400 font-normal">km</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={distanceFromHome}
                onChange={(e) => setDistanceFromHome(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
              />
            </div>

            {/* Years at Company */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Years at Company</span>
                <span className="font-bold font-mono">{yearsAtCompany}</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={yearsAtCompany}
                onChange={(e) => setYearsAtCompany(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
              />
            </div>

            {/* Years Since Last Promotion */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Years Since Last Promotion</span>
                <span className="font-bold font-mono">{yearsSinceLastPromotion}</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={yearsSinceLastPromotion}
                onChange={(e) => setYearsSinceLastPromotion(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
              />
            </div>

            {/* Stock Option Level */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Stock Option Level</span>
                <span className="font-bold font-mono">{stockOptionLevel}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                value={stockOptionLevel}
                onChange={(e) => setStockOptionLevel(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WORK CONTEXT */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col gap-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold uppercase text-indigo-900 tracking-wider">
              📅 WORK CONTEXT
            </h2>
          </div>

          <div className="flex flex-col gap-5">
            {/* Marital Status Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Marital Status</label>
              <select
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>

            {/* Business Travel Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Business Travel</label>
              <select
                value={businessTravel}
                onChange={(e) => setBusinessTravel(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
              >
                <option value="Travel Rarely">Travel Rarely</option>
                <option value="Travel Frequently">Travel Frequently</option>
                <option value="Non-Travel">Non-Travel</option>
              </select>
            </div>

            {/* Department Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
              >
                <option value="Engineering">R&D (Engineering)</option>
                <option value="Sales">Sales</option>
                <option value="HR">Human Resources</option>
                <option value="Marketing">Marketing</option>
                <option value="Product">Product</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            {/* Job Role Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Job Role</label>
              <select
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
              >
                {(ROLES_BY_DEPT[department] || []).map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Works Overtime Switch */}
            <div className="flex items-center justify-between py-2 border-y border-slate-100">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  ⚡ Works Overtime?
                </span>
                <span className="text-[10px] text-slate-400">Regularly works beyond standard weekly hours</span>
              </div>
              <button
                type="button"
                onClick={() => setWorksOvertime(!worksOvertime)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  worksOvertime ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
                role="switch"
                aria-checked={worksOvertime}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    worksOvertime ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Job Involvement */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Job Involvement</span>
                <span className="font-bold font-mono">{jobInvolvement} <span className="text-slate-400 font-normal">/ 4</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={jobInvolvement}
                onChange={(e) => setJobInvolvement(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
              />
            </div>

            {/* Number of Companies Worked */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Number of Companies Worked</span>
                <span className="font-bold font-mono">{numCompaniesWorked}</span>
              </div>
              <input
                type="range"
                min="0"
                max="9"
                step="1"
                value={numCompaniesWorked}
                onChange={(e) => setNumCompaniesWorked(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
              />
            </div>

            {/* Training Times Last Year */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Training Times Last Year</span>
                <span className="font-bold font-mono">{trainingTimesLastYear}</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="1"
                value={trainingTimesLastYear}
                onChange={(e) => setTrainingTimesLastYear(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
              />
            </div>

            {/* Relationship Satisfaction */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Relationship Satisfaction</span>
                <span className="font-bold font-mono">{relationshipSatisfaction} <span className="text-slate-400 font-normal">/ 4</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={relationshipSatisfaction}
                onChange={(e) => setRelationshipSatisfaction(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

      </div>

      {/* 3. BOTTOM PANEL: RESULTS & ANALYSIS (Gauge, Risk factors, Protective factors, Actions) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-8" id="analysis-hub-root">
        
        {/* ROW 1: MODEL EXPLANATION HUB (Gauge + SHAP Bar Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT COLUMN: SEMICIRCULAR SVG GAUGE (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between p-6 bg-slate-50 rounded-xl border border-slate-150 relative overflow-hidden text-center min-h-[300px]">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200/60 mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                🔮 Live Predictive Gauge
              </span>
              <span className="flex items-center gap-1.5 text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-100 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                {preprocessorActive ? 'Preprocessor Active' : 'Baseline Active'}
              </span>
            </div>

            {/* Semicircular SVG Gauge Container */}
            <div className="relative w-full max-w-[220px] flex justify-center mt-3">
              <svg viewBox="0 0 120 64" className="w-full h-auto overflow-visible">
                {/* Background arc track */}
                <path 
                  d="M 15 55 A 45 45 0 0 1 105 55" 
                  fill="none" 
                  stroke="#e2e8f0" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                />

                {/* Segment 1: Low Risk Arc (0% - 40%) - Green */}
                <path 
                  d="M 15 55 A 45 45 0 0 1 46.1 12.2" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="8" 
                  strokeLinecap="square"
                />

                {/* Segment 2: Medium Risk Arc (40% - 70%) - Orange/Amber */}
                <path 
                  d="M 46.1 12.2 A 45 45 0 0 1 86.5 18.6" 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="8" 
                  strokeLinecap="square"
                />

                {/* Segment 3: High Risk Arc (70% - 100%) - Red/Rose */}
                <path 
                  d="M 86.5 18.6 A 45 45 0 0 1 105 55" 
                  fill="none" 
                  stroke="#f43f5e" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                />

                {/* Milestone threshold ticks */}
                {/* 40% threshold marker */}
                <line x1="46.1" y1="12.2" x2="44.5" y2="7.5" stroke="#475569" strokeWidth="1.5" />
                {/* 70% threshold marker */}
                <line x1="86.5" y1="18.6" x2="89.4" y2="14.5" stroke="#475569" strokeWidth="1.5" />

                {/* Needle path pointing to attritionRisk angle with smooth spring motion */}
                <motion.line 
                  x1="60" 
                  y1="55" 
                  animate={{
                    x2: 60 + 36 * Math.cos(((180 + Math.min(100, Math.max(0, attritionRisk)) * 1.8) * Math.PI) / 180),
                    y2: 55 + 36 * Math.sin(((180 + Math.min(100, Math.max(0, attritionRisk)) * 1.8) * Math.PI) / 180)
                  }}
                  transition={{ type: "spring", stiffness: 70, damping: 14 }}
                  stroke="#1e293b" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />

                {/* Needle center hub */}
                <circle cx="60" cy="55" r="4.5" fill="#1e293b" />
                <circle cx="60" cy="55" r="1.5" fill="#ffffff" />
              </svg>

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50/70 rounded-lg">
                  <div className="w-6 h-6 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                </div>
              )}
            </div>

            {/* Float-over real probability indicator (now positioned cleanly below to prevent overlap) */}
            <div className="text-center mt-1 z-10">
              <span className="text-4xl font-black font-mono tracking-tight text-slate-800 leading-none">
                {Math.round(attritionRisk)}%
              </span>
              <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono mt-1">Probability</span>
            </div>

            {/* Threshold Milestones Labels underneath */}
            <div className="w-full grid grid-cols-3 text-[9px] font-bold text-slate-400 font-mono mt-4 pt-3 border-t border-slate-200/50">
              <div className="text-left">
                <span className="block text-emerald-600">LOW</span>
                <span>&lt; 40%</span>
              </div>
              <div className="text-center">
                <span className="block text-amber-600">MEDIUM</span>
                <span>40% - 70%</span>
              </div>
              <div className="text-right">
                <span className="block text-rose-600">HIGH</span>
                <span>&gt; 70%</span>
              </div>
            </div>

            {/* Status and Badge */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full border font-mono ${riskDetails.colorClass}`}>
                {riskDetails.label}
              </span>
              <p className="text-[10px] text-slate-400 font-sans max-w-[240px]">
                {attritionRisk < 40 
                  ? "Predictive parameters reflect solid retention indicators. Monitor standard indicators." 
                  : attritionRisk < 70 
                    ? "Warning: Attrition indicators starting to surface. Early-stage check-ins recommended." 
                    : "Action Required: High risk. Deploy active retention protocols immediately."}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: SHAP EXPLANATION (Top 5 Forces) (col-span-7) */}
          <div className="lg:col-span-7 flex flex-col justify-between p-6 bg-slate-50 rounded-xl border border-slate-150 min-h-[300px]">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                📊 Model Explanation Hub: Top 5 SHAP Values
              </span>
              <span className="text-[9px] font-bold text-slate-400 font-mono">
                Scales Relative to Max Factor Impact
              </span>
            </div>

            {/* If there are no SHAP values, render placeholder */}
            {(!shapValues || shapValues.length === 0) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <p className="text-xs text-slate-400 italic">No mathematical SHAP forces recorded yet.</p>
                <p className="text-[10px] text-slate-400 max-w-xs mt-1">Adjust personal profiles or job parameters to trigger prediction explanation pipeline.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center gap-4.5">
                {/* SHAP Chart Rows */}
                {[...shapValues]
                  .sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue))
                  .slice(0, 5)
                  .map((sv, idx) => {
                    const impact = sv.shapValue || 0;
                    const absImpact = Math.abs(impact);
                    // Find max abs impact in top 5 for local scaling
                    const maxLocal = Math.max(...[...shapValues]
                      .sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue))
                      .slice(0, 5)
                      .map(s => Math.abs(s.shapValue || 0)), 0.05);
                    const widthPercent = Math.min(100, Math.round((absImpact / maxLocal) * 100));
                    const isPositive = impact >= 0;

                    return (
                      <div key={idx} className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-slate-150/60 shadow-2xs hover:border-slate-300 transition-all">
                        {/* Left Label: Feature and actual simulator value */}
                        <div className="flex flex-col sm:w-[170px] shrink-0">
                          <span className="text-xs font-bold text-slate-700 truncate">
                            {sv.displayName || sv.feature}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            Value: <span className="font-semibold text-slate-600 font-mono">{String(sv.value)}</span>
                          </span>
                        </div>

                        {/* Right: The dual-sided Horizontal Bar */}
                        <div className="flex-1 flex items-center relative h-6 bg-slate-100/50 rounded overflow-hidden px-1 border border-slate-200/30">
                          {/* Centered baseline indicator line */}
                          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300/80 z-10" />

                          {isPositive ? (
                            // Positive Impact: right of baseline (colored Rose)
                            <div className="absolute left-1/2 right-1 flex items-center pl-1 h-full">
                              <div 
                                className="h-3.5 bg-rose-500 rounded-r border-r border-rose-600 shadow-xs transition-all duration-300"
                                style={{ width: `${widthPercent / 2}%` }}
                              />
                              <span className="text-[9px] font-bold text-rose-600 ml-1.5 font-mono">
                                +{absImpact.toFixed(3)}
                              </span>
                            </div>
                          ) : (
                            // Negative Impact: left of baseline (colored Emerald)
                            <div className="absolute right-1/2 left-1 flex items-center justify-end pr-1 h-full">
                              <span className="text-[9px] font-bold text-emerald-600 mr-1.5 font-mono">
                                -{absImpact.toFixed(3)}
                              </span>
                              <div 
                                className="h-3.5 bg-emerald-500 rounded-l border-l border-emerald-600 shadow-xs transition-all duration-300"
                                style={{ width: `${widthPercent / 2}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Optional Tooltip narrative explanation on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg max-w-[240px] z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal leading-normal border border-slate-800">
                          <p className="font-bold mb-0.5 text-indigo-300">{sv.displayName || sv.feature}</p>
                          <p className="text-slate-300">{sv.description || `Shows that this parameter ${isPositive ? 'increases' : 'decreases'} organizational attrition risk.`}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

        </div>

        {/* ROW 2: DETAILED CONTRIBUTING FACTOR CLASSIFICATIONS (Risk vs Protective Factors) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* RISK FACTORS CARD */}
          <div className="p-5 border border-slate-200 bg-rose-50/25 rounded-xl flex flex-col gap-3 min-h-[160px]">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span className="text-slate-800">▲ Attrition Risk Factors</span>
            </h3>
            <div className="overflow-y-auto max-h-[160px] flex-1">
              {riskFactors.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No adverse risk parameters detected in current scenario configuration.</p>
              ) : (
                <ul className="text-xs text-slate-600 space-y-2 list-none pl-0">
                  {riskFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-rose-500 font-bold shrink-0">&bull;</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* PROTECTIVE FACTORS CARD */}
          <div className="p-5 border border-slate-200 bg-emerald-50/25 rounded-xl flex flex-col gap-3 min-h-[160px]">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-slate-800">▼ Attrition Shield Factors</span>
            </h3>
            <div className="overflow-y-auto max-h-[160px] flex-1">
              {protectiveFactors.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No shielding factors detected in current scenario configuration.</p>
              ) : (
                <ul className="text-xs text-slate-600 space-y-2 list-none pl-0">
                  {protectiveFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-emerald-500 font-bold shrink-0">&bull;</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>

        {/* ROW 3: SUGGESTED ACTIONS BOX */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-9 h-9 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
              📋 Prescriptive HR Remediation Actions
            </h4>
            <p className="text-[11px] text-slate-500 mb-1.5">
              Based on the simulated attrition metrics above, the ML pipeline recommends the following high-impact organizational interventions:
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pl-0 list-none">
              {hrActions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-indigo-500 font-extrabold shrink-0 font-mono">{idx + 1}.</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}
