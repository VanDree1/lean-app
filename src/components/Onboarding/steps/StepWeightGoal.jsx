import { useState } from 'react';
import s from '../Step.module.css';

const OPTIONS = [
  {
    value: 'lose',
    icon: '📉',
    label: 'Gå ner i vikt',
    desc: 'Bränna fett, nå målvikt',
  },
  {
    value: 'maintain',
    icon: '⚖️',
    label: 'Hålla vikten',
    desc: 'Bibehåll nuvarande vikt',
  },
  {
    value: 'gain',
    icon: '📈',
    label: 'Gå upp i vikt',
    desc: 'Bygga muskler, öka vikt',
  },
];

export default function StepWeightGoal({ data, onNext, submitLabel = 'Nästa' }) {
  const [weightGoal, setWeightGoal] = useState(data.weightGoal ?? '');

  return (
    <div className={s.step}>
      <h2 className={s.title}>Vad är ditt viktmål?</h2>
      <p className={s.subtitle}>Välj den riktning du vill hålla över tid.</p>

      <div className={s.hypeStack}>
        {OPTIONS.map((o) => (
          <button
            type="button"
            key={o.value}
            className={[
              weightGoal === o.value ? s.hypeCardSelected : s.hypeCard,
              s.hypeCardRow,
            ].join(' ')}
            onClick={() => setWeightGoal(o.value)}
          >
            <span className={s.hypeCardIcon}>{o.icon}</span>
            <span className={s.hypeCardText}>
              <span className={s.hypeCardLabel}>{o.label}</span>
              <span className={s.hypeCardDesc}>{o.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <button
        className={s.btnPrimary}
        disabled={!weightGoal}
        onClick={() => onNext({ weightGoal })}
      >
        {submitLabel}
      </button>
    </div>
  );
}
