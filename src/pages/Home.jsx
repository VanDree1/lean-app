import { useState } from 'react';
import HeroCard from '../components/HeroCard/HeroCard';
import QuickStats from '../components/QuickStats/QuickStats';
import StreakBanner from '../components/StreakBanner/StreakBanner';
import MotivationTip from '../components/MotivationTip/MotivationTip';
import WeightModal from '../components/Weight/WeightModal';
import { useWeightLog } from '../components/Weight/useWeightLog';
import { useStreak } from '../hooks/useStreak';
import { useCountUp } from '../hooks/useCountUp';
import styles from './Home.module.css';

const TODAY_TARGETS = {
  calories: 1850,
  calorieGoal: 2100,
  protein: 142,
  proteinGoal: 160,
};

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
  const progress = Math.min(100, (TODAY_TARGETS.calories / TODAY_TARGETS.calorieGoal) * 100);
  const caloriesLeft = Math.max(0, TODAY_TARGETS.calorieGoal - TODAY_TARGETS.calories);
  const proteinLeft = Math.max(0, TODAY_TARGETS.proteinGoal - TODAY_TARGETS.protein);
  const success = loggedToday && TODAY_TARGETS.calories <= TODAY_TARGETS.calorieGoal;

  return (
    <section className={styles.focusCard} aria-labelledby="today-title">
      <div className={styles.focusText}>
        <p className={styles.sectionEyebrow}>Today</p>
        <h2 id="today-title" className={styles.focusTitle}>Håll dagen enkel</h2>
        <p className={styles.focusBody}>
          {TODAY_TARGETS.calories} kcal loggat idag. {caloriesLeft} kcal återstår för att stänga dagen inom ramen.
        </p>

        <div className={styles.focusMetrics}>
          <div className={styles.metricPill}>
            <span className={styles.metricLabel}>Nästa fokus</span>
            <span className={styles.metricValue}>{proteinLeft} g protein kvar</span>
          </div>
          <div className={styles.metricPill}>
            <span className={styles.metricLabel}>Status</span>
            <span className={styles.metricValue}>{success ? 'I balans' : 'Håll kursen'}</span>
          </div>
        </div>

        <button type="button" className={styles.primaryAction} onClick={onLogWeight}>
          Logga dagens vikt
        </button>
      </div>

      <div className={styles.focusVisual}>
        <ProgressRing progress={progress} />
        <div className={styles.ringCenter}>
          <span className={styles.ringValue}>{Math.round(progress)}%</span>
          <span className={styles.ringLabel}>inom ramen</span>
        </div>
      </div>
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
          <p className={styles.sectionEyebrow}>Weight</p>
          <h2 className={styles.weightValue}>
            {currentDisplay.toFixed(1)}
            <span className={styles.weightUnit}>kg</span>
          </h2>
        </div>
        <div className={styles.weightBadge}>{progress.toFixed(0)}% klart</div>
      </div>

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

function DailyNote() {
  const { loggedToday } = useStreak();

  return (
    <section className={styles.noteCard}>
      <p className={styles.sectionEyebrow}>Today note</p>
      <h3 className={styles.noteTitle}>{loggedToday ? 'Det viktigaste är redan gjort' : 'En liten loggning räcker'}</h3>
      <p className={styles.noteText}>
        {loggedToday
          ? 'Behåll samma lugna rytm. Det enkla som upprepas blir det som håller.'
          : 'Tänk inte större än nödvändigt. Logga, håll ramen och gå vidare.'}
      </p>
    </section>
  );
}

export default function Home() {
  const [modal, setModal] = useState(null);

  return (
    <main className={styles.main}>
      <div className={styles.stack}>
        <HeroCard />
        <DailyFocusCard onLogWeight={() => setModal('weight')} />
        <div className={styles.twoColumn}>
          <StreakBanner />
          <WeightJourney onOpen={() => setModal('weight')} />
        </div>
        <QuickStats />
        <div className={styles.bottomGrid}>
          <DailyNote />
          <MotivationTip />
        </div>
      </div>

      {modal === 'weight' && <WeightModal onClose={() => setModal(null)} />}
    </main>
  );
}
