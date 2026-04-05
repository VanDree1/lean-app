import { useWeightLog } from '../Weight/useWeightLog';
import RingProgress from './RingProgress';
import Sparkline from './Sparkline';
import Icon from '../Icon';
import styles from './WeightCard.module.css';

export default function WeightCard({ onClick }) {
  const { recent, current, progress, GOAL_WEIGHT, START_WEIGHT } = useWeightLog();
  const totalToLose = START_WEIGHT - GOAL_WEIGHT;
  const lost = parseFloat((START_WEIGHT - current).toFixed(1));

  return (
    <div className={styles.card} onClick={onClick}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>

      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <Icon name="scale" size={18} />
        </div>
        <div>
          <p className={styles.cardTitle}>Vikt</p>
          <p className={styles.cardGoal}>Mål {GOAL_WEIGHT} kg</p>
        </div>
        <span className={styles.action}>Logga →</span>
      </div>

      <RingProgress current={current} goal={GOAL_WEIGHT} progress={progress} />

      <div className={styles.sparkWrap}>
        <Sparkline entries={recent} />
      </div>

      <div className={styles.footer}>
        <span className={styles.footerStat}>
          <span className={styles.footerVal}>{Math.max(0, lost).toFixed(1)}</span>
          <span className={styles.footerUnit}> av {totalToLose} kg borta</span>
        </span>
        <span className={styles.footerPct}>{progress.toFixed(0)}%</span>
      </div>
    </div>
  );
}
