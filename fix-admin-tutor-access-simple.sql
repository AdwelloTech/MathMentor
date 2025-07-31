-- Simple Admin Access Fix for Tutor Management
-- This script ensures admins can access tutor data without foreign key relationships

-- 1. Ensure RLS is disabled on profiles table for admin access
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Ensure RLS is disabled on tutor_applications table for admin access
ALTER TABLE tutor_applications DISABLE ROW LEVEL SECURITY;

-- 3. Ensure RLS is disabled on tutor_classes table for admin access (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tutor_classes') THEN
        ALTER TABLE tutor_classes DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 4. Ensure RLS is disabled on class_types table for admin access (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'class_types') THEN
        ALTER TABLE class_types DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 5. Ensure RLS is disabled on zoom_meetings table for admin access (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'zoom_meetings') THEN
        ALTER TABLE zoom_meetings DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 6. Grant necessary permissions to authenticated users (for admin access)
GRANT SELECT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, UPDATE, DELETE ON tutor_applications TO authenticated;

-- Grant permissions to other tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tutor_classes') THEN
        GRANT SELECT, UPDATE, DELETE ON tutor_classes TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'class_types') THEN
        GRANT SELECT ON class_types TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'zoom_meetings') THEN
        GRANT SELECT ON zoom_meetings TO authenticated;
    END IF;
END $$;

-- 7. Create indexes for better performance on tutor queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_tutor_applications_user_id ON tutor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_applications_status ON tutor_applications(application_status);

-- Create indexes for other tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tutor_classes') THEN
        CREATE INDEX IF NOT EXISTS idx_tutor_classes_tutor_id ON tutor_classes(tutor_id);
        CREATE INDEX IF NOT EXISTS idx_tutor_classes_date ON tutor_classes(date);
    END IF;
END $$; 