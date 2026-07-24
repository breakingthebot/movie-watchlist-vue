<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useWatchlist } from './composables/useWatchlist';
import { useMovieSearch } from './composables/useMovieSearch';
import { useWatchlistBackup } from './composables/useWatchlistBackup';
import { getGenreStats } from './utils/stats';
import { sortWatchlist } from './utils/sort';
import type { SortOption } from './utils/sort';
import { calculateMonthlyGoalProgress } from './utils/goal';
import { filterWatchlistMovies } from './utils/filter';
import { pickRandomMovie } from './utils/picker';
import { applyThemePreset, STORAGE_KEY_THEME } from './utils/theme';
import type { ThemePreset } from './utils/theme';

const STORAGE_KEY_GOAL = 'pulse_monthly_goal';
const monthlyGoal = ref<number>(parseInt(localStorage.getItem(STORAGE_KEY_GOAL) || '5', 10));

watch(monthlyGoal, (newGoal) => {
  localStorage.setItem(STORAGE_KEY_GOAL, String(newGoal));
});

const currentTheme = ref<ThemePreset>((localStorage.getItem(STORAGE_KEY_THEME) as any) || 'cyberpunk');

watch(currentTheme, (newTheme) => {
  localStorage.setItem(STORAGE_KEY_THEME, newTheme);
  applyThemePreset(newTheme);
}, { immediate: true });

const { watchlist, addToWatchlist, removeFromWatchlist, toggleWatched, updateNotes, updateUserRating, updateWatchedAt } = useWatchlist();
const { searchResults, isSearching, searchError, searchMovies, clearSearch, omdbApiKey, validateOmdbKey } = useMovieSearch();
const { exportToCSV, exportToJSON, importFromJSON } = useWatchlistBackup();

const query = ref('');
const activeTab = ref<'all' | 'plan' | 'watched'>('all');
const selectedGenre = ref<string>('All');
const activeNotesMovieId = ref<string | null>(null);
const sortBy = ref<SortOption>('date-desc');
const localQuery = ref('');

const showPickerModal = ref(false);
const pickedMovie = ref<any | null>(null);
const isSpinning = ref(false);
const displaySpinTitle = ref('');

const handlePickMovie = () => {
  if (watchlist.value.length === 0) return;
  showPickerModal.value = true;
  spinWheel();
};

const spinWheel = () => {
  isSpinning.value = true;
  pickedMovie.value = null;

  const finalPick = pickRandomMovie(watchlist.value);
  if (!finalPick) {
    isSpinning.value = false;
    return;
  }

  let counter = 0;
  const totalTicks = 18;
  const interval = setInterval(() => {
    const randomTemp = watchlist.value[Math.floor(Math.random() * watchlist.value.length)];
    displaySpinTitle.value = randomTemp ? randomTemp.title : '';
    counter++;

    if (counter >= totalTicks) {
      clearInterval(interval);
      pickedMovie.value = finalPick;
      displaySpinTitle.value = finalPick.title;
      isSpinning.value = false;
    }
  }, 90);
};

const showAnalytics = ref(true);
const genreStatsList = computed(() => getGenreStats(watchlist.value));

const goalProgress = computed(() => {
  return calculateMonthlyGoalProgress(watchlist.value, monthlyGoal.value);
});

const adjustGoal = (delta: number) => {
  const newGoal = monthlyGoal.value + delta;
  if (newGoal >= 1 && newGoal <= 100) {
    monthlyGoal.value = newGoal;
  }
};

const selectedDetailMovie = ref<any | null>(null);
const showDetailModal = ref(false);

const openDetailModal = (movie: any) => {
  selectedDetailMovie.value = movie;
  showDetailModal.value = true;
};

const showSettingsModal = ref(false);
const tempApiKey = ref(omdbApiKey.value);
const validationStatus = ref<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

const fileInput = ref<HTMLInputElement | null>(null);
const backupFeedback = ref<string | null>(null);
const backupFeedbackType = ref<'success' | 'error'>('success');

const triggerFileImport = () => {
  fileInput.value?.click();
};

const handleFileImport = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    const res = importFromJSON(text);
    if (res.success) {
      backupFeedbackType.value = 'success';
      backupFeedback.value = `Successfully imported ${res.count} movie(s).`;
    } else {
      backupFeedbackType.value = 'error';
      backupFeedback.value = res.error || 'Failed to import backup.';
    }
    target.value = '';
    setTimeout(() => {
      backupFeedback.value = null;
    }, 4000);
  };
  reader.readAsText(file);
};

