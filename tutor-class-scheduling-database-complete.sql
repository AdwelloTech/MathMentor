-- =====================================================
-- TUTOR CLASS SCHEDULING SYSTEM - COMPLETE DATABASE SCHEMA
-- =====================================================

-- =====================================================
-- 1. TABLES (Already exist in your database)
-- =====================================================

-- Note: These tables already exist in your database with the structure shown below
-- class_types, tutor_classes, class_bookings, tutor_availability, zoom_meetings, class_reviews

-- =====================================================
-- 2. FUNCTIONS
-- =====================================================

-- Function to generate Zoom meeting links
CREATE OR REPLACE FUNCTION generate_zoom_meeting()
RETURNS TABLE(meeting_id TEXT, password TEXT, join_url TEXT) AS $$
DECLARE
    new_meeting_id TEXT;
    new_password TEXT;
    new_join_url TEXT;
BEGIN
    -- Generate a random 9-digit meeting ID
    new_meeting_id := LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0');
    
    -- Generate a random 6-character password
    new_password := SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
    
    -- Create the join URL
    new_join_url := 'https://zoom.us/j/' || new_meeting_id || '?pwd=' || new_password;
    
    RETURN QUERY SELECT new_meeting_id, new_password, new_join_url;
END;
$$ LANGUAGE plpgsql;

