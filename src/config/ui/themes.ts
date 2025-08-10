/**
 * UI Theme Configuration
 * Centralized theme and styling configurations
 */

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600',
  success: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
  warning: 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
  info: 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600'
};

export type InputSize = 'sm' | 'md' | 'lg';

export const INPUT_SIZES: Record<InputSize, string> = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-3 py-2 text-base',
  lg: 'px-4 py-3 text-lg'
};

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';

export const CARD_VARIANTS: Record<CardVariant, string> = {
  default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
  elevated: 'bg-white border border-gray-200 rounded-lg shadow-lg',
  outlined: 'bg-white border-2 border-gray-300 rounded-lg',
  filled: 'bg-gray-50 border border-gray-200 rounded-lg'
};

export const COMMON_ANIMATIONS = {
  fadeIn: 'animate-fade-in',
  slideIn: 'animate-slide-in',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  spin: 'animate-spin'
};

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem'
};