// Save settings key
const handleSaveSettings = async () => {
  const trimmedKey = tempApiKey.value.trim();
  if (!trimmedKey) {
    omdbApiKey.value = '';
    showSettingsModal.value = false;
    validationStatus.value = 'idle';
    return;
  }
  
  validationStatus.value = 'validating';
  const isValid = await validateOmdbKey(trimmedKey);
  
  if (isValid) {
    validationStatus.value = 'valid';
    omdbApiKey.value = trimmedKey;
    setTimeout(() => {
      showSettingsModal.value = false;
      validationStatus.value = 'idle';
    }, 1000);
  } else {
    validationStatus.value = 'invalid';
  }
};

// Clear key
const handleClearKey = () => {
  tempApiKey.value = '';
  omdbApiKey.value = '';
  validationStatus.value = 'idle';
  showSettingsModal.value = false;
};

// Trigger movie search
const handleSearch = async () => {
  if (query.value.trim()) {
    await searchMovies(query.value);
  }
};

// Clear search input and results
const handleClearSearch = () => {
  query.value = '';
  clearSearch();
};

// Add to watchlist helper
const handleAddToWatchlist = (movie: any) => {
  addToWatchlist({
    id: movie.id,
    title: movie.title,
    year: movie.year,
    poster: movie.poster,
    genre: movie.genre,
    rating: movie.rating,
    plot: movie.plot
  });
};

// Extract unique genres from the watchlist dynamically for filter chips
const availableGenres = computed(() => {
  const genres = new Set<string>();
  watchlist.value.forEach(movie => {
    movie.genre.forEach(g => genres.add(g));
  });
  return ['All', ...Array.from(genres).sort()];
});

// Filtered and sorted watchlist matching tab, genre, search query, and sort selectors
const filteredWatchlist = computed(() => {
  const filtered = filterWatchlistMovies(
    watchlist.value,
    activeTab.value,
    selectedGenre.value,
    localQuery.value
  );

  return sortWatchlist(filtered, sortBy.value);
});

// Watchlist stats summary counters
const stats = computed(() => {
  const total = watchlist.value.length;
  const watched = watchlist.value.filter(m => m.watched).length;
  const plan = total - watched;
  return { total, watched, plan };
});

// Toggle notes slider overlay visibility
const toggleNotesSection = (id: string) => {
  if (activeNotesMovieId.value === id) {
    activeNotesMovieId.value = null;
  } else {
    activeNotesMovieId.value = id;
  }
};
</script>

