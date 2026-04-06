import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

export function useWeightLog() {
  const { state, logWeight, removeWeight } = useAppStore();
  const entries = state.weightLog;
  const profile = state.profile;

  const START_WEIGHT = profile.startWeight ?? 105;
  const GOAL_WEIGHT  = profile.goalWeight  ?? 95;

  const recent  = entries.slice(0, 7);
  const current = entries[0]?.weight ?? START_WEIGHT;
  const lost    = START_WEIGHT - current;
  const totalToLose = START_WEIGHT - GOAL_WEIGHT;
  const progress = totalToLose > 0
    ? Math.min(100, Math.max(0, (lost / totalToLose) * 100))
    : 0;

  return useMemo(() => ({
    recent,
    current,
    lost,
    progress,
    addEntry: (date, weight) => logWeight({ date, weight }),
    removeEntry: (date) => removeWeight(date),
    GOAL_WEIGHT,
    START_WEIGHT,
  }), [recent, current, lost, progress, logWeight, removeWeight, GOAL_WEIGHT, START_WEIGHT]);
}
