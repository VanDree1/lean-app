import Icon from './Icon';
import styles from './DashboardCard.module.css';

const TEASERS = {
  'Måltidsplan':  '3 måltider planerade',
  'Progress':     'Veckoöversikt',
  'Dagliga vanor': '2 av 5 klara idag',
};

export default function DashboardCard({ icon, title, accent, glow, onClick }) {
  return (
    <div
      className={styles.card}
      style={{ '--c': `var(${accent})`, '--g': `var(${glow})` }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className={styles.iconWrap}><Icon name={icon} size={16} /></div>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <p className={styles.sub}>{TEASERS[title] ?? 'Kommer snart'}</p>
      </div>
      <span className={styles.arrow}>→</span>
    </div>
  );
}
