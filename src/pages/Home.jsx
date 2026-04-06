import { useEffect, useState } from 'react';
import HeroCard from '../components/HeroCard/HeroCard';
import QuickStats from '../components/QuickStats/QuickStats';
import StreakBanner from '../components/StreakBanner/StreakBanner';
import MotivationTip from '../components/MotivationTip/MotivationTip';
import WeightModal from '../components/Weight/WeightModal';
import ProfileModal from '../components/Onboarding/ProfileModal';
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

const GOAL_LABELS = {
  fat_loss: 'Fettförlust',
  muscle: 'Bygga muskler',
  energy: 'Mer energi',
  target: 'Målvikt',
};

const ACTIVITY_LABELS = {
  sedentary: 'Stillasittande',
  light: 'Måttligt aktiv',
  very_active: 'Mycket aktiv',
};

const PROFILE_FIELD_LABELS = {
  name: 'namn',
  age: 'ålder',
  height: 'längd',
  goal: 'fokus',
  activity: 'aktivitet',
  diet: 'koststil',
  goalWeight: 'målvikt',
};

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
  const text = trimFactText(sourceText || topic.fallback);

  const COACH_TITLES = {
    fat_loss: 'Håll hungern på din sida',
    muscle: 'Bygg runt det som faktiskt driver resultat',
    energy: 'Skydda energin tidigt på dagen',
    target: 'Gör målet lätt att hålla',
    default: 'Håll det smart och enkelt',
  };

  const TOPIC_INTROS = {
    'Mättnad': 'Om mättnaden är låg blir resten av dagen ofta onödigt tung.',
    'Basalomsättning': 'Allt handlar inte om träning. Kroppen använder mycket energi även i vila.',
    'Brunt fett': 'Allt kroppsfett beter sig inte likadant.',
    'Muskelhypertrofi': 'Muskler byggs bättre av jämn belastning över tid än av enstaka maxpass.',
    'Kreatin': 'Kreatin är intressant för att det hjälper vid korta, intensiva insatser.',
    'Glykogen': 'När energin dippar är det ofta relevant hur kroppen lagrar och använder glykogen.',
    'Dygnsrytm': 'Bra rytm slår ofta mer vilja.',
  };

  const GOAL_OUTROS = {
    fat_loss: 'Bygg måltider som gör det lättare att hålla riktningen, inte svårare.',
    muscle: 'Lägg fokus på saker som går att upprepa varje vecka: protein, progression och återhämtning.',
    energy: 'Ju jämnare rytm du har, desto mindre behöver du lösa dagen med ren disciplin.',
    target: 'Det du kan upprepa lugnt vinner nästan alltid över det som bara ser bra ut på papper.',
    default: 'Ta det som gör dagen enklare att upprepa i morgon också.',
  };

  return {
    title: COACH_TITLES[goal] || COACH_TITLES.default,
    text: `${TOPIC_INTROS[topic.title] || 'Det finns ofta en enklare hävstång än man tror.'} ${text} ${GOAL_OUTROS[goal] || GOAL_OUTROS.default}`.trim(),
  };
}

function applyDailyCoachContext(tip, loggedToday) {
  if (loggedToday) {
    return {
      title: 'Bra. Nu skyddar du rytmen',
      text: `${tip.text} Du behöver inte jaga mer i dag, bara hålla det lugnt och konsekvent.`,
      status: 'Dag säkrad',
    };
  }

  return {
    title: tip.title,
    text: tip.text,
    status: 'Nästa drag',
  };
}

function loadDashboardProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
    const onboarding = JSON.parse(localStorage.getItem(ONBOARDING_KEY) || '{}');

    return {
      name: profile.name || onboarding.name || '',
      age: profile.age || onboarding.age || '',
      height: profile.height || onboarding.height || '',
      goal: profile.goal || onboarding.goal || '',
      activity: profile.activity || onboarding.activity || '',
      diet: profile.diet || onboarding.diet || '',
      goalWeight: profile.goalWeight || onboarding.goalWeight || '',
      targetDate: profile.targetDate || onboarding.targetDate || '',
      updatedAt: profile.updatedAt || onboarding.completedAt || null,
    };
  } catch {
    return {};
  }
}

