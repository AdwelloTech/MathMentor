-- =====================================================
-- CHECK FUNCTION STATUS AND TEST RESULTS
-- =====================================================

-- 1. Check if generate_zoom_meeting function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'generate_zoom_meeting'
  AND routine_schema = 'public';

-- 2. Check all functions in the public schema
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name LIKE '%zoom%'
ORDER BY routine_name;

-- 3. Check function permissions for generate_zoom_meeting
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name = 'generate_zoom_meeting'
  AND routine_schema = 'public';

-- 4. Test if the function can be called directly
SELECT generate_zoom_meeting(
    '0cff9583-0932-4781-824f-19eb56b8770f',
    NULL,
    'Direct Test',
    60
);

-- 5. Check if there are any errors in the function definition
SELECT 
    proname,
    prosrc,
    proargtypes,
    prorettype
FROM pg_proc 
WHERE proname = 'generate_zoom_meeting';

-- 6. List all functions that might be related
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%meeting%' OR routine_name LIKE '%zoom%' OR routine_name LIKE '%generate%')
ORDER BY routine_name;

-- 7. Test the simple RPC function to confirm RPC is working
SELECT test_supabase_rpc();

-- 8. Check if there are any syntax errors by trying to recreate the function
CREATE OR REPLACE FUNCTION generate_zoom_meeting_simple(
    p_tutor_id UUID
)
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'meeting_id', 'test_' || p_tutor_id::text,
        'password', 'test123',
        'join_url', 'https://zoom.us/j/test',
        'status', 'success'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION generate_zoom_meeting_simple(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_zoom_meeting_simple(UUID) TO anon;

-- 9. Test the simple version
SELECT generate_zoom_meeting_simple('0cff9583-0932-4781-824f-19eb56b8770f'); 