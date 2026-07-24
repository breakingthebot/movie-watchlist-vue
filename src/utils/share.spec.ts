/*
 * src/utils/share.spec.ts
 * Unit tests asserting encodeWatchlistToHash and decodeWatchlistFromHash.
 * Created: 2026-07-23
 */

import { describe, it, expect } from 'vitest';
import { encodeWatchlistToHash, decodeWatchlistFromHash } from './share';
import type { Movie } from '../composables/useWatchlist';

const mockMovies: Movie[] = [
  {
    id: '101',
    title: 'Inception',
    year: '2010',
    poster: 'http://example.com/poster.jpg',
    genre: ['Sci-Fi', 'Action'],
    rating: '8.8',
    plot: 'A thief enters dreams.',
    watched: true,
    addedAt: '2026-01-01'
  }
];

describe('share utility module', () => {
  it('should encode movies array into Base64 hash string', () => {
    const hash = encodeWatchlistToHash(mockMovies);
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe('string');
  });

  it('should decode valid Base64 hash string back to movie properties', () => {
    const hash = encodeWatchlistToHash(mockMovies);
    const decoded = decodeWatchlistFromHash(hash);
    expect(decoded.length).toBe(1);
    expect(decoded[0].title).toBe('Inception');
    expect(decoded[0].watched).toBe(true);
  });

  it('should return empty array for invalid or empty hash', () => {
    expect(decodeWatchlistFromHash('')).toEqual([]);
    expect(decodeWatchlistFromHash('invalid-b64-str!!!')).toEqual([]);
  });
});
