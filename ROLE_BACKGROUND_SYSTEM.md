# Role-Based Background System

This document explains how the new role-based background system works in the MathMentor application.

## Overview

The system implements different background handling strategies based on user roles:

- **Tutor Role**: Background applied to the entire body (outer wrapper)
- **Student Role**: Background applied only to the inner content wrapper, with outer body set to neutral/transparent
- **Other Roles**: Background applied to the entire body (outer wrapper)

## How It Works

### 1. Role-Based Styling Utilities (`src/utils/roleStyles.ts`)

The system provides utility functions to determine the appropriate background classes:

```typescript
// Get background class for a specific role
export const getRoleBackground = (role?: string) => {
  switch (role) {
    case "tutor":
      return "bg-[#D5FFC5]"; // Green background for tutors
    case "student":
      return ""; // No background for students (inner wrapper handles it)
    case "admin":
    case "principal":
    case "teacher":
    case "parent":
    case "hr":
    case "finance":
    case "support":
      return "bg-[#D5FFC5]"; // Green background for other roles
    default:
      return "bg-gray-50"; // Default fallback
  }
};

// Get complete container class for a role
export const getRoleContainerClass = (role?: string) => {
  const baseClass = "min-h-screen";
  const backgroundClass = getRoleBackground(role);

  return `${baseClass} ${backgroundClass}`.trim();
};

// Get student content wrapper class
export const getStudentContentWrapperClass = () => {
  return "min-h-screen bg-gray-50"; // Student pages get background on inner wrapper
};

// Get tutor content wrapper class
export const getTutorContentWrapperClass = () => {
  return "min-h-screen"; // Tutor pages get background on outer wrapper
};
```

### 2. Layout Components

#### DashboardLayout (`src/components/layout/DashboardLayout.tsx`)

- Used for admin, principal, teacher, parent, hr, finance, and support roles
- Applies background using `getRoleContainerClass(profile?.role)`
- For students, no background is applied (inner wrapper handles it)

#### TutorLayout (`src/components/layout/TutorLayout.tsx`)

- Used specifically for tutor routes
- Applies background using `getRoleContainerClass("tutor")`
- Provides the green background (`bg-[#D5FFC5]`) for all tutor pages

#### StudentLayout (`src/components/layout/StudentLayout.tsx`)

- Used for student routes
- Applies background using `getStudentContentWrapperClass()`
- Provides the gray background (`bg-gray-50`) for student pages

### 3. Routing Structure

The routing is organized to use the appropriate layout for each role:

```typescript
// Tutor routes
<Route path="tutor/*" element={<ProtectedRoute requiredRole="tutor"><TutorLayout /></ProtectedRoute>}>
  <Route index element={<TutorDashboard />} />
  <Route path="manage-materials" element={<ManageMaterialsPage />} />
  <Route path="flashcards" element={<ManageFlashcardsPage />} />
  // ... other tutor routes
</Route>

// Student routes
<Route path="student/*" element={<ProtectedRoute requiredRole="student"><StudentLayout /></ProtectedRoute>}>
  <Route index element={<StudentDashboard />} />
  <Route path="instant-session" element={<InstantSessionPage />} />
  // ... other student routes
</Route>

// Other roles use DashboardLayout
<Route path="/" element={<DashboardLayout />}>
  // ... routes for other roles
</Route>
```

## Implementation Details

### Background Application Strategy

1. **Tutor Pages**:

   - Outer wrapper (TutorLayout) provides `bg-[#D5FFC5]`
   - Individual pages should NOT have their own background wrappers
   - Pages should use `min-h-screen` without background classes

2. **Student Pages**:

   - Outer wrapper (StudentLayout) provides `bg-gray-50`
   - Individual pages should NOT have their own background wrappers
   - Pages should use `min-h-screen` without background classes

3. **Other Role Pages**:
   - Outer wrapper (DashboardLayout) provides `bg-[#D5FFC5]`
   - Individual pages should NOT have their own background wrappers

### Page Structure Requirements

#### For Tutor Pages

```tsx
// ✅ CORRECT - No background wrapper
return (
  <div className="min-h-screen">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page content */}
    </div>
  </div>
);

// ❌ INCORRECT - Duplicate background wrapper
return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    {/* Page content */}
  </div>
);
```

#### For Student Pages

```tsx
// ✅ CORRECT - No background wrapper
return (
  <div className="min-h-screen">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page content */}
    </div>
  </div>
);

// ❌ INCORRECT - Duplicate background wrapper
return <div className="min-h-screen bg-gray-50">{/* Page content */}</div>;
```

## Benefits

1. **Consistent Design**: All pages within a role have the same background treatment
2. **Easy Maintenance**: Background changes can be made in one place per role
3. **Performance**: No duplicate background styling
4. **Flexibility**: Easy to change background colors per role without touching individual pages
5. **Scalability**: New pages automatically inherit the correct background treatment

## Maintenance

### Adding New Roles

1. Add the role to the `getRoleBackground` function in `roleStyles.ts`
2. Determine if the role should get the outer background or inner wrapper background
3. Update the appropriate layout component if needed

### Changing Background Colors

1. **Tutor/Other Roles**: Update the `bg-[#D5FFC5]` value in `roleStyles.ts`
2. **Student Role**: Update the `bg-gray-50` value in `roleStyles.ts`

### Adding New Pages

1. **Tutor Pages**: Add to the tutor route group in `App.tsx`, no background wrapper needed
2. **Student Pages**: Add to the student route group in `App.tsx`, no background wrapper needed
3. **Other Role Pages**: Add to the DashboardLayout route group in `App.tsx`, no background wrapper needed

## Troubleshooting

### Common Issues

1. **Double Backgrounds**: If you see two backgrounds, check if the page has its own background wrapper
2. **No Background**: If a page has no background, ensure it's using the correct layout component
3. **Wrong Background**: Check if the page is in the correct route group for its role

### Debugging

1. Check the page's route configuration in `App.tsx`
2. Verify the page is using the correct layout component
3. Ensure the page doesn't have its own background wrapper
4. Check the browser's developer tools to see which CSS classes are being applied

## Examples

### Tutor Page Example

```tsx
// src/pages/tutor/ManageMaterialsPage.tsx
const ManageMaterialsPage: React.FC = () => {
  // ... component logic

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page content with white cards/widgets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Content */}
        </div>
      </div>
    </div>
  );
};
```

### Student Page Example

```tsx
// src/pages/student/InstantSessionPage.tsx
const InstantSessionPage: React.FC = () => {
  // ... component logic

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page content with white cards/widgets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Content */}
        </div>
      </div>
    </div>
  );
};
```

## Notes

- Cards and widgets should maintain their own white surfaces (`bg-white`)
- The role-based background only affects the page-level background
- Individual UI components should not be affected by this system
- The system is designed to be easily extensible for new roles and background preferences
