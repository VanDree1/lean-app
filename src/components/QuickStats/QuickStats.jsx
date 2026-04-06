import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
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

function saveTodayStats(nextStats) {
  const payload = {
    date: todayString(),
    calories: Number(nextStats.calories) || 0,
    steps: Number(nextStats.steps) || 0,
  };

  for (const key of TODAY_STATS_KEYS) {
    localStorage.setItem(key, JSON.stringify(payload));
  }
}

function TodayCard({ label, unit, value, target, isEditing, inputValue, onEditStart, onInputChange, onInputSubmit }) {
  const displayed = useCountUp(value, 700);
  const progress = Math.max(0, Math.min(100, target > 0 ? (value / target) * 100 : 0));

  return (
    <section className={styles.card} aria-label={label}>
      <button type="button" className={styles.addButton} onClick={onEditStart} aria-label={`Lägg till ${label.toLowerCase()}`}>
        <Plus size={16} strokeWidth={1.5} />
      </button>

      <span className={styles.label}>{label}</span>

      <div className={styles.valueRow}>
        {isEditing ? (
          <input
            className={styles.inlineInput}
            type="number"
            inputMode="numeric"
            autoFocus
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onInputSubmit();
              }
            }}
            aria-label={`${label} input`}
          />
        ) : (
          <>
            <span className={[styles.value, value === 0 ? styles.valueEmpty : ''].join(' ')}>
              {displayed.toLocaleString('sv-SE')}
            </span>
            <span className={styles.unit}>{unit}</span>
          </>
        )}
      </div>

      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${progress}%` }} />
      </div>

      <span className={styles.meta}>Mål {target.toLocaleString('sv-SE')}</span>
    </section>
  );
}

export default function QuickStats() {
  const { profile, kcalGoal } = useProfile();
  const [stats, setStats] = useState(readTodayStats);
  const [isEditingCalories, setIsEditingCalories] = useState(false);
  const [isEditingSteps, setIsEditingSteps] = useState(false);
  const [calorieInput, setCalorieInput] = useState('');
  const [stepInput, setStepInput] = useState('');

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

  function submitCalories() {
    const increment = Number(calorieInput);
    if (!increment) {
      setIsEditingCalories(false);
      setCalorieInput('');
      return;
    }

    const nextStats = { ...stats, calories: stats.calories + increment };
    setStats(nextStats);
    saveTodayStats(nextStats);
    setIsEditingCalories(false);
    setCalorieInput('');
  }

  function submitSteps() {
    const increment = Number(stepInput);
    if (!increment) {
      setIsEditingSteps(false);
      setStepInput('');
      return;
    }

    const nextStats = { ...stats, steps: stats.steps + increment };
    setStats(nextStats);
    saveTodayStats(nextStats);
    setIsEditingSteps(false);
    setStepInput('');
  }

  return (
    <div className={styles.grid}>
      <TodayCard
        label="Kalorier"
        unit="KCAL"
        value={stats.calories}
        target={kcalGoal}
        isEditing={isEditingCalories}
        inputValue={calorieInput}
        onEditStart={() => {
          setIsEditingSteps(false);
          setStepInput('');
          setIsEditingCalories(true);
        }}
        onInputChange={setCalorieInput}
        onInputSubmit={submitCalories}
      />
      <TodayCard
        label="Steg"
        unit="STEG"
        value={stats.steps}
        target={stepGoal}
        isEditing={isEditingSteps}
        inputValue={stepInput}
        onEditStart={() => {
          setIsEditingCalories(false);
          setCalorieInput('');
          setIsEditingSteps(true);
        }}
        onInputChange={setStepInput}
        onInputSubmit={submitSteps}
      />
    </div>
  );
}
