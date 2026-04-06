import { useState } from 'react';
import {
  Flame,
  Dumbbell,
  ShieldPlus,
  Zap,
  Target,
} from 'lucide-react';
import s from '../Step.module.css';
import { GOAL_OPTIONS } from '../../../utils/goals';

const GOAL_ICONS = {
  fat_loss: Flame,
  recomposition: ShieldPlus,
  muscle: Dumbbell,
  energy: Zap,
  target: Target,
};

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
      <p className={s.kicker}>Varför gör du det här?</p>
      <h2 className={s.title}>Vad driver dig?</h2>
      <p className={s.subtitle}>Det här styr hur vi sätter dina dagliga mål.</p>

      <div className={s.hypeStack}>
        {GOAL_OPTIONS.map((g) => {
          const Icon = GOAL_ICONS[g.value] ?? Target;

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
