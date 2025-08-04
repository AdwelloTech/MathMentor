# Tutor Notes Foreign Key Fix

## Issue

The `tutor_notes` table has an incorrect foreign key constraint that's causing the error:

```
Key is not present in table "profiles"
insert or update on table "tutor_notes" violates foreign key constraint "tutor_notes_created_by_fkey"
```

## Root Cause

The `created_by` field in `tutor_notes` was referencing `profiles(id)` instead of `profiles(user_id)`. The application correctly passes the user's ID from `auth.users`, but the database constraint was looking for the profile's internal ID.

## Solution

### Step 1: Run the Fix SQL

Execute the `fix-tutor-notes-foreign-key.sql` file in your Supabase SQL editor:

```sql
-- Drop the existing foreign key constraint
ALTER TABLE tutor_notes
DROP CONSTRAINT IF EXISTS tutor_notes_created_by_fkey;

-- Add the correct foreign key constraint
ALTER TABLE tutor_notes
ADD CONSTRAINT tutor_notes_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(user_id) ON DELETE CASCADE;
```

### Step 2: Verify the Fix

After running the SQL, you should be able to:

1. Create new tutor notes without foreign key errors
2. The "Create Material" button should work properly
3. Notes will be correctly associated with the logged-in tutor

## What This Fixes

- ✅ Foreign key constraint violation errors
- ✅ Ability to create new study materials
- ✅ Proper association between notes and tutors
- ✅ RLS policies will work correctly

## Testing

After applying the fix:

1. Go to Tutor Dashboard
2. Click "Manage Materials"
3. Click "Upload New Material"
4. Fill in the form and click "Create Material"
5. The note should be created successfully without errors

## Files Updated

- `tutor-notes-database.sql` - Fixed the constraint for future deployments
- `fix-tutor-notes-foreign-key.sql` - Created to fix existing deployments

## Note

The RLS policies were already correct since they use `auth.uid()` which matches the `user_id` field in the profiles table.
