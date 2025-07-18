# Updated Tutor Application Workflow

## How It Works Now

### User Journey

1. **User Registration**

   - User signs up with role: "tutor"
   - Gets access to tutor dashboard at `/tutor`

2. **Tutor Dashboard Application Flow**
   - **New Tutor (No Application)**: Shows application form directly in dashboard
   - **Pending Application**: Shows "Under Review" status with submission details
   - **Under Review**: Shows "Additional Review" status
   - **Rejected**: Shows rejection reason and admin notes
   - **Approved**: Shows full tutor dashboard with application details

### Application Form Location

- **Inside Tutor Dashboard** (not as separate page)
- Accessed at `/tutor` when user is a tutor
- Form appears automatically if no application exists

### Database Setup Required

1. **Run SQL Script**: Execute `database-tutor-applications.sql` in Supabase
2. **Create Storage Bucket**:
   - Name: `documents`
   - Type: Private
   - For CV file uploads
3. **Set Storage Policies**: (See TUTOR-APPLICATION-SETUP.md for details)

### Components Updated

- ✅ **TutorDashboard.tsx**: Now integrates application system
- ✅ **TutorApplicationForm.tsx**: Reusable form component
- ✅ **Navigation**: Removed "Become a Tutor" link
- ✅ **Database Functions**: Complete CRUD operations

### Application States

| Status         | User Sees                   | Admin Action       |
| -------------- | --------------------------- | ------------------ |
| `null`         | Application form            | N/A                |
| `pending`      | "Under Review" message      | Can approve/reject |
| `under_review` | "Additional Review" message | Extended review    |
| `approved`     | Full tutor dashboard        | Complete           |
| `rejected`     | Rejection details           | Can reapply        |

### Next Steps for Admin Panel

The database is ready for admin features:

- View all applications with filters
- Approve/reject with notes
- Bulk operations
- Application statistics
- CV download links

### Testing the System

1. **Create New Tutor**:

   - Register with role "tutor"
   - Login and go to `/tutor`
   - Should see application form

2. **Test Application Flow**:

   - Fill out form completely
   - Upload CV file
   - Submit application
   - Should see "Under Review" status

3. **Check Database**:
   - Verify data in `tutor_applications` table
   - Check CV file in `documents` storage bucket

### File Changes Made

```
src/pages/dashboards/TutorDashboard.tsx     # Major update - integrated application
src/components/forms/TutorApplicationForm.tsx # Unchanged (reusable)
src/components/layout/DashboardLayout.tsx   # Removed "Become a Tutor" link
src/types/auth.ts                          # Added tutor application types
src/lib/db.ts                             # Added tutor application functions
database-tutor-applications.sql           # New database schema
```

### URL Structure

- `/tutor` - Tutor dashboard (shows application form or status)
- `/apply-tutor` - Still exists but not used (can be removed)

The system now correctly handles the tutor onboarding process within their dashboard!
