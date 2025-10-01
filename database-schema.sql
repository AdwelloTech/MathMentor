-- ===========================================
-- MATHMENTOR DATABASE SCHEMA
-- Complete SQL setup for Supabase project
-- ===========================================

-- ===========================================
-- 1. PROFILES TABLE (Main user profiles)
-- ===========================================

-- Profiles table
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'principal', 'teacher', 'student', 'parent', 'hr', 'finance', 'support')),
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  emergency_contact TEXT,
  student_id TEXT UNIQUE,
  package TEXT CHECK (package IN ('free', 'silver', 'gold')),
  enrollment_date DATE,
  class_id UUID,
  employee_id TEXT UNIQUE,
  department TEXT,
  subjects TEXT[],
  qualification TEXT,
  experience_years INTEGER,
  children_ids UUID[],
  relationship TEXT,
  hire_date DATE,
  salary DECIMAL,
  position TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- ===========================================
-- 2. FLASHCARD TABLES
-- ===========================================

create table if not exists public.flashcard_sets (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subject text not null,
  topic text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.flashcard_sets(id) on delete cascade,
  front_text text not null,
  back_text text not null,
  card_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_flashcard_sets_tutor on public.flashcard_sets(tutor_id);
create index if not exists idx_flashcards_set on public.flashcards(set_id);

-- ===========================================
-- 3. TUTORIAL SYSTEM MIGRATION
-- ===========================================

-- Migration: Add tutorial system fields to profiles table
-- These fields track tutorial completion, dismissals, and display logic

-- Add the tutorial_completed column with a default value of false
ALTER TABLE profiles
ADD COLUMN tutorial_completed BOOLEAN DEFAULT FALSE;

-- Add tutorial_dismissed_count to track how many times user dismissed tutorial
ALTER TABLE profiles
ADD COLUMN tutorial_dismissed_count INTEGER DEFAULT 0;

-- Add tutorial_last_shown to track when tutorial was last displayed
ALTER TABLE profiles
ADD COLUMN tutorial_last_shown TIMESTAMP WITH TIME ZONE;

-- Update existing users to have tutorial_completed = false
-- This ensures all existing users will see the tutorial on their next visit
UPDATE profiles
SET tutorial_completed = FALSE
WHERE tutorial_completed IS NULL;

-- Add comments to document the fields
COMMENT ON COLUMN profiles.tutorial_completed IS 'Indicates whether the user has completed the onboarding tutorial';
COMMENT ON COLUMN profiles.tutorial_dismissed_count IS 'Number of times user has dismissed the tutorial';
COMMENT ON COLUMN profiles.tutorial_last_shown IS 'Timestamp when tutorial was last shown to user';

-- ===========================================
-- 4. VERIFICATION QUERY
-- ===========================================

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('tutorial_completed', 'tutorial_dismissed_count', 'tutorial_last_shown')
ORDER BY column_name;

-- ===========================================
-- SETUP INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > SQL Editor > New Query
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- 4. The profiles table will be created for user authentication
-- 5. Flashcard tables will be available for the flashcard system
-- 6. Tutorial fields will be added to track user onboarding
-- ===========================================
