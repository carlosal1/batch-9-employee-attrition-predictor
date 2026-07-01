import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { mlEngineInstance } from './src/utils/mlEngine';
import { Employee, Alert, Task, EmployeeFeatures } from './src/types';

// Initialize Gemini Client
const aiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: aiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // --- PERSISTENT IN-MEMORY/JSON STORAGE ---
  // To match Supabase's schemas and provide dynamic features in the preview
  let employees: Employee[] = [];
  let alerts: Alert[] = [];
  let tasks: Task[] = [];
  let systemPrompt = "You are an elite Chief People Officer and HR retention coach. Analyze the employee's attrition risk, their specific SHAP risk factors, and construct a highly tactical, compassionate, and action-oriented retention coaching plan. Keep the advice practical and formatted in markdown.";
  let alertThreshold = 0.70;

  // Initialize DB from raw dataset
  function seedDatabase() {
    try {
      const csvPath = path.resolve(process.cwd(), 'data/raw/HR-Employee-Attrition.csv');
      if (fs.existsSync(csvPath)) {
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.trim().split('\n');
        if (lines.length > 1) {
          const headers = lines[0].replace(/^\uFEFF/, '').trim().split(',');
          
          // Let's seed about 40 employees
          const maxSeed = Math.min(lines.length, 45);
          for (let i = 1; i < maxSeed; i++) {
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

            const empId = `emp-${i}`;
            const employee: Employee = {
              id: empId,
              employee_ref: `REF-${1000 + i}`,
              department: record.Department || 'Research & Development',
              job_role: record.JobRole || 'Research Scientist',
              Department: record.Department || 'Research & Development',
              JobRole: record.JobRole || 'Research Scientist',
              created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
              // Fill all training features
              Age: record.Age || 35,
              BusinessTravel: record.BusinessTravel || 'Travel_Rarely',
              DailyRate: record.DailyRate || 800,
              DistanceFromHome: record.DistanceFromHome || 5,
              Education: record.Education || 3,
              EducationField: record.EducationField || 'Life Sciences',
              EnvironmentSatisfaction: record.EnvironmentSatisfaction || 3,
              Gender: record.Gender || 'Male',
              HourlyRate: record.HourlyRate || 65,
              JobInvolvement: record.JobInvolvement || 3,
              JobLevel: record.JobLevel || 2,
              JobSatisfaction: record.JobSatisfaction || 3,
              MaritalStatus: record.MaritalStatus || 'Married',
              MonthlyIncome: record.MonthlyIncome || 5000,
              MonthlyRate: record.MonthlyRate || 15000,
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

            employees.push(employee);

            // Predict and seed Alerts
            const prediction = mlEngineInstance.predict(employee);
            if (prediction.attrition_probability >= 0.40) {
              const alertId = `alert-${i}`;
              const newAlert: Alert = {
                id: alertId,
                prediction_id: `pred-${i}`,
                employee_id: employee.id,
                employee_name: `Employee ${employee.employee_ref} (${employee.id === 'emp-1' ? 'Sonali M.' : employee.id === 'emp-3' ? 'Narsinh K.' : 'Staff Member'})`,
                department: employee.department,
                job_role: employee.job_role,
                threshold: alertThreshold,
                attrition_probability: prediction.attrition_probability,
                status: prediction.attrition_probability > 0.70 ? 'OPEN' : 'ACKNOWLEDGED',
                created_at: new Date(Date.now() - i * 6 * 3600000).toISOString(),
                updated_at: new Date().toISOString()
              };
              alerts.push(newAlert);

              // Seed some Tasks for the operations layer
              if (i % 3 === 1) {
                const taskId = `task-${i}`;
                const task: Task = {
                  id: taskId,
                  alert_id: alertId,
                  employee_id: employee.id,
                  employee_name: newAlert.employee_name,
                  title: `Retention Review: ${employee.job_role}`,
                  description: `Conduct stay interview addressing main drivers: ${prediction.top_risk_factors.map(f => f.displayName).join(', ')}`,
                  intervention: prediction.suggested_interventions[0] || 'Schedule standard compensation alignment benchmarking.',
                  status: i % 2 === 0 ? 'IN_PROGRESS' : 'TODO',
                  due_date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
                  assigned_to: 'hr-bp@company.com',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                tasks.push(task);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('[Database Seeding] Error:', e);
    }
  }

  seedDatabase();

  // --- API ENDPOINTS ---

  // Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', model_loaded: true, version: '1.0.0' });
  });

  // Model metrics
  app.get('/api/model-metrics', (req, res) => {
    const metrics = mlEngineInstance.getMetrics();
    res.json(metrics);
  });

  // Model metadata
  app.get('/api/model-metadata', (req, res) => {
    try {
      const metaPath = path.resolve(process.cwd(), 'model/metadata.json');
      if (fs.existsSync(metaPath)) {
        const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        res.json(metadata);
      } else {
        res.status(404).json({ error: 'Model metadata not found' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // System Settings
  app.get('/api/settings', (req, res) => {
    res.json({
      alert_threshold: alertThreshold,
      system_prompt: systemPrompt,
      model_version: '1.0.0'
    });
  });

  app.post('/api/settings', (req, res) => {
    const { alert_threshold, system_prompt } = req.body;
    if (alert_threshold !== undefined) alertThreshold = Number(alert_threshold);
    if (system_prompt !== undefined) systemPrompt = system_prompt;
    res.json({ success: true, alert_threshold: alertThreshold, system_prompt: systemPrompt });
  });

  // Employee list
  app.get('/api/employees', (req, res) => {
    res.json(employees);
  });

  // Single employee predict
  app.post('/api/predict', (req, res) => {
    try {
      const features: EmployeeFeatures = req.body;
      const prediction = mlEngineInstance.predict(features);
      
      const predictionId = `pred-${Math.random().toString(36).substring(2, 11)}`;
      res.json({
        employee_id: req.body.employee_id || 'custom-slicer',
        attrition_probability: prediction.attrition_probability,
        risk_level: prediction.risk_level,
        top_risk_factors: prediction.top_risk_factors,
        suggested_interventions: prediction.suggested_interventions,
        prediction_id: predictionId
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Batch predict (up to 500)
  app.post('/api/batch-predict', (req, res) => {
    try {
      const list: EmployeeFeatures[] = req.body;
      const results = list.map((item, idx) => {
        const pred = mlEngineInstance.predict(item);
        return {
          employee_id: (item as any).employee_id || `batch-emp-${idx}`,
          employee_name: (item as any).employee_name || `Employee REF-${1000 + idx}`,
          attrition_probability: pred.attrition_probability,
          risk_level: pred.risk_level,
          top_risk_factors: pred.top_risk_factors,
          suggested_interventions: pred.suggested_interventions,
          prediction_id: `pred-${Math.random().toString(36).substring(2, 11)}`,
          model_version: '1.0.0',
          created_at: new Date().toISOString()
        };
      });
      res.json(results);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Active Alerts
  app.get('/api/alerts', (req, res) => {
    res.json(alerts);
  });

  app.post('/api/alerts', (req, res) => {
    const alertData: Omit<Alert, 'id' | 'created_at' | 'updated_at'> = req.body;
    const newAlert: Alert = {
      ...alertData,
      id: `alert-${Math.random().toString(36).substring(2, 11)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    alerts.unshift(newAlert);
    res.status(201).json(newAlert);
  });

  app.put('/api/alerts/:id', (req, res) => {
    const { id } = req.params;
    const { status, assigned_to } = req.body;
    const alert = alerts.find((a) => a.id === id);
    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }
    if (status) alert.status = status;
    if (assigned_to !== undefined) alert.assigned_to = assigned_to;
    alert.updated_at = new Date().toISOString();
    res.json(alert);
  });

  // Operations Tasks (Kanban board)
  app.get('/api/tasks', (req, res) => {
    res.json(tasks);
  });

  app.post('/api/tasks', (req, res) => {
    const taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> = req.body;
    const newTask: Task = {
      ...taskData,
      id: `task-${Math.random().toString(36).substring(2, 11)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    tasks.unshift(newTask);
    res.status(201).json(newTask);
  });

  app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { status, title, description, intervention, due_date, assigned_to } = req.body;
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    if (status) task.status = status;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (intervention !== undefined) task.intervention = intervention;
    if (due_date) task.due_date = due_date;
    if (assigned_to !== undefined) task.assigned_to = assigned_to;
    task.updated_at = new Date().toISOString();
    res.json(task);
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    tasks = tasks.filter((t) => t.id !== id);
    res.json({ success: true });
  });

  // AI Retention Coach (Gemini integration server-side)
  app.post('/api/ai/coach', async (req, res) => {
    try {
      const { employeeName, attritionProb, riskLevel, riskFactors, department, jobRole } = req.body;
      
      if (!aiKey) {
        // Mock a wonderful answer if key is missing to avoid crashing the server
        res.json({
          plan: `### 🛡️ Retention Coaching Plan (Simulated)\n\n**Employee:** ${employeeName} | **Role:** ${jobRole} (${department})\n**Attrition Risk:** ${(attritionProb * 100).toFixed(1)}% (${riskLevel})\n\n---\n\n#### 🔍 Primary Attrition Drivers (SHAP):\n${riskFactors.map((f: any) => `- **${f.displayName}**: Contribution of **+${(f.impact * 100).toFixed(1)}%** to attrition likelihood.`).join('\n')}\n\n#### 🎯 Immediate Tactical Actions (HRBP):\n1. **Compensation Correction:** Conduct custom salary audit relative to market baseline. Present an equity refresh package during upcoming quarter alignment.\n2. **Overtime Relief:** Establish strict 40-hour weekly cap. Introduce job-sharing resources to alleviate current workload pressure.\n3. **Stay Interview:** Schedule confidential stay session focusing entirely on work-life balance and long-term career growth mapping.\n\n*Configure your GEMINI_API_KEY in Settings to enable live cognitive advisor recommendations.*`
        });
        return;
      }

      const prompt = `Analyze employee retention risk:
Employee: ${employeeName}
Department: ${department}
Job Role: ${jobRole}
Predicted Attrition Risk: ${(attritionProb * 100).toFixed(1)}% (${riskLevel})

Top SHAP Risk Factors:
${riskFactors.map((f: any) => `- ${f.displayName}: Impact of ${f.impact.toFixed(3)}`).join('\n')}

Please generate a hyper-targeted retention coaching plan. Detail:
1. Stay Interview guidelines matching their top risk factors.
2. Rule-based or strategic career/compensation intervention paths.
3. Specific talk tracks for their direct manager.
4. Next actions for the HR Business Partner.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      res.json({ plan: response.text || 'No suggestion could be generated.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Chatbot Copilot Endpoint
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Messages array is required' });
        return;
      }

      const systemInstruction = `You are AttritionPro Copilot, an elite AI HR advisor and stay retention coach working with Jordan Davis (Chief People Officer). 
You help analyze attrition prediction, interpret what-if simulation scenarios, explain machine learning metrics (ROC-AUC, Precision, Recall), and suggest strategic workforce retention steps. 
Always remain supportive, professional, tactical, and format your answers beautifully in clear, structured Markdown.`;

      if (!aiKey) {
        // Fallback simulated expert responses based on the last user message
        const lastMsg = messages[messages.length - 1]?.text || '';
        const query = lastMsg.toLowerCase();
        let reply = '';

        if (query.includes('shap') || query.includes('driver') || query.includes('factor')) {
          reply = `### 📊 Explaining SHAP Feature Attributions\n\n**SHAP (SHapley Additive exPlanations)** values quantify the exact percentage-point impact of each feature on an individual's attrition risk. 

Here is how to interpret the results in our **Talent Sandbox**:
- **Positive SHAP Impact (Rose/Red Bars):** Drivers like *OverTime: Yes*, *DistanceFromHome*, or *YearsSinceLastPromotion* directly push up the attrition probability.
- **Negative SHAP Impact (Emerald/Green Bars):** Retention buffers like *StockOptionLevel*, *JobInvolvement*, or high *JobSatisfaction* act as protective weights.

*Tip: You can use these drivers to customize your Stay Interview checklists in the Operations Board!*`;
        } else if (query.includes('model') || query.includes('algorithm') || query.includes('accuracy') || query.includes('metric')) {
          reply = `### 🧠 AttritionPro Model Specifications\n\nOur attrition classifier was developed by **Dr. Harry Patria**:
- **Algorithm:** Gradient Boosting Classifier (GBC) ensemble.
- **Features Analyzed:** 30 human capital variables.
- **Cross-Validation ROC-AUC:** **82.34%**
- **Test Set Holdout ROC-AUC:** **80.02%**
- **Primary Features of Interest:** Overtime frequency, Monthly Income, Years with Current Manager, and Job Level.

All predictions are calibrated against standard scikit-learn standardizations.`;
        } else if (query.includes('threshold') || query.includes('milestone') || query.includes('probability')) {
          reply = `### 🎯 Probability Milestone Guidance (0.4 & 0.7)\n\nWe utilize calibrated risk segments for preventive alerts:
- **LOW Risk (< 40%):** Under the 0.4 threshold. Standard retention care applies.
- **MEDIUM Risk (40% - 70%):** Between 0.4 and 0.7. Highlighted in Amber on the gauge. These require proactive stay interviews and resource scheduling.
- **HIGH Risk (> 70%):** Above the 0.7 threshold. Generates an active, priority Alert. Requires immediate executive compensation or workload realignment.`;
        } else {
          reply = `### 👋 Welcome to AttritionPro Copilot!\n\nI am your interactive retention intelligence assistant. I can help you:
1. **Explain Predictions:** Learn why specific employees are flagged with elevated risk.
2. **Interpret SHAP Values:** Understand the math behind positive/negative driver contributions.
3. **Draft Stay Strategy:** Formulate talk-tracks for managers or draft stay checklists.
4. **Explain Model Metrics:** Review accuracy, precision, and scikit-learn preprocessing paths.

*Note: Configure your GEMINI_API_KEY in the Settings > Secrets panel to unlock my live, cognitive reasoning engine!*`;
        }

        // Add a slight artificial delay to feel ultra responsive but realistic
        await new Promise(resolve => setTimeout(resolve, 500));
        res.json({ reply });
        return;
      }

      // Convert messages to @google/genai format
      const contents = messages.map((msg: any) => ({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text || 'I could not generate a response.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- VITE MIDDLEWARE OR STATIC FILES ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full-Stack Server] Attrition Predictor Pro running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
