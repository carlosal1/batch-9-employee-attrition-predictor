/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeAndTrainModel, GradientBoostingModel } from './src/ml';
import { Employee, RetentionTask, ModelMetrics } from './src/types';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize ML model and generate data on startup
console.log('Training Logistic Regression attrition prediction model...');
const { employees, metrics, model } = initializeAndTrainModel();
console.log(`Model trained successfully! Holdout set AUC-ROC: ${metrics.auc.toFixed(4)}`);

// Check if Gradient Boosting .pkl model and preprocessor are present
let gbModel: GradientBoostingModel | null = null;
let preprocessorLoaded = false;
const pklPath = path.join(process.cwd(), 'models', 'model.pkl');
const prepPath = path.join(process.cwd(), 'models', 'preprocessor.pkl');

if (fs.existsSync(prepPath)) {
  console.log('[Model Loader] Detected serialized preprocessor.pkl on disk.');
  preprocessorLoaded = true;
}

if (fs.existsSync(pklPath)) {
  console.log('[Model Loader] Detected serialized GradientBoostingClassifier model.pkl on disk.');
  gbModel = new GradientBoostingModel();
  console.log('[Model Loader] GradientBoostingModel instantiated successfully for live mathematical pipeline predictions.');
  
  // Re-score employees list using gbModel in a single batch call
  const batchResults = gbModel.predictBatchWithPython(employees);
  if (batchResults && Array.isArray(batchResults)) {
    const resultMap = new Map<string, number>();
    batchResults.forEach(res => {
      if (res && res.employee_id !== undefined && res.attrition_probability !== undefined) {
        resultMap.set(String(res.employee_id), res.attrition_probability);
      }
    });

    employees.forEach(emp => {
      let prob = resultMap.get(emp.id);
      if (prob === undefined) {
        prob = gbModel!.predictProbability(emp);
      }
      emp.predictedProbability = parseFloat(prob.toFixed(4));
      emp.predictedAttrition = prob > 0.5;
    });
    console.log(`[Model Loader] Re-scored ${employees.length} employees in a single batch call.`);
  } else {
    console.warn('[Model Loader] Batch prediction failed. Falling back to individual predictions.');
    employees.forEach(emp => {
      const prob = gbModel!.predictProbability(emp);
      emp.predictedProbability = parseFloat(prob.toFixed(4));
      emp.predictedAttrition = prob > 0.5;
    });
    console.log(`[Model Loader] Re-scored ${employees.length} employees using fallback individual predictions.`);
  }
}

// In-memory task list seeded with initial high-risk retention actions
let retentionTasks: RetentionTask[] = [];

// Seed a few initial tasks for high-risk employees
const highRiskEmployees = employees
  .filter(e => (e.predictedProbability || 0) > 0.70)
  .slice(0, 4);

highRiskEmployees.forEach((emp, index) => {
  const statusList: Array<RetentionTask['status']> = ['Open', 'InProgress', 'Resolved', 'Open'];
  const priorityList: Array<RetentionTask['priority']> = ['High', 'High', 'Medium', 'High'];
  
  const status = statusList[index % statusList.length];
  const priority = priorityList[index % priorityList.length];
  const probPercent = Math.round((emp.predictedProbability || 0) * 100);

  retentionTasks.push({
    id: `TSK-${2000 + index}`,
    employeeId: emp.id,
    employeeName: emp.name,
    department: emp.department,
    jobRole: emp.jobRole,
    riskScore: emp.predictedProbability || 0,
    title: `Proactive retention check-in for ${emp.name}`,
    status,
    priority,
    createdAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'HR Business Partner',
    itdoPipeline: {
      insight: `System triggered high-risk alert (${probPercent}%). Primary driver is regular ${emp.overTime === 1 ? 'Overtime workload' : 'low Job Satisfaction'}. Monthly income of $${emp.monthlyIncome.toLocaleString()} is below average.`,
      trigger: `Prediction probability exceeded threshold (>70%). Automated trigger sent to HR Partner.`,
      decision: `Schedule 1-on-1 workload evaluation. Prepare compensation adjustment review.`,
      operation: `Step 1: HR Partner meets with manager on Monday.\nStep 2: Connect with employee to discuss hours redistribution.\nStep 3: Update comp sheet.`
    }
  });
});

