import { useEffect, useState } from 'react';
import s from '../Step.module.css';

const LOSE_PRESETS = [
  { value: 0.25, label: '0,25 kg/v', desc: 'Lugnt' },
  { value: 0.5,  label: '0,5 kg/v',  desc: 'Rekommenderat' },
  { value: 0.75, label: '0,75 kg/v', desc: 'Snabbt' },
  { value: 1.0,  label: '1,0 kg/v',  desc: 'Max rekommenderat' },
];

const GAIN_PRESETS = [
  { value: 0.1,  label: '0,1 kg/v',  desc: 'Lugnt (lean bulk)' },
  { value: 0.25, label: '0,25 kg/v', desc: 'Rekommenderat' },
  { value: 0.5,  label: '0,5 kg/v',  desc: 'Max rekommenderat' },
];

function calcTargetDate(currentWeight, goalWeight, pace, isGain) {
  const diff = isGain
    ? parseFloat(goalWeight) - parseFloat(currentWeight)
    : parseFloat(currentWeight) - parseFloat(goalWeight);
  if (!diff || diff <= 0 || !pace) return null;
  const weeks = diff / pace;
  const date = new Date();
  date.setDate(date.getDate() + Math.round(weeks * 7));
  return date;
}

function formatDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Step4GoalWeight({ data, onNext, onChangeData, showFooter = true, submitLabel = 'Nästa' }) {
  const controlled = typeof onChangeData === 'function';
  const isGain   = data.weightGoal === 'gain';
  const presets  = isGain ? GAIN_PRESETS : LOSE_PRESETS;

  const [localWeight, setLocalWeight] = useState(data.goalWeight ?? '');
  const [localPace, setLocalPace] = useState(data.pace ?? (isGain ? 0.25 : 0.5));
  const weight = controlled ? (data.goalWeight ?? '') : localWeight;
  const pace = controlled ? (data.pace ?? (isGain ? 0.25 : 0.5)) : localPace;

  const kg         = parseFloat(weight);
  const current    = parseFloat(data.currentWeight) || 0;
  const diff       = current > 0 && !isNaN(kg)
    ? Math.abs(current - kg).toFixed(1)
    : null;
  const valid      = !isNaN(kg) && kg >= 30 && kg <= 300 &&
    (isGain ? kg > current : kg < current);
  const overLimit  = !isGain && pace > 1.0;
  const pctOfBW    = current > 0 ? ((pace / current) * 100).toFixed(2) : null;
  const targetDate = valid ? calcTargetDate(data.currentWeight, weight, pace, isGain) : null;

  const diffLabel = diff !== null && parseFloat(diff) > 0
    ? isGain
      ? `${diff} kg upp`
      : `${diff} kg ner`
    : null;
  const targetDateIso = targetDate ? targetDate.toISOString().slice(0, 10) : '';

  useEffect(() => {
    if (!controlled) return;
    if (data.targetDate === targetDateIso) return;
    onChangeData({
      targetDate: targetDateIso,
    });
  }, [controlled, data.targetDate, onChangeData, targetDateIso]);

  function updateWeight(value) {
    if (controlled) {
      onChangeData({ goalWeight: value });
    } else {
      setLocalWeight(value);
    }
  }

  function updatePace(value) {
    if (controlled) {
      onChangeData({ pace: value });
    } else {
      setLocalPace(value);
    }
  }

  return (
    <div className={[s.step, !showFooter ? s.stepFooterless : ''].join(' ')}>
      <p className={s.kicker}>Målvikt</p>
      <h2 className={s.title}>{isGain ? 'Målvikt (uppgång)' : 'Målvikt'}</h2>
      <p className={s.subtitle}>
        Sätt en tydlig siffra och välj en hållbar takt.
      </p>

      <div className={s.bigWrap}>
        <label className={s.bigLabel} htmlFor="goal-weight-input">Målvikt</label>
        <input
          id="goal-weight-input"
          type="number" inputMode="decimal"
          className={s.bigInput}
          value={weight}
          onChange={(e) => updateWeight(e.target.value)}
          placeholder="0"
          autoFocus
          aria-label="Målvikt i kg"
        />
        <span className={s.bigUnit}>kg</span>
      </div>

      {diffLabel && (
        <p className={[s.hint, s.hintCompact].join(' ')}>
          <span className={s.hintAccent}>{diffLabel}</span>
        </p>
      )}

      <div className={s.field}>
        <span className={s.label}>{isGain ? 'Viktuppgångstakt' : 'Viktnedgångstakt'}</span>
        <div className={s.pacePresets}>
          {presets.map((p) => (
            <button type="button" key={p.value}
              className={pace === p.value ? s.pacePresetSelected : s.pacePreset}
              onClick={() => updatePace(p.value)}>
              <span className={s.pacePresetDesc}>{p.desc}</span>
              <span className={s.pacePresetLabel}>{p.label}</span>
              <span className={s.pacePresetDot} aria-hidden="true" />
            </button>
          ))}
        </div>

        <p className={s.paceInfo}>
          {isGain
            ? 'Rekommenderad takt: upp till 0,5 kg/vecka'
            : 'Rekommenderad takt: 0,5 till 1 kg/vecka'}
        </p>

        {pctOfBW && (
          <p className={[s.pacePct, s.pacePctCompact].join(' ')}>
            Cirka <strong>{pctOfBW}%</strong> av kroppsvikten per vecka
          </p>
        )}
      </div>

      {overLimit && (
        <p className={s.paceWarning}>
          Över 1 kg per vecka blir ofta svårare att hålla i längden.
          <span className={s.paceWarningSrc}>En lugnare takt brukar ge bättre kvalitet över tid.</span>
        </p>
      )}

      {targetDate && (
        <p className={s.dateHint}>
          Ungefär klar:{' '}
          <span className={s.hintAccent}>{formatDate(targetDate)}</span>
        </p>
      )}

      {showFooter && (
        <button className={s.btnPrimary}
          disabled={!valid}
          onClick={() => onNext({
            goalWeight: weight,
            pace,
            targetDate: targetDateIso,
          })}>
          {submitLabel}
        </button>
      )}
    </div>
  );
}
