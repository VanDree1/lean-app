import { useEffect, useState } from 'react';
import { calcTargets } from '../../../hooks/useProfile';
import s from '../Step.module.css';

function makeConfetti() {
  return Array.from({ length: 32 }, (_, i) => ({
    id: i,
    left: `${3 + (i / 32) * 94}%`,
    hue: [140, 160, 200, 50, 30][i % 5],
    sz: 5 + Math.floor(Math.random() * 8),
    dur: `${0.55 + Math.random() * 0.6}s`,
    delay: `${Math.random() * 0.4}s`,
  }));
}

const GOAL_LABELS = {
  fat_loss: 'Bränna fett',
  muscle:   'Bygga muskler',
  energy:   'Mer energi',
  target:   'Nå målvikt',
};

const ACTIVITY_LABELS = {
  sedentary:   'Stillasittande',
  light:       'Måttligt aktiv',
  very_active: 'Mycket aktiv',
};

function CountUp({ target, duration = 900, suffix = '' }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!target) return;
    const steps = 40;
    const inc = target / steps;
    let current = 0;
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      current = Math.min(Math.round(inc * frame), target);
      setVal(current);
      if (current >= target) clearInterval(id);
    }, duration / steps);
    return () => clearInterval(id);
  }, [target, duration]);

  return <>{val}{suffix}</>;
}

export default function Step7Summary({ data, onNext, submitLabel = 'Spara & börja' }) {
  const [fired, setFired] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [confetti] = useState(makeConfetti);

  const firstName = data.name ? data.name.split(' ')[0] : 'du';

  // Build a profile-shaped object for calcTargets
  const profileForCalc = {
    startWeight: parseFloat(data.currentWeight) || 90,
    height:      parseFloat(data.height) || 175,
    age:         parseFloat(data.age) || 30,
    gender:      data.gender || null,
    activity:    data.activity || 'light',
    goal:        data.goal || 'fat_loss',
  };
  const { kcalGoal, proteinGoal } = calcTargets(profileForCalc);

  const diff = parseFloat(data.currentWeight) - parseFloat(data.goalWeight);
  const weightGoalLabel = data.weightGoal === 'maintain'
    ? 'Hålla vikten'
    : data.weightGoal === 'gain'
      ? `+${Math.abs(diff).toFixed(1)} kg att bygga`
      : `${diff > 0 ? diff.toFixed(1) : '–'} kg att tappa`;

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 180);
    return () => clearTimeout(t);
  }, []);

  function handleStart() {
    setFired(true);
    setTimeout(() => onNext({}), 1200);
  }

  return (
    <div className={[s.summaryStep, fired ? s.summaryStepDone : ''].join(' ')}>
      {fired && (
        <div className={s.confettiWrap}>
          {confetti.map((c) => (
            <span
              key={c.id}
              className={s.confettiPiece}
              style={{ left: c.left, '--hue': c.hue, '--sz': `${c.sz}px`, '--dur': c.dur, '--delay': c.delay }}
            />
          ))}
        </div>
      )}

      <div className={s.summaryHero}>
        <div className={s.summaryGlow} aria-hidden="true" />
        <div className={s.summaryCheckWrap}>
          <div className={s.summaryCheck}>✓</div>
        </div>
        <p className={s.summaryHeroTitle}>Din plan är klar, {firstName}.</p>
        <p className={s.summaryHeroSub}>Baserat på din data — beräknat för dig.</p>
      </div>

      {/* Big reveal — the satisfying numbers */}
      <div className={[s.revealRow, revealed ? s.revealRowVisible : ''].join(' ')}>
        <div className={s.revealCard}>
          <span className={s.revealVal}>
            {revealed ? <CountUp target={kcalGoal} duration={800} /> : '–'}
          </span>
          <span className={s.revealLabel}>kcal / dag</span>
          <span className={s.revealHint}>Ditt dagliga mål</span>
        </div>
        <div className={s.revealCard}>
          <span className={s.revealVal}>
            {revealed ? <CountUp target={proteinGoal} duration={700} suffix="g" /> : '–'}
          </span>
          <span className={s.revealLabel}>protein / dag</span>
          <span className={s.revealHint}>Optimerat för ditt mål</span>
        </div>
      </div>

      {/* Supporting detail badges */}
      <div className={s.summaryBadges}>
        {data.goal && (
          <div className={s.summaryBadge}>
            <span className={s.summaryBadgeKey}>Fokus</span>
            <span className={s.summaryBadgeVal}>{GOAL_LABELS[data.goal] ?? data.goal}</span>
          </div>
        )}
        {data.activity && (
          <div className={s.summaryBadge}>
            <span className={s.summaryBadgeKey}>Aktivitet</span>
            <span className={s.summaryBadgeVal}>{ACTIVITY_LABELS[data.activity] ?? data.activity}</span>
          </div>
        )}
        {(data.currentWeight && data.weightGoal) && (
          <div className={s.summaryBadge}>
            <span className={s.summaryBadgeKey}>Viktmål</span>
            <span className={[s.summaryBadgeVal, s.summaryBadgeAccent].join(' ')}>{weightGoalLabel}</span>
          </div>
        )}
        {data.goalWeight && data.weightGoal !== 'maintain' && (
          <div className={s.summaryBadge}>
            <span className={s.summaryBadgeKey}>Målvikt</span>
            <span className={s.summaryBadgeVal}>{data.goalWeight} kg</span>
          </div>
        )}
        {data.pace > 0 && (
          <div className={s.summaryBadge}>
            <span className={s.summaryBadgeKey}>Takt</span>
            <span className={s.summaryBadgeVal}>{String(data.pace).replace('.', ',')} kg/v</span>
          </div>
        )}
        {data.diet && (
          <div className={s.summaryBadge}>
            <span className={s.summaryBadgeKey}>Kost</span>
            <span className={s.summaryBadgeVal}>{data.diet}</span>
          </div>
        )}
      </div>

      <button
        className={[s.btnPrimary, fired ? s.summaryButtonDone : ''].join(' ')}
        onClick={handleStart}
        disabled={fired}
      >
        {fired ? 'Startar...' : submitLabel}
      </button>
    </div>
  );
}
