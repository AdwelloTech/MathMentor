# Tutor Approval Workflow Guide

## Overview

The tutor approval process now follows a **two-step workflow** to ensure both application quality and identity verification before enabling full tutor features.

## Workflow Steps

### Step 1: Tutor Application Approval
1. **User submits tutor application** with qualifications, CV, and personal details
2. **Admin reviews application** and approves/rejects based on qualifications
3. **If approved**: User gets `tutor` role but **tutor features remain disabled**
4. **If rejected**: User stays as student and can reapply

### Step 2: ID Verification Approval
1. **Approved tutor submits ID verification** with identity documents
2. **Admin reviews ID verification** and approves/rejects
3. **If approved**: **Full tutor features are automatically enabled**
4. **If rejected**: Tutor can resubmit with corrected documents

## Database Changes

### New Columns Added

#### `profiles` table:
- `tutor_features_enabled` (boolean) - Controls access to tutor features

#### `tutor_applications` table:
- `fully_activated` (boolean) - Indicates if both steps are complete
- `activated_at` (timestamp) - When full activation occurred

### New Functions

#### `enable_full_tutor_features(user_id)`
- Automatically called when ID verification is approved
- Enables `tutor_features_enabled` in profiles
- Sets `fully_activated` and `activated_at` in tutor_applications

#### `trigger_enable_full_tutor_features()`
- Trigger function that calls the above when ID verification status changes to 'approved'

## User Experience

### For Tutors

#### Application Pending
- Shows "Application Under Review" message
- Cannot access tutor features
- Can view application status

#### Application Approved, No ID Verification
- Shows "Application Approved!" with next steps
- Prompts to complete ID verification
- Cannot access tutor features yet
- Can view profile

#### Application Approved, ID Verification Pending
- Shows "Application Approved!" with ID verification status
- Shows "ID verification under review"
- Cannot access tutor features yet

#### Application Approved, ID Verification Rejected
- Shows "Application Approved!" with rejection notice
- Prompts to resubmit ID verification
- Cannot access tutor features yet

#### Both Approved (Full Access)
- Shows "Setup Complete!" message
- Full access to all tutor features:
  - Schedule classes
  - Manage classes
  - View dashboard stats
  - Access all tutor navigation items

### For Admins

#### Application Management
- Review and approve/reject tutor applications
- Applications can be approved independently of ID verification

#### ID Verification Management
- Review submitted ID verification documents
- Approve/reject ID verifications
- When approved, automatically enables full tutor features

## Navigation Behavior

### Dashboard Layout
- **Tutor navigation items** are disabled until both approvals are complete
- **Status indicators** show current step in the process
- **Tooltips** provide clear guidance on what's needed next

### Status Indicators
- **Yellow dot**: Application pending
- **Blue dot**: ID verification pending
- **Red dot**: Application or ID verification rejected
- **Green dot**: Both approved (features enabled)

## Implementation Files

### Database Scripts
- `id-verification-database.sql` - Creates ID verification system
- `update-tutor-workflow.sql` - Updates existing database with new workflow

### Frontend Components
- `DashboardLayout.tsx` - Updated navigation logic
- `TutorDashboard.tsx` - Updated dashboard content logic
- `IDVerificationPage.tsx` - ID verification submission interface

### Services
- `idVerificationService.ts` - Handles ID verification operations

## Migration Notes

### Existing Tutors
- **With approved applications**: Features will be disabled until ID verification is completed
- **Without ID verification**: Will need to submit ID verification to regain access
- **With ID verification**: Features will remain enabled

### Data Integrity
- All existing tutor applications are preserved
- New workflow is backward compatible
- Gradual migration ensures no data loss

## Security Benefits

1. **Identity Verification**: Ensures tutors are who they claim to be
2. **Quality Control**: Two-step process allows for thorough review
3. **Fraud Prevention**: Document verification reduces fake accounts
4. **Compliance**: Meets regulatory requirements for educational platforms

## Testing Scenarios

### Test Case 1: New Tutor Application
1. Submit tutor application
2. Admin approves application
3. Submit ID verification
4. Admin approves ID verification
5. Verify full access to tutor features

### Test Case 2: Application Approved, ID Pending
1. Submit tutor application
2. Admin approves application
3. Submit ID verification
4. Verify limited access (no tutor features)
5. Admin approves ID verification
6. Verify full access enabled

### Test Case 3: ID Verification Rejected
1. Submit tutor application
2. Admin approves application
3. Submit ID verification
4. Admin rejects ID verification
5. Verify limited access and resubmission prompt
6. Resubmit ID verification
7. Admin approves
8. Verify full access enabled

## Troubleshooting

### Common Issues

#### "Features still disabled after ID verification approval"
- Check if trigger function is working
- Verify `tutor_features_enabled` column in profiles table
- Check application status is 'approved'

#### "ID verification not showing in admin panel"
- Verify RLS policies are correct
- Check if verification was properly inserted
- Ensure admin has proper permissions

#### "Navigation items not updating"
- Clear browser cache
- Check if profile data is being refreshed
- Verify state management in React components

### Database Queries for Debugging

```sql
-- Check tutor status
SELECT 
    p.user_id,
    p.role,
    p.tutor_features_enabled,
    ta.application_status,
    ta.fully_activated,
    iv.verification_status
FROM profiles p
LEFT JOIN tutor_applications ta ON p.user_id = ta.user_id
LEFT JOIN id_verifications iv ON p.user_id = iv.user_id
WHERE p.role = 'tutor';

-- Check trigger function
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'enable_full_tutor_features_trigger';
``` 