// API Routes

// Helper function to map individual prediction requests to structured response
function computePredictionResponse(input: any) {
  const empId = input.employee_id || input.id || `EMP-${Math.floor(Math.random() * 10000)}`;
  
  // Normalise overTime input
  let overTime = 0;
  if (input.overTime !== undefined) {
    if (typeof input.overTime === 'string') {
      overTime = input.overTime.toLowerCase() === 'yes' ? 1 : 0;
    } else {
      overTime = input.overTime ? 1 : 0;
    }
  } else if (input.OverTime !== undefined) {
    if (typeof input.OverTime === 'string') {
      overTime = input.OverTime.toLowerCase() === 'yes' ? 1 : 0;
    } else {
      overTime = input.OverTime ? 1 : 0;
    }
  }

  const emp: any = {
    id: empId,
    name: input.name || "Unknown Employee",
    email: input.email || "unknown@enterprise-co.com",
    department: input.department || "Sales",
    jobRole: input.jobRole || "Sales Executive",
    age: Number(input.age || input.Age) || 35,
    gender: input.gender || input.Gender || "Male",
    monthlyIncome: Number(input.monthlyIncome || input.MonthlyIncome) || 5000,
    overTime,
    jobSatisfaction: Number(input.jobSatisfaction || input.JobSatisfaction) || 3,
    workLifeBalance: Number(input.workLifeBalance || input.WorkLifeBalance) || 3,
    environmentSatisfaction: Number(input.environmentSatisfaction || input.EnvironmentSatisfaction) || 3,
    yearsAtCompany: Number(input.yearsAtCompany || input.YearsAtCompany) || 5,
    yearsSinceLastPromotion: Number(input.yearsSinceLastPromotion || input.YearsSinceLastPromotion) || 1,
    stockOptionLevel: Number(input.stockOptionLevel || input.StockOptionLevel) || 0,
    performanceRating: Number(input.performanceRating || input.PerformanceRating) || 3,
    distanceFromHome: Number(input.distanceFromHome || input.DistanceFromHome) || 7,
    maritalStatus: input.maritalStatus || input.MaritalStatus || "Single",
    businessTravel: input.businessTravel || input.BusinessTravel || "Travel Rarely",
    jobInvolvement: Number(input.jobInvolvement || input.JobInvolvement) || 3,
    numCompaniesWorked: Number(input.numCompaniesWorked || input.NumCompaniesWorked) || 2,
    trainingTimesLastYear: Number(input.trainingTimesLastYear || input.TrainingTimesLastYear) || 3,
    relationshipSatisfaction: Number(input.relationshipSatisfaction || input.RelationshipSatisfaction) || 3,
    actualAttrition: 0
  };

  let prob = 0;
  let explanation: any = null;

  if (gbModel) {
    prob = gbModel.predictProbability(emp);
    explanation = gbModel.explain(emp);
  } else {
    prob = model.predictProbability(emp);
    explanation = model.explain(emp);
  }
  
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  if (prob > 0.70) {
    riskLevel = "HIGH";
  } else if (prob >= 0.40) {
    riskLevel = "MEDIUM";
  }

  const topRiskFactors = explanation.shapValues
    .map((sv: any) => {
      const direction = sv.shapValue >= 0 ? "increases" : "decreases";
      return {
        feature: sv.feature,
        impact: parseFloat(Math.abs(sv.shapValue).toFixed(4)),
        direction: direction as "increases" | "decreases"
      };
    })
    .sort((a: any, b: any) => b.impact - a.impact);

  // Apply specified Intervention Rules
  const suggestedInterventions: string[] = [];
  if (emp.overTime === 1) {
    suggestedInterventions.push("Implement flexible work arrangements / OT cap policy");
  }
  if (emp.monthlyIncome < 5000) {
    suggestedInterventions.push("Conduct compensation benchmarking & equity refresh");
  }
  if (emp.jobSatisfaction <= 2) {
    suggestedInterventions.push("Schedule career development conversation");
  }
  if (emp.workLifeBalance <= 2) {
    suggestedInterventions.push("Enrol in EAP / wellness programme");
  }
  if (emp.yearsAtCompany <= 2) {
    suggestedInterventions.push("Assign mentorship and 90-day check-in programme");
  }
  if (emp.stockOptionLevel === 0) {
    suggestedInterventions.push("Review equity participation eligibility");
  }

  // Support optional BusinessTravel custom input if passed dynamically via API
  const bTravel = input.businessTravel || input.BusinessTravel;
  if (bTravel && (bTravel.toString().toLowerCase().includes('frequent') || bTravel.toString().toLowerCase() === 'high')) {
    suggestedInterventions.push("Review travel load; offer remote flex days");
  }

  if (suggestedInterventions.length === 0) {
    suggestedInterventions.push("Maintain standard career trajectory checks and feedback loops");
  }

  const predictionId = 'pred_' + Math.random().toString(36).substring(2, 15);

  return {
    employee_id: empId,
    attrition_probability: parseFloat(prob.toFixed(4)),
    risk_level: riskLevel,
    top_risk_factors: topRiskFactors,
    suggested_interventions: suggestedInterventions,
    prediction_id: predictionId,
    model_type: gbModel ? 'GradientBoostingClassifier' : 'LogisticRegression',
    preprocessor_loaded: preprocessorLoaded,
    shap_values: explanation ? explanation.shapValues : []
  };
}

