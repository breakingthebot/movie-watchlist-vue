/*
 * src/utils/pwa.spec.ts
 * Unit tests asserting registerServiceWorker behavior.
 * Created: 2026-07-23
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerServiceWorker } from './pwa';

describe('registerServiceWorker helper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return false if serviceWorker is unsupported in environment', async () => {
    const originalNavigator = window.navigator;
    Object.defineProperty(window, 'navigator', {
      value: {},
      writable: true,
      configurable: true
    });

    const registered = await registerServiceWorker();
    expect(registered).toBe(false);

    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true
    });
  });

  it('should register sw.js successfully when supported', async () => {
    const registerMock = vi.fn().mockResolvedValue({ scope: '/' });
    Object.defineProperty(window, 'navigator', {
      value: {
        serviceWorker: {
          register: registerMock
        }
      },
      writable: true,
      configurable: true
    });

    const registered = await registerServiceWorker();
    expect(registered).toBe(true);
    expect(registerMock).toHaveBeenCalledWith('/sw.js');
  });
});
