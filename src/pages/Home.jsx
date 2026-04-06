import { useEffect, useState } from 'react';
import { Activity, Bike, Check, Dumbbell, Flower2, Footprints } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber/AnimatedNumber';
import HeroCard from '../components/HeroCard/HeroCard';
import QuickStats from '../components/QuickStats/QuickStats';
import WeightModal from '../components/Weight/WeightModal';
import { useWeightLog } from '../components/Weight/useWeightLog';
import styles from './Home.module.css';

const LAST_LOGGED_DATE_KEY = 'djur_juni_last_logged';
const LAST_LOGGED_ACTION_KEY = 'djur_juni_last_action';
const STREAK_KEY = 'djur_juni_streak';
const WORKOUTS_WEEK_KEY = 'djur_juni_week';
const WORKOUTS_WEEK_STAMP_KEY = 'djur_juni_week_stamp';
const CALORIES_KEY = 'djur_juni_cal';
const BURNED_KEY = 'djur_juni_burned';
const TODAY_STATS_KEYS = [
  'djur-i-juni:today-stats',
  'djur-i-juni:daily-summary',
];
const WEIGHT_TREND = [103.2, 102.5, 102.1, 101.8, 101.0, 100.5, 100.0];
const DAILY_ACTIONS = [
  { value: 'weight', label: 'Jag vägde mig', desc: 'Dagens vikt är registrerad' },
  { value: 'food', label: 'Jag höll kosten', desc: 'Maten satt som den skulle' },
  { value: 'training', label: 'Jag tränade', desc: 'Passet eller rörelsen är gjort' },
  { value: 'routine', label: 'Jag höll rutinen', desc: 'Jag gjorde det viktigaste idag' },
];
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

function saveWorkoutCalories(estimatedCalories) {
  const currentBurned = parseInt(localStorage.getItem(BURNED_KEY) || '0', 10) || 0;
  const nextBurned = currentBurned + estimatedCalories;
  localStorage.setItem(BURNED_KEY, String(nextBurned));
  window.dispatchEvent(new Event('djur-i-juni:today-stats-updated'));
  return nextBurned;
}

