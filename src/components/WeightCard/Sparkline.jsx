const W   = 200;
const H   = 56;
const PAD = 4;

const DUMMY_WEIGHTS = [105, 104.5, 104.8, 104.2, 103.9, 104.1, 103.5];

export default function Sparkline({ entries }) {
  const weights =
    entries.length >= 2
      ? [...entries].reverse().map((e) => e.weight)
      : DUMMY_WEIGHTS;

  const min = Math.min(...weights) - 0.4;
  const max = Math.max(...weights) + 0.4;
  const range = max - min || 1;
  const n = weights.length;

  const toX = (i) => PAD + (i / (n - 1)) * (W - PAD * 2);
  const toY = (w) => PAD + ((max - w) / range) * (H - PAD * 2);

  const pts   = weights.map((w, i) => `${toX(i).toFixed(1)},${toY(w).toFixed(1)}`).join(' ');
  const area  = [
    `M ${toX(0).toFixed(1)},${H}`,
    ...weights.map((w, i) => `L ${toX(i).toFixed(1)},${toY(w).toFixed(1)}`),
    `L ${toX(n - 1).toFixed(1)},${H}`,
    'Z',
  ].join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="spark-line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#00c9a7" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="spark-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#00c9a7" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00c9a7" stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-area-grad)" />
      <polyline
        points={pts}
        fill="none"
        stroke="url(#spark-line-grad)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
