/*
 * src/utils/goal.spec.ts
 * Unit tests asserting calculateMonthlyGoalProgress utility logic.
 * Created: 2026-07-23
 */

import { describe, it, expect } from 'vitest';
import { calculateMonthlyGoalProgress } from './goal';
import type { Movie } from '../composables/useWatchlist';

const mockMovies: Movie[] = [
  {
    id: '1',
    title: 'Movie A',
    year: '2022',
    poster: '',
    genre: ['Action'],
    rating: '8.0',
    plot: '',
    watched: true,
    watchedAt: '2026-07-15',
    addedAt: '2026-07-01'
  },
  {
    id: '2',
    title: 'Movie B',
    year: '2023',
    poster: '',
    genre: ['Drama'],
    rating: '7.5',
    plot: '',
    watched: true,
    watchedAt: '2026-07-20',
    addedAt: '2026-07-05'
  },
  {
    id: '3',
    title: 'Movie C',
    year: '2024',
    poster: '',
    genre: ['Comedy'],
    rating: '6.5',
    plot: '',
    watched: false,
    addedAt: '2026-07-10'
  }
];

describe('calculateMonthlyGoalProgress utility', () => {
  it('should calculate completion rates correctly', () => {
    const progress = calculateMonthlyGoalProgress(mockMovies, 4, '2026-07');
    expect(progress.target).toBe(4);
    expect(progress.completed).toBe(2);
    expect(progress.percentage).toBe(50);
    expect(progress.isGoalReached).toBe(false);
  });

  it('should flag isGoalReached when target count is met', () => {
    const progress = calculateMonthlyGoalProgress(mockMovies, 2, '2026-07');
    expect(progress.completed).toBe(2);
    expect(progress.percentage).toBe(100);
    expect(progress.isGoalReached).toBe(true);
  });

  it('should fallback to default target of 5 when target is invalid or 0', () => {
    const progress = calculateMonthlyGoalProgress([], 0, '2026-07');
    expect(progress.target).toBe(5);
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });
});
