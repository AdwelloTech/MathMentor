# MathMentor Theme System

This document explains how to use the centralized theme system in MathMentor.

## Overview

MathMentor now has a centralized theme configuration with full dark mode support. The theme system provides:

- Consistent colors across the application
- Easy dark/light mode switching
- Type-safe theme tokens
- Better readability and UX

## File Structure

```
src/
├── config/
│   └── theme.ts                 # Centralized theme configuration
├── contexts/
│   └── ThemeContext.tsx         # Theme context provider
└── components/
    └── ui/
        └── ThemeToggle.tsx      # Dark mode toggle button
```

## Using the Theme

### 1. Theme Context

The theme context is already set up in `main.tsx`. Access it in any component:

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### 2. Theme Toggle Component

Add the theme toggle button to any page:

```tsx
import { ThemeToggle } from '@/components/ui/ThemeToggle';

function MyPage() {
  return (
    <div>
      <ThemeToggle className="text-foreground hover:bg-muted" />
    </div>
  );
}
```

### 3. Using Theme Colors

Instead of hardcoded colors, use Tailwind's theme tokens:

```tsx
// ❌ Bad - Hardcoded colors
<div className="bg-[#0F172A] text-[#F1F5F9]">

// ✅ Good - Theme tokens
<div className="bg-background text-foreground">

// ❌ Bad - Hardcoded primary color
<Button className="bg-[#10B981] hover:bg-[#059669]">

// ✅ Good - Theme token
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
```

## Available Theme Tokens

### Colors

#### Backgrounds
- `bg-background` - Main background
- `bg-card` - Card backgrounds
- `bg-muted` - Muted/secondary backgrounds
- `bg-secondary` - Secondary surfaces

#### Text
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `text-card-foreground` - Text on cards

#### Brand Colors
- `bg-primary` / `text-primary` - Primary brand color (emerald green)
- `bg-accent` / `text-accent` - Accent color (golden amber)

#### Interactive States
- `hover:bg-muted` - Hover background
- `border-border` - Border color
- `ring-ring` - Focus ring color

#### Semantic Colors
- `bg-destructive` - Error/danger states
- `text-success` - Success messages
- `text-warning` - Warning messages

### Typography

From `src/config/theme.ts`:

```typescript
import theme from '@/config/theme';

// Fonts
theme.typography.fonts.heading  // 'Clash Display', 'Inter', ...
theme.typography.fonts.body     // 'Inter', ...
theme.typography.fonts.mono     // 'JetBrains Mono', ...

// Sizes
theme.typography.sizes.xs       // 0.75rem
theme.typography.sizes.base     // 1rem
theme.typography.sizes['4xl']   // 2.25rem
```

### Spacing

```typescript
theme.spacing.sm    // 0.5rem
theme.spacing.md    // 1rem
theme.spacing.xl    // 2rem
```

## Color Scheme

### Light Mode
- Background: Clean white
- Text: Dark gray with excellent contrast
- Primary: Emerald green (#10B981)
- Accent: Amber gold (#F59E0B)

### Dark Mode
- Background: Deep navy blue
- Text: Light gray/white with proper contrast
- Primary: Emerald green (#10B981)
- Accent: Golden amber (#FBBF24)

## Best Practices

### 1. Always Use Theme Tokens

```tsx
// ✅ Good
<Card className="bg-card border-border">
  <h2 className="text-card-foreground">Title</h2>
  <p className="text-muted-foreground">Description</p>
</Card>

// ❌ Bad
<Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
  <h2 className="text-gray-900 dark:text-white">Title</h2>
  <p className="text-gray-600 dark:text-gray-400">Description</p>
</Card>
```

### 2. Use Opacity for Variations

```tsx
// Lighten a color
<div className="bg-primary/10">  {/* 10% opacity */}
<div className="bg-primary/20">  {/* 20% opacity */}

// Hover states
<button className="hover:bg-primary/90">
```

### 3. Consistent Shadows

```tsx
<Card className="shadow-sm">  {/* Small shadow */}
<Card className="shadow-md">  {/* Medium shadow */}
<Card className="shadow-lg">  {/* Large shadow */}
<Card className="shadow-xl">  {/* Extra large shadow */}
```

### 4. Focus States

```tsx
<input className="
  bg-input 
  border-border 
  focus:ring-2 
  focus:ring-ring 
  focus:border-primary
" />
```

## Migration Guide

To migrate existing components to use the theme system:

1. Replace hardcoded background colors with `bg-background` or `bg-card`
2. Replace text colors with `text-foreground` or `text-muted-foreground`
3. Replace brand colors with `bg-primary` and `bg-accent`
4. Remove manual dark mode classes (`dark:bg-...`) - they're handled automatically
5. Add `<ThemeToggle />` to navigation/header components

## Examples

### Dashboard Card

```tsx
<Card className="bg-card border-border shadow-lg">
  <CardHeader>
    <CardTitle className="text-card-foreground">
      My Stats
    </CardTitle>
    <CardDescription className="text-muted-foreground">
      Your learning progress
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="bg-primary/10 p-4 rounded-lg">
      <p className="text-primary font-semibold">100%</p>
    </div>
  </CardContent>
</Card>
```

### Button with Theme

```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Action
</Button>

<Button className="bg-accent text-accent-foreground hover:bg-accent/90">
  Secondary Action
</Button>
```

### Interactive List Item

```tsx
<div className="
  bg-secondary 
  hover:bg-secondary/80 
  border-border 
  rounded-lg 
  p-3 
  cursor-pointer 
  transition-colors
">
  <h3 className="text-card-foreground font-medium">Item Title</h3>
  <p className="text-muted-foreground text-sm">Description</p>
</div>
```

## Customization

To customize theme colors, edit `src/index.css`:

```css
:root {
  --primary: 142 71% 45%;  /* HSL values for emerald */
  --accent: 45 93% 47%;    /* HSL values for amber */
  /* ... other variables */
}

.dark {
  --primary: 142 76% 45%;
  --accent: 45 93% 60%;
  /* ... other variables */
}
```

## Accessibility

The theme system ensures WCAG AA contrast ratios:
- Text on backgrounds: minimum 4.5:1 ratio
- Large text: minimum 3:1 ratio
- Interactive elements have clear focus indicators

## Support

For questions or issues with the theme system:
1. Check this README
2. Review `src/config/theme.ts` for available tokens
3. Look at `StudentDashboard.tsx` for implementation examples

