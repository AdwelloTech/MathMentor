g# Tutor Application System Setup Guide

This guide explains how to set up the tutor application system in your MathMentor application.

## Database Setup

### 1. Run the Database Schema

Execute the SQL script in Supabase SQL Editor:

```sql
-- Copy and paste the contents of database-tutor-applications.sql
-- This creates the tutor_applications table and related functions
```

### 2. Create Storage Bucket for CV Uploads

In your Supabase dashboard:

1. Go to **Storage** → **Buckets**
2. Click **"New bucket"**
3. Create a bucket named: `documents`
4. Set it to **Private** (not public)
5. Click **"Create bucket"**

### 3. Set Up Storage Policies

Add these RLS policies for the `documents` bucket:

```sql
-- Allow users to upload their own documents
INSERT INTO storage.policies (name, bucket_id, role, policies, check)
VALUES (
  'Users can upload their own documents',
  'documents',
  'authenticated',
  'INSERT',
  'bucket_id = ''documents'' AND auth.uid()::text = (storage.foldername(name))[1]'
);

-- Allow users to view their own documents
INSERT INTO storage.policies (name, bucket_id, role, policies, check)
VALUES (
  'Users can view their own documents',
  'documents',
  'authenticated',
  'SELECT',
  'bucket_id = ''documents'' AND auth.uid()::text = (storage.foldername(name))[1]'
);

-- Allow admins to view all documents
INSERT INTO storage.policies (name, bucket_id, role, policies, check)
VALUES (
  'Admins can view all documents',
  'documents',
  'authenticated',
  'SELECT',
  'bucket_id = ''documents'' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN (''admin'', ''principal'', ''hr'')
  )'
);
```

## Frontend Implementation

The following components have been implemented:

### 1. New Components Created

- `src/components/forms/TutorApplicationForm.tsx` - Main application form
- `src/pages/TutorApplicationPage.tsx` - Application page with status handling
- Updated `src/components/layout/DashboardLayout.tsx` - Added "Become a Tutor" navigation

### 2. Routes Added

- `/apply-tutor` - Tutor application page (accessible to all logged-in users)

### 3. Database Functions Added

- `db.tutorApplications.create()` - Submit new application
- `db.tutorApplications.getByUserId()` - Get user's application
- `db.storage.uploadTutorCV()` - Upload CV files
- Database functions for admin approval/rejection (ready for admin panel)

## How It Works

### User Flow

1. **Access Application**: User clicks "Become a Tutor" in navigation
2. **Fill Form**: Complete form with personal info, subjects, and CV upload
3. **Submit**: Application is saved to database with status 'pending'
4. **Confirmation**: User sees success message and status tracking
5. **Admin Review**: Admins can review applications (admin panel needed later)
6. **Approval/Rejection**: User gets notified and role updated if approved

### Form Fields

- **Full Name** (required)
- **Phone Number** (required)
- **Subjects** (multi-select, required)
- **Learning Disabilities Specialization** (checkbox)
- **CV Upload** (PDF/Word, max 5MB, required)
- **Additional Notes** (optional)

### Application Status Flow

- `pending` → `under_review` → `approved` / `rejected`
- Users can see their current status
- Status-specific UI messages and actions

## File Structure

```
src/
├── components/
│   ├── forms/
│   │   └── TutorApplicationForm.tsx      # New application form
│   └── layout/
│       └── DashboardLayout.tsx           # Updated with navigation
├── pages/
│   └── TutorApplicationPage.tsx          # New application page
├── types/
│   └── auth.ts                           # Updated with tutor types
└── lib/
    └── db.ts                             # Updated with tutor functions

database-tutor-applications.sql           # New database schema
```

## Admin Panel (Coming Later)

The database is ready for admin panel features:

- View all applications
- Filter by status
- Approve/reject with notes
- Automatic role conversion on approval
- Application statistics

## Testing

1. Login as a non-tutor user
2. Click "Become a Tutor" in navigation
3. Fill out the application form
4. Upload a CV file
5. Submit and verify database entry
6. Check different status displays

## Important Notes

- Only non-tutor users see the "Become a Tutor" link
- CV files are stored in Supabase Storage with proper access controls
- Applications are tied to user accounts
- Status changes automatically update the UI
- Ready for email notifications (implement later)
- All database functions include proper error handling and RLS policies
