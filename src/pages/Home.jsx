import { useEffect, useRef, useState } from 'react';
import { Activity, Bike, Check, Dumbbell, Flower2, Footprints } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber/AnimatedNumber';
import HeroCard from '../components/HeroCard/HeroCard';
import QuickStats from '../components/QuickStats/QuickStats';
import WeightModal from '../components/Weight/WeightModal';
import { useWeightLog } from '../components/Weight/useWeightLog';
import styles from './Home.module.css';

const LAST_LOGGED_DATE_KEY = 'djur_juni_last_logged';
const STREAK_KEY = 'djur_juni_streak';
const DAILY_CHECKIN_KEY = 'djur_juni_daily_checkin';
const CALORIES_KEY = 'djur_juni_cal';
const BURNED_KEY = 'djur_juni_burned';
const TODAY_STATS_KEYS = [
  'djur-i-juni:today-stats',
  'djur-i-juni:daily-summary',
];
const WEIGHT_TREND = [103.2, 102.5, 102.1, 101.8, 101.0, 100.5, 100.0];
const WORKOUTS = {
  gym: { name: 'Gym', met: 6.0, Icon: Dumbbell },
  run: { name: 'Löpning', met: 9.8, Icon: Footprints },
  yoga: { name: 'Yoga', met: 3.0, Icon: Flower2 },
  cycle: { name: 'Cykling', met: 7.5, Icon: Bike },
  other: { name: 'Annat', met: 5.0, Icon: Activity },
};

function isSameDayAsToday(value) {
  if (!value) return false;

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayText = new Date().toDateString();

  if (value === todayIso || value === todayText) return true;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  return parsed.toISOString().slice(0, 10) === todayIso;
}

function readIsDayLocked() {
  try {
    const stored = JSON.parse(localStorage.getItem(DAILY_CHECKIN_KEY) || 'null');
    const lockedDate = localStorage.getItem(LAST_LOGGED_DATE_KEY);
    return isSameDayAsToday(lockedDate) && isSameDayAsToday(stored?.date);
  } catch {
    return false;
  }
}

function readTodaySteps() {
  try {
    for (const key of TODAY_STATS_KEYS) {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      if (parsed?.date === new Date().toISOString().slice(0, 10)) {
        return Number(parsed.steps) || 0;
      }
    }
  } catch {
    return 0;
  }

  return 0;
}

function saveTodayCalories(calories) {
  localStorage.setItem(CALORIES_KEY, String(calories));
  const payload = {
    date: new Date().toISOString().slice(0, 10),
    calories,
    steps: readTodaySteps(),
  };
  for (const key of TODAY_STATS_KEYS) {
    localStorage.setItem(key, JSON.stringify(payload));
  }
  window.dispatchEvent(new Event('djur-i-juni:today-stats-updated'));
}

function saveBurnedCalories(burned) {
  localStorage.setItem(BURNED_KEY, String(burned));
  window.dispatchEvent(new Event('djur-i-juni:today-stats-updated'));
}

