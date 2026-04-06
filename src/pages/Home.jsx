import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import HeroCard from '../components/HeroCard/HeroCard';
import QuickStats from '../components/QuickStats/QuickStats';
import StreakBanner from '../components/StreakBanner/StreakBanner';
import WeightModal from '../components/Weight/WeightModal';
import { useWeightLog } from '../components/Weight/useWeightLog';
import { useStreak } from '../hooks/useStreak';
import { useProfile } from '../hooks/useProfile';
import { useCountUp } from '../hooks/useCountUp';
import Sparkline from '../components/WeightCard/Sparkline';
import styles from './Home.module.css';

const PROFILE_KEY = 'djur-i-juni:profile';
const ONBOARDING_KEY = 'djur-i-juni:onboarding';
const HEALTH_FACT_CACHE_KEY_PREFIX = 'djur-i-juni:health-fact';
const HEALTH_FACT_TTL_MS = 1000 * 60 * 60 * 12;

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
  const { loggedToday } = useStreak();
  const [isLoggedToday, setIsLoggedToday] = useState(loggedToday);

  useEffect(() => {
    setIsLoggedToday(loggedToday);
  }, [loggedToday]);

  return (
    <button
      type="button"
      className={[
        styles.focusCard,
        styles.focusCheckin,
        isLoggedToday ? styles.focusCardDone : styles.focusCardTodo,
      ].join(' ')}
      aria-labelledby="today-title"
      onClick={() => setIsLoggedToday(true)}
    >
      <div className={styles.focusMain}>
        <p className={styles.sectionEyebrow}>Idag</p>
        <h2 id="today-title" className={styles.focusTitle}>
          {isLoggedToday ? 'Dagens insats är loggad.' : 'Logga idag'}
        </h2>
        <p className={styles.focusBody}>
          {isLoggedToday ? 'Bra jobbat. Vila nu.' : 'Tryck här när dagens insats är klar.'}
        </p>
      </div>

      <div className={styles.focusStatus} aria-hidden="true">
        {isLoggedToday ? (
          <Check size={18} strokeWidth={1.8} className={styles.focusCheckIcon} />
        ) : (
          <span className={styles.focusPulseDot} />
        )}
      </div>
    </button>
  );
}

function WeightJourney({ onOpen }) {
  const { recent, current, progress, GOAL_WEIGHT, START_WEIGHT } = useWeightLog();
  const currentDisplay = useCountUp(Math.round(current * 10), 900) / 10;
  const lowest = recent.length > 0 ? Math.min(...recent.map((entry) => entry.weight)) : current;
  const isLowest = current <= lowest;

  return (
    <section className={styles.weightCard} role="button" tabIndex={0} onClick={onOpen} onKeyDown={(event) => event.key === 'Enter' && onOpen()}>
      <div className={styles.weightHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Vikt</p>
          <h2 className={styles.weightValue}>
            {currentDisplay.toFixed(1)}
            <span className={styles.weightUnit}>kg</span>
          </h2>
        </div>
        <div className={styles.weightBadge}>{progress.toFixed(0)}% klart</div>
      </div>

      {recent.length >= 2 && (
        <div className={styles.sparklineWrap}>
          <Sparkline entries={recent} />
        </div>
      )}

      <div className={styles.milestoneWrap}>
        <div className={styles.milestoneHeader}>
          <span>Start {START_WEIGHT}</span>
          <span>Nu {current.toFixed(1)}</span>
          <span>Mål {GOAL_WEIGHT}</span>
        </div>
        <div className={styles.milestoneTrack}>
          <div className={styles.milestoneFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.weightFooter}>
        <p className={styles.weightMessage}>{isLowest ? 'Nytt lägsta. Bra riktning.' : 'Låt trenden väga tyngre än enskilda dagar.'}</p>
        <span className={styles.weightLink}>Öppna historik</span>
      </div>
    </section>
  );
}

function CoachTipCard() {
  const { profile } = useProfile();
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

export default function Home() {
  const [modal, setModal] = useState(null);

  return (
    <main className={styles.main}>
      <div className={styles.stack}>
        <HeroCard />
        <DailyFocusCard />
        <div className={styles.twoColumn}>
          <StreakBanner />
          <WeightJourney onOpen={() => setModal('weight')} />
        </div>
        <QuickStats />
        <CoachTipCard />
      </div>

      {modal === 'weight' && <WeightModal onClose={() => setModal(null)} />}
    </main>
  );
}
