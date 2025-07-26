-- =====================================================
-- FIX ZOOM FUNCTION AND RELATIONSHIPS
-- =====================================================

-- 1. Create the missing generate_zoom_meeting function
CREATE OR REPLACE FUNCTION generate_zoom_meeting(
    p_tutor_id UUID,
    p_class_id UUID DEFAULT NULL,
    p_topic TEXT DEFAULT 'Tutor Class',
    p_duration_minutes INTEGER DEFAULT 60
)
RETURNS JSON AS $$
DECLARE
    meeting_id TEXT;
    password TEXT;
    join_url TEXT;
    start_url TEXT;
    result JSON;
BEGIN
    -- Generate a simple meeting ID (in production, this would call Zoom API)
    meeting_id := 'meeting_' || p_tutor_id::text || '_' || EXTRACT(EPOCH FROM NOW())::text;
    
    -- Generate a simple password
    password := SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8);
    
    -- Create join URL (in production, this would be from Zoom API)
    join_url := 'https://zoom.us/j/' || meeting_id || '?pwd=' || password;
    
    -- Create start URL (in production, this would be from Zoom API)
    start_url := 'https://zoom.us/s/' || meeting_id || '?pwd=' || password;
    
    -- Insert into zoom_meetings table
    INSERT INTO zoom_meetings (
        tutor_id,
        class_id,
        meeting_id,
        password,
        join_url,
        start_url,
        topic,
        duration_minutes
    ) VALUES (
        p_tutor_id,
        p_class_id,
        meeting_id,
        password,
        join_url,
        start_url,
        p_topic,
        p_duration_minutes
    );
    
    -- Return the meeting details
    result := json_build_object(
        'meeting_id', meeting_id,
        'password', password,
        'join_url', join_url,
        'start_url', start_url,
        'topic', p_topic,
        'duration_minutes', p_duration_minutes
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION generate_zoom_meeting(UUID, UUID, TEXT, INTEGER) TO authenticated;

-- 3. Check and fix any remaining foreign key issues
-- First, let's check if there are any invalid tutor_id values
SELECT 
    COUNT(*) as total_classes,
    COUNT(CASE WHEN tutor_id IS NULL THEN 1 END) as null_tutor_ids,
    COUNT(CASE WHEN tutor_id NOT IN (SELECT user_id FROM profiles) THEN 1 END) as invalid_tutor_ids
FROM tutor_classes;

-- 4. Check if there are any invalid class_type_id values
SELECT 
    COUNT(*) as total_classes,
    COUNT(CASE WHEN class_type_id IS NULL THEN 1 END) as null_class_type_ids,
    COUNT(CASE WHEN class_type_id NOT IN (SELECT id FROM class_types) THEN 1 END) as invalid_class_type_ids
FROM tutor_classes;

-- 5. Ensure the foreign key constraints are properly set up
-- Drop and recreate the tutor_id foreign key
ALTER TABLE tutor_classes 
DROP CONSTRAINT IF EXISTS tutor_classes_tutor_id_fkey;

ALTER TABLE tutor_classes 
ADD CONSTRAINT tutor_classes_tutor_id_fkey 
FOREIGN KEY (tutor_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Drop and recreate the class_type_id foreign key
ALTER TABLE tutor_classes 
DROP CONSTRAINT IF EXISTS tutor_classes_class_type_id_fkey;

ALTER TABLE tutor_classes 
ADD CONSTRAINT tutor_classes_class_type_id_fkey 
FOREIGN KEY (class_type_id) REFERENCES class_types(id) ON DELETE CASCADE;

-- 6. Test the generate_zoom_meeting function
SELECT generate_zoom_meeting(
    '0cff9583-0932-4781-824f-19eb56b8770f',
    NULL,
    'Test Class',
    60
);

-- 7. Verify all foreign key constraints
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'tutor_classes'
ORDER BY kcu.column_name;

-- 8. Test a simple insert to verify everything works
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
    (SELECT id FROM class_types LIMIT 1),
    'Test Class',
    'Test Description',
    '2025-07-30',
    '10:00:00',
    '11:00:00',
    60,
    5,
    50.00,
    'scheduled'
) ON CONFLICT DO NOTHING;

-- 9. Clean up test data
DELETE FROM tutor_classes WHERE title = 'Test Class'; 