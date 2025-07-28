-- Fix function overloading issue
-- Drop all existing create_admin_session functions and create a clean one

-- Step 1: Drop all existing create_admin_session functions
DROP FUNCTION IF EXISTS public.create_admin_session(UUID);
DROP FUNCTION IF EXISTS public.create_admin_session(UUID, INET);
DROP FUNCTION IF EXISTS public.create_admin_session(UUID, INET, TEXT);
DROP FUNCTION IF EXISTS public.create_admin_session(UUID, INET, TEXT, TEXT);

-- Step 2: Create a single clean version of create_admin_session
CREATE OR REPLACE FUNCTION public.create_admin_session(p_admin_id UUID)
RETURNS TABLE(
    success BOOLEAN,
    session_token TEXT,
    message TEXT
) AS $$
DECLARE
    new_session_token TEXT;
    admin_email_val TEXT;
BEGIN
    -- Get admin email from admin_credentials
    SELECT email INTO admin_email_val
    FROM public.admin_credentials
    WHERE id = p_admin_id;
    
    -- Generate session token
    new_session_token := encode(gen_random_bytes(32), 'hex');
    
    -- Insert session record
    INSERT INTO public.admin_sessions (
        admin_id,
        session_token,
        ip_address,
        user_agent,
        admin_email,
        created_at,
        expires_at
    ) VALUES (
        p_admin_id,
        new_session_token,
        NULL, -- ip_address
        NULL, -- user_agent
        admin_email_val,
        NOW(),
        NOW() + INTERVAL '24 hours'
    );
    
    -- Update last login
    UPDATE public.admin_credentials 
    SET last_login = NOW()
    WHERE id = p_admin_id;
    
    RETURN QUERY SELECT 
        TRUE as success,
        new_session_token as session_token,
        'Session created successfully' as message;
        
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        FALSE as success,
        '' as session_token,
        'Failed to create session: ' || SQLERRM as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Test the function
SELECT 
    'Testing create_admin_session function' as test_name,
    (SELECT success FROM create_admin_session(
        (SELECT id FROM admin_credentials WHERE email = 'admin@mathmentor.com')
    )) as result;

-- Step 4: Show all functions to verify
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'create_admin_session'
AND routine_schema = 'public'
ORDER BY routine_name; 