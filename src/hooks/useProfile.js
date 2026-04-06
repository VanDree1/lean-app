import { useAppStore } from '../store/useAppStore';

const ACTIVITY_MULTIPLIER = {
  sedentary:   1.2,
  light:       1.375,
  very_active: 1.55,
};

// kcal adjustment relative to TDEE
const GOAL_ADJUSTMENT = {
  fat_loss: -350,
  recomposition: -150,
  muscle:   +200,
  energy:      0,
  target:   -250,
};

// protein g per kg bodyweight
const PROTEIN_PER_KG = {
  fat_loss: 2.0,
  recomposition: 2.2,
  muscle:   2.2,
  energy:   1.8,
  target:   2.0,
};

export function calcTargets(profile) {
  const weight = profile.startWeight ?? 90;
  const height = profile.height     ?? 175;
  const age    = profile.age        ?? 30;
  const gender   = profile.gender;   // 'Man' | 'Kvinna' | null
  const activity = profile.activity ?? 'light';
  const goal     = profile.goal     ?? 'fat_loss';

  // Mifflin-St Jeor BMR
  const genderOffset = gender === 'Man' ? 5 : gender === 'Kvinna' ? -161 : -78;
  const bmr = 10 * weight + 6.25 * height - 5 * age + genderOffset;

  const tdee = bmr * (ACTIVITY_MULTIPLIER[activity] ?? 1.375);
  const adjustment = GOAL_ADJUSTMENT[goal] ?? 0;

  // Round to nearest 50 kcal
  const kcalGoal = Math.max(1200, Math.round((tdee + adjustment) / 50) * 50);
  const proteinGoal = Math.round(weight * (PROTEIN_PER_KG[goal] ?? 1.8));

  return { kcalGoal, proteinGoal };
}

export function useProfile() {
  const { state } = useAppStore();
  const profile = state.profile;
  return { profile, ...calcTargets(profile) };
}
