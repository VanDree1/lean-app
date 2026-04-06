import { useEffect, useRef, useState } from 'react';
import { Activity, Bike, Check, Dumbbell, Flower2, Footprints } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber/AnimatedNumber';
import { useWeightLog } from '../components/Weight/useWeightLog';
import { useGoalTone } from '../hooks/useGoalTone';
import { useAppStore } from '../store/useAppStore';
import Journal from './Journal';
import styles from './Home.module.css';
const WORKOUTS = {
  gym: { name: 'Gym', met: 6.0, Icon: Dumbbell },
  run: { name: 'Löpning', met: 9.8, Icon: Footprints },
  yoga: { name: 'Yoga', met: 3.0, Icon: Flower2 },
  cycle: { name: 'Cykling', met: 7.5, Icon: Bike },
  other: { name: 'Annat', met: 5.0, Icon: Activity },
};
const SLEEP_PRESETS = [6, 7, 8, 9];
const STEP_PRESETS = [4000, 8000, 10000, 12000];

function isSameDayAsToday(value) {
  if (!value) return false;

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayText = new Date().toDateString();

  if (value === todayIso || value === todayText) return true;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  return parsed.toISOString().slice(0, 10) === todayIso;
}

function formatSavedTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function preventWheelValueChange(event) {
  event.currentTarget.blur();
}

