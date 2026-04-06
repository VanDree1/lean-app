import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import AnimatedNumber from '../AnimatedNumber/AnimatedNumber';
import { useProfile } from '../../hooks/useProfile';
import styles from './QuickStats.module.css';

const CALORIES_KEY = 'djur_i_juni_calories';
const STEPS_KEY = 'djur_i_juni_steps';
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

function readInitialCalories() {
  const direct = Number(localStorage.getItem(CALORIES_KEY));
  if (Number.isFinite(direct) && direct > 0) return direct;
  return readTodayStats().calories;
}

function readInitialSteps() {
  const direct = Number(localStorage.getItem(STEPS_KEY));
  if (Number.isFinite(direct) && direct > 0) return direct;
  return readTodayStats().steps;
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

function TodayCard({
  label,
  unit,
  value,
  target,
  isEditing,
  inputValue,
  feedback,
  onEditStart,
  onInputChange,
  onInputSubmit,
  onInputBlur,
}) {
  const progress = Math.max(0, Math.min(100, target > 0 ? (value / target) * 100 : 0));

  return (
    <section className={[styles.card, feedback ? styles.cardSaved : ''].join(' ')} aria-label={label}>
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
            onBlur={onInputBlur}
            aria-label={`${label} input`}
          />
        ) : (
          <>
            <span className={[styles.value, value === 0 ? styles.valueEmpty : ''].join(' ')}>
              <AnimatedNumber value={value} duration={800} />
            </span>
            <span className={styles.unit}>{unit}</span>
          </>
        )}
      </div>

      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.footerRow}>
        <span className={styles.meta}>Mål {target.toLocaleString('sv-SE')}</span>
        <span className={[styles.feedback, feedback ? styles.feedbackVisible : ''].join(' ')}>
          {feedback || ''}
        </span>
      </div>
    </section>
  );
}

export default function QuickStats() {
  const { profile, kcalGoal } = useProfile();
  const [calories, setCalories] = useState(() => readInitialCalories());
  const [steps, setSteps] = useState(() => readInitialSteps());
  const [isEditingCalories, setIsEditingCalories] = useState(false);
  const [isEditingSteps, setIsEditingSteps] = useState(false);
  const [tempInput, setTempInput] = useState('');
  const [feedback, setFeedback] = useState({ calories: '', steps: '' });

  useEffect(() => {
    function syncStats() {
      setCalories(readInitialCalories());
      setSteps(readInitialSteps());
    }

    window.addEventListener('storage', syncStats);
    window.addEventListener('focus', syncStats);

    return () => {
      window.removeEventListener('storage', syncStats);
      window.removeEventListener('focus', syncStats);
    };
  }, []);

  const stepGoal = STEP_GOALS[profile.activity] || STEP_GOALS.light;

  function triggerFeedback(key, amount, unit) {
    setFeedback((current) => ({ ...current, [key]: `+${amount} ${unit}` }));

    window.setTimeout(() => {
      setFeedback((current) => {
        if (!current[key]) return current;
        return { ...current, [key]: '' };
      });
    }, 1600);
  }

  function handleSaveCalories() {
    const increment = Number(tempInput);
    if (!increment) {
      setIsEditingCalories(false);
      setTempInput('');
      return;
    }

    const nextCalories = calories + increment;
    setCalories(nextCalories);
    localStorage.setItem(CALORIES_KEY, String(nextCalories));
    const nextStats = { calories: nextCalories, steps };
    saveTodayStats(nextStats);
    triggerFeedback('calories', increment, 'kcal');
    setIsEditingCalories(false);
    setTempInput('');
  }

  function handleSaveSteps() {
    const increment = Number(tempInput);
    if (!increment) {
      setIsEditingSteps(false);
      setTempInput('');
      return;
    }

    const nextSteps = steps + increment;
    setSteps(nextSteps);
    localStorage.setItem(STEPS_KEY, String(nextSteps));
    const nextStats = { calories, steps: nextSteps };
    saveTodayStats(nextStats);
    triggerFeedback('steps', increment, 'steg');
    setIsEditingSteps(false);
    setTempInput('');
  }

  return (
    <div className={styles.grid}>
      <TodayCard
        label="Kalorier"
        unit="KCAL"
        value={calories}
        target={kcalGoal}
        isEditing={isEditingCalories}
        inputValue={tempInput}
        feedback={feedback.calories}
        onEditStart={() => {
          setIsEditingSteps(false);
          setTempInput('');
          setIsEditingCalories(true);
        }}
        onInputChange={setTempInput}
        onInputSubmit={handleSaveCalories}
        onInputBlur={handleSaveCalories}
      />
      <TodayCard
        label="Steg"
        unit="STEG"
        value={steps}
        target={stepGoal}
        isEditing={isEditingSteps}
        inputValue={tempInput}
        feedback={feedback.steps}
        onEditStart={() => {
          setIsEditingCalories(false);
          setTempInput('');
          setIsEditingSteps(true);
        }}
        onInputChange={setTempInput}
        onInputSubmit={handleSaveSteps}
        onInputBlur={handleSaveSteps}
      />
    </div>
  );
}
