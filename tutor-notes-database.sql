-- Tutor Notes Database Schema
-- This creates a new table for tutor-created study materials with premium functionality

-- Create tutor_notes table
CREATE TABLE public.tutor_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT, -- For text-based notes
    file_url TEXT, -- For uploaded files (PDFs, etc.)
    file_name TEXT, -- Original filename
    file_size INTEGER, -- File size in bytes
    subject_id UUID REFERENCES public.note_subjects(id) ON DELETE SET NULL,
    grade_level_id UUID REFERENCES public.grade_levels(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    is_premium BOOLEAN DEFAULT false, -- Premium content flag
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX tutor_notes_created_by_idx ON public.tutor_notes(created_by);
CREATE INDEX tutor_notes_subject_id_idx ON public.tutor_notes(subject_id);
CREATE INDEX tutor_notes_is_premium_idx ON public.tutor_notes(is_premium);
CREATE INDEX tutor_notes_is_active_idx ON public.tutor_notes(is_active);
CREATE INDEX tutor_notes_created_at_idx ON public.tutor_notes(created_at);

-- Create RLS policies for tutor_notes
ALTER TABLE public.tutor_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Tutors can view their own notes
CREATE POLICY "Tutors can view their own notes" ON public.tutor_notes
    FOR SELECT USING (auth.uid() = created_by);

-- Policy: Tutors can insert their own notes
CREATE POLICY "Tutors can insert their own notes" ON public.tutor_notes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Tutors can update their own notes
CREATE POLICY "Tutors can update their own notes" ON public.tutor_notes
    FOR UPDATE USING (auth.uid() = created_by);

-- Policy: Tutors can delete their own notes
CREATE POLICY "Tutors can delete their own notes" ON public.tutor_notes
    FOR DELETE USING (auth.uid() = created_by);

-- Policy: Students can view non-premium notes
CREATE POLICY "Students can view non-premium notes" ON public.tutor_notes
    FOR SELECT USING (
        is_active = true AND 
        is_premium = false
    );

-- Policy: Premium students can view premium notes
-- This will be enhanced later with package checking
CREATE POLICY "Premium students can view premium notes" ON public.tutor_notes
    FOR SELECT USING (
        is_active = true AND 
        is_premium = true
    );

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_tutor_note_view_count(note_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.tutor_notes 
    SET view_count = view_count + 1 
    WHERE id = note_id;
END;
$$;

-- Create function to increment download count
CREATE OR REPLACE FUNCTION increment_tutor_note_download_count(note_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.tutor_notes 
    SET download_count = download_count + 1 
    WHERE id = note_id;
END;
$$;

-- Create function to search tutor notes
CREATE OR REPLACE FUNCTION search_tutor_notes(
    search_term TEXT DEFAULT '',
    subject_filter UUID DEFAULT NULL,
    premium_only BOOLEAN DEFAULT false,
    tutor_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    content TEXT,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    subject_id UUID,
    subject_name TEXT,
    subject_display_name TEXT,
    subject_color TEXT,
    grade_level_id UUID,
    grade_level_code TEXT,
    grade_level_display TEXT,
    created_by UUID,
    is_premium BOOLEAN,
    view_count INTEGER,
    download_count INTEGER,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tn.id,
        tn.title,
        tn.description,
        tn.content,
        tn.file_url,
        tn.file_name,
        tn.file_size,
        tn.subject_id,
        ns.name as subject_name,
        ns.display_name as subject_display_name,
        ns.color as subject_color,
        tn.grade_level_id,
        gl.code as grade_level_code,
        gl.display_name as grade_level_display,
        tn.created_by,
        tn.is_premium,
        tn.view_count,
        tn.download_count,
        tn.tags,
        tn.created_at
    FROM public.tutor_notes tn
    LEFT JOIN public.note_subjects ns ON tn.subject_id = ns.id
    LEFT JOIN public.grade_levels gl ON tn.grade_level_id = gl.id
    WHERE tn.is_active = true
        AND (search_term = '' OR 
             tn.title ILIKE '%' || search_term || '%' OR 
             tn.description ILIKE '%' || search_term || '%' OR
             tn.content ILIKE '%' || search_term || '%')
        AND (subject_filter IS NULL OR tn.subject_id = subject_filter)
        AND (NOT premium_only OR tn.is_premium = true)
        AND (tutor_id IS NULL OR tn.created_by = tutor_id)
    ORDER BY tn.created_at DESC;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.tutor_notes TO authenticated;
GRANT EXECUTE ON FUNCTION increment_tutor_note_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_tutor_note_download_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_tutor_notes(TEXT, UUID, BOOLEAN, UUID) TO authenticated; 