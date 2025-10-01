/**
 * MathMentor Centralized Theme Configuration
 * 
 * This file defines all color tokens, typography, spacing, and theme variants
 * for the entire application. Use these tokens instead of hardcoded colors.
 */

export const colors = {
  light: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F8F9FA',
      tertiary: '#F3F4F6',
      elevated: '#FFFFFF',
    },
    surface: {
      primary: '#FFFFFF',
      secondary: '#F8F9FA',
      tertiary: '#E5E7EB',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563',
      tertiary: '#6B7280',
      inverse: '#FFFFFF',
      disabled: '#9CA3AF',
    },
    border: {
      primary: '#E5E7EB',
      secondary: '#D1D5DB',
      focus: '#10B981',
    },
    brand: {
      primary: '#10B981',
      primaryHover: '#059669',
      primaryActive: '#047857',
      secondary: '#F59E0B',
      secondaryHover: '#D97706',
      secondaryActive: '#B45309',
    },
    semantic: {
      success: '#10B981',
      successBg: '#D1FAE5',
      warning: '#F59E0B',
      warningBg: '#FEF3C7',
      error: '#EF4444',
      errorBg: '#FEE2E2',
      info: '#3B82F6',
      infoBg: '#DBEAFE',
    },
    interactive: {
      hover: '#F3F4F6',
      active: '#E5E7EB',
      disabled: '#F9FAFB',
    },
  },
  dark: {
    background: {
      primary: '#0F172A',
      secondary: '#1E293B',
      tertiary: '#334155',
      elevated: '#1E293B',
    },
    surface: {
      primary: 'rgba(16, 185, 129, 0.08)',
      secondary: 'rgba(16, 185, 129, 0.12)',
      tertiary: 'rgba(255, 255, 255, 0.05)',
      overlay: 'rgba(0, 0, 0, 0.75)',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#CBD5E1',
      tertiary: '#94A3B8',
      inverse: '#0F172A',
      disabled: '#64748B',
    },
    border: {
      primary: 'rgba(255, 255, 255, 0.1)',
      secondary: 'rgba(255, 255, 255, 0.05)',
      focus: '#10B981',
    },
    brand: {
      primary: '#10B981',
      primaryHover: '#34D399',
      primaryActive: '#6EE7B7',
      secondary: '#FCD34D',
      secondaryHover: '#FDE68A',
      secondaryActive: '#FEF3C7',
    },
    semantic: {
      success: '#34D399',
      successBg: 'rgba(16, 185, 129, 0.15)',
      warning: '#FBBF24',
      warningBg: 'rgba(245, 158, 11, 0.15)',
      error: '#F87171',
      errorBg: 'rgba(239, 68, 68, 0.15)',
      info: '#60A5FA',
      infoBg: 'rgba(59, 130, 246, 0.15)',
    },
    interactive: {
      hover: 'rgba(255, 255, 255, 0.08)',
      active: 'rgba(255, 255, 255, 0.12)',
      disabled: 'rgba(255, 255, 255, 0.03)',
    },
  },
};

export const typography = {
  fonts: {
    heading: "'Clash Display', 'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Courier New', monospace",
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
};

export const transitions = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export type ThemeMode = 'light' | 'dark';

export const getThemeColors = (mode: ThemeMode) => colors[mode];

export default {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  transitions,
  getThemeColors,
};