-- Function to check tutor availability
CREATE OR REPLACE FUNCTION check_tutor_availability(
    p_tutor_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
    conflicting_classes INTEGER;
BEGIN
    -- Check for conflicting classes
    SELECT COUNT(*) INTO conflicting_classes
    FROM tutor_classes
    WHERE tutor_id = p_tutor_id
      AND date = p_date
      AND status IN ('scheduled', 'in_progress')
      AND (
          (start_time <= p_start_time AND end_time > p_start_time) OR
          (start_time < p_end_time AND end_time >= p_end_time) OR
          (start_time >= p_start_time AND end_time <= p_end_time)
      );
    
    RETURN conflicting_classes = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get tutor's upcoming classes
CREATE OR REPLACE FUNCTION get_tutor_upcoming_classes(p_tutor_id UUID)
RETURNS TABLE(
    class_id UUID,
    title TEXT,
    date DATE,
    start_time TIME,
    end_time TIME,
    class_type_name TEXT,
    status TEXT,
    current_students INTEGER,
    max_students INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.id,
        tc.title,
        tc.date,
        tc.start_time,
        tc.end_time,
        ct.name,
        tc.status,
        tc.current_students,
        tc.max_students
    FROM tutor_classes tc
    JOIN class_types ct ON tc.class_type_id = ct.id
    WHERE tc.tutor_id = p_tutor_id
      AND tc.date >= CURRENT_DATE
      AND tc.status IN ('scheduled', 'in_progress')
    ORDER BY tc.date ASC, tc.start_time ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get student's booked classes
CREATE OR REPLACE FUNCTION get_student_booked_classes(p_student_id UUID)
RETURNS TABLE(
    booking_id UUID,
    class_id UUID,
    class_title TEXT,
    tutor_name TEXT,
    date DATE,
    start_time TIME,
    end_time TIME,
    class_type_name TEXT,
    status TEXT,
    zoom_link TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cb.id,
        cb.class_id,
        tc.title,
        p.full_name,
        tc.date,
        tc.start_time,
        tc.end_time,
        ct.name,
        cb.status,
        tc.zoom_link
    FROM class_bookings cb
    JOIN tutor_classes tc ON cb.class_id = tc.id
    JOIN class_types ct ON tc.class_type_id = ct.id
    JOIN profiles p ON tc.tutor_id = p.user_id
    WHERE cb.student_id = p_student_id
      AND tc.date >= CURRENT_DATE
    ORDER BY tc.date ASC, tc.start_time ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get tutor dashboard stats
CREATE OR REPLACE FUNCTION get_tutor_dashboard_stats(p_tutor_id UUID)
RETURNS TABLE(
    total_classes INTEGER,
    upcoming_classes INTEGER,
    completed_classes INTEGER,
    total_earnings DECIMAL(10,2),
    total_students INTEGER,
    average_rating DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(tc.id)::INTEGER as total_classes,
        COUNT(CASE WHEN tc.date >= CURRENT_DATE AND tc.status IN ('scheduled', 'in_progress') THEN 1 END)::INTEGER as upcoming_classes,
        COUNT(CASE WHEN tc.status = 'completed' THEN 1 END)::INTEGER as completed_classes,
        COALESCE(SUM(CASE WHEN tc.status = 'completed' THEN tc.price_per_session ELSE 0 END), 0) as total_earnings,
        COUNT(DISTINCT cb.student_id)::INTEGER as total_students,
        COALESCE(AVG(cr.rating), 0) as average_rating
    FROM tutor_classes tc
    LEFT JOIN class_bookings cb ON tc.id = cb.class_id
    LEFT JOIN class_reviews cr ON tc.id = cr.class_id
    WHERE tc.tutor_id = p_tutor_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. TRIGGERS
-- =====================================================

-- Trigger to automatically generate Zoom link when class is created
CREATE OR REPLACE FUNCTION auto_generate_zoom_link()
RETURNS TRIGGER AS $$
DECLARE
    zoom_data RECORD;
BEGIN
    -- Generate Zoom meeting details
    SELECT * INTO zoom_data FROM generate_zoom_meeting();
    
    -- Update the new record with Zoom details
    NEW.zoom_meeting_id := zoom_data.meeting_id;
    NEW.zoom_password := zoom_data.password;
    NEW.zoom_link := zoom_data.join_url;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tutor_classes table
DROP TRIGGER IF EXISTS trigger_auto_generate_zoom_link ON tutor_classes;
CREATE TRIGGER trigger_auto_generate_zoom_link
    BEFORE INSERT ON tutor_classes
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_zoom_link();

-- Trigger to update current_students count
CREATE OR REPLACE FUNCTION update_current_students_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tutor_classes 
        SET current_students = current_students + 1
        WHERE id = NEW.class_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tutor_classes 
        SET current_students = current_students - 1
        WHERE id = OLD.class_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for class_bookings table
DROP TRIGGER IF EXISTS trigger_update_current_students ON class_bookings;
CREATE TRIGGER trigger_update_current_students
    AFTER INSERT OR DELETE ON class_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_current_students_count();

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE class_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoom_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_reviews ENABLE ROW LEVEL SECURITY;

-- Class Types Policies (Read-only for all authenticated users)
DROP POLICY IF EXISTS "Class types are viewable by all authenticated users" ON class_types;
CREATE POLICY "Class types are viewable by all authenticated users" ON class_types
    FOR SELECT USING (auth.role() = 'authenticated');

-- Tutor Classes Policies
DROP POLICY IF EXISTS "Tutors can view their own classes" ON tutor_classes;
CREATE POLICY "Tutors can view their own classes" ON tutor_classes
    FOR SELECT USING (auth.uid()::TEXT = tutor_id::TEXT);

DROP POLICY IF EXISTS "Tutors can insert their own classes" ON tutor_classes;
CREATE POLICY "Tutors can insert their own classes" ON tutor_classes
    FOR INSERT WITH CHECK (auth.uid()::TEXT = tutor_id::TEXT);

DROP POLICY IF EXISTS "Tutors can update their own classes" ON tutor_classes;
CREATE POLICY "Tutors can update their own classes" ON tutor_classes
    FOR UPDATE USING (auth.uid()::TEXT = tutor_id::TEXT);

DROP POLICY IF EXISTS "Tutors can delete their own classes" ON tutor_classes;
CREATE POLICY "Tutors can delete their own classes" ON tutor_classes
    FOR DELETE USING (auth.uid()::TEXT = tutor_id::TEXT);

-- Students can view available classes
DROP POLICY IF EXISTS "Students can view available classes" ON tutor_classes;
CREATE POLICY "Students can view available classes" ON tutor_classes
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        status IN ('scheduled', 'in_progress') AND 
        current_students < max_students
    );

-- Class Bookings Policies
DROP POLICY IF EXISTS "Students can view their own bookings" ON class_bookings;
CREATE POLICY "Students can view their own bookings" ON class_bookings
    FOR SELECT USING (auth.uid()::TEXT = student_id::TEXT);

DROP POLICY IF EXISTS "Students can insert their own bookings" ON class_bookings;
CREATE POLICY "Students can insert their own bookings" ON class_bookings
    FOR INSERT WITH CHECK (auth.uid()::TEXT = student_id::TEXT);

DROP POLICY IF EXISTS "Students can update their own bookings" ON class_bookings;
CREATE POLICY "Students can update their own bookings" ON class_bookings
    FOR UPDATE USING (auth.uid()::TEXT = student_id::TEXT);

DROP POLICY IF EXISTS "Students can delete their own bookings" ON class_bookings;
CREATE POLICY "Students can delete their own bookings" ON class_bookings
    FOR DELETE USING (auth.uid()::TEXT = student_id::TEXT);

-- Tutors can view bookings for their classes
DROP POLICY IF EXISTS "Tutors can view bookings for their classes" ON class_bookings;
CREATE POLICY "Tutors can view bookings for their classes" ON class_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tutor_classes tc 
            WHERE tc.id = class_bookings.class_id 
            AND tc.tutor_id::TEXT = auth.uid()::TEXT
        )
    );

-- Tutor Availability Policies
DROP POLICY IF EXISTS "Tutors can manage their own availability" ON tutor_availability;
CREATE POLICY "Tutors can manage their own availability" ON tutor_availability
    FOR ALL USING (auth.uid()::TEXT = tutor_id::TEXT);

-- Zoom Meetings Policies
DROP POLICY IF EXISTS "Tutors can view their own zoom meetings" ON zoom_meetings;
CREATE POLICY "Tutors can view their own zoom meetings" ON zoom_meetings
    FOR SELECT USING (auth.uid()::TEXT = tutor_id::TEXT);

DROP POLICY IF EXISTS "Tutors can manage their own zoom meetings" ON zoom_meetings;
CREATE POLICY "Tutors can manage their own zoom meetings" ON zoom_meetings
    FOR ALL USING (auth.uid()::TEXT = tutor_id::TEXT);

-- Class Reviews Policies
DROP POLICY IF EXISTS "Students can view reviews for classes they attended" ON class_reviews;
CREATE POLICY "Students can view reviews for classes they attended" ON class_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM class_bookings cb 
            WHERE cb.class_id = class_reviews.class_id 
            AND cb.student_id::TEXT = auth.uid()::TEXT
        )
    );

