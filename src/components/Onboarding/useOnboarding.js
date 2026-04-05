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

  const saveDraft = useCallback((formData) => {
    const existing = load(ONBOARDING_KEY) ?? {};
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify({
      ...existing,
      ...formData,
    }));
  }, []);

  const complete = useCallback((formData) => {
    // Save raw onboarding data
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify({
      ...formData,
      completedAt: Date.now(),
    }));

    // Save structured profile for other hooks
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
      name:        formData.name,
      age:         parseFloat(formData.age) || null,
      height:      parseFloat(formData.height) || null,
      gender:      formData.gender || null,
      goal:        formData.goal || null,
      activity:    formData.activity || null,
      startWeight: parseFloat(formData.currentWeight) || 105,
      goalWeight:  parseFloat(formData.goalWeight)    || 95,
      targetDate:  formData.targetDate || null,
      diet:        formData.diet       || null,
      allergies:   formData.allergies  || null,
      updatedAt:   Date.now(),
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

  return { isComplete: done, complete, saveDraft };
}
