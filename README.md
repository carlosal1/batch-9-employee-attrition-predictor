# Employee Attrition Command Center 🔮📊

Welcome to the **Employee Attrition Command Center**, a senior HR people analytics dashboard that predicts employee flight risk using a custom-trained **Gradient Boosting Classifier** model. It features high-fidelity holdout performance metrics (AUC-ROC >= 0.85), mathematical SHAP waterfall explanation breakdowns, an interactive What-If Simulator, and a proactive ITDO task resolution pipeline. It also includes an **ultra-responsive AI chatbot assistant** powered by the Gemini API.

---

## 🛠️ Prerequisites & System Setup

To run this application locally inside **Visual Studio Code**, you need to install both **Node.js** and **Python 3** on your computer.

### 1. Install Node.js (v18 or higher)
*   **macOS / Windows / Linux:** Download and install Node.js from the official website: [https://nodejs.org/](https://nodejs.org/).
*   *Verification:* Open your terminal and verify the installation:
    ```bash
    node --version
    npm --version
    ```

### 2. Install Python 3 (v3.9 or higher)
*   **Windows:** Download the installer from [https://www.python.org/](https://www.python.org/) (ensure you check **"Add Python to PATH"** during installation).
*   **macOS:** Install via Homebrew: `brew install python` or download the installer from python.org.
*   **Linux:** Installed by default on most distributions, or install via your package manager (e.g., `sudo apt install python3 python3-pip`).
*   *Verification:* Verify Python and pip are installed:
    ```bash
    python3 --version
    pip3 --version
    ```

---

## 📥 Local Installation & Dependencies

Follow these step-by-step instructions inside **Visual Studio Code**:

### Step 1: Open the Project in VS Code
1. Open Visual Studio Code.
2. Select **File > Open Folder...** and select the root directory of this project.
3. Open a new terminal inside VS Code by going to **Terminal > New Terminal** (or pressing ``Ctrl + ` `` / ``Cmd + ` ``).

### Step 2: Install Node.js Dependencies
Install all the required frontend and backend Node packages specified in `package.json`:
```bash
npm install
```

### Step 3: Install Python Dependencies
The machine learning pipeline relies on scikit-learn and pandas to train models and execute live inferences. Run the following command in your terminal to install them:
```bash
pip3 install pandas scikit-learn
```

---

## ⚙️ Environment Configuration

The application uses environment variables for live API features (like the AI Chatbot).

1. In the root directory, create a copy of `.env.example` and name it `.env`:
   * **Windows Command Prompt:** `copy .env.example .env`
   * **macOS / Linux / Git Bash:** `cp .env.example .env`
2. Open your new `.env` file in VS Code and fill in your credentials:
   ```env
   # Provide your Gemini API Key here for the live AI Chatbot features
   GEMINI_API_KEY="your-actual-gemini-api-key-here"
   
   # Set the local application URL (default is http://localhost:3000)
   APP_URL="http://localhost:3000"
   ```

---

## 🏋️‍♂️ Model Training & Preparation

The predictive model must be trained offline on the HR Employee Attrition dataset before running the app. The system serializes preprocessors and model weights into the `/models` directory.

Train the Gradient Boosting Classifier by executing the training script:
```bash
python3 src/train.py
```

*Expected output:*
```text
[Trainer] Starting model training pipeline...
[Trainer] Loaded 244 rows from dataset.
[Trainer] Fitting preprocessor transformer...
[Trainer] Training GradientBoostingClassifier model (n_estimators=300, lr=0.05, max_depth=4)...
[Trainer] Serializing and saving models to disk...
[Trainer] Training pipeline complete! preprocessor.pkl and model.pkl created successfully.
```

---

## 🚀 Running the Application

Once your dependencies are installed and the model is trained, you can start the application:

### Run in Development Mode
Starts the high-speed local development server with live reload enabled:
```bash
npm run dev
```
*   Your full-stack server will start running at: **`http://localhost:3000`**
*   Open this URL in your web browser to interact with the dashboard!

### Run in Production Mode
To test the production-grade bundle and execution flow:
1. Build and compile the assets:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm run start
   ```

---

## 📂 Project Architecture

*   `server.ts` - Express backend proxy server handling routing, datasets, and spawning python inferences.
*   `src/inference.py` - Runs live Python-based scikit-learn model scoring for real-time What-If simulations.
*   `src/train.py` - Offline training script that trains the Gradient Boosting Classifier and saves pickle binaries.
*   `src/App.tsx` - Main layout controller coordinating screen states and navigation.
*   `src/components/` - High-quality React dashboards and interactive widgets:
    *   `EmployeeDirectory.tsx` - Active scored roster, individual SHAP analysis panels, and ITDO task creation.
    *   `ScenarioAnalyser.tsx` - Interactive simulator using sliders to perform real-time model predictions.
    *   `Chatbot.tsx` - Floating, responsive AI Assistant integrated directly with the active directory and metrics.
    *   `HoldoutMetrics.tsx` - Visual holdout analytics including ROC Curves and confusion matrices.
    *   `RetentionTaskBoard.tsx` - The ITDO Framework intervention queue for tracking physical action pipelines.