<template>
  <div class="app-container fade-in">
    <!-- Navbar / Brand -->
    <header class="navbar">
      <div class="brand">
        <span class="pulse-icon">🎬</span>
        <h1>PulseMovie</h1>
      </div>
      <div class="stats-panel-group">
        <div class="stats-panel">
          <div class="stat-chip">
            <span class="stat-label">Total</span>
            <span class="stat-val val-blue">{{ stats.total }}</span>
          </div>
          <div class="stat-chip">
            <span class="stat-label">Plan to Watch</span>
            <span class="stat-val val-purple">{{ stats.plan }}</span>
          </div>
          <div class="stat-chip">
            <span class="stat-label">Watched</span>
            <span class="stat-val val-green">{{ stats.watched }}</span>
          </div>
        </div>
        <button 
          @click="showSettingsModal = true" 
          class="btn btn-secondary btn-icon-only settings-trigger-btn" 
          title="API Configuration Settings"
        >
          ⚙️
        </button>
      </div>
    </header>

    <main class="content-wrapper">
      <!-- Goal Tracker Banner -->
      <div class="goal-tracker-card fade-in">
        <div class="goal-header-row">
          <div class="goal-title">
            <span class="goal-icon">🎯</span>
            <div class="goal-text">
              <h4>Monthly Watch Goal</h4>
              <p class="goal-subtext">Track your target watch quota for this month</p>
            </div>
          </div>

          <div class="goal-stat-group">
            <div class="goal-counts">
              <strong>{{ goalProgress.completed }}</strong> / <span>{{ goalProgress.target }} Watched</span>
            </div>

            <div class="goal-controls">
              <button @click="adjustGoal(-1)" class="btn btn-xs btn-secondary" title="Decrease target goal">-</button>
              <span class="goal-target-val">{{ monthlyGoal }}</span>
              <button @click="adjustGoal(1)" class="btn btn-xs btn-secondary" title="Increase target goal">+</button>
            </div>
          </div>
        </div>

        <div class="goal-progress-container">
          <div 
            class="goal-progress-fill" 
            :class="{ 'goal-completed': goalProgress.isGoalReached }"
            :style="{ width: goalProgress.percentage + '%' }"
          ></div>
        </div>

        <div v-if="goalProgress.isGoalReached" class="goal-congrats-row fade-in">
          🎉 Awesome job! You've achieved your monthly watch target of {{ monthlyGoal }} movies!
        </div>
      </div>

      <!-- Search Panel -->
      <section class="search-section card">
        <h2>Find Movies & Shows</h2>
        <p class="section-desc">Search the public catalog database to add shows to your offline watchlist.</p>
        
        <form @submit.prevent="handleSearch" class="search-form">
          <div class="input-wrapper">
            <input 
              v-model="query" 
              type="text" 
              placeholder="Type movie or show title (e.g. Batman, Stranger Things)..." 
              class="search-input"
            />
            <button 
              v-if="query" 
              type="button" 
              @click="handleClearSearch" 
              class="clear-input-btn"
              title="Clear search"
            >
              ✕
            </button>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="isSearching">
            <span v-if="isSearching" class="spinner"></span>
            <span v-else>Search</span>
          </button>
        </form>

        <p v-if="searchError" class="error-msg">{{ searchError }}</p>
      </section>

      <!-- Search Results Area -->
      <section v-if="searchResults.length > 0" class="results-section card">
        <div class="results-header">
          <h3>Search Results ({{ searchResults.length }})</h3>
          <button @click="handleClearSearch" class="btn btn-secondary btn-sm">Close Results</button>
        </div>
        <div class="movie-grid">
          <div v-for="movie in searchResults" :key="movie.id" class="movie-card fade-in">
            <div class="poster-container">
              <img v-if="movie.poster" :src="movie.poster" :alt="movie.title" loading="lazy" />
              <div v-else class="poster-placeholder">
                <span>🎬</span>
              </div>
              <span class="rating-badge">★ {{ movie.rating }}</span>
            </div>
            <div class="movie-info">
              <span class="movie-year">{{ movie.year }}</span>
              <h4>{{ movie.title }}</h4>
              <p class="movie-plot">{{ movie.plot }}</p>
              <div class="genre-row">
                <span v-for="g in movie.genre" :key="g" class="genre-badge">{{ g }}</span>
              </div>
              <div class="search-actions-group">
                <button @click="handleAddToWatchlist(movie)" class="btn btn-purple btn-block">
                  + Add to Watchlist
                </button>
                <button @click="openDetailModal(movie)" class="btn btn-secondary btn-icon-only" title="View Full Details">
                  ℹ️
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Watchlist Analytics & Genre Breakdown -->
      <section v-if="watchlist.length > 0" class="analytics-section card">
        <div class="analytics-header" @click="showAnalytics = !showAnalytics" title="Toggle Analytics Panel">
          <div class="analytics-title">
            <span class="analytics-icon">📊</span>
            <h3>Watchlist Analytics & Genre Breakdown</h3>
          </div>
          <span class="accordion-arrow">{{ showAnalytics ? '▲' : '▼' }}</span>
        </div>
        
        <div v-show="showAnalytics" class="analytics-grid fade-in">
          <div v-for="stat in genreStatsList" :key="stat.name" class="stat-progress-card">
            <div class="stat-card-header">
              <span class="genre-name">{{ stat.name }}</span>
              <span class="genre-ratio">{{ stat.watched }} / {{ stat.total }} watched</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" :style="{ width: stat.percentage + '%' }"></div>
            </div>
            <div class="stat-card-footer">
              <span class="genre-percentage">{{ stat.percentage }}% Completed</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Watchlist Panel -->
      <section class="watchlist-section card">
        <div class="watchlist-header">
          <h3>My Watchlist</h3>
          
          <div class="header-controls">
            <!-- Inline Local Watchlist Title Search Filter -->
            <div class="local-search-wrapper">
              <input 
                v-model="localQuery" 
                type="text" 
                placeholder="Filter saved movies..." 
                class="local-search-input"
              />
              <button 
                v-if="localQuery" 
                @click="localQuery = ''" 
                class="clear-local-btn" 
                title="Clear title filter"
              >
                ✕
              </button>
            </div>

            <!-- Tabs selection bar -->
            <div class="tabs">
              <button 
                @click="activeTab = 'all'" 
                class="tab-btn" 
                :class="{ active: activeTab === 'all' }"
              >
                All
              </button>
              <button 
                @click="activeTab = 'plan'" 
                class="tab-btn" 
                :class="{ active: activeTab === 'plan' }"
              >
                Plan to Watch
              </button>
              <button 
                @click="activeTab = 'watched'" 
                class="tab-btn" 
                :class="{ active: activeTab === 'watched' }"
              >
                Watched
              </button>
            </div>

            <!-- Random Pick Button -->
            <button 
              v-if="watchlist.length > 0" 
              @click="handlePickMovie" 
              class="btn btn-purple pick-btn" 
              title="Spin random movie generator"
            >
              🎲 Pick For Me
            </button>

            <!-- Sorting selector -->
            <div class="sort-group">
              <label for="sortSelect">Sort:</label>
              <select id="sortSelect" v-model="sortBy" class="sort-select">
                <option value="date-desc">Newest Added</option>
                <option value="date-asc">Oldest Added</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="year-desc">Release Year</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Dynamic Genre Filter Chips -->
        <div class="genre-chips-container" v-if="availableGenres.length > 1">
          <button 
            v-for="genre in availableGenres" 
            :key="genre"
            @click="selectedGenre = genre"
            class="chip-btn"
            :class="{ active: selectedGenre === genre }"
          >
            {{ genre }}
          </button>
        </div>

        <!-- Active Watchlist Grid -->
        <div v-if="filteredWatchlist.length > 0" class="movie-grid">
          <div v-for="movie in filteredWatchlist" :key="movie.id" class="movie-card fade-in" :class="{ 'movie-watched': movie.watched }">
            <div class="poster-container">
              <img v-if="movie.poster" :src="movie.poster" :alt="movie.title" loading="lazy" />
              <div v-else class="poster-placeholder">
                <span>🎬</span>
              </div>
              <span class="rating-badge">★ {{ movie.rating }}</span>
            </div>
            
            <div class="movie-info">
              <div class="card-meta">
                <span class="movie-year">{{ movie.year }}</span>
                <span class="watched-status-label" :class="movie.watched ? 'status-watched' : 'status-plan'">
                  {{ movie.watched ? 'Watched' : 'Plan to Watch' }}
                </span>
              </div>
              <div class="title-row">
                <h4>{{ movie.title }}</h4>
                <div v-if="movie.userRating" class="user-card-rating" :title="'Rated ' + movie.userRating + '/5'">
                  <span v-for="star in movie.userRating" :key="star" class="star-fill">★</span>
                  <span v-for="star in (5 - movie.userRating)" :key="star" class="star-empty">☆</span>
                </div>
              </div>
              <div v-if="movie.watched && movie.watchedAt" class="watched-date-badge">
                🗓️ Watched: {{ movie.watchedAt }}
              </div>
              
              <div class="genre-row">
                <span v-for="g in movie.genre" :key="g" class="genre-badge">{{ g }}</span>
              </div>

              <!-- Controls Actions -->
              <div class="actions-row">
                <label class="toggle-switch">
                  <input type="checkbox" :checked="movie.watched" @change="toggleWatched(movie.id)" />
                  <span class="slider"></span>
                  <span class="toggle-text">{{ movie.watched ? 'Watched' : 'Mark Watched' }}</span>
                </label>
                
                <div class="btn-group">
                  <button 
                    @click="openDetailModal(movie)" 
                    class="btn btn-secondary btn-icon-only" 
                    title="View Full Details"
                  >
                    ℹ️
                  </button>
                  <button 
                    @click="toggleNotesSection(movie.id)" 
                    class="btn btn-secondary btn-icon-only" 
                    title="Write personal review/notes"
                  >
                    📝
                  </button>
                  <button 
                    @click="removeFromWatchlist(movie.id)" 
                    class="btn btn-coral btn-icon-only" 
                    title="Remove from watchlist"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <!-- Collapsible Notes slide-down form -->
              <div v-if="activeNotesMovieId === movie.id" class="notes-panel fade-in">
                <div class="rating-input-group">
                  <label>My Rating:</label>
                  <div class="rating-stars">
                    <span 
                      v-for="star in 5" 
                      :key="star" 
                      class="star-btn" 
                      :class="{ active: star <= (movie.userRating || 0) }"
                      @click="updateUserRating(movie.id, star)"
                    >
                      ★
                    </span>
                  </div>
                </div>

                <div class="watched-date-group">
                  <label for="watchedAtInput">Watched On:</label>
                  <input 
                    id="watchedAtInput" 
                    type="date" 
                    :value="movie.watchedAt" 
                    @input="updateWatchedAt(movie.id, ($event.target as HTMLInputElement).value)" 
                    class="date-input"
                  />
                </div>

                <div class="comments-group">
                  <label>Review Notes:</label>
                  <textarea 
                    v-model="movie.notes" 
                    @input="updateNotes(movie.id, (movie.notes || ''))"
                    placeholder="Write thoughts, review details, memories..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state placeholder -->
        <div v-else class="empty-state">
          <span class="empty-icon">🍿</span>
          <h4>No movies found in this view</h4>
          <p>Search and add movies above, or adjust your active filters to display items.</p>
        </div>
      </section>
    </main>

    <!-- Settings Modal -->
    <div v-if="showSettingsModal" class="modal-overlay fade-in" @click.self="showSettingsModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h4>Settings & API Providers</h4>
          <button @click="showSettingsModal = false" class="close-modal-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="apiKeyInput">Custom OMDb API Key:</label>
            <p class="input-tip">By default, the app queries TVMaze with no keys required. Paste a custom OMDb key to fetch movies from OMDb instead.</p>
            <input 
              id="apiKeyInput" 
              v-model="tempApiKey" 
              type="text" 
              placeholder="Enter OMDb API Key (e.g. a1b2c3d4)..." 
              class="search-input"
            />
          </div>
          <div class="validation-row" v-if="validationStatus !== 'idle'">
            <span v-if="validationStatus === 'validating'" class="status-validating">🔄 Verifying key connection...</span>
            <span v-else-if="validationStatus === 'valid'" class="status-valid">✅ Key is working correctly!</span>
            <span v-else-if="validationStatus === 'invalid'" class="status-invalid">❌ Invalid API Key. Please verify key is active.</span>
          </div>

          <!-- Color Theme Presets Section -->
          <div class="form-group">
            <label>Dashboard Aesthetic Theme:</label>
            <p class="input-tip">Choose a visual color scheme preset for your watchlist dashboard.</p>
            <div class="theme-selector-grid">
              <button 
                @click="currentTheme = 'cyberpunk'" 
                class="theme-chip-btn chip-cyberpunk" 
                :class="{ active: currentTheme === 'cyberpunk' }"
              >
                <span>🔮 Cyberpunk</span>
              </button>
              <button 
                @click="currentTheme = 'emerald'" 
                class="theme-chip-btn chip-emerald" 
                :class="{ active: currentTheme === 'emerald' }"
              >
                <span>🌿 Emerald</span>
              </button>
              <button 
                @click="currentTheme = 'sunset'" 
                class="theme-chip-btn chip-sunset" 
                :class="{ active: currentTheme === 'sunset' }"
              >
                <span>🌅 Sunset</span>
              </button>
              <button 
                @click="currentTheme = 'midnight'" 
                class="theme-chip-btn chip-midnight" 
                :class="{ active: currentTheme === 'midnight' }"
              >
                <span>🌌 Midnight</span>
              </button>
            </div>
          </div>

          <hr class="modal-divider" />

          <!-- OMDb API Key Section -->
          <div class="form-group">
            <label>Backup & Export Watchlist Data:</label>
            <p class="input-tip">Download your list as a spreadsheet report or raw JSON configuration profile backup.</p>
            <div class="backup-btn-row">
              <button @click="exportToCSV" class="btn btn-secondary btn-block">Download CSV Report</button>
              <button @click="exportToJSON" class="btn btn-secondary btn-block">Download JSON Backup</button>
            </div>
          </div>

          <!-- Backups Import Section -->
          <div class="form-group">
            <label>Restore Watchlist Backup:</label>
            <p class="input-tip">Upload a previously exported JSON backup file to import and merge movies into your current local cache.</p>
            <button @click="triggerFileImport" class="btn btn-purple btn-block">
              Upload JSON Backup File
            </button>
            <input 
              ref="fileInput" 
              type="file" 
              accept=".json" 
              @change="handleFileImport" 
              class="hidden-file-input"
            />
          </div>

          <div class="validation-row" v-if="backupFeedback">
            <span :class="backupFeedbackType === 'success' ? 'status-valid' : 'status-invalid'">
              {{ backupFeedback }}
            </span>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="handleClearKey" class="btn btn-secondary" :disabled="!tempApiKey">Clear Key</button>
          <button @click="handleSaveSettings" class="btn btn-primary">Save Config</button>
        </div>
      </div>
    </div>
    <!-- Detailed Movie Info Modal -->
    <div v-if="showDetailModal && selectedDetailMovie" class="modal-overlay fade-in" @click.self="showDetailModal = false">
      <div class="modal-card detail-modal-card">
        <div class="modal-header">
          <h4>Movie Overview & Metadata</h4>
          <button @click="showDetailModal = false" class="close-modal-btn">✕</button>
        </div>
        <div class="modal-body detail-modal-body">
          <div class="detail-hero">
            <div class="detail-poster-wrap">
              <img v-if="selectedDetailMovie.poster" :src="selectedDetailMovie.poster" :alt="selectedDetailMovie.title" />
              <div v-else class="poster-placeholder">
                <span>🎬</span>
              </div>
            </div>
            <div class="detail-main-meta">
              <h2>{{ selectedDetailMovie.title }}</h2>
              <div class="detail-badges-row">
                <span class="detail-badge badge-purple">{{ selectedDetailMovie.year }}</span>
                <span class="detail-badge badge-yellow">★ {{ selectedDetailMovie.rating }}</span>
                <span v-if="selectedDetailMovie.runtime" class="detail-badge badge-blue">⏱️ {{ selectedDetailMovie.runtime }}</span>
                <span v-if="selectedDetailMovie.watched !== undefined" class="detail-badge" :class="selectedDetailMovie.watched ? 'badge-green' : 'badge-coral'">
                  {{ selectedDetailMovie.watched ? '✓ Watched' : '⏳ Plan to Watch' }}
                </span>
              </div>
              
              <div class="genre-row margin-top">
                <span v-for="g in selectedDetailMovie.genre" :key="g" class="genre-badge">{{ g }}</span>
              </div>

              <div v-if="selectedDetailMovie.userRating" class="detail-user-rating">
                <span class="rating-label">My Personal Rating:</span>
                <span v-for="star in selectedDetailMovie.userRating" :key="star" class="star-fill">★</span>
                <span v-for="star in (5 - selectedDetailMovie.userRating)" :key="star" class="star-empty">☆</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h5>Plot Summary</h5>
            <p class="plot-text">{{ selectedDetailMovie.plot }}</p>
          </div>

          <div v-if="selectedDetailMovie.director" class="detail-section">
            <h5>Director</h5>
            <p class="meta-value">{{ selectedDetailMovie.director }}</p>
          </div>

          <div v-if="selectedDetailMovie.actors" class="detail-section">
            <h5>Cast & Starring</h5>
            <p class="meta-value">{{ selectedDetailMovie.actors }}</p>
          </div>

          <div v-if="selectedDetailMovie.notes" class="detail-section">
            <h5>My Review Notes</h5>
            <p class="notes-text">{{ selectedDetailMovie.notes }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showDetailModal = false" class="btn btn-primary">Close Overview</button>
        </div>
      </div>
    </div>

    <!-- Random Movie Picker Modal -->
    <div v-if="showPickerModal" class="modal-overlay fade-in" @click.self="showPickerModal = false">
      <div class="modal-card picker-modal-card">
        <div class="modal-header">
          <h4>🎲 What To Watch Generator</h4>
          <button @click="showPickerModal = false" class="close-modal-btn">✕</button>
        </div>
        <div class="modal-body text-center">
          <div v-if="isSpinning" class="spinning-container">
            <div class="spin-wheel-icon">🎰</div>
            <p class="spinning-label">Picking the perfect movie from your watchlist...</p>
            <h3 class="spin-title">{{ displaySpinTitle }}</h3>
          </div>

          <div v-else-if="pickedMovie" class="picked-result-container fade-in">
            <div class="picked-badge">🎉 We Picked For You!</div>
            <div class="picked-card">
              <div class="picked-poster">
                <img v-if="pickedMovie.poster" :src="pickedMovie.poster" :alt="pickedMovie.title" />
                <div v-else class="poster-placeholder"><span>🎬</span></div>
              </div>
              <div class="picked-details">
                <h3>{{ pickedMovie.title }}</h3>
                <div class="detail-badges-row">
                  <span class="detail-badge badge-purple">{{ pickedMovie.year }}</span>
                  <span class="detail-badge badge-yellow">★ {{ pickedMovie.rating }}</span>
                </div>
                <p class="picked-plot">{{ pickedMovie.plot }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="spinWheel" class="btn btn-secondary" :disabled="isSpinning">
            🔄 Spin Again
          </button>
          <button 
            v-if="pickedMovie" 
            @click="openDetailModal(pickedMovie); showPickerModal = false;" 
            class="btn btn-primary"
          >
            View Full Details
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* Navbar styles */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 20px;
  margin-bottom: 32px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.75px;
  background: linear-gradient(135deg, var(--text-primary), var(--accent-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.pulse-icon {
  font-size: 28px;
}

/* Stats counter panels */
.stats-panel {
  display: flex;
  gap: 12px;
}

.stat-chip {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: var(--glass-blur);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-val {
  font-size: 16px;
  font-weight: 700;
}

.val-blue { color: var(--accent-blue); }
.val-purple { color: var(--accent-purple); }
.val-green { color: var(--accent-green); }

/* Main layout wrappers */
.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Premium Card backdrops */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 28px;
  backdrop-filter: var(--glass-blur);
  box-shadow: var(--shadow-premium);
}

h2 {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
}

h3 {
  font-size: 18px;
  font-weight: 600;
}

.section-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 24px;
}

/* Search bar elements */
.search-form {
  display: flex;
  gap: 12px;
}

.input-wrapper {
  position: relative;
  flex-grow: 1;
}

.search-input {
  width: 100%;
  padding: 14px 44px 14px 18px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 15px;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-purple);
  box-shadow: 0 0 0 3px var(--accent-purple-glow);
}

.clear-input-btn {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
}

.clear-input-btn:hover {
  color: var(--text-primary);
}

/* Standard Premium buttons */
.btn {
  padding: 12px 24px;
  border-radius: 14px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: var(--accent-purple);
  color: var(--text-primary);
}

.btn-primary:hover:not(:disabled) {
  background: #6d28d9;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--border-hover);
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 10px;
}

.btn-purple {
  background: var(--accent-purple-glow);
  border: 1px solid rgba(124, 58, 237, 0.4);
  color: #c084fc;
}

.btn-purple:hover {
  background: var(--accent-purple);
  color: var(--text-primary);
  border-color: transparent;
}

.btn-coral {
  background: var(--accent-coral-glow);
  border: 1px solid rgba(244, 63, 94, 0.3);
  color: #fda4af;
}

.btn-coral:hover {
  background: var(--accent-coral);
  color: var(--text-primary);
  border-color: transparent;
}

.btn-block {
  width: 100%;
}

.btn-icon-only {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 10px;
}

/* Spinner indicator */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-msg {
  color: var(--accent-coral);
  font-size: 14px;
  margin-top: 12px;
}

/* Search results subheader */
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

/* Responsive grid columns */
.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
}

/* Individual Movie Card */
.movie-card {
  background: rgba(13, 17, 28, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.movie-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-hover);
  box-shadow: var(--shadow-premium);
}

.movie-watched {
  opacity: 0.75;
}

/* Poster layout image */
.poster-container {
  position: relative;
  aspect-ratio: 2 / 3;
  background: #0f172a;
  overflow: hidden;
}

.poster-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
}

