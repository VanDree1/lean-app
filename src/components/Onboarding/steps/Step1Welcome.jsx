import { useEffect, useState } from 'react';
import s from '../Step.module.css';

const BULLETS = ['Personlig plan', 'Lugn uppföljning', 'Tydlig riktning över tid'];

export default function Step1Welcome({ onNext }) {
  const [visible, setVisible] = useState([false, false, false]);

  useEffect(() => {
    BULLETS.forEach((_, i) => {
      setTimeout(() => setVisible((v) => { const n = [...v]; n[i] = true; return n; }), 450 + i * 280);
    });
  }, []);

  return (
    <div className={s.welcomeStep}>
      <div className={s.welcomeGlow} />
      <p className={s.welcomeEyebrow}>Djur i Juni</p>
      <h1 className={s.welcomeTitle}>Bygg en enklare rytm</h1>
      <ul className={s.bullets}>
        {BULLETS.map((b, i) => (
          <li key={b} className={[s.bullet, visible[i] ? s.bulletVisible : ''].join(' ')}>
            <span className={s.bulletCheck}>✓</span>
            {b}
          </li>
        ))}
      </ul>
      <button className={[s.btnPrimary, s.btnPulse].join(' ')} onClick={() => onNext({})}>
        Kom igång
      </button>
    </div>
  );
}