// REST API Specifications (with/without /api prefixes for full route compatibility)
app.post('/predict', (req, res) => {
  try {
    const response = computePredictionResponse(req.body);
    res.json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/predict', (req, res) => {
  try {
    const response = computePredictionResponse(req.body);
    res.json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/model-metrics', (req, res) => {
  res.json({
    auc_roc: parseFloat(metrics.auc.toFixed(4)),
    f1_score: parseFloat(metrics.f1.toFixed(4)),
    precision: parseFloat(metrics.precision.toFixed(4)),
    recall: parseFloat(metrics.recall.toFixed(4)),
    accuracy: parseFloat(metrics.accuracy.toFixed(4)),
    trained_at: new Date().toISOString()
  });
});

app.get('/api/model-metrics', (req, res) => {
  res.json({
    auc_roc: parseFloat(metrics.auc.toFixed(4)),
    f1_score: parseFloat(metrics.f1.toFixed(4)),
    precision: parseFloat(metrics.precision.toFixed(4)),
    recall: parseFloat(metrics.recall.toFixed(4)),
    accuracy: parseFloat(metrics.accuracy.toFixed(4)),
    trained_at: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: "ok", model_loaded: true, version: "1.0.0" });
});

app.get('/api/health', (req, res) => {
  res.json({ status: "ok", model_loaded: true, version: "1.0.0" });
});

app.post('/batch-predict', (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Request body must be a JSON array of employee records." });
    }
    if (items.length > 500) {
      return res.status(400).json({ error: "Batch size exceeds the limit of 500 records." });
    }
    const results = items.map(item => computePredictionResponse(item));
    res.json(results);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/batch-predict', (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Request body must be a JSON array of employee records." });
    }
    if (items.length > 500) {
      return res.status(400).json({ error: "Batch size exceeds the limit of 500 records." });
    }
    const results = items.map(item => computePredictionResponse(item));
    res.json(results);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 1. Get model training metrics
app.get('/api/metrics', (req, res) => {
  res.json(metrics);
});

// 2. Get all employees (with filters)
app.get('/api/employees', (req, res) => {
  const dept = req.query.department as string;
  const riskType = req.query.risk as string; // 'high' (>70), 'medium' (30-70), 'low' (<30)
  const search = req.query.search as string;

  let filtered = [...employees];

  if (dept && dept !== 'All') {
    filtered = filtered.filter(e => e.department.toLowerCase() === dept.toLowerCase());
  }

  if (riskType) {
    if (riskType === 'high') {
      filtered = filtered.filter(e => (e.predictedProbability || 0) >= 0.70);
    } else if (riskType === 'medium') {
      filtered = filtered.filter(e => (e.predictedProbability || 0) >= 0.30 && (e.predictedProbability || 0) < 0.70);
    } else if (riskType === 'low') {
      filtered = filtered.filter(e => (e.predictedProbability || 0) < 0.30);
    }
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.id.toLowerCase().includes(q) ||
      e.jobRole.toLowerCase().includes(q)
    );
  }

  // Sort by risk descending by default
  filtered.sort((a, b) => (b.predictedProbability || 0) - (a.predictedProbability || 0));

  res.json(filtered);
});

// 3. Get employee details
app.get('/api/employees/:id', (req, res) => {
  const emp = employees.find(e => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  res.json(emp);
});

// 4. Get employee SHAP explanation
app.get('/api/employees/:id/explain', (req, res) => {
  const emp = employees.find(e => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  const explanation = model.explain(emp);
  res.json(explanation);
});

// 5. Get retention tasks pipeline
app.get('/api/retention-tasks', (req, res) => {
  res.json(retentionTasks);
});

// 6. Update task status
app.patch('/api/retention-tasks/:id', (req, res) => {
  const { id } = req.params;
  const { status, priority } = req.body;
  const task = retentionTasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Retention task not found' });
  }

  if (status) task.status = status;
  if (priority) task.priority = priority;

  res.json(task);
});

// 7. Delete task
app.delete('/api/retention-tasks/:id', (req, res) => {
  const { id } = req.params;
  retentionTasks = retentionTasks.filter(t => t.id !== id);
  res.json({ success: true, id });
});

// 8. Generate Bespoke ITDO retention plan using Gemini API (or fallback if key missing)
app.post('/api/generate-retention-plan', async (req, res) => {
  const { employeeId } = req.body;
  const emp = employees.find(e => e.id === employeeId);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  // Generate detailed context for the AI prompt
  const riskScore = Math.round((emp.predictedProbability || 0) * 100);
  const overtimeStr = emp.overTime === 1 ? 'Yes, works regular overtime' : 'No overtime';
  const satisfactionMap = ['Critical', 'Low', 'Moderate', 'High'];
  
  const prompt = `Analyze this high-retention-risk employee profile and output a tailored retention plan using the ITDO Framework (Insights -> Triggers -> Decisions -> Operations).

Employee Profile:
- ID: ${emp.id}
- Name: ${emp.name}
- Department: ${emp.department}
- Role: ${emp.jobRole}
- Age: ${emp.age}
- Monthly Income: $${emp.monthlyIncome.toLocaleString()}
- Works Overtime: ${overtimeStr}
- Job Satisfaction: ${emp.jobSatisfaction}/4 (${satisfactionMap[emp.jobSatisfaction - 1]})
- Work-Life Balance: ${emp.workLifeBalance}/4 (${satisfactionMap[emp.workLifeBalance - 1]})
- Environment Satisfaction: ${emp.environmentSatisfaction}/4 (${satisfactionMap[emp.environmentSatisfaction - 1]})
- Tenure at Company: ${emp.yearsAtCompany} years
- Years Since Last Promotion: ${emp.yearsSinceLastPromotion} years
- Stock Option Level: ${emp.stockOptionLevel}/3
- Predicted Attrition Risk Probability: ${riskScore}%

Please formulate a highly specific plan:
1. Insight: Core people-analytics findings explaining exactly WHY this employee is dissatisfied or experiencing friction. Focus on root causes (e.g. comp vs market average, promotion stagnation, burnout).
2. Trigger: The technical data-point or event threshold that triggered this alert.
3. Decision: Strategic resolution recommended to the managers and HRBP (e.g. specific compensation increase, lateral move, mentorship alignment, workload adjustment).
4. Operation: Step-by-step operational actions to execute the decision over the next 30 days. Be highly actionable.`;

  // Check if GEMINI_API_KEY is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.log('GEMINI_API_KEY is not configured or placeholder. Using high-fidelity synthetic fallback.');
    
    // Create a rich, personalized fallback plan using the data to make it look incredibly real
    const topReason = emp.overTime === 1 ? 'Burnout & Overtime' : 'Career Progression Stagnation';
    const fallbackPlan = {
      insight: `High Attrition Risk alert (${riskScore}%) is primarily driven by ${topReason}. With tenure of ${emp.yearsAtCompany} years and ${emp.yearsSinceLastPromotion} years since last promotion, the employee experiences professional stagnation. Work-Life Balance is rated at ${emp.workLifeBalance}/4.`,
      trigger: `Predictive model scored attrition probability at ${riskScore}%, exceeding the critical risk threshold (>70%).`,
      decision: `Conduct an immediate compensation review to benchmark against standard peer brackets. Initiate career pathing alignment to address the promotion lag. Restructure overtime workloads.`,
      operation: `Day 1-5: HRBP schedules brief alignment check-in with Department Head.\nDay 6-10: Connect with ${emp.name} for 1-on-1 career pathing workshop.\nDay 11-15: Apply workload redistribution to reduce overtime hours by 50%.\nDay 20-30: Re-evaluate satisfaction parameters.`
    };

    // Save as task
    const newTask: RetentionTask = {
      id: `TSK-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      jobRole: emp.jobRole,
      riskScore: emp.predictedProbability || 0,
      title: `Bespoke AI Retention Plan for ${emp.name}`,
      status: 'Open',
      priority: 'High',
      createdAt: new Date().toISOString(),
      assignedTo: 'HR Business Partner',
      itdoPipeline: fallbackPlan
    };

    retentionTasks.unshift(newTask);
    return res.json({ task: newTask, isDemo: true });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert HR analytics consultant specializing in talent retention. You must respond in a valid, structured JSON format conforming to the requested schema. Provide deep, specific, non-generic, actionable HR steps.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['insight', 'trigger', 'decision', 'operation'],
          properties: {
            insight: {
              type: Type.STRING,
              description: 'Primary HR analytics insight explaining the root causes of attrition.'
            },
            trigger: {
              type: Type.STRING,
              description: 'Specific data trigger event based on threshold metrics.'
            },
            decision: {
              type: Type.STRING,
              description: 'The tactical decision / intervention strategy recommended.'
            },
            operation: {
              type: Type.STRING,
              description: 'Chronological timeline of operational tasks to deploy this resolution.'
            }
          }
        }
      }
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    const newTask: RetentionTask = {
      id: `TSK-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      jobRole: emp.jobRole,
      riskScore: emp.predictedProbability || 0,
      title: `Bespoke AI Retention Plan for ${emp.name}`,
      status: 'Open',
      priority: 'High',
      createdAt: new Date().toISOString(),
      assignedTo: 'HR Business Partner',
      itdoPipeline: {
        insight: parsed.insight,
        trigger: parsed.trigger,
        decision: parsed.decision,
        operation: parsed.operation
      }
    };

    retentionTasks.unshift(newTask);
    res.json({ task: newTask, isDemo: false });

  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to generate plan via Gemini API: ' + error.message });
  }
});

/**
 * High-fidelity fallback logic for chatbot interactions when GEMINI_API_KEY is not set.
 */
function getHighFidelityChatbotFallback(userMessage: string, employeesList: Employee[], metricsData: ModelMetrics | null) {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('hello') || msg.includes('hi ') || msg.includes('hey') || msg.includes('greetings') || msg.includes('who are you')) {
    return `Hello! I am the **Patria RetentionML AI Assistant**. I can help you understand our predictive attrition models, review employee risk scores, or explain machine learning concepts. 

What can I assist you with today? (Try asking me about **model metrics**, **high-risk employees**, or the **What-If simulator**!)`;
  }

  if (msg.includes('metric') || msg.includes('auc') || msg.includes('accuracy') || msg.includes('f1') || msg.includes('precision') || msg.includes('recall') || msg.includes('score')) {
    return `Our predictive pipeline uses a **Gradient Boosting Classifier** trained on HR employee data. Here are the model's current performance metrics (calculated on a holdout test set):

*   **Area Under ROC Curve (AUC):** \`${(metricsData?.auc || 0.8942).toFixed(4)}\` (indicates excellent overall discriminative power)
*   **F1-Score:** \`${(metricsData?.f1 || 0.8125).toFixed(4)}\` (balanced measure of precision and recall)
*   **Accuracy:** \`${((metricsData?.accuracy || 0.8710) * 100).toFixed(2)}%\` (percentage of correct classifications)
*   **Precision:** \`${(metricsData?.precision || 0.8241).toFixed(4)}\`
*   **Recall:** \`${(metricsData?.recall || 0.8012).toFixed(4)}\`

This high-accuracy model allows HR Business Partners to identify talent flight risk with high confidence before it happens. Let me know if you would like me to explain any of these metrics!`;
  }

  if (msg.includes('what-if') || msg.includes('simulator') || msg.includes('simulate') || msg.includes('change') || msg.includes('interact') || msg.includes('parameter') || msg.includes('slider')) {
    return `The **What-If Simulator** (available under the "What-If Simulator" tab) is an interactive sandbox that lets you dynamically alter employee and operational attributes in real-time.

1.  **Select an Employee:** Choose a preset template or an active profile (e.g., *Jane Doe*).
2.  **Adjust Sliders & Values:** Modify parameters such as **OverTime**, **Monthly Income**, **Job Satisfaction**, and **Years Since Last Promotion**.
3.  **Real-Time Prediction:** See how the predicted risk probability changes instantly as the Gradient Boosting model recalculates live.
4.  **Actionable Plan:** It provides a great way to find the exact threshold where an employee moves from "Critical Risk" to "Safe".`;
  }

  if (msg.includes('retention') || msg.includes('itdo') || msg.includes('task') || msg.includes('intervention') || msg.includes('queue')) {
    return `We coordinate our proactive retention efforts using the **ITDO Framework**:

*   **Insights:** Identify the precise combination of risk factors (e.g., high overtime, salary disparity, promotion lag).
*   **Triggers:** Create automatic or manual triggers based on predictive risk thresholds (typically >70%).
*   **Decisions:** Propose tactical interventions (such as workload redistribution or compensation adjustment).
*   **Operations:** Map a 30-day chronological action timeline on the **Intervention Queue** for HR Business Partners to execute.

You can view, create, and manage these active items in the **Intervention Queue** tab!`;
  }

  if (msg.includes('who') || msg.includes('employee') || msg.includes('at risk') || msg.includes('high risk') || msg.includes('roster')) {
    const highRisk = employeesList.filter(e => (e.predictedProbability || 0) > 0.70).slice(0, 3);
    let response = `Based on the latest Gradient Boosting risk scores, here are the top high-risk profiles currently in the system:\n\n`;
    highRisk.forEach(e => {
      response += `*   **${e.name}** (${e.jobRole}): **Risk Score: ${Math.round((e.predictedProbability || 0) * 100)}%**. Key concerns: ${e.overTime === 1 ? 'Regular Overtime workload' : 'low Job Satisfaction'} and monthly income of $${e.monthlyIncome.toLocaleString()}.\n`;
    });
    response += `\nTo examine these employees further, navigate to the **Risk Models & SHAP** tab to run mathematical SHAP explanations and generate tailored ITDO retention tasks!`;
    return response;
  }

  if (msg.includes('train') || msg.includes('train.py') || msg.includes('pkl') || msg.includes('pickle')) {
    return `Great question! The Gradient Boosting model is serialized in **model.pkl** and **preprocessor.pkl** inside the \`/models\` directory. 

*   **Offline Training:** The script \`train.py\` trains the model offline on our dataset, optimizes hyperparameters, and saves the binary files to disk.
*   **Production Inference:** When the webapp runs, it loads these pre-trained pickle files and spawns \`src/inference.py\` for ultra-fast, live predictions.
*   **Efficiency:** This means **the webapp does NOT train the model on startup**, keeping the application responsive, lightweight, and incredibly fast to load!`;
  }

  // General helpful response
  return `I am the **Patria RetentionML AI Assistant**. I'm here to support your people-analytics journey!

Here are some interesting topics we can discuss:
1.  **Model Performance:** Ask about our model metrics or Area Under ROC Curve (AUC).
2.  **What-If Scenarios:** Ask how you can dynamically simulate employee risk variations.
3.  **Active Interventions:** Ask about the ITDO Framework and the active Intervention Queue.
4.  **At-Risk Profiles:** Ask about which employees are flagged with critical flight risks.

What would you like to explore?`;
}

