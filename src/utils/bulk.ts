/*
 * src/utils/bulk.ts
 * Pure utility functions for bulk watchlist operations.
 * Created: 2026-07-23
 */

import type { Movie } from '../composables/useWatchlist';

/**
 * Updates watched status for all movies matching selectedIds.
 */
export function bulkMarkWatched(
  movies: Movie[],
  selectedIds: string[],
  watched: boolean
): Movie[] {
  const selectedSet = new Set(selectedIds);
  const today = new Date().toISOString().split('T')[0];

  return movies.map((m) => {
    if (selectedSet.has(m.id)) {
      return {
        ...m,
        watched,
        watchedAt: watched ? m.watchedAt || today : undefined
      };
    }
    return m;
  });
}

/**
 * Deletes all movies matching selectedIds.
 */
export function bulkDeleteMovies(movies: Movie[], selectedIds: string[]): Movie[] {
  const selectedSet = new Set(selectedIds);
  return movies.filter((m) => !selectedSet.has(m.id));
}
