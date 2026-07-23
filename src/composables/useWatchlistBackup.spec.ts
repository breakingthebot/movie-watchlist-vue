/*
 * src/composables/useWatchlistBackup.spec.ts
 * Unit tests asserting export/import routines and validation rules.
 * Created: 2026-07-23
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useWatchlist } from './useWatchlist';
import { useWatchlistBackup } from './useWatchlistBackup';

const mockMovieItem = {
  id: 'tt5555555',
  title: 'Interstellar',
  year: '2014',
  poster: 'interstellar.jpg',
  genre: ['Adventure', 'Sci-Fi'],
  rating: '8.6',
  plot: 'A team of explorers travel through a wormhole...',
  watched: true,
  notes: 'Favorite sci-fi movie.',
  userRating: 5,
  watchedAt: '2026-07-23',
  addedAt: '2026-07-23T12:00:00.000Z'
};

describe('useWatchlistBackup composable', () => {
  beforeEach(() => {
    localStorage.clear();
    const { watchlist } = useWatchlist();
    watchlist.value = [];
  });

  it('should successfully import valid JSON watchlists and skip duplicates', () => {
    const { watchlist } = useWatchlist();
    const { importFromJSON } = useWatchlistBackup();
    
    // Initial import
    const payload = JSON.stringify([mockMovieItem]);
    const res1 = importFromJSON(payload);
    
    expect(res1.success).toBe(true);
    expect(res1.count).toBe(1);
    expect(watchlist.value.length).toBe(1);
    expect(watchlist.value[0].title).toBe('Interstellar');
    expect(watchlist.value[0].userRating).toBe(5);

    // Duplicate import
    const res2 = importFromJSON(payload);
    expect(res2.success).toBe(true);
    expect(res2.count).toBe(0); // 0 new items imported
    expect(watchlist.value.length).toBe(1);
  });

  it('should fail on malformed JSON payload', () => {
    const { importFromJSON } = useWatchlistBackup();
    const res = importFromJSON('invalid json string');
    
    expect(res.success).toBe(false);
    expect(res.error).toBe('Failed to parse JSON backup file.');
  });

  it('should reject non-array JSON structures', () => {
    const { importFromJSON } = useWatchlistBackup();
    const res = importFromJSON('{"id": "tt123"}');
    
    expect(res.success).toBe(false);
    expect(res.error).toBe('Backup file must contain a list of movies.');
  });
});