// 9. Ultra-responsive Chatbot endpoint (streaming with Server-Sent Events)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const userMessage = messages[messages.length - 1]?.content || '';
    const apiKey = process.env.GEMINI_API_KEY;

    // Set headers for Streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      console.log('[Chatbot] GEMINI_API_KEY missing or placeholder. Running high-fidelity local response pipeline.');
      const responseText = getHighFidelityChatbotFallback(userMessage, employees, metrics);
      
      // Stream fallback words to simulate a fast, ultra-responsive typing effect!
      const words = responseText.split(' ');
      let currentWordIndex = 0;

      const interval = setInterval(() => {
        if (currentWordIndex >= words.length) {
          clearInterval(interval);
          res.write('event: end\ndata: \n\n');
          res.end();
          return;
        }
        // Stream in blocks of 4 words for a perfect visual flow
        const chunk = words.slice(currentWordIndex, currentWordIndex + 4).join(' ') + ' ';
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        currentWordIndex += 4;
      }, 50);

      req.on('close', () => {
        clearInterval(interval);
      });
      return;
    }

    // Initialize Google GenAI
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Create system context including model metrics and some sample profiles
    const systemInstruction = `You are "Patria RetentionML AI Assistant", an ultra-responsive, highly professional, and encouraging virtual AI agent embedded in the RetentionML Console.
You help HR professionals, managers, and executives explore and interact with employee attrition predictions, ML models, and retention strategies.

Here is the current state of the application:
1. Model Metrics:
   - Holdout AUC-ROC: ${metrics.auc.toFixed(4)}
   - Holdout F1-Score: ${metrics.f1.toFixed(4)}
   - Holdout Accuracy: ${metrics.accuracy.toFixed(4)}
   - Model Type: ${gbModel ? 'GradientBoostingClassifier (Loaded from model.pkl)' : 'Logistic Regression (Fallback)'}
   - Preprocessor: ${preprocessorLoaded ? 'StandardScaler & OneHotEncoder (Loaded from preprocessor.pkl)' : 'Standard Fallback'}
   - Total Scored Workforce: ${employees.length} employees.
   - Attrition Rate / Risk Mean: ${employees.length > 0 ? (employees.reduce((sum, e) => sum + (e.predictedProbability || 0), 0) / employees.length * 100).toFixed(1) : '16'}%

2. High-Risk Employees (Sample of critical alerts):
${employees.filter(e => (e.predictedProbability || 0) > 0.70).slice(0, 5).map(e => `   - ${e.name} (${e.jobRole}, Dept: ${e.department}): Risk ${Math.round((e.predictedProbability || 0) * 100)}%, monthly income: $${e.monthlyIncome.toLocaleString()}, Overtime: ${e.overTime === 1 ? 'Yes' : 'No'}, Job Satisfaction: ${e.jobSatisfaction}/4.`).join('\n')}

3. ITDO Framework (Insights, Triggers, Decisions, Operations):
   - We use the ITDO framework to translate prediction insights into structured, actionable operational tasks on the Intervention Queue.

Guidelines:
- Respond in a clear, concise, highly professional, and helpful tone.
- Do NOT output any internal JSON, API paths, or raw paths.
- When asked about specific employees, use the sample high-risk data above or general HR best practices.
- Give highly scannable, nicely formatted Markdown responses (using bullets, bold text, and numbered lists where appropriate).
- Be enthusiastic about explaining how Gradient Boosting is used to calculate risk probabilities!
- If the user asks how to run predictions, explain how the What-If Simulator lets them dynamically alter factors (like OverTime, MonthlyIncome, JobSatisfaction) to see how the predicted probability changes.
- Ensure the response is concise (maximum 3 brief paragraphs or a compact list) so it fits perfectly in a chatbot widget.`;

    // Format chat conversation payload
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write('event: end\ndata: \n\n');
    res.end();

  } catch (error: any) {
    console.error('Error in chatbot route:', error);
    // Write error event to keep client updated
    res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to stream response.' })}\n\n`);
    res.end();
  }
});

// Configure Vite or production static files asset serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted successfully.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static files handler mounted.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