DROP POLICY IF EXISTS "Students can create reviews for classes they attended" ON class_reviews;
CREATE POLICY "Students can create reviews for classes they attended" ON class_reviews
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM class_bookings cb 
            WHERE cb.class_id = class_reviews.class_id 
            AND cb.student_id::TEXT = auth.uid()::TEXT
            AND cb.status = 'completed'
        )
    );

DROP POLICY IF EXISTS "Students can update their own reviews" ON class_reviews;
CREATE POLICY "Students can update their own reviews" ON class_reviews
    FOR UPDATE USING (auth.uid()::TEXT = student_id::TEXT);

DROP POLICY IF EXISTS "Students can delete their own reviews" ON class_reviews;
CREATE POLICY "Students can delete their own reviews" ON class_reviews
    FOR DELETE USING (auth.uid()::TEXT = student_id::TEXT);

-- Tutors can view reviews for their classes
DROP POLICY IF EXISTS "Tutors can view reviews for their classes" ON class_reviews;
CREATE POLICY "Tutors can view reviews for their classes" ON class_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tutor_classes tc 
            WHERE tc.id = class_reviews.class_id 
            AND tc.tutor_id::TEXT = auth.uid()::TEXT
        )
    );

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for tutor_classes table
CREATE INDEX IF NOT EXISTS idx_tutor_classes_tutor_id ON tutor_classes(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_classes_date ON tutor_classes(date);
CREATE INDEX IF NOT EXISTS idx_tutor_classes_status ON tutor_classes(status);
CREATE INDEX IF NOT EXISTS idx_tutor_classes_class_type_id ON tutor_classes(class_type_id);
CREATE INDEX IF NOT EXISTS idx_tutor_classes_tutor_date ON tutor_classes(tutor_id, date);

-- Indexes for class_bookings table
CREATE INDEX IF NOT EXISTS idx_class_bookings_student_id ON class_bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_class_id ON class_bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_status ON class_bookings(status);

-- Indexes for tutor_availability table
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor_id ON tutor_availability(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_date ON tutor_availability(date);

-- Indexes for class_reviews table
CREATE INDEX IF NOT EXISTS idx_class_reviews_class_id ON class_reviews(class_id);
CREATE INDEX IF NOT EXISTS idx_class_reviews_student_id ON class_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_class_reviews_tutor_id ON class_reviews(tutor_id);

-- =====================================================
-- 6. SAMPLE DATA (Optional - you already have data)
-- =====================================================

-- Note: You already have sample data in your database
-- The following are examples of how to insert additional data if needed

/*
-- Insert additional class types if needed
INSERT INTO class_types (id, name, description, duration_minutes, max_students, is_active, price_per_session) 
VALUES 
    (gen_random_uuid(), 'Test Prep', 'Standardized test preparation', 60, 5, true, 60.00),
    (gen_random_uuid(), 'Homework Help', 'General homework assistance', 45, 3, true, 40.00);

-- Insert sample tutor availability
INSERT INTO tutor_availability (id, tutor_id, date, start_time, end_time, is_available)
VALUES 
    (gen_random_uuid(), '0cff9583-0932-4781-824f-19eb56b8770f', '2025-07-26', '09:00:00', '17:00:00', true),
    (gen_random_uuid(), '0cff9583-0932-4781-824f-19eb56b8770f', '2025-07-27', '10:00:00', '18:00:00', true);
*/

-- =====================================================
-- 7. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for available classes
CREATE OR REPLACE VIEW available_classes AS
SELECT 
    tc.id,
    tc.title,
    tc.description,
    tc.date,
    tc.start_time,
    tc.end_time,
    tc.duration_minutes,
    tc.price_per_session,
    tc.current_students,
    tc.max_students,
    tc.zoom_link,
    ct.name as class_type_name,
    ct.description as class_type_description,
    p.full_name as tutor_name,
    p.profile_image_url as tutor_image
FROM tutor_classes tc
JOIN class_types ct ON tc.class_type_id = ct.id
JOIN profiles p ON tc.tutor_id = p.user_id
WHERE tc.status IN ('scheduled', 'in_progress')
  AND tc.current_students < tc.max_students
  AND tc.date >= CURRENT_DATE
ORDER BY tc.date ASC, tc.start_time ASC;

-- View for tutor dashboard summary
CREATE OR REPLACE VIEW tutor_dashboard_summary AS
SELECT 
    tc.tutor_id,
    p.full_name as tutor_name,
    COUNT(tc.id) as total_classes,
    COUNT(CASE WHEN tc.date >= CURRENT_DATE AND tc.status IN ('scheduled', 'in_progress') THEN 1 END) as upcoming_classes,
    COUNT(CASE WHEN tc.status = 'completed' THEN 1 END) as completed_classes,
    COALESCE(SUM(CASE WHEN tc.status = 'completed' THEN tc.price_per_session ELSE 0 END), 0) as total_earnings,
    COUNT(DISTINCT cb.student_id) as total_students,
    COALESCE(AVG(cr.rating), 0) as average_rating
FROM tutor_classes tc
JOIN profiles p ON tc.tutor_id = p.user_id
LEFT JOIN class_bookings cb ON tc.id = cb.class_id
LEFT JOIN class_reviews cr ON tc.id = cr.class_id
GROUP BY tc.tutor_id, p.full_name;

-- =====================================================
-- 8. GRANTS (if using custom roles)
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT ON class_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tutor_classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON class_bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tutor_availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON zoom_meetings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON class_reviews TO authenticated;

-- Grant permissions to views
GRANT SELECT ON available_classes TO authenticated;
GRANT SELECT ON tutor_dashboard_summary TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This completes the database setup for the tutor class scheduling system
-- All tables, functions, triggers, policies, and indexes are now in place
-- The system is ready to handle class scheduling, bookings, and reviews 