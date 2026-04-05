import styles from './StepProgress.module.css';

export default function StepProgress({ current, total, onStepClick }) {
  return (
    <nav className={styles.bar} aria-label={`Steg ${current} av ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const cls = [
          styles.segment,
          stepNum < current  ? styles.done   : '',
          stepNum === current ? styles.active : '',
        ].join(' ');

        return (
          <button
            key={i}
            type="button"
            className={cls}
            onClick={() => onStepClick(stepNum)}
            aria-label={`Gå till steg ${stepNum}`}
            aria-current={stepNum === current ? 'step' : undefined}
          />
        );
      })}
    </nav>
  );
}
