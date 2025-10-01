/*
  # Shift Planning System Schema

  ## Overview
  Creates a comprehensive shift planning system for tracking employee work schedules,
  including office work, remote work, on-call duties, vacations, and sick leaves.

  ## New Tables

  ### 1. `employees`
  Stores employee information
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Employee full name
  - `position` (text) - Job position/title
  - `email` (text, unique) - Contact email
  - `active` (boolean) - Employment status
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. `shifts`
  Records work shifts for employees
  - `id` (uuid, primary key) - Unique identifier
  - `employee_id` (uuid, foreign key) - References employees table
  - `shift_date` (date) - Date of the shift
  - `shift_type` (text) - Type: 'office', 'remote', 'oncall'
  - `notes` (text, optional) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `absences`
  Tracks employee absences (vacation, sick leave)
  - `id` (uuid, primary key) - Unique identifier
  - `employee_id` (uuid, foreign key) - References employees table
  - `absence_type` (text) - Type: 'vacation', 'sick_leave'
  - `start_date` (date) - Beginning of absence period
  - `end_date` (date) - End of absence period
  - `notes` (text, optional) - Additional details
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to:
    - Read all employees, shifts, and absences
    - Create, update, and delete shifts and absences
    - Create and update employees

  ## Important Notes
  1. All tables use RLS for security
  2. Foreign key constraints ensure data integrity
  3. Indexes on employee_id and date fields for performance
  4. Check constraints ensure valid shift and absence types
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  email text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_date date NOT NULL,
  shift_type text NOT NULL CHECK (shift_type IN ('office', 'remote', 'oncall')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, shift_date)
);

-- Create absences table
CREATE TABLE IF NOT EXISTS absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  absence_type text NOT NULL CHECK (absence_type IN ('vacation', 'sick_leave')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  CHECK (end_date >= start_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shifts_employee_id ON shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_absences_employee_id ON absences(employee_id);
CREATE INDEX IF NOT EXISTS idx_absences_dates ON absences(start_date, end_date);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Authenticated users can read employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for shifts
CREATE POLICY "Authenticated users can read shifts"
  ON shifts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create shifts"
  ON shifts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shifts"
  ON shifts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete shifts"
  ON shifts FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for absences
CREATE POLICY "Authenticated users can read absences"
  ON absences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create absences"
  ON absences FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update absences"
  ON absences FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete absences"
  ON absences FOR DELETE
  TO authenticated
  USING (true);