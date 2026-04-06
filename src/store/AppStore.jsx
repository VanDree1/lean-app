import { useEffect, useMemo, useReducer } from 'react';
import { AppStoreContext } from './useAppStore';

const ONBOARDING_KEY = 'djur-i-juni:onboarding';
const PROFILE_KEY = 'djur-i-juni:profile';
const SHARED_PROFILE_KEY = 'djur_juni_profile';
const WEIGHT_KEY = 'djur-i-juni:weight-log';
const CALORIES_KEY = 'djur_juni_cal';
const BURNED_KEY = 'djur_juni_burned';
const STEPS_KEY = 'djur_juni_steps';
const PROTEIN_KEY = 'djur_juni_protein';
const SLEEP_KEY = 'djur_juni_sleep_hours';
const DAILY_CHECKIN_KEY = 'djur_juni_daily_checkin';
const LAST_LOGGED_DATE_KEY = 'djur_juni_last_logged';
const STREAK_KEY = 'djur_juni_streak';
const DAILY_SAVED_AT_KEY = 'djur_juni_daily_saved_at';
const DAILY_ENTRIES_KEY = 'djur_juni_daily_entries';
const FAVORITES_KEY = 'djur-i-juni:recipe-favorites';
const FILTERS_KEY = 'djur-i-juni:recipe-filters';
const SHOPPING_KEY = 'djur-i-juni:shopping-list';
const QUOTE_CACHE_KEY = 'djur_i_juni_quote_cache';
const TODAY_STATS_KEYS = ['djur-i-juni:today-stats', 'djur-i-juni:daily-summary'];

