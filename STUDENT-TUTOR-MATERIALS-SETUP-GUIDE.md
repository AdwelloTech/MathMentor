# Student Tutor Materials System - Setup Guide

## Overview

This system allows students to browse and access study materials from tutors they have booked classes with. The system includes premium access control, view tracking, and file management.

## Features

### ✅ **Core Features**

- **Browse Materials**: Students can view materials from tutors they've booked with
- **Premium Access Control**: Gold and Silver package students can access premium materials
- **Search & Filter**: Search by title/description and filter by subject
- **File Management**: View and download PDFs and other file types
- **View Tracking**: Track unique views per student per material
- **Download Tracking**: Track download counts for analytics

### ✅ **Premium Integration**

- **Package Checking**: Automatically checks student's package (gold/silver)
- **Access Control**: Premium materials only accessible to premium students
- **Upgrade Prompts**: Clear upgrade buttons for non-premium students
- **Package Redirect**: Direct navigation to packages page

### ✅ **User Experience**

- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Clean, intuitive interface with animations
- **Loading States**: Proper loading indicators
- **Error Handling**: Graceful error handling with user feedback

## Database Setup

### 1. Run the Database Functions

Execute the SQL script to create the necessary database functions:

```sql
-- Run this file in your Supabase SQL editor
student-tutor-materials-database.sql
```

This creates:

- `get_student_tutor_materials()` - Get materials for students based on booked tutors
- `student_has_premium_access()` - Check if student has gold/silver package
- `get_student_tutor_material_by_id()` - Get specific material with access control

### 2. Verify Database Functions

The functions should be created with proper permissions for authenticated users.

## Frontend Components

### 1. Service Layer (`src/lib/studentTutorMaterials.ts`)

**Functions Available:**

- `getStudentTutorMaterials()` - Fetch materials for a student
- `getStudentTutorMaterialById()` - Get specific material with access info
- `checkStudentPremiumAccess()` - Check student's premium status
- `incrementStudentTutorMaterialViewCountUnique()` - Track unique views
- `incrementStudentTutorMaterialDownloadCount()` - Track downloads

### 2. Main Page (`src/pages/student/TutorMaterialsPage.tsx`)

**Features:**

- Search and filter functionality
- Premium access checking
- Material listing with cards
- Stats dashboard
- Upgrade prompts for non-premium users

### 3. Material Card (`src/components/student/StudentTutorMaterialCard.tsx`)

**Features:**

- Display material information
- Premium status indicators
- Access control buttons
- View/download functionality
- Automatic view tracking

### 4. Material Viewer (`src/components/student/StudentTutorMaterialViewer.tsx`)

**Features:**

- Full material content display
- File viewing and downloading
- Rich text content rendering
- Material metadata display

## Navigation Setup

### 1. Sidebar Navigation

The "Tutor Materials" link has been added to the student sidebar navigation in `DashboardLayout.tsx`.

### 2. Routing

The route `/student/tutor-materials` has been added to `App.tsx` and points to `TutorMaterialsPage`.

## How It Works

### 1. **Material Access Logic**

```
Student visits Tutor Materials page
    ↓
System checks student's booked tutors
    ↓
Fetches materials from those tutors only
    ↓
For each material:
    - If premium: Check student's package (gold/silver)
    - If non-premium: Allow access
    ↓
Display materials with appropriate access controls
```

### 2. **Premium Access Flow**

```
Student clicks on premium material
    ↓
System checks student's package
    ↓
If gold/silver: Allow access
If free: Show upgrade prompt
    ↓
Redirect to packages page if needed
```

### 3. **View Tracking**

```
Student views material card
    ↓
System tracks unique view (one per student per material)
    ↓
Updates view count in database
    ↓
Displays updated count in UI
```

## Usage Instructions

### For Students

1. **Access Materials**:

   - Navigate to "Tutor Materials" in the sidebar
   - Browse materials from your booked tutors
   - Use search and filter to find specific materials

2. **Premium Materials**:

   - Premium materials show a "PREMIUM" badge
   - If you have gold/silver package: Click "View" to access
   - If you have free package: Click "Upgrade to Access" to upgrade

3. **Viewing Materials**:

   - Click "View" on any accessible material
   - Read text content in the modal
   - View or download attached files

4. **Downloading Files**:
   - Click "Download" on materials with files
   - Files will be downloaded to your device
   - Download count is tracked for analytics

### For Tutors

1. **Create Materials**:

   - Use the existing tutor materials system
   - Mark materials as premium if needed
   - Upload files or add text content

2. **Student Access**:
   - Students can only see materials from tutors they've booked with
   - Premium materials require gold/silver package
   - View/download analytics are available

## Premium Package Integration

### Package Checking

The system automatically checks the student's `package` field in the `profiles` table:

- `gold` - Full access to all materials
- `silver` - Full access to all materials
- `free` - Access to non-premium materials only

### Upgrade Flow

1. Student tries to access premium material
2. System checks package status
3. If free package: Shows upgrade prompt
4. Clicking upgrade redirects to `/student/packages`

## Analytics & Tracking

### View Tracking

- **Unique Views**: One view per student per material
- **Automatic**: Tracks when student views material card
- **Database**: Stored in `tutor_note_views` table

### Download Tracking

- **Manual**: Tracks when student downloads files
- **Count**: Stored in `tutor_notes.download_count`
- **Analytics**: Available in tutor dashboard

## Troubleshooting

### Common Issues

1. **No Materials Showing**

   - Check if student has booked classes with tutors
   - Verify tutors have created materials
   - Check database functions are working

2. **Premium Access Issues**

   - Verify student's package field in profiles table
   - Check package values: `gold`, `silver`, or `free`
   - Ensure premium materials are marked correctly

3. **File Download Issues**

   - Check file URLs are accessible
   - Verify storage bucket permissions
   - Check browser download settings

4. **View Tracking Not Working**
   - Check `tutor_note_views` table exists
   - Verify RPC function permissions
   - Check for JavaScript errors in console

### Database Verification

Run these queries to verify setup:

```sql
-- Check if functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN (
  'get_student_tutor_materials',
  'student_has_premium_access',
  'get_student_tutor_material_by_id'
);

-- Check student's booked tutors
SELECT DISTINCT tc.tutor_id, p.full_name
FROM class_bookings cb
JOIN tutor_classes tc ON cb.class_id = tc.id
JOIN profiles p ON tc.tutor_id = p.user_id
WHERE cb.student_id = 'your-student-id';

-- Check student's package
SELECT package FROM profiles WHERE user_id = 'your-student-id';
```

## Security Considerations

### Row Level Security (RLS)

- All database functions use `SECURITY DEFINER`
- Students can only access materials from their booked tutors
- Premium access is checked at the database level

### File Access

- Files are stored in Supabase storage
- Access controlled by RLS policies
- Download tracking prevents abuse

### Data Privacy

- View tracking is anonymous (no personal data stored)
- Only aggregate statistics are available to tutors
- Student privacy is maintained

## Future Enhancements

### Potential Features

1. **Material Ratings**: Allow students to rate materials
2. **Comments**: Student feedback on materials
3. **Favorites**: Bookmark favorite materials
4. **Notifications**: Alert when new materials are available
5. **Advanced Search**: Search within file content
6. **Material Categories**: Better organization system

### Performance Optimizations

1. **Caching**: Cache frequently accessed materials
2. **Pagination**: Load materials in batches
3. **Lazy Loading**: Load content on demand
4. **CDN**: Use CDN for file delivery

## Support

For technical support or questions about the student tutor materials system, refer to the troubleshooting section above or check the database logs for specific error messages.
