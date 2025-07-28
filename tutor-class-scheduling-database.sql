-- Tutor Class Scheduling System Database Setup
-- This script creates all necessary tables and functions for the tutor class scheduling system

-- 1. Class Types Table (already exists, but let's ensure it has the right structure)
CREATE TABLE IF NOT EXISTS "public"."class_types" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" text NOT NULL UNIQUE,
    "description" text,
    "duration_minutes" integer NOT NULL,
    "max_students" integer NOT NULL DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "price_per_session" decimal(10,2) NOT NULL DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- 2. Tutor Classes Table (already exists, but let's ensure it has the right structure)
CREATE TABLE IF NOT EXISTS "public"."tutor_classes" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "tutor_id" uuid NOT NULL REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE,
    "class_type_id" uuid NOT NULL REFERENCES "public"."class_types"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "description" text,
    "date" date NOT NULL,
    "start_time" time NOT NULL,
    "end_time" time NOT NULL,
    "duration_minutes" integer NOT NULL,
    "max_students" integer NOT NULL DEFAULT 1,
    "current_students" integer NOT NULL DEFAULT 0,
    "price_per_session" decimal(10,2) NOT NULL DEFAULT 0.00,
    "zoom_link" text,
    "zoom_meeting_id" text,
    "zoom_password" text,
    "status" text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    "is_recurring" boolean DEFAULT false,
    "recurring_pattern" text CHECK (recurring_pattern IN ('daily', 'weekly', 'biweekly', 'monthly')),
    "recurring_end_date" date,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- 3. Class Bookings Table (for students booking classes)
CREATE TABLE IF NOT EXISTS "public"."class_bookings" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "class_id" uuid NOT NULL REFERENCES "public"."tutor_classes"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE,
    "booking_status" text NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    "payment_status" text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    "payment_amount" decimal(10,2) NOT NULL,
    "stripe_payment_intent_id" text,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    UNIQUE("class_id", "student_id")
);

-- 4. Tutor Availability Table (for managing tutor availability)
CREATE TABLE IF NOT EXISTS "public"."tutor_availability" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "tutor_id" uuid NOT NULL REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE,
    "day_of_week" integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    "start_time" time NOT NULL,
    "end_time" time NOT NULL,
    "is_available" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    UNIQUE("tutor_id", "day_of_week", "start_time", "end_time")
);

-- 5. Zoom Meeting Details Table (for storing Zoom meeting information)
CREATE TABLE IF NOT EXISTS "public"."zoom_meetings" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "class_id" uuid NOT NULL REFERENCES "public"."tutor_classes"("id") ON DELETE CASCADE,
    "meeting_id" text NOT NULL,
    "join_url" text NOT NULL,
    "start_url" text NOT NULL,
    "password" text,
    "settings" jsonb DEFAULT '{}',
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- 6. Class Reviews Table (for student reviews after class completion)
CREATE TABLE IF NOT EXISTS "public"."class_reviews" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "class_id" uuid NOT NULL REFERENCES "public"."tutor_classes"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE,
    "tutor_id" uuid NOT NULL REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE,
    "rating" integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "review_text" text,
    "is_anonymous" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    UNIQUE("class_id", "student_id")
);

-- Insert default class types if they don't exist
INSERT INTO "public"."class_types" ("id", "name", "description", "duration_minutes", "max_students", "price_per_session") 
VALUES 
    ('04b74a6e-41bc-40d8-b9b1-f8e02b8b6428', 'One-to-One', 'Individual tutoring session', 15, 1, 25.00),
    ('d4024fb2-e4c7-467d-9f81-ca5b58751f57', 'One-to-One Extended', 'Extended individual tutoring session', 30, 1, 45.00),
    ('16d06a54-d10e-4e41-b6c5-53c5ef0a3c9d', 'Group Class', 'Group tutoring session with multiple students', 120, 10, 75.00),
    ('00a6cbbc-3dd7-4e04-a328-2729fb6120fc', 'Consultation', 'Assessment and consultation session', 30, 1, 35.00)
