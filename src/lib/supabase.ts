import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lbjzndtoxwmcaaggramp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxianpuZHRveHdtY2FhZ2dyYW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzQyMzg5MTIsImV4cCI6MTk4OTgxNDkxMn0.muBltn0Dch8hAFf7Knq_Hh4TsrmOdAFrf2fgLrLYZS0';

// Client for browser/client-side
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server client with service role (for admin operations)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxianpuZHRveHdtY2FhZ2dyYW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3NDIzODkxMiwiZXhwIjoxOTg5ODE0OTEyfQ.nzBwWAL0hCAG6CGOB7mmzHqsNjtpXpgycfgC7SqyTyg';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Types for database tables
export interface Desktop {
  id: string;
  desktop_name: string;
  desktop_type_id: string;
  branch_id?: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  specifications?: any;
  ip_address?: string;
  mac_address?: string;
  is_active: boolean;
  notes?: string;
  weekly_hours?: {
    [key: string]: {
      available: boolean;
      start?: string;
      end?: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface DesktopType {
  id: string;
  category: string;
  subcategory: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DesktopAllocation {
  id: string;
  desktop_id: string;
  student_id: string;
  allocated_by?: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'no_show';
  actual_start_time?: string;
  actual_end_time?: string;
  purpose?: string;
  notes?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingSettings {
  id: string;
  slot_duration_minutes: number;
  max_hours_per_day: number;
  max_sessions_per_day: number;
  days_ahead_booking: number;
  business_hours_start: string;
  business_hours_end: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
  updated_at: string;
}
