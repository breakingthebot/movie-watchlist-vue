/*
 * src/utils/sort.ts
 * Pure utility function to sort watchlist movie arrays.
 * Created: 2026-07-23
 */

import type { Movie } from '../composables/useWatchlist';

export type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'title-asc'
  | 'title-desc'
  | 'rating-desc'
  | 'year-desc';

/**
 * Sorts an array of movies according to the selected criterion.
 * @param movies List of movies to sort.
 * @param sortBy Sorting option key.
 * @returns Sorted copy of movie array.
 */
export function sortWatchlist(movies: Movie[], sortBy: SortOption): Movie[] {
  const list = [...movies];

  return list.sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case 'date-asc':
        return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      case 'rating-desc':
        return (b.userRating || 0) - (a.userRating || 0);
      case 'year-desc':
        return (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0);
      default:
        return 0;
    }
  });
}
