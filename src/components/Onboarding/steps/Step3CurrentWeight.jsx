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

export default function Step3CurrentWeight({ data, onNext, onChangeData, showFooter = true, submitLabel = 'Nästa' }) {
  const controlled = typeof onChangeData === 'function';
  const init = parseInitial(data.currentWeight);
  const [localKg, setLocalKg] = useState(init.kg);
  const [localDec, setLocalDec] = useState(init.dec);
  const { kg, dec } = controlled ? parseInitial(data.currentWeight) : { kg: localKg, dec: localDec };

  const handleKg = useCallback((v) => {
    if (controlled) {
      onChangeData({ currentWeight: String(parseFloat(`${v}${dec}`)) });
    } else {
      setLocalKg(v);
    }
  }, [controlled, dec, onChangeData]);
  const handleDec = useCallback((v) => {
    if (controlled) {
      onChangeData({ currentWeight: String(parseFloat(`${kg}${v}`)) });
    } else {
      setLocalDec(v);
    }
  }, [controlled, kg, onChangeData]);

  const fullWeight = parseFloat(`${kg}${dec}`);

  return (
    <div className={[s.step, !showFooter ? s.stepFooterless : ''].join(' ')}>
      <p className={s.kicker}>Var är du nu?</p>
      <h2 className={s.title}>Din nuläge</h2>
      <p className={s.subtitle}>Ingen dömer — det är bara en startpunkt.</p>

      <div className={s.wheelCard}>
        <p className={s.wheelLabel}>Vikt</p>
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
            variant="decimal"
          />
          <span className={s.wheelUnit}>kg</span>
        </div>
      </div>

      {showFooter && (
        <button
          className={s.btnPrimary}
          onClick={() => onNext({ currentWeight: String(fullWeight) })}
        >
          {submitLabel}
        </button>
      )}
    </div>
  );
}
