/*
 * src/utils/picker.spec.ts
 * Unit tests asserting pickRandomMovie behavior.
 * Created: 2026-07-23
 */

import { describe, it, expect } from 'vitest';
import { pickRandomMovie } from './picker';
import type { Movie } from '../composables/useWatchlist';

const mockMovies: Movie[] = [
  {
    id: '1',
    title: 'Watched Movie',
    year: '2020',
    poster: '',
    genre: ['Drama'],
    rating: '7.0',
    plot: '',
    watched: true,
    addedAt: '2026-01-01'
  },
  {
    id: '2',
    title: 'Unwatched Movie 1',
    year: '2022',
    poster: '',
    genre: ['Action'],
    rating: '8.0',
    plot: '',
    watched: false,
    addedAt: '2026-01-02'
  }
];

describe('pickRandomMovie utility', () => {
  it('should return null when movie list is empty', () => {
    const picked = pickRandomMovie([]);
    expect(picked).toBeNull();
  });

  it('should prefer unwatched movies when available', () => {
    const picked = pickRandomMovie(mockMovies);
    expect(picked).not.toBeNull();
    expect(picked?.watched).toBe(false);
    expect(picked?.title).toBe('Unwatched Movie 1');
  });

  it('should fallback to watched movies if all are watched', () => {
    const watchedList = mockMovies.map(m => ({ ...m, watched: true }));
    const picked = pickRandomMovie(watchedList);
    expect(picked).not.toBeNull();
  });
});
