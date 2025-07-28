-- Debug class creation issues
-- This will help identify what's causing the "Failed to create class" error

-- 1. Check if all required tables exist and have correct structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('tutor_classes', 'class_types', 'profiles')
ORDER BY table_name, ordinal_position;

-- 2. Check if there are any constraints that might be blocking inserts
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'tutor_classes'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 3. Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tutor_classes';

-- 4. Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tutor_classes';

-- 5. Test manual insert with sample data
-- First, get a valid tutor_id and class_type_id
SELECT 
  'Available tutor_id' as info,
  user_id,
  full_name,
  role
FROM profiles 
WHERE role = 'tutor'
LIMIT 3;

SELECT 
  'Available class_type_id' as info,
  id,
  name,
  duration_minutes,
  max_students,
  price_per_session
FROM class_types
LIMIT 3;

-- 6. Test insert with actual data from your system
INSERT INTO public.tutor_classes (
  tutor_id,
  class_type_id,
  title,
  description,
  date,
  start_time,
  end_time,
  duration_minutes,
  max_students,
  price_per_session,
  is_recurring,
  recurring_pattern,
  recurring_end_date
) VALUES (
  '0cff9583-0932-4781-824f-19eb56b8770f', -- your tutor_id
  (SELECT id FROM class_types WHERE name = 'One-to-One' LIMIT 1), -- get One-to-One class type
  'Debug Test Class',
  'Testing class creation from debug script',
  '2025-07-27',
  '14:00:00',
  '15:00:00',
  60,
  1,
  50.00,
  false,
  null,
  null
) RETURNING id, title, tutor_id, date, start_time, status;

-- 7. Check if the test class was created
SELECT 
  'Test class created successfully' as status,
  COUNT(*) as class_count
FROM public.tutor_classes
WHERE title = 'Debug Test Class';

-- 8. Show the test class details
SELECT 
  id,
  title,
  tutor_id,
  class_type_id,
  date,
  start_time,
  end_time,
  duration_minutes,
  max_students,
  price_per_session,
  status,
  created_at
FROM public.tutor_classes
WHERE title = 'Debug Test Class';

-- 9. Check if trigger fired and created zoom meeting
SELECT 
  'Zoom meeting created by trigger' as status,
  COUNT(*) as zoom_count
FROM zoom_meetings
WHERE class_id IN (
  SELECT id FROM tutor_classes WHERE title = 'Debug Test Class'
);

-- 10. Show zoom meeting details
SELECT 
  zm.id,
  zm.tutor_id,
  zm.class_id,
  zm.meeting_id,
  zm.topic,
  zm.join_url,
  zm.created_at
FROM zoom_meetings zm
JOIN tutor_classes tc ON zm.class_id = tc.id
WHERE tc.title = 'Debug Test Class';

-- 11. Clean up test data
DELETE FROM zoom_meetings 
WHERE class_id IN (
  SELECT id FROM tutor_classes WHERE title = 'Debug Test Class'
);

DELETE FROM tutor_classes 
WHERE title = 'Debug Test Class';

-- 12. Final verification
SELECT 
  'Debug test completed - test data cleaned up' as status,
  COUNT(*) as remaining_classes
FROM public.tutor_classes; 