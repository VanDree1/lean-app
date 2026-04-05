import styles from './BottomNav.module.css';

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H15v-6h-6v6H4a1 1 0 0 1-1-1V10.5z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}

function RecipesIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2C8 2 5 5 5 9c0 2.8 1.5 5.2 3.8 6.5L9 20h6l.2-4.5C17.5 14.2 19 11.8 19 9c0-4-3-7-7-7z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
      <path d="M9 20h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function BottomNav({ active, onChange }) {
  return (
    <nav className={styles.nav} aria-label="Huvudnavigation">
      <button
        className={`${styles.tab} ${active === 'home' ? styles.tabActive : ''}`}
        onClick={() => onChange('home')}
        aria-current={active === 'home' ? 'page' : undefined}
      >
        <HomeIcon active={active === 'home'} />
        <span className={styles.label}>Hem</span>
        {active === 'home' && <span className={styles.dot} aria-hidden="true" />}
      </button>

      <button
        className={`${styles.tab} ${active === 'recipes' ? styles.tabActive : ''}`}
        onClick={() => onChange('recipes')}
        aria-current={active === 'recipes' ? 'page' : undefined}
      >
        <RecipesIcon active={active === 'recipes'} />
        <span className={styles.label}>Recept</span>
        {active === 'recipes' && <span className={styles.dot} aria-hidden="true" />}
      </button>
    </nav>
  );
}
