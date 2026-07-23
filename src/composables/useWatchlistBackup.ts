/*
 * src/composables/useWatchlistBackup.ts
 * Manages CSV exports, JSON backups, and schema-validated JSON imports.
 * Created: 2026-07-23
 */

import { useWatchlist } from './useWatchlist';
import type { Movie } from './useWatchlist';

export function useWatchlistBackup() {
  const { watchlist } = useWatchlist();

  /**
   * Downloads the watchlist as a formatted JSON backup file.
   */
  const exportToJSON = () => {
    const dataStr = JSON.stringify(watchlist.value, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pulse_movie_watchlist_backup.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Downloads the watchlist as an RFC 4180-compliant CSV spreadsheet.
   */
  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Year', 'Genres', 'API Rating', 'Watched', 'My Rating', 'Watched Date', 'Notes'];
    const rows = watchlist.value.map((m) => [
      m.id,
      `"${m.title.replace(/"/g, '""')}"`,
      m.year,
      `"${m.genre.join(', ')}"`,
      m.rating,
      m.watched ? 'Yes' : 'No',
      m.userRating || 'N/A',
      m.watchedAt || 'N/A',
      `"${(m.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pulse_movie_watchlist.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Parses and merges a JSON backup string into the watchlist, filtering duplicates.
   */
  const importFromJSON = (jsonStr: string): { success: boolean; count: number; error?: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) {
        return { success: false, count: 0, error: 'Backup file must contain a list of movies.' };
      }

      // Filter valid items containing ID and Title
      const validMovies = parsed.filter((item) => item && typeof item === 'object' && item.id && item.title);
      if (validMovies.length === 0) {
        return { success: false, count: 0, error: 'No valid movie items found in the backup file.' };
      }

      let importCount = 0;
      validMovies.forEach((item) => {
        // Prevent duplicate IDs
        if (!watchlist.value.some((m) => m.id === item.id)) {
          const movie: Movie = {
            id: String(item.id),
            title: String(item.title),
            year: String(item.year || 'N/A'),
            poster: String(item.poster || ''),
            genre: Array.isArray(item.genre) ? item.genre.map(String) : [],
            rating: String(item.rating || 'N/A'),
            plot: String(item.plot || ''),
            watched: Boolean(item.watched),
            notes: item.notes ? String(item.notes) : undefined,
            userRating: typeof item.userRating === 'number' ? item.userRating : undefined,
            watchedAt: item.watchedAt ? String(item.watchedAt) : undefined,
            addedAt: String(item.addedAt || new Date().toISOString())
          };
          watchlist.value.push(movie);
          importCount++;
        }
      });

      return { success: true, count: importCount };
    } catch (e) {
      return { success: false, count: 0, error: 'Failed to parse JSON backup file.' };
    }
  };

  return {
    exportToJSON,
    exportToCSV,
    importFromJSON
  };
}