function DailyFocusCard({ latestWeight, eaten, setEaten, burned, setBurned, locked, setLocked }) {
  const weight = Number(latestWeight) || 100;
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSavedState, setShowSavedState] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [caloriesInput, setCaloriesInput] = useState('');
  const [sleepHours, setSleepHours] = useState('8');
  const [activeWorkoutKey, setActiveWorkoutKey] = useState(null);
  const [duration, setDuration] = useState(30);
  const caloriesInputRef = useRef(null);
  const sleepInputRef = useRef(null);
  const workoutSectionRef = useRef(null);
  const todayString = new Date().toDateString();
  const todayCheckin = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem(DAILY_CHECKIN_KEY) || 'null');
      if (isSameDayAsToday(stored?.date)) return stored;
      return null;
    } catch {
      return null;
    }
  })();
  const isLoggedToday = locked && Boolean(todayCheckin);
  const activeWorkout = activeWorkoutKey ? WORKOUTS[activeWorkoutKey] : null;
  const estimatedCalories = activeWorkout
    ? Math.round(activeWorkout.met * weight * (duration / 60))
    : 0;
  const parsedCalories = parseInt(caloriesInput, 10);
  const parsedSleep = Number(sleepHours);
  const canSave =
    Number.isFinite(parsedCalories) &&
    parsedCalories >= 0 &&
    Number.isFinite(parsedSleep) &&
    parsedSleep > 0 &&
    parsedSleep <= 24;
  const summaryItems = isLoggedToday
    ? [
        `${todayCheckin?.calories ?? eaten} kcal`,
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
    setCaloriesInput(String(todayCheckin?.calories ?? eaten ?? 0));
    setSleepHours(String(todayCheckin?.sleepHours ?? 8));
    setActiveWorkoutKey(todayCheckin?.workoutKey ?? null);
    setDuration(Number(todayCheckin?.duration) || 30);
    setShowActionPicker(true);
  }

  function completeCheckIn() {
    if (!Number.isFinite(parsedCalories) || parsedCalories < 0) return;
    if (!Number.isFinite(parsedSleep) || parsedSleep <= 0 || parsedSleep > 24) return;

    const alreadyLogged = readIsDayLocked() || Boolean(todayCheckin);
    const currentStreak = Number(localStorage.getItem(STREAK_KEY)) || 0;
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
      sleepHours: parsedSleep,
    };

    setIsCompleting(true);
    setEaten(parsedCalories);
    setBurned(nextBurnedTotal);
    saveTodayCalories(parsedCalories);
    saveBurnedCalories(nextBurnedTotal);
    localStorage.setItem(DAILY_CHECKIN_KEY, JSON.stringify(nextCheckin));
    localStorage.setItem(LAST_LOGGED_DATE_KEY, todayString);
    localStorage.setItem(STREAK_KEY, String(nextStreak));
    setShowSavedState(true);

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([18, 24, 28]);
    }

    window.setTimeout(() => {
      setShowSavedState(false);
      setShowActionPicker(false);
      setLocked(true);
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
    setLocked(false);
    localStorage.removeItem(LAST_LOGGED_DATE_KEY);
    setCaloriesInput(String(todayCheckin?.calories ?? eaten ?? 0));
    setSleepHours(String(todayCheckin?.sleepHours ?? 8));
    setActiveWorkoutKey(todayCheckin?.workoutKey ?? null);
    setDuration(Number(todayCheckin?.duration) || 30);
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
              <p className={styles.sectionEyebrow}>Idag</p>
              <h2 id="today-title" className={styles.focusTitle}>Dagens insats är klar.</h2>
              <p className={styles.focusBody}>Kalorier, träning och sömn är sparat.</p>
              <div className={styles.focusSummaryRow}>
                {summaryItems.map((item) => (
                  <span key={item} className={styles.focusSummaryPill}>
                    {item}
                  </span>
                ))}
              </div>
              <button type="button" className={styles.focusEditLink} onClick={handleUnlock}>
                Lås upp
              </button>
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
              <p className={styles.sectionEyebrow}>Idag</p>
              <h2 id="today-title" className={styles.focusTitle}>Logga dagen</h2>
              <p className={styles.focusBody}>Kalorier, träning och sömn.</p>
              <p className={styles.focusMeta}>Tryck för att fylla i.</p>
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
              <h3 className={styles.focusSheetTitle}>Fyll i dagen</h3>
            </div>
            <button
              type="button"
              className={styles.focusSheetClose}
              onClick={() => setShowActionPicker(false)}
              aria-label="Stäng dagens insats"
            >
              ✕
            </button>
          </div>
          <div className={styles.focusForm}>
            <div className={styles.focusTopFields}>
            <label className={styles.focusField}>
              <span className={styles.focusFieldLabel}>Kalorier ätit</span>
              <input
                ref={caloriesInputRef}
                type="number"
                inputMode="numeric"
                className={styles.focusInput}
                value={caloriesInput}
                onChange={(event) => setCaloriesInput(event.target.value)}
                onKeyDown={(event) => handleFormKeyDown(event, 'calories')}
                placeholder="Till exempel 1850"
                min="0"
              />
            </label>

            <label className={styles.focusField}>
              <span className={styles.focusFieldLabel}>Sömn</span>
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
                placeholder="Till exempel 8"
              />
            </label>
            </div>

            <div
              ref={workoutSectionRef}
              tabIndex={activeWorkout ? 0 : -1}
              className={[styles.focusField, !activeWorkout ? styles.focusFieldMuted : ''].join(' ')}
              onKeyDown={(event) => handleFormKeyDown(event, 'workout')}
            >
              <div className={styles.focusFieldHeader}>
                <span className={styles.focusFieldLabel}>Dagens träning</span>
                {activeWorkout ? <span className={styles.focusFieldHint}>+{estimatedCalories} kcal</span> : null}
              </div>
              <div className={styles.workoutGrid}>
                {Object.entries(WORKOUTS).map(([key, workout]) => {
                  const active = activeWorkoutKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={[styles.workoutOption, active ? styles.workoutOptionActive : ''].join(' ')}
                      onClick={() => setActiveWorkoutKey(active ? null : key)}
                      aria-pressed={active}
                      aria-label={workout.name}
                    >
                      <workout.Icon size={24} strokeWidth={1.5} />
                      <span className={styles.workoutLabel}>{workout.name}</span>
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
                <span className={styles.focusSavedText}>Dagen är sparad</span>
              </div>
            ) : null}
            <button
              type="button"
              className={styles.focusSheetSecondary}
              onClick={() => setShowActionPicker(false)}
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
              {showSavedState ? 'Sparat' : 'Spara dagens insats'}
            </button>
          </div>
        </section>
      )}
    </>
  );
}

