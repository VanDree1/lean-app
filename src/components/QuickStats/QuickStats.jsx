import { useProfile } from '../../hooks/useProfile';
import { useCountUp } from '../../hooks/useCountUp';
import styles from './QuickStats.module.css';

const GOAL_DETAIL = {
  fat_loss: 'Baserat på din kropp och fettförlustmål.',
  muscle:   'Baserat på din kropp och muskelmål.',
  energy:   'Baserat på din kropp och energimål.',
  target:   'Baserat på din kropp och målvikt.',
};

function GoalCard({ label, unit, value, detail }) {
  const displayed = useCountUp(value, 900);

  return (
    <section className={styles.card} aria-label={label}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.valueRow}>
        <span className={styles.value}>{displayed.toLocaleString('sv-SE')}</span>
        <span className={styles.unit}>{unit}</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: '10%' }} />
      </div>
      <p className={styles.detail}>{detail}</p>
    </section>
  );
}

export default function QuickStats() {
  const { profile, kcalGoal, proteinGoal } = useProfile();

  const goalDetail = GOAL_DETAIL[profile.goal] || 'Baserat på din profil.';

  return (
    <div className={styles.grid}>
      <GoalCard label="Kalorier" unit="KCAL" value={kcalGoal} detail={goalDetail} />
      <GoalCard label="Protein" unit="G" value={proteinGoal} detail={goalDetail} />
    </div>
  );
}
