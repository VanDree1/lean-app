import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import AnimatedNumber from '../AnimatedNumber/AnimatedNumber';
import { calcTargets } from '../../hooks/useProfile';
import { getGoalTone } from '../../hooks/useGoalTone';
import { useAppStore } from '../../store/useAppStore';
import styles from './QuickStats.module.css';
const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Frukost', ratio: 0.22 },
  { key: 'lunch', label: 'Lunch', ratio: 0.3 },
  { key: 'dinner', label: 'Middag', ratio: 0.32 },
  { key: 'snack', label: 'Snack', ratio: 0.16 },
];
const SIZE_CONFIG = [
  { key: 'light', label: 'Lätt', multiplier: 0.72 },
  { key: 'standard', label: 'Standard', multiplier: 1 },
  { key: 'heavy', label: 'Tung', multiplier: 1.28 },
];
const EXTRA_PROTEIN_KCAL = 120;
const EXTRA_PROTEIN_GRAMS = 25;

const STEP_GOALS = {
  sedentary: 6000,
  light: 8000,
  very_active: 10000,
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyMeals() {
  return {
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
  };
}

function normalizeMealEntry(entry) {
  if (!entry) return null;
  return {
    calories: Number(entry.calories) || 0,
    size: entry.size || 'exact',
    label: entry.label || 'Exakt',
    extraProtein: Boolean(entry.extraProtein),
  };
}

function readMealsForToday(entries, fallbackCalories = 0) {
  const today = todayString();
  const storedMeals = entries[today]?.meals;

  if (storedMeals && typeof storedMeals === 'object') {
    return {
      breakfast: normalizeMealEntry(storedMeals.breakfast),
      lunch: normalizeMealEntry(storedMeals.lunch),
      dinner: normalizeMealEntry(storedMeals.dinner),
      snack: normalizeMealEntry(storedMeals.snack),
    };
  }

  if (fallbackCalories > 0) {
    return {
      ...createEmptyMeals(),
      snack: {
        calories: fallbackCalories,
        size: 'exact',
        label: 'Exakt',
        extraProtein: false,
      },
    };
  }

  return createEmptyMeals();
}

function sumMealProtein(meals) {
  return Object.values(meals).reduce((sum, meal) => {
    if (!meal?.extraProtein) return sum;
    return sum + EXTRA_PROTEIN_GRAMS;
  }, 0);
}

function roundMealCalories(value) {
  return Math.max(100, Math.round(value / 25) * 25);
}

function getMealSizeCalories(goal, slotKey, sizeKey, extraProtein = false) {
  const slot = MEAL_SLOTS.find((item) => item.key === slotKey) || MEAL_SLOTS[0];
  const size = SIZE_CONFIG.find((item) => item.key === sizeKey) || SIZE_CONFIG[1];
  const base = roundMealCalories(goal * slot.ratio);
  return base + Math.round(base * (size.multiplier - 1)) + (extraProtein ? EXTRA_PROTEIN_KCAL : 0);
}


function MetricCard({
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
  locked,
  priority = false,
}) {
  const progress = Math.max(0, Math.min(100, target > 0 ? (value / target) * 100 : 0));

  return (
    <section className={[styles.card, feedback ? styles.cardSaved : '', locked ? styles.cardLocked : '', priority ? styles.cardPriority : ''].join(' ')} aria-label={label}>
      <button type="button" className={styles.addButton} onClick={onEditStart} aria-label={`Lägg till ${label.toLowerCase()}`} disabled={locked}>
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

function MealPickerModal({
  slot,
  goal,
  onClose,
  onSave,
}) {
  const [extraProtein, setExtraProtein] = useState(false);
  const [showExactInput, setShowExactInput] = useState(false);
  const [exactValue, setExactValue] = useState('');
  const exactInputRef = useRef(null);

  useEffect(() => {
    if (!showExactInput) return;
    const timer = window.setTimeout(() => {
      exactInputRef.current?.focus();
      exactInputRef.current?.select();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [showExactInput]);

  function handleExactSave() {
    const parsed = parseInt(exactValue, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onSave({
      calories: parsed,
      size: 'exact',
      label: 'Exakt',
      extraProtein,
    });
  }

  return (
    <div className={styles.mealModalOverlay} onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className={styles.mealModal} role="dialog" aria-modal="true" aria-label={`Logga ${slot.label.toLowerCase()}`}>
        <div className={styles.mealModalHeader}>
          <div>
            <p className={styles.label}>{slot.label}</p>
            <h3 className={styles.mealModalTitle}>Välj mängd</h3>
          </div>
          <button type="button" className={styles.mealClose} onClick={onClose} aria-label="Stäng måltidslogg">
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div className={styles.mealSizeGrid}>
          {SIZE_CONFIG.map((size) => {
            const calories = getMealSizeCalories(goal, slot.key, size.key, extraProtein);
            return (
              <button
                key={size.key}
                type="button"
                className={styles.mealSizeButton}
                onClick={() => onSave({
                  calories,
                  size: size.key,
                  label: size.label,
                  extraProtein,
                })}
              >
                <span className={styles.mealSizeTitle}>{size.label}</span>
                <span className={styles.mealSizeValue}>~{calories} kcal</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={[styles.proteinToggle, extraProtein ? styles.proteinToggleActive : ''].join(' ')}
          onClick={() => setExtraProtein((value) => !value)}
          aria-pressed={extraProtein}
        >
          Extra protein
        </button>

        {!showExactInput ? (
          <button type="button" className={styles.exactToggle} onClick={() => setShowExactInput(true)}>
            Exakt värde
          </button>
        ) : (
          <div className={styles.exactInputWrap}>
            <input
              ref={exactInputRef}
              className={styles.exactInput}
              type="number"
              inputMode="numeric"
              value={exactValue}
              onChange={(event) => setExactValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleExactSave();
                }
              }}
              placeholder="t.ex. 540"
            />
            <button type="button" className={styles.exactSave} onClick={handleExactSave}>
              Spara
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CaloriesCard({
  goal,
  eaten,
  burned,
  feedback,
  meals,
  onMealOpen,
  locked,
}) {
  const remaining = goal - eaten + burned;
  const netEaten = eaten - burned;
  const progress = Math.max(0, Math.min(100, goal > 0 ? (netEaten / goal) * 100 : 0));

  return (
    <section className={[styles.card, feedback ? styles.cardSaved : '', locked ? styles.cardLocked : ''].join(' ')} aria-label="Kalorier">
      <span className={styles.label}>Kalorier idag</span>

      <div className={styles.valueRow}>
        <>
          <span className={[styles.value, remaining <= 0 ? styles.valueEmpty : ''].join(' ')}>
            <AnimatedNumber value={remaining} duration={800} />
          </span>
          <span className={styles.unit}>kvar</span>
        </>
      </div>

      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.calorieMetaRow}>
        <span className={styles.meta}>Mål {goal.toLocaleString('sv-SE')}</span>
        <span className={styles.meta}>Ätit -{eaten.toLocaleString('sv-SE')}</span>
        <span className={styles.meta}>Tränat +{burned.toLocaleString('sv-SE')}</span>
      </div>

      <div className={styles.mealSlots}>
        {MEAL_SLOTS.map((slot) => {
          const meal = meals[slot.key];
          return (
            <button
              key={slot.key}
              type="button"
              className={styles.mealSlot}
              onClick={() => onMealOpen(slot)}
              disabled={locked}
            >
              <span className={styles.mealSlotLabel}>{slot.label}</span>
              <span className={styles.mealSlotValue}>
                {meal ? `${meal.label} · ${meal.calories} kcal` : 'Lägg till'}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.footerRow}>
        <span className={[styles.feedback, feedback ? styles.feedbackVisible : ''].join(' ')}>
          {feedback || ''}
        </span>
      </div>
    </section>
  );
}

export default function QuickStats({ profile = {}, locked = false }) {
  const { state, setDailyValues, logMeal } = useAppStore();
  const eaten = state.daily.calories;
  const burned = state.daily.burned;
  const steps = state.daily.steps;
  const protein = state.daily.protein;
  const meals = readMealsForToday(state.daily.dailyEntries, state.daily.calories);
  const [activeMealSlot, setActiveMealSlot] = useState(null);
  const [editMode, setEditMode] = useState({ steps: false });
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState({ calories: '', steps: '' });
  const stepsInputRef = useRef(null);
  const skipBlurSaveRef = useRef(false);

  useEffect(() => {
    if (editMode.steps) {
      stepsInputRef.current?.focus();
      stepsInputRef.current?.select();
    }
  }, [editMode]);

  const derivedTargets = calcTargets(profile);
  const tone = getGoalTone(profile);
  const kcalGoal = profile.caloriesGoal ?? derivedTargets.kcalGoal;
  const stepGoal = STEP_GOALS[profile.activity] || STEP_GOALS.light;
  const isProteinPriority = tone.stats.priority === 'protein';
  const mealProteinBonus = sumMealProtein(meals);
  const totalProtein = protein + mealProteinBonus;
  const secondaryValue = isProteinPriority ? totalProtein : steps;
  const secondaryTarget = isProteinPriority ? tone.proteinGoal : stepGoal;
  const secondaryLabel = tone.stats.secondaryLabel;
  const secondaryUnit = tone.stats.secondaryUnit;

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
    setEditMode({ steps: false });
    setInputValue('');
    if (key === 'steps') {
      stepsInputRef.current?.blur();
    }
  }

  function handleMealSave(slotKey, mealData) {
    logMeal(slotKey, mealData);
    setActiveMealSlot(null);
    triggerFeedback('calories', mealData.calories, 'kcal');

    if (mealData.extraProtein && isProteinPriority) {
      triggerFeedback('steps', EXTRA_PROTEIN_GRAMS, 'g');
    }
  }

  function handleSaveSteps() {
    if (locked) {
      closeEditor('steps');
      return;
    }
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

    setDailyValues({ steps: steps + increment });

    triggerFeedback('steps', increment, 'steg');
    closeEditor('steps');
  }

  function handleSaveProtein() {
    if (locked) {
      closeEditor('steps');
      return;
    }
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

    setDailyValues({ protein: protein + increment });

    triggerFeedback('steps', increment, 'g');
    closeEditor('steps');
  }

  return (
    <div className={styles.grid}>
      <CaloriesCard
        goal={kcalGoal}
        eaten={eaten}
        burned={burned}
        feedback={feedback.calories}
        meals={meals}
        onMealOpen={(slot) => {
          if (locked) return;
          setActiveMealSlot(slot);
        }}
        locked={locked}
      />
      <MetricCard
        cardKey="steps"
        label={secondaryLabel}
        unit={secondaryUnit}
        value={secondaryValue}
        target={secondaryTarget}
        isEditing={editMode.steps}
        inputValue={inputValue}
        feedback={feedback.steps}
        inputRef={stepsInputRef}
        onEditStart={() => {
          if (locked) return;
          setEditMode({ steps: true });
          setInputValue('');
        }}
        onInputChange={setInputValue}
        onInputSubmit={isProteinPriority ? handleSaveProtein : handleSaveSteps}
        onInputCancel={() => {
          skipBlurSaveRef.current = true;
          closeEditor('steps');
        }}
        onInputBlur={isProteinPriority ? handleSaveProtein : handleSaveSteps}
        locked={locked}
        priority={isProteinPriority}
      />
      {activeMealSlot ? (
        <MealPickerModal
          slot={activeMealSlot}
          goal={kcalGoal}
          onClose={() => setActiveMealSlot(null)}
        onSave={(mealData) => handleMealSave(activeMealSlot.key, mealData)}
      />
    ) : null}
  </div>
  );
}
