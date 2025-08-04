# Tutor Notes Troubleshooting Guide

## Issue: Empty Material Cards Showing "Invalid Date"

### Problem Description

The tutor note cards are displaying empty content with "Invalid Date" instead of showing the actual title, description, and proper date.

### Root Cause Analysis

#### 1. **Data Fetching Issues**

- **RLS Policies**: Row Level Security policies might be blocking access to the data
- **Database Connection**: Supabase connection issues
- **Query Errors**: The `search_tutor_notes` function might be failing

#### 2. **Data Structure Issues**

- **Missing Fields**: Required fields like `title`, `description`, `created_at` might be null
- **Type Mismatches**: Data types not matching expected interfaces
- **Foreign Key Issues**: Missing subject or grade level references

#### 3. **Component Props Issues**

- **Prop Passing**: Incorrect prop structure between components
- **Data Transformation**: Issues with the `transformTutorNoteForCard` function

### Solutions Implemented

#### 1. **Fixed Component Props**

```typescript
// Before (incorrect)
<TutorNoteCard
  note={note}
  onEdit={() => handleEditNote(note)}
  onDelete={() => handleDeleteNote(note.id)}
  isDeleting={deletingNoteId === note.id}
/>

// After (correct)
<TutorNoteCard
  {...transformTutorNoteForCard(note)}
  onEdit={() => handleEditNote(note)}
  onDelete={() => handleDeleteNote(note.id)}
  isDeleting={deletingNoteId === note.id}
/>
```

#### 2. **Enhanced Date Handling**

```typescript
export function formatTutorNoteDate(dateString: string | null): string {
  if (!dateString) {
    return "Recently";
  }

  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return "Recently";
  }

  // ... rest of the function
}
```

#### 3. **Added Fallback Values**

```typescript
// Title fallback
{
  title || "Untitled Material";
}

// Description fallback
{
  description
    ? truncateTutorNoteText(description, 100)
    : "No description provided";
}
```

### Debugging Steps

#### 1. **Check Database Data**

```sql
-- Run this in Supabase SQL editor
SELECT
  id,
  title,
  description,
  created_at,
  created_by,
  is_active
FROM tutor_notes
WHERE created_by = 'your-user-id'
ORDER BY created_at DESC;
```

#### 2. **Check RLS Policies**

```sql
-- Verify RLS is working
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'tutor_notes';
```

#### 3. **Test the Search Function**

```sql
-- Test the search function directly
SELECT * FROM search_tutor_notes(
  search_term := '',
  subject_filter := NULL,
  premium_only := false,
  tutor_id := 'your-user-id'
);
```

#### 4. **Check Browser Console**

- Open Developer Tools (F12)
- Check Console for any JavaScript errors
- Look for network request failures
- Verify the data being returned from API calls

### Common Issues and Fixes

#### Issue 1: "Invalid Date" Error

**Cause**: `created_at` field is null or invalid
**Fix**: Enhanced date formatting with null checks

#### Issue 2: Empty Title/Description

**Cause**: Data not being fetched or transformed correctly
**Fix**: Added fallback values and proper prop transformation

#### Issue 3: RLS Policy Blocking Access

**Cause**: User doesn't have permission to view the data
**Fix**: Check RLS policies and user authentication

#### Issue 4: Database Connection Issues

**Cause**: Supabase connection problems
**Fix**: Verify environment variables and network connectivity

### Verification Steps

#### 1. **Create a Test Note**

1. Open the "Create New Material" modal
2. Fill in all required fields
3. Submit the form
4. Check if the note appears in the list

#### 2. **Check Data in Database**

1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Check the `tutor_notes` table
4. Verify your note exists with proper data

#### 3. **Test API Calls**

1. Open Browser Developer Tools
2. Go to Network tab
3. Refresh the page
4. Look for API calls to `search_tutor_notes`
5. Check the response data

### Prevention Measures

#### 1. **Data Validation**

- Always validate data before saving to database
- Use proper TypeScript interfaces
- Add fallback values for optional fields

#### 2. **Error Handling**

- Implement proper error boundaries
- Add loading states
- Show user-friendly error messages

#### 3. **Testing**

- Test with various data scenarios
- Test with null/undefined values
- Test with different user roles

### Additional Resources

#### Database Schema

- `tutor-notes-database.sql` - Complete database setup
- `fix-tutor-notes-foreign-key.sql` - Foreign key fixes
- `fix-tutor-storage-policies.sql` - Storage policy fixes

#### Component Files

- `src/components/tutor/TutorNoteCard.tsx` - Card component
- `src/pages/tutor/ManageMaterialsPage.tsx` - Main page
- `src/lib/tutorNotes.ts` - Service functions

#### Guides

- `TUTOR-NOTES-SYSTEM-SETUP-GUIDE.md` - Setup instructions
- `TUTOR-NOTES-SIMPLIFIED-FORM-GUIDE.md` - Form improvements
- `TUTOR-NOTES-DRAG-DROP-GUIDE.md` - Drag & drop feature

### Support

If issues persist after following this guide:

1. Check the browser console for errors
2. Verify database connectivity
3. Test with a fresh browser session
4. Check Supabase logs for backend errors
