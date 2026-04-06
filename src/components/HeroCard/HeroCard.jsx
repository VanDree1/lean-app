import styles from './HeroCard.module.css';

const COPY_BY_GOAL = {
  fat_loss: {
    quote: 'Lugn konsekvens slår intensiv perfektion.',
    subtle: 'Håll det enkelt och jämnt.',
  },
  muscle: {
    quote: 'Bygg lugnt. Behåll rytmen.',
    subtle: 'Protein, struktur, ingen stress.',
  },
  energy: {
    quote: 'Mer energi börjar med mindre brus.',
    subtle: 'Sov, ät jämnt, håll dagen tydlig.',
  },
  target: {
    quote: 'Du bygger något hållbart nu.',
    subtle: 'En tydlig riktning gör dagen lättare.',
  },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'God natt';
  if (h < 11) return 'God morgon';
  if (h < 14) return 'God middag';
  if (h < 18) return 'God eftermiddag';
  return 'God kväll';
}

export default function HeroCard({ profile = {} }) {
  const goalCopy = COPY_BY_GOAL[profile.goal] ?? {
    quote: 'Det här behöver inte kännas högt. Bara tydligt.',
    subtle: 'Mindre brus. Mer riktning.',
  };
  const greeting = getGreeting();

  return (
    <section className={styles.card} aria-labelledby="overview-title">
      <div className={styles.glow} />
      <p className={styles.eyebrow}>Översikt</p>
      <p className={styles.greeting}>{greeting}{profile.name ? `, ${String(profile.name).split(' ')[0]}` : ''}</p>
      <h2 id="overview-title" className={styles.quote}>{goalCopy.quote}</h2>
      <p className={styles.subtle}>{goalCopy.subtle}</p>
    </section>
  );
}
