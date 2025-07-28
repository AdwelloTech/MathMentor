-- Test exact data structure for class creation
-- This will help identify what data the frontend should send

-- 1. Show the exact structure expected for tutor_classes insert
SELECT 
  'Required columns for tutor_classes insert' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tutor_classes'
  AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 2. Show sample data that should work
SELECT 
  'Sample data for class creation' as info,
  '0cff9583-0932-4781-824f-19eb56b8770f' as tutor_id,
  '04b74a6e-41bc-40d8-b9b1-f8e02b8b6428' as class_type_id,
  'Test Class Title' as title,
  'Test description' as description,
  '2025-07-28' as date,
  '10:00:00' as start_time,
  '11:00:00' as end_time,
  15 as duration_minutes,
  1 as max_students,
  25.00 as price_per_session,
  false as is_recurring,
  null as recurring_pattern,
  null as recurring_end_date;

-- 3. Test insert with the exact sample data
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
  'Console Test Class',
  'Testing exact data structure',
  '2025-07-28',
  '10:00:00',
  '11:00:00',
  15,
  1,
  25.00,
  false,
  null,
  null
) RETURNING id, title, tutor_id, date, start_time, status;

-- 4. Verify the test class was created
SELECT 
  'Test class created successfully' as status,
  COUNT(*) as class_count
FROM public.tutor_classes
WHERE title = 'Console Test Class';

-- 5. Clean up test class
DELETE FROM tutor_classes 
WHERE title = 'Console Test Class';

-- 6. Final verification
SELECT 
  'Test completed - data structure is correct' as status,
  COUNT(*) as remaining_classes
FROM public.tutor_classes; 