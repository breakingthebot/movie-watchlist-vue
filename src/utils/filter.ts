/*
 * src/utils/filter.ts
 * Pure utility function to filter movies by tab, genre, and local title query.
 * Created: 2026-07-23
 */

import type { Movie } from '../composables/useWatchlist';

/**
 * Filters movies based on active tab, selected genre, and local search query.
 * @param movies List of movies to filter.
 * @param tab Active view tab ('all' | 'plan' | 'watched').
 * @param genre Selected genre tag.
 * @param localQuery Text query to match against titles.
 * @returns Filtered array of movies.
 */
export function filterWatchlistMovies(
  movies: Movie[],
  tab: 'all' | 'plan' | 'watched',
  genre: string,
  localQuery: string
): Movie[] {
  const query = localQuery.trim().toLowerCase();

  return movies.filter((movie) => {
    const matchesTab =
      tab === 'all' ||
      (tab === 'plan' && !movie.watched) ||
      (tab === 'watched' && movie.watched);

    const matchesGenre = genre === 'All' || movie.genre.includes(genre);

    const matchesQuery = !query || movie.title.toLowerCase().includes(query);

    return matchesTab && matchesGenre && matchesQuery;
  });
}
