/*
 * src/utils/picker.ts
 * Pure utility function to pick a random unwatched movie from a list.
 * Created: 2026-07-23
 */

import type { Movie } from '../composables/useWatchlist';

/**
 * Selects a random unwatched movie from the provided list, or falls back to all movies.
 * @param movies List of movies to pick from.
 * @returns Randomly selected Movie object, or null if list is empty.
 */
export function pickRandomMovie(movies: Movie[]): Movie | null {
  if (!movies || movies.length === 0) return null;

  const unwatched = movies.filter((m) => !m.watched);
  const candidates = unwatched.length > 0 ? unwatched : movies;

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}
