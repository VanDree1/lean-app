import { useState } from 'react';
import s from '../Step.module.css';

const DIETS = [
  { value: 'Allätare',    icon: '🍗', desc: 'Äter allt – inga restriktioner' },
  { value: 'Pescetarian', icon: '🐟', desc: 'Fisk & skaldjur, inga landdjur' },
  { value: 'Vegetarian',  icon: '🥗', desc: 'Ägg & mejeri, inget kött eller fisk' },
  { value: 'Vegan',       icon: '🌱', desc: '100% växtbaserat' },
  { value: 'Keto',        icon: '🥑', desc: 'Låg kolhydrat, hög fett (LCHF)' },
  { value: 'Glutenfri',   icon: '🌾', desc: 'Undviker vete, råg, korn' },
  { value: 'Carnivore',   icon: '🥩', desc: 'Endast animaliska produkter' },
  { value: 'Lakto-ovo',   icon: '🥚', desc: 'Vegetarisk + ägg & mejeri' },
];

export default function Step6Diet({ data, onNext, submitLabel = 'Nästa' }) {
  const [diet,      setDiet]      = useState(data.diet      ?? '');
  const [allergies, setAllergies] = useState(data.allergies ?? '');

  return (
    <div className={s.step}>
      <h2 className={s.title}>Vilken kost passar dig?</h2>
      <p className={s.subtitle}>Välj det som ligger närmast hur du redan äter.</p>

      <div className={s.hypeGrid}>
        {DIETS.map((d) => (
          <button
            type="button"
            key={d.value}
            className={diet === d.value ? s.hypeCardSelected : s.hypeCard}
            onClick={() => setDiet(diet === d.value ? '' : d.value)}
          >
            <span className={s.hypeCardIcon}>{d.icon}</span>
            <span className={s.hypeCardLabel}>{d.value}</span>
            <span className={s.hypeCardDesc}>{d.desc}</span>
          </button>
        ))}
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="ob-allergies">
          Allergier / intoleranser (valfritt)
        </label>
        <input
          id="ob-allergies"
          className={s.input}
          type="text"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="Till exempel laktos eller nötter"
        />
      </div>

      <button
        className={s.btnPrimary}
        disabled={!diet}
        onClick={() => onNext({ diet, allergies })}
      >
        {submitLabel}
      </button>
    </div>
  );
}
