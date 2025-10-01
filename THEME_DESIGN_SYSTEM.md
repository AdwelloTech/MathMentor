# MathMentor Dark Theme Design System

## Overview
This document defines the complete design system for MathMentor's dark theme, inspired by fantasy/gaming UI aesthetics while maintaining professional dashboard standards. Use this as a reference to ensure consistency across all pages (login, register, forgot password, dashboard, etc.).

---

## Color Palette

### Primary Colors
```css
/* CSS Variables (HSL format) */
--background: 20 8% 8%;           /* Deep warm dark background (#1a1612) */
--foreground: 45 20% 92%;         /* Warm light text (#ede8df) */
--card: 20 10% 12%;               /* Card background (#211e1a) */
--card-foreground: 45 18% 90%;    /* Card text (#e6e0d5) */
--primary: 142 76% 36%;           /* Rich emerald green (#059669) */
--primary-foreground: 0 0% 98%;   /* White text on primary */
--accent: 45 90% 55%;             /* Golden amber (#f59e0b) */
--accent-foreground: 20 8% 8%;    /* Dark text on accent */
--muted: 20 8% 18%;               /* Muted backgrounds */
--muted-foreground: 45 8% 60%;    /* Muted text (#9a9087) */
--border: 20 8% 22%;              /* Border color (#3a3630) */
--input: 20 8% 15%;               /* Input backgrounds (#272320) */
--ring: 142 76% 36%;              /* Focus ring (emerald) */
```

### Tailwind Color Extensions
```javascript
// Gaming-inspired colors
emerald: {
  50: "#ecfdf5",
  400: "#34d399",  // Links hover
  500: "#10b981",  // Primary actions
  600: "#059669",  // Primary buttons
  700: "#047857",  // Primary button hover
  800: "#065f46",  // Backgrounds
  900: "#064e3b"   // Deep backgrounds
}

amber: {
  100: "#fef3c7",  // Hero text
  200: "#fde68a",  // Subtitle text
  400: "#fbbf24",  // Accent elements, math symbols
  500: "#f59e0b",  // Accent primary
  600: "#d97706"   // Accent hover
}

stone: {
  800: "#292524",  // Supporting dark tones
  900: "#1c1917"   // Deep backgrounds
}
```

