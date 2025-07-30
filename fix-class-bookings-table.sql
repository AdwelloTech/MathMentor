-- Fix class_bookings table schema for student session booking functionality
-- This script creates or updates the class_bookings table to match the TypeScript interface

-- Drop the table if it exists (to recreate with correct structure)
DROP TABLE IF EXISTS class_bookings CASCADE;

-- Create the class_bookings table with proper structure
CREATE TABLE class_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES tutor_classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    booking_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stripe_payment_intent_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_class_bookings_class_id ON class_bookings(class_id);
CREATE INDEX idx_class_bookings_student_id ON class_bookings(student_id);
CREATE INDEX idx_class_bookings_booking_status ON class_bookings(booking_status);
CREATE INDEX idx_class_bookings_payment_status ON class_bookings(payment_status);

-- Create a unique constraint to prevent duplicate bookings
CREATE UNIQUE INDEX idx_class_bookings_unique ON class_bookings(class_id, student_id) 
WHERE booking_status NOT IN ('cancelled');

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_class_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_class_bookings_updated_at
    BEFORE UPDATE ON class_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_class_bookings_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_bookings

-- Students can view their own bookings
CREATE POLICY "Students can view own bookings" ON class_bookings
    FOR SELECT USING (
        auth.uid() = student_id
    );

-- Students can create their own bookings
CREATE POLICY "Students can create own bookings" ON class_bookings
    FOR INSERT WITH CHECK (
        auth.uid() = student_id
    );

-- Students can update their own bookings (limited fields)
CREATE POLICY "Students can update own bookings" ON class_bookings
    FOR UPDATE USING (
        auth.uid() = student_id
    ) WITH CHECK (
        auth.uid() = student_id
    );

-- Tutors can view bookings for their classes
CREATE POLICY "Tutors can view bookings for their classes" ON class_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tutor_classes tc 
            WHERE tc.id = class_bookings.class_id 
            AND tc.tutor_id = auth.uid()
        )
    );

-- Tutors can update booking status and notes for their classes
CREATE POLICY "Tutors can update bookings for their classes" ON class_bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM tutor_classes tc 
            WHERE tc.id = class_bookings.class_id 
            AND tc.tutor_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM tutor_classes tc 
            WHERE tc.id = class_bookings.class_id 
            AND tc.tutor_id = auth.uid()
        )
    );

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings" ON class_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admins can update all bookings
CREATE POLICY "Admins can update all bookings" ON class_bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create a function to automatically update class current_students count
CREATE OR REPLACE FUNCTION update_class_current_students()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the current_students count for the affected class
    UPDATE tutor_classes 
    SET current_students = (
        SELECT COUNT(*) 
        FROM class_bookings 
        WHERE class_id = COALESCE(NEW.class_id, OLD.class_id)
        AND booking_status = 'confirmed'
    )
    WHERE id = COALESCE(NEW.class_id, OLD.class_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain current_students count
CREATE TRIGGER trigger_update_class_students_on_insert
    AFTER INSERT ON class_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_class_current_students();

CREATE TRIGGER trigger_update_class_students_on_update
    AFTER UPDATE ON class_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_class_current_students();

CREATE TRIGGER trigger_update_class_students_on_delete
    AFTER DELETE ON class_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_class_current_students();

-- Insert some sample data for testing (optional)
-- You can uncomment this section if you want sample data

/*
-- Sample booking data (requires existing tutor_classes and student profiles)
INSERT INTO class_bookings (class_id, student_id, booking_status, payment_status, payment_amount)
SELECT 
    tc.id, p.user_id, 'confirmed', 'paid', tc.price_per_session
FROM tutor_classes tc
CROSS JOIN profiles p
WHERE p.role = 'student'
AND tc.current_students < tc.max_students
LIMIT 5;
*/

-- Verify the table was created correctly
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'class_bookings' 
ORDER BY ordinal_position;
