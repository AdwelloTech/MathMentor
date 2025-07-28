-- =====================================================
-- FIX RPC FUNCTION FOR SUPABASE (CORRECT APPROACH)
-- =====================================================

-- 1. Drop the existing function and recreate it properly
DROP FUNCTION IF EXISTS generate_zoom_meeting(UUID, UUID, TEXT, INTEGER);

-- 2. Create the function with proper Supabase RPC exposure
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

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_zoom_meeting(UUID, UUID, TEXT, INTEGER) TO authenticated;

-- 4. Grant execute permission to anon users
GRANT EXECUTE ON FUNCTION generate_zoom_meeting(UUID, UUID, TEXT, INTEGER) TO anon;

-- 5. Test the function directly
SELECT generate_zoom_meeting(
    '0cff9583-0932-4781-824f-19eb56b8770f',
    NULL,
    'Supabase RPC Test',
    60
);

-- 6. Check if the function exists and is accessible
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'generate_zoom_meeting'
  AND routine_schema = 'public';

-- 7. Check function permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name = 'generate_zoom_meeting'
  AND routine_schema = 'public';

-- 8. Create a simple test RPC function
CREATE OR REPLACE FUNCTION test_supabase_rpc()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Supabase RPC function is working!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION test_supabase_rpc() TO authenticated;
GRANT EXECUTE ON FUNCTION test_supabase_rpc() TO anon;

-- 9. Test the simple RPC function
SELECT test_supabase_rpc();

-- 10. Check if there are any existing RPC functions for reference
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name LIKE '%rpc%'
ORDER BY routine_name; 