const DEFAULT_PROFILE = {
  weight: 100,
  goalWeight: 90,
  caloriesGoal: 3150,
  proteinGoal: 220,
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDailyEntries(entries) {
  return entries && typeof entries === 'object' ? entries : {};
}

function createInitialState() {
  const onboarding = loadJson(ONBOARDING_KEY, {});
  const legacyProfile = loadJson(PROFILE_KEY, {});
  const sharedProfile = loadJson(SHARED_PROFILE_KEY, {});
  const todayStats = TODAY_STATS_KEYS
    .map((key) => loadJson(key, null))
    .find((value) => value?.date === isoToday()) || {};

  return {
    onboarding,
    profile: {
      ...DEFAULT_PROFILE,
      ...(legacyProfile || {}),
      ...(sharedProfile || {}),
    },
    weightLog: loadJson(WEIGHT_KEY, []),
    daily: {
      calories: Number(localStorage.getItem(CALORIES_KEY)) || Number(todayStats.calories) || 0,
      burned: Number(localStorage.getItem(BURNED_KEY)) || 0,
      steps: Number(localStorage.getItem(STEPS_KEY)) || Number(todayStats.steps) || 0,
      protein: Number(localStorage.getItem(PROTEIN_KEY)) || 0,
      sleepHours: Number(localStorage.getItem(SLEEP_KEY)) || 8,
      dailyCheckin: loadJson(DAILY_CHECKIN_KEY, null),
      lastLoggedDate: localStorage.getItem(LAST_LOGGED_DATE_KEY) || null,
      streak: Number(localStorage.getItem(STREAK_KEY)) || 0,
      savedAt: localStorage.getItem(DAILY_SAVED_AT_KEY) || null,
      dailyEntries: normalizeDailyEntries(loadJson(DAILY_ENTRIES_KEY, {})),
    },
    recipes: {
      favorites: loadJson(FAVORITES_KEY, []),
      filters: loadJson(FILTERS_KEY, {}),
    },
    shoppingList: loadJson(SHOPPING_KEY, []),
    quoteCache: normalizeDailyEntries(loadJson(QUOTE_CACHE_KEY, {})),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'SAVE_ONBOARDING_DRAFT':
      return {
        ...state,
        onboarding: { ...state.onboarding, ...action.payload },
      };
    case 'COMPLETE_ONBOARDING': {
      const formData = action.payload;
      const today = isoToday();
      const currentWeightNum = parseFloat(formData.currentWeight);
      const nextWeightLog = currentWeightNum && !state.weightLog.find((e) => e.date === today)
        ? [{ date: today, weight: currentWeightNum }, ...state.weightLog]
        : state.weightLog;

      return {
        ...state,
        onboarding: { ...formData, completedAt: Date.now() },
        profile: {
          ...state.profile,
          name: formData.name,
          age: parseFloat(formData.age) || null,
          height: parseFloat(formData.height) || null,
          gender: formData.gender || null,
          goal: formData.goal || null,
          activity: formData.activity || null,
          startWeight: parseFloat(formData.currentWeight) || 105,
          currentWeight: parseFloat(formData.currentWeight) || null,
          goalWeight: parseFloat(formData.goalWeight) || 95,
          targetDate: formData.targetDate || null,
          diet: formData.diet || null,
          allergies: formData.allergies || null,
          updatedAt: Date.now(),
        },
        weightLog: nextWeightLog,
      };
    }
    case 'RESET_ONBOARDING':
      return {
        ...state,
        onboarding: {},
        profile: { ...DEFAULT_PROFILE },
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profile: {
          ...state.profile,
          ...action.payload,
          updatedAt: action.payload.updatedAt ?? Date.now(),
        },
      };
    case 'LOG_WEIGHT': {
      const { date, weight } = action.payload;
      const filtered = state.weightLog.filter((entry) => entry.date !== date);
      const next = [...filtered, { date, weight: parseFloat(weight) }].sort((a, b) => b.date.localeCompare(a.date));
      const currentEntry = state.daily.dailyEntries[date] || { date };
      return {
        ...state,
        weightLog: next,
        profile: {
          ...state.profile,
          currentWeight: parseFloat(weight),
        },
        daily: {
          ...state.daily,
          dailyEntries: {
            ...state.daily.dailyEntries,
            [date]: {
              ...currentEntry,
              date,
              weight: parseFloat(weight),
            },
          },
        },
      };
    }
    case 'REMOVE_WEIGHT': {
      const date = action.payload.date;
      const currentEntry = state.daily.dailyEntries[date];
      const nextDailyEntries = currentEntry
        ? {
            ...state.daily.dailyEntries,
            [date]: {
              ...currentEntry,
              weight: null,
            },
          }
        : state.daily.dailyEntries;
      return {
        ...state,
        weightLog: state.weightLog.filter((entry) => entry.date !== date),
        daily: {
          ...state.daily,
          dailyEntries: nextDailyEntries,
        },
      };
    }
    case 'SET_DAILY_VALUES':
      return {
        ...state,
        daily: {
          ...state.daily,
          ...action.payload,
        },
      };
    case 'LOG_MEAL': {
      const { slotKey, meal } = action.payload;
      const today = isoToday();
      const currentEntry = state.daily.dailyEntries[today] || { date: today, meals: {} };
      const nextMeals = {
        breakfast: currentEntry.meals?.breakfast || null,
        lunch: currentEntry.meals?.lunch || null,
        dinner: currentEntry.meals?.dinner || null,
        snack: currentEntry.meals?.snack || null,
        [slotKey]: meal,
      };
      const nextCalories = Object.values(nextMeals).reduce((sum, entry) => sum + (entry?.calories || 0), 0);

      return {
        ...state,
        daily: {
          ...state.daily,
          calories: nextCalories,
          dailyEntries: {
            ...state.daily.dailyEntries,
            [today]: {
              ...currentEntry,
              date: today,
              meals: nextMeals,
            },
          },
        },
      };
    }
    case 'COMPLETE_DAILY_CHECKIN':
      {
        const checkinDate = new Date(action.payload.lastLoggedDate).toISOString().slice(0, 10);
        const currentEntry = state.daily.dailyEntries[checkinDate] || { date: checkinDate };
        return {
          ...state,
          daily: {
            ...state.daily,
            calories: action.payload.calories,
            burned: action.payload.burned,
            sleepHours: action.payload.sleepHours,
            dailyCheckin: action.payload.checkin,
            lastLoggedDate: action.payload.lastLoggedDate,
            streak: action.payload.streak,
            savedAt: action.payload.savedAt,
            dailyEntries: {
              ...state.daily.dailyEntries,
              [checkinDate]: {
                ...currentEntry,
                date: checkinDate,
                calories: action.payload.calories,
                burned: action.payload.burned,
                sleepHours: action.payload.sleepHours,
                locked: true,
                workoutKey: action.payload.checkin?.workoutKey || '',
                workoutName: action.payload.checkin?.workoutName || '',
                duration: Number(action.payload.checkin?.duration) || 0,
              },
            },
          },
        };
      }
    case 'UNLOCK_DAILY_CHECKIN': {
      const today = isoToday();
      const currentEntry = state.daily.dailyEntries[today];
      return {
        ...state,
        daily: {
          ...state.daily,
          lastLoggedDate: null,
          dailyEntries: currentEntry
            ? {
                ...state.daily.dailyEntries,
                [today]: {
                  ...currentEntry,
                  locked: false,
                },
              }
            : state.daily.dailyEntries,
        },
      };
    }
    case 'SET_QUOTE_CACHE':
      return {
        ...state,
        quoteCache: {
          ...state.quoteCache,
          [action.payload.goal]: action.payload.quote,
        },
      };
    case 'TOGGLE_RECIPE_FAVORITE': {
      const set = new Set(state.recipes.favorites);
      if (set.has(action.payload.id)) set.delete(action.payload.id);
      else set.add(action.payload.id);
      return {
        ...state,
        recipes: {
          ...state.recipes,
          favorites: [...set],
        },
      };
    }
    case 'SET_RECIPE_FILTERS':
      return {
        ...state,
        recipes: {
          ...state.recipes,
          filters: {
            ...state.recipes.filters,
            ...action.payload,
          },
        },
      };
    case 'ADD_SHOPPING_FROM_RECIPE': {
      const { recipe, ingredients } = action.payload;
      const next = [...state.shoppingList];
      for (const text of ingredients) {
        if (!next.some((item) => item.recipeId === recipe.id && item.text === text)) {
          next.push({ id: `${recipe.id}-${text}`, text, checked: false, recipeId: recipe.id, recipeTitle: recipe.title });
        }
      }
      return { ...state, shoppingList: next };
    }
    case 'TOGGLE_SHOPPING_ITEM':
      return {
        ...state,
        shoppingList: state.shoppingList.map((item) => item.id === action.payload.id ? { ...item, checked: !item.checked } : item),
      };
    case 'CLEAR_SHOPPING_CHECKED':
      return {
        ...state,
        shoppingList: state.shoppingList.filter((item) => !item.checked),
      };
    case 'CLEAR_SHOPPING_ALL':
      return {
        ...state,
        shoppingList: [],
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state.onboarding));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));
    localStorage.setItem(SHARED_PROFILE_KEY, JSON.stringify(state.profile));
    localStorage.setItem(WEIGHT_KEY, JSON.stringify(state.weightLog));
    localStorage.setItem(CALORIES_KEY, String(state.daily.calories));
    localStorage.setItem(BURNED_KEY, String(state.daily.burned));
    localStorage.setItem(STEPS_KEY, String(state.daily.steps));
    localStorage.setItem(PROTEIN_KEY, String(state.daily.protein));
    localStorage.setItem(SLEEP_KEY, String(state.daily.sleepHours));
    localStorage.setItem(DAILY_ENTRIES_KEY, JSON.stringify(state.daily.dailyEntries));
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.recipes.favorites));
    localStorage.setItem(FILTERS_KEY, JSON.stringify(state.recipes.filters));
    localStorage.setItem(SHOPPING_KEY, JSON.stringify(state.shoppingList));
    localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify(state.quoteCache));

    if (state.daily.dailyCheckin) {
      localStorage.setItem(DAILY_CHECKIN_KEY, JSON.stringify(state.daily.dailyCheckin));
    } else {
      localStorage.removeItem(DAILY_CHECKIN_KEY);
    }
    if (state.daily.lastLoggedDate) {
      localStorage.setItem(LAST_LOGGED_DATE_KEY, state.daily.lastLoggedDate);
    } else {
      localStorage.removeItem(LAST_LOGGED_DATE_KEY);
    }
    if (state.daily.savedAt) {
      localStorage.setItem(DAILY_SAVED_AT_KEY, state.daily.savedAt);
    } else {
      localStorage.removeItem(DAILY_SAVED_AT_KEY);
    }
    localStorage.setItem(STREAK_KEY, String(state.daily.streak));

    const todayPayload = {
      date: isoToday(),
      calories: state.daily.calories,
      steps: state.daily.steps,
    };
    for (const key of TODAY_STATS_KEYS) {
      localStorage.setItem(key, JSON.stringify(todayPayload));
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}
