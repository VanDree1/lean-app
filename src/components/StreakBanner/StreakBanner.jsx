import { useStreak } from '../../hooks/useStreak';
import styles from './StreakBanner.module.css';

export default function StreakBanner() {
  const { streak, loggedToday } = useStreak();
  const danger = !loggedToday && streak > 0;
  const flameScale = Math.min(1.35, 1 + streak * 0.04);

  if (streak === 0 && loggedToday === false) return null;

  return (
    <section className={[styles.banner, danger ? styles.danger : ''].join(' ')} aria-label="Streak">
      <span
        className={[styles.flame, danger ? styles.flameDim : ''].join(' ')}
        style={{ '--flame-scale': flameScale }}
      >
        ●
      </span>
      <div className={styles.text}>
        {danger ? (
          <>
            <span className={styles.warning}>Logga idag för att behålla rytmen.</span>
            <span className={styles.sub}>{streak} dagar i rad. En liten insats räcker.</span>
          </>
        ) : (
          <>
            <span className={styles.count}>{streak} {streak === 1 ? 'dag' : 'dagar'} i rad</span>
            <span className={styles.sub}>
              {streak >= 7  ? 'Det sitter.' :
               streak >= 3  ? 'Bra rytm.' :
                              'Bra start.'}
            </span>
          </>
        )}
      </div>
      <div className={styles.dots}>
        {Array.from({ length: 7 }, (_, i) => (
          <span
            key={i}
            className={[styles.dot, i < streak ? styles.dotFilled : ''].join(' ')}
          />
        ))}
      </div>
    </section>
  );
}
