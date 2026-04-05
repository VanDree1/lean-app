import { useState } from 'react';
import s from '../Step.module.css';

const GOALS = [
  { value: 'fat_loss', icon: '🔥', label: 'Bränna fett',  desc: 'Minska kroppsfett' },
  { value: 'muscle',   icon: '💪', label: 'Bygga muskler', desc: 'Stärka kroppen' },
  { value: 'energy',   icon: '⚡', label: 'Mer energi',    desc: 'Orka mer i vardagen' },
  { value: 'target',   icon: '🎯', label: 'Nå målvikt',    desc: 'Specifik målsättning' },
];

export default function StepGoal({ data, onNext, submitLabel = 'Nästa' }) {
  const [goal, setGoal] = useState(data.goal ?? '');

  return (
    <div className={s.step}>
      <h2 className={s.title}>Vad är ditt mål?</h2>
      <p className={s.subtitle}>Välj den riktning som känns mest relevant just nu.</p>

      <div className={s.hypeGrid}>
        {GOALS.map((g) => (
          <button
            type="button"
            key={g.value}
            className={goal === g.value ? s.hypeCardSelected : s.hypeCard}
            onClick={() => setGoal(g.value)}
          >
            <span className={s.hypeCardIcon}>{g.icon}</span>
            <span className={s.hypeCardLabel}>{g.label}</span>
            <span className={s.hypeCardDesc}>{g.desc}</span>
          </button>
        ))}
      </div>

      <button
        className={s.btnPrimary}
        disabled={!goal}
        onClick={() => onNext({ goal })}
      >
        {submitLabel}
      </button>
    </div>
  );
}
