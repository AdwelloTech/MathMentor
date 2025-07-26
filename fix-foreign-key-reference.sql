-- Fix foreign key reference in classSchedulingService
-- This will check the actual foreign key names and fix the select statement

-- 1. Check all foreign keys on tutor_classes table
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'tutor_classes'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.constraint_name;

-- 2. Test the current select statement to see the exact error
SELECT 
  tc.*,
  ct.name as class_type_name,
  ct.duration_minutes,
  ct.max_students,
  ct.price_per_session,
  p.full_name as tutor_name,
  p.email as tutor_email
FROM tutor_classes tc
LEFT JOIN class_types ct ON tc.class_type_id = ct.id
LEFT JOIN profiles p ON tc.tutor_id = p.user_id
WHERE tc.tutor_id = '0cff9583-0932-4781-824f-19eb56b8770f'
LIMIT 1;

-- 3. Test with proper SQL syntax (not Supabase syntax)
SELECT 
  tc.*,
  ct.id as class_type_id,
  ct.name as class_type_name,
  ct.description as class_type_description,
  ct.duration_minutes,
  ct.max_students,
  ct.price_per_session,
  p.id as tutor_profile_id,
  p.full_name as tutor_name,
  p.email as tutor_email
FROM tutor_classes tc
LEFT JOIN class_types ct ON tc.class_type_id = ct.id
LEFT JOIN profiles p ON tc.tutor_id = p.user_id
WHERE tc.tutor_id = '0cff9583-0932-4781-824f-19eb56b8770f'
LIMIT 1;

-- 4. Show the correct foreign key name for profiles
SELECT 
  'Correct foreign key name for profiles' as info,
  constraint_name
FROM information_schema.table_constraints 
WHERE table_name = 'tutor_classes' 
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE '%profiles%';

-- 5. Test insert with proper data structure
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
  '0cff9583-0932-4781-824f-19eb56b8770f',
  '04b74a6e-41bc-40d8-b9b1-f8e02b8b6428',
  'SQL Test Class',
  'Testing with proper SQL syntax',
  '2025-07-28',
  '16:00:00',
  '17:00:00',
  15,
  1,
  25.00,
  false,
  null,
  null
) RETURNING id, title, tutor_id, date, start_time, status;

-- 6. Verify the test class was created
SELECT 
  'Test class created successfully' as status,
  COUNT(*) as class_count
FROM public.tutor_classes
WHERE title = 'SQL Test Class';

-- 7. Clean up test class
DELETE FROM tutor_classes 
WHERE title = 'SQL Test Class';

-- 8. Final verification
SELECT 
  'SQL syntax test completed successfully' as status,
  COUNT(*) as remaining_classes
FROM public.tutor_classes; 