### Semantic Colors
- **Success**: `emerald-500` (#10b981)
- **Warning**: `amber-500` (#f59e0b)
- **Error**: `red-400` (#ef4444) for text, `red-500` for borders
- **Info**: `emerald-400` (#34d399)

---

## Typography

### Font Family
```css
/* Primary Font Stack */
font-family: 'Clash Display', 'Inter', system-ui, sans-serif;

/* Import */
@import url('https://fonts.cdnfonts.com/css/clash-display');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

### Font Usage
- **Headings**: Clash Display (bold, extrabold)
- **Body Text**: Clash Display with Inter fallback
- **Monospace** (code): Fira Code

### Typography Scale
```css
/* Headings */
h1: text-5xl md:text-6xl (3rem - 3.75rem), font-extrabold
h2: text-3xl (1.875rem), font-bold
h3: text-2xl (1.5rem), font-bold
h4: text-xl (1.25rem), font-semibold

/* Body */
base: text-base (1rem)
large: text-lg md:text-xl (1.125rem - 1.25rem)
small: text-sm (0.875rem)
extra-small: text-xs (0.75rem)
```

---

## Layout Structure

### Authentication Pages (Login, Register, Forgot Password)

#### Two-Column Grid Layout
```jsx
<div className="h-screen w-screen grid grid-cols-1 lg:grid-cols-2 relative bg-background text-foreground font-clash">
  {/* Left Column - Visual Panel */}
  <motion.div className="relative hidden lg:flex items-center justify-center overflow-hidden">
    {/* Content */}
  </motion.div>
  
  {/* Right Column - Form */}
  <motion.div className="bg-card max-w-full flex flex-col justify-center items-center p-6 md:p-10 relative border-l border-border/50">
    {/* Content */}
  </motion.div>
</div>
```

---

## Components

### 1. Hero Panel (Left Column)

#### Container
```jsx
<div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-stone-900 overflow-visible border border-amber-500/20 shadow-2xl">
  {/* Decorative circles */}
  <div className="absolute -left-10 -bottom-24 h-[38rem] w-[38rem] rounded-full border-2 border-amber-400/10" />
  <div className="absolute left-10 top-16 h-[28rem] w-[28rem] rounded-full border-2 border-amber-400/10" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
  
  {/* Math symbols SVG overlay */}
  {/* Content */}
</div>
```

#### Hero Text
```jsx
<div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center text-amber-50 px-10 pt-0">
  <motion.h1
    className="text-5xl md:text-6xl font-extrabold leading-tight mb-4 text-amber-100 drop-shadow-lg tracking-wide"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
  >
    Welcome Back
  </motion.h1>
  
  <motion.p
    className="text-amber-200/90 max-w-[640px] mb-12 text-base md:text-xl"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
  >
    Enter your credentials to sign in to MathMentor
  </motion.p>
  
  {/* Illustration image */}
  <motion.img
    src="/path/to/image.png"
    alt="Illustration"
    className="pointer-events-none absolute -translate-x-1/2 bottom-[-42px] w-[88%] max-w-[680px] object-contain drop-shadow-2xl"
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  />
</div>
```

#### Math Symbols Background (SVG)
```jsx
<svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
  {/* Math symbols with fill="#f59e0b" (amber-500) */}
  <text x="15" y="25" fill="#f59e0b" fontSize="8" fontFamily="Arial, sans-serif">+</text>
  <text x="75" y="20" fill="#f59e0b" fontSize="5" fontFamily="Arial, sans-serif">−</text>
  <text x="90" y="70" fill="#f59e0b" fontSize="7" fontFamily="Arial, sans-serif">×</text>
  <text x="65" y="85" fill="#f59e0b" fontSize="6" fontFamily="Arial, sans-serif">÷</text>
  <text x="80" y="50" fill="#f59e0b" fontSize="5" fontFamily="Arial, sans-serif">=</text>
  <text x="95" y="15" fill="#f59e0b" fontSize="4" fontFamily="Arial, sans-serif">π</text>
  <text x="70" y="25" fill="#f59e0b" fontSize="6" fontFamily="Arial, sans-serif">√</text>
  <text x="50" y="15" fill="#f59e0b" fontSize="4" fontFamily="Arial, sans-serif">∞</text>
  {/* Add more as needed for visual interest */}
</svg>
```

---

### 2. Form Container (Right Column)

#### Header
```jsx
<div className="mb-8 text-center">
  <h2 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent tracking-wide">
    Sign in to MathMentor
  </h2>
  <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-amber-500 mx-auto rounded-full" />
</div>
```

#### Form Wrapper
```jsx
<motion.form
  onSubmit={handleSubmit(onSubmit)}
  className="space-y-6 w-full max-w-md bg-black/20 border border-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {/* Form fields */}
</motion.form>
```

---

### 3. Form Fields

#### Input Field
```jsx
<motion.div className="space-y-2" variants={fadeInUp}>
  <Label htmlFor="email" className="text-amber-200/90">
    Email Address
  </Label>
  <Input
    type="email"
    id="email"
    placeholder="Enter your email"
    className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
  />
  {/* Error message */}
  {error && <p className="text-sm text-red-400">{error.message}</p>}
</motion.div>
```

#### Password Field with Toggle
```jsx
<motion.div className="space-y-2" variants={fadeInUp}>
  <Label htmlFor="password" className="text-amber-200/90">
    Password
  </Label>
  <div className="relative">
    <Input
      type={showPassword ? "text" : "password"}
      id="password"
      placeholder="Enter your password"
      className="pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
    />
    <button
      type="button"
      className="absolute inset-y-0 right-0 pr-3 flex items-center"
      onClick={() => setShowPassword(!showPassword)}
    >
      {showPassword ? (
        <EyeSlashIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      ) : (
        <EyeIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      )}
    </button>
  </div>
</motion.div>
```

#### Checkbox with Label
```jsx
<div className="flex items-center space-x-2">
  <Checkbox id="remember" />
  <Label htmlFor="remember" className="text-sm font-normal">
    Remember me
  </Label>
</div>
```

---

### 4. Buttons

#### Primary Button (Emerald Green)
```jsx
<Button
  type="submit"
  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
  size="lg"
>
  <BookOpenIcon className="h-5 w-5" />
  Sign In
</Button>
```

#### Secondary/Outline Button
```jsx
<Button
  variant="outline"
  className="w-full border-border bg-transparent hover:bg-muted text-foreground"
>
  Button Text
</Button>
```

---

### 5. Links

#### Primary Link (Emerald)
```jsx
<Link
  to="/register"
  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
>
  Register here
</Link>
```

#### Accent Link (Amber)
```jsx
<Link
  to="/admin/login"
  className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
>
  Admin Login →
</Link>
```

#### Muted Text with Link
```jsx
<p className="text-muted-foreground">
  Don't have an account?{" "}
  <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
    Register here
  </Link>
</p>
```

---

### 6. Error States

#### Error Box
```jsx
<motion.div
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  className="p-3 bg-red-950/50 border border-red-500/30 rounded-lg backdrop-blur-sm"
>
  <p className="text-sm text-red-400">{error.message}</p>
</motion.div>
```

#### Inline Error
```jsx
{errors.email && (
  <p className="text-sm text-red-400">{errors.email.message}</p>
)}
```

---

## Animations

### Framer Motion Variants

#### Container Stagger
```javascript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};
```

#### Fade In Up
```javascript
const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};
```

#### Panel Slide In
```javascript
// Left panel
initial={{ x: -24, opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
transition={{ duration: 0.5, ease: "easeOut" }}

// Right panel
initial={{ x: 24, opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
transition={{ duration: 0.5, ease: "easeOut" }}
```

---

## Spacing & Sizing

### Container Spacing
```css
/* Outer padding */
p-6 md:p-10  /* Form containers */
px-8 py-16   /* Hero panels */

/* Form spacing */
space-y-6    /* Between form sections */
space-y-2    /* Within form groups */
mb-8         /* Section spacing */

/* Max widths */
max-w-md     /* Forms (448px) */
max-w-[640px] /* Text content */
```

### Border Radius
```css
rounded-lg    /* 0.5rem - buttons, inputs */
rounded-xl    /* 0.75rem - cards */
rounded-2xl   /* 1rem - form containers */
rounded-3xl   /* 1.5rem - hero panels */
rounded-full  /* Pills, badges */
```

---

## Shadows & Effects

### Box Shadows
```css
/* Subtle shadow */
shadow-sm

/* Medium shadow */
shadow-lg

/* Dramatic shadow */
shadow-2xl

/* Custom shadow */
shadow-[0_8px_30px_rgba(0,0,0,0.12)]

/* Glow effect */
hover:shadow-emerald-500/25
```

### Drop Shadows
```css
drop-shadow-lg   /* Text */
drop-shadow-2xl  /* Images */
```

### Backdrop Effects
```css
backdrop-blur-sm  /* Glassmorphism */
bg-black/20       /* Semi-transparent backgrounds */
border-white/5    /* Subtle borders */
```

---

## Responsive Design

### Breakpoints
```css
/* Mobile first approach */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop (two-column layout) */
xl: 1280px  /* Large desktop */
```

### Common Responsive Patterns
```jsx
{/* Hide on mobile, show on desktop */}
<div className="hidden lg:flex">...</div>

{/* Responsive text sizing */}
<h1 className="text-5xl md:text-6xl">...</h1>

{/* Responsive padding */}
<div className="p-6 md:p-10">...</div>

{/* Responsive grid */}
<div className="grid grid-cols-1 lg:grid-cols-2">...</div>
```

---

## Accessibility

### Focus States
```css
/* Focus ring (emerald primary) */
focus:ring-primary
focus:ring-2
focus:outline-none

/* Visible focus */
focus-visible:ring-red-500  /* Error states */
```

### Contrast Requirements
- **Text on dark backgrounds**: Use `text-foreground` (warm light) or `text-amber-100`
- **Labels**: `text-amber-200/90` for good contrast
- **Muted text**: `text-muted-foreground` (passes WCAG AA)
- **Links**: Emerald-400 and Amber-400 (high contrast on dark)

### ARIA Labels
```jsx
<Input aria-label="Email address" aria-required="true" />
<Button aria-label="Toggle password visibility" />
```

---

## CSS Variables Setup

### In `index.css`
```css
@import url('https://fonts.cdnfonts.com/css/clash-display');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-gray-200;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-family: 'Clash Display', 'Inter', system-ui, sans-serif;
  }

  html {
    @apply h-full;
  }

  #root {
    @apply h-full;
  }
  
  :root {
    /* Dark Gaming Theme - Inspired by fantasy UI */
    --background: 20 8% 8%;
    --foreground: 45 20% 92%;
    --card: 20 10% 12%;
    --card-foreground: 45 18% 90%;
    --popover: 20 12% 10%;
    --popover-foreground: 45 18% 90%;
    --primary: 142 76% 36%;
    --primary-foreground: 0 0% 98%;
    --secondary: 35 25% 20%;
    --secondary-foreground: 45 15% 85%;
    --muted: 20 8% 18%;
    --muted-foreground: 45 8% 60%;
    --accent: 45 90% 55%;
    --accent-foreground: 20 8% 8%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 98%;
    --border: 20 8% 22%;
    --input: 20 8% 15%;
    --ring: 142 76% 36%;
    --chart-1: 142 76% 36%;
    --chart-2: 45 90% 55%;
    --chart-3: 35 25% 45%;
    --chart-4: 200 50% 45%;
    --chart-5: 280 50% 55%;
    --radius: 0.75rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Clash Display', 'Inter', system-ui, sans-serif;
  }
}
```

---

## Complete Page Examples

### Login Page Structure
```jsx
import { motion } from "framer-motion";
import { EyeIcon, EyeSlashIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const LoginPage = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
  };

  return (
    <div className="h-screen w-screen grid grid-cols-1 lg:grid-cols-2 relative bg-background text-foreground font-clash">
      {/* Left Panel with Hero & Image */}
      <motion.div
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative hidden lg:flex items-center justify-center overflow-hidden"
      >
        {/* Gradient background with decorative elements */}
      </motion.div>

      {/* Right Panel with Form */}
      <motion.div
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-card max-w-full flex flex-col justify-center items-center p-6 md:p-10 relative border-l border-border/50"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent tracking-wide">
            Sign in to MathMentor
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-amber-500 mx-auto rounded-full" />
        </div>

        <motion.form
          className="space-y-6 w-full max-w-md bg-black/20 border border-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Form fields here */}
        </motion.form>
      </motion.div>
    </div>
  );
};
```

---

## Design Principles

### 1. **Professional Gaming Aesthetic**
- Rich emerald greens and warm ambers
- Subtle gradients and glows
- Clean, modern typography
- Glassmorphism effects

### 2. **Hierarchy**
- Gradient text for primary headings
- Amber labels for form fields
- Muted text for secondary content
- Clear visual separation between sections

### 3. **Interactive States**
- Smooth color transitions (200ms)
- Hover effects on all interactive elements
- Clear focus states
- Loading states for async actions

### 4. **Consistency**
- Always use emerald for primary actions
- Amber for accents and highlights
- Red for errors
- Maintain spacing rhythm (multiples of 4)

---

## Quick Reference Cheatsheet

```jsx
// Background
bg-background         // Page background
bg-card              // Card/panel background
bg-input             // Input fields

// Text Colors
text-foreground       // Primary text
text-muted-foreground // Secondary text
text-amber-200/90     // Labels
text-emerald-400      // Primary links
text-amber-400        // Accent links
text-red-400          // Error text

// Borders
border-border         // Standard borders
border-border/50      // Subtle dividers
border-white/5        // Glass effect borders

// Buttons
from-emerald-600 to-emerald-700    // Primary gradient
hover:from-emerald-500 to-emerald-600  // Hover state

// Headings
bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent

// Accent Line
bg-gradient-to-r from-emerald-500 to-amber-500

// Focus Ring
focus:ring-primary

// Glass Effect
bg-black/20 border border-white/5 backdrop-blur-sm
```

---

## Notes for Other Pages

### Register Page
- Use same two-column layout
- Change hero text: "Join MathMentor" or "Create Your Account"
- Add password strength indicator (emerald for strong)
- Terms & conditions checkbox

### Forgot Password Page
- Can use single-column centered layout OR two-column
- Hero text: "Reset Your Password"
- Success state: green checkmark with emerald glow

### Dashboard
- Use `bg-background` for main area
- Cards with `bg-card` and `border-border`
- Sidebar with `bg-card` and emerald active states
- Keep emerald/amber accent colors throughout

---

## Implementation Checklist

- [ ] Import Clash Display and Inter fonts
- [ ] Set CSS variables in `:root`
- [ ] Apply `font-clash` to main container
- [ ] Use two-column grid layout for auth pages
- [ ] Add gradient hero panel with math symbols
- [ ] Style forms with glass effect container
- [ ] Use emerald for primary actions
- [ ] Use amber for accents and labels
- [ ] Add proper focus states
- [ ] Implement smooth transitions
- [ ] Test responsive behavior
- [ ] Verify accessibility contrast

---

**Version**: 1.0  
**Last Updated**: 2025-09-29  
**Author**: MathMentor Design Team
