import { useWeightLog } from '../Weight/useWeightLog';
import { useStreak } from '../../hooks/useStreak';
import styles from './Achievements.module.css';

export default function Achievements() {
  const { current, progress, START_WEIGHT, GOAL_WEIGHT } = useWeightLog();
  const { streak } = useStreak();

  const lost = START_WEIGHT - current;
  const totalToLose = START_WEIGHT - GOAL_WEIGHT;

  const badges = [
    {
      icon: '🏁',
      title: 'Startskottet',
      desc: 'Konto skapat',
      unlocked: true,
    },
    {
      icon: '🥇',
      title: 'Första kg borta',
      desc: `${Math.max(0, lost).toFixed(1)} / 1 kg`,
      unlocked: lost >= 1,
    },
    {
      icon: '🔥',
      title: '7-dagars streak',
      desc: `${streak} / 7 dagar`,
      unlocked: streak >= 7,
    },
    {
      icon: '🎯',
      title: 'Halvvägs dit',
      desc: `${progress.toFixed(0)}% / 50%`,
      unlocked: progress >= 50,
    },
    {
      icon: '💪',
      title: 'Protein-mästare',
      desc: '7 dagar på mål',
      unlocked: false,
    },
    {
      icon: '⚡',
      title: '30-dagars streak',
      desc: `${streak} / 30 dagar`,
      unlocked: streak >= 30,
    },
    {
      icon: '🏆',
      title: 'Målet nått!',
      desc: `${Math.max(0, lost).toFixed(1)} / ${totalToLose.toFixed(1)} kg`,
      unlocked: progress >= 100,
    },
    {
      icon: '🌟',
      title: '5 kg tappat',
      desc: `${Math.max(0, lost).toFixed(1)} / 5 kg`,
      unlocked: lost >= 5,
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const latestUnlocked = [...badges].reverse().find((b) => b.unlocked) ?? badges[0];

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Achievements</p>
          <h2 className={styles.title}>Senaste bedrift: {latestUnlocked.title} ✓</h2>
        </div>
        <span className={styles.count}>{unlockedCount}/{badges.length}</span>
      </div>
      <div className={styles.grid}>
        {badges.map((b) => (
          <div
            key={b.title}
            className={[styles.badge, b.unlocked ? styles.unlocked : styles.locked].join(' ')}
            title={b.desc}
          >
            <span className={styles.badgeIcon}>{b.icon}</span>
            <span className={styles.badgeTitle}>{b.title}</span>
            {!b.unlocked && (
              <span className={styles.badgeDesc}>{b.desc}</span>
            )}
            {b.unlocked && (
              <span className={styles.badgeCheck}>✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
