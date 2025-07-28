-- =====================================================
-- TEST COMPLETE CLASS CREATION PROCESS
-- =====================================================

-- 1. Test the generate_zoom_meeting function
SELECT 
    'Testing generate_zoom_meeting function' as test_step,
    generate_zoom_meeting(
        '0cff9583-0932-4781-824f-19eb56b8770f',
        NULL,
        'Test Class Creation',
        60
    ) as zoom_result;

-- 2. Check if the function exists and is accessible
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'generate_zoom_meeting'
  AND routine_schema = 'public';

-- 3. Test creating a class with all required fields
INSERT INTO tutor_classes (
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
    status
) VALUES (
    '0cff9583-0932-4781-824f-19eb56b8770f',
    (SELECT id FROM class_types WHERE name = 'One-to-One' LIMIT 1),
    'Test Class from App',
    'This is a test class created from the application',
    '2025-07-31',
    '14:00:00',
    '15:00:00',
    60,
    1,
    75.00,
    'scheduled'
) RETURNING id, title, tutor_id, class_type_id;

-- 4. Verify the class was created with proper relationships
SELECT 
    tc.id,
    tc.title,
    tc.tutor_id,
    tc.class_type_id,
    p.full_name as tutor_name,
    ct.name as class_type_name,
    tc.date,
    tc.start_time,
    tc.end_time,
    tc.status
FROM tutor_classes tc
LEFT JOIN profiles p ON tc.tutor_id = p.user_id
LEFT JOIN class_types ct ON tc.class_type_id = ct.id
WHERE tc.title = 'Test Class from App'
ORDER BY tc.created_at DESC
LIMIT 1;

-- 5. Test the exact query that the app uses
SELECT 
    tc.id,
    tc.title,
    tc.tutor_id,
    tc.class_type_id,
    tc.date,
    tc.start_time,
    tc.end_time,
    tc.status,
    ct.name as class_type_name,
    p.full_name as tutor_name,
    p.email as tutor_email
FROM tutor_classes tc
LEFT JOIN class_types ct ON tc.class_type_id = ct.id
LEFT JOIN profiles p ON tc.tutor_id = p.user_id
WHERE tc.tutor_id = '0cff9583-0932-4781-824f-19eb56b8770f'
  AND tc.date >= '2025-07-25'
  AND tc.status = 'scheduled'
ORDER BY tc.date ASC, tc.start_time ASC;

-- 6. Check if there are any RLS policies that might be blocking access
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('tutor_classes', 'profiles', 'class_types')
ORDER BY tablename, policyname;

-- 7. Verify the zoom_meetings table has the test data
SELECT 
    id,
    tutor_id,
    class_id,
    meeting_id,
    topic,
    join_url
FROM zoom_meetings
WHERE tutor_id = '0cff9583-0932-4781-824f-19eb56b8770f'
ORDER BY created_at DESC
LIMIT 3;

-- 8. Clean up test data
DELETE FROM tutor_classes WHERE title = 'Test Class from App';
DELETE FROM zoom_meetings WHERE topic = 'Test Class Creation'; 