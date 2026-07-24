/*
 * src/utils/share.ts
 * Pure utility functions for encoding and decoding shareable URL hash links.
 * Created: 2026-07-23
 */

import type { Movie } from '../composables/useWatchlist';

/**
 * Encodes a list of movies into a compact Base64 URL string.
 */
export function encodeWatchlistToHash(movies: Movie[]): string {
  if (!movies || movies.length === 0) return '';

  const minimalList = movies.map((m) => ({
    id: m.id,
    t: m.title,
    y: m.year,
    p: m.poster,
    g: m.genre,
    r: m.rating,
    pl: m.plot,
    w: m.watched ? 1 : 0
  }));

  try {
    const jsonStr = JSON.stringify(minimalList);
    const b64 = btoa(encodeURIComponent(jsonStr));
    return b64;
  } catch (e) {
    console.error('Failed to encode watchlist to hash:', e);
    return '';
  }
}

/**
 * Decodes a Base64 URL string back into movie objects.
 */
export function decodeWatchlistFromHash(b64Hash: string): Partial<Movie>[] {
  if (!b64Hash) return [];

  try {
    const jsonStr = decodeURIComponent(atob(b64Hash));
    const rawList = JSON.parse(jsonStr);

    if (!Array.isArray(rawList)) return [];

    return rawList.map((item: any) => ({
      id: item.id || `shared-${Math.random().toString(36).substring(2, 9)}`,
      title: item.t || 'Untitled',
      year: item.y || 'N/A',
      poster: item.p || '',
      genre: Array.isArray(item.g) ? item.g : [],
      rating: item.r || 'N/A',
      plot: item.pl || '',
      watched: item.w === 1,
      addedAt: new Date().toISOString().split('T')[0]
    }));
  } catch (e) {
    console.error('Failed to decode watchlist from hash:', e);
    return [];
  }
}
