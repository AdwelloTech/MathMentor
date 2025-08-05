-- Tutor Notes Unique View Tracking
-- This ensures each user can only count as 1 view per tutor note

-- Create a table to track which users have viewed which notes
CREATE TABLE IF NOT EXISTS tutor_note_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID NOT NULL REFERENCES tutor_notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(note_id, user_id) -- Ensures one view per user per note
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tutor_note_views_note_user ON tutor_note_views(note_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_note_views_user ON tutor_note_views(user_id);

-- Function to increment view count only if user hasn't viewed this note before
CREATE OR REPLACE FUNCTION increment_tutor_note_view_count_unique(note_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Try to insert a new view record
    -- If the user has already viewed this note, the UNIQUE constraint will prevent insertion
    INSERT INTO tutor_note_views (note_id, user_id)
    VALUES (note_id, user_id)
    ON CONFLICT (note_id, user_id) DO NOTHING;
    
    -- Only increment the view count if a new record was actually inserted
    -- We can check this by looking at the number of rows affected
    IF FOUND THEN
        UPDATE tutor_notes 
        SET view_count = view_count + 1 
        WHERE id = note_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_tutor_note_view_count_unique(UUID, UUID) TO authenticated;
GRANT SELECT, INSERT ON tutor_note_views TO authenticated;

-- RLS policies for tutor_note_views table
ALTER TABLE tutor_note_views ENABLE ROW LEVEL SECURITY;

-- Users can only see their own view records
CREATE POLICY "Users can view their own note view records" ON tutor_note_views
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own view records
CREATE POLICY "Users can insert their own note view records" ON tutor_note_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tutors can see view records for their own notes
CREATE POLICY "Tutors can view records for their own notes" ON tutor_note_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tutor_notes 
            WHERE tutor_notes.id = tutor_note_views.note_id 
            AND tutor_notes.created_by = auth.uid()
        )
    ); 