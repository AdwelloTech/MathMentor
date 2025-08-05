# Tutor Notes Simplified Form Guide

## Changes Made

The tutor notes creation form has been simplified to provide a more streamlined user experience.

## What Changed

### Before (Complex)

- **Material Type Selection**: Users had to choose between "Text Note" or "File Upload"
- **Conditional Fields**: Different fields appeared based on the selected type
- **Required Fields**: Content was required for text notes, file was required for file uploads

### After (Simplified)

- **Unified Form**: Single form with all options available
- **Optional Fields**: Both content and file upload are optional
- **Flexible Creation**: Users can provide content, upload a file, or both

## New Form Structure

### Required Fields

- **Material Title** - Always required
- **Subject** - Subject classification (dropdown)

### Optional Fields

- **Description** - Brief description of the material
- **Content** - Rich text editor for written content
- **File Upload** - Drag & drop or click to upload PDFs, Word docs, images, etc.
- **Premium Toggle** - Mark as premium material

## Benefits

### For Users

- **Simpler Workflow**: No need to choose between types upfront
- **Flexibility**: Can add both content and files to the same material
- **Less Confusion**: All options are visible and available
- **Better UX**: More intuitive form layout with drag & drop file upload

### For System

- **Unified Data Model**: All materials follow the same structure
- **Easier Maintenance**: Single form logic instead of conditional rendering
- **Future-Proof**: Easy to add new field types without major changes

## Usage Examples

### Text-Only Material

1. Enter title
2. Add description
3. Select subject
4. Write content in rich text editor
5. Mark as premium if needed
6. Create material

### File-Only Material

1. Enter title
2. Add description
3. Select subject
4. Upload file (click or drag & drop)
5. Mark as premium if needed
6. Create material

### Combined Material

1. Enter title
2. Add description
3. Select subject
4. Write content in rich text editor
5. Upload file (click or drag & drop)
6. Mark as premium if needed
7. Create material

## Validation Rules

- **Title**: Required (cannot be empty)
- **Subject**: Required (must be selected)
- **Content**: Optional (can be empty if file is provided)
- **File**: Optional (can be empty if content is provided)
- **At least one**: Either content or file must be provided

## Technical Implementation

### Form State

```typescript
const [formData, setFormData] = useState({
  title: "",
  description: "",
  content: "",
  subjectId: "",
  isPremium: false,
});
const [selectedFile, setSelectedFile] = useState<File | null>(null);
```

### Validation Logic

```typescript
if (!formData.subjectId) {
  toast.error("Please select a subject");
  return;
}

// Both content and file are optional, but at least one should be provided
if (!formData.content.trim() && !selectedFile) {
  toast.error("Please provide either content or upload a file");
  return;
}
```

### Data Creation

```typescript
const noteData: CreateTutorNoteData = {
  title: formData.title.trim(),
  description: formData.description.trim() || undefined,
  content: formData.content.trim() || undefined,
  subjectId: formData.subjectId || undefined,
  isPremium: formData.isPremium,
};
```

## Migration Notes

- Existing materials continue to work as before
- No database changes required
- Backward compatible with existing data
- File viewing/downloading functionality remains unchanged