.rating-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: var(--glass-blur);
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #fbbf24;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Movie description texts */
.movie-info {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.movie-year {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.watched-status-label {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
}

.status-watched {
  background: var(--accent-green-glow);
  color: #34d399;
}

.status-plan {
  background: var(--accent-purple-glow);
  color: #c084fc;
}

.movie-info h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  line-height: 1.3;
}

.movie-plot {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Genre labels row */
.genre-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
  margin-top: auto;
}

.genre-badge {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

/* Actions toggles */
.actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
  margin-top: auto;
  gap: 12px;
}

.btn-group {
  display: flex;
  gap: 8px;
}

/* Slide toggle switch styles */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.toggle-switch input {
  display: none;
}

.slider {
  width: 36px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  position: relative;
  transition: background-color 0.2s;
  border: 1px solid var(--border-color);
}

.slider::before {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #fff;
  left: 2px;
  top: 2px;
  transition: transform 0.2s;
}

.toggle-switch input:checked + .slider {
  background-color: var(--accent-green);
}

.toggle-switch input:checked + .slider::before {
  transform: translateX(16px);
}

.toggle-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

/* Private Review Notes slide-down */
.notes-panel {
  margin-top: 16px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notes-panel label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.notes-panel textarea {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  resize: vertical;
  min-height: 60px;
}

.notes-panel textarea:focus {
  outline: none;
  border-color: var(--accent-purple);
}

/* Watchlist filter layout */
.watchlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.tab-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--accent-purple);
  color: var(--text-primary);
  box-shadow: 0 4px 10px rgba(124, 58, 237, 0.3);
}