function WeightJourney({ onOpen, profile, locked }) {
  const { recent, current } = useWeightLog();
  const startWeight = profile.startWeight ?? profile.weight ?? profile.currentWeight ?? 100;
  const goalWeight = profile.goalWeight ?? 90;
  const lost = startWeight - current;
  const totalToLose = startWeight - goalWeight;
  const progress = totalToLose > 0
    ? Math.min(100, Math.max(0, (lost / totalToLose) * 100))
    : 0;
  const lowest = recent.length > 0 ? Math.min(...recent.map((entry) => entry.weight)) : current;
  const isLowest = current <= lowest;
  const minTrend = Math.min(...WEIGHT_TREND);
  const maxTrend = Math.max(...WEIGHT_TREND);
  const trendRange = maxTrend - minTrend || 1;
  const trendPath = WEIGHT_TREND.map((value, index) => {
    const x = (index / (WEIGHT_TREND.length - 1)) * 100;
    const y = 85 - (((value - minTrend) / trendRange) * 55);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <section
      className={[styles.weightCard, locked ? styles.weightCardLocked : ''].join(' ')}
      role="button"
      tabIndex={locked ? -1 : 0}
      onClick={locked ? undefined : onOpen}
      onKeyDown={(event) => {
        if (locked) return;
        if (event.key === 'Enter') onOpen();
      }}
      aria-disabled={locked}
    >
      <div className={styles.weightSparkline} aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.weightSparklineSvg}>
          <path d={trendPath} className={styles.weightSparklinePath} />
        </svg>
      </div>

      <div className={styles.weightContent}>
      <div className={styles.weightHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Logga vikt</p>
          <h2 className={styles.weightValue}>
            <AnimatedNumber value={current} duration={800} decimals={1} />
            <span className={styles.weightUnit}>kg</span>
          </h2>
        </div>
        <div className={styles.weightBadge}>{progress.toFixed(0)}% klart</div>
      </div>

      <div className={styles.milestoneWrap}>
        <div className={styles.milestoneHeader}>
          <span>Start {startWeight}</span>
          <span>Nu {current.toFixed(1)}</span>
          <span>Mål {goalWeight}</span>
        </div>
        <div className={styles.milestoneTrack}>
          <div className={styles.milestoneFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.weightFooter}>
        <p className={styles.weightMessage}>
          {locked
            ? 'Dagens vikt är stängd.'
            : isLowest
              ? 'Nytt lägsta. Fortsätt registrera vikten lugnt.'
              : 'Tryck här för att logga eller justera dagens vikt.'}
        </p>
        <span className={styles.weightLink}>{locked ? 'Låst' : 'Logga vikt'}</span>
      </div>
      </div>
    </section>
  );
}

export default function Home({ profile }) {
  const { current: latestWeight } = useWeightLog();
  const [modal, setModal] = useState(null);
  const [eaten, setEaten] = useState(() => parseInt(localStorage.getItem(CALORIES_KEY) || '0', 10) || 0);
  const [burned, setBurned] = useState(() => parseInt(localStorage.getItem(BURNED_KEY) || '0', 10) || 0);
  const [isDayLocked, setIsDayLocked] = useState(() => readIsDayLocked());

  useEffect(() => {
    function syncCalories() {
      setEaten(parseInt(localStorage.getItem(CALORIES_KEY) || '0', 10) || 0);
      setBurned(parseInt(localStorage.getItem(BURNED_KEY) || '0', 10) || 0);
      setIsDayLocked(readIsDayLocked());
    }

    window.addEventListener('storage', syncCalories);
    window.addEventListener('focus', syncCalories);
    window.addEventListener('djur-i-juni:today-stats-updated', syncCalories);
    window.addEventListener('djur-i-juni:daily-logic-updated', syncCalories);

    return () => {
      window.removeEventListener('storage', syncCalories);
      window.removeEventListener('focus', syncCalories);
      window.removeEventListener('djur-i-juni:today-stats-updated', syncCalories);
      window.removeEventListener('djur-i-juni:daily-logic-updated', syncCalories);
    };
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.stack}>
        <HeroCard profile={profile} />
        <DailyFocusCard
          latestWeight={latestWeight}
          eaten={eaten}
          setEaten={setEaten}
          burned={burned}
          setBurned={setBurned}
          locked={isDayLocked}
          setLocked={setIsDayLocked}
        />
        <div className={styles.logSection}>
        <div className={styles.logSectionHeader}>
          <p className={styles.sectionEyebrow}>Logga idag</p>
          <h2 className={styles.logSectionTitle}>Vikt och kalorier</h2>
          <p className={styles.logSectionBody}>Träningen ligger nu i Dagens insats. Här håller du bara vikten och kaloribudgeten ren.</p>
          </div>
        <WeightJourney profile={profile} locked={isDayLocked} onOpen={() => setModal('weight')} />
        <QuickStats
          key={isDayLocked ? 'quickstats-locked' : 'quickstats-open'}
          profile={profile}
          eaten={eaten}
          burned={burned}
          setEaten={setEaten}
          locked={isDayLocked}
        />
        </div>
      </div>

      {modal === 'weight' && <WeightModal onClose={() => setModal(null)} />}
    </main>
  );
}
