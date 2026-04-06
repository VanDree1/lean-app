import styles from './BottomNav.module.css';

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H15v-6h-6v6H4a1 1 0 0 1-1-1V10.5z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.6}
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.12 : 0}
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
        strokeWidth={active ? 2.2 : 1.6}
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.12 : 0}
      />
      <path d="M9 20h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12" cy="8" r="4"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.6}
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.12 : 0}
      />
      <path
        d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BottomNav({ active, onChange }) {
  return (
    <nav className={styles.nav} aria-label="Huvudnavigation">
      <button
        className={`${styles.tab} ${active === 'hem' ? styles.tabActive : ''}`}
        onClick={() => onChange('hem')}
        aria-current={active === 'hem' ? 'page' : undefined}
      >
        <div className={styles.iconWrap}>
          <HomeIcon active={active === 'hem'} />
          {active === 'hem' && <span className={styles.activePip} aria-hidden="true" />}
        </div>
        <span className={styles.label}>Hem</span>
      </button>

      <button
        className={`${styles.tab} ${active === 'recept' ? styles.tabActive : ''}`}
        onClick={() => onChange('recept')}
        aria-current={active === 'recept' ? 'page' : undefined}
      >
        <div className={styles.iconWrap}>
          <RecipesIcon active={active === 'recept'} />
          {active === 'recept' && <span className={styles.activePip} aria-hidden="true" />}
        </div>
        <span className={styles.label}>Recept</span>
      </button>

      <button
        className={`${styles.tab} ${active === 'profil' ? styles.tabActive : ''}`}
        onClick={() => onChange('profil')}
        aria-current={active === 'profil' ? 'page' : undefined}
      >
        <div className={styles.iconWrap}>
          <ProfileIcon active={active === 'profil'} />
          {active === 'profil' && <span className={styles.activePip} aria-hidden="true" />}
        </div>
        <span className={styles.label}>Profil</span>
      </button>
    </nav>
  );
}
