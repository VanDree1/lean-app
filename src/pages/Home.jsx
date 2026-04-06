import { useEffect, useMemo, useState } from 'react';
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
const WORKOUTS_WEEK_KEY = 'djur_juni_week';
const WORKOUTS_WEEK_STAMP_KEY = 'djur_juni_week_stamp';
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
const WEEKDAY_LABELS = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

function getCurrentWeekStamp() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + diffToMonday);
  return monday.toISOString().slice(0, 10);
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

function DailyFocusCard({ profile, eaten, setEaten, burned, setBurned }) {
  const weight = Number(profile.weight ?? profile.currentWeight ?? profile.startWeight) || 100;
  const [lastLoggedDate, setLastLoggedDate] = useState(() => localStorage.getItem(LAST_LOGGED_DATE_KEY) || null);
  const [streak, setStreak] = useState(() => Number(localStorage.getItem(STREAK_KEY)) || 0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [caloriesInput, setCaloriesInput] = useState('');
  const [sleepHours, setSleepHours] = useState('8');
  const [activeWorkoutKey, setActiveWorkoutKey] = useState(null);
  const [duration, setDuration] = useState(30);
  const [weekHistory, setWeekHistory] = useState(() => {
    try {
      if (localStorage.getItem(WORKOUTS_WEEK_STAMP_KEY) !== getCurrentWeekStamp()) {
        localStorage.setItem(WORKOUTS_WEEK_STAMP_KEY, getCurrentWeekStamp());
        localStorage.setItem(WORKOUTS_WEEK_KEY, JSON.stringify([false, false, false, false, false, false, false]));
        return [false, false, false, false, false, false, false];
      }
      return JSON.parse(localStorage.getItem(WORKOUTS_WEEK_KEY)) || [false, false, false, false, false, false, false];
    } catch {
      return [false, false, false, false, false, false, false];
    }
  });
  const todayString = new Date().toDateString();
  const todayCheckin = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(DAILY_CHECKIN_KEY) || 'null');
      if (stored?.date === todayString) return stored;
      return null;
    } catch {
      return null;
    }
  }, [todayString]);
  const isLoggedToday = lastLoggedDate === todayString && Boolean(todayCheckin);
  const streakLabel = `${streak} ${streak === 1 ? 'dag' : 'dagar'}`;
  const activeWorkout = activeWorkoutKey ? WORKOUTS[activeWorkoutKey] : null;
  const estimatedCalories = activeWorkout
    ? Math.round(activeWorkout.met * weight * (duration / 60))
    : 0;
  const summaryItems = isLoggedToday
    ? [
        `${todayCheckin?.calories ?? eaten} kcal`,
        todayCheckin?.workoutName
          ? `${todayCheckin.workoutName}${todayCheckin?.duration ? ` ${todayCheckin.duration} min` : ''}`
          : 'Ingen träning',
        `${todayCheckin?.sleepHours ?? 0} h sömn`,
      ]
    : [];

  function handleCheckIn() {
    setCaloriesInput(String(todayCheckin?.calories ?? eaten ?? 0));
    setSleepHours(String(todayCheckin?.sleepHours ?? 8));
    setActiveWorkoutKey(todayCheckin?.workoutKey ?? null);
    setDuration(Number(todayCheckin?.duration) || 30);
    setShowActionPicker(true);
  }

  function completeCheckIn() {
    const parsedCalories = parseInt(caloriesInput, 10);
    const parsedSleep = Number(sleepHours);
    if (!Number.isFinite(parsedCalories) || parsedCalories < 0) return;
    if (!Number.isFinite(parsedSleep) || parsedSleep <= 0 || parsedSleep > 24) return;

    const alreadyLogged = lastLoggedDate === todayString;
    const nextStreak = alreadyLogged ? streak : streak + 1;
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
    const dayIndex = (() => {
      const nativeDay = new Date().getDay();
      return nativeDay === 0 ? 6 : nativeDay - 1;
    })();
    const nextWeekHistory = [...weekHistory];
    nextWeekHistory[dayIndex] = Boolean(activeWorkoutKey);

    setIsCompleting(true);
    setLastLoggedDate(todayString);
    setStreak(nextStreak);
    setShowActionPicker(false);
    setEaten(parsedCalories);
    setBurned(nextBurnedTotal);
    setWeekHistory(nextWeekHistory);
    saveTodayCalories(parsedCalories);
    saveBurnedCalories(nextBurnedTotal);
    localStorage.setItem(DAILY_CHECKIN_KEY, JSON.stringify(nextCheckin));
    localStorage.setItem(LAST_LOGGED_DATE_KEY, todayString);
    localStorage.setItem(STREAK_KEY, String(nextStreak));
    localStorage.setItem(WORKOUTS_WEEK_KEY, JSON.stringify(nextWeekHistory));
    localStorage.setItem(WORKOUTS_WEEK_STAMP_KEY, getCurrentWeekStamp());

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([18, 24, 28]);
    }

    window.setTimeout(() => setIsCompleting(false), 850);
  }

  return (
    <>
      <button
        type="button"
        className={[
          styles.focusCard,
          styles.focusCheckin,
          isCompleting ? styles.focusCardCompleting : '',
          isLoggedToday ? styles.focusCardDone : styles.focusCardTodo,
        ].join(' ')}
        aria-labelledby="today-title"
        onClick={handleCheckIn}
        disabled={isLoggedToday}
      >
        <div className={styles.focusContent}>
          <div className={styles.focusMain}>
            <p className={styles.sectionEyebrow}>Idag</p>
            <h2 id="today-title" className={styles.focusTitle}>
              {isLoggedToday ? 'Dagens insats är loggad.' : 'Logga idag för att behålla rytmen'}
            </h2>
            <p className={styles.focusBody}>
              {isLoggedToday
                ? 'Kalorier, träning och sömn är registrerat för idag.'
                : 'Tryck här och fyll i kalorier, träning och sömn för dagen.'}
            </p>
            {isLoggedToday ? (
              <div className={styles.focusSummaryRow}>
                {summaryItems.map((item) => (
                  <span key={item} className={styles.focusSummaryPill}>
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className={styles.focusMeta}>Streak {streakLabel}</p>
            )}
          </div>
        </div>

        <div className={styles.focusStatus} aria-hidden="true">
          {isLoggedToday ? (
            <span className={styles.focusCheckWrap}>
              <Check size={18} strokeWidth={1.8} className={styles.focusCheckIcon} />
            </span>
          ) : (
            <span className={styles.focusPulseDot} />
          )}
        </div>
      </button>
      {showActionPicker && (
        <div className={styles.focusSheetOverlay} onClick={(event) => event.target === event.currentTarget && setShowActionPicker(false)}>
          <div className={styles.focusSheet} role="dialog" aria-modal="true" aria-label="Fyll i dagens insats">
            <div className={styles.focusSheetHeader}>
              <p className={styles.sectionEyebrow}>Dagens insats</p>
              <h3 className={styles.focusSheetTitle}>Fyll i hur dagen faktiskt såg ut</h3>
            </div>
            <div className={styles.focusForm}>
              <label className={styles.focusField}>
                <span className={styles.focusFieldLabel}>Kalorier ätit</span>
                <input
                  type="number"
                  inputMode="numeric"
                  className={styles.focusInput}
                  value={caloriesInput}
                  onChange={(event) => setCaloriesInput(event.target.value)}
                  placeholder="Till exempel 1850"
                />
              </label>

              <div className={styles.focusField}>
                <div className={styles.focusFieldHeader}>
                  <span className={styles.focusFieldLabel}>Dagens träning</span>
                  <span className={styles.focusFieldHint}>
                    {activeWorkout ? `+${estimatedCalories} kcal` : 'Valfritt'}
                  </span>
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
                      <div>
                        <span className={styles.workoutDetailName}>{activeWorkout.name}</span>
                        <p className={styles.workoutDetailMeta}>{weight} kg kroppsvikt</p>
                      </div>
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
                      aria-label="Träningslängd i minuter"
                    />
                    <div className={styles.workoutScale}>
                      <span>10 min</span>
                      <span>120 min</span>
                    </div>
                    <p className={styles.workoutEstimate}>Uppskattning: +{estimatedCalories} kcal</p>
                  </div>
                )}
              </div>

              <label className={styles.focusField}>
                <span className={styles.focusFieldLabel}>Sömn</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  max="24"
                  className={styles.focusInput}
                  value={sleepHours}
                  onChange={(event) => setSleepHours(event.target.value)}
                  placeholder="Till exempel 8"
                />
              </label>

              <div className={styles.focusWeekWrap}>
                <span className={styles.focusFieldLabel}>Veckorytm</span>
                <div className={styles.workoutWeek}>
                  {WEEKDAY_LABELS.map((label, index) => (
                    <div key={`${label}-${index}`} className={styles.workoutDay}>
                      <span className={[styles.workoutDot, weekHistory[index] ? styles.workoutDotActive : ''].join(' ')} />
                      <span className={styles.workoutDayLabel}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.focusSheetActions}>
              <button
                type="button"
                className={styles.focusSheetSecondary}
                onClick={(event) => {
                  event.stopPropagation();
                  setShowActionPicker(false);
                }}
              >
                Avbryt
              </button>
              <button
                type="button"
                className={styles.focusSheetPrimary}
                onClick={(event) => {
                  event.stopPropagation();
                  completeCheckIn();
                }}
              >
                Spara dagens insats
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function WeightJourney({ onOpen, profile }) {
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
    <section className={styles.weightCard} role="button" tabIndex={0} onClick={onOpen} onKeyDown={(event) => event.key === 'Enter' && onOpen()}>
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
        <p className={styles.weightMessage}>{isLowest ? 'Nytt lägsta. Fortsätt registrera vikten lugnt.' : 'Tryck här för att logga eller justera dagens vikt.'}</p>
        <span className={styles.weightLink}>Logga vikt</span>
      </div>
      </div>
    </section>
  );
}

export default function Home({ profile }) {
  const [modal, setModal] = useState(null);
  const [eaten, setEaten] = useState(() => parseInt(localStorage.getItem(CALORIES_KEY) || '0', 10) || 0);
  const [burned, setBurned] = useState(() => parseInt(localStorage.getItem(BURNED_KEY) || '0', 10) || 0);

  useEffect(() => {
    function syncCalories() {
      setEaten(parseInt(localStorage.getItem(CALORIES_KEY) || '0', 10) || 0);
      setBurned(parseInt(localStorage.getItem(BURNED_KEY) || '0', 10) || 0);
    }

    window.addEventListener('storage', syncCalories);
    window.addEventListener('focus', syncCalories);
    window.addEventListener('djur-i-juni:today-stats-updated', syncCalories);

    return () => {
      window.removeEventListener('storage', syncCalories);
      window.removeEventListener('focus', syncCalories);
      window.removeEventListener('djur-i-juni:today-stats-updated', syncCalories);
    };
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.stack}>
        <HeroCard profile={profile} />
        <DailyFocusCard profile={profile} eaten={eaten} setEaten={setEaten} burned={burned} setBurned={setBurned} />
        <div className={styles.logSection}>
        <div className={styles.logSectionHeader}>
          <p className={styles.sectionEyebrow}>Logga idag</p>
          <h2 className={styles.logSectionTitle}>Vikt och kalorier</h2>
          <p className={styles.logSectionBody}>Träningen ligger nu i Dagens insats. Här håller du bara vikten och kaloribudgeten ren.</p>
          </div>
        <WeightJourney profile={profile} onOpen={() => setModal('weight')} />
        <QuickStats profile={profile} eaten={eaten} burned={burned} setEaten={setEaten} />
        </div>
      </div>

      {modal === 'weight' && <WeightModal onClose={() => setModal(null)} />}
    </main>
  );
}
