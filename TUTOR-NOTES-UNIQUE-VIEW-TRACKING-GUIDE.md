# Tutor Notes Unique View Tracking Guide

## Overview

This implementation ensures that each student can only count as **1 view per tutor note**, even if they view the same material multiple times. This provides accurate analytics for tutors to understand how many unique students are accessing their materials.

## How It Works

### **Unique View Logic**

- **First View**: When a student views a material for the first time, the view count increments by 1
- **Subsequent Views**: If the same student views the same material again, the view count remains unchanged
- **Per-Student Tracking**: Each student is tracked individually per material

### **Database Structure**

#### **tutor_note_views Table**

```sql
CREATE TABLE tutor_note_views (
    id UUID PRIMARY KEY,
    note_id UUID REFERENCES tutor_notes(id),
    user_id UUID REFERENCES auth.users(id),
    viewed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(note_id, user_id) -- Key constraint for uniqueness
);
```

#### **Key Features**

- **Unique Constraint**: `(note_id, user_id)` ensures one record per student per material
- **Cascade Delete**: When a note is deleted, view records are automatically removed
- **Timestamps**: Track when each student first viewed the material
- **Indexed**: Optimized for fast lookups

### **Database Function**

```sql
CREATE FUNCTION increment_tutor_note_view_count_unique(note_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Try to insert a new view record
    INSERT INTO tutor_note_views (note_id, user_id)
    VALUES (note_id, user_id)
    ON CONFLICT (note_id, user_id) DO NOTHING;

    -- Only increment view count if new record was inserted
    IF FOUND THEN
        UPDATE tutor_notes
        SET view_count = view_count + 1
        WHERE id = note_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

## Implementation Details

### **Frontend Integration**

#### **TutorNoteCard Component**

```typescript
// Track unique view when component mounts
useEffect(() => {
  const trackUniqueView = async () => {
    if (user) {
      try {
        await incrementTutorNoteViewCountUnique(id, user.id);
      } catch (error) {
        console.error("Error tracking unique view:", error);
      }
    }
  };

  if (user) {
    trackUniqueView();
  }
}, [id, user]);
```

#### **Key Features**

- **Automatic Tracking**: Views are tracked when the card component mounts
- **User Authentication**: Only tracks views for authenticated users
- **Error Handling**: View tracking failures don't break the component
- **One-Time Tracking**: Each student-material combination is tracked only once

### **Service Function**

```typescript
export async function incrementTutorNoteViewCountUnique(
  noteId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc(
    "increment_tutor_note_view_count_unique",
    {
      note_id: noteId,
      user_id: userId,
    }
  );

  if (error) {
    console.error("Error incrementing unique view count:", error);
    throw error;
  }
}
```

## User Experience

### **For Students**

- **First View**: View count increments when they first see a material
- **Return Views**: No impact on view count when they return to the same material
- **Transparent**: View tracking happens automatically without user interaction

### **For Tutors**

- **Accurate Analytics**: View count represents unique students, not total views
- **Real-time Updates**: View counts update immediately when students view materials
- **Insights**: Can see how many different students are accessing their materials

## Security & Privacy

### **Row Level Security (RLS)**

```sql
-- Users can only see their own view records
CREATE POLICY "Users can view their own note view records" ON tutor_note_views
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own view records
CREATE POLICY "Users can insert their own note view records" ON tutor_note_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tutors can see view records for their own notes
CREATE POLICY "Tutors can view records for their own notes" ON tutor_note_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tutor_notes
            WHERE tutor_notes.id = tutor_note_views.note_id
            AND tutor_notes.created_by = auth.uid()
        )
    );
```

### **Data Protection**

- **User Privacy**: Students can only see their own view records
- **Tutor Access**: Tutors can only see view records for their own materials
- **No Personal Data**: Only tracks user IDs, not personal information
- **Automatic Cleanup**: View records are deleted when notes are deleted

## Setup Instructions

### **1. Run Database Migration**

```sql
-- Execute the tutor-notes-unique-view-tracking.sql file
-- This creates the table, function, and policies
```

### **2. Update Frontend**

- The `incrementTutorNoteViewCountUnique` function is already added to `src/lib/tutorNotes.ts`
- The `TutorNoteCard` component is already updated to use unique view tracking

### **3. Test the Implementation**

1. **Create a tutor note** with a file
2. **Login as a student** and view the material
3. **Check the view count** - it should increment by 1
4. **View the same material again** - view count should remain the same
5. **Login as a different student** - view count should increment by 1

## Analytics Benefits

### **Accurate Metrics**

- **Unique Reach**: Know how many different students are accessing materials
- **Popular Content**: Identify which materials are most viewed by unique students
- **Engagement Quality**: Distinguish between repeat viewers and new viewers

### **Tutor Insights**

- **Content Performance**: See which materials attract the most unique students
- **Student Growth**: Track how many new students are discovering materials
- **Premium Value**: Understand the reach of premium vs. free materials

## Troubleshooting

### **Common Issues**

#### **View Count Not Incrementing**

- **Check Authentication**: Ensure user is logged in
- **Check Database**: Verify the `tutor_note_views` table exists
- **Check Function**: Ensure `increment_tutor_note_view_count_unique` function exists
- **Check Permissions**: Verify RLS policies are correctly set

#### **Duplicate Views Being Counted**

- **Check Unique Constraint**: Verify `UNIQUE(note_id, user_id)` constraint exists
- **Check Function Logic**: Ensure the function uses `ON CONFLICT DO NOTHING`
- **Check Frontend**: Ensure `useEffect` dependency array is correct

#### **Performance Issues**

- **Check Indexes**: Verify indexes exist on `(note_id, user_id)` and `user_id`
- **Monitor Queries**: Check for slow queries in database logs
- **Optimize Function**: Consider caching if needed

### **Debugging Steps**

1. **Check Browser Console**: Look for error messages
2. **Check Database Logs**: Look for function execution errors
3. **Verify Data**: Check `tutor_note_views` table for expected records
4. **Test Function**: Manually call the function with test data

## Future Enhancements

### **Planned Features**

- **View Analytics Dashboard**: Detailed analytics for tutors
- **View History**: Track when students viewed materials
- **View Notifications**: Notify tutors when students view their materials
- **View Export**: Export view data for external analysis

### **Advanced Analytics**

- **View Trends**: Track view patterns over time
- **Student Segments**: Analyze views by student characteristics
- **Content Performance**: Compare view rates across different content types
- **Engagement Scoring**: Calculate engagement scores based on views and downloads

This unique view tracking system provides accurate, privacy-protected analytics that help tutors understand the real reach and impact of their educational materials.
