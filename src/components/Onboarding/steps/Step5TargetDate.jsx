import { useState } from 'react';
import s from '../Step.module.css';

function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function calcKgPerWeek(targetDate, currentWeight, goalWeight) {
  const weeks = (new Date(targetDate) - new Date()) / (7 * 24 * 60 * 60 * 1000);
  if (weeks < 1) return null;
  const diff = parseFloat(currentWeight) - parseFloat(goalWeight);
  return diff > 0 ? (diff / weeks).toFixed(2) : null;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('sv-SE', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function Step5TargetDate({ data, onNext }) {
  const [date, setDate] = useState(data.targetDate ?? '');
  const kgPerWeek = date ? calcKgPerWeek(date, data.currentWeight, data.goalWeight) : null;
  const valid = !!date;

  let hint = ' ';
  if (kgPerWeek && parseFloat(kgPerWeek) > 0) {
    const pace = parseFloat(kgPerWeek);
    const paceLabel = `≈ ${kgPerWeek} kg/vecka`;
    const warning   = pace > 1 ? ' (ambitiöst men möjligt)' : '';
    hint = paceLabel + warning;
  }

  return (
    <div className={s.step}>
      <h2 className={s.title}>Måldatum</h2>
      <p className={s.subtitle}>
        När vill du vara framme vid {data.goalWeight ? `${data.goalWeight} kg` : 'din målvikt'}?
      </p>

      <div className={s.field}>
        <label className={s.label} htmlFor="ob-date">Datum</label>
        <input id="ob-date" className={s.input} type="date"
          value={date} min={minDate()}
          onChange={(e) => setDate(e.target.value)}
          style={{ colorScheme: 'dark' }}
        />
      </div>

      <p className={s.hint}>
        {date && kgPerWeek
          ? <><span className={s.hintAccent}>{hint}</span><br />{formatDate(date)}</>
          : date ? 'Räknar...' : ' '}
      </p>

      <button className={s.btnPrimary}
        disabled={!valid}
        onClick={() => onNext({ targetDate: date })}>
        Nästa
      </button>
    </div>
  );
}
