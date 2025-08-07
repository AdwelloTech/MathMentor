-- Debug Quiz Access Issue
-- Let's trace through the exact query the quiz service is running

-- 1. Check the student's confirmed bookings
SELECT 
    cb.id as booking_id,
    cb.booking_status,
    cb.student_id,
    tc.id as class_id,
    tc.tutor_id,
    p.full_name as tutor_name
FROM class_bookings cb
JOIN tutor_classes tc ON cb.class_id = tc.id
JOIN profiles p ON tc.tutor_id = p.id
WHERE cb.student_id = 'fc4c0a94-06b5-44aa-ad16-1daf71df0142'
AND cb.booking_status = 'confirmed';

-- 2. Get the tutor IDs from those bookings (this is what the quiz service does)
SELECT DISTINCT tc.tutor_id
FROM class_bookings cb
JOIN tutor_classes tc ON cb.class_id = tc.id
WHERE cb.student_id = 'fc4c0a94-06b5-44aa-ad16-1daf71df0142'
AND cb.booking_status = 'confirmed';

-- 3. Check if there are any quizzes from those tutors
SELECT 
    q.id,
    q.title,
    q.subject,
    q.tutor_id,
    q.is_active,
    p.full_name as tutor_name
FROM quizzes q
JOIN profiles p ON q.tutor_id = p.id
WHERE q.tutor_id IN (
    SELECT DISTINCT tc.tutor_id
    FROM class_bookings cb
    JOIN tutor_classes tc ON cb.class_id = tc.id
    WHERE cb.student_id = 'fc4c0a94-06b5-44aa-ad16-1daf71df0142'
    AND cb.booking_status = 'confirmed'
)
AND q.is_active = true;

-- 4. Check all quizzes in the system
SELECT 
    q.id,
    q.title,
    q.subject,
    q.tutor_id,
    q.is_active,
    p.full_name as tutor_name
FROM quizzes q
JOIN profiles p ON q.tutor_id = p.id
ORDER BY q.created_at DESC;

-- 5. Check if the tutor IDs match between bookings and quizzes
SELECT 
    'Bookings Tutor IDs:' as source,
    tc.tutor_id,
    p.full_name
FROM class_bookings cb
JOIN tutor_classes tc ON cb.class_id = tc.id
JOIN profiles p ON tc.tutor_id = p.id
WHERE cb.student_id = 'fc4c0a94-06b5-44aa-ad16-1daf71df0142'
AND cb.booking_status = 'confirmed'

UNION ALL

SELECT 
    'Quiz Tutor IDs:' as source,
    q.tutor_id,
    p.full_name
FROM quizzes q
JOIN profiles p ON q.tutor_id = p.id
WHERE q.is_active = true; 