/* Dynamic Genre chips filters bar */
.genre-chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.chip-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s;
}

.chip-btn:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.chip-btn.active {
  background: var(--accent-purple-glow);
  border-color: var(--accent-purple);
  color: #c084fc;
}

/* Empty watchlist layout */
.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.empty-state h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 320px;
  margin: 0 auto;
}

/* Responsive adjustment layouts */
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .stats-panel {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  
  .search-form {
    flex-direction: column;
  }
  
  .watchlist-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .tabs {
    width: 100%;
  }
  
  .tab-btn {
    flex-grow: 1;
    text-align: center;
  }
}

.stats-panel-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-trigger-btn {
  background: var(--bg-card);
  border-radius: 12px;
  font-size: 16px;
}

/* Modal overlay and card styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(3, 7, 18, 0.7);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  background: #0f172a;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-premium);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h4 {
  font-size: 16px;
  font-weight: 600;
}

.close-modal-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 16px;
}

.close-modal-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: left;
}

.input-tip {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
  text-align: left;
}

.validation-row {
  font-size: 13px;
  font-weight: 500;
  text-align: left;
}

.status-validating { color: var(--accent-blue); }
.status-valid { color: var(--accent-green); }
.status-invalid { color: var(--accent-coral); }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  background: rgba(0, 0, 0, 0.15);
  border-top: 1px solid var(--border-color);
}

/* User ratings, date stars widgets styles */
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.title-row h4 {
  margin-bottom: 0 !important;
}

