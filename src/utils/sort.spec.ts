/*
 * src/utils/sort.spec.ts
 * Unit tests asserting sortWatchlist behavior.
 * Created: 2026-07-23
 */

import { describe, it, expect } from 'vitest';
import { sortWatchlist } from './sort';
import type { Movie } from '../composables/useWatchlist';

const mockMovies: Movie[] = [
  {
    id: '1',
    title: 'Zootopia',
    year: '2016',
    poster: '',
    genre: ['Animation'],
    rating: '8.0',
    plot: '',
    watched: true,
    userRating: 3,
    addedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    title: 'Avatar',
    year: '2009',
    poster: '',
    genre: ['Sci-Fi'],
    rating: '7.9',
    plot: '',
    watched: false,
    userRating: 5,
    addedAt: '2026-06-01T00:00:00.000Z'
  },
  {
    id: '3',
    title: 'Inception',
    year: '2010',
    poster: '',
    genre: ['Sci-Fi'],
    rating: '8.8',
    plot: '',
    watched: true,
    userRating: 4,
    addedAt: '2026-03-01T00:00:00.000Z'
  }
];

describe('sortWatchlist utility', () => {
  it('should sort by Title (A-Z)', () => {
    const res = sortWatchlist(mockMovies, 'title-asc');
    expect(res.map((m) => m.title)).toEqual(['Avatar', 'Inception', 'Zootopia']);
  });

  it('should sort by Title (Z-A)', () => {
    const res = sortWatchlist(mockMovies, 'title-desc');
    expect(res.map((m) => m.title)).toEqual(['Zootopia', 'Inception', 'Avatar']);
  });

  it('should sort by User Rating (Highest First)', () => {
    const res = sortWatchlist(mockMovies, 'rating-desc');
    expect(res.map((m) => m.title)).toEqual(['Avatar', 'Inception', 'Zootopia']);
  });

  it('should sort by Release Year (Newest First)', () => {
    const res = sortWatchlist(mockMovies, 'year-desc');
    expect(res.map((m) => m.title)).toEqual(['Zootopia', 'Inception', 'Avatar']);
  });

  it('should sort by Date Added (Newest First)', () => {
    const res = sortWatchlist(mockMovies, 'date-desc');
    expect(res.map((m) => m.title)).toEqual(['Avatar', 'Inception', 'Zootopia']);
  });
});
