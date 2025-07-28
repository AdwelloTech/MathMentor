-- =====================================================
-- RECREATE TUTOR_AVAILABILITY TABLE
-- =====================================================

-- Create the tutor_availability table with correct structure
CREATE TABLE tutor_availability (
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

-- Create the trigger for updated_at
CREATE TRIGGER update_tutor_availability_updated_at
    BEFORE UPDATE ON tutor_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample tutor availability data
INSERT INTO tutor_availability (tutor_id, date, start_time, end_time, is_available)
VALUES 
    ('0cff9583-0932-4781-824f-19eb56b8770f', '2025-07-26', '09:00:00', '17:00:00', true),
    ('0cff9583-0932-4781-824f-19eb56b8770f', '2025-07-27', '10:00:00', '18:00:00', true),
    ('0cff9583-0932-4781-824f-19eb56b8770f', '2025-07-28', '14:00:00', '20:00:00', true)
ON CONFLICT (tutor_id, date, start_time, end_time) DO NOTHING;

-- Verify the table was created successfully
SELECT 
    table_name,
    '✅ Created Successfully' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'tutor_availability';

-- Show the table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tutor_availability'
ORDER BY ordinal_position;

-- Test the data insert
SELECT * FROM tutor_availability LIMIT 3; 