-- Create profile for existing student user
-- User ID: 169ee138-e9fa-4483-b588-338e3a881b14
-- Email: nithila7777+student@gmail.com

INSERT INTO profiles (
  id,
  user_id,
  first_name,
  last_name,
  full_name,
  role,
  package,
  is_active,
  has_learning_disabilities,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '169ee138-e9fa-4483-b588-338e3a881b14',
  'Student',
  'User',
  'Student User',
  'student',
  'free',
  true,
  false,
  NOW(),
  NOW()
);

-- Verify the profile was created
SELECT user_id, full_name, role, package, created_at
FROM profiles
WHERE user_id = '169ee138-e9fa-4483-b588-338e3a881b14';
