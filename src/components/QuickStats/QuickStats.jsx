import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import AnimatedNumber from '../AnimatedNumber/AnimatedNumber';
import { calcTargets } from '../../hooks/useProfile';
import styles from './QuickStats.module.css';

const CALORIES_KEY = 'djur_juni_cal';
const STEPS_KEY = 'djur_juni_steps';
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

function StepsCard({
  label,
  unit,
  cardKey,
  value,
  target,
  isEditing,
  inputValue,
  feedback,
  inputRef,
  onEditStart,
  onInputChange,
  onInputSubmit,
  onInputCancel,
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
            ref={inputRef}
            className={styles.inlineInput}
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                onInputCancel();
                return;
              }

              if (event.key === 'Enter') {
                onInputSubmit();
              }
            }}
            onBlur={onInputBlur}
            aria-label={`${label} input`}
            aria-describedby={`${cardKey}-meta`}
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
        <span id={`${cardKey}-meta`} className={styles.meta}>Mål {target.toLocaleString('sv-SE')}</span>
        <span className={[styles.feedback, feedback ? styles.feedbackVisible : ''].join(' ')}>
          {feedback || ''}
        </span>
      </div>
    </section>
  );
}

function CaloriesCard({
  goal,
  eaten,
  burned,
  isEditing,
  inputValue,
  feedback,
  inputRef,
  onEditStart,
  onInputChange,
  onInputSubmit,
  onInputCancel,
  onInputBlur,
}) {
  const remaining = goal - eaten + burned;
  const netEaten = eaten - burned;
  const progress = Math.max(0, Math.min(100, goal > 0 ? (netEaten / goal) * 100 : 0));

  return (
    <section className={[styles.card, feedback ? styles.cardSaved : ''].join(' ')} aria-label="Kalorier">
      <button type="button" className={styles.addButton} onClick={onEditStart} aria-label="Lägg till kalorier">
        <Plus size={16} strokeWidth={1.5} />
      </button>

      <span className={styles.label}>Kalorier</span>

      <div className={styles.valueRow}>
        {isEditing ? (
          <input
            ref={inputRef}
            className={styles.inlineInput}
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                onInputCancel();
                return;
              }
              if (event.key === 'Enter') {
                onInputSubmit();
              }
            }}
            onBlur={onInputBlur}
            aria-label="Kalorier input"
          />
        ) : (
          <>
            <span className={[styles.value, remaining <= 0 ? styles.valueEmpty : ''].join(' ')}>
              <AnimatedNumber value={remaining} duration={800} />
            </span>
            <span className={styles.unit}>KCAL KVAR</span>
          </>
        )}
      </div>

      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.calorieMetaRow}>
        <span className={styles.meta}>Mål: {goal.toLocaleString('sv-SE')}</span>
        <span className={styles.meta}>Ätit: -{eaten.toLocaleString('sv-SE')}</span>
        <span className={styles.meta}>Tränat: +{burned.toLocaleString('sv-SE')}</span>
      </div>

      <div className={styles.footerRow}>
        <span className={[styles.feedback, feedback ? styles.feedbackVisible : ''].join(' ')}>
          {feedback || ''}
        </span>
      </div>
    </section>
  );
}

export default function QuickStats({ profile = {}, eaten, burned, setEaten }) {
  const [steps, setSteps] = useState(() => readInitialSteps());
  const [editMode, setEditMode] = useState({ calories: false, steps: false });
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState({ calories: '', steps: '' });
  const caloriesInputRef = useRef(null);
  const stepsInputRef = useRef(null);
  const skipBlurSaveRef = useRef(false);

  useEffect(() => {
    function syncStats() {
      setSteps(readInitialSteps());
    }

    window.addEventListener('storage', syncStats);
    window.addEventListener('focus', syncStats);
    window.addEventListener('djur-i-juni:today-stats-updated', syncStats);

    return () => {
      window.removeEventListener('storage', syncStats);
      window.removeEventListener('focus', syncStats);
      window.removeEventListener('djur-i-juni:today-stats-updated', syncStats);
    };
  }, []);

  useEffect(() => {
    if (editMode.calories) {
      caloriesInputRef.current?.focus();
      caloriesInputRef.current?.select();
    }

    if (editMode.steps) {
      stepsInputRef.current?.focus();
      stepsInputRef.current?.select();
    }
  }, [editMode]);

  const derivedTargets = calcTargets(profile);
  const kcalGoal = profile.caloriesGoal ?? derivedTargets.kcalGoal;
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

  function closeEditor(key) {
    setEditMode({ calories: false, steps: false });
    setInputValue('');
    if (key === 'calories') {
      caloriesInputRef.current?.blur();
    } else if (key === 'steps') {
      stepsInputRef.current?.blur();
    }
  }

  function handleSaveCalories() {
    if (skipBlurSaveRef.current) {
      skipBlurSaveRef.current = false;
      closeEditor('calories');
      return;
    }

    if (inputValue.trim() === '' || Number.isNaN(Number(inputValue))) {
      closeEditor('calories');
      return;
    }

    const increment = parseInt(inputValue, 10);
    if (!Number.isFinite(increment) || increment <= 0) {
      closeEditor('calories');
      return;
    }

    setEaten((prev) => {
      const nextCalories = prev + increment;
      localStorage.setItem(CALORIES_KEY, String(nextCalories));
      saveTodayStats({ calories: nextCalories, steps });
      return nextCalories;
    });

    triggerFeedback('calories', increment, 'kcal');
    closeEditor('calories');
  }

  function handleSaveSteps() {
    if (skipBlurSaveRef.current) {
      skipBlurSaveRef.current = false;
      closeEditor('steps');
      return;
    }

    if (inputValue.trim() === '' || Number.isNaN(Number(inputValue))) {
      closeEditor('steps');
      return;
    }

    const increment = parseInt(inputValue, 10);
    if (!Number.isFinite(increment) || increment <= 0) {
      closeEditor('steps');
      return;
    }

    setSteps((prev) => {
      const nextSteps = prev + increment;
      localStorage.setItem(STEPS_KEY, String(nextSteps));
      saveTodayStats({ calories: eaten, steps: nextSteps });
      return nextSteps;
    });

    triggerFeedback('steps', increment, 'steg');
    closeEditor('steps');
  }

  return (
    <div className={styles.grid}>
      <CaloriesCard
        goal={kcalGoal}
        eaten={eaten}
        burned={burned}
        isEditing={editMode.calories}
        inputValue={inputValue}
        feedback={feedback.calories}
        inputRef={caloriesInputRef}
        onEditStart={() => {
          setEditMode({ calories: true, steps: false });
          setInputValue('');
        }}
        onInputChange={setInputValue}
        onInputSubmit={handleSaveCalories}
        onInputCancel={() => {
          skipBlurSaveRef.current = true;
          closeEditor('calories');
        }}
        onInputBlur={handleSaveCalories}
      />
      <StepsCard
        cardKey="steps"
        label="Steg"
        unit="STEG"
        value={steps}
        target={stepGoal}
        isEditing={editMode.steps}
        inputValue={inputValue}
        feedback={feedback.steps}
        inputRef={stepsInputRef}
        onEditStart={() => {
          setEditMode({ calories: false, steps: true });
          setInputValue('');
        }}
        onInputChange={setInputValue}
        onInputSubmit={handleSaveSteps}
        onInputCancel={() => {
          skipBlurSaveRef.current = true;
          closeEditor('steps');
        }}
        onInputBlur={handleSaveSteps}
      />
    </div>
  );
}
