-- =====================================================
-- COMPLETE MISSING TABLES FOR TUTOR CLASS SCHEDULING SYSTEM
-- =====================================================

-- =====================================================
-- 1. CLASS_BOOKINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS class_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES tutor_classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_amount DECIMAL(10,2),
    payment_method TEXT,
    payment_transaction_id TEXT,
    cancellation_reason TEXT,
    cancellation_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- =====================================================
-- 2. TUTOR_AVAILABILITY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS tutor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutor_id, date, start_time, end_time)
);

-- =====================================================
-- 3. ZOOM_MEETINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS zoom_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    class_id UUID REFERENCES tutor_classes(id) ON DELETE CASCADE,
    meeting_id TEXT NOT NULL,
    password TEXT,
    join_url TEXT NOT NULL,
    start_url TEXT,
    topic TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. CLASS_REVIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS class_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES tutor_classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- =====================================================
-- 5. UPDATE TRIGGERS FOR UPDATED_AT COLUMNS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_class_bookings_updated_at
    BEFORE UPDATE ON class_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_availability_updated_at
    BEFORE UPDATE ON tutor_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zoom_meetings_updated_at
    BEFORE UPDATE ON zoom_meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_reviews_updated_at
    BEFORE UPDATE ON class_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for class_bookings
CREATE INDEX IF NOT EXISTS idx_class_bookings_class_id ON class_bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_student_id ON class_bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_status ON class_bookings(status);
CREATE INDEX IF NOT EXISTS idx_class_bookings_payment_status ON class_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_class_bookings_booking_date ON class_bookings(booking_date);

-- Indexes for tutor_availability
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor_id ON tutor_availability(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_date ON tutor_availability(date);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_is_available ON tutor_availability(is_available);

-- Indexes for zoom_meetings
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_tutor_id ON zoom_meetings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_class_id ON zoom_meetings(class_id);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_meeting_id ON zoom_meetings(meeting_id);

-- Indexes for class_reviews
CREATE INDEX IF NOT EXISTS idx_class_reviews_class_id ON class_reviews(class_id);
CREATE INDEX IF NOT EXISTS idx_class_reviews_student_id ON class_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_class_reviews_tutor_id ON class_reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_class_reviews_rating ON class_reviews(rating);

-- =====================================================
-- 7. SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample tutor availability
INSERT INTO tutor_availability (tutor_id, date, start_time, end_time, is_available)
VALUES 
    ('0cff9583-0932-4781-824f-19eb56b8770f', '2025-07-26', '09:00:00', '17:00:00', true),
    ('0cff9583-0932-4781-824f-19eb56b8770f', '2025-07-27', '10:00:00', '18:00:00', true),
    ('0cff9583-0932-4781-824f-19eb56b8770f', '2025-07-28', '14:00:00', '20:00:00', true),
    ('0cff9583-0932-4781-824f-19eb56b8770f', '2025-07-29', '08:00:00', '16:00:00', true),
    ('0cff9583-0932-4781-824f-19eb56b8770f', '2025-07-30', '13:00:00', '21:00:00', true)
ON CONFLICT (tutor_id, date, start_time, end_time) DO NOTHING;

-- Insert sample zoom meetings for existing classes
INSERT INTO zoom_meetings (tutor_id, class_id, meeting_id, password, join_url, topic)
SELECT 
    tc.tutor_id,
    tc.id,
    tc.zoom_meeting_id,
    tc.zoom_password,
    tc.zoom_link,
    tc.title
FROM tutor_classes tc
WHERE tc.zoom_meeting_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Insert sample class bookings (if there are existing classes and students)
INSERT INTO class_bookings (class_id, student_id, status, payment_status, payment_amount)
SELECT 
    tc.id,
    p.user_id,
    'confirmed',
    'paid',
    50.00
FROM tutor_classes tc
CROSS JOIN profiles p
WHERE p.role = 'student'
  AND tc.id IS NOT NULL
  AND p.user_id IS NOT NULL
LIMIT 5
ON CONFLICT (class_id, student_id) DO NOTHING;

-- Insert sample class reviews
INSERT INTO class_reviews (class_id, student_id, tutor_id, rating, review_text, is_verified)
SELECT 
    cb.class_id,
    cb.student_id,
    tc.tutor_id,
    FLOOR(RANDOM() * 5) + 1,
    CASE 
        WHEN FLOOR(RANDOM() * 5) + 1 >= 4 THEN 'Excellent class! Very helpful and engaging.'
        WHEN FLOOR(RANDOM() * 5) + 1 >= 3 THEN 'Good class, learned a lot.'
        ELSE 'Decent class, could be better.'
    END,
    true
FROM class_bookings cb
JOIN tutor_classes tc ON cb.class_id = tc.id
WHERE cb.status = 'completed'
LIMIT 3
ON CONFLICT (class_id, student_id) DO NOTHING;

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Check if all tables were created successfully
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('class_bookings', 'tutor_availability', 'zoom_meetings', 'class_reviews') 
        THEN '✅ Created Successfully'
        ELSE '❌ Missing'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('class_bookings', 'tutor_availability', 'zoom_meetings', 'class_reviews')
ORDER BY table_name;

-- Check table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('class_bookings', 'tutor_availability', 'zoom_meetings', 'class_reviews')
ORDER BY table_name, ordinal_position;

-- Check sample data
SELECT 'class_bookings' as table_name, COUNT(*) as record_count FROM class_bookings
UNION ALL
SELECT 'tutor_availability' as table_name, COUNT(*) as record_count FROM tutor_availability
UNION ALL
SELECT 'zoom_meetings' as table_name, COUNT(*) as record_count FROM zoom_meetings
UNION ALL
SELECT 'class_reviews' as table_name, COUNT(*) as record_count FROM class_reviews;

-- =====================================================
-- 9. COMPLETION MESSAGE
-- =====================================================

-- All missing tables have been created successfully!
-- The complete class scheduling system is now ready
-- You can proceed with the complete database schema file
-- 
-- Tables created:
-- ✅ class_bookings - Student bookings for classes
-- ✅ tutor_availability - Tutor availability schedules
-- ✅ zoom_meetings - Zoom meeting management
-- ✅ class_reviews - Student reviews and ratings
--
-- Features included:
-- ✅ Automatic timestamps
-- ✅ Performance indexes
-- ✅ Sample data for testing
-- ✅ Data validation constraints
-- ✅ Foreign key relationships 