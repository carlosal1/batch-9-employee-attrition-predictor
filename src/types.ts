/**
 * Attrition Predictor Pro Types
 */

export interface EmployeeFeatures {
  Age: number;
  BusinessTravel: 'Travel_Rarely' | 'Travel_Frequently' | 'Non-Travel';
  DailyRate: number;
  Department: 'Sales' | 'Research & Development' | 'Human Resources';
  DistanceFromHome: number;
  Education: number;
  EducationField: string;
  EnvironmentSatisfaction: number; // 1-4
  Gender: 'Male' | 'Female';
  HourlyRate: number;
  JobInvolvement: number; // 1-4
  JobLevel: number; // 1-5
  JobRole: string;
  JobSatisfaction: number; // 1-4
  MaritalStatus: 'Single' | 'Married' | 'Divorced';
  MonthlyIncome: number;
  MonthlyRate: number;
  NumCompaniesWorked: number;
  OverTime: 'Yes' | 'No';
  PercentSalaryHike: number;
  PerformanceRating: number; // 1-4
  RelationshipSatisfaction: number; // 1-4
  StockOptionLevel: number; // 0-3
  TotalWorkingYears: number;
  TrainingTimesLastYear: number;
  WorkLifeBalance: number; // 1-4
  YearsAtCompany: number;
  YearsInCurrentRole: number;
  YearsSinceLastPromotion: number;
  YearsWithCurrManager: number;
}

export interface Employee extends EmployeeFeatures {
  id: string;
  employee_ref: string;
  department: 'Sales' | 'Research & Development' | 'Human Resources';
  job_role: string;
  manager_id?: string;
  created_at: string;
}

export interface RiskFactor {
  feature: string;
  impact: number; // SHAP value (contribution)
  direction: 'increases' | 'decreases';
  displayName: string;
}

export interface PredictionResult {
  employee_id: string;
  employee_name: string;
  attrition_probability: number; // 0.0 - 1.0
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  top_risk_factors: RiskFactor[];
  suggested_interventions: string[];
  prediction_id: string;
  model_version: string;
  created_at: string;
}

export interface Alert {
  id: string;
  prediction_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  job_role: string;
  threshold: number;
  attrition_probability: number;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  assigned_to?: string; // User/Admin email
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  alert_id?: string;
  employee_id: string;
  employee_name: string;
  title: string;
  description: string;
  intervention: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  due_date: string; // YYYY-MM-DD
  assigned_to?: string; // Email
  created_at: string;
  updated_at: string;
}

export interface ModelMetrics {
  auc_roc: number;
  f1_score: number;
  precision: number;
  recall: number;
  accuracy: number;
  trained_at: string;
  features_importance: { feature: string; importance: number }[];
  confusion_matrix: {
    true_positive: number;
    false_positive: number;
    true_negative: number;
    false_negative: number;
  };
}

export interface SystemSettings {
  alert_threshold: number; // e.g. 0.70
  system_prompt: string;
  model_version: string;
}
