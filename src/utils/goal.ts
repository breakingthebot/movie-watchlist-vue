/*
 * src/utils/goal.ts
 * Pure utility function calculating monthly movie watch target goals.
 * Created: 2026-07-23
 */

import type { Movie } from '../composables/useWatchlist';

export interface GoalProgress {
  target: number;
  completed: number;
  percentage: number;
  isGoalReached: boolean;
}

/**
 * Calculates watch goal progress metrics for a given target.
 * @param movies List of watchlist movies.
 * @param targetGoal Target number of movies to watch per month.
 * @param currentYearMonth Optional YYYY-MM override string.
 * @returns GoalProgress summary object.
 */
export function calculateMonthlyGoalProgress(
  movies: Movie[],
  targetGoal: number,
  currentYearMonth?: string
): GoalProgress {
  const target = targetGoal > 0 ? Math.floor(targetGoal) : 5;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const targetMonthPrefix = currentYearMonth || `${year}-${month}`;

  const completed = movies.filter((m) => {
    if (!m.watched) return false;
    if (!m.watchedAt) return true;
    return m.watchedAt.startsWith(targetMonthPrefix);
  }).length;

  const percentage = Math.min(100, Math.round((completed / target) * 100));
  const isGoalReached = completed >= target;

  return {
    target,
    completed,
    percentage,
    isGoalReached
  };
}
