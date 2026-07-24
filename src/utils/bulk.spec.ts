/*
 * src/utils/bulk.spec.ts
 * Unit tests asserting bulkMarkWatched and bulkDeleteMovies behavior.
 * Created: 2026-07-23
 */

import { describe, it, expect } from 'vitest';
import { bulkMarkWatched, bulkDeleteMovies } from './bulk';
import type { Movie } from '../composables/useWatchlist';

const mockMovies: Movie[] = [
  {
    id: '1',
    title: 'Movie 1',
    year: '2020',
    poster: '',
    genre: [],
    rating: '7.0',
    plot: '',
    watched: false,
    addedAt: '2026-01-01'
  },
  {
    id: '2',
    title: 'Movie 2',
    year: '2021',
    poster: '',
    genre: [],
    rating: '8.0',
    plot: '',
    watched: false,
    addedAt: '2026-01-02'
  },
  {
    id: '3',
    title: 'Movie 3',
    year: '2022',
    poster: '',
    genre: [],
    rating: '9.0',
    plot: '',
    watched: true,
    addedAt: '2026-01-03'
  }
];

describe('bulk utilities', () => {
  it('should mark selected movies as watched', () => {
    const updated = bulkMarkWatched(mockMovies, ['1', '2'], true);
    expect(updated[0].watched).toBe(true);
    expect(updated[1].watched).toBe(true);
    expect(updated[2].watched).toBe(true);
  });

  it('should mark selected movies as unwatched', () => {
    const updated = bulkMarkWatched(mockMovies, ['3'], false);
    expect(updated[2].watched).toBe(false);
    expect(updated[2].watchedAt).toBeUndefined();
  });

  it('should delete selected movies from array', () => {
    const remaining = bulkDeleteMovies(mockMovies, ['1', '3']);
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('2');
  });
});
