-- =====================================================
-- ALTERNATIVE ZOOM SOLUTION - USING TRIGGERS
-- =====================================================

-- 1. Create a trigger function to automatically generate Zoom meetings
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
        
        -- Update the class with Zoom details
        NEW.zoom_meeting_id := meeting_id;
        NEW.zoom_password := password;
        NEW.zoom_link := join_url;
        
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

-- 2. Create the trigger
DROP TRIGGER IF EXISTS auto_generate_zoom_trigger ON tutor_classes;
CREATE TRIGGER auto_generate_zoom_trigger
    BEFORE INSERT ON tutor_classes
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_zoom_meeting();

-- 3. Test the trigger by inserting a class
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
    'Test Class with Auto Zoom',
    'This class will have Zoom generated automatically',
    '2025-08-01',
    '10:00:00',
    '11:00:00',
    60,
    1,
    75.00,
    'scheduled'
) RETURNING id, title, zoom_meeting_id, zoom_password, zoom_link;

-- 4. Verify the Zoom meeting was created
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
WHERE tc.title = 'Test Class with Auto Zoom'
ORDER BY tc.created_at DESC
LIMIT 1;

-- 5. Clean up test data
DELETE FROM tutor_classes WHERE title = 'Test Class with Auto Zoom';
DELETE FROM zoom_meetings WHERE topic = 'Test Class with Auto Zoom';

-- 6. Create a simple function for manual Zoom generation (if needed)
CREATE OR REPLACE FUNCTION manual_generate_zoom_for_class(class_uuid UUID)
RETURNS JSON AS $$
DECLARE
    class_record RECORD;
    meeting_id TEXT;
    password TEXT;
    join_url TEXT;
    result JSON;
BEGIN
    -- Get class details
    SELECT * INTO class_record FROM tutor_classes WHERE id = class_uuid;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Class not found');
    END IF;
    
    -- Generate meeting details
    meeting_id := 'meeting_' || class_record.tutor_id::text || '_' || EXTRACT(EPOCH FROM NOW())::text;
    password := SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8);
    join_url := 'https://zoom.us/j/' || meeting_id || '?pwd=' || password;
    
    -- Update class with Zoom details
    UPDATE tutor_classes 
    SET zoom_meeting_id = meeting_id,
        zoom_password = password,
        zoom_link = join_url
    WHERE id = class_uuid;
    
    -- Insert into zoom_meetings
    INSERT INTO zoom_meetings (
        tutor_id,
        class_id,
        meeting_id,
        password,
        join_url,
        topic,
        duration_minutes
    ) VALUES (
        class_record.tutor_id,
        class_uuid,
        meeting_id,
        password,
        join_url,
        class_record.title,
        class_record.duration_minutes
    );
    
    -- Return result
    result := json_build_object(
        'meeting_id', meeting_id,
        'password', password,
        'join_url', join_url,
        'status', 'success'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION manual_generate_zoom_for_class(UUID) TO authenticated; 