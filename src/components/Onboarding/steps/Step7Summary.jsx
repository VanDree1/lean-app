import { useState } from 'react';
import s from '../Step.module.css';

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' });
}

function makeConfetti() {
  return Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: `${4 + (i / 28) * 92}%`,
    hue: Math.floor(Math.random() * 360),
    sz: 6 + Math.floor(Math.random() * 7),
    dur: `${0.6 + Math.random() * 0.5}s`,
    delay: `${Math.random() * 0.35}s`,
  }));
}

const GOAL_LABELS = {
  fat_loss: '🔥 Bränna fett',
  muscle:   '💪 Bygga muskler',
  energy:   '⚡ Mer energi',
  target:   '🎯 Nå målvikt',
};

const ACTIVITY_LABELS = {
  sedentary:   'Stillasittande',
  light:       'Måttligt aktiv',
  very_active: 'Mycket aktiv',
};

export default function Step7Summary({ data, onNext }) {
  const [fired, setFired] = useState(false);
  const [confetti] = useState(() => makeConfetti());

  const firstName = data.name ? data.name.split(' ')[0] : 'du';
  const diff = parseFloat(data.currentWeight) - parseFloat(data.goalWeight);

  const badges = [
    data.goal        && { key: 'Mål',        val: GOAL_LABELS[data.goal] ?? data.goal },
    data.goalWeight  && { key: 'Målvikt',     val: `${data.goalWeight} kg`, accent: true },
    data.pace        && { key: 'Takt',        val: `${String(data.pace).replace('.', ',')} kg/v` },
    data.targetDate  && { key: 'Klart senast', val: formatDate(data.targetDate) },
    data.diet        && { key: 'Kosttyp',     val: data.diet },
    data.activity    && { key: 'Aktivitet',   val: ACTIVITY_LABELS[data.activity] ?? data.activity },
    diff > 0         && { key: 'Att tappa',   val: `${diff.toFixed(1)} kg` },
  ].filter(Boolean);

  function handleStart() {
    setFired(true);
    setTimeout(() => onNext({}), 900);
  }

  return (
    <div className={s.summaryStep}>
      {fired && (
        <div className={s.confettiWrap}>
          {confetti.map((c) => (
            <span
              key={c.id}
              className={s.confettiPiece}
              style={{
                left: c.left,
                '--hue': c.hue,
                '--sz': `${c.sz}px`,
                '--dur': c.dur,
                '--delay': c.delay,
              }}
            />
          ))}
        </div>
      )}

      <div className={s.summaryHero}>
        <div className={s.summaryCheck}>✓</div>
        <p className={s.summaryHeroTitle}>Din plan är klar</p>
        <p className={s.summaryHeroSub}>
          Nu finns en tydlig riktning för dig, {firstName}.
        </p>
      </div>

      <div className={s.summaryBadges}>
        {badges.map((b) => (
          <div key={b.key} className={s.summaryBadge}>
            <span className={s.summaryBadgeKey}>{b.key}</span>
            <span className={[s.summaryBadgeVal, b.accent ? s.summaryBadgeAccent : ''].join(' ')}>
              {b.val}
            </span>
          </div>
        ))}
      </div>

      <button className={s.btnPrimary} onClick={handleStart} disabled={fired}>
        Starta
      </button>
    </div>
  );
}
