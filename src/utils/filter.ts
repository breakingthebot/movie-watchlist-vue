/*
 * src/utils/filter.ts
 * Pure utility function to filter movies by tab, genre, and local title query.
 * Created: 2026-07-23
 */

import type { Movie } from '../composables/useWatchlist';

export type RatingFilter = 'all' | '5' | '4+' | '3+' | 'unrated';

/**
 * Filters movies based on active tab, selected genre, local search query, and rating filter.
 */
export function filterWatchlistMovies(
  movies: Movie[],
  tab: 'all' | 'plan' | 'watched',
  genre: string,
  localQuery: string,
  ratingFilter: RatingFilter = 'all'
): Movie[] {
  const query = localQuery.trim().toLowerCase();

  return movies.filter((movie) => {
    const matchesTab =
      tab === 'all' ||
      (tab === 'plan' && !movie.watched) ||
      (tab === 'watched' && movie.watched);

    const matchesGenre = genre === 'All' || movie.genre.includes(genre);

    const matchesQuery = !query || movie.title.toLowerCase().includes(query);

    let matchesRating = true;
    const userRating = movie.userRating || 0;

    if (ratingFilter === '5') {
      matchesRating = userRating === 5;
    } else if (ratingFilter === '4+') {
      matchesRating = userRating >= 4;
    } else if (ratingFilter === '3+') {
      matchesRating = userRating >= 3;
    } else if (ratingFilter === 'unrated') {
      matchesRating = !movie.userRating;
    }

    return matchesTab && matchesGenre && matchesQuery && matchesRating;
  });
}
