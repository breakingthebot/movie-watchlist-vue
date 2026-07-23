/*
 * src/utils/stats.spec.ts
 * Unit tests asserting getGenreStats utility logic.
 * Created: 2026-07-23
 */

import { describe, it, expect } from 'vitest';
import { getGenreStats } from './stats';

describe('getGenreStats utility', () => {
  it('should return empty list when no movies are provided', () => {
    const stats = getGenreStats([]);
    expect(stats).toEqual([]);
  });

  it('should correctly accumulate ratios and percentage rates', () => {
    const mockMovies = [
      { genre: ['Action', 'Sci-Fi'], watched: true },
      { genre: ['Sci-Fi', 'Thriller'], watched: false },
      { genre: ['Action'], watched: false }
    ];

    const stats = getGenreStats(mockMovies);

    // Expected Output:
    // Action: 2 total, 1 watched (50%)
    // Sci-Fi: 2 total, 1 watched (50%)
    // Thriller: 1 total, 0 watched (0%)
    expect(stats.length).toBe(3);
    
    const actionStat = stats.find(s => s.name === 'Action')!;
    expect(actionStat.total).toBe(2);
    expect(actionStat.watched).toBe(1);
    expect(actionStat.percentage).toBe(50);

    const thrillerStat = stats.find(s => s.name === 'Thriller')!;
    expect(thrillerStat.total).toBe(1);
    expect(thrillerStat.watched).toBe(0);
    expect(thrillerStat.percentage).toBe(0);
  });
});
