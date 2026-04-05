import { useStreak } from '../../hooks/useStreak';
import { useProfile } from '../../hooks/useProfile';
import { useWeightLog } from '../Weight/useWeightLog';
import { useCountUp } from '../../hooks/useCountUp';
import styles from './QuickStats.module.css';

const GOAL_DETAIL = {
  fat_loss: 'Baserat på din kropp och fettförlustmål.',
  muscle:   'Baserat på din kropp och muskelmål.',
  energy:   'Baserat på din kropp och energimål.',
  target:   'Baserat på din kropp och målvikt.',
};

const STREAK_DETAIL = {
  0: 'Logga vikten idag för att starta en streak.',
  1: 'Bra start. En dag i rad.',
  7: 'En vecka. Det börjar sätta sig.',
};

function getStreakDetail(streak) {
  if (streak === 0) return STREAK_DETAIL[0];
  if (streak >= 7)  return STREAK_DETAIL[7];
  if (streak === 1) return STREAK_DETAIL[1];
  return `${streak} dagar i rad. Håll rytmen.`;
}

function GoalCard({ label, unit, value, detail }) {
  const displayed = useCountUp(value, 900);

  return (
    <section className={styles.card} aria-label={label}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.goalText}>per dag</span>
      </div>
      <div className={styles.valueRow}>
        <span className={styles.value}>{displayed.toLocaleString('sv-SE')}</span>
        <span className={styles.unit}>{unit}</span>
      </div>
      <p className={styles.detail}>{detail}</p>
    </section>
  );
}

function StreakCard({ streak }) {
  const displayed = useCountUp(streak, 600);

  return (
    <section className={styles.card} aria-label="Streak">
      <div className={styles.head}>
        <span className={styles.label}>Streak</span>
        <span className={styles.goalText}>dagar</span>
      </div>
      <div className={styles.valueRow}>
        <span className={styles.value}>{displayed}</span>
        <span className={styles.unit}>dagar</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${Math.min(100, (streak / 7) * 100)}%` }} />
      </div>
      <p className={styles.detail}>{getStreakDetail(streak)}</p>
    </section>
  );
}

function WeightLostCard() {
  const { lost, START_WEIGHT } = useWeightLog();
  const displayed = useCountUp(Math.round(Math.max(0, lost) * 10), 900) / 10;
  const isGain = lost < 0;

  return (
    <section className={styles.card} aria-label="Viktutveckling">
      <div className={styles.head}>
        <span className={styles.label}>Viktutveckling</span>
        <span className={styles.goalText}>från {START_WEIGHT} kg</span>
      </div>
      <div className={styles.valueRow}>
        <span className={styles.value}>{isGain ? '+' : '-'}{displayed.toFixed(1)}</span>
        <span className={styles.unit}>kg</span>
      </div>
      <p className={styles.detail}>
        {isGain
          ? 'Viktuppgång sedan start. Justera vid behov.'
          : lost === 0
            ? 'Ingen förändring ännu. Håll ramen konsekvent.'
            : `${Math.abs(lost).toFixed(1)} kg sedan start. Bra riktning.`}
      </p>
    </section>
  );
}

export default function QuickStats() {
  const { streak } = useStreak();
  const { profile, kcalGoal, proteinGoal } = useProfile();

  const goalDetail = GOAL_DETAIL[profile.goal] || 'Baserat på din profil.';

  return (
    <div className={styles.grid}>
      <GoalCard label="Kalorigräns" unit="kcal" value={kcalGoal} detail={goalDetail} />
      <GoalCard label="Proteinmål"  unit="g"    value={proteinGoal} detail={goalDetail} />
      <StreakCard streak={streak} />
      <WeightLostCard />
    </div>
  );
}
