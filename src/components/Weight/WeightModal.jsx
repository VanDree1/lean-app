import { useEffect, useRef } from 'react';
import WeightForm from './WeightForm';
import WeightLog from './WeightLog';
import { useWeightLog } from './useWeightLog';
import styles from './WeightModal.module.css';

export default function WeightModal({ onClose }) {
  const { recent, current, addEntry, GOAL_WEIGHT } = useWeightLog();
  const overlayRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Logga vikt">
        <div className={styles.header}>
          <span className={styles.title}>Logga vikt</span>
          <button className={styles.close} onClick={onClose} aria-label="Stäng">✕</button>
        </div>

        <WeightForm onSave={addEntry} />

        <WeightLog entries={recent} />

        <p className={styles.footer}>
          {current.toFixed(1)} kg → mål {GOAL_WEIGHT} kg
        </p>
      </div>
    </div>
  );
}
