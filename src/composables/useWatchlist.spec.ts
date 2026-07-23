/*
 * src/composables/useWatchlist.spec.ts
 * Unit tests asserting useWatchlist actions (add, remove, toggle, note update).
 * Created: 2026-07-23
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useWatchlist } from './useWatchlist';

const mockMovie = {
  id: 'tt1234567',
  title: 'Inception',
  year: '2010',
  poster: 'inception.jpg',
  genre: ['Action', 'Sci-Fi'],
  rating: '8.8',
  plot: 'A thief who steals corporate secrets...'
};

describe('useWatchlist composable', () => {
  beforeEach(() => {
    // Clear localStorage and watchlist array before each test
    localStorage.clear();
    const { watchlist } = useWatchlist();
    watchlist.value = [];
  });

  it('should initialize with an empty watchlist', () => {
    const { watchlist } = useWatchlist();
    expect(watchlist.value).toEqual([]);
  });

  it('should add a movie to the watchlist', () => {
    const { watchlist, addToWatchlist } = useWatchlist();
    addToWatchlist(mockMovie);

    expect(watchlist.value.length).toBe(1);
    expect(watchlist.value[0].title).toBe('Inception');
    expect(watchlist.value[0].watched).toBe(false);
    expect(watchlist.value[0].addedAt).toBeDefined();
  });

  it('should not add duplicate movies', () => {
    const { watchlist, addToWatchlist } = useWatchlist();
    addToWatchlist(mockMovie);
    addToWatchlist(mockMovie);

    expect(watchlist.value.length).toBe(1);
  });

  it('should remove a movie from the watchlist', () => {
    const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
    addToWatchlist(mockMovie);
    expect(watchlist.value.length).toBe(1);

    removeFromWatchlist(mockMovie.id);
    expect(watchlist.value.length).toBe(0);
  });

  it('should toggle watched status of a movie', () => {
    const { watchlist, addToWatchlist, toggleWatched } = useWatchlist();
    addToWatchlist(mockMovie);
    expect(watchlist.value[0].watched).toBe(false);

    toggleWatched(mockMovie.id);
    expect(watchlist.value[0].watched).toBe(true);

    toggleWatched(mockMovie.id);
    expect(watchlist.value[0].watched).toBe(false);
  });

  it('should update movie notes', () => {
    const { watchlist, addToWatchlist, updateNotes } = useWatchlist();
    addToWatchlist(mockMovie);
    expect(watchlist.value[0].notes).toBeUndefined();

    updateNotes(mockMovie.id, 'Amazing Christopher Nolan film.');
    expect(watchlist.value[0].notes).toBe('Amazing Christopher Nolan film.');
  });
});
