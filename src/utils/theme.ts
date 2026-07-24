/*
 * src/utils/theme.ts
 * Theme manager defining color preset schemes and CSS variable injection.
 * Created: 2026-07-23
 */

export type ThemePreset = 'cyberpunk' | 'emerald' | 'sunset' | 'midnight';

export interface ThemeColors {
  bgPrimary: string;
  bgCard: string;
  accentPurple: string;
  accentGreen: string;
  accentBlue: string;
  borderColor: string;
}

export const THEME_PRESETS: Record<ThemePreset, ThemeColors> = {
  cyberpunk: {
    bgPrimary: '#0b0914',
    bgCard: '#151226',
    accentPurple: '#8b5cf6',
    accentGreen: '#10b981',
    accentBlue: '#3b82f6',
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  emerald: {
    bgPrimary: '#06120e',
    bgCard: '#0f241d',
    accentPurple: '#10b981',
    accentGreen: '#34d399',
    accentBlue: '#06b6d4',
    borderColor: 'rgba(52, 211, 153, 0.15)'
  },
  sunset: {
    bgPrimary: '#140a08',
    bgCard: '#261410',
    accentPurple: '#f97316',
    accentGreen: '#eab308',
    accentBlue: '#ef4444',
    borderColor: 'rgba(249, 115, 22, 0.15)'
  },
  midnight: {
    bgPrimary: '#0a0e1a',
    bgCard: '#131b30',
    accentPurple: '#3b82f6',
    accentGreen: '#06b6d4',
    accentBlue: '#6366f1',
    borderColor: 'rgba(59, 130, 246, 0.15)'
  }
};

export const STORAGE_KEY_THEME = 'pulse_theme_preset';

/**
 * Applies a theme preset's color tokens to document root CSS custom properties.
 * @param preset ThemePreset key name.
 */
export function applyThemePreset(preset: ThemePreset): void {
  const theme = THEME_PRESETS[preset] || THEME_PRESETS.cyberpunk;
  if (typeof document !== 'undefined' && document.documentElement) {
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', theme.bgPrimary);
    root.style.setProperty('--bg-card', theme.bgCard);
    root.style.setProperty('--accent-purple', theme.accentPurple);
    root.style.setProperty('--accent-green', theme.accentGreen);
    root.style.setProperty('--accent-blue', theme.accentBlue);
    root.style.setProperty('--border-color', theme.borderColor);
  }
}
