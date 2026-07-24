/*
 * src/utils/theme.spec.ts
 * Unit tests asserting applyThemePreset behavior and preset tokens.
 * Created: 2026-07-23
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { THEME_PRESETS, applyThemePreset } from './theme';
import type { ThemePreset } from './theme';

describe('theme utility module', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('style');
  });

  it('should contain 4 valid theme preset configurations', () => {
    const keys: ThemePreset[] = ['cyberpunk', 'emerald', 'sunset', 'midnight'];
    keys.forEach((key) => {
      expect(THEME_PRESETS[key]).toBeDefined();
      expect(THEME_PRESETS[key].bgPrimary).toMatch(/^#/);
    });
  });

  it('should inject CSS custom properties into document element style', () => {
    applyThemePreset('emerald');
    const style = document.documentElement.style.cssText;
    expect(style).toContain('--bg-primary: #06120e');
    expect(style).toContain('--accent-purple: #10b981');
  });

  it('should fallback to cyberpunk when an invalid preset name is passed', () => {
    applyThemePreset('invalid' as any);
    const style = document.documentElement.style.cssText;
    expect(style).toContain('--bg-primary: #0b0914');
  });
});
