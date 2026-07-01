-- Attrition Predictor Pro - Database Schema Migration
-- Target: PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: employees
CREATE TABLE IF NOT EXISTS employees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_ref    text NOT NULL UNIQUE,
  department      text,
  job_role        text,
  manager_id      uuid REFERENCES employees(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Table: predictions
CREATE TABLE IF NOT EXISTS predictions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id             uuid REFERENCES employees(id),
  attrition_probability   numeric(5,4) NOT NULL,
  risk_level              text NOT NULL CHECK (risk_level IN ('LOW','MEDIUM','HIGH')),
  top_risk_factors        jsonb,
  suggested_interventions jsonb,
  model_version           text,
  created_by              uuid REFERENCES auth.users(id),
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- Table: alerts
CREATE TABLE IF NOT EXISTS alerts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id   uuid REFERENCES predictions(id),
  employee_id     uuid REFERENCES employees(id),
  threshold       numeric(5,4) NOT NULL,
  status          text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  assigned_to     uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Table: tasks (Operations layer of ITDO)
CREATE TABLE IF NOT EXISTS tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id        uuid REFERENCES alerts(id),
  employee_id     uuid REFERENCES employees(id),
  title           text NOT NULL,
  description     text,
  intervention    text,
  status          text NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO','IN_PROGRESS','DONE','CANCELLED')),
  due_date        date,
  assigned_to     uuid REFERENCES auth.users(id),
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE employees   ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks       ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies for authenticated users
CREATE POLICY "Allow authenticated read on employees" 
  ON employees FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated read/write on predictions" 
  ON predictions FOR ALL 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated read/write on alerts" 
  ON alerts FOR ALL 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated read/write on tasks" 
  ON tasks FOR ALL 
  TO authenticated 
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_predictions_employee ON predictions(employee_id);
CREATE INDEX IF NOT EXISTS idx_predictions_risk ON predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
