import { useState } from 'react';
import styles from './WeightForm.module.css';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isValid(value) {
  const kg = parseFloat(value);
  return !isNaN(kg) && kg >= 30 && kg <= 300;
}

export default function WeightForm({ onSave }) {
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState('');
  const [saved, setSaved] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid(weight)) return;
    onSave(date, parseFloat(weight));
    setWeight('');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.inputWrap}>
        <input
          id="w-kg"
          type="number"
          inputMode="decimal"
          className={styles.bigInput}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder=""
          autoFocus
          aria-label="Vikt i kg"
        />
        <span className={styles.unit}>kg</span>
      </div>

      <input
        id="w-date"
        type="date"
        className={styles.dateInput}
        value={date}
        max={today()}
        onChange={(e) => setDate(e.target.value)}
        aria-label="Datum"
      />

      <button className={styles.btn} type="submit">
        {saved ? '✓ Sparat' : 'Spara'}
      </button>
    </form>
  );
}
