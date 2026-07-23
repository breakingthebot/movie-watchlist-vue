/*
 * src/utils/stats.ts
 * Pure utility function to calculate watchlist genre completion statistics.
 * Created: 2026-07-23
 */

export interface GenreStat {
  name: string;
  total: number;
  watched: number;
  percentage: number;
}

export interface MovieItem {
  genre: string[];
  watched: boolean;
}

/**
 * Computes watchlist statistics grouped by genre.
 * @param movies Array of movie items to inspect.
 * @returns Sorted list of genre statistics.
 */
export function getGenreStats(movies: MovieItem[]): GenreStat[] {
  const statsMap = new Map<string, { total: number; watched: number }>();

  movies.forEach((movie) => {
    movie.genre.forEach((g) => {
      const trimmed = g.trim();
      if (!trimmed) return;

      if (!statsMap.has(trimmed)) {
        statsMap.set(trimmed, { total: 0, watched: 0 });
      }

      const stat = statsMap.get(trimmed)!;
      stat.total += 1;
      if (movie.watched) {
        stat.watched += 1;
      }
    });
  });

  const list: GenreStat[] = [];
  statsMap.forEach((val, key) => {
    const percentage = val.total > 0 ? Math.round((val.watched / val.total) * 100) : 0;
    list.push({
      name: key,
      total: val.total,
      watched: val.watched,
      percentage
    });
  });

  // Sort descending by total counts, then by name
  return list.sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }
    return a.name.localeCompare(b.name);
  });
}
