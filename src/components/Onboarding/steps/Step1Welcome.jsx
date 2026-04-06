import { useEffect, useState } from 'react';
import s from '../Step.module.css';

const LINES = [
  'Rätt kalorier för din kropp',
  'Proteinmål baserat på dig',
  'Tydlig riktning, dag för dag',
];

export default function Step1Welcome({ onNext }) {
  const [visible, setVisible] = useState([false, false, false]);
  const [btnReady, setBtnReady] = useState(false);

  useEffect(() => {
    LINES.forEach((_, i) => {
      setTimeout(() => setVisible((v) => { const n = [...v]; n[i] = true; return n; }), 300 + i * 220);
    });
    setTimeout(() => setBtnReady(true), 300 + LINES.length * 220 + 100);
  }, []);

  return (
    <div className={s.welcomeStep}>
      <div className={s.welcomeGlow} />

      <p className={s.welcomeEyebrow}>Lean</p>
      <h1 className={s.welcomeTitle}>Din kropp.<br />Din plan.</h1>
      <p className={s.welcomeSub}>2 minuter. Ingen gissning. Personligt från start.</p>

      <ul className={s.bullets}>
        {LINES.map((line, i) => (
          <li key={line} className={[s.bullet, visible[i] ? s.bulletVisible : ''].join(' ')}>
            <span className={s.bulletCheck}>✓</span>
            {line}
          </li>
        ))}
      </ul>

      <button
        className={[s.btnPrimary, btnReady ? s.btnReady : ''].join(' ')}
        onClick={() => onNext({})}
      >
        Kom igång →
      </button>
    </div>
  );
}
