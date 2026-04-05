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

export default function Step6Diet({ data, onNext, onChangeData, showFooter = true, submitLabel = 'Nästa' }) {
  const controlled = typeof onChangeData === 'function';
  const [localDiet, setLocalDiet] = useState(data.diet ?? '');
  const [localAllergies, setLocalAllergies] = useState(data.allergies ?? '');
  const diet = controlled ? (data.diet ?? '') : localDiet;
  const allergies = controlled ? (data.allergies ?? '') : localAllergies;

  function updateDiet(value) {
    if (controlled) {
      onChangeData({ diet: value });
    } else {
      setLocalDiet(value);
    }
  }

  function updateAllergies(value) {
    if (controlled) {
      onChangeData({ allergies: value });
    } else {
      setLocalAllergies(value);
    }
  }

  return (
    <div className={[s.step, !showFooter ? s.stepFooterless : ''].join(' ')}>
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
              onClick={() => updateDiet(diet === d.value ? '' : d.value)}
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
          onChange={(e) => updateAllergies(e.target.value)}
          placeholder="Till exempel laktos eller nötter"
        />
      </div>

      {showFooter && (
        <button
          className={s.btnPrimary}
          disabled={!diet}
          onClick={() => onNext({ diet, allergies })}
        >
          {submitLabel}
        </button>
      )}
    </div>
  );
}
