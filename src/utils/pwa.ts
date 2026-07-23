/*
 * src/utils/pwa.ts
 * PWA Service Worker registration helper.
 * Created: 2026-07-23
 */

export async function registerServiceWorker(): Promise<boolean> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      return !!registration;
    } catch {
      return false;
    }
  }
  return false;
}
