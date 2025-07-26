-- =====================================================
-- FIX MISSING COLUMNS AND RPC ISSUES
-- =====================================================

-- 1. First, let's check what columns currently exist in tutor_classes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tutor_classes'
ORDER BY ordinal_position;

-- 2. Add missing columns that the app is expecting
ALTER TABLE tutor_classes 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_pattern TEXT,
ADD COLUMN IF NOT EXISTS recurring_end_date DATE;

-- 3. Check if there are any other missing columns by looking at the error
-- The error mentions 'recurring_end_date' - let's verify it was added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tutor_classes'
  AND column_name IN ('is_recurring', 'recurring_pattern', 'recurring_end_date')
ORDER BY column_name;

-- 4. Update existing records to have default values
UPDATE tutor_classes 
SET is_recurring = false,
    recurring_pattern = NULL,
    recurring_end_date = NULL
WHERE is_recurring IS NULL;

-- 5. Test inserting a class to make sure the trigger works with new columns
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
    status,
    is_recurring,
    recurring_pattern,
    recurring_end_date
) VALUES (
    '0cff9583-0932-4781-824f-19eb56b8770f',
    (SELECT id FROM class_types WHERE name = 'One-to-One' LIMIT 1),
    'Test Class with All Columns',
    'Testing all required columns',
    '2025-08-03',
    '16:00:00',
    '17:00:00',
    60,
    1,
    75.00,
    'scheduled',
    false,
    NULL,
    NULL
) RETURNING id, title, zoom_meeting_id, zoom_password, zoom_link, is_recurring;

-- 6. Verify the class was created with Zoom details
SELECT 
    tc.id,
    tc.title,
    tc.zoom_meeting_id,
    tc.zoom_password,
    tc.zoom_link,
    tc.is_recurring,
    tc.recurring_pattern,
    tc.recurring_end_date,
    zm.meeting_id as zoom_meeting_id_from_table
FROM tutor_classes tc
LEFT JOIN zoom_meetings zm ON tc.id = zm.class_id
WHERE tc.title = 'Test Class with All Columns'
ORDER BY tc.created_at DESC
LIMIT 1;

-- 7. Clean up test data
DELETE FROM tutor_classes WHERE title = 'Test Class with All Columns';
DELETE FROM zoom_meetings WHERE topic = 'Test Class with All Columns';

-- 8. Show final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tutor_classes'
ORDER BY ordinal_position; 