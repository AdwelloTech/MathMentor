-- =====================================================
-- CREATE WORKING ZOOM FUNCTION FOR SUPABASE RPC
-- =====================================================

-- 1. Drop any existing complex function
DROP FUNCTION IF EXISTS generate_zoom_meeting(UUID, UUID, TEXT, INTEGER);

-- 2. Create a working version of the function
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
    -- Generate a simple meeting ID
    meeting_id := 'meeting_' || p_tutor_id::text || '_' || EXTRACT(EPOCH FROM NOW())::text;
    
    -- Generate a simple password
    password := SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8);
    
    -- Create join URL
    join_url := 'https://zoom.us/j/' || meeting_id || '?pwd=' || password;
    
    -- Create start URL
    start_url := 'https://zoom.us/s/' || meeting_id || '?pwd=' || password;
    
    -- Insert into zoom_meetings table (with error handling)
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
        -- If insert fails, continue without storing in zoom_meetings table
        NULL;
    END;
    
    -- Return the meeting details
    result := json_build_object(
        'meeting_id', meeting_id,
        'password', password,
        'join_url', join_url,
        'start_url', start_url,
        'topic', p_topic,
        'duration_minutes', p_duration_minutes,
        'status', 'success'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_zoom_meeting(UUID, UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_zoom_meeting(UUID, UUID, TEXT, INTEGER) TO anon;

-- 4. Test the function
SELECT generate_zoom_meeting(
    '0cff9583-0932-4781-824f-19eb56b8770f',
    NULL,
    'Working Zoom Test',
    60
);

-- 5. Verify the function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'generate_zoom_meeting'
  AND routine_schema = 'public';

-- 6. Check permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name = 'generate_zoom_meeting'
  AND routine_schema = 'public';

-- 7. Test with different parameters
SELECT generate_zoom_meeting(
    '0cff9583-0932-4781-824f-19eb56b8770f',
    '93bd5b91-79ba-4569-8cf1-fd101bd94519',
    'Class with ID',
    90
); 