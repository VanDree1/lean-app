import { createContext, useContext } from 'react';

export const AppStoreContext = createContext(null);

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within AppProvider');
  }

  const { state, dispatch } = context;

  return {
    state,
    dispatch,
    updateProfile: (payload) => dispatch({ type: 'UPDATE_PROFILE', payload }),
    saveOnboardingDraft: (payload) => dispatch({ type: 'SAVE_ONBOARDING_DRAFT', payload }),
    completeOnboarding: (payload) => dispatch({ type: 'COMPLETE_ONBOARDING', payload }),
    resetOnboarding: () => dispatch({ type: 'RESET_ONBOARDING' }),
    logWeight: (payload) => dispatch({ type: 'LOG_WEIGHT', payload }),
    removeWeight: (date) => dispatch({ type: 'REMOVE_WEIGHT', payload: { date } }),
    setDailyValues: (payload) => dispatch({ type: 'SET_DAILY_VALUES', payload }),
    logMeal: (slotKey, meal) => dispatch({ type: 'LOG_MEAL', payload: { slotKey, meal } }),
    completeDailyCheckin: (payload) => dispatch({ type: 'COMPLETE_DAILY_CHECKIN', payload }),
    unlockDailyCheckin: () => dispatch({ type: 'UNLOCK_DAILY_CHECKIN' }),
    setQuoteCache: (goal, quote) => dispatch({ type: 'SET_QUOTE_CACHE', payload: { goal, quote } }),
    toggleRecipeFavorite: (id) => dispatch({ type: 'TOGGLE_RECIPE_FAVORITE', payload: { id } }),
    setRecipeFilters: (payload) => dispatch({ type: 'SET_RECIPE_FILTERS', payload }),
    addShoppingFromRecipe: (recipe, ingredients) => dispatch({ type: 'ADD_SHOPPING_FROM_RECIPE', payload: { recipe, ingredients } }),
    toggleShoppingItem: (id) => dispatch({ type: 'TOGGLE_SHOPPING_ITEM', payload: { id } }),
    clearShoppingChecked: () => dispatch({ type: 'CLEAR_SHOPPING_CHECKED' }),
    clearShoppingAll: () => dispatch({ type: 'CLEAR_SHOPPING_ALL' }),
  };
}
