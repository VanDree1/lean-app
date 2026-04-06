import { useState, useCallback } from 'react';
import WheelPicker from '../WheelPicker';
import s from '../Step.module.css';

const MIN_WEIGHT = 30;
const MAX_WEIGHT = 200;
const DEFAULT_WEIGHT = 80;
const KG_ITEMS = Array.from({ length: MAX_WEIGHT - MIN_WEIGHT + 1 }, (_, i) => String(MIN_WEIGHT + i));
const DEC_ITEMS   = Array.from({ length: 10  }, (_, i) => `.${i}`);                 // .0–.9

function parseInitial(raw) {
  if (!raw) return { kg: String(DEFAULT_WEIGHT), dec: '.0' };
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return { kg: String(DEFAULT_WEIGHT), dec: '.0' };
  const bounded = Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, n));
  const whole = Math.floor(bounded);
  const tenths = Math.round((bounded - whole) * 10);
  const normalizedWhole = Math.min(MAX_WEIGHT, whole + Math.floor(tenths / 10));
  const normalizedTenths = tenths % 10;
  const kg = String(normalizedWhole);
  const dec = `.${normalizedTenths}`;
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
      <h2 className={[s.title, s.compactTitle].join(' ')}>Ditt nuläge</h2>
      <p className={s.subtitle}>Ingen dömer — det är bara en startpunkt.</p>

      <div className={[s.wheelCard, s.wheelCardCompact].join(' ')}>
        <p className={s.wheelLabel}>Vikt</p>
        <div className={s.wheelRow}>
          <WheelPicker
            items={KG_ITEMS}
            value={kg}
            onChange={handleKg}
            width="5rem"
            compact
          />
          <WheelPicker
            items={DEC_ITEMS}
            value={dec}
            onChange={handleDec}
            width="3.25rem"
            variant="decimal"
            compact
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