function formatUpdatedAt(updatedAt) {
  if (!updatedAt) return 'Inte sparad ännu';

  const diffMs = Date.now() - updatedAt;
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMin < 1) return 'Uppdaterad nyss';
  if (diffMin === 1) return 'Uppdaterad för 1 min sedan';
  if (diffMin < 60) return `Uppdaterad för ${diffMin} min sedan`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return 'Uppdaterad för 1 timme sedan';
  if (diffHours < 24) return `Uppdaterad för ${diffHours} timmar sedan`;

  return `Uppdaterad ${new Date(updatedAt).toLocaleDateString('sv-SE')}`;
}

function getMissingProfileFields(profile) {
  const ordered = ['name', 'age', 'height', 'goal', 'activity', 'diet', 'goalWeight'];
  return ordered.filter((key) => !profile[key]);
}

function ProgressRing({ progress }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (circumference * progress) / 100;

  return (
    <div className={styles.ringWrap}>
      <svg viewBox="0 0 128 128" className={styles.ring} aria-hidden="true">
        <circle className={styles.ringTrack} cx="64" cy="64" r={radius} />
        <circle
          className={styles.ringFill}
          cx="64"
          cy="64"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
        />
      </svg>
    </div>
  );
}

function DailyFocusCard({ onLogWeight }) {
  const { loggedToday } = useStreak();
  const { profile, kcalGoal, proteinGoal } = useProfile();

  const focusText = profile.goal === 'muscle'
    ? `Ditt proteinmål är ${proteinGoal} g. Bygg dagen runt det.`
    : profile.goal === 'energy'
      ? `Håll dig inom ${kcalGoal} kcal så att energin håller hela dagen.`
      : `Ditt dagliga mål: ${kcalGoal} kcal och ${proteinGoal} g protein.`;

  return (
    <section className={styles.focusCard} aria-labelledby="today-title">
      <div className={styles.focusText}>
        <p className={styles.sectionEyebrow}>Idag</p>
        <h2 id="today-title" className={styles.focusTitle}>Håll dagen enkel</h2>
        <p className={styles.focusBody}>{focusText}</p>

        <div className={styles.focusMetrics}>
          <div className={styles.metricPill}>
            <span className={styles.metricLabel}>Kalorigräns</span>
            <span className={styles.metricValue}>{kcalGoal} kcal</span>
          </div>
          <div className={styles.metricPill}>
            <span className={styles.metricLabel}>Proteinmål</span>
            <span className={styles.metricValue}>{proteinGoal} g</span>
          </div>
        </div>

        <button type="button" className={styles.primaryAction} onClick={onLogWeight}>
          Logga dagens vikt
        </button>
      </div>

      <div className={styles.focusVisual}>
        <ProgressRing progress={loggedToday ? 100 : 0} />
        <div className={styles.ringCenter}>
          <span className={styles.ringValue}>{loggedToday ? '✓' : '–'}</span>
          <span className={styles.ringLabel}>{loggedToday ? 'loggad' : 'idag'}</span>
        </div>
      </div>
    </section>
  );
}

