-- Test frontend service access
-- This will help identify if the issue is with data access

-- 1. Test if the frontend can read class types
SELECT 
  'Class types accessible' as test,
  COUNT(*) as count
FROM class_types
WHERE is_active = true;

-- 2. Test if the frontend can read existing classes
SELECT 
  'Existing classes accessible' as test,
  COUNT(*) as count
FROM tutor_classes;

-- 3. Test the exact query the frontend uses
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
ORDER BY tc.date ASC, tc.start_time ASC;

-- 4. Test if we can get class type by ID
SELECT 
  'Class type by ID test' as test,
  id,
  name,
  duration_minutes,
  max_students,
  price_per_session
FROM class_types
WHERE id = (SELECT id FROM class_types WHERE name = 'One-to-One' LIMIT 1);

-- 5. Show all available class types for frontend
SELECT 
  'Available class types for frontend' as info,
  id,
  name,
  description,
  duration_minutes,
  max_students,
  price_per_session,
  is_active
FROM class_types
WHERE is_active = true
ORDER BY name; 