/*
  # Update RLS Policies for Public Access

  ## Overview
  Updates Row Level Security policies to allow public access (using anon key)
  instead of requiring authenticated users. This enables the application to
  work without user authentication.

  ## Changes
  1. Drop existing restrictive policies that require authentication
  2. Create new policies that allow public access for all operations
  3. Policies apply to: employees, shifts, and absences tables

  ## Security Note
  This configuration allows anyone with the anon key to access and modify data.
  Suitable for internal tools or applications where authentication is not required.
*/

-- Drop existing policies for employees
DROP POLICY IF EXISTS "Authenticated users can read employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can create employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can delete employees" ON employees;

-- Drop existing policies for shifts
DROP POLICY IF EXISTS "Authenticated users can read shifts" ON shifts;
DROP POLICY IF EXISTS "Authenticated users can create shifts" ON shifts;
DROP POLICY IF EXISTS "Authenticated users can update shifts" ON shifts;
DROP POLICY IF EXISTS "Authenticated users can delete shifts" ON shifts;

-- Drop existing policies for absences
DROP POLICY IF EXISTS "Authenticated users can read absences" ON absences;
DROP POLICY IF EXISTS "Authenticated users can create absences" ON absences;
DROP POLICY IF EXISTS "Authenticated users can update absences" ON absences;
DROP POLICY IF EXISTS "Authenticated users can delete absences" ON absences;

-- Create new public policies for employees
CREATE POLICY "Public users can read employees"
  ON employees FOR SELECT
  USING (true);

CREATE POLICY "Public users can create employees"
  ON employees FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public users can update employees"
  ON employees FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public users can delete employees"
  ON employees FOR DELETE
  USING (true);

-- Create new public policies for shifts
CREATE POLICY "Public users can read shifts"
  ON shifts FOR SELECT
  USING (true);

CREATE POLICY "Public users can create shifts"
  ON shifts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public users can update shifts"
  ON shifts FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public users can delete shifts"
  ON shifts FOR DELETE
  USING (true);

-- Create new public policies for absences
CREATE POLICY "Public users can read absences"
  ON absences FOR SELECT
  USING (true);

CREATE POLICY "Public users can create absences"
  ON absences FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public users can update absences"
  ON absences FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public users can delete absences"
  ON absences FOR DELETE
  USING (true);