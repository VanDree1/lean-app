import { useState } from 'react';
import s from '../Step.module.css';

const GENDERS = ['Man', 'Kvinna'];

export default function Step2Profile({ data, onNext, submitLabel = 'Nästa' }) {
  const [name,   setName]   = useState(data.name   ?? '');
  const [height, setHeight] = useState(data.height ?? '');
  const [age,    setAge]    = useState(data.age    ?? '');
  const [gender, setGender] = useState(data.gender ?? '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !height || !age) return;
    onNext({ name: name.trim(), height, age, gender });
  }

  const valid = name.trim() && height && age;

  return (
    <form className={s.step} onSubmit={handleSubmit} noValidate>
      <p className={s.kicker}>Profile</p>
      <h2 className={s.title}>Om dig</h2>
      <p className={s.subtitle}>
        Det här räcker för att sätta en plan som känns rimlig från start.
      </p>

      <div className={s.field}>
        <label className={s.label} htmlFor="ob-name">Namn</label>
        <input id="ob-name" className={s.input} type="text"
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Ditt förnamn" autoFocus />
      </div>

      <div className={s.twoCol}>
        <div className={s.field}>
          <label className={s.label} htmlFor="ob-age">Ålder</label>
          <input id="ob-age" className={s.input} type="number"
            inputMode="numeric" value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="t.ex. 28" min="10" max="120" />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="ob-height">Längd (cm)</label>
          <input id="ob-height" className={s.input} type="number"
            inputMode="decimal" value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="t.ex. 178" min="100" max="250" />
        </div>
      </div>

      <div className={s.field}>
        <span className={s.label}>Kön (valfritt)</span>
        <div className={s.radios}>
          {GENDERS.map((g) => (
            <button type="button" key={g}
              className={gender === g ? s.radioSelected : s.radio}
              onClick={() => setGender(gender === g ? '' : g)}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <button className={s.btnPrimary} type="submit" disabled={!valid}>
        {submitLabel}
      </button>
    </form>
  );
}
