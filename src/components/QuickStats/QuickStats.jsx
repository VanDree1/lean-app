import AnimatedNumber from '../AnimatedNumber/AnimatedNumber';
import { calcTargets } from '../../hooks/useProfile';
import { getGoalTone } from '../../hooks/useGoalTone';
import { useAppStore } from '../../store/useAppStore';
import styles from './QuickStats.module.css';

const STEP_GOALS = {
  sedentary: 6000,
  light: 8000,
  very_active: 10000,
};


function MetricCard({
  label,
  unit,
  value,
  target,
  locked,
  priority = false,
}) {
  const progress = Math.max(0, Math.min(100, target > 0 ? (value / target) * 100 : 0));

  return (
    <section className={[styles.card, locked ? styles.cardLocked : '', priority ? styles.cardPriority : ''].join(' ')} aria-label={label}>
      <span className={styles.label}>{label}</span>

      <div className={styles.valueRow}>
        <>
          <span className={[styles.value, value === 0 ? styles.valueEmpty : ''].join(' ')}>
            <AnimatedNumber value={value} duration={800} />
          </span>
          <span className={styles.unit}>{unit}</span>
        </>
      </div>

      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}

function CaloriesCard({
  goal,
  eaten,
  burned,
  locked,
}) {
  const remaining = goal - eaten + burned;
  const netEaten = eaten - burned;
  const progress = Math.max(0, Math.min(100, goal > 0 ? (netEaten / goal) * 100 : 0));

  return (
    <section className={[styles.card, locked ? styles.cardLocked : ''].join(' ')} aria-label="Kalorier">
      <span className={styles.label}>Kalorier idag</span>

      <div className={styles.valueRow}>
        <>
          <span className={[styles.value, remaining <= 0 ? styles.valueEmpty : ''].join(' ')}>
            <AnimatedNumber value={remaining} duration={800} />
          </span>
          <span className={styles.unit}>kvar</span>
        </>
      </div>

      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}

export default function QuickStats({ profile = {}, locked = false }) {
  const { state } = useAppStore();
  const eaten = state.daily.calories;
  const burned = state.daily.burned;
  const steps = state.daily.steps;
  const protein = state.daily.protein;

  const derivedTargets = calcTargets(profile);
  const tone = getGoalTone(profile);
  const kcalGoal = profile.caloriesGoal ?? derivedTargets.kcalGoal;
  const stepGoal = STEP_GOALS[profile.activity] || STEP_GOALS.light;
  const isProteinPriority = tone.stats.priority === 'protein';
  const secondaryValue = isProteinPriority ? protein : steps;
  const secondaryTarget = isProteinPriority ? tone.proteinGoal : stepGoal;
  const secondaryLabel = tone.stats.secondaryLabel;
  const secondaryUnit = tone.stats.secondaryUnit;

  return (
    <div className={styles.grid}>
      <CaloriesCard
        goal={kcalGoal}
        eaten={eaten}
        burned={burned}
        locked={locked}
      />
      <MetricCard
        label={secondaryLabel}
        unit={secondaryUnit}
        value={secondaryValue}
        target={secondaryTarget}
        locked={locked}
        priority={isProteinPriority}
      />
    </div>
  );
}
