-- COMPLETE LMS DATABASE SETUP WITH PAYMENT INTEGRATION
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- Step 1: Clean up existing objects (in correct order)

-- Drop user trigger (safe to drop even if tables don't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions (CASCADE will handle dependent triggers)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.sync_profile_subscription() CASCADE;

-- Drop tables in dependency order (CASCADE will drop all triggers and constraints)
DROP TABLE IF EXISTS public.payment_history CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.package_pricing CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.grades CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Create profiles table (enhanced with subscription fields)
CREATE TABLE public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    date_of_birth DATE,
    gender TEXT,
    emergency_contact TEXT,
    student_id TEXT,
    package TEXT DEFAULT 'free',
    class_id TEXT,
    employee_id TEXT,
    department TEXT,
    subjects TEXT[],
    qualification TEXT,
    experience_years INTEGER,
    -- Tutor specific fields
    cv_url TEXT,
    cv_file_name TEXT,
    specializations TEXT[],
    hourly_rate DECIMAL(10,2),
    availability TEXT,
    bio TEXT,
    certifications TEXT[],
    languages TEXT[],
    profile_completed BOOLEAN DEFAULT false,
    children_ids TEXT[],
    relationship TEXT,
    hire_date DATE,
    salary DECIMAL(10,2),
    position TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    -- Subscription fields
    subscription_status TEXT DEFAULT 'free',
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 3: Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL,
    stripe_subscription_id TEXT NOT NULL UNIQUE,
    stripe_payment_intent_id TEXT,
    package_type TEXT NOT NULL CHECK (package_type IN ('free', 'silver', 'gold')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    amount_paid INTEGER NOT NULL DEFAULT 0, -- in cents
    currency TEXT DEFAULT 'usd',
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 4: Create payment_history table
CREATE TABLE public.payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT NOT NULL,
    stripe_charge_id TEXT,
    amount INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'cancelled')),
    payment_method_type TEXT, -- card, bank_transfer, etc.
    description TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 5: Create package_pricing table
CREATE TABLE public.package_pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_type TEXT NOT NULL UNIQUE CHECK (package_type IN ('free', 'silver', 'gold')),
    display_name TEXT NOT NULL,
    price_monthly INTEGER NOT NULL DEFAULT 0, -- in cents
    price_yearly INTEGER NOT NULL DEFAULT 0, -- in cents
    features TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 6: Create other essential tables
CREATE TABLE public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES public.profiles(id),
    capacity INTEGER DEFAULT 30,
    schedule TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id),
    teacher_id UUID REFERENCES public.profiles(id),
    class_id UUID REFERENCES public.classes(id),
    booking_type TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending',
    zoom_link TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 7: Create indexes for performance
CREATE INDEX profiles_user_id_idx ON public.profiles(user_id);
CREATE INDEX profiles_email_idx ON public.profiles(email);
CREATE INDEX profiles_role_idx ON public.profiles(role);

CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX subscriptions_profile_id_idx ON public.subscriptions(profile_id);
CREATE INDEX subscriptions_stripe_customer_id_idx ON public.subscriptions(stripe_customer_id);
CREATE INDEX subscriptions_status_idx ON public.subscriptions(status);

CREATE INDEX payment_history_user_id_idx ON public.payment_history(user_id);
CREATE INDEX payment_history_subscription_id_idx ON public.payment_history(subscription_id);
CREATE INDEX payment_history_status_idx ON public.payment_history(status);

-- Step 8: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for profiles
CREATE POLICY "Enable read access for users to their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for users to their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for users to their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Step 10: Create RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payment history" 
ON public.payment_history FOR SELECT 
USING (auth.uid() = user_id);

-- Admin can view all subscriptions and payments
CREATE POLICY "Admins can view all subscriptions" 
ON public.subscriptions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can view all payment history" 
ON public.payment_history FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Step 11: Create basic policies for other tables
CREATE POLICY "Enable read access for all users" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Enable read access for users" ON public.bookings FOR SELECT USING (true);

-- Step 12: Create function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 13: Create trigger for updated_at on profiles
CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Step 14: Create trigger for updated_at on subscriptions
CREATE TRIGGER handle_updated_at_subscriptions
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Step 15: Create function to sync subscription status with profile
CREATE OR REPLACE FUNCTION public.sync_profile_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profile with latest subscription info
    UPDATE public.profiles 
    SET 
        package = NEW.package_type,
        subscription_status = NEW.status,
        subscription_start_date = NEW.current_period_start,
        subscription_end_date = NEW.current_period_end,
        stripe_customer_id = NEW.stripe_customer_id,
        stripe_subscription_id = NEW.stripe_subscription_id,
        updated_at = now()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 16: Create trigger to sync subscription changes
CREATE TRIGGER sync_profile_subscription_trigger
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_subscription();

-- Step 17: Create function to handle new user registration with payment support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_profile_id UUID;
    payment_intent_id TEXT;
    user_package TEXT;
BEGIN
    -- Get payment metadata
    payment_intent_id := NEW.raw_user_meta_data->>'payment_intent_id';
    user_package := COALESCE(NEW.raw_user_meta_data->>'package', 'free');
    
    -- Insert user profile
    INSERT INTO public.profiles (
        user_id,
        email,
        first_name,
        last_name,
        full_name,
        role,
        package,
        student_id
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        user_package,
        CASE 
            WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'student' 
            THEN 'STU' || EXTRACT(YEAR FROM NOW()) || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
            ELSE NULL
        END
    ) RETURNING id INTO new_profile_id;
    
    -- If there's a payment intent ID and package is paid, create subscription
    IF payment_intent_id IS NOT NULL AND user_package IN ('silver', 'gold') THEN
        INSERT INTO public.subscriptions (
            user_id,
            profile_id,
            stripe_customer_id,
            stripe_subscription_id,
            stripe_payment_intent_id,
            package_type,
            status,
            current_period_start,
            current_period_end,
            amount_paid,
            currency
        ) VALUES (
            NEW.id,
            new_profile_id,
            'demo_customer_' || SUBSTR(NEW.id::TEXT, 1, 8),
            'demo_sub_' || payment_intent_id,
            payment_intent_id,
            user_package,
            'active',
            NOW(),
            NOW() + INTERVAL '1 month',
            CASE WHEN user_package = 'silver' THEN 2999 ELSE 4999 END,
            'usd'
        );
        
        -- Create payment history record
        INSERT INTO public.payment_history (
            user_id,
            stripe_payment_intent_id,
            amount,
            currency,
            status,
            payment_method_type,
            description
        ) VALUES (
            NEW.id,
            payment_intent_id,
            CASE WHEN user_package = 'silver' THEN 2999 ELSE 4999 END,
            'usd',
            'succeeded',
            'card',
            INITCAP(user_package) || ' Package Subscription'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 18: Create trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 19: Insert default pricing data
INSERT INTO public.package_pricing (package_type, display_name, price_monthly, price_yearly, features) VALUES
('free', 'Free Package', 0, 0, ARRAY['Group classes', 'Basic support', 'Basic dashboard']),
('silver', 'Silver Package', 2999, 29990, ARRAY['Group classes', 'Learning resources', 'Priority support', 'Enhanced dashboard']),
('gold', 'Gold Package', 4999, 49990, ARRAY['All Silver features', 'One-to-one sessions', 'Consultation booking', 'Premium resources', 'Advanced analytics']);

-- Success message
SELECT 'Complete LMS database setup with payment integration completed successfully!' as message; 