/*
 * src/composables/useMovieSearch.spec.ts
 * Unit tests asserting OMDb search, TVMaze fallback, and key validations.
 * Created: 2026-07-23
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMovieSearch } from './useMovieSearch';

describe('useMovieSearch composable', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const { clearSearch, omdbApiKey } = useMovieSearch();
    clearSearch();
    omdbApiKey.value = ''; // Reset key to default to TVMaze fallback
  });

  it('should fallback to TVMaze when no API key is present', async () => {
    const mockTVMazeResponse = [
      {
        score: 0.9,
        show: {
          id: 111,
          name: 'TV Show',
          premiered: '2020-01-01',
          genres: ['Comedy'],
          rating: { average: 7.2 },
          image: { medium: 'tvshow.jpg' },
          summary: 'A funny TV show.'
        }
      }
    ];

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTVMazeResponse)
      } as Response)
    );

    const { searchResults, searchMovies, omdbApiKey } = useMovieSearch();
    expect(omdbApiKey.value).toBe('');

    await searchMovies('Show');

    expect(fetchSpy).toHaveBeenCalledWith('https://api.tvmaze.com/search/shows?q=Show');
    expect(searchResults.value.length).toBe(1);
    expect(searchResults.value[0].id).toBe('tvm-111');
  });

  it('should query OMDb when API key is set', async () => {
    const mockOmdbSearchResponse = {
      Response: 'True',
      Search: [
        {
          Title: 'Inception',
          Year: '2010',
          imdbID: 'tt1375666',
          Type: 'movie',
          Poster: 'inception.jpg'
        }
      ]
    };

    const mockOmdbDetailResponse = {
      Title: 'Inception',
      Year: '2010',
      imdbID: 'tt1375666',
      Poster: 'inception.jpg',
      Genre: 'Action, Sci-Fi, Thriller',
      imdbRating: '8.8',
      Plot: 'A thief who steals corporate secrets...',
      Response: 'True'
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url: any) => {
      if (url.includes('i=tt1375666')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOmdbDetailResponse)
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOmdbSearchResponse)
      } as Response);
    });

    const { searchResults, searchMovies, omdbApiKey } = useMovieSearch();
    omdbApiKey.value = 'testkey123';

    await searchMovies('Inception');

    expect(fetchSpy).toHaveBeenCalledWith('https://www.omdbapi.com/?s=Inception&apikey=testkey123');
    expect(fetchSpy).toHaveBeenCalledWith('https://www.omdbapi.com/?i=tt1375666&apikey=testkey123');
    
    expect(searchResults.value.length).toBe(1);
    const movie = searchResults.value[0];
    expect(movie.title).toBe('Inception');
    expect(movie.genre).toEqual(['Action', 'Sci-Fi', 'Thriller']);
    expect(movie.rating).toBe('8.8');
  });

  it('should validate working OMDb keys correctly', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ Response: 'True' })
      } as Response)
    );

    const { validateOmdbKey } = useMovieSearch();
    const isValid = await validateOmdbKey('working_key');

    expect(fetchSpy).toHaveBeenCalledWith('https://www.omdbapi.com/?t=Inception&apikey=working_key');
    expect(isValid).toBe(true);
  });

  it('should return false for invalid OMDb keys', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ Response: 'False', Error: 'Invalid API key!' })
      } as Response)
    );

    const { validateOmdbKey } = useMovieSearch();
    const isValid = await validateOmdbKey('broken_key');

    expect(isValid).toBe(false);
  });
});
