import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Employee = {
  id: string;
  name: string;
  position: string;
  email: string;
  active: boolean;
  created_at: string;
};

export type ShiftType = 'office' | 'remote' | 'oncall';

export type Shift = {
  id: string;
  employee_id: string;
  shift_date: string;
  shift_type: ShiftType;
  notes: string | null;
  created_at: string;
};

export type AbsenceType = 'vacation' | 'sick_leave';

export type Absence = {
  id: string;
  employee_id: string;
  absence_type: AbsenceType;
  start_date: string;
  end_date: string;
  notes: string | null;
  created_at: string;
};
