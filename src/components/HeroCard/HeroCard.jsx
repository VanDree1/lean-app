import styles from './HeroCard.module.css';
import { useGoalTone } from '../../hooks/useGoalTone';
import { getFirstName } from '../../utils/displayName';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'God natt';
  if (h < 11) return 'God morgon';
  if (h < 14) return 'God middag';
  if (h < 18) return 'God eftermiddag';
  return 'God kväll';
}

export default function HeroCard({ profile = {} }) {
  const tone = useGoalTone(profile);
  const greeting = getGreeting();
  const firstName = getFirstName(profile.name);

  return (
    <section className={styles.card} aria-labelledby="overview-title">
      <div className={styles.glow} />
      <p className={styles.eyebrow}>Översikt</p>
      <p className={styles.greeting}>{greeting}{firstName ? `, ${firstName}` : ''}</p>
      <h2 id="overview-title" className={styles.quote}>{tone.hero.quote}</h2>
      <p className={styles.subtle}>{tone.hero.subtle}</p>
    </section>
  );
}
