import { useState } from 'react';
import styles from './HeroCard.module.css';

const QUOTES = [
  'Lugn konsekvens slår intensiv perfektion.',
  'Det här behöver inte kännas högt. Bara tydligt.',
  'Små beslut ska kännas lätta att hålla.',
  'Du bygger något hållbart nu.',
  'Lägg energi på det som betyder något idag.',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'God natt';
  if (h < 11) return 'God morgon';
  if (h < 14) return 'God middag';
  if (h < 18) return 'God eftermiddag';
  return 'God kväll';
}

function loadName() {
  try {
    const raw = localStorage.getItem('djur-i-juni:onboarding');
    return raw ? JSON.parse(raw).name?.split(' ')[0] || '' : '';
  } catch { return ''; }
}

export default function HeroCard() {
  const [name] = useState(loadName);
  const [dayIdx] = useState(() => Math.floor(Date.now() / 86_400_000) % QUOTES.length);
  const quote = QUOTES[dayIdx];
  const greeting = getGreeting();

  return (
    <section className={styles.card} aria-labelledby="overview-title">
      <div className={styles.glow} />
      <p className={styles.eyebrow}>Overview</p>
      <p className={styles.greeting}>
        {greeting}{name ? `, ${name}` : ''}
      </p>
      <h2 id="overview-title" className={styles.quote}>{quote}</h2>
      <p className={styles.subtle}>Mindre brus. Mer riktning. En sak i taget.</p>
    </section>
  );
}
