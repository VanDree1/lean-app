import { useState } from 'react';
import styles from './MotivationTip.module.css';

const ITEMS = [
  { label: 'Vatten', text: 'Ett glas vatten direkt på morgonen gör resten enklare.' },
  { label: 'Sömn', text: '7 till 9 timmars sömn gör hunger och energi lättare att hantera.' },
  { label: 'Måltider', text: 'Börja med protein och grönsaker.' },
  { label: 'Promenad', text: 'En kort promenad efter maten räcker långt.' },
  { label: 'Tempo', text: 'Ät långsammare. Kroppen hinner ikapp bättre då.' },
  { label: 'Träning', text: 'Styrketräning hjälper dig behålla det du vill ha kvar.' },
  { label: 'Vikt', text: 'Dagens siffra betyder mindre än trenden över tid.' },
  { label: 'Protein', text: 'Protein är ofta den enklaste vägen till bättre mättnad.' },
];

export default function MotivationTip() {
  const [dayIdx] = useState(() => Math.floor(Date.now() / 86_400_000) % ITEMS.length);
  const { label, text } = ITEMS[dayIdx];

  return (
    <section className={styles.card} aria-label="Dagens tips">
      <p className={styles.eyebrow}>Dagens tips</p>
      <p className={styles.label}>{label}</p>
      <p className={styles.tip}>{text}</p>
    </section>
  );
}
