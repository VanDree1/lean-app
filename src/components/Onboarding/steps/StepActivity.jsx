import { useState } from 'react';
import {
  Briefcase,
  PersonStanding,
  Dumbbell,
} from 'lucide-react';
import s from '../Step.module.css';

const LEVELS = [
  { value: 'sedentary', icon: Briefcase, label: 'Stillasittande', desc: 'Kontor, lite rörelse' },
  { value: 'light', icon: PersonStanding, label: 'Måttligt aktiv', desc: 'Tränar 1–3×/vecka' },
  { value: 'very_active', icon: Dumbbell, label: 'Mycket aktiv', desc: 'Tränar 4+/vecka' },
];

export default function StepActivity({ data, onNext, onChangeData, showFooter = true, submitLabel = 'Nästa' }) {
  const controlled = typeof onChangeData === 'function';
  const [localActivity, setLocalActivity] = useState(data.activity ?? '');
  const activity = controlled ? (data.activity ?? '') : localActivity;

  function updateActivity(value) {
    if (controlled) {
      onChangeData({ activity: value });
    } else {
      setLocalActivity(value);
    }
  }

  return (
    <div className={[s.step, !showFooter ? s.stepFooterless : ''].join(' ')}>
      <p className={s.kicker}>Din vardag</p>
      <h2 className={s.title}>Hur ser din vardag ut?</h2>
      <p className={s.subtitle}>Avgör hur mycket energi din kropp behöver dagligen.</p>

      <div className={s.hypeStack}>
        {LEVELS.map((l) => {
          const Icon = l.icon;

          return (
            <button
              type="button"
              key={l.value}
              className={[
                activity === l.value ? s.hypeCardSelected : s.hypeCard,
                s.hypeCardRow,
              ].join(' ')}
              onClick={() => updateActivity(l.value)}
            >
              <span className={s.hypeCardIcon} aria-hidden="true">
                <Icon size={24} strokeWidth={1.5} />
              </span>
              <span className={s.hypeCardText}>
                <span className={s.hypeCardLabel}>{l.label}</span>
                <span className={s.hypeCardDesc}>{l.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      {showFooter && (
        <button
          className={s.btnPrimary}
          disabled={!activity}
          onClick={() => onNext({ activity })}
        >
          {submitLabel}
        </button>
      )}
    </div>
  );
}
