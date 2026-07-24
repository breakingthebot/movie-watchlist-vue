# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.16.0] - 2026-07-23

### Added
- Created `src/utils/theme.ts` module with Cyberpunk, Emerald, Sunset, and Midnight theme color schemes.
- Integrated `currentTheme` reactive state and LocalStorage sync (`pulse_theme_preset`) in `src/App.vue`.
- Added **Dashboard Aesthetic Theme** preset selector grid inside Settings modal.
- Dynamic CSS root property injection (`applyThemePreset`).
- Written 3 unit tests in `src/utils/theme.spec.ts`.

## [0.15.0] - 2026-07-23

### Added
- Created `src/utils/picker.ts` pure utility function to select random unwatched movies from a list.
- Added `🎲 Pick For Me` button in the watchlist header controls of `src/App.vue`.
- Built `PickerModal` with title-cycling wheel spin animation (🎰).
- Provided quick actions to re-spin (`🔄 Spin Again`) or view full details.
- Written 3 unit tests in `src/utils/picker.spec.ts`.

## [0.14.0] - 2026-07-23

### Added
- Created `src/utils/filter.ts` pure utility function to filter movies by tab, genre, and local title query.
- Integrated `localQuery` reactive state and clear button controls (✕) in the `watchlist-header` of `src/App.vue`.
- Updated `filteredWatchlist` computed property to combine tab, genre, query, and sorting pipelines.
- Written 3 unit tests in `src/utils/filter.spec.ts`.

## [0.13.0] - 2026-07-23

### Added
- Created `src/utils/goal.ts` calculating monthly target counts, watched completions, and percentage progress.
- Integrated `monthlyGoal` state and LocalStorage sync (`pulse_monthly_goal`).
- Built top-level **Monthly Watch Goal** banner card with `+` and `-` target controls and celebration alerts.
- Rendered goal progress bar with gradient completion fills.
- Written 3 unit tests in `src/utils/goal.spec.ts`.

## [0.12.0] - 2026-07-23

### Added
- Extended `SearchResult` and `Movie` interfaces with optional `director`, `actors`, and `runtime` fields.
- Mapped extra OMDb API fields inside `useMovieSearch.ts`.
- Integrated `selectedDetailMovie` and `showDetailModal` state in `src/App.vue`.
- Built rich `MovieDetailModal` view displaying full plot summaries, directors, cast members, badges, and user reviews.
- Added info buttons (`ℹ️`) on search results and watchlist cards.

## [0.11.0] - 2026-07-23

### Added
- Created `src/utils/sort.ts` module with `sortWatchlist` supporting Date, Title, Rating, and Release Year sorting.
- Integrated dynamic sorting dropdown select control in the `watchlist-header` of `src/App.vue`.
- Updated `filteredWatchlist` computed property to execute real-time array sorting.
- Written 5 unit tests in `src/utils/sort.spec.ts` asserting all sorting options.

## [0.10.0] - 2026-07-23

### Added
- Created `public/manifest.json` defining standalone app display, theme colors, and icons.
- Programmed `public/sw.js` Service Worker script caching static assets offline with stale-while-revalidate fallback strategies.
- Created `src/utils/pwa.ts` service worker registration module and invoked it in `src/main.ts`.
- Updated `index.html` with web manifest links and theme-color meta headers.
- Written 2 unit tests in `src/utils/pwa.spec.ts` asserting registration behavior.

## [0.9.0] - 2026-07-23

### Added
- Created `src/utils/stats.ts` module compiling genre counts, ratio completions, and completion percentages.
- Integrated dynamic statistics accordion widgets positioned above the local watchlist.
- Rendered gradient progress indicators mapping watch progress percentages by genre.
- Programmed collapsible arrows to slide panels open and closed.
- Written 2 unit tests asserting getGenreStats calculations.

## [0.8.0] - 2026-07-23

### Added
- Created `useWatchlistBackup.ts` data utility hook.
- Added CSV spreadsheet report generator and JSON backup downloads.
- Built schema-validated JSON import parsers to merge files into local storage caches.
- Integrated download buttons and hidden file upload pickers in the Settings modal body.
- Written 3 unit tests verifying backup creations and upload error boundaries.

## [0.7.0] - 2026-07-23

### Added
- Added `userRating` and `watchedAt` properties to the watchlist movie schema.
- Programmed interactive 1-5 star button selectors in the review notes drawer.
- Structured calendar watch date calendars.
- Rendered visual star indicators (★/☆) and date badges on active card lists.
- Wrote 2 unit tests asserting user rating and date updates.

## [0.6.0] - 2026-07-23

### Added
- Created settings modal gear triggers on the dashboard header.
- Programmed connection validation checking OMDb API Key credentials.
- Integrated concurrent detail fetching for OMDb movie results resolving plots and genres.

## [0.5.0] - 2026-07-23

### Added
- Developed the movie watchlist main dashboard container in `src/App.vue`.
- Built search triggers, search result catalog grids, and dynamic watchlist grids.
- Programmed scrollable genre filter chips and Plan to Watch / Watched selection tabs.
- Added custom inline review textareas.
- Cleaned unused scaffold component `src/components/HelloWorld.vue`.
- Successfully deployed to Vercel.

## [0.4.0] - 2026-07-23

### Added
- Created `useMovieSearch.ts` API fetch client composable.
- Mapped external TVMaze REST API response schemas to target dashboard data schemas.
- Written 3 unit tests verifying search query parameter construction and failure modes with mock boundaries.

## [0.3.0] - 2026-07-23

### Added
- Created `useWatchlist.ts` composable state manager hook.
- Integrated automated `localStorage` cache read/write.
- Installed `vitest`, `happy-dom`, and `@vue/test-utils` testing dependencies.
- Wrote 6 unit tests asserting state modifications.

## [0.2.0] - 2026-07-23

### Added
- Overwrote `src/style.css` with dark-slate CSS variables.
- Configured Outfit & Plus Jakarta Sans typography.
- Integrated background blur elements and custom scrollbars.

## [0.1.0] - 2026-07-23

### Added
- Scaffolded project structure using Vite Vue 3 + TypeScript template.
- Configured local environment rules: `.gitignore` and `AGENTS.md`.
