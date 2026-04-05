import styles from './WeightProgress.module.css';

export default function WeightProgress({ current, start, goal, lost, progress }) {
  const remaining = Math.max(0, current - goal).toFixed(1);

  return (
    <div className={styles.section}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{current.toFixed(1)}</div>
          <div className={styles.statLabel}>Nuvarande kg</div>
        </div>
        <div className={styles.stat}>
          <div className={`${styles.statValue} ${lost > 0 ? styles.accent : ''}`}>
            {lost > 0 ? `−${lost.toFixed(1)}` : '0'}
          </div>
          <div className={styles.statLabel}>Tappat kg</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{remaining}</div>
          <div className={styles.statLabel}>Kvar till mål</div>
        </div>
      </div>

      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.labels}>
        <span>{start} kg</span>
        <span>{progress.toFixed(0)}%</span>
        <span>Mål {goal} kg</span>
      </div>
    </div>
  );
}
