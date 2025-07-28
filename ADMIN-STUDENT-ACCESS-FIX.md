# Admin Student Access Fix Guide

## Problem
The admin panel can log in successfully but cannot load student details because the RLS (Row Level Security) policies on the `profiles` table only allow users to read their own profile data.

## Root Cause
The current RLS policies are:
```sql
-- Current policies (restrictive)
create policy "Enable read access for users to their own profile"
  on "public"."profiles"
  to public
  using (
    (auth.uid() = user_id)
  );
```

These policies only allow users to read their own profile (`auth.uid() = user_id`), but admin users need to read ALL student profiles to manage them.

## Solution

### Step 1: Update RLS Policies
Run the SQL script `fix-admin-rls-policies-v2.sql` in your Supabase SQL editor:

```sql
-- This script creates new RLS policies that allow admin users to access all profiles
-- while maintaining security for regular users

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable read access for users to their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable update access for users to their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable insert access for users to their own profile" ON "public"."profiles";

-- Create admin detection function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
    session_token TEXT;
    admin_session_exists BOOLEAN;
BEGIN
    -- Get the session token from the request headers
    session_token := current_setting('request.headers')::json->>'authorization';
    
    -- Check if there's a valid admin session
    SELECT EXISTS(
        SELECT 1 FROM public.admin_sessions 
        WHERE session_token = session_token
        AND expires_at > now()
    ) INTO admin_session_exists;
    
    RETURN admin_session_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policies that allow admin access
CREATE POLICY "Enable read access for admins and own profile"
  ON "public"."profiles"
  FOR SELECT
  TO public
  USING (
    public.is_admin_user() OR (auth.uid() = user_id)
  );

CREATE POLICY "Enable update access for admins and own profile"
  ON "public"."profiles"
  FOR UPDATE
  TO public
  USING (
    public.is_admin_user() OR (auth.uid() = user_id)
  )
  WITH CHECK (
    public.is_admin_user() OR (auth.uid() = user_id)
  );

CREATE POLICY "Enable insert access for admins and own profile"
  ON "public"."profiles"
  FOR INSERT
  TO public
  WITH CHECK (
    public.is_admin_user() OR (auth.uid() = user_id)
  );

CREATE POLICY "Enable delete access for admins"
  ON "public"."profiles"
  FOR DELETE
  TO public
  USING (
    public.is_admin_user()
  );
```

### Step 2: Update AdminStudentService
The `AdminStudentService` has been updated to include the admin session token in request headers:

```typescript
// Create a custom supabase client that includes admin session token
const createAdminClient = () => {
  const sessionToken = AdminAuthService.getSessionToken();
  
  if (!sessionToken) {
    console.warn('No admin session token found');
    return supabase;
  }

  // Create a client with custom headers for admin authentication
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          'Authorization': sessionToken
        }
      }
    }
  );
};
```

### Step 3: Test the Fix
Run the test script to verify the fix:

```bash
node test-admin-student-access.js
```

## How It Works

1. **Admin Authentication**: The admin system uses a custom database-based authentication with session tokens stored in the `admin_sessions` table.

2. **RLS Policy Detection**: The `is_admin_user()` function checks if there's a valid admin session by looking at the `Authorization` header in the request.

3. **Admin Access**: When an admin is logged in, the RLS policies allow them to read, update, insert, and delete all profiles.

4. **User Security**: Regular users can still only access their own profile data.

## Verification Steps

1. **Login as Admin**: Use the admin login page with valid credentials
2. **Navigate to Manage Students**: Go to the admin dashboard and click "Manage Students"
3. **Check Data Loading**: The student list should now load with all student data
4. **Test Student Details**: Click on a student to view their details

## Troubleshooting

### If students still don't load:

1. **Check Admin Session**: Verify the admin is properly logged in
2. **Check Console Logs**: Look for any error messages in the browser console
3. **Verify RLS Policies**: Run the SQL script again to ensure policies are updated
4. **Test Database Access**: Use the test script to verify database access

### Common Issues:

1. **Session Token Missing**: Make sure the admin session token is being stored and retrieved correctly
2. **RLS Policies Not Applied**: Ensure the SQL script was executed successfully
3. **Function Not Found**: The `is_admin_user()` function must exist in the database

## Security Notes

- The admin authentication system is separate from Supabase's built-in auth
- Admin sessions are stored in the `admin_sessions` table with expiration times
- RLS policies ensure that only authenticated admins can access all profiles
- Regular users are still restricted to their own profile data

## Files Modified

1. `fix-admin-rls-policies-v2.sql` - New RLS policies
2. `src/lib/adminStudentService.ts` - Updated to use admin session tokens
3. `test-admin-student-access.js` - Test script for verification
4. `ADMIN-STUDENT-ACCESS-FIX.md` - This guide 