function ProfileCard({ onOpen }) {
  const [profile, setProfile] = useState(loadDashboardProfile);
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    function syncProfile() {
      setProfile(loadDashboardProfile());
      setHighlighted(true);
      window.setTimeout(() => setHighlighted(false), 1600);
    }

    window.addEventListener('storage', syncProfile);
    window.addEventListener('djur-i-juni:profile-updated', syncProfile);

    return () => {
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener('djur-i-juni:profile-updated', syncProfile);
    };
  }, []);

  const firstName = profile.name ? String(profile.name).split(' ')[0] : 'Din profil';
  const meta = [
    profile.age ? `${profile.age} år` : null,
    profile.height ? `${profile.height} cm` : null,
    profile.diet || null,
  ].filter(Boolean);
  const missingFields = getMissingProfileFields(profile);
  const completion = Math.round(((7 - missingFields.length) / 7) * 100);
  const initials = profile.name
    ? String(profile.name)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
    : 'DJ';
  const nextStepText = missingFields.length === 0
    ? 'Allt viktigt finns på plats.'
    : missingFields.length === 1
      ? `Nästa steg: lägg till ${PROFILE_FIELD_LABELS[missingFields[0]]}.`
      : `Nästa steg: lägg till ${PROFILE_FIELD_LABELS[missingFields[0]]} och ${missingFields.length - 1} till.`;

  return (
    <section
      className={[styles.profileCard, highlighted ? styles.profileCardUpdated : ''].join(' ')}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => event.key === 'Enter' && onOpen()}
    >
      <div className={styles.profileTop}>
        <div className={styles.profileIdentity}>
          <div className={styles.profileAvatar} aria-hidden="true">{initials}</div>
          <p className={styles.sectionEyebrow}>Profil</p>
          <h2 className={styles.profileTitle}>{firstName}</h2>
        </div>
        <span className={styles.profileEdit}>Redigera</span>
      </div>

      <p className={styles.profileUpdatedAt}>{formatUpdatedAt(profile.updatedAt)}</p>

      <div className={styles.profileCompletion}>
        <div className={styles.profileCompletionHead}>
          <span className={styles.profileCompletionText}>{completion}% komplett</span>
          <span className={styles.profileCompletionHint}>
            {missingFields.length === 0 ? 'Klar' : `${missingFields.length} kvar`}
          </span>
        </div>
        <div className={styles.profileCompletionTrack}>
          <div className={styles.profileCompletionFill} style={{ width: `${completion}%` }} />
        </div>
      </div>

      {meta.length > 0 && (
        <div className={styles.profileMeta}>
          {meta.map((item) => (
            <span key={item} className={styles.profileChip}>{item}</span>
          ))}
        </div>
      )}

      <div className={styles.profileGrid}>
        <div className={styles.profileStat}>
          <span className={styles.profileKey}>Fokus</span>
          <span className={styles.profileValue}>{GOAL_LABELS[profile.goal] || 'Sätt riktning'}</span>
        </div>
        <div className={styles.profileStat}>
          <span className={styles.profileKey}>Aktivitet</span>
          <span className={styles.profileValue}>{ACTIVITY_LABELS[profile.activity] || 'Lägg till nivå'}</span>
        </div>
        <div className={styles.profileStat}>
          <span className={styles.profileKey}>Målvikt</span>
          <span className={styles.profileValue}>{profile.goalWeight ? `${profile.goalWeight} kg` : 'Inte satt'}</span>
        </div>
        <div className={styles.profileStat}>
          <span className={styles.profileKey}>Måldatum</span>
          <span className={styles.profileValue}>{profile.targetDate || 'Flexibelt'}</span>
        </div>
      </div>
      <p className={styles.profileNextStep}>
        {nextStepText} <span className={styles.profileNoteInline}>Tryck för att justera utan att börja om.</span>
      </p>
    </section>
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
        <ProfileCard onOpen={() => setModal('profile')} />
        <DailyFocusCard onLogWeight={() => setModal('weight')} />
        <div className={styles.twoColumn}>
          <StreakBanner />
          <WeightJourney onOpen={() => setModal('weight')} />
        </div>
        <QuickStats />
        <div className={styles.bottomGrid}>
          <CoachTipCard />
          <MotivationTip />
        </div>
      </div>

      {modal === 'weight' && <WeightModal onClose={() => setModal(null)} />}
      {modal === 'profile' && <ProfileModal onClose={() => setModal(null)} />}
    </main>
  );
}