.user-card-rating {
  display: inline-flex;
  gap: 2px;
  font-size: 13px;
  line-height: 1.3;
}

.star-fill {
  color: #fbbf24;
}

.star-empty {
  color: rgba(255, 255, 255, 0.15);
}

.watched-date-badge {
  font-size: 11px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  width: fit-content;
}

/* Notes slide down items */
.rating-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rating-stars {
  display: flex;
  gap: 6px;
}

.star-btn {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: transform 0.15s, color 0.15s;
}

.star-btn:hover {
  transform: scale(1.2);
  color: #fcd34d;
}

.star-btn.active {
  color: #fbbf24;
}

.watched-date-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.watched-date-group label,
.rating-input-group label,
.comments-group label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: left;
}

.date-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
}

.date-input:focus {
  outline: none;
  border-color: var(--accent-purple);
}

.comments-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal-divider {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 8px 0;
}

.backup-btn-row {
  display: flex;
  gap: 12px;
}

.hidden-file-input {
  display: none;
}

/* Analytics & Genre Stats styles */
.analytics-section {
  user-select: none;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.analytics-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.analytics-icon {
  font-size: 20px;
}

.accordion-arrow {
  font-size: 14px;
  color: var(--text-secondary);
  transition: transform 0.2s;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 24px;
  border-top: 1px solid var(--border-color);
  padding-top: 24px;
}

.stat-progress-card {
  background: rgba(13, 17, 28, 0.4);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.genre-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: left;
}

.genre-ratio {
  font-size: 11px;
  color: var(--text-secondary);
  text-align: right;
}

.progress-bar-container {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-purple), var(--accent-green));
  border-radius: 4px;
  transition: width 0.4s ease-out;
}

