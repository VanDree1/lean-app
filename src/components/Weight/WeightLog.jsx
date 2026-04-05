import styles from './WeightLog.module.css';

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

export default function WeightLog({ entries }) {
  if (entries.length === 0) {
    return <p className={styles.empty}>Inga loggningar än.</p>;
  }

  return (
    <ul className={styles.list}>
      {entries.slice(0, 5).map((entry) => (
        <li key={entry.date} className={styles.item}>
          <span className={styles.date}>{formatDate(entry.date)}</span>
          <span className={styles.weight}>{entry.weight.toFixed(1)} kg</span>
        </li>
      ))}
    </ul>
  );
}
