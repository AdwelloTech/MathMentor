# Theme Quick Reference Card

Use this as a quick lookup when styling components.

## Common Color Classes

### Backgrounds
```tsx
bg-background       // Main page background
bg-card             // Card/panel backgrounds
bg-muted            // Muted/secondary areas
bg-secondary        // Alternative surfaces
bg-primary          // Primary brand color
bg-accent           // Accent/highlight color
```

### Text Colors
```tsx
text-foreground         // Primary text
text-card-foreground    // Text on cards
text-muted-foreground   // Secondary/helper text
text-primary            // Primary brand text
text-accent             // Accent text
text-destructive        // Error/danger text
```

### Borders
```tsx
border-border       // Standard borders
border-primary      // Primary brand borders
border-destructive  // Error borders
```

### Interactive States
```tsx
hover:bg-muted              // Hover background
hover:bg-primary/90         // Hover on primary
hover:text-primary          // Hover text
focus:ring-ring             // Focus ring
focus:border-primary        // Focus border
```

## Component Patterns

### Card
```tsx
<Card className="bg-card border-border shadow-lg">
  <CardHeader>
    <CardTitle className="text-card-foreground">Title</CardTitle>
    <CardDescription className="text-muted-foreground">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Button (Primary)
```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Click Me
</Button>
```

### Button (Secondary)
```tsx
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
  <h3 className="text-card-foreground">Item Title</h3>
  <p className="text-muted-foreground text-sm">Description</p>
</div>
```

### Badge
```tsx
<Badge className="bg-primary/10 text-primary border-primary/20">
  Status
</Badge>
```

### Icon Container
```tsx
<div className="
  bg-primary/10 
  w-10 h-10 
  rounded-lg 
  flex items-center justify-center
">
  <Icon className="w-5 h-5 text-primary" />
</div>
```

### Input
```tsx
<input className="
  bg-input 
  border-border 
  text-foreground 
  placeholder:text-muted-foreground
  focus:ring-2 
  focus:ring-ring 
  focus:border-primary
" />
```

## Opacity Modifiers

```tsx
bg-primary/5      // 5% opacity
bg-primary/10     // 10% opacity
bg-primary/20     // 20% opacity
bg-primary/50     // 50% opacity
bg-primary/80     // 80% opacity
bg-primary/90     // 90% opacity
```

## Common Shadows

```tsx
shadow-sm     // Small shadow
shadow-md     // Medium shadow
shadow-lg     // Large shadow
shadow-xl     // Extra large shadow
```

## Typography

```tsx
text-xs       // 0.75rem
text-sm       // 0.875rem
text-base     // 1rem
text-lg       // 1.125rem
text-xl       // 1.25rem
text-2xl      // 1.5rem
text-3xl      // 1.875rem
text-4xl      // 2.25rem

font-normal   // 400
font-medium   // 500
font-semibold // 600
font-bold     // 700
```

## Spacing

```tsx
p-2, m-2      // 0.5rem
p-4, m-4      // 1rem
p-6, m-6      // 1.5rem
p-8, m-8      // 2rem

gap-2         // 0.5rem gap
gap-4         // 1rem gap
gap-6         // 1.5rem gap
```

## Border Radius

```tsx
rounded-sm    // 0.375rem
rounded-md    // 0.5rem
rounded-lg    // 0.75rem
rounded-xl    // 1rem
rounded-2xl   // 1.5rem
rounded-full  // 9999px (circle)
```

## Theme Toggle

```tsx
import { ThemeToggle } from '@/components/ui/ThemeToggle';

<ThemeToggle className="text-foreground hover:bg-muted" />
```

## Access Theme in Code

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  // theme is 'light' or 'dark'
  // toggleTheme() switches between modes
  // setTheme('light') or setTheme('dark') sets directly
}
```

## Import Theme Config

```tsx
import theme from '@/config/theme';

// Access colors
theme.colors.light.brand.primary
theme.colors.dark.brand.primary

// Access typography
theme.typography.fonts.heading
theme.typography.sizes.xl

// Access spacing
theme.spacing.md
```

## Do's and Don'ts

### ✅ Do
```tsx
// Use theme tokens
<div className="bg-background text-foreground">

// Use opacity for variations
<div className="bg-primary/10">

// Use semantic color names
<Button className="bg-primary text-primary-foreground">
```

### ❌ Don't
```tsx
// Don't use hardcoded colors
<div className="bg-[#0F172A] text-[#F1F5F9]">

// Don't use manual dark mode classes
<div className="bg-white dark:bg-gray-900">

// Don't use arbitrary color values
<div style={{ backgroundColor: '#10B981' }}>
```

## Common Gradients

```tsx
// Primary gradient
bg-gradient-to-br from-primary to-primary/80

// Subtle background gradient
bg-gradient-to-br from-primary/5 to-accent/5

// Card with gradient
bg-gradient-to-br from-card to-card/80
```

## Transitions

```tsx
transition-all duration-200       // All properties
transition-colors duration-200    // Only colors
transition-transform duration-200 // Only transforms

hover:scale-105                   // Scale on hover
hover:shadow-xl                   // Shadow on hover
hover:-translate-y-1              // Lift on hover
```

## Print This Card

This quick reference is designed to be printed or kept open while coding. Bookmark it in your editor!

