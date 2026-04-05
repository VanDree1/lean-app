import { useStreak } from '../../hooks/useStreak';
import { useCountUp } from '../../hooks/useCountUp';
import styles from './QuickStats.module.css';

function StatCard({ label, unit, goal, current, animate, detail }) {
  const displayed = useCountUp(animate ? current : 0, 900);
  const shown = animate ? displayed : current;
  const pct = Math.min(100, (current / goal) * 100);
  const remainder = Math.max(0, goal - current);

  return (
    <section className={styles.card} aria-label={label}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.goalText}>Mål {goal} {unit}</span>
      </div>
      <div className={styles.valueRow}>
        <span className={styles.value}>{shown.toLocaleString('sv-SE')}</span>
        <span className={styles.unit}>{unit}</span>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.metaValue}>{remainder} kvar</span>
        <span className={styles.metaValue}>{Math.round(pct)}%</span>
      </div>

      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>

      <p className={styles.detail}>{detail}</p>
    </section>
  );
}

export default function QuickStats() {
  const { streak } = useStreak();

  const STATS = [
    {
      label: 'Protein',
      unit: 'g',
      goal: 160,
      current: 142,
      animate: true,
      detail: '18 g kvar. Ett enkelt mål med protein räcker.',
    },
    {
      label: 'Kalorier',
      unit: 'kcal',
      goal: 2100,
      current: 1850,
      animate: true,
      detail: '250 kcal kvar. Gott om marginal för resten av dagen.',
    },
    {
      label: 'Streak',
      unit: 'dagar',
      goal: 7,
      current: streak,
      animate: false,
      detail: 'En loggning idag håller rytmen levande.',
    },
  ];

  return (
    <div className={styles.grid}>
      {STATS.map((s) => (
        <StatCard
          key={s.label}
          {...s}
        />
      ))}
    </div>
  );
}
