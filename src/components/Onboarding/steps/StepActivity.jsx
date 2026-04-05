import { useState } from 'react';
import s from '../Step.module.css';

const LEVELS = [
  { value: 'sedentary',   icon: '🛋️', label: 'Stillasittande', desc: 'Kontor, lite rörelse' },
  { value: 'light',       icon: '🚶', label: 'Måttligt aktiv',  desc: 'Tränar 1–3×/vecka' },
  { value: 'very_active', icon: '🏃', label: 'Mycket aktiv',    desc: 'Tränar 4+/vecka' },
];

export default function StepActivity({ data, onNext, submitLabel = 'Nästa' }) {
  const [activity, setActivity] = useState(data.activity ?? '');

  return (
    <div className={s.step}>
      <h2 className={s.title}>Hur aktiv är du?</h2>
      <p className={s.subtitle}>Din nivå hjälper oss sätta rätt ram för dagen.</p>

      <div className={s.hypeStack}>
        {LEVELS.map((l) => (
          <button
            type="button"
            key={l.value}
            className={[
              activity === l.value ? s.hypeCardSelected : s.hypeCard,
              s.hypeCardRow,
            ].join(' ')}
            onClick={() => setActivity(l.value)}
          >
            <span className={s.hypeCardIcon}>{l.icon}</span>
            <span className={s.hypeCardText}>
              <span className={s.hypeCardLabel}>{l.label}</span>
              <span className={s.hypeCardDesc}>{l.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <button
        className={s.btnPrimary}
        disabled={!activity}
        onClick={() => onNext({ activity })}
      >
        {submitLabel}
      </button>
    </div>
  );
}
