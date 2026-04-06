import { useAppStore } from '../store/useAppStore';

export function useStreak() {
  const { state } = useAppStore();
  const entries = state.weightLog;

  const dates = new Set(entries.map((e) => e.date));
  const todayStr = new Date().toISOString().slice(0, 10);
  const loggedToday = dates.has(todayStr);

  let streak = 0;
  const d = new Date();
  // If not logged today, start counting from yesterday
  if (!loggedToday) d.setDate(d.getDate() - 1);

  while (dates.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return { streak, loggedToday };
}
