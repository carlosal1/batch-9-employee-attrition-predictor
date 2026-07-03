import os
import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier

def train_and_save():
    print("[Trainer] Starting model training pipeline...")
    
    # Paths
    csv_path = os.path.join('data', 'raw', 'HR-Employee-Attrition.csv')
    models_dir = 'models'
    prep_path = os.path.join(models_dir, 'preprocessor.pkl')
    model_path = os.path.join(models_dir, 'model.pkl')
    
    if not os.path.exists(csv_path):
        print(f"[Trainer] Error: Dataset not found at {csv_path}")
        return
        
    os.makedirs(models_dir, exist_ok=True)
    
    # Load dataset
    df = pd.read_csv(csv_path)
    print(f"[Trainer] Loaded {len(df)} rows from dataset.")
    
    # Convert target to binary
    df['Attrition'] = (df['Attrition'] == 'Yes').astype(int)
    
    # List of 30 features from model_metadata.json
    feature_cols = [
        "Age", "DailyRate", "DistanceFromHome", "Education", "EnvironmentSatisfaction", 
        "HourlyRate", "JobInvolvement", "JobLevel", "JobSatisfaction", "MonthlyIncome", 
        "MonthlyRate", "NumCompaniesWorked", "PercentSalaryHike", "PerformanceRating", 
        "RelationshipSatisfaction", "StockOptionLevel", "TotalWorkingYears", "TrainingTimesLastYear", 
        "WorkLifeBalance", "YearsAtCompany", "YearsInCurrentRole", "YearsSinceLastPromotion", 
        "YearsWithCurrManager", "BusinessTravel", "Department", "EducationField", 
        "Gender", "JobRole", "MaritalStatus", "OverTime"
    ]
    
    X = df[feature_cols]
    y = df['Attrition']
    
    categorical_cols = ["BusinessTravel", "Department", "EducationField", "Gender", "JobRole", "MaritalStatus", "OverTime"]
    numerical_cols = [col for col in feature_cols if col not in categorical_cols]
    
    # Build preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
        ]
    )
    
    # Fit preprocessor
    print("[Trainer] Fitting preprocessor transformer...")
    X_trans = preprocessor.fit_transform(X)
    
    # Train GradientBoostingClassifier model using specifications in metadata
    print("[Trainer] Training GradientBoostingClassifier model (n_estimators=300, lr=0.05, max_depth=4)...")
    model = GradientBoostingClassifier(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=4,
        random_state=42
    )
    model.fit(X_trans, y)
    
    # Save files
    print("[Trainer] Serializing and saving models to disk...")
    with open(prep_path, 'wb') as f:
        pickle.dump(preprocessor, f)
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
        
    print("[Trainer] Training pipeline complete! preprocessor.pkl and model.pkl created successfully.")

if __name__ == '__main__':
    train_and_save()
