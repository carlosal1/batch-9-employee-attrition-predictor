import sys
import json
import os
import joblib

def normalize_employee(input_data):
    # Normalize Department to match original IBM values
    dept = input_data.get('department', 'Sales')
    if dept == 'HR':
        dept = 'Human Resources'
        
    # Normalize BusinessTravel
    bt = input_data.get('businessTravel', 'Travel_Rarely')
    if bt == 'Travel Rarely' or bt == 'Travel_Rarely':
        bt = 'Travel_Rarely'
    elif bt == 'Travel Frequently' or bt == 'Travel_Frequently':
        bt = 'Travel_Frequently'
    elif bt == 'Non-Travel' or bt == 'Non_Travel' or bt == 'NonTravel':
        bt = 'Non-Travel'
        
    # Normalize OverTime
    ot_val = input_data.get('overTime', 0)
    ot_num = 1 if (ot_val == 1 or ot_val is True or str(ot_val).lower() == 'yes') else 0
    
    # Map values
    mapped_data = {
        "Age": int(input_data.get('age', 35)),
        "DailyRate": int(input_data.get('dailyRate', 800)),
        "DistanceFromHome": int(input_data.get('distanceFromHome', 7)),
        "Education": int(input_data.get('education', 3)),
        "EnvironmentSatisfaction": int(input_data.get('environmentSatisfaction', 3)),
        "HourlyRate": int(input_data.get('hourlyRate', 60)),
        "JobInvolvement": int(input_data.get('jobInvolvement', 3)),
        "JobLevel": int(input_data.get('jobLevel', max(1, min(5, int(input_data.get('monthlyIncome', 5000) / 3000))))),
        "JobSatisfaction": int(input_data.get('jobSatisfaction', 3)),
        "MonthlyIncome": float(input_data.get('monthlyIncome', 5000)),
        "MonthlyRate": float(input_data.get('monthlyRate', 14000)),
        "NumCompaniesWorked": int(input_data.get('numCompaniesWorked', 2)),
        "PercentSalaryHike": int(input_data.get('percentSalaryHike', 14)),
        "PerformanceRating": int(input_data.get('performanceRating', 3)),
        "RelationshipSatisfaction": int(input_data.get('relationshipSatisfaction', 3)),
        "StockOptionLevel": int(input_data.get('stockOptionLevel', 0)),
        "TotalWorkingYears": int(input_data.get('totalWorkingYears', int(input_data.get('yearsAtCompany', 5)) + 2)),
        "TrainingTimesLastYear": int(input_data.get('trainingTimesLastYear', 3)),
        "WorkLifeBalance": int(input_data.get('workLifeBalance', 3)),
        "YearsAtCompany": int(input_data.get('yearsAtCompany', 5)),
        "YearsInCurrentRole": int(input_data.get('yearsInCurrentRole', max(0, int(input_data.get('yearsAtCompany', 5)) - 1))),
        "YearsSinceLastPromotion": int(input_data.get('yearsSinceLastPromotion', 1)),
        "YearsWithCurrManager": int(input_data.get('yearsWithCurrManager', max(0, int(input_data.get('yearsAtCompany', 5)) - 1))),
        "BusinessTravel": bt,
        "Department": dept,
        "EducationField": input_data.get('educationField', 'Life Sciences'),
        "Gender": input_data.get('gender', 'Male'),
        "JobRole": input_data.get('jobRole', 'Sales Executive'),
        "MaritalStatus": input_data.get('maritalStatus', 'Single'),
        "OverTime": ot_num
    }
    return mapped_data

def main():
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # We need pandas and sklearn to run the prediction
        import pandas as pd
        import sklearn
        
        # Load preprocessor and model
        models_dir = os.path.join(os.getcwd(), 'models')
        prep_path = os.path.join(models_dir, 'preprocessor.pkl')
        model_path = os.path.join(models_dir, 'model.pkl')
        
        if not os.path.exists(prep_path) or not os.path.exists(model_path):
            print(json.dumps({"error": "Model files not found on disk.", "status": "failed"}))
            return

        preprocessor = joblib.load(prep_path)
        model = joblib.load(model_path)

        # Features list
        features = [
            "Age", "DailyRate", "DistanceFromHome", "Education", "EnvironmentSatisfaction", 
            "HourlyRate", "JobInvolvement", "JobLevel", "JobSatisfaction", "MonthlyIncome", 
            "MonthlyRate", "NumCompaniesWorked", "PercentSalaryHike", "PerformanceRating", 
            "RelationshipSatisfaction", "StockOptionLevel", "TotalWorkingYears", "TrainingTimesLastYear", 
            "WorkLifeBalance", "YearsAtCompany", "YearsInCurrentRole", "YearsSinceLastPromotion", 
            "YearsWithCurrManager", "BusinessTravel", "Department", "EducationField", 
            "Gender", "JobRole", "MaritalStatus", "OverTime"
        ]

        numerical_cols = [
            "Age", "DailyRate", "DistanceFromHome", "Education", "EnvironmentSatisfaction", 
            "HourlyRate", "JobInvolvement", "JobLevel", "JobSatisfaction", "MonthlyIncome", 
            "MonthlyRate", "NumCompaniesWorked", "PercentSalaryHike", "PerformanceRating", 
            "RelationshipSatisfaction", "StockOptionLevel", "TotalWorkingYears", "TrainingTimesLastYear", 
            "WorkLifeBalance", "YearsAtCompany", "YearsInCurrentRole", "YearsSinceLastPromotion", 
            "YearsWithCurrManager"
        ]

        categorical_cols = ["BusinessTravel", "Department", "EducationField", "Gender", "JobRole", "MaritalStatus"]

        if isinstance(input_data, list):
            # Batch mode
            mapped_list = []
            ids = []
            for item in input_data:
                mapped_list.append(normalize_employee(item))
                # Match both employee_id and id
                emp_id = item.get('id') or item.get('employee_id')
                ids.append(emp_id)

            df = pd.DataFrame(mapped_list)
            df = df[features]
            
            # Cast column types explicitly
            for col in numerical_cols:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(float)
            for col in categorical_cols:
                df[col] = df[col].astype(str)
            df["OverTime"] = pd.to_numeric(df["OverTime"], errors='coerce').fillna(0).astype(int)
            
            # Preprocess data
            X_trans = preprocessor.transform(df)
            
            # Predict probabilities
            probs = model.predict_proba(X_trans)[:, 1]
            
            results = []
            for emp_id, prob in zip(ids, probs):
                results.append({
                    "employee_id": emp_id,
                    "attrition_probability": float(prob)
                })
            
            print(json.dumps({
                "results": results,
                "status": "success"
            }))
        else:
            # Single mode
            mapped_single = normalize_employee(input_data)
            df = pd.DataFrame([mapped_single])
            df = df[features]
            
            # Cast column types explicitly
            for col in numerical_cols:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(float)
            for col in categorical_cols:
                df[col] = df[col].astype(str)
            df["OverTime"] = pd.to_numeric(df["OverTime"], errors='coerce').fillna(0).astype(int)
            
            X_trans = preprocessor.transform(df)
            prob = model.predict_proba(X_trans)[0][1]
            
            print(json.dumps({
                "attrition_probability": float(prob),
                "status": "success"
            }))
            
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "status": "failed"
        }))

if __name__ == '__main__':
    main()
