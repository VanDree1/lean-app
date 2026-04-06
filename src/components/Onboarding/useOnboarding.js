import { useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';

export function useOnboarding() {
  const { state, saveOnboardingDraft, completeOnboarding, resetOnboarding } = useAppStore();
  const done = Boolean(state.onboarding?.completedAt);

  const saveDraft = useCallback((formData) => {
    saveOnboardingDraft(formData);
  }, [saveOnboardingDraft]);

  const complete = useCallback((formData) => {
    completeOnboarding(formData);
  }, [completeOnboarding]);

  const reset = useCallback(() => {
    resetOnboarding();
  }, [resetOnboarding]);

  return { isComplete: done, complete, saveDraft, reset };
}
