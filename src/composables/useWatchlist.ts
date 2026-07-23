/*
 * src/composables/useWatchlist.ts
 * Composition API hook managing the watchlist state, actions, and LocalStorage sync.
 * Created: 2026-07-23
 */

import { ref, watch } from 'vue';

export interface Movie {
  id: string;
  title: string;
  year: string;
  poster: string;
  genre: string[];
  rating: string;
  plot: string;
  watched: boolean;
  notes?: string;
  addedAt: string;
}

const STORAGE_KEY = 'pulse_movie_watchlist';

const watchlist = ref<Movie[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Load initial state from LocalStorage
const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      watchlist.value = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load watchlist from localStorage:', err);
    error.value = 'Could not restore saved watchlist.';
  }
};

loadFromStorage();

// Watch for changes and automatically sync to LocalStorage
watch(
  watchlist,
  (newVal) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
    } catch (err) {
      console.error('Failed to save watchlist to localStorage:', err);
    }
  },
  { deep: true }
);

export function useWatchlist() {
  /**
   * Adds a movie to the watchlist if it doesn't already exist.
   */
  const addToWatchlist = (movieData: Omit<Movie, 'watched' | 'addedAt'>) => {
    if (watchlist.value.some((m) => m.id === movieData.id)) {
      return;
    }
    
    const newMovie: Movie = {
      ...movieData,
      watched: false,
      addedAt: new Date().toISOString()
    };
    
    watchlist.value.unshift(newMovie); // Add new items at the top
  };

  /**
   * Removes a movie from the watchlist by ID.
   */
  const removeFromWatchlist = (id: string) => {
    watchlist.value = watchlist.value.filter((m) => m.id !== id);
  };

  /**
   * Toggles the watched status of a movie by ID.
   */
  const toggleWatched = (id: string) => {
    const movie = watchlist.value.find((m) => m.id === id);
    if (movie) {
      movie.watched = !movie.watched;
    }
  };

  /**
   * Updates personal notes for a movie.
   */
  const updateNotes = (id: string, notes: string) => {
    const movie = watchlist.value.find((m) => m.id === id);
    if (movie) {
      movie.notes = notes;
    }
  };

  return {
    watchlist,
    isLoading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatched,
    updateNotes
  };
}
