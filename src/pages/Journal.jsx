import { useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import styles from './Journal.module.css';

const WEEKDAYS = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];

function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { day: dateString, date: '' };

  return {
    day: WEEKDAYS[date.getDay()],
    date: date.toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
    }),
  };
}

function getMealCalories(entry) {
  return Object.values(entry.meals || {}).reduce((sum, meal) => sum + (meal?.calories || 0), 0);
}

function getMealProtein(entry) {
  return Object.values(entry.meals || {}).reduce((sum, meal) => sum + (meal?.extraProtein ? 25 : 0), 0);
}

function getNutritionScore(entry, goal) {
  if (!goal || goal <= 0) return 0;
  const calories = Number(entry.calories) || getMealCalories(entry);
  const burned = Number(entry.burned) || 0;
  const net = Math.max(0, calories - burned);
  const delta = Math.abs(goal - net);
  const ratio = Math.max(0, 1 - delta / goal);
  return Math.round(ratio * 100);
}

function getEntryTitle(entry, goal) {
  if (entry.comment?.trim()) return entry.comment.trim();

  const score = getNutritionScore(entry, goal);
  if (score >= 92) return 'Riktigt stabil dag';
  if ((Number(entry.duration) || 0) >= 45) return 'Bra tryck i dagen';
  if ((Number(entry.sleepHours) || 0) >= 8) return 'Lugn och återhämtad dag';
  return 'Dag registrerad';
}

function getNutritionPhrase(entry, goal) {
  const score = getNutritionScore(entry, goal);
  if (score >= 95) return 'Kosten satt väldigt fint.';
  if (score >= 85) return 'Bra riktning på maten.';
  if (score >= 70) return 'Helt okej rytm på maten.';
  return 'Dagen gick lite mer på känsla.';
}

function getWorkoutPhrase(entry) {
  if (!entry.workoutName) return 'Ingen träning loggad.';
  if (entry.duration) return `${entry.duration} min ${entry.workoutName}.`;
  return `${entry.workoutName}.`;
}

function getSleepPhrase(entry) {
  const sleep = Number(entry.sleepHours);
  if (sleep <= 0) return 'Sömnen saknas.';
  if (sleep < 6) return `${sleep.toString().replace('.', ',')} h sömn, låg energi.`;
  if (sleep >= 8) return `${sleep.toString().replace('.', ',')} h sömn, bra återhämtning.`;
  return `${sleep.toString().replace('.', ',')} h sömn.`;
}

function getEntrySummary(entry, goal) {
  return [
    getNutritionPhrase(entry, goal),
    getWorkoutPhrase(entry),
    getSleepPhrase(entry),
  ].join(' ');
}

function getStatusTone(entry, goal) {
  const score = getNutritionScore(entry, goal);
  if (!entry.locked) return 'muted';
  if ((Number(entry.sleepHours) || 0) < 6) return 'warning';
  if (score >= 90) return 'strong';
  return 'steady';
}

export default function Journal({ onClose = null }) {
  const { state } = useAppStore();
  const goal = state.profile?.caloriesGoal || 3150;

  useEffect(() => {
    if (!onClose) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const entries = useMemo(() => {
    return Object.values(state.daily.dailyEntries || {})
      .filter((entry) => entry?.date && entry.locked)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.daily.dailyEntries]);

  const content = (
    <main className={styles.main}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Journal</p>
          <h1 className={styles.title}>Senaste dagarna</h1>
          <p className={styles.subtitle}>En lugn översikt över stängda dagar, utan tabeller och brus.</p>
        </section>

        {entries.length === 0 ? (
          <section className={styles.emptyCard}>
            <p className={styles.emptyTitle}>Ingen historik än</p>
            <p className={styles.emptyBody}>När du stänger dagar på Hem dyker de upp här som en ren livsstilslogg.</p>
          </section>
        ) : (
          <section className={styles.timeline} aria-label="Tidigare dagar">
            {entries.map((entry) => {
              const label = formatDateLabel(entry.date);
              const tone = getStatusTone(entry, goal);
              const title = getEntryTitle(entry, goal);
              const summary = getEntrySummary(entry, goal);
              const pills = [
                `${Number(entry.calories || getMealCalories(entry)).toLocaleString('sv-SE')} kcal`,
                entry.workoutName ? `${entry.workoutName}${entry.duration ? ` ${entry.duration} min` : ''}` : 'Vila',
                Number(entry.sleepHours) > 0 ? `${Number(entry.sleepHours).toString().replace('.', ',')} h sömn` : null,
                Number.isFinite(Number(entry.weight)) ? `${Number(entry.weight).toFixed(1).replace('.', ',')} kg` : null,
                getMealProtein(entry) > 0 ? `+${getMealProtein(entry)} g protein` : null,
              ].filter(Boolean);

              return (
                <article key={entry.date} className={styles.row}>
                  <div className={styles.dateCol}>
                    <span className={styles.day}>{label.day}</span>
                    <span className={styles.date}>{label.date}</span>
                  </div>

                  <div className={styles.lineCol} aria-hidden="true">
                    <span className={[styles.dot, styles[`dot${tone.charAt(0).toUpperCase()}${tone.slice(1)}`]].join(' ')} />
                    <span className={styles.line} />
                  </div>

                  <div className={styles.card}>
                    <p className={styles.cardTitle}>{title}</p>
                    <p className={styles.cardSummary}>{summary}</p>
                    <div className={styles.metaRow}>
                      {pills.map((pill) => (
                        <span key={pill} className={styles.pill}>{pill}</span>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );

  if (!onClose) {
    return content;
  }

  return (
    <div className={styles.overlay} onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-label="Journal">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>Journal</p>
            <h2 className={styles.modalTitle}>Tidigare dagar</h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Stäng journal">✕</button>
        </div>
        <div className={styles.modalBody}>
          {content}
        </div>
      </section>
    </div>
  );
}
