import { useEffect, useState } from 'react';

const LAST_SEEN_DATE_KEY = 'djur_juni_last_seen';
const LAST_LOGGED_DATE_KEY = 'djur_juni_last_logged';
const STREAK_KEY = 'djur_juni_streak';
const DAILY_CHECKIN_KEY = 'djur_juni_daily_checkin';
const DAILY_HISTORY_KEY = 'djur_juni_daily_history';
const CALORIES_KEY = 'djur_juni_cal';
const BURNED_KEY = 'djur_juni_burned';
const STEPS_KEY = 'djur_juni_steps';
const TODAY_STATS_KEYS = [
  'djur-i-juni:today-stats',
  'djur-i-juni:daily-summary',
];

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function parseStoredDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return isoDate(parsed);
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loadHistory() {
  const history = loadJson(DAILY_HISTORY_KEY, []);
  return Array.isArray(history) ? history : [];
}

function saveHistory(entries) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(DAILY_HISTORY_KEY, JSON.stringify(sorted));
}

function readStatsPayload() {
  for (const key of TODAY_STATS_KEYS) {
    const parsed = loadJson(key, null);
    if (parsed?.date) return parsed;
  }

  return null;
}

function writeStatsPayload(date, calories, steps) {
  const payload = { date, calories, steps };

  for (const key of TODAY_STATS_KEYS) {
    localStorage.setItem(key, JSON.stringify(payload));
  }
}

function resolveLastSeenDate() {
  const explicit = parseStoredDate(localStorage.getItem(LAST_SEEN_DATE_KEY));
  if (explicit) return explicit;

  const statsDate = parseStoredDate(readStatsPayload()?.date);
  const checkinDate = parseStoredDate(loadJson(DAILY_CHECKIN_KEY, null)?.date);
  const loggedDate = parseStoredDate(localStorage.getItem(LAST_LOGGED_DATE_KEY));

  return [explicit, statsDate, checkinDate, loggedDate]
    .filter(Boolean)
    .sort()
    .at(-1) || null;
}

function upsertHistoryEntry(history, entry) {
  const next = history.filter((item) => item.date !== entry.date);
  next.push(entry);
  return next;
}

function buildHistoryEntry(date) {
  const statsPayload = readStatsPayload();
  const checkin = loadJson(DAILY_CHECKIN_KEY, null);
  const checkinDate = parseStoredDate(checkin?.date);
  const loggedDate = parseStoredDate(localStorage.getItem(LAST_LOGGED_DATE_KEY));

  return {
    date,
    calories: Number(localStorage.getItem(CALORIES_KEY)) || Number(statsPayload?.calories) || 0,
    steps: Number(localStorage.getItem(STEPS_KEY)) || Number(statsPayload?.steps) || 0,
    burned: Number(localStorage.getItem(BURNED_KEY)) || 0,
    locked: loggedDate === date && checkinDate === date,
    sleepHours: checkinDate === date ? Number(checkin?.sleepHours) || 0 : 0,
    workoutKey: checkinDate === date ? checkin?.workoutKey || '' : '',
    workoutName: checkinDate === date ? checkin?.workoutName || '' : '',
    duration: checkinDate === date ? Number(checkin?.duration) || 0 : 0,
  };
}

function createEmptyEntry(date) {
  return {
    date,
    calories: 0,
    steps: 0,
    burned: 0,
    locked: false,
    sleepHours: 0,
    workoutKey: '',
    workoutName: '',
    duration: 0,
  };
}

function addDays(date, amount) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + amount);
  return isoDate(next);
}

function missingDatesBetween(startDate, endDateExclusive) {
  const missing = [];
  let cursor = addDays(startDate, 1);

  while (cursor < endDateExclusive) {
    missing.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return missing;
}

function resetTodayState(today) {
  localStorage.setItem(CALORIES_KEY, '0');
  localStorage.setItem(BURNED_KEY, '0');
  localStorage.setItem(STEPS_KEY, '0');
  writeStatsPayload(today, 0, 0);
  localStorage.removeItem(DAILY_CHECKIN_KEY);
  localStorage.removeItem(LAST_LOGGED_DATE_KEY);
}

function dispatchDailyUpdate() {
  window.dispatchEvent(new Event('djur-i-juni:today-stats-updated'));
  window.dispatchEvent(new Event('djur-i-juni:daily-logic-updated'));
}

function syncDailyTimeline() {
  const today = isoDate();
  const lastSeen = resolveLastSeenDate();

  if (!lastSeen) {
    localStorage.setItem(LAST_SEEN_DATE_KEY, today);

    const statsPayload = readStatsPayload();
    if (statsPayload?.date && statsPayload.date !== today) {
      resetTodayState(today);
      localStorage.setItem(STREAK_KEY, '0');
      dispatchDailyUpdate();
    }
    return;
  }

  if (lastSeen >= today) {
    localStorage.setItem(LAST_SEEN_DATE_KEY, today);
    return;
  }

  let history = loadHistory();
  const completedPreviousDay = buildHistoryEntry(lastSeen).locked;
  history = upsertHistoryEntry(history, buildHistoryEntry(lastSeen));

  for (const missedDate of missingDatesBetween(lastSeen, today)) {
    history = upsertHistoryEntry(history, createEmptyEntry(missedDate));
  }

  saveHistory(history);
  resetTodayState(today);
  localStorage.setItem(LAST_SEEN_DATE_KEY, today);

  if (!completedPreviousDay || missingDatesBetween(lastSeen, today).length > 0) {
    localStorage.setItem(STREAK_KEY, '0');
  }

  dispatchDailyUpdate();
}

export function useDailyLogic() {
  const [history, setHistory] = useState(() => loadHistory());

  useEffect(() => {
    function handleSync() {
      syncDailyTimeline();
      setHistory(loadHistory());
    }

    handleSync();

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        handleSync();
      }
    }

    window.addEventListener('focus', handleSync);
    window.addEventListener('storage', handleSync);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('storage', handleSync);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { history };
}
