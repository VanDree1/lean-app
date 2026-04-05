import { useState, useCallback } from 'react';

const ONBOARDING_KEY = 'djur-i-juni:onboarding';
const PROFILE_KEY    = 'djur-i-juni:profile';
const WEIGHT_KEY     = 'djur-i-juni:weight-log';

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}

export function useOnboarding() {
  const [done, setDone] = useState(() => !!load(ONBOARDING_KEY)?.completedAt);

  const complete = useCallback((formData) => {
    // Save raw onboarding data
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify({
      ...formData,
      completedAt: Date.now(),
    }));

    // Save structured profile for other hooks
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
      name:        formData.name,
      height:      parseFloat(formData.height) || null,
      gender:      formData.gender || null,
      startWeight: parseFloat(formData.currentWeight) || 105,
      goalWeight:  parseFloat(formData.goalWeight)    || 95,
      targetDate:  formData.targetDate || null,
      diet:        formData.diet       || null,
      allergies:   formData.allergies  || null,
    }));
    window.dispatchEvent(new Event('djur-i-juni:profile-updated'));

    // Seed initial weight log entry
    const currentWeightNum = parseFloat(formData.currentWeight);
    if (currentWeightNum) {
      const today    = new Date().toISOString().slice(0, 10);
      const existing = load(WEIGHT_KEY) ?? [];
      if (!existing.find((e) => e.date === today)) {
        localStorage.setItem(
          WEIGHT_KEY,
          JSON.stringify([{ date: today, weight: currentWeightNum }, ...existing])
        );
        window.dispatchEvent(new Event('djur-i-juni:weight-updated'));
      }
    }

    setDone(true);
  }, []);

  return { isComplete: done, complete };
}
