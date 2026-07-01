# 🤖 Backend Machine Learning Model Repository

Welcome to the Model Repository for the Attrition Predictor application.

This directory is configured to host the serialized Python machine learning models and their corresponding schema and metadata definitions.

## 📂 Directory Contents

*   `metadata.json`: The hyperparameter and performance metrics metadata of the trained model (**Gradient Boosting Classifier** by Dr Harry Patria).
*   `model.pkl` (To be uploaded): Place your exported scikit-learn `.pkl` pickle file here.

---

## 🛠️ Model Specification

The current metadata defines a **Gradient Boosting Classifier** trained on the IBM HR Analytics Employee Attrition dataset:
*   **Algorithm:** `GradientBoostingClassifier`
*   **Estimators:** `300`
*   **Max Depth:** `4`
*   **Learning Rate:** `0.05`
*   **Features Count:** `30`
*   **Holdout Test ROC-AUC:** `0.8002`
*   **Cross-Validation Mean ROC-AUC:** `0.8234`

---

## 🚀 How to Integrate `.pkl` model into the NodeJS Backend

Since the primary full-stack wrapper runs on Node.js/Express, you have three primary architectural choices to run predictions with the `.pkl` scikit-learn model:

### Option A: Python Flask/FastAPI Sidecar (Recommended for Production)
Spin up a simple FastAPI microservice to load the `.pkl` model and run predictions.
1. Create a `app.py`:
   ```python
   import pickle
   import pandas as pd
   from fastapi import FastAPI
   
   app = FastAPI()
   model = pickle.load(open("model/model.pkl", "rb"))
   
   @app.post("/predict")
   def predict(data: dict):
       df = pd.DataFrame([data])
       prob = model.predict_proba(df)[0][1]
       return {"attrition_probability": prob}
   ```
2. Call `http://localhost:8000/predict` from Express (`server.ts`).

### Option B: Node.js Child Process Bridge
Use Node's `child_process` to execute a local Python prediction script on the fly:
```typescript
import { exec } from 'child_process';

function runPythonPrediction(features: any): Promise<number> {
  return new Promise((resolve, reject) => {
    const jsonStr = JSON.stringify(features);
    exec(`python predict.py '${jsonStr}'`, (err, stdout, stderr) => {
      if (err) return reject(err);
      const res = JSON.parse(stdout);
      resolve(res.attrition_probability);
    });
  });
}
```

### Option C: ONNX Runtime (High-Performance JS execution)
Convert your scikit-learn model to ONNX format using `skl2onnx` in Python:
```python
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

initial_type = [('float_input', FloatTensorType([None, 30]))]
onx = convert_sklearn(model, initial_types=initial_type)
with open("model.onnx", "wb") as f:
    f.write(onx.SerializeToString())
```
Then load it directly in Node.js using `onnxruntime-node`:
```typescript
import * as ort from 'onnxruntime-node';
const session = await ort.InferenceSession.create('model/model.onnx');
```