function formatStepPreset(value) {
  if (value >= 1000) {
    const rounded = value / 1000;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}k`;
  }

  return String(value);
}

function todayIsoString() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekStart(date = new Date()) {
  const value = new Date(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  value.setHours(0, 0, 0, 0);
  return value;
}

function formatDayIso(date) {
  return date.toISOString().slice(0, 10);
}

function buildWeekRhythm(dailyEntries) {
  const labels = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
  const start = getWeekStart();

  return labels.map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = formatDayIso(date);

    return {
      label,
      date: iso,
      complete: Boolean(dailyEntries?.[iso]?.locked),
      isToday: iso === todayIsoString(),
    };
  });
}

function getWeeklyGoalProgress(dailyEntries, target = 5) {
  const completed = buildWeekRhythm(dailyEntries).filter((day) => day.complete).length;
  return {
    completed,
    target,
    progress: Math.max(0, Math.min(100, (completed / target) * 100)),
  };
}

function buildWeightMap(weightLog) {
  return Object.fromEntries((weightLog || []).map((entry) => [entry.date, Number(entry.weight) || null]));
}

function getSevenDayAverages(dailyEntries, weightLog) {
  const weightMap = buildWeightMap(weightLog);
  const loggedDays = Object.entries(dailyEntries || {})
    .filter(([, entry]) => entry?.locked)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)
    .map(([date, entry]) => ({
      calories: Number(entry.calories) || 0,
      weight: Number(entry.weight ?? weightMap[date]) || null,
    }));

  if (loggedDays.length === 0) {
    return { days: 0, avgCalories: 0, avgWeight: 0 };
  }

  const calorieSum = loggedDays.reduce((sum, day) => sum + day.calories, 0);
  const weightedDays = loggedDays.filter((day) => Number.isFinite(day.weight) && day.weight > 0);
  const weightSum = weightedDays.reduce((sum, day) => sum + day.weight, 0);

  return {
    days: loggedDays.length,
    avgCalories: Math.round(calorieSum / loggedDays.length),
    avgWeight: weightedDays.length ? weightSum / weightedDays.length : 0,
  };
}

function DailyFocusCard({ latestWeight, eaten, setEaten, burned, setBurned, locked, tone, sleepHoursToday, setSleepHoursToday, lowEnergyMode, onOpenJournal }) {
  const { state, completeDailyCheckin, unlockDailyCheckin } = useAppStore();
  const { addEntry } = useWeightLog();
  const weight = Number(latestWeight) || 100;
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSavedState, setShowSavedState] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [isEditingToday, setIsEditingToday] = useState(false);
  const [caloriesInput, setCaloriesInput] = useState('');
  const [sleepHours, setSleepHours] = useState(String(sleepHoursToday || 8));
  const [stepsInput, setStepsInput] = useState(String(state.daily.steps || 0));
  const [weightInput, setWeightInput] = useState(String(weight));
  const [activeWorkoutKey, setActiveWorkoutKey] = useState(null);
  const [duration, setDuration] = useState(30);
  const [comment, setComment] = useState('');
  const [savedAt, setSavedAt] = useState(() => formatSavedTime(state.daily.savedAt));
  const caloriesInputRef = useRef(null);
  const sleepInputRef = useRef(null);
  const workoutSectionRef = useRef(null);
  const todayString = new Date().toDateString();
  const todayCheckin = (() => {
    try {
      const stored = state.daily.dailyCheckin;
      if (isSameDayAsToday(stored?.date)) return stored;
      return null;
    } catch {
      return null;
    }
  })();
  const isLoggedToday = locked && Boolean(todayCheckin);
  const activeWorkout = activeWorkoutKey ? WORKOUTS[activeWorkoutKey] : null;
  const workoutEntries = Object.entries(WORKOUTS).sort(([a], [b]) => {
    if (!lowEnergyMode) return 0;

    const rank = (key) => {
      if (key === 'yoga') return 0;
      if (key === 'run') return 1;
      if (key === 'cycle') return 2;
      if (key === 'other') return 3;
      if (key === 'gym') return 4;
      return 5;
    };

    return rank(a) - rank(b);
  });
  const estimatedCalories = activeWorkout
    ? Math.round(activeWorkout.met * weight * (duration / 60))
    : 0;
  const parsedCalories = parseInt(caloriesInput, 10);
  const parsedSleep = Number(sleepHours);
  const parsedSteps = parseInt(stepsInput, 10);
  const parsedWeight = Number(weightInput);
  const todayWeight = state.weightLog.find((entry) => entry.date === todayIsoString())?.weight ?? null;
  const weeklyGoal = getWeeklyGoalProgress(state.daily.dailyEntries);
  const canSave =
    Number.isFinite(parsedCalories) &&
    parsedCalories >= 0 &&
    Number.isFinite(parsedSleep) &&
    parsedSleep > 0 &&
    parsedSleep <= 24 &&
    Number.isFinite(parsedSteps) &&
    parsedSteps >= 0 &&
    Number.isFinite(parsedWeight) &&
    parsedWeight > 0;
  const summaryItems = isLoggedToday
    ? [
        `${Number(todayWeight ?? latestWeight ?? 0).toFixed(1)} kg`,
        `${todayCheckin?.calories ?? eaten} kcal`,
        `${todayCheckin?.steps ?? state.daily.steps ?? 0} steg`,
        todayCheckin?.workoutName
          ? `${todayCheckin.workoutName}${todayCheckin?.duration ? ` ${todayCheckin.duration} min` : ''}`
          : 'Ingen träning',
        `${todayCheckin?.sleepHours ?? 0} h sömn`,
      ]
    : [];

  useEffect(() => {
    if (!showActionPicker) return;
    const timer = window.setTimeout(() => {
      caloriesInputRef.current?.focus();
      caloriesInputRef.current?.select();
    }, 40);

    return () => window.clearTimeout(timer);
  }, [showActionPicker]);

  function handleCheckIn() {
    setIsEditingToday(false);
    setCaloriesInput(String(todayCheckin?.calories ?? eaten ?? 0));
    setSleepHours(String(todayCheckin?.sleepHours ?? sleepHoursToday ?? 8));
    setStepsInput(String(todayCheckin?.steps ?? state.daily.steps ?? 0));
    setWeightInput(String(todayWeight ?? latestWeight ?? 100));
    setActiveWorkoutKey(todayCheckin?.workoutKey ?? null);
    setDuration(Number(todayCheckin?.duration) || 30);
    setComment(todayCheckin?.comment ?? '');
    setShowActionPicker(true);
  }

  function completeCheckIn() {
    if (!Number.isFinite(parsedCalories) || parsedCalories < 0) return;
    if (!Number.isFinite(parsedSleep) || parsedSleep <= 0 || parsedSleep > 24) return;
    if (!Number.isFinite(parsedSteps) || parsedSteps < 0) return;
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) return;

    const alreadyLogged = locked || Boolean(todayCheckin);
    const currentStreak = state.daily.streak || 0;
    const nextStreak = alreadyLogged ? currentStreak : currentStreak + 1;
    const workoutBurn = activeWorkout ? estimatedCalories : 0;
    const previousBurn = Number(todayCheckin?.burned) || 0;
    const nextBurnedTotal = Math.max(0, burned - previousBurn + workoutBurn);
    const nextCheckin = {
      date: todayString,
      calories: parsedCalories,
      workoutKey: activeWorkoutKey,
      workoutName: activeWorkout?.name ?? '',
      duration,
      burned: workoutBurn,
      steps: parsedSteps,
      sleepHours: parsedSleep,
      comment: comment.trim(),
    };

    setIsCompleting(true);
    addEntry(todayIsoString(), parsedWeight);
    setEaten(parsedCalories);
    setBurned(nextBurnedTotal);
    setSleepHoursToday(parsedSleep);
    const savedAtIso = new Date().toISOString();
    completeDailyCheckin({
      calories: parsedCalories,
      burned: nextBurnedTotal,
      steps: parsedSteps,
      sleepHours: parsedSleep,
      checkin: nextCheckin,
      lastLoggedDate: todayString,
      streak: nextStreak,
      savedAt: savedAtIso,
    });
    setSavedAt(formatSavedTime(savedAtIso));
    setShowSavedState(true);

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([18, 24, 28]);
    }

    window.setTimeout(() => {
      setShowSavedState(false);
      setShowActionPicker(false);
      setIsCompleting(false);
    }, 800);
  }

  function handleFormKeyDown(event, field) {
    if (event.key !== 'Enter') return;
    if (event.shiftKey) return;
    event.preventDefault();

    if (field === 'calories') {
      sleepInputRef.current?.focus();
      sleepInputRef.current?.select?.();
      return;
    }

    if (field === 'sleep') {
      const next = document.getElementById('daily-steps-input');
      if (next) {
        next.focus();
        next.select?.();
        return;
      }

      if (!activeWorkoutKey) {
        if (canSave) completeCheckIn();
        return;
      }

      workoutSectionRef.current?.focus();
      return;
    }

    if (field === 'steps') {
      const next = document.getElementById('daily-weight-input');
      if (next) {
        next.focus();
        next.select?.();
        return;
      }

      if (!activeWorkoutKey) {
        if (canSave) completeCheckIn();
        return;
      }

      workoutSectionRef.current?.focus();
      return;
    }

    if (field === 'weight') {
      if (!activeWorkoutKey) {
        if (canSave) completeCheckIn();
        return;
      }

      workoutSectionRef.current?.focus();
      return;
    }

    if (!canSave) return;
    completeCheckIn();
  }

  function handleUnlock(event) {
    event.stopPropagation();
    setIsEditingToday(true);
    unlockDailyCheckin();
    setCaloriesInput(String(todayCheckin?.calories ?? eaten ?? 0));
    setSleepHours(String(todayCheckin?.sleepHours ?? sleepHoursToday ?? 8));
    setStepsInput(String(todayCheckin?.steps ?? state.daily.steps ?? 0));
    setWeightInput(String(todayWeight ?? latestWeight ?? 100));
    setActiveWorkoutKey(todayCheckin?.workoutKey ?? null);
    setDuration(Number(todayCheckin?.duration) || 30);
    setComment(todayCheckin?.comment ?? '');
    setShowActionPicker(true);
  }

  return (
    <>
      {isLoggedToday ? (
        <section
          className={[
            styles.focusCard,
            styles.focusCheckin,
            isCompleting ? styles.focusCardCompleting : '',
            styles.focusCardLogged,
          ].join(' ')}
          aria-labelledby="today-title"
          role="group"
        >
          <div className={styles.focusContent}>
            <div className={styles.focusMain}>
              <p className={styles.sectionEyebrow}>Dagens insats</p>
              <h2 id="today-title" className={styles.focusTitle}>Dag säkrad</h2>
              <div className={styles.focusSummaryRow}>
                {summaryItems.map((item) => (
                  <span key={item} className={styles.focusSummaryPill}>
                    {item}
                  </span>
                ))}
              </div>
              <div className={styles.focusMetaActions}>
                <button type="button" className={styles.focusEditLink} onClick={handleUnlock}>
                  Lås upp
                </button>
                <button type="button" className={styles.focusJournalLink} onClick={onOpenJournal}>
                  Journal
                </button>
              </div>
              <div className={styles.weekGoal}>
                <div className={styles.weekGoalHeader}>
                  <span className={styles.weekGoalLabel}>Veckomål</span>
                  <span className={styles.weekGoalValue}>{weeklyGoal.completed} / {weeklyGoal.target} dagar</span>
                </div>
                <div className={styles.weekGoalTrack} aria-hidden="true">
                  <div
                    className={[styles.weekGoalFill, showSavedState ? styles.weekGoalFillActive : ''].join(' ')}
                    style={{ width: `${weeklyGoal.progress}%` }}
                  />
                </div>
              </div>
              {savedAt ? <p className={styles.focusSavedMeta}>Sparad {savedAt}</p> : null}
            </div>
          </div>

          <div className={styles.focusStatus} aria-hidden="true">
            <span className={styles.focusCheckWrap}>
              <Check size={18} strokeWidth={1.8} className={styles.focusCheckIcon} />
            </span>
          </div>
        </section>
      ) : (
        <button
          type="button"
          className={[
            styles.focusCard,
            styles.focusCheckin,
            isCompleting ? styles.focusCardCompleting : '',
            styles.focusCardTodo,
          ].join(' ')}
          aria-labelledby="today-title"
          onClick={handleCheckIn}
        >
          <div className={styles.focusContent}>
            <div className={styles.focusMain}>
              <p className={styles.sectionEyebrow}>Dagens insats</p>
              <h2 id="today-title" className={styles.focusTitle}>Öppna</h2>
              <div className={styles.weekGoal}>
                <div className={styles.weekGoalHeader}>
                  <span className={styles.weekGoalLabel}>Veckomål</span>
                  <span className={styles.weekGoalValue}>{weeklyGoal.completed} / {weeklyGoal.target} dagar</span>
                </div>
                <div className={styles.weekGoalTrack} aria-hidden="true">
                  <div className={styles.weekGoalFill} style={{ width: `${weeklyGoal.progress}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.focusStatus} aria-hidden="true">
            <span className={styles.focusPulseDot} />
          </div>
        </button>
      )}
      {showActionPicker && (
        <section className={styles.focusInlineSheet} role="dialog" aria-label="Fyll i dagens insats">
          <div className={styles.focusSheetHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Dagens insats</p>
              <h3 className={styles.focusSheetTitle}>
                {isEditingToday ? 'Justera dagen' : 'Fyll i dagen'}
              </h3>
              {isEditingToday ? (
                <p className={styles.focusSheetSubtitle}>Dagens värden är redan ifyllda.</p>
              ) : null}
            </div>
            <button
              type="button"
              className={styles.focusSheetClose}
              onClick={() => {
                setShowActionPicker(false);
                setIsEditingToday(false);
              }}
              aria-label="Stäng dagens insats"
            >
              ✕
            </button>
          </div>
          <div className={styles.focusForm}>
            <div className={styles.focusTopFields}>
            <label className={styles.focusField}>
              <span className={styles.focusFieldLabel}>{tone.daily.primaryFieldLabel}</span>
              <input
                ref={caloriesInputRef}
                type="number"
                inputMode="numeric"
                className={styles.focusInput}
                value={caloriesInput}
                onChange={(event) => setCaloriesInput(event.target.value)}
                onKeyDown={(event) => handleFormKeyDown(event, 'calories')}
                onWheel={preventWheelValueChange}
                placeholder="Till exempel 1850"
                min="0"
              />
            </label>

            <label className={styles.focusField}>
              <span className={styles.focusFieldLabel}>{tone.daily.secondaryFieldLabel}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                max="24"
                ref={sleepInputRef}
                className={styles.focusInput}
                value={sleepHours}
                onChange={(event) => setSleepHours(event.target.value)}
                onKeyDown={(event) => handleFormKeyDown(event, 'sleep')}
                onWheel={preventWheelValueChange}
                placeholder="Till exempel 8"
              />
              <div className={styles.focusPresetRow}>
                {SLEEP_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={[
                      styles.focusPreset,
                      Number(sleepHours) === preset ? styles.focusPresetActive : '',
                    ].join(' ')}
                    onClick={() => setSleepHours(String(preset))}
                    aria-pressed={Number(sleepHours) === preset}
                  >
                    {preset} h
                  </button>
                ))}
              </div>
            </label>

            <label className={styles.focusField}>
              <span className={styles.focusFieldLabel}>Steg</span>
              <input
                id="daily-steps-input"
                type="number"
                inputMode="numeric"
                className={styles.focusInput}
                value={stepsInput}
                onChange={(event) => setStepsInput(event.target.value)}
                onKeyDown={(event) => handleFormKeyDown(event, 'steps')}
                onWheel={preventWheelValueChange}
                placeholder="Till exempel 7800"
                min="0"
              />
              <div className={styles.focusPresetRow}>
                {STEP_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={[
                      styles.focusPreset,
                      parseInt(stepsInput, 10) === preset ? styles.focusPresetActive : '',
                    ].join(' ')}
                    onClick={() => setStepsInput(String(preset))}
                    aria-pressed={parseInt(stepsInput, 10) === preset}
                  >
                    {formatStepPreset(preset)}
                  </button>
                ))}
              </div>
            </label>

            <label className={styles.focusField}>
              <span className={styles.focusFieldLabel}>Vikt</span>
              <input
                id="daily-weight-input"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                className={styles.focusInput}
                value={weightInput}
                onChange={(event) => setWeightInput(event.target.value)}
                onKeyDown={(event) => handleFormKeyDown(event, 'weight')}
                onWheel={preventWheelValueChange}
                placeholder="Till exempel 82.4"
              />
            </label>
            </div>

            <label className={styles.focusField}>
              <span className={styles.focusFieldLabel}>Kommentar</span>
              <input
                type="text"
                className={styles.focusInput}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Valfritt"
                maxLength={90}
              />
            </label>

            <div
              ref={workoutSectionRef}
              tabIndex={activeWorkout ? 0 : -1}
              className={[styles.focusField, !activeWorkout ? styles.focusFieldMuted : ''].join(' ')}
              onKeyDown={(event) => handleFormKeyDown(event, 'workout')}
            >
              <div className={styles.focusFieldHeader}>
                <span className={styles.focusFieldLabel}>{tone.daily.workoutLabel}</span>
                {activeWorkout ? <span className={styles.focusFieldHint}>+{estimatedCalories} kcal</span> : null}
              </div>
              {!activeWorkout ? (
                <p className={styles.focusFieldCopy}>
                  {lowEnergyMode ? tone.recovery.dailyBody : tone.daily.workoutHint}
                </p>
              ) : null}
              <div className={styles.workoutGrid}>
                {workoutEntries.map(([key, workout]) => {
                  const active = activeWorkoutKey === key;
                  const isRecoveryPick = key === 'yoga' || key === 'run';
                  const isDimmedInRecovery = lowEnergyMode && key === 'gym';
                  const workoutLabel = lowEnergyMode && key === 'run' ? 'Promenad' : workout.name;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={[
                        styles.workoutOption,
                        active ? styles.workoutOptionActive : '',
                        lowEnergyMode && isRecoveryPick ? styles.workoutOptionRecovery : '',
                        isDimmedInRecovery ? styles.workoutOptionDim : '',
                      ].join(' ')}
                      onClick={() => setActiveWorkoutKey(active ? null : key)}
                      aria-pressed={active}
                      aria-label={workoutLabel}
                    >
                      <workout.Icon size={24} strokeWidth={1.5} />
                      <span className={styles.workoutLabel}>{workoutLabel}</span>
                    </button>
                  );
                })}
              </div>
              {activeWorkout && (
                <div className={styles.workoutDetail}>
                  <div className={styles.workoutDetailHeader}>
                    <span className={styles.workoutDetailName}>{activeWorkout.name}</span>
                    <span className={styles.workoutDuration}>{duration} min</span>
                  </div>
                  <input
                    className={styles.workoutSlider}
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={duration}
                    onChange={(event) => setDuration(Number(event.target.value))}
                    onKeyDown={handleFormKeyDown}
                    aria-label="Träningslängd i minuter"
                  />
                  <div className={styles.workoutScale}>
                    <span>10 min</span>
                    <span>120 min</span>
                  </div>
                  <p className={styles.workoutEstimate}>+{estimatedCalories} kcal</p>
                </div>
              )}
            </div>
          </div>
          <div className={styles.focusSheetActions}>
            {showSavedState ? (
              <div className={styles.focusSavedState} aria-live="polite">
                <span className={styles.focusSavedCheck}>
                  <Check size={16} strokeWidth={1.9} />
                </span>
                <span className={styles.focusSavedText}>Dag säkrad</span>
              </div>
            ) : null}
              <button
                type="button"
                className={styles.focusSheetSecondary}
                onClick={() => {
                  setShowActionPicker(false);
                  setIsEditingToday(false);
                }}
                disabled={showSavedState}
              >
                Avbryt
              </button>
            <button
              type="button"
              className={styles.focusSheetPrimary}
              onClick={completeCheckIn}
              disabled={!canSave || showSavedState}
            >
              {showSavedState ? 'Sparat' : isEditingToday ? 'Uppdatera dagen' : 'Spara dagens insats'}
            </button>
          </div>
        </section>
      )}
    </>
  );
}

