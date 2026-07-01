# AttritionPro – Prescriptive Talent Management Platform

AttritionPro is an elite, full-stack predictive HR system designed to predict employee attrition risk, run real-time what-if simulations, and generate AI-powered retention plans. 

This guide will help you set up and run the application locally on your computer using **Visual Studio Code (VS Code)**.

---

## 📋 Prerequisites

Before running the app, ensure you have the following installed on your system:

1. **Node.js**: Version `18.x` or higher is required.
   - Download it from the [Official Node.js Website](https://nodejs.org/).
   - Choosing the **LTS (Long Term Support)** version is highly recommended.
2. **Visual Studio Code (VS Code)**: Download it from [Official VS Code Website](https://code.visualstudio.com/).
3. **Optional Extensions for VS Code**:
   - **Tailwind CSS IntelliSense** (for utility class autocompletion)
   - **TypeScript Nightly** (for type checks)

---

## 🚀 Step-by-Step Installation & Local Setup

### Step 1: Open the Project in VS Code
1. Launch **Visual Studio Code**.
2. Go to **File** > **Open Folder...** (or `Cmd + O` / `Ctrl + O`).
3. Select and open this project's root directory.

### Step 2: Open the Integrated Terminal
Open the terminal inside VS Code by going to **Terminal** > **New Terminal** (or use the shortcut `Ctrl + ` ` ` / ``Ctrl + Shift + ` ``).

### Step 3: Install Project Dependencies
Run the following command in the terminal to download and install all required packages (including Express, React, Vite, Tailwind CSS, Lucide icons, and React Markdown):

```bash
npm install
```

### Step 4: Configure Environment Variables
The application includes a server-side AI Copilot powered by the Gemini API. To enable live AI recommendations:
1. Create a new file in the root directory named `.env`:
   ```bash
   # Create a file named .env
   ```
2. Open the `.env` file and insert your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```
   *Note: If no API key is specified, the application will run in standard mode using high-fidelity local expert mock responses.*

### Step 5: Start the Development Server
Run the dev script to initiate the Express server and compile the Vite React frontend concurrently:

```bash
npm run dev
```

You should see an output in your terminal similar to:
```text
Server running on http://localhost:3000
```

### Step 6: Access the Portal
Open your web browser (Chrome, Edge, or Safari) and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🛠️ Project Structure & Architecture

- **`server.ts`**: The main Node.js / Express backend entry point. It manages API proxies, servers static resources, and implements the secure `ai/chat` endpoint.
- **`/src/App.tsx`**: Main React layout routing and state machine.
- **`/src/components/RetentionCopilot.tsx`**: The main interactive AI chat tab.
- **`/src/components/FloatingChatbot.tsx`**: The persistent floating chatbot available on every screen.
- **`/src/components/Dashboard.tsx`**: High-performance IBM HR Attrition analytics dashboard.
- **`/src/components/SlicerPredictor.tsx`**: The Talent Sandbox, which lets users simulate parameters and calculate SHAP contributions.

---

## 📊 Available Scripts

Within your project, you can run the following built-in NPM commands:

- **`npm run dev`**: Boots up the application in local development mode.
- **`npm run build`**: Compiles the React frontend static assets into `/dist` and bundles the Express server using esbuild into `dist/server.cjs`.
- **`npm run lint`**: Runs TypeScript (`tsc --noEmit`) to verify strict type compliance and syntax checking.
- **`npm start`**: Runs the production-optimized compiled package (`node dist/server.cjs`).
