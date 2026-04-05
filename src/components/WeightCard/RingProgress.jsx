import styles from './RingProgress.module.css';

const SIZE         = 200;
const CX           = SIZE / 2;
const R            = 80;
const STROKE_ARC   = 12;
const STROKE_TRACK = 6;
const CIRC         = 2 * Math.PI * R;

export default function RingProgress({ current, progress }) {
  const offset = CIRC * (1 - progress / 100);
  const lost   = parseFloat((105 - current).toFixed(1));

  return (
    <div className={styles.wrap}>
      <svg width={SIZE} height={SIZE} className={styles.svg}>
        <defs>
          {/*
            gradientUnits="userSpaceOnUse" so the gradient spans the full circle
            regardless of how much of the arc is drawn.
            x1/x2 run left→right across the circle diameter.
          */}
          <linearGradient
            id="ringGradient"
            gradientUnits="userSpaceOnUse"
            x1={CX - R} y1={CX}
            x2={CX + R} y2={CX}
          >
            <stop offset="0%"   stopColor="#00c9a7" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={CX} cy={CX} r={R}
          fill="none"
          stroke="#ffffff"
          strokeOpacity={0.08}
          strokeWidth={STROKE_TRACK}
        />

        {/* Active arc */}
        <circle
          cx={CX} cy={CX} r={R}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={STROKE_ARC}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          className={styles.arc}
        />
      </svg>

      <div className={styles.center}>
        <div className={styles.valueRow}>
          <span className={styles.value}>{current.toFixed(1)}</span>
          <span className={styles.unit}>kg</span>
        </div>
        {lost > 0
          ? <span className={styles.lost}>−{lost} kg tappat</span>
          : <span className={styles.lostMuted}>Startvikt</span>
        }
      </div>
    </div>
  );
}
