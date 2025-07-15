-- PAYMENT AND SUBSCRIPTION EXTENSION FOR LMS PROJECT
-- Add this to your existing database setup or run separately

-- Step 1: Add subscription fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_status TEXT DEFAULT 'free',
ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT;

-- Step 2: Create subscriptions table
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

-- Step 3: Create payment_history table
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

-- Step 4: Create indexes for performance
CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX subscriptions_profile_id_idx ON public.subscriptions(profile_id);
CREATE INDEX subscriptions_stripe_customer_id_idx ON public.subscriptions(stripe_customer_id);
CREATE INDEX subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX payment_history_user_id_idx ON public.payment_history(user_id);
CREATE INDEX payment_history_subscription_id_idx ON public.payment_history(subscription_id);
CREATE INDEX payment_history_status_idx ON public.payment_history(status);

-- Step 5: Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
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

-- Step 7: Create trigger for updated_at on subscriptions
CREATE TRIGGER handle_updated_at_subscriptions
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Step 8: Create function to sync subscription status with profile
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

-- Step 8b: Update the user creation function to handle payment metadata
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

-- Step 9: Create trigger to sync subscription changes
CREATE TRIGGER sync_profile_subscription_trigger
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_subscription();

-- Step 10: Insert some sample pricing data (optional)
-- This could be used for a pricing table if needed
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

-- Insert default pricing
INSERT INTO public.package_pricing (package_type, display_name, price_monthly, price_yearly, features) VALUES
('free', 'Free Package', 0, 0, ARRAY['Group classes', 'Basic support', 'Basic dashboard']),
('silver', 'Silver Package', 2999, 29990, ARRAY['Group classes', 'Learning resources', 'Priority support', 'Enhanced dashboard']),
('gold', 'Gold Package', 4999, 49990, ARRAY['All Silver features', 'One-to-one sessions', 'Consultation booking', 'Premium resources', 'Advanced analytics']);

-- Success message
SELECT 'Payment and subscription database extension completed successfully!' as message; 