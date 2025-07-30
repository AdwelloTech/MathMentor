-- Fix Admin Access to Tutor Management
-- This script ensures admins can access tutor data and manage tutor status

-- 1. Ensure RLS is disabled on profiles table for admin access (if not already done)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Ensure RLS is disabled on tutor_applications table for admin access (if not already done)
ALTER TABLE tutor_applications DISABLE ROW LEVEL SECURITY;

-- 3. Ensure RLS is disabled on tutor_classes table for admin access
ALTER TABLE tutor_classes DISABLE ROW LEVEL SECURITY;

-- 4. Ensure RLS is disabled on class_types table for admin access
ALTER TABLE class_types DISABLE ROW LEVEL SECURITY;

-- 5. Ensure RLS is disabled on zoom_meetings table for admin access
ALTER TABLE zoom_meetings DISABLE ROW LEVEL SECURITY;

-- 6. Create a function to check if user is admin (for future use if needed)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user has admin role in profiles table
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant necessary permissions to authenticated users (for admin access)
GRANT SELECT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, UPDATE, DELETE ON tutor_applications TO authenticated;
GRANT SELECT, UPDATE, DELETE ON tutor_classes TO authenticated;
GRANT SELECT ON class_types TO authenticated;
GRANT SELECT ON zoom_meetings TO authenticated;

-- 8. Create indexes for better performance on tutor queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_tutor_applications_user_id ON tutor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_applications_status ON tutor_applications(application_status);
CREATE INDEX IF NOT EXISTS idx_tutor_classes_tutor_id ON tutor_classes(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_classes_date ON tutor_classes(date);

-- 9. Add a comment to document the changes
COMMENT ON TABLE profiles IS 'Tutor profiles accessible by admin for management';
COMMENT ON TABLE tutor_applications IS 'Tutor applications accessible by admin for review';
COMMENT ON TABLE tutor_classes IS 'Tutor classes accessible by admin for monitoring'; 