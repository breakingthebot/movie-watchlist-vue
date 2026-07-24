/*
 * src/composables/useMovieSearch.ts
 * Integrates live API search querying the TVMaze public API.
 * Created: 2026-07-23
 */

import { ref, watch } from 'vue';

export interface SearchResult {
  id: string;
  title: string;
  year: string;
  poster: string;
  genre: string[];
  rating: string;
  plot: string;
  director?: string;
  actors?: string;
  runtime?: string;
}

const STORAGE_KEY_OMDB = 'pulse_omdb_api_key';

const searchResults = ref<SearchResult[]>([]);
const isSearching = ref(false);
const searchError = ref<string | null>(null);
const omdbApiKey = ref<string>(localStorage.getItem(STORAGE_KEY_OMDB) || '');

// Synchronize API Key to LocalStorage
watch(omdbApiKey, (newKey) => {
  localStorage.setItem(STORAGE_KEY_OMDB, newKey.trim());
});

/**
 * Strips HTML tags from text returned by the TVMaze API.
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

export function useMovieSearch() {
  /**
   * Search movies using OMDb API.
   */
  const searchOMDb = async (query: string, apiKey: string) => {
    const searchUrl = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}`;
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`OMDb responded with status code ${response.status}`);
    }
    const data = await response.json();
    
    if (data.Response === 'False') {
      throw new Error(data.Error || 'OMDb Search request failed.');
    }

    const searchList = data.Search || [];
    // Limit to top 6 items and fetch full details concurrently to resolve genres, rating, and plot
    const topResults = searchList.slice(0, 6);
    
    const detailPromises = topResults.map(async (movie: any) => {
      const detailUrl = `https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${apiKey}`;
      try {
        const detailResponse = await fetch(detailUrl);
        if (detailResponse.ok) {
          return await detailResponse.json();
        }
      } catch (e) {
        console.error(`Failed to fetch OMDb details for ${movie.imdbID}:`, e);
      }
      return null;
    });

    const details = await Promise.all(detailPromises);

    searchResults.value = details
      .filter(Boolean)
      .map((detail: any) => {
        const genreList = detail.Genre && detail.Genre !== 'N/A'
          ? detail.Genre.split(',').map((s: string) => s.trim())
          : [];
          
        return {
          id: detail.imdbID,
          title: detail.Title || 'Untitled',
          year: detail.Year || 'N/A',
          poster: detail.Poster && detail.Poster !== 'N/A' ? detail.Poster : '',
          genre: genreList,
          rating: detail.imdbRating || 'N/A',
          plot: detail.Plot && detail.Plot !== 'N/A' ? detail.Plot : 'No description available.',
          director: detail.Director && detail.Director !== 'N/A' ? detail.Director : undefined,
          actors: detail.Actors && detail.Actors !== 'N/A' ? detail.Actors : undefined,
          runtime: detail.Runtime && detail.Runtime !== 'N/A' ? detail.Runtime : undefined
        };
      });
  };

  /**
   * Search movies using TVMaze (Tokenless Fallback).
   */
  const searchTVMaze = async (query: string) => {
    const searchUrl = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`TVMaze responded with status code ${response.status}`);
    }

    const data = await response.json();
    
    searchResults.value = data.map((item: any) => {
      const show = item.show;
      const year = show.premiered ? show.premiered.substring(0, 4) : 'N/A';
      const poster = show.image?.medium || show.image?.original || '';
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
  };

  const searchMovies = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      searchResults.value = [];
      return;
    }

    isSearching.value = true;
    searchError.value = null;

    try {
      if (omdbApiKey.value.trim()) {
        await searchOMDb(trimmed, omdbApiKey.value.trim());
      } else {
        await searchTVMaze(trimmed);
      }
    } catch (err: any) {
      console.error('API search failure:', err);
      searchError.value = err.message || 'Failed to fetch search results. Check network connection.';
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  };

  const clearSearch = () => {
    searchResults.value = [];
    searchError.value = null;
  };

  /**
   * Validates if a given OMDb API Key is working correctly.
   */
  const validateOmdbKey = async (key: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://www.omdbapi.com/?t=Inception&apikey=${key}`);
      if (response.ok) {
        const data = await response.json();
        return data.Response === 'True';
      }
    } catch (e) {
      console.error('Key validation failed:', e);
    }
    return false;
  };

  /**
   * Fetches enriched details (director, cast, runtime, language, status, network) for a movie or show on demand.
   */
  const fetchMovieDetails = async (movie: any): Promise<Partial<SearchResult>> => {
    if (!movie || !movie.id) return {};

    if (movie.id.startsWith('tvm-')) {
      const rawId = movie.id.replace('tvm-', '');
      try {
        const res = await fetch(`https://api.tvmaze.com/shows/${rawId}`);
        if (res.ok) {
          const show = await res.json();
          const networkInfo = show.network?.name
            ? `Network: ${show.network.name}`
            : show.webChannel?.name
            ? `Platform: ${show.webChannel.name}`
            : undefined;

          const statusInfo = show.status
            ? `Status: ${show.status}${show.language ? ` (${show.language})` : ''}`
            : undefined;

          const runtimeInfo = show.runtime
            ? `${show.runtime} min`
            : show.averageRuntime
            ? `${show.averageRuntime} min/ep`
            : undefined;

          return {
            runtime: runtimeInfo,
            director: networkInfo,
            actors: statusInfo
          };
        }
      } catch (e) {
        console.error('Failed to fetch TVMaze show details:', e);
      }
    } else if (omdbApiKey.value.trim()) {
      const apiKey = omdbApiKey.value.trim();
      try {
        const res = await fetch(`https://www.omdbapi.com/?i=${movie.id}&apikey=${apiKey}`);
        if (res.ok) {
          const detail = await res.json();
          if (detail.Response !== 'False') {
            return {
              director: detail.Director && detail.Director !== 'N/A' ? detail.Director : undefined,
              actors: detail.Actors && detail.Actors !== 'N/A' ? detail.Actors : undefined,
              runtime: detail.Runtime && detail.Runtime !== 'N/A' ? detail.Runtime : undefined
            };
          }
        }
      } catch (e) {
        console.error('Failed to fetch OMDb movie details:', e);
      }
    }
    return {};
  };

  return {
    searchResults,
    isSearching,
    searchError,
    omdbApiKey,
    searchMovies,
    clearSearch,
    validateOmdbKey,
    fetchMovieDetails
  };
}
