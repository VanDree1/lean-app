import { useState } from 'react';
import {
  Flame,
  Dumbbell,
  Zap,
  Target,
} from 'lucide-react';
import s from '../Step.module.css';

const GOALS = [
  { value: 'fat_loss', icon: Flame, label: 'Bränna fett', desc: 'Minska kroppsfett' },
  { value: 'muscle', icon: Dumbbell, label: 'Bygga muskler', desc: 'Stärka kroppen' },
  { value: 'energy', icon: Zap, label: 'Mer energi', desc: 'Orka mer i vardagen' },
  { value: 'target', icon: Target, label: 'Nå målvikt', desc: 'Specifik målsättning' },
];

export default function StepGoal({ data, onNext, onChangeData, showFooter = true, submitLabel = 'Nästa' }) {
  const controlled = typeof onChangeData === 'function';
  const [localGoal, setLocalGoal] = useState(data.goal ?? '');
  const goal = controlled ? (data.goal ?? '') : localGoal;

  function updateGoal(value) {
    if (controlled) {
      onChangeData({ goal: value });
    } else {
      setLocalGoal(value);
    }
  }

  return (
    <div className={[s.step, !showFooter ? s.stepFooterless : ''].join(' ')}>
      <p className={s.kicker}>Mål</p>
      <h2 className={s.title}>Vad är ditt mål?</h2>
      <p className={s.subtitle}>Välj den riktning som känns mest relevant just nu.</p>

      <div className={s.hypeStack}>
        {GOALS.map((g) => {
          const Icon = g.icon;

          return (
            <button
              type="button"
              key={g.value}
              className={[
                goal === g.value ? s.hypeCardSelected : s.hypeCard,
                s.hypeCardRow,
              ].join(' ')}
              onClick={() => updateGoal(g.value)}
            >
              <span className={s.hypeCardIcon} aria-hidden="true">
                <Icon size={24} strokeWidth={1.5} />
              </span>
              <span className={s.hypeCardText}>
                <span className={s.hypeCardLabel}>{g.label}</span>
                <span className={s.hypeCardDesc}>{g.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      {showFooter && (
        <button
          className={s.btnPrimary}
          disabled={!goal}
          onClick={() => onNext({ goal })}
        >
          {submitLabel}
        </button>
      )}
    </div>
  );
}
