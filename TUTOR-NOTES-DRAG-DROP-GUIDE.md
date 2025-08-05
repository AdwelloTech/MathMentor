# Tutor Notes Drag & Drop File Upload Guide

## New Feature: Drag & Drop File Upload

The tutor notes system now includes drag and drop functionality for easier file uploads.

## How to Use Drag & Drop

### Method 1: Drag & Drop

1. **Open the Create Material modal**
2. **Navigate to the "Upload File" section**
3. **Drag a file from your computer** (from File Explorer, Desktop, etc.)
4. **Drop it onto the upload area** (the dashed border box)
5. **File will be automatically validated and selected**

### Method 2: Click to Browse

1. **Click on the upload area** (the dashed border box)
2. **Browse and select a file** from the file dialog
3. **File will be automatically validated and selected**

## Visual Feedback

### Normal State

- **Border**: Gray dashed border
- **Icon**: Gray upload icon
- **Text**: "Click to select a file or drag and drop"
- **Background**: White

### Drag Over State

- **Border**: Blue dashed border
- **Icon**: Blue upload icon
- **Text**: "Drop your file here"
- **Background**: Light blue
- **Animation**: Smooth color transitions

### File Selected State

- **Border**: Gray dashed border
- **Icon**: Gray upload icon
- **Text**: Shows the selected filename
- **Background**: White
- **Confirmation**: Green box below showing file details

## Supported File Types

### Documents

- **PDF** (.pdf) - Portable Document Format
- **Word Documents** (.doc, .docx) - Microsoft Word files
- **Text Files** (.txt) - Plain text documents

### Images

- **JPEG** (.jpg, .jpeg) - Joint Photographic Experts Group
- **PNG** (.png) - Portable Network Graphics
- **GIF** (.gif) - Graphics Interchange Format

## File Validation

### Size Limit

- **Maximum**: 10MB per file
- **Error Message**: "File size must be less than 10MB"

### Type Validation

- **Error Message**: "Please select a valid file type (PDF, Word, text, or image)"
- **Automatic**: Files are validated when dropped or selected

## Technical Implementation

### Event Handlers

```typescript
const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  setIsDragOver(true);
};

const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  setIsDragOver(false);
};

const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  setIsDragOver(false);

  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) {
    const file = files[0];
    validateAndSetFile(file);
  }
};
```

### State Management

```typescript
const [isDragOver, setIsDragOver] = useState(false);
const [selectedFile, setSelectedFile] = useState<File | null>(null);
```

### CSS Classes

```css
/* Normal state */
border-2 border-dashed border-gray-300

/* Drag over state */
border-2 border-dashed border-blue-500 bg-blue-50

/* Transitions */
transition-all duration-200
```

## User Experience Benefits

### Accessibility

- **Keyboard Navigation**: Still works with tab and enter keys
- **Screen Readers**: Proper ARIA labels and descriptions
- **Fallback**: Click method always available

### Mobile Support

- **Touch Devices**: Tap to open file picker
- **Responsive**: Works on all screen sizes
- **Touch Feedback**: Visual feedback on touch

### Error Handling

- **Clear Messages**: Specific error messages for each validation failure
- **Visual Feedback**: Immediate feedback on invalid files
- **Recovery**: Easy to try again with different files

## Best Practices

### For Users

1. **Check file size** before uploading (keep under 10MB)
2. **Use supported formats** for best compatibility
3. **Drag from file explorer** for quick uploads
4. **Click method** as backup if drag doesn't work

### For Developers

1. **Prevent default** on drag events to avoid browser behavior
2. **Validate files** immediately on drop/selection
3. **Provide clear feedback** for all states
4. **Maintain accessibility** with keyboard navigation

## Troubleshooting

### Drag & Drop Not Working

- **Check browser support**: Modern browsers required
- **Try clicking method**: Always available as fallback
- **Check file permissions**: Ensure files are accessible

### File Validation Errors

- **Size too large**: Compress or use smaller file
- **Unsupported type**: Convert to supported format
- **Corrupted file**: Try a different copy of the file

### Visual Issues

- **Refresh page**: Clear any cached states
- **Check browser**: Update to latest version
- **Clear cache**: Remove browser cache if needed
