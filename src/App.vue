<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWatchlist } from './composables/useWatchlist';
import { useMovieSearch } from './composables/useMovieSearch';

const { watchlist, addToWatchlist, removeFromWatchlist, toggleWatched, updateNotes, updateUserRating, updateWatchedAt } = useWatchlist();
const { searchResults, isSearching, searchError, searchMovies, clearSearch, omdbApiKey, validateOmdbKey } = useMovieSearch();

const query = ref('');
const activeTab = ref<'all' | 'plan' | 'watched'>('all');
const selectedGenre = ref<string>('All');
const activeNotesMovieId = ref<string | null>(null);

const showSettingsModal = ref(false);
const tempApiKey = ref(omdbApiKey.value);
const validationStatus = ref<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

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

// Filtered watchlist matching tab and genre selectors
const filteredWatchlist = computed(() => {
  return watchlist.value.filter(movie => {
    // Tab filter
    const matchesTab = 
      activeTab.value === 'all' ||
      (activeTab.value === 'plan' && !movie.watched) ||
      (activeTab.value === 'watched' && movie.watched);
      
    // Genre filter
    const matchesGenre = 
      selectedGenre.value === 'All' || 
      movie.genre.includes(selectedGenre.value);

    return matchesTab && matchesGenre;
  });
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
              <button @click="handleAddToWatchlist(movie)" class="btn btn-purple btn-block">
                + Add to Watchlist
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Watchlist Panel -->
      <section class="watchlist-section card">
        <div class="watchlist-header">
          <h3>My Watchlist</h3>
          
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
        </div>
        <div class="modal-footer">
          <button @click="handleClearKey" class="btn btn-secondary" :disabled="!tempApiKey">Clear Key</button>
          <button @click="handleSaveSettings" class="btn btn-primary">Save Config</button>
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
</style>
