import { useMemo } from 'react';

function normalizeEntries(dailyEntries, weightLog) {
  const merged = new Map();

  Object.entries(dailyEntries || {}).forEach(([date, entry]) => {
    if (!entry || typeof entry !== 'object') return;
    merged.set(date, { date, ...entry });
  });

  (weightLog || []).forEach((entry) => {
    if (!entry?.date) return;
    const existing = merged.get(entry.date) || { date: entry.date };
    merged.set(entry.date, {
      ...existing,
      weight: Number(entry.weight) || null,
    });
  });

  return [...merged.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function getRecentLockedEntries(entries, limit = 7) {
  return entries.filter((entry) => entry.locked).slice(-limit);
}

function detectLowSleepStreak(entries) {
  const recent = getRecentLockedEntries(entries, 5);
  if (recent.length < 3) return null;

  const lastThree = recent.slice(-3);
  const poorSleep = lastThree.every((entry) => Number(entry.sleepHours) > 0 && Number(entry.sleepHours) < 6);
  if (!poorSleep) return null;

  const averageSleep = lastThree.reduce((sum, entry) => sum + Number(entry.sleepHours || 0), 0) / 3;

  return {
    key: 'low_sleep_streak',
    title: 'Mönster upptäckt',
    status: 'Återhämtning',
    body: `Tre dagar i rad under 6 timmars sömn. Snittet ligger på ${averageSleep.toFixed(1).replace('.', ',')} h. Håll träningen lätt och prioritera sömnen i natt.`,
    tone: 'warning',
  };
}

function detectWeightTrainingTrend(entries) {
  const weighted = getRecentLockedEntries(entries, 8).filter((entry) => Number.isFinite(Number(entry.weight)));
  if (weighted.length < 4) return null;

  const recent = weighted.slice(-3);
  const previous = weighted.slice(-6, -3);
  if (previous.length < 2) return null;

  const recentWeight = Number(recent[recent.length - 1].weight);
  const previousWeight = Number(previous[0].weight);
  const recentBurn = recent.reduce((sum, entry) => sum + Number(entry.burned || 0), 0);
  const previousBurn = previous.reduce((sum, entry) => sum + Number(entry.burned || 0), 0);
  const recentDuration = recent.reduce((sum, entry) => sum + Number(entry.duration || 0), 0);
  const previousDuration = previous.reduce((sum, entry) => sum + Number(entry.duration || 0), 0);

  const weightDropped = previousWeight - recentWeight >= 0.3;
  const trainingUp = recentBurn > previousBurn || recentDuration > previousDuration;
  if (!weightDropped || !trainingUp) return null;

  return {
    key: 'weight_down_training_up',
    title: 'Mönster upptäckt',
    status: 'Bra trend',
    body: `Vikten går ned samtidigt som träningsvolymen ökar. Det brukar betyda att du håller riktningen utan att tappa rytmen.`,
    tone: 'positive',
  };
}

function detectWorkoutMomentum(entries) {
  const recent = getRecentLockedEntries(entries, 7);
  if (recent.length < 4) return null;

  const workoutDays = recent.filter((entry) => Number(entry.duration || 0) > 0);
  if (workoutDays.length < 4) return null;

  const totalMinutes = workoutDays.reduce((sum, entry) => sum + Number(entry.duration || 0), 0);

  return {
    key: 'workout_momentum',
    title: 'Mönster upptäckt',
    status: 'Momentum',
    body: `Bra momentum. Du har tränat ${workoutDays.length} gånger den senaste veckan och samlat ${totalMinutes} minuters rörelse.`,
    tone: 'positive',
  };
}

function detectMealPattern(entries, goal) {
  if (goal !== 'muscle') return null;

  const recent = getRecentLockedEntries(entries, 4);
  if (recent.length < 3) return null;

  const lowProteinMeals = recent.every((entry) => {
    const meals = entry.meals || {};
    return Object.values(meals).every((meal) => !meal?.extraProtein);
  });

  if (!lowProteinMeals) return null;

  return {
    key: 'protein_missing',
    title: 'Mönster upptäckt',
    status: 'Protein',
    body: 'Tre dagar i rad utan extra protein i måltiderna. Om målet är muskler är det här det enklaste stället att höja kvaliteten.',
    tone: 'neutral',
  };
}

export function useInsights({ dailyEntries, weightLog, goal }) {
  return useMemo(() => {
    const entries = normalizeEntries(dailyEntries, weightLog);
    const detectors = [
      detectLowSleepStreak(entries),
      detectWeightTrainingTrend(entries),
      detectWorkoutMomentum(entries),
      detectMealPattern(entries, goal),
    ];

    return detectors.find(Boolean) || null;
  }, [dailyEntries, weightLog, goal]);
}
