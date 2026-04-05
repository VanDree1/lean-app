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
const HEALTH_FACT_CACHE_KEY = 'djur-i-juni:health-fact';
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

const HEALTH_TOPICS = [
  {
    title: 'Protein',
    sourceUrl: 'https://sv.wikipedia.org/wiki/Protein',
    fallback: 'Protein bidrar till att bygga upp och bevara kroppens vävnader, inklusive muskler.',
  },
  {
    title: 'Sömn',
    sourceUrl: 'https://sv.wikipedia.org/wiki/S%C3%B6mn',
    fallback: 'Sömn påverkar både hunger, återhämtning och hur lätt det känns att hålla rutiner.',
  },
  {
    title: 'Promenad',
    sourceUrl: 'https://sv.wikipedia.org/wiki/Promenad',
    fallback: 'Regelbundna promenader kan vara ett enkelt sätt att öka rörelse utan att skapa mycket friktion.',
  },
  {
    title: 'Styrketräning',
    sourceUrl: 'https://sv.wikipedia.org/wiki/Styrketr%C3%A4ning',
    fallback: 'Styrketräning används ofta för att bygga styrka, muskelmassa och funktion över tid.',
  },
  {
    title: 'Vatten',
    sourceUrl: 'https://sv.wikipedia.org/wiki/Vatten',
    fallback: 'Vatten är avgörande för kroppens normala funktioner och påverkar bland annat temperaturreglering och transport i kroppen.',
  },
];

function getHealthTopicForToday() {
  return HEALTH_TOPICS[Math.floor(Date.now() / 86_400_000) % HEALTH_TOPICS.length];
}

function readCachedHealthFact() {
  try {
    const raw = localStorage.getItem(HEALTH_FACT_CACHE_KEY);
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
  const firstSentence = clean.match(/.+?[.!?](?:\s|$)/)?.[0]?.trim() || clean;
  return firstSentence.length > 180 ? `${firstSentence.slice(0, 177).trim()}...` : firstSentence;
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

function DidYouKnowCard() {
  const [fact, setFact] = useState(() => {
    const cached = readCachedHealthFact();
    if (cached) return cached;

    const topic = getHealthTopicForToday();
    return {
      title: topic.title,
      text: topic.fallback,
      sourceLabel: 'Arkiv',
      sourceUrl: topic.sourceUrl,
    };
  });

  useEffect(() => {
    const cached = readCachedHealthFact();
    if (isFreshFact(cached)) {
      setFact(cached);
      return undefined;
    }

    const topic = getHealthTopicForToday();
    const controller = new AbortController();

    async function loadFact() {
      try {
        const response = await fetch(`https://sv.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic.title)}`, {
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
          sourceLabel: 'Wikipedia',
          sourceUrl: data.content_urls?.desktop?.page || topic.sourceUrl,
          fetchedAt: Date.now(),
        };

        localStorage.setItem(HEALTH_FACT_CACHE_KEY, JSON.stringify(nextFact));
        setFact(nextFact);
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

        setFact(fallbackFact);
      }
    }

    loadFact();

    return () => controller.abort();
  }, []);

  return (
    <section className={styles.noteCard}>
      <div className={styles.noteHeader}>
        <p className={styles.sectionEyebrow}>Visste du att</p>
        <span className={styles.noteSource}>{fact.sourceLabel}</span>
      </div>
      <h3 className={styles.noteTitle}>{fact.title}</h3>
      <p className={styles.noteText}>{fact.text}</p>
      <a
        className={styles.noteLink}
        href={fact.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        Läs källa
      </a>
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
          <DidYouKnowCard />
          <MotivationTip />
        </div>
      </div>

      {modal === 'weight' && <WeightModal onClose={() => setModal(null)} />}
      {modal === 'profile' && <ProfileModal onClose={() => setModal(null)} />}
    </main>
  );
}