function WeekRhythmCard({ dailyEntries }) {
  const days = buildWeekRhythm(dailyEntries);

  return (
    <section className={styles.trendCard} aria-label="Veckans rytm">
      <p className={styles.sectionEyebrow}>Veckans rytm</p>
      <div className={styles.rhythmRow}>
        {days.map((day) => (
          <div key={day.date} className={styles.rhythmDay}>
            <span className={styles.rhythmLabel}>{day.label}</span>
            <span
              className={[
                styles.rhythmDot,
                day.complete ? styles.rhythmDotComplete : '',
                day.isToday ? styles.rhythmDotToday : '',
              ].join(' ')}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function SevenDayAverageCard({ dailyEntries, weightLog }) {
  const averages = getSevenDayAverages(dailyEntries, weightLog);
  const daysLeft = Math.max(0, 7 - averages.days);
  const unlockProgress = Math.max(0, Math.min(100, (averages.days / 7) * 100));

  if (averages.days < 7) {
    return (
      <section className={styles.trendCard} aria-label="7-dagars snitt låst">
        <p className={styles.sectionEyebrow}>7-dagars snitt</p>
        <div className={styles.unlockState}>
          <p className={styles.unlockTitle}>
            Logga {daysLeft} dagar till för att låsa upp din trend
          </p>
          <div className={styles.unlockTrack} aria-hidden="true">
            <div className={styles.unlockFill} style={{ width: `${unlockProgress}%` }} />
          </div>
          <p className={styles.trendMeta}>{averages.days} av 7 dagar</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.trendCard} aria-label="7-dagars snitt">
      <p className={styles.sectionEyebrow}>7-dagars snitt</p>
      <div className={styles.averageGrid}>
        <div className={styles.averageStat}>
          <span className={styles.averageValue}>
            <AnimatedNumber value={averages.avgWeight} duration={700} decimals={1} />
          </span>
          <span className={styles.averageUnit}>kg</span>
        </div>
        <div className={styles.averageStat}>
          <span className={styles.averageValue}>
            <AnimatedNumber value={averages.avgCalories} duration={700} />
          </span>
          <span className={styles.averageUnit}>kcal</span>
        </div>
      </div>
      <p className={styles.trendMeta}>{averages.days} stängda dagar</p>
    </section>
  );
}

export default function Home({ profile }) {
  const { state, setDailyValues } = useAppStore();
  const { current: latestWeight } = useWeightLog();
  const tone = useGoalTone(profile);
  const [modal, setModal] = useState(null);
  const eaten = state.daily.calories;
  const burned = state.daily.burned;
  const isDayLocked = isSameDayAsToday(state.daily.lastLoggedDate) && isSameDayAsToday(state.daily.dailyCheckin?.date);
  const sleepHoursToday = state.daily.sleepHours;
  const lowEnergyMode = sleepHoursToday < 6;
  const setEaten = (value) => setDailyValues({ calories: value });
  const setBurned = (value) => setDailyValues({ burned: value });
  const setSleepHoursToday = (value) => setDailyValues({ sleepHours: value });

  return (
    <main className={styles.main}>
      <div className={styles.stack}>
        <DailyFocusCard
          latestWeight={latestWeight}
          eaten={eaten}
          setEaten={setEaten}
          burned={burned}
          setBurned={setBurned}
          locked={isDayLocked}
          tone={tone}
          sleepHoursToday={sleepHoursToday}
          setSleepHoursToday={setSleepHoursToday}
          lowEnergyMode={lowEnergyMode}
          onOpenJournal={() => setModal('journal')}
        />
        <div className={styles.overviewGrid}>
          <WeekRhythmCard
            dailyEntries={state.daily.dailyEntries}
          />
          <SevenDayAverageCard
            dailyEntries={state.daily.dailyEntries}
            weightLog={state.weightLog}
          />
        </div>
      </div>
      {modal === 'journal' && <Journal onClose={() => setModal(null)} />}
    </main>
  );
}
