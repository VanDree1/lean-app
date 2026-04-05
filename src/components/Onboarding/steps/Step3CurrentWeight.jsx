import { useState, useCallback } from 'react';
import WheelPicker from '../WheelPicker';
import s from '../Step.module.css';

const KG_ITEMS    = Array.from({ length: 161 }, (_, i) => String(40 + i));          // 40–200
const DEC_ITEMS   = Array.from({ length: 10  }, (_, i) => `.${i}`);                 // .0–.9

function parseInitial(raw) {
  if (!raw) return { kg: '80', dec: '.0' };
  const n = parseFloat(raw);
  const kg  = String(Math.floor(n));
  const dec = `.${Math.round((n % 1) * 10)}`;
  return { kg, dec };
}

export default function Step3CurrentWeight({ data, onNext, submitLabel = 'Nästa' }) {
  const init = parseInitial(data.currentWeight);
  const [kg,  setKg]  = useState(init.kg);
  const [dec, setDec] = useState(init.dec);

  const handleKg  = useCallback((v) => setKg(v),  []);
  const handleDec = useCallback((v) => setDec(v), []);

  const fullWeight = parseFloat(`${kg}${dec}`);

  return (
    <div className={s.step}>
      <p className={s.kicker}>Current Weight</p>
      <h2 className={s.title}>Nuvarande vikt</h2>
      <p className={s.subtitle}>Det här är bara din startpunkt.</p>

      <div className={s.wheelCard}>
        <p className={s.wheelLabel}>Weight</p>
        <div className={s.wheelRow}>
          <WheelPicker
            items={KG_ITEMS}
            value={kg}
            onChange={handleKg}
            width="5.5rem"
          />
          <WheelPicker
            items={DEC_ITEMS}
            value={dec}
            onChange={handleDec}
            width="3.5rem"
          />
          <span className={s.wheelUnit}>kg</span>
        </div>
      </div>

      <button
        className={s.btnPrimary}
        onClick={() => onNext({ currentWeight: String(fullWeight) })}
      >
        {submitLabel}
      </button>
    </div>
  );
}
