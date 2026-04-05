import { useState } from 'react';
import {
  Beef,
  Carrot,
  Drumstick,
  Fish,
  Leaf,
  Nut,
  WheatOff,
} from 'lucide-react';
import s from '../Step.module.css';

const DIETS = [
  { value: 'Allätare', icon: Drumstick, desc: 'Äter allt – inga restriktioner' },
  { value: 'Pescetarian', icon: Fish, desc: 'Fisk & skaldjur, inga landdjur' },
  { value: 'Vegetarian', icon: Carrot, desc: 'Ägg & mejeri, inget kött eller fisk' },
  { value: 'Vegan', icon: Leaf, desc: '100% växtbaserat' },
  { value: 'Keto', icon: Nut, desc: 'Låg kolhydrat, hög fett (LCHF)' },
  { value: 'Glutenfri', icon: WheatOff, desc: 'Undviker vete, råg, korn' },
  { value: 'Carnivore', icon: Beef, desc: 'Endast animaliska produkter' },
];

export default function Step6Diet({ data, onNext, submitLabel = 'Nästa' }) {
  const [diet,      setDiet]      = useState(data.diet      ?? '');
  const [allergies, setAllergies] = useState(data.allergies ?? '');

  return (
    <div className={s.step}>
      <p className={s.kicker}>Nutrition Style</p>
      <h2 className={s.title}>Vilken kost passar dig?</h2>
      <p className={s.subtitle}>Välj det som ligger närmast hur du redan äter.</p>

      <div className={s.hypeStack}>
        {DIETS.map((d) => {
          const Icon = d.icon;

          return (
            <button
              type="button"
              key={d.value}
              className={[
                diet === d.value ? s.hypeCardSelected : s.hypeCard,
                s.hypeCardRow,
              ].join(' ')}
              onClick={() => setDiet(diet === d.value ? '' : d.value)}
            >
              <span className={s.hypeCardIcon} aria-hidden="true">
                <Icon size={24} strokeWidth={1.5} />
              </span>
              <span className={s.hypeCardText}>
                <span className={s.hypeCardLabel}>{d.value}</span>
                <span className={s.hypeCardDesc}>{d.desc}</span>
              </span>
            </button>
          );
        })}
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
