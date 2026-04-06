import { useState } from 'react';
import {
  TrendingDown,
  Minus,
  TrendingUp,
} from 'lucide-react';
import s from '../Step.module.css';

const OPTIONS = [
  {
    value: 'lose',
    icon: TrendingDown,
    label: 'Gå ner i vikt',
    desc: 'Bränna fett, nå målvikt',
  },
  {
    value: 'maintain',
    icon: Minus,
    label: 'Hålla vikten',
    desc: 'Bibehåll nuvarande vikt',
  },
  {
    value: 'gain',
    icon: TrendingUp,
    label: 'Gå upp i vikt',
    desc: 'Bygga muskler, öka vikt',
  },
];

export default function StepWeightGoal({ data, onNext, submitLabel = 'Nästa' }) {
  const [weightGoal, setWeightGoal] = useState(data.weightGoal ?? '');

  return (
    <div className={s.step}>
      <p className={s.kicker}>Vart är du på väg?</p>
      <h2 className={s.title}>Vad vill du uppnå?</h2>
      <p className={s.subtitle}>Välj riktningen — vi räknar ut resten.</p>

      <div className={s.hypeStack}>
        {OPTIONS.map((o) => {
          const Icon = o.icon;

          return (
            <button
              type="button"
              key={o.value}
              className={[
                weightGoal === o.value ? s.hypeCardSelected : s.hypeCard,
                s.hypeCardRow,
              ].join(' ')}
              onClick={() => setWeightGoal(o.value)}
            >
              <span className={s.hypeCardIcon} aria-hidden="true">
                <Icon size={24} strokeWidth={1.5} />
              </span>
              <span className={s.hypeCardText}>
                <span className={s.hypeCardLabel}>{o.label}</span>
                <span className={s.hypeCardDesc}>{o.desc}</span>
              </span>
            </button>
          );
        })}
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
