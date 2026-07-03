# Machine Learning Models Directory

This directory is designated for holding serialized machine learning models (such as `.pkl` files created in Python via `scikit-learn` or `joblib`) along with their metadata.

## Directory Structure

```text
/models/
├── README.md               # This documentation file
├── model_metadata.json     # Metadata of the trained model (GradientBoostingClassifier)
└── model.pkl               # [PLACE TARGET SERIALIZED PICKLE FILE HERE]
```

## Model Metadata Summary

- **Author**: Dr. Harry Patria
- **Organization**: Patria & Co.
- **Algorithm**: `GradientBoostingClassifier` (scikit-learn)
- **Number of Estimators**: 300
- **Maximum Depth**: 4
- **Learning Rate**: 0.05
- **Dataset**: IBM HR Analytics Employee Attrition (1,176 train samples, 294 test samples)
- **Features Used**: 30 feature columns (listed in `model_metadata.json`)

---

## Interfacing `.pkl` with the TypeScript/Node.js Backend

Because `.pkl` files are native Python serialization objects, they cannot be run directly inside a pure JavaScript/TypeScript V8 runtime. To serve predictions from `model.pkl` in this fullstack application, you have two primary options:

### Option A: Python Sidecar Microservice (Recommended for Production)

Run a small Flask or FastAPI microservice that loads the pickle model and exposes a `/predict` REST endpoint. The Express server can proxy traffic to it.

#### 1. Flask Service Example (`app.py`):
```python
import joblib
from flask import Flask, request, jsonify
import pandas as pd

app = Flask(__name__)
# Load the pickle model
model = joblib.load('models/model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    # Convert input dict to Pandas DataFrame with correct features
    df = pd.DataFrame([data])
    
    # Predict probabilities
    probs = model.predict_proba(df)[0]
    
    return jsonify({
        "attrition_probability": float(probs[1]),
        "risk_level": "HIGH" if probs[1] > 0.7 else "MEDIUM" if probs[1] >= 0.4 else "LOW"
    })

if __name__ == '__main__':
    app.run(port=5000)
```

#### 2. Express Integration Code:
In your `/server.ts` file, you can call this Python sidecar:
```typescript
import axios from 'axios';

app.post('/api/predict-gradient-boosting', async (req, res) => {
  try {
    const pythonResponse = await axios.post('http://localhost:5000/predict', req.body);
    res.json(pythonResponse.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to contact Python prediction microservice' });
  }
});
```

### Option B: Child Process Spawner (`child_process`)

Directly invoke a Python CLI script from Node.js using `child_process.spawn`. This avoids setting up a secondary HTTP port but has higher cold-start overhead per request.

```typescript
import { spawn } from 'child_process';

function runPythonInference(inputData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['src/inference.py']);
    
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();

    let output = '';
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Inference script exited with code ${code}`));
      } else {
        resolve(JSON.parse(output));
      }
    });
  });
}
```
