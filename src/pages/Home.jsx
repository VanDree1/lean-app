import { useEffect, useState } from 'react';
import { Activity, Bike, Check, Dumbbell, Flower2, Footprints } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber/AnimatedNumber';
import HeroCard from '../components/HeroCard/HeroCard';
import QuickStats from '../components/QuickStats/QuickStats';
import StreakBanner from '../components/StreakBanner/StreakBanner';
import WeightModal from '../components/Weight/WeightModal';
import { useWeightLog } from '../components/Weight/useWeightLog';
import { useStreak } from '../hooks/useStreak';
import styles from './Home.module.css';

const PROFILE_KEY = 'djur-i-juni:profile';
const ONBOARDING_KEY = 'djur-i-juni:onboarding';
const HEALTH_FACT_CACHE_KEY_PREFIX = 'djur-i-juni:health-fact';
const HEALTH_FACT_TTL_MS = 1000 * 60 * 60 * 12;
const LAST_LOGGED_DATE_KEY = 'djur_juni_last_logged';
const LAST_LOGGED_ACTION_KEY = 'djur_juni_last_action';
const STREAK_KEY = 'djur_juni_streak';
const WORKOUTS_WEEK_KEY = 'djur_juni_week';
const CALORIES_KEY = 'djur_juni_cal';
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

function todayStatsDate() {
  return new Date().toISOString().slice(0, 10);
}

function saveWorkoutCalories(estimatedCalories) {
  const currentCalories = parseInt(localStorage.getItem(CALORIES_KEY) || '0', 10) || 0;
  const nextCalories = currentCalories + estimatedCalories;
  localStorage.setItem(CALORIES_KEY, String(nextCalories));

  const payload = {
    date: todayStatsDate(),
    calories: nextCalories,
    steps: 0,
  };

  try {
    for (const key of TODAY_STATS_KEYS) {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      if (parsed && parsed.date === payload.date) {
        payload.steps = Number(parsed.steps) || 0;
        break;
      }
    }
  } catch {
    payload.steps = 0;
  }

  for (const key of TODAY_STATS_KEYS) {
    localStorage.setItem(key, JSON.stringify(payload));
  }

  window.dispatchEvent(new Event('djur-i-juni:today-stats-updated'));
}

