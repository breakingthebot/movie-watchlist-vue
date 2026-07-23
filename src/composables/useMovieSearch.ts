/*
 * src/composables/useMovieSearch.ts
 * Integrates live API search querying the TVMaze public API.
 * Created: 2026-07-23
 */

import { ref } from 'vue';

export interface SearchResult {
  id: string;
  title: string;
  year: string;
  poster: string;
  genre: string[];
  rating: string;
  plot: string;
}

const searchResults = ref<SearchResult[]>([]);
const isSearching = ref(false);
const searchError = ref<string | null>(null);

/**
 * Strips HTML tags from text returned by the API.
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

export function useMovieSearch() {
  const searchMovies = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      searchResults.value = [];
      return;
    }

    isSearching.value = true;
    searchError.value = null;

    try {
      const response = await fetch(
        `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(trimmed)}`
      );
      
      if (!response.ok) {
        throw new Error(`API responded with status code ${response.status}`);
      }

      const data = await response.json();
      
      // Parse TVMaze objects into standard SearchResult shapes
      searchResults.value = data.map((item: any) => {
        const show = item.show;
        
        // Extract premiered year
        const year = show.premiered ? show.premiered.substring(0, 4) : 'N/A';
        
        // Fallback for missing poster images
        const poster = show.image?.medium || show.image?.original || '';
        
        // Rating mapping
        const rating = show.rating?.average ? String(show.rating.average) : 'N/A';

        return {
          id: `tvm-${show.id}`,
          title: show.name || 'Untitled',
          year,
          poster,
          genre: show.genres || [],
          rating,
          plot: stripHtml(show.summary) || 'No summary description available.'
        };
      });
    } catch (err: any) {
      console.error('API search failure:', err);
      searchError.value = 'Failed to fetch search results. Check network connection.';
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  };

  const clearSearch = () => {
    searchResults.value = [];
    searchError.value = null;
  };

  return {
    searchResults,
    isSearching,
    searchError,
    searchMovies,
    clearSearch
  };
}
