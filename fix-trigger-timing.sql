-- =====================================================
-- FIX TRIGGER TIMING - USE AFTER INSERT
-- =====================================================

-- 1. Drop the existing trigger
DROP TRIGGER IF EXISTS auto_generate_zoom_trigger ON tutor_classes;

-- 2. Create a new trigger function that works with AFTER INSERT
CREATE OR REPLACE FUNCTION auto_generate_zoom_meeting()
RETURNS TRIGGER AS $$
DECLARE
    meeting_id TEXT;
    password TEXT;
    join_url TEXT;
    start_url TEXT;
BEGIN
    -- Only generate Zoom meeting if it doesn't already exist
    IF NEW.zoom_meeting_id IS NULL OR NEW.zoom_meeting_id = '' THEN
        -- Generate meeting ID
        meeting_id := 'meeting_' || NEW.tutor_id::text || '_' || EXTRACT(EPOCH FROM NOW())::text;
        
        -- Generate password
        password := SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8);
        
        -- Create URLs
        join_url := 'https://zoom.us/j/' || meeting_id || '?pwd=' || password;
        start_url := 'https://zoom.us/s/' || meeting_id || '?pwd=' || password;
        
        -- Update the class with Zoom details (now that it exists)
        UPDATE tutor_classes 
        SET zoom_meeting_id = meeting_id,
            zoom_password = password,
            zoom_link = join_url
        WHERE id = NEW.id;
        
        -- Insert into zoom_meetings table (now that class_id exists)
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
            NEW.tutor_id,
            NEW.id,
            meeting_id,
            password,
            join_url,
            start_url,
            NEW.title,
            NEW.duration_minutes
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger as AFTER INSERT
CREATE TRIGGER auto_generate_zoom_trigger
    AFTER INSERT ON tutor_classes
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_zoom_meeting();

-- 4. Test the trigger by inserting a class
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
    'Test Class with Fixed Trigger',
    'This class will have Zoom generated automatically after insert',
    '2025-08-02',
    '14:00:00',
    '15:00:00',
    60,
    1,
    75.00,
    'scheduled'
) RETURNING id, title, zoom_meeting_id, zoom_password, zoom_link;

-- 5. Verify the Zoom meeting was created
SELECT 
    tc.id,
    tc.title,
    tc.zoom_meeting_id,
    tc.zoom_password,
    tc.zoom_link,
    zm.meeting_id as zoom_meeting_id_from_table,
    zm.join_url as zoom_join_url_from_table
FROM tutor_classes tc
LEFT JOIN zoom_meetings zm ON tc.id = zm.class_id
WHERE tc.title = 'Test Class with Fixed Trigger'
ORDER BY tc.created_at DESC
LIMIT 1;

-- 6. Clean up test data
DELETE FROM tutor_classes WHERE title = 'Test Class with Fixed Trigger';
DELETE FROM zoom_meetings WHERE topic = 'Test Class with Fixed Trigger';

-- 7. Verify trigger is active
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'auto_generate_zoom_trigger'
  AND event_object_table = 'tutor_classes'; 