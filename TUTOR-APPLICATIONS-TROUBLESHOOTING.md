# Tutor Applications Loading Issue - Troubleshooting Guide

## Problem Description
The tutor applications are not loading in the admin panel. The console shows:
- "Applications fetched: 0"
- "Applications data received: []"
- "Stats data received: {total: 0, pending: 0, approved: 0, rejected: 0, recentApplications: 0}"

## Root Cause Analysis

The issue is likely caused by **Row Level Security (RLS) policies** blocking access to the `tutor_applications` table, similar to the previous issue with the `profiles` table.

## Solution Steps

### Step 1: Run the RLS Fix Script

Execute the SQL script to disable RLS on the tutor_applications table:

```sql
-- Run this in your Supabase SQL editor
-- File: fix-tutor-applications-rls.sql

-- Disable RLS on tutor_applications table
ALTER TABLE "public"."tutor_applications" DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for users to their own tutor applications" ON "public"."tutor_applications";
DROP POLICY IF EXISTS "Enable insert access for users to their own tutor applications" ON "public"."tutor_applications";
DROP POLICY IF EXISTS "Enable update access for users to their own tutor applications" ON "public"."tutor_applications";
DROP POLICY IF EXISTS "Enable delete access for users to their own tutor applications" ON "public"."tutor_applications";
DROP POLICY IF EXISTS "Enable read access for admins" ON "public"."tutor_applications";
DROP POLICY IF EXISTS "Enable update access for admins" ON "public"."tutor_applications";
DROP POLICY IF EXISTS "Enable delete access for admins" ON "public"."tutor_applications";

-- Verify RLS is disabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'tutor_applications';

-- Test access
SELECT
  'RLS disabled successfully' as status,
  COUNT(*) as application_count
FROM public.tutor_applications;
```

### Step 2: Test Database Access

Run the test script to verify access:

```bash
# Run this in your terminal
node test-tutor-applications-access.js
```

This will test:
- Table existence and accessibility
- Data fetching capabilities
- RLS policy status
- Sample data retrieval

### Step 3: Verify Data Exists

Check if there are actually applications in the database:

```sql
-- Check total count
SELECT COUNT(*) as total_applications FROM public.tutor_applications;

-- Check sample data
SELECT 
  id,
  full_name,
  applicant_email,
  application_status,
  created_at
FROM public.tutor_applications
LIMIT 5;
```

### Step 4: Check Application Logs

After running the RLS fix, refresh the admin panel and check the console for:

✅ **Success indicators:**
- "✅ Table access successful, proceeding with full query..."
- "✅ Applications fetched: [number]"
- "✅ Transformed applications: [number]"

❌ **Error indicators:**
- "❌ Cannot access tutor_applications table: [error]"
- "❌ Error fetching applications: [error]"

## Expected Results

After applying the fix, you should see:

1. **Console logs showing successful data retrieval**
2. **Dashboard statistics with actual numbers**
3. **Applications table populated with data**
4. **Ability to view, approve, and reject applications**

## Alternative Solutions

If the RLS fix doesn't work, try these alternatives:

### Option 1: Check Table Name
Verify the exact table name in your database:

```sql
-- List all tables containing 'tutor' or 'application'
SELECT tablename 
FROM pg_tables 
WHERE tablename LIKE '%tutor%' OR tablename LIKE '%application%';
```

### Option 2: Check Schema
Ensure the table is in the correct schema:

```sql
-- Check table schema
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename = 'tutor_applications';
```

### Option 3: Manual Data Verification
Insert test data to verify the system works:

```sql
-- Insert a test application
INSERT INTO public.tutor_applications (
  user_id,
  applicant_email,
  full_name,
  phone_number,
  subjects,
  specializes_learning_disabilities,
  cv_file_name,
  cv_url,
  cv_file_size,
  additional_notes,
  application_status
) VALUES (
  'test-user-id',
  'test@example.com',
  'Test Applicant',
  '1234567890',
  '["Mathematics", "Physics"]',
  false,
  'test-cv.pdf',
  'https://example.com/cv.pdf',
  1024,
  'Test application',
  'pending'
);
```

## Debugging Steps

### 1. Check Browser Console
Look for these specific error messages:
- RLS policy errors
- Table access denied errors
- Network request failures

### 2. Check Network Tab
In browser DevTools → Network tab:
- Look for failed requests to Supabase
- Check response status codes
- Verify request headers

### 3. Check Supabase Dashboard
In your Supabase project:
- Go to Database → Tables
- Verify `tutor_applications` table exists
- Check RLS policies
- Verify data exists

### 4. Test with Different Query
Try a simpler query first:

```typescript
// Test basic access
const { data, error } = await supabase
  .from('tutor_applications')
  .select('id, full_name')
  .limit(1);

console.log('Test query result:', { data, error });
```

## Common Issues and Solutions

### Issue 1: "Table does not exist"
**Solution:** Check table name and schema

### Issue 2: "Permission denied"
**Solution:** Disable RLS or create proper policies

### Issue 3: "RLS policy violation"
**Solution:** Disable RLS for admin access

### Issue 4: "No data returned"
**Solution:** Verify data exists in the table

## Verification Checklist

After applying fixes, verify:

- [ ] RLS is disabled on tutor_applications table
- [ ] Console shows successful data fetching
- [ ] Dashboard displays correct statistics
- [ ] Applications table shows data
- [ ] View/Approve/Reject buttons work
- [ ] CV download functionality works

## Next Steps

1. **Apply the RLS fix script**
2. **Test the application**
3. **Check console logs**
4. **Verify data is loading**
5. **Test all functionality**

If issues persist, run the test script and share the output for further debugging.

## Support

If you continue to experience issues:
1. Run the test script and share output
2. Check Supabase dashboard for errors
3. Verify table structure matches expected schema
4. Test with a simple query first 