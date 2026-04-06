import { useState, useCallback, useEffect } from 'react';
import { getDailyHistoryEntry, upsertDailyHistoryEntry } from '../../hooks/useDailyLogic';

const STORAGE_KEY = 'djur-i-juni:weight-log';
const PROFILE_KEY = 'djur-i-juni:profile';

function loadLog() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []; }
  catch { return []; }
}

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) ?? {}; }
  catch { return {}; }
}

function saveLog(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event('djur-i-juni:weight-updated'));
}

export function useWeightLog() {
  const [entries, setEntries] = useState(loadLog);
  const [profile, setProfile] = useState(loadProfile);

  useEffect(() => {
    function syncFromStorage() {
      setEntries(loadLog());
      setProfile(loadProfile());
    }

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('djur-i-juni:weight-updated', syncFromStorage);
    window.addEventListener('djur-i-juni:profile-updated', syncFromStorage);

    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('djur-i-juni:weight-updated', syncFromStorage);
      window.removeEventListener('djur-i-juni:profile-updated', syncFromStorage);
    };
  }, []);

  const START_WEIGHT = profile.startWeight ?? 105;
  const GOAL_WEIGHT  = profile.goalWeight  ?? 95;

  const addEntry = useCallback((date, weight) => {
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== date);
      const next = [...filtered, { date, weight: parseFloat(weight) }]
        .sort((a, b) => b.date.localeCompare(a.date));
      saveLog(next);
      const existing = getDailyHistoryEntry(date);
      upsertDailyHistoryEntry({
        date,
        calories: existing?.calories || 0,
        steps: existing?.steps || 0,
        burned: existing?.burned || 0,
        locked: existing?.locked || false,
        sleepHours: existing?.sleepHours || 0,
        workoutKey: existing?.workoutKey || '',
        workoutName: existing?.workoutName || '',
        duration: existing?.duration || 0,
        weight: parseFloat(weight),
      });
      return next;
    });
  }, []);

  const removeEntry = useCallback((date) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.date !== date);
      saveLog(next);
      const existing = getDailyHistoryEntry(date);
      if (existing) {
        upsertDailyHistoryEntry({
          ...existing,
          weight: null,
        });
      }
      return next;
    });
  }, []);

  const recent  = entries.slice(0, 7);
  const current = entries[0]?.weight ?? START_WEIGHT;
  const lost    = START_WEIGHT - current;
  const totalToLose = START_WEIGHT - GOAL_WEIGHT;
  const progress = totalToLose > 0
    ? Math.min(100, Math.max(0, (lost / totalToLose) * 100))
    : 0;

  return { recent, current, lost, progress, addEntry, removeEntry, GOAL_WEIGHT, START_WEIGHT };
}