const HEALTH_TOPICS_BY_GOAL = {
  fat_loss: [
    {
      title: 'Mättnad',
      queryTitle: 'Mättnad',
      sourceUrl: 'https://sv.wikipedia.org/wiki/M%C3%A4ttnad',
      fallback: 'Mättnad styrs inte bara av kalorier, utan också av volym, protein, fibrer och hur snabbt maten äts.',
    },
    {
      title: 'Basalomsättning',
      queryTitle: 'Basalomsättning',
      sourceUrl: 'https://sv.wikipedia.org/wiki/Basaloms%C3%A4ttning',
      fallback: 'Basalomsättningen är den energi kroppen använder i vila för att hålla igång grundläggande funktioner som andning, temperatur och cirkulation.',
    },
    {
      title: 'Brunt fett',
      queryTitle: 'Brunt_fett',
      sourceUrl: 'https://sv.wikipedia.org/wiki/Brunt_fett',
      fallback: 'Brunt fett skiljer sig från vanligt fett genom att det är mer specialiserat på värmeproduktion än energilagring.',
    },
  ],
  muscle: [
    {
      title: 'Muskelhypertrofi',
      queryTitle: 'Muskelhypertrofi',
      sourceUrl: 'https://sv.wikipedia.org/wiki/Muskelhypertrofi',
      fallback: 'Muskelhypertrofi innebär att muskelfibrerna ökar i storlek, vilket är en central del av hur muskler byggs över tid.',
    },
    {
      title: 'Kreatin',
      queryTitle: 'Kreatin',
      sourceUrl: 'https://sv.wikipedia.org/wiki/Kreatin',
      fallback: 'Kreatin hjälper till att snabbt återbilda ATP, vilket gör det särskilt relevant vid korta och intensiva arbetsinsatser.',
    },
    {
      title: 'Glykogen',
      queryTitle: 'Glykogen',
      sourceUrl: 'https://sv.wikipedia.org/wiki/Glykogen',
      fallback: 'Glykogen är kroppens lagrade form av glukos och finns främst i levern och musklerna, där det fungerar som snabb energi.',
    },
  ],
  energy: [
    {
      title: 'Dygnsrytm',
      queryTitle: 'Dygnsrytm',
      sourceUrl: 'https://sv.wikipedia.org/wiki/Dygnsrytm',
      fallback: 'Dygnsrytmen påverkar bland annat sömn, hormoner, kroppstemperatur och när kroppen känns mest vaken eller trött.',
    },
    {
      title: 'Glykogen',
      queryTitle: 'Glykogen',
      sourceUrl: 'https://sv.wikipedia.org/wiki/Glykogen',
      fallback: 'Glykogen är kroppens lagrade form av glukos och finns främst i levern och musklerna, där det fungerar som snabb energi.',
    },
    {
      title: 'Basalomsättning',
      queryTitle: 'Basalomsättning',
      sourceUrl: 'https://sv.wikipedia.org/wiki/Basaloms%C3%A4ttning',
      fallback: 'Basalomsättningen är den energi kroppen använder i vila för att hålla igång grundläggande funktioner som andning, temperatur och cirkulation.',
    },
  ],
  target: [
    {
      title: 'Mättnad',
      queryTitle: 'Mättnad',
      sourceUrl: 'https://sv.wikipedia.org/wiki/M%C3%A4ttnad',
      fallback: 'Mättnad styrs inte bara av kalorier, utan också av volym, protein, fibrer och hur snabbt maten äts.',
    },
    {
      title: 'Dygnsrytm',
      queryTitle: 'Dygnsrytm',
      sourceUrl: 'https://sv.wikipedia.org/wiki/Dygnsrytm',
      fallback: 'Dygnsrytmen påverkar bland annat sömn, hormoner, kroppstemperatur och när kroppen känns mest vaken eller trött.',
    },
    {
      title: 'Glykogen',
      queryTitle: 'Glykogen',
      sourceUrl: 'https://sv.wikipedia.org/wiki/Glykogen',
      fallback: 'Glykogen är kroppens lagrade form av glukos och finns främst i levern och musklerna, där det fungerar som snabb energi.',
    },
  ],
  default: [
    {
      title: 'Dygnsrytm',
      queryTitle: 'Dygnsrytm',
      sourceUrl: 'https://sv.wikipedia.org/wiki/Dygnsrytm',
      fallback: 'Dygnsrytmen påverkar bland annat sömn, hormoner, kroppstemperatur och när kroppen känns mest vaken eller trött.',
    },
    {
      title: 'Mättnad',
      queryTitle: 'Mättnad',
      sourceUrl: 'https://sv.wikipedia.org/wiki/M%C3%A4ttnad',
      fallback: 'Mättnad styrs inte bara av kalorier, utan också av volym, protein, fibrer och hur snabbt maten äts.',
    },
    {
      title: 'Kreatin',
      queryTitle: 'Kreatin',
      sourceUrl: 'https://sv.wikipedia.org/wiki/Kreatin',
      fallback: 'Kreatin hjälper till att snabbt återbilda ATP, vilket gör det särskilt relevant vid korta och intensiva arbetsinsatser.',
    },
  ],
};

function getHealthTopicForToday(goal) {
  const topics = HEALTH_TOPICS_BY_GOAL[goal] || HEALTH_TOPICS_BY_GOAL.default;
  return topics[Math.floor(Date.now() / 86_400_000) % topics.length];
}

function getHealthFactCacheKey(goal) {
  return `${HEALTH_FACT_CACHE_KEY_PREFIX}:${goal || 'default'}`;
}

