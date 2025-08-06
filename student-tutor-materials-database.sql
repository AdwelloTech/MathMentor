-- =====================================================
-- STUDENT TUTOR MATERIALS ACCESS - DATABASE SETUP
-- =====================================================

-- Function to get tutor materials for students based on their booked tutors
CREATE OR REPLACE FUNCTION get_student_tutor_materials(
    p_student_id UUID,
    p_search_term TEXT DEFAULT NULL,
    p_subject_filter UUID DEFAULT NULL
)
RETURNS TABLE(
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
    grade_level_display TEXT,
    created_by UUID,
    tutor_name TEXT,
    is_premium BOOLEAN,
    is_active BOOLEAN,
    view_count INTEGER,
    download_count INTEGER,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
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
        gl.display_name as grade_level_display,
        tn.created_by,
        p.full_name as tutor_name,
        tn.is_premium,
        tn.is_active,
        tn.view_count,
        tn.download_count,
        tn.tags,
        tn.created_at,
        tn.updated_at
    FROM tutor_notes tn
    JOIN profiles p ON tn.created_by = p.user_id
    LEFT JOIN note_subjects ns ON tn.subject_id = ns.id
    LEFT JOIN grade_levels gl ON tn.grade_level_id = gl.id
    WHERE tn.is_active = true
    AND tn.created_by IN (
        -- Get all tutors the student has ever booked with
        SELECT DISTINCT tc.tutor_id
        FROM class_bookings cb
        JOIN tutor_classes tc ON cb.class_id = tc.id
        WHERE cb.student_id = p_student_id
    )
    AND (
        p_search_term IS NULL 
        OR tn.title ILIKE '%' || p_search_term || '%'
        OR tn.description ILIKE '%' || p_search_term || '%'
        OR tn.content ILIKE '%' || p_search_term || '%'
    )
    AND (
        p_subject_filter IS NULL 
        OR tn.subject_id = p_subject_filter
    )
    ORDER BY tn.created_at DESC;
END;
$$;

-- Function to check if student has premium access (gold or silver package)
CREATE OR REPLACE FUNCTION student_has_premium_access(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_package TEXT;
BEGIN
    SELECT package INTO student_package
    FROM profiles
    WHERE user_id = p_student_id;
    
    -- Return true if student has gold or silver package
    RETURN student_package IN ('gold', 'silver');
END;
$$;

-- Function to get a specific tutor material by ID for a student
CREATE OR REPLACE FUNCTION get_student_tutor_material_by_id(
    p_student_id UUID,
    p_material_id UUID
)
RETURNS TABLE(
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
    grade_level_display TEXT,
    created_by UUID,
    tutor_name TEXT,
    is_premium BOOLEAN,
    is_active BOOLEAN,
    view_count INTEGER,
    download_count INTEGER,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    has_access BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    material_record RECORD;
    has_premium_access BOOLEAN;
BEGIN
    -- Get the material details
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
        gl.display_name as grade_level_display,
        tn.created_by,
        p.full_name as tutor_name,
        tn.is_premium,
        tn.is_active,
        tn.view_count,
        tn.download_count,
        tn.tags,
        tn.created_at,
        tn.updated_at
    INTO material_record
    FROM tutor_notes tn
    JOIN profiles p ON tn.created_by = p.user_id
    LEFT JOIN note_subjects ns ON tn.subject_id = ns.id
    LEFT JOIN grade_levels gl ON tn.grade_level_id = gl.id
    WHERE tn.id = p_material_id
    AND tn.is_active = true
    AND tn.created_by IN (
        -- Get all tutors the student has ever booked with
        SELECT DISTINCT tc.tutor_id
        FROM class_bookings cb
        JOIN tutor_classes tc ON cb.class_id = tc.id
        WHERE cb.student_id = p_student_id
    );
    
    -- Check if student has access to this material
    IF material_record.is_premium THEN
        has_premium_access := student_has_premium_access(p_student_id);
    ELSE
        has_premium_access := true; -- Non-premium materials are accessible to all
    END IF;
    
    -- Return the material with access information
    RETURN QUERY
    SELECT 
        material_record.id,
        material_record.title,
        material_record.description,
        material_record.content,
        material_record.file_url,
        material_record.file_name,
        material_record.file_size,
        material_record.subject_id,
        material_record.subject_name,
        material_record.subject_display_name,
        material_record.subject_color,
        material_record.grade_level_id,
        material_record.grade_level_display,
        material_record.created_by,
        material_record.tutor_name,
        material_record.is_premium,
        material_record.is_active,
        material_record.view_count,
        material_record.download_count,
        material_record.tags,
        material_record.created_at,
        material_record.updated_at,
        has_premium_access as has_access;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_student_tutor_materials(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION student_has_premium_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_tutor_material_by_id(UUID, UUID) TO authenticated; 