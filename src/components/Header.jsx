import { useState } from 'react';
import ProfileModal from './Onboarding/ProfileModal';
import { useAppStore } from '../store/useAppStore';
import { getDisplayName } from '../utils/displayName';
import styles from './Header.module.css';

function formatDate() {
  return new Date().toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const { state } = useAppStore();
  const name = getDisplayName(state.profile?.name);

  const date = formatDate();
  const label = date.charAt(0).toUpperCase() + date.slice(1);
  const initial = name ? name.charAt(0).toUpperCase() : null;

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <div className={styles.left}>
            <p className={styles.date}>{label}</p>
            <h1 className={styles.title}>Djur i Juni</h1>
            <p className={styles.subtitle}>Tydlighet för dagens viktigaste val.</p>
          </div>

          <button
            className={styles.profileBtn}
            onClick={() => setOpen(true)}
            aria-label="Min profil"
          >
            <span className={styles.avatar}>
              {initial ?? '?'}
            </span>
            <span className={styles.profileLabel}>
              {name || 'Min profil'}
            </span>
          </button>
        </div>
      </header>

      {open && <ProfileModal onClose={() => setOpen(false)} />}
    </>
  );
}