function readCachedHealthFact(goal) {
  try {
    const raw = localStorage.getItem(getHealthFactCacheKey(goal));
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    if (!parsed?.title || !parsed?.text || !parsed?.sourceUrl || !parsed?.fetchedAt) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function isFreshFact(cache) {
  return Boolean(cache && Date.now() - cache.fetchedAt < HEALTH_FACT_TTL_MS);
}

function trimFactText(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  const sentences = clean.match(/[^.!?]+[.!?]+/g)?.map((sentence) => sentence.trim()) || [clean];
  const [first = '', second = ''] = sentences;

  let selected = first;

  if (second && first.length < 110) {
    selected = `${first} ${second}`.trim();
  } else if (second && /^(?:[A-ZÅÄÖa-zåäö0-9_\- ]+?)\s+är\b/.test(first) && second.length > 50) {
    selected = second;
  }

  return selected.length > 220 ? `${selected.slice(0, 217).trim()}...` : selected;
}

function buildCoachTip(goal, topic, sourceText) {
  const COACH_TITLES = {
    fat_loss: 'Gör hungern lättare',
    muscle: 'Bygg rätt saker',
    energy: 'Skydda energin',
    target: 'Håll riktningen enkel',
    default: 'Håll det enkelt',
  };

  const ONE_LINERS = {
    'Mättnad': 'Bygg måltider som håller dig lugn längre.',
    'Basalomsättning': 'Mycket energi går åt redan i vila.',
    'Brunt fett': 'Allt kroppsfett beter sig inte likadant.',
    'Muskelhypertrofi': 'Muskler byggs bäst av jämn belastning.',
    'Kreatin': 'Kreatin hjälper vid korta, hårda insatser.',
    'Glykogen': 'När energin dippar är glykogen ofta med i bilden.',
    'Dygnsrytm': 'Bra rytm gör resten av dagen lättare.',
  };

  return {
    title: COACH_TITLES[goal] || COACH_TITLES.default,
    text: ONE_LINERS[topic.title] || trimFactText(sourceText || topic.fallback),
  };
}

function applyDailyCoachContext(tip, loggedToday) {
  if (loggedToday) {
    return {
      title: 'Skydda rytmen',
      text: 'Det räcker nu. Håll det lugnt.',
      status: 'Klar',
    };
  }

  return {
    title: tip.title,
    text: tip.text,
    status: 'Nu',
  };
}


function DailyFocusCard() {
  const [lastLoggedDate, setLastLoggedDate] = useState(() => localStorage.getItem(LAST_LOGGED_DATE_KEY) || null);
  const [lastLoggedAction, setLastLoggedAction] = useState(() => localStorage.getItem(LAST_LOGGED_ACTION_KEY) || '');
  const [streak, setStreak] = useState(() => Number(localStorage.getItem(STREAK_KEY)) || 0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const todayString = new Date().toDateString();
  const isLoggedToday = lastLoggedDate === todayString && Boolean(lastLoggedAction);

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
                ? `${DAILY_ACTIONS.find((item) => item.value === lastLoggedAction)?.label || 'Insats'} · ${streak} dagar`
                : `Streak ${streak} dagar`}
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

function WorkoutCard({ profile }) {
  const weight = Number(profile.weight ?? profile.currentWeight ?? profile.startWeight) || 100;
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [duration, setDuration] = useState(30);
  const [weekHistory, setWeekHistory] = useState(() => {
    try {
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

    saveWorkoutCalories(estimatedCalories);
    const dayIndex = (() => {
      const nativeDay = new Date().getDay();
      return nativeDay === 0 ? 6 : nativeDay - 1;
    })();

    setWeekHistory((prev) => {
      const next = [...prev];
      const firstWorkoutToday = !next[dayIndex];
      next[dayIndex] = true;
      localStorage.setItem(WORKOUTS_WEEK_KEY, JSON.stringify(next));
      setFeedback(firstWorkoutToday ? `Grym insats! +${estimatedCalories} kcal uppskattat.` : `Uppdaterat: +${estimatedCalories} kcal.`);
      return next;
    });

    setActiveWorkout(null);
    setDuration(30);
  }

  return (
    <section className={styles.workoutCard} aria-labelledby="workout-title">
      <div className={styles.workoutHeader}>
        <p id="workout-title" className={styles.sectionEyebrow}>Dagens träning</p>
      </div>
      <div className={styles.workoutGrid}>
        {Object.entries(WORKOUTS).map(([key, workout]) => {
          const active = activeWorkout?.key === key;
          return (
            <button
              key={key}
              type="button"
              className={[styles.workoutOption, active ? styles.workoutOptionActive : ''].join(' ')}
              onClick={() => setActiveWorkout({ key, ...workout })}
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
            aria-label="Träningslängd i minuter"
          />
          <div className={styles.workoutEstimateRow}>
            <p className={styles.workoutEstimate}>Uppskattning: +{estimatedCalories} kcal</p>
            <button type="button" className={styles.workoutLogButton} onClick={handleSaveWorkout}>
              Logga
            </button>
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
          <p className={styles.sectionEyebrow}>Vikt</p>
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
        <p className={styles.weightMessage}>{isLowest ? 'Nytt lägsta. Bra riktning.' : 'Låt trenden väga tyngre än enskilda dagar.'}</p>
        <span className={styles.weightLink}>Öppna historik</span>
      </div>
      </div>
    </section>
  );
}

function CoachTipCard({ profile }) {
  const { loggedToday } = useStreak();
  const goal = profile.goal || 'default';
  const [tip, setTip] = useState(() => {
    const cached = readCachedHealthFact(goal);
    if (cached) {
      return applyDailyCoachContext(buildCoachTip(goal, cached, cached.text), loggedToday);
    }

    const topic = getHealthTopicForToday(goal);
    return applyDailyCoachContext(buildCoachTip(goal, topic, topic.fallback), loggedToday);
  });

  useEffect(() => {
    const cached = readCachedHealthFact(goal);
    if (isFreshFact(cached)) {
      setTip(applyDailyCoachContext(buildCoachTip(goal, cached, cached.text), loggedToday));
      return undefined;
    }

    const topic = getHealthTopicForToday(goal);
    const controller = new AbortController();

    async function loadFact() {
      try {
        const response = await fetch(`https://sv.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic.queryTitle || topic.title)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Health fact request failed with ${response.status}`);
        }

        const data = await response.json();
        const text = trimFactText(data.extract);
        if (!text) {
          throw new Error('Health fact response was incomplete');
        }

        const nextFact = {
          title: topic.title,
          text,
          sourceUrl: data.content_urls?.desktop?.page || topic.sourceUrl,
          fetchedAt: Date.now(),
        };

        localStorage.setItem(getHealthFactCacheKey(goal), JSON.stringify(nextFact));
        setTip(applyDailyCoachContext(buildCoachTip(goal, nextFact, text), loggedToday));
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        const fallbackFact = cached || {
          title: topic.title,
          text: topic.fallback,
          sourceLabel: 'Arkiv',
          sourceUrl: topic.sourceUrl,
          fetchedAt: Date.now(),
        };

        setTip(applyDailyCoachContext(buildCoachTip(goal, fallbackFact, fallbackFact.text), loggedToday));
      }
    }

    loadFact();

    return () => controller.abort();
  }, [goal, loggedToday]);

  return (
    <section className={styles.noteCard}>
      <div className={styles.noteHeader}>
        <p className={styles.sectionEyebrow}>Tips från coachen</p>
        <span className={styles.noteSource}>{tip.status}</span>
      </div>
      <h3 className={styles.noteTitle}>{tip.title}</h3>
      <p className={styles.noteText}>{tip.text}</p>
    </section>
  );
}

export default function Home({ profile }) {
  const [modal, setModal] = useState(null);

  return (
    <main className={styles.main}>
      <div className={styles.stack}>
        <HeroCard profile={profile} />
        <DailyFocusCard />
        <div className={styles.twoColumn}>
          <StreakBanner />
          <WeightJourney profile={profile} onOpen={() => setModal('weight')} />
        </div>
        <QuickStats profile={profile} />
        <WorkoutCard profile={profile} />
        <CoachTipCard profile={profile} />
      </div>

      {modal === 'weight' && <WeightModal onClose={() => setModal(null)} />}
    </main>
  );
}
