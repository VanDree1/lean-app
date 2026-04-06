import { useEffect, useRef, useState } from 'react';
import WeightForm from './WeightForm';
import WeightLog from './WeightLog';
import { useWeightLog } from './useWeightLog';
import styles from './WeightModal.module.css';

export default function WeightModal({ onClose, onOpenJournal }) {
  const { recent, current, addEntry, removeEntry, GOAL_WEIGHT } = useWeightLog();
  const overlayRef = useRef(null);
  const [justSaved, setJustSaved] = useState(false);
  const [savedWeight, setSavedWeight] = useState(null);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSaved(weight) {
    setSavedWeight(weight);
    setJustSaved(true);

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(18);
    }

    window.setTimeout(() => setJustSaved(false), 1200);
  }

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className={[styles.panel, justSaved ? styles.panelSaved : ''].join(' ')} role="dialog" aria-modal="true" aria-label="Logga vikt">
        <div className={styles.header}>
          <span className={styles.title}>{justSaved ? 'Vikt sparad' : 'Logga vikt'}</span>
          <button className={styles.close} onClick={onClose} aria-label="Stäng">✕</button>
        </div>

        <WeightForm onSave={addEntry} onSaved={handleSaved} />

        <WeightLog entries={recent} onRemove={removeEntry} />

        <div className={styles.footer}>
          <p className={styles.footerLine}>
            {current.toFixed(1)} kg → mål {GOAL_WEIGHT} kg
          </p>
          <button
            type="button"
            className={styles.historyButton}
            onClick={() => {
              onClose();
              onOpenJournal?.();
            }}
          >
            Öppna historik
          </button>
          <p className={[styles.footerStatus, justSaved ? styles.footerStatusVisible : ''].join(' ')}>
            {savedWeight !== null ? `${savedWeight.toFixed(1)} kg tillagd` : 'Sparat'}
          </p>
        </div>
      </div>
    </div>
  );
}
