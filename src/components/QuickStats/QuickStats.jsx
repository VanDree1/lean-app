import { useEffect, useState } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useCountUp } from '../../hooks/useCountUp';
import styles from './QuickStats.module.css';

const TODAY_STATS_KEYS = [
  'djur-i-juni:today-stats',
  'djur-i-juni:daily-summary',
];

const STEP_GOALS = {
  sedentary: 6000,
  light: 8000,
  very_active: 10000,
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function readTodayStats() {
  try {
    for (const key of TODAY_STATS_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (!parsed || parsed.date !== todayString()) continue;

      return {
        calories: Number(parsed.calories) || 0,
        steps: Number(parsed.steps) || 0,
      };
    }
  } catch {
    return { calories: 0, steps: 0 };
  }

  return { calories: 0, steps: 0 };
}

function TodayCard({ label, unit, value, target }) {
  const displayed = useCountUp(value, 700);

  return (
    <section className={styles.card} aria-label={label}>
      <span className={styles.label}>{label}</span>

      <div className={styles.valueRow}>
        <span className={styles.value}>{displayed.toLocaleString('sv-SE')}</span>
        <span className={styles.unit}>{unit}</span>
      </div>

      <span className={styles.meta}>Mål {target.toLocaleString('sv-SE')}</span>
    </section>
  );
}

export default function QuickStats() {
  const { profile, kcalGoal } = useProfile();
  const [stats, setStats] = useState(readTodayStats);

  useEffect(() => {
    function syncStats() {
      setStats(readTodayStats());
    }

    window.addEventListener('storage', syncStats);
    window.addEventListener('focus', syncStats);

    return () => {
      window.removeEventListener('storage', syncStats);
      window.removeEventListener('focus', syncStats);
    };
  }, []);

  const stepGoal = STEP_GOALS[profile.activity] || STEP_GOALS.light;

  return (
    <div className={styles.grid}>
      <TodayCard
        label="Kalorier"
        unit="KCAL"
        value={stats.calories}
        target={kcalGoal}
      />
      <TodayCard
        label="Steg"
        unit="STEG"
        value={stats.steps}
        target={stepGoal}
      />
    </div>
  );
}
