-- =====================================================
-- MISSING TABLES SETUP FOR TUTOR CLASS SCHEDULING SYSTEM
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
-- 6. SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample tutor availability
INSERT INTO tutor_availability (tutor_id, date, start_time, end_time, is_available)
VALUES 
    ('0cff9583-0932-4781-824f-19eb56b8770f', '2025-07-26', '09:00:00', '17:00:00', true),
    ('0cff9583-0932-4781-824f-19eb56b8770f', '2025-07-27', '10:00:00', '18:00:00', true),
    ('0cff9583-0932-4781-824f-19eb56b8770f', '2025-07-28', '14:00:00', '20:00:00', true)
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

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('class_bookings', 'tutor_availability', 'zoom_meetings', 'class_reviews') 
        THEN '✅ Created'
        ELSE '❌ Missing'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('class_bookings', 'tutor_availability', 'zoom_meetings', 'class_reviews');

-- Check table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('class_bookings', 'tutor_availability', 'zoom_meetings', 'class_reviews')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- All missing tables have been created successfully!
-- You can now run the complete database schema file
-- The class scheduling system is ready to use 