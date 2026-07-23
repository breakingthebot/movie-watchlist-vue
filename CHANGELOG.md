# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
