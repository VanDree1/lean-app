const ICONS = {
  scale: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 7l-3 6a3 3 0 0 0 6 0L6 7z" />
      <path d="M18 7l-3 6a3 3 0 0 0 6 0L18 7z" />
      <line x1="6" y1="7" x2="18" y2="7" />
      <line x1="12" y1="3" x2="12" y2="7" />
      <line x1="4" y1="21" x2="20" y2="21" />
      <line x1="12" y1="21" x2="12" y2="17" />
    </svg>
  ),
  dumbbell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 6.5h0a2 2 0 0 1 2.83 0l8.17 8.17a2 2 0 0 1 0 2.83h0a2 2 0 0 1-2.83 0L6.5 9.33a2 2 0 0 1 0-2.83z" />
      <path d="M17.5 6.5 20 4" />
      <path d="M4 20l2.5-2.5" />
      <path d="m14 6 4 4" />
      <path d="m6 14 4 4" />
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  utensils: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6h3l1 12h-4" />
    </svg>
  ),
  'trend-up': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

export default function Icon({ name, size = 18 }) {
  const svg = ICONS[name];
  if (!svg) return null;
  return (
    <span style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {svg}
    </span>
  );
}
