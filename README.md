# PulseMovie — Movie Watchlist Dashboard

A high-performance, responsive movie watchlist dashboard built with **Vue 3** and **TypeScript**, powered by Vite. The application supports API-based movie searches, adding/removing movies to custom watchlists, marking status completions, and category/genre breakdowns.

## Stack
- **Framework**: Vue 3 (Composition API `<script setup>`)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Slate dark premium theme)
- **Persistence**: LocalDevice/Browser LocalStorage

## Setup
1. Navigate to the project directory:
   ```bash
   cd Build_38
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```

## Running Locally
- Run the local development server:
   ```bash
   npm run dev
   ```
   This will boot the app at `http://localhost:5173`.

## Running Tests
- Execute unit specs using Vitest:
   ```bash
   npm run test
   ```

## Deployed
- **Vercel Production App**: *To be deployed on Vercel*
- **GitHub Repository**: [https://github.com/breakingthebot/movie-watchlist-vue](https://github.com/breakingthebot/movie-watchlist-vue)

## Architecture Notes
PulseMovie is structured around decoupled Vue 3 components:
- **State Store (`src/composables/useWatchlist.ts`)**: centralizes search query filters, pagination, genre selections, and local storage synchronizations using Vue reactive references.
- **UI System**: Renders search results grids, watched list entries, and genre badges.

## Data Handling & Privacy
- **Collection**: No personal data, credentials, or search telemetry queries are transmitted to external networks.
- **Storage**: Custom watchlists, watched tags, and settings are cached locally inside browser `LocalStorage`.
- **Sharing**: Fully sandboxed client-only logic sharing zero user data.
