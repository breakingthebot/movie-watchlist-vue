/*
 * src/utils/filter.spec.ts
 * Unit tests asserting filterWatchlistMovies behavior.
 * Created: 2026-07-23
 */

import { describe, it, expect } from 'vitest';
import { filterWatchlistMovies } from './filter';
import type { Movie } from '../composables/useWatchlist';

const mockMovies: Movie[] = [
  {
    id: '1',
    title: 'The Dark Knight',
    year: '2008',
    poster: '',
    genre: ['Action', 'Crime'],
    rating: '9.0',
    plot: '',
    watched: true,
    addedAt: '2026-01-01'
  },
  {
    id: '2',
    title: 'Inception',
    year: '2010',
    poster: '',
    genre: ['Sci-Fi', 'Action'],
    rating: '8.8',
    plot: '',
    watched: false,
    addedAt: '2026-01-02'
  },
  {
    id: '3',
    title: 'Interstellar',
    year: '2014',
    poster: '',
    genre: ['Sci-Fi', 'Drama'],
    rating: '8.6',
    plot: '',
    watched: false,
    addedAt: '2026-01-03'
  }
];

describe('filterWatchlistMovies utility', () => {
  it('should filter movies matching local title query', () => {
    const res = filterWatchlistMovies(mockMovies, 'all', 'All', 'inter');
    expect(res.length).toBe(1);
    expect(res[0].title).toBe('Interstellar');
  });

  it('should combine tab, genre, and query filters correctly', () => {
    const res = filterWatchlistMovies(mockMovies, 'plan', 'Sci-Fi', 'inception');
    expect(res.length).toBe(1);
    expect(res[0].title).toBe('Inception');
  });

  it('should return empty list when query does not match any items', () => {
    const res = filterWatchlistMovies(mockMovies, 'all', 'All', 'nonexistent');
    expect(res.length).toBe(0);
  });
});
