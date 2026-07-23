/*
 * src/composables/useMovieSearch.spec.ts
 * Unit tests asserting useMovieSearch querying and schema translation with mocked fetch boundary.
 * Created: 2026-07-23
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMovieSearch } from './useMovieSearch';

describe('useMovieSearch composable', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const { clearSearch } = useMovieSearch();
    clearSearch();
  });

  it('should initialize with empty results', () => {
    const { searchResults, isSearching, searchError } = useMovieSearch();
    expect(searchResults.value).toEqual([]);
    expect(isSearching.value).toBe(false);
    expect(searchError.value).toBeNull();
  });

  it('should call fetch and map TVMaze response schema correctly', async () => {
    const mockApiResponse = [
      {
        score: 0.98,
        show: {
          id: 456,
          name: 'The Matrix',
          premiered: '1999-03-31',
          genres: ['Action', 'Sci-Fi'],
          rating: { average: 8.9 },
          image: { medium: 'matrix-medium.jpg', original: 'matrix-large.jpg' },
          summary: '<p>A computer hacker learns from mysterious rebels...</p>'
        }
      }
    ];

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      } as Response)
    );

    const { searchResults, searchMovies, isSearching } = useMovieSearch();
    const searchPromise = searchMovies('Matrix');
    expect(isSearching.value).toBe(true);

    await searchPromise;
    expect(isSearching.value).toBe(false);
    expect(fetchSpy).toHaveBeenCalledWith('https://api.tvmaze.com/search/shows?q=Matrix');
    expect(searchResults.value.length).toBe(1);
    
    const result = searchResults.value[0];
    expect(result.id).toBe('tvm-456');
    expect(result.title).toBe('The Matrix');
    expect(result.year).toBe('1999');
    expect(result.poster).toBe('matrix-medium.jpg');
    expect(result.genre).toEqual(['Action', 'Sci-Fi']);
    expect(result.rating).toBe('8.9');
    expect(result.plot).toBe('A computer hacker learns from mysterious rebels...');
  });

  it('should recover gracefully on fetch exception', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.reject(new Error('Network disconnected'))
    );

    const { searchResults, searchMovies, searchError } = useMovieSearch();
    await searchMovies('Matrix');

    expect(searchResults.value).toEqual([]);
    expect(searchError.value).toBe('Failed to fetch search results. Check network connection.');
  });
});
