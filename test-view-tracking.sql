-- Test script to diagnose view tracking issues

-- 1. Check if the function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'increment_tutor_note_view_count_unique'
AND routine_schema = 'public';

-- 2. Check if the tutor_note_views table exists and has data
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'tutor_note_views'
AND table_schema = 'public';

-- 3. Check the structure of tutor_note_views table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tutor_note_views'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if there are any existing tutor notes
SELECT 
    id,
    title,
    view_count,
    created_by
FROM tutor_notes 
LIMIT 5;

-- 5. Test the function manually (replace with actual UUIDs from your data)
-- First, get a sample tutor note ID
SELECT id FROM tutor_notes LIMIT 1;

-- Then test the function (uncomment and replace UUIDs with actual values)
-- SELECT increment_tutor_note_view_count_unique('REPLACE_WITH_ACTUAL_NOTE_ID', 'REPLACE_WITH_ACTUAL_USER_ID');

-- 6. Check RLS policies on tutor_note_views
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tutor_note_views'; 