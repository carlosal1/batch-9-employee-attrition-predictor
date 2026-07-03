/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: 'Engineering' | 'Sales' | 'HR' | 'Marketing' | 'Product' | 'Operations';
  jobRole: string;
  age: number;
  gender: string;
  monthlyIncome: number;
  overTime: number; // 1 for Yes, 0 for No
  jobSatisfaction: number; // 1 to 4
  workLifeBalance: number; // 1 to 4
  environmentSatisfaction: number; // 1 to 4
  yearsAtCompany: number;
  yearsSinceLastPromotion: number;
  stockOptionLevel: number; // 0 to 3
  performanceRating: number; // 1 to 4
  actualAttrition: number; // 1 for left, 0 for stayed (historical or holdout)
  predictedProbability?: number; // 0.0 to 1.0
  predictedAttrition?: boolean;
}

export interface FeatureImportance {
  feature: string;
  displayName: string;
  weight: number;
  importance: number; // absolute weight or normalized
}

export interface RocPoint {
  fpr: number;
  tpr: number;
  threshold: number;
}

export interface ModelMetrics {
  auc: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocCurve: RocPoint[];
  featureImportances: FeatureImportance[];
  confusionMatrix: {
    tp: number;
    fp: number;
    fn: number;
    tn: number;
  };
}

export interface ShapValue {
  feature: string;
  displayName: string;
  value: number; // feature value
  shapValue: number; // impact on log-odds or risk probability
  effect: 'increase' | 'decrease';
  description: string;
}

export interface ShapExplanation {
  employeeId: string;
  employeeName: string;
  baseProbability: number;
  finalProbability: number;
  shapValues: ShapValue[];
  narrative: string;
}

export interface RetentionTask {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  jobRole: string;
  riskScore: number;
  title: string;
  status: 'Open' | 'InProgress' | 'Resolved';
  priority: 'High' | 'Medium' | 'Low';
  createdAt: string;
  assignedTo: string;
  itdoPipeline: {
    insight: string;
    trigger: string;
    decision: string;
    operation: string;
  };
}
