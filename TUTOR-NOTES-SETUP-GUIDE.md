# Tutor Notes System Setup Guide

This guide will help you set up the new tutor notes system that allows tutors to upload and manage study materials with premium functionality.

## Overview

The tutor notes system includes:

- **Upload New Notes**: Tutors can create text-based notes or upload files (PDFs, Word docs, images)
- **Premium Content**: Mark materials as premium (only accessible to premium package students)
- **Manage Existing Notes**: Edit, delete, and view statistics for uploaded materials
- **Search and Filter**: Find materials by title, description, or subject

## Database Setup

### 1. Run the Database Schema

Execute the `tutor-notes-database.sql` file in your Supabase SQL editor:

```sql
-- This creates the tutor_notes table and all necessary functions
-- Run the entire tutor-notes-database.sql file
```

### 2. Set Up Storage Bucket

Execute the `setup-tutor-storage.sql` file to create the storage bucket for file uploads:

```sql
-- This creates the tutor-materials storage bucket
-- Run the entire setup-tutor-storage.sql file
```

## Features Implemented

### ✅ Completed Features

1. **Database Schema**

   - `tutor_notes` table with premium functionality
   - File upload support (URL, filename, file size)
   - View and download counters
   - RLS policies for security

2. **Backend Services**

   - `src/lib/tutorNotes.ts` - Complete CRUD operations
   - File upload functionality
   - Search and filtering
   - Premium content management

3. **Frontend Components**

   - `ManageMaterialsPage` - Main management interface
   - `TutorNoteCard` - Display individual materials
   - `CreateTutorNoteModal` - Upload new materials
   - `EditTutorNoteModal` - Edit existing materials

4. **Navigation**

   - Added "Manage Materials" to tutor sidebar
   - Route configured at `/tutor/manage-materials`

5. **Features**
   - ✅ Upload text-based notes
   - ✅ Upload files (PDF, Word, images)
   - ✅ Mark as premium content
   - ✅ Edit existing materials
   - ✅ Delete materials
   - ✅ Search and filter
   - ✅ View statistics (views, downloads)
   - ✅ Subject categorization
   - ✅ File size validation (10MB limit)
   - ✅ File type validation

## Usage Instructions

### For Tutors

1. **Access the System**

   - Log in as a tutor
   - Navigate to "Manage Materials" in the sidebar
   - Or go directly to `/tutor/manage-materials`

2. **Upload New Material**

   - Click "Upload New Material" button
   - Choose between "Text Note" or "File Upload"
   - Fill in title, description, and subject
   - For text notes: Use the rich text editor
   - For files: Select a file (PDF, Word, image)
   - Toggle "Mark as Premium Material" if needed
   - Click "Create Material"

3. **Manage Existing Materials**
   - View all uploaded materials in the grid
   - Use search and filter options
   - Click "Edit" to modify materials
   - Click "Delete" to remove materials
   - View statistics (views, downloads)

### File Upload Guidelines

- **Supported Formats**: PDF, Word (.doc, .docx), Text files, Images (JPG, PNG, GIF)
- **Size Limit**: 10MB per file
- **Storage**: Files are stored in Supabase storage bucket

### Premium Content

- Materials marked as "Premium" are only accessible to students with premium packages
- Premium materials show a "PREMIUM" badge
- Non-premium materials are accessible to all students

## Database Structure

### tutor_notes Table

```sql
CREATE TABLE public.tutor_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT, -- For text-based notes
    file_url TEXT, -- For uploaded files
    file_name TEXT, -- Original filename
    file_size INTEGER, -- File size in bytes
    subject_id UUID REFERENCES public.note_subjects(id),
    grade_level_id UUID REFERENCES public.grade_levels(id),
    created_by UUID REFERENCES public.profiles(id),
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Key Functions

- `search_tutor_notes()` - Search and filter materials
- `increment_tutor_note_view_count()` - Track views
- `increment_tutor_note_download_count()` - Track downloads

## Security Features

### Row Level Security (RLS)

- Tutors can only view/edit/delete their own materials
- Students can view non-premium materials
- Premium materials require premium package access (to be implemented)

### Storage Security

- Files are stored in user-specific folders
- Access controlled by RLS policies
- File type and size validation

## Next Steps (Student Access)

The student-facing part of this system will be implemented next, including:

1. **Student Materials Page**

   - Browse available materials
   - Filter by subject and premium status
   - View material details

2. **Premium Access Control**

   - Check student package status
   - Restrict premium content access
   - Show upgrade prompts

3. **Material Viewer**
   - Display text content
   - Download files
   - Track views and downloads

## Troubleshooting

### Common Issues

1. **File Upload Fails**

   - Check file size (must be < 10MB)
   - Verify file type is supported
   - Ensure storage bucket is created

2. **Permission Errors**

   - Verify RLS policies are active
   - Check user authentication
   - Ensure user has tutor role

3. **Search Not Working**
   - Verify database functions are created
   - Check search parameters
   - Review console for errors

### Database Verification

Run these queries to verify setup:

```sql
-- Check if table exists
SELECT * FROM information_schema.tables WHERE table_name = 'tutor_notes';

-- Check if functions exist
SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%tutor_note%';

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'tutor-materials';
```

## Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify all SQL scripts have been executed
3. Ensure proper authentication and permissions
4. Review the database logs in Supabase dashboard

The tutor notes system is now ready for use! Tutors can start uploading and managing their study materials immediately.