ON CONFLICT ("name") DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tutor_classes_tutor_id ON "public"."tutor_classes"("tutor_id");
CREATE INDEX IF NOT EXISTS idx_tutor_classes_date ON "public"."tutor_classes"("date");
CREATE INDEX IF NOT EXISTS idx_tutor_classes_status ON "public"."tutor_classes"("status");
CREATE INDEX IF NOT EXISTS idx_class_bookings_class_id ON "public"."class_bookings"("class_id");
CREATE INDEX IF NOT EXISTS idx_class_bookings_student_id ON "public"."class_bookings"("student_id");
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor_id ON "public"."tutor_availability"("tutor_id");
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_class_id ON "public"."zoom_meetings"("class_id");

-- Create functions for common operations

-- Function to generate Zoom meeting details
CREATE OR REPLACE FUNCTION generate_zoom_meeting(
    p_class_id uuid,
    p_title text,
    p_start_time timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    meeting_id text;
    join_url text;
    start_url text;
    password text;
    result jsonb;
BEGIN
    -- Generate a random meeting ID (in real implementation, this would call Zoom API)
    meeting_id := 'meeting_' || substr(md5(random()::text), 1, 8);
    
    -- Generate a random password
    password := substr(md5(random()::text), 1, 6);
    
    -- Create Zoom URLs (in real implementation, these would be actual Zoom URLs)
    join_url := 'https://zoom.us/j/' || meeting_id || '?pwd=' || password;
    start_url := 'https://zoom.us/s/' || meeting_id || '?pwd=' || password;
    
    -- Insert into zoom_meetings table
    INSERT INTO "public"."zoom_meetings" (
        class_id, 
        meeting_id, 
        join_url, 
        start_url, 
        password,
        settings
    ) VALUES (
        p_class_id,
        meeting_id,
        join_url,
        start_url,
        password,
        jsonb_build_object(
            'topic', p_title,
            'start_time', p_start_time,
            'duration', 60,
            'timezone', 'UTC',
            'settings', jsonb_build_object(
                'host_video', true,
                'participant_video', true,
                'join_before_host', false,
                'mute_upon_entry', true,
                'waiting_room', true
            )
        )
    );
    
    -- Return the meeting details
    result := jsonb_build_object(
        'meeting_id', meeting_id,
        'join_url', join_url,
        'start_url', start_url,
        'password', password
    );
    
    RETURN result;
END;
$$;

-- Function to check if a tutor is available at a specific time
CREATE OR REPLACE FUNCTION check_tutor_availability(
    p_tutor_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    day_of_week integer;
    is_available boolean := false;
BEGIN
    -- Get day of week (0 = Sunday, 6 = Saturday)
    day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Check if tutor has availability for this day and time
    SELECT EXISTS(
        SELECT 1 FROM "public"."tutor_availability"
        WHERE tutor_id = p_tutor_id
        AND day_of_week = check_tutor_availability.day_of_week
        AND is_available = true
        AND start_time <= p_start_time
        AND end_time >= p_end_time
    ) INTO is_available;
    
    -- Also check if there are no conflicting classes
    IF is_available THEN
        SELECT NOT EXISTS(
            SELECT 1 FROM "public"."tutor_classes"
            WHERE tutor_id = p_tutor_id
            AND date = p_date
            AND status != 'cancelled'
            AND (
                (start_time < p_end_time AND end_time > p_start_time)
            )
        ) INTO is_available;
    END IF;
    
    RETURN is_available;
END;
$$;

-- Function to get tutor's upcoming classes
CREATE OR REPLACE FUNCTION get_tutor_upcoming_classes(p_tutor_id uuid)
RETURNS TABLE(
    class_id uuid,
    class_title text,
    class_date date,
    start_time time,
    end_time time,
    class_type_name text,
    current_students integer,
    max_students integer,
    zoom_link text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.id as class_id,
        tc.title as class_title,
        tc.date as class_date,
        tc.start_time,
        tc.end_time,
        ct.name as class_type_name,
        tc.current_students,
        tc.max_students,
        tc.zoom_link
    FROM "public"."tutor_classes" tc
    JOIN "public"."class_types" ct ON tc.class_type_id = ct.id
    WHERE tc.tutor_id = p_tutor_id
    AND tc.date >= CURRENT_DATE
    AND tc.status = 'scheduled'
    ORDER BY tc.date ASC, tc.start_time ASC;
END;
$$;

-- Function to get student's booked classes
CREATE OR REPLACE FUNCTION get_student_booked_classes(p_student_id uuid)
RETURNS TABLE(
    booking_id uuid,
    class_id uuid,
    class_title text,
    tutor_name text,
    class_date date,
    start_time time,
    end_time time,
    class_type_name text,
    booking_status text,
    payment_status text,
    zoom_link text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cb.id as booking_id,
        cb.class_id,
        tc.title as class_title,
        p.full_name as tutor_name,
        tc.date as class_date,
        tc.start_time,
        tc.end_time,
        ct.name as class_type_name,
        cb.booking_status,
        cb.payment_status,
        tc.zoom_link
    FROM "public"."class_bookings" cb
    JOIN "public"."tutor_classes" tc ON cb.class_id = tc.id
    JOIN "public"."profiles" p ON tc.tutor_id = p.user_id
    JOIN "public"."class_types" ct ON tc.class_type_id = ct.id
    WHERE cb.student_id = p_student_id
    AND tc.date >= CURRENT_DATE
    ORDER BY tc.date ASC, tc.start_time ASC;
END;
$$;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE "public"."class_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tutor_classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tutor_availability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."zoom_meetings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_reviews" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for class_types (read-only for all authenticated users)
CREATE POLICY "Allow read access to class types" ON "public"."class_types"
    FOR SELECT USING (true);

-- Create RLS policies for tutor_classes
CREATE POLICY "Tutors can manage their own classes" ON "public"."tutor_classes"
    FOR ALL USING (auth.uid() = tutor_id);

CREATE POLICY "Students can view scheduled classes" ON "public"."tutor_classes"
    FOR SELECT USING (status = 'scheduled');

CREATE POLICY "Admins can manage all classes" ON "public"."tutor_classes"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "public"."profiles"
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create RLS policies for class_bookings
CREATE POLICY "Students can manage their own bookings" ON "public"."class_bookings"
    FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Tutors can view bookings for their classes" ON "public"."class_bookings"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."tutor_classes"
            WHERE id = class_bookings.class_id
            AND tutor_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all bookings" ON "public"."class_bookings"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "public"."profiles"
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create RLS policies for tutor_availability
CREATE POLICY "Tutors can manage their own availability" ON "public"."tutor_availability"
    FOR ALL USING (auth.uid() = tutor_id);

CREATE POLICY "Students can view tutor availability" ON "public"."tutor_availability"
    FOR SELECT USING (is_available = true);

-- Create RLS policies for zoom_meetings
CREATE POLICY "Tutors can view their class zoom meetings" ON "public"."zoom_meetings"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."tutor_classes"
            WHERE id = zoom_meetings.class_id
            AND tutor_id = auth.uid()
        )
    );

CREATE POLICY "Students can view zoom meetings for their booked classes" ON "public"."zoom_meetings"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."class_bookings"
            WHERE class_id = zoom_meetings.class_id
            AND student_id = auth.uid()
        )
    );

-- Create RLS policies for class_reviews
CREATE POLICY "Students can manage their own reviews" ON "public"."class_reviews"
    FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Tutors can view reviews for their classes" ON "public"."class_reviews"
    FOR SELECT USING (auth.uid() = tutor_id);

CREATE POLICY "Anyone can view published reviews" ON "public"."class_reviews"
    FOR SELECT USING (true);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tutor_classes_updated_at BEFORE UPDATE ON "public"."tutor_classes"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_bookings_updated_at BEFORE UPDATE ON "public"."class_bookings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_availability_updated_at BEFORE UPDATE ON "public"."tutor_availability"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zoom_meetings_updated_at BEFORE UPDATE ON "public"."zoom_meetings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_reviews_updated_at BEFORE UPDATE ON "public"."class_reviews"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert sample data for testing (optional)
-- This can be removed in production
INSERT INTO "public"."tutor_availability" ("tutor_id", "day_of_week", "start_time", "end_time", "is_available")
SELECT 
    p.user_id,
    generate_series(0, 6) as day_of_week,
    '09:00:00'::time as start_time,
    '17:00:00'::time as end_time,
    true as is_available
FROM "public"."profiles" p
WHERE p.role = 'tutor'
ON CONFLICT DO NOTHING; 