function DailyFocusCard() {
  const [lastLoggedDate, setLastLoggedDate] = useState(() => localStorage.getItem(LAST_LOGGED_DATE_KEY) || null);
  const [lastLoggedAction, setLastLoggedAction] = useState(() => localStorage.getItem(LAST_LOGGED_ACTION_KEY) || '');
  const [streak, setStreak] = useState(() => Number(localStorage.getItem(STREAK_KEY)) || 0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const todayString = new Date().toDateString();
  const isLoggedToday = lastLoggedDate === todayString && Boolean(lastLoggedAction);
  const streakLabel = `${streak} ${streak === 1 ? 'dag' : 'dagar'}`;

  function handleCheckIn() {
    if (isLoggedToday) return;
    setShowActionPicker(true);
  }

  function completeCheckIn(action) {
    if (!action) return;

    const nextStreak = streak + 1;
    setIsCompleting(true);
    setLastLoggedDate(todayString);
    setLastLoggedAction(action);
    setStreak(nextStreak);
    setShowActionPicker(false);
    localStorage.setItem(LAST_LOGGED_DATE_KEY, todayString);
    localStorage.setItem(LAST_LOGGED_ACTION_KEY, action);
    localStorage.setItem(STREAK_KEY, String(nextStreak));

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
                ? 'Bra jobbat. Vila nu.'
                : 'Tryck här och välj vad du faktiskt fick gjort idag.'}
            </p>
            <p className={styles.focusMeta}>
              {isLoggedToday
                ? `${DAILY_ACTIONS.find((item) => item.value === lastLoggedAction)?.label || 'Insats'} · ${streakLabel}`
                : `Streak ${streakLabel}`}
            </p>
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
      {showActionPicker && !isLoggedToday && (
        <div className={styles.focusSheetOverlay} onClick={(event) => event.target === event.currentTarget && setShowActionPicker(false)}>
          <div className={styles.focusSheet} role="dialog" aria-modal="true" aria-label="Välj dagens insats">
            <div className={styles.focusSheetHeader}>
              <p className={styles.sectionEyebrow}>Dagens insats</p>
              <h3 className={styles.focusSheetTitle}>Vad vill du markera som klart?</h3>
            </div>
            <div className={styles.focusOptionList}>
              {DAILY_ACTIONS.map((action) => (
                <button
                  key={action.value}
                  type="button"
                  className={styles.focusOption}
                  onClick={(event) => {
                    event.stopPropagation();
                    completeCheckIn(action.value);
                  }}
                >
                  <span className={styles.focusOptionLabel}>{action.label}</span>
                  <span className={styles.focusOptionDesc}>{action.desc}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.focusSheetClose}
              onClick={(event) => {
                event.stopPropagation();
                setShowActionPicker(false);
              }}
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function WorkoutCard({ profile, setBurned }) {
  const weight = Number(profile.weight ?? profile.currentWeight ?? profile.startWeight) || 100;
  const [activeWorkout, setActiveWorkout] = useState(null);
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
  const [feedback, setFeedback] = useState('');
  const estimatedCalories = activeWorkout
    ? Math.round(activeWorkout.met * weight * (duration / 60))
    : 0;

  function handleSaveWorkout() {
    if (!activeWorkout) return;

    const nextBurned = saveWorkoutCalories(estimatedCalories);
    setBurned(nextBurned);
    const dayIndex = (() => {
      const nativeDay = new Date().getDay();
      return nativeDay === 0 ? 6 : nativeDay - 1;
    })();

    setWeekHistory((prev) => {
      const next = [...prev];
      const firstWorkoutToday = !next[dayIndex];
      next[dayIndex] = true;
      localStorage.setItem(WORKOUTS_WEEK_KEY, JSON.stringify(next));
      localStorage.setItem(WORKOUTS_WEEK_STAMP_KEY, getCurrentWeekStamp());
      setFeedback(firstWorkoutToday ? `Grym insats! +${estimatedCalories} kcal uppskattat.` : `Uppdaterat: +${estimatedCalories} kcal.`);
      return next;
    });

    setActiveWorkout(null);
    setDuration(30);
  }

  return (
    <section className={styles.workoutCard} aria-labelledby="workout-title">
      <div className={styles.workoutHeader}>
        <div>
          <p id="workout-title" className={styles.sectionEyebrow}>Dagens träning</p>
          <p className={styles.workoutSubtle}>Välj pass och justera tiden lugnt.</p>
        </div>
      </div>
      <div className={styles.workoutGrid}>
        {Object.entries(WORKOUTS).map(([key, workout]) => {
          const active = activeWorkout?.key === key;
          return (
            <button
              key={key}
              type="button"
              className={[styles.workoutOption, active ? styles.workoutOptionActive : ''].join(' ')}
              onClick={() => setActiveWorkout(active ? null : { key, ...workout })}
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
          <div className={styles.workoutEstimateRow}>
            <p className={styles.workoutEstimate}>Uppskattning: +{estimatedCalories} kcal</p>
            <div className={styles.workoutActionRow}>
              <button type="button" className={styles.workoutCancelButton} onClick={() => setActiveWorkout(null)}>
                Avbryt
              </button>
              <button type="button" className={styles.workoutLogButton} onClick={handleSaveWorkout}>
                Logga
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.workoutWeek}>
        {WEEKDAY_LABELS.map((label, index) => (
          <div key={`${label}-${index}`} className={styles.workoutDay}>
            <span className={[styles.workoutDot, weekHistory[index] ? styles.workoutDotActive : ''].join(' ')} />
            <span className={styles.workoutDayLabel}>{label}</span>
          </div>
        ))}
      </div>

      <p className={[styles.workoutFeedback, feedback ? styles.workoutFeedbackVisible : ''].join(' ')}>
        {feedback || 'Välj pass, justera tid och logga när det är gjort.'}
      </p>
    </section>
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
        <DailyFocusCard />
        <div className={styles.logSection}>
        <div className={styles.logSectionHeader}>
          <p className={styles.sectionEyebrow}>Logga idag</p>
          <h2 className={styles.logSectionTitle}>Vikt, träning och kalorier</h2>
          <p className={styles.logSectionBody}>Tre tydliga kort. Ett för vikt, ett för kalorier och ett för träning.</p>
          </div>
        <WeightJourney profile={profile} onOpen={() => setModal('weight')} />
        <QuickStats profile={profile} eaten={eaten} burned={burned} setEaten={setEaten} />
        <WorkoutCard profile={profile} setBurned={setBurned} />
        </div>
      </div>

      {modal === 'weight' && <WeightModal onClose={() => setModal(null)} />}
    </main>
  );
}
