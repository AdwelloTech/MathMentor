-- Reset all tutor note view counts to 0
UPDATE tutor_notes 
SET view_count = 0 
WHERE view_count > 0;

-- Also clear the unique view tracking table
DELETE FROM tutor_note_views;

-- Verify the reset
SELECT 
    id,
    title,
    view_count,
    download_count
FROM tutor_notes 
ORDER BY created_at DESC; 