.stat-card-footer {
  text-align: right;
}

.genre-percentage {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-green);
}

/* Header controls and sorting styles */
.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.sort-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.sort-select {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-primary);
  padding: 8px 12px;
  font-family: inherit;
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.sort-select:focus {
  border-color: var(--accent-purple);
}

/* Movie Detail Modal Styles */
.detail-modal-card {
  max-width: 600px !important;
}

.detail-modal-body {
  max-height: 80vh;
  overflow-y: auto;
}

.detail-hero {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.detail-poster-wrap {
  width: 120px;
  height: 170px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
}

.detail-poster-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-main-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.detail-main-meta h2 {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.detail-badges-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
}

.badge-purple { color: #c084fc; border-color: rgba(192, 132, 252, 0.3); }
.badge-yellow { color: #fcd34d; border-color: rgba(252, 211, 77, 0.3); }
.badge-blue { color: #60a5fa; border-color: rgba(96, 165, 250, 0.3); }
.badge-green { color: #4ade80; border-color: rgba(74, 222, 128, 0.3); }
.badge-coral { color: #f87171; border-color: rgba(248, 113, 113, 0.3); }

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  border-top: 1px solid var(--border-color);
  padding-top: 14px;
}

.detail-section h5 {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.plot-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
}

.meta-value, .notes-text {
  font-size: 13px;
  color: var(--text-primary);
}

.margin-top {
  margin-top: 4px;
}

.detail-user-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.search-actions-group {
  display: flex;
  gap: 8px;
  width: 100%;
}

/* Goal Tracker Banner Styles */
.goal-tracker-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-premium);
}

.goal-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.goal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.goal-icon {
  font-size: 24px;
}

.goal-text h4 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  text-align: left;
}

.goal-subtext {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  text-align: left;
}

.goal-stat-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.goal-counts {
  font-size: 15px;
  color: var(--text-secondary);
}

.goal-counts strong {
  font-size: 18px;
  color: var(--text-primary);
}

.goal-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.btn-xs {
  padding: 2px 8px !important;
  font-size: 12px !important;
  border-radius: 4px !important;
  height: 24px;
  line-height: 1;
}

.goal-target-val {
  font-size: 13px;
  font-weight: 700;
  min-width: 20px;
  text-align: center;
}

.goal-progress-container {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  overflow: hidden;
}

.goal-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
  border-radius: 6px;
  transition: width 0.4s ease-out;
}

.goal-progress-fill.goal-completed {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.goal-congrats-row {
  font-size: 12px;
  font-weight: 600;
  color: #34d399;
  text-align: left;
}

/* Local search filter styles */
.local-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.local-search-input {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-primary);
  padding: 8px 32px 8px 12px;
  font-family: inherit;
  font-size: 13px;
  outline: none;
  width: 180px;
  transition: border-color 0.2s, width 0.2s;
}

.local-search-input:focus {
  border-color: var(--accent-purple);
  width: 220px;
}

.clear-local-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  padding: 4px;
}

.clear-local-btn:hover {
  color: var(--text-primary);
}

/* Random Picker Modal styles */
.picker-modal-card {
  max-width: 480px !important;
}

.spinning-container {
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spin-wheel-icon {
  font-size: 48px;
  animation: pulse 1s infinite alternate;
}

.spinning-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.spin-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent-purple);
  min-height: 30px;
}

.picked-result-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.picked-badge {
  font-size: 12px;
  font-weight: 700;
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.3);
  padding: 6px 14px;
  border-radius: 20px;
}

.picked-card {
  display: flex;
  gap: 16px;
  text-align: left;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  width: 100%;
}

.picked-poster {
  width: 90px;
  height: 130px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-card);
}

.picked-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.picked-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picked-details h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.picked-plot {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pick-btn {
  font-size: 13px !important;
  padding: 8px 14px !important;
  border-radius: 10px !important;
}

/* Theme Preset Selector Styles */
.theme-selector-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 6px;
}

.theme-chip-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.theme-chip-btn:hover {
  transform: translateY(-2px);
}

.chip-cyberpunk.active {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.15);
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.3);
}

.chip-emerald.active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.15);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
}

.chip-sunset.active {
  border-color: #f97316;
  background: rgba(249, 115, 22, 0.15);
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.3);
}

.chip-midnight.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.15);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
}
</style>
