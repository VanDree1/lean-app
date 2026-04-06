import { useState } from 'react';
import { useOnboarding } from './useOnboarding';
import StepProgress from './StepProgress';
import Step1Welcome      from './steps/Step1Welcome';
import StepGoal          from './steps/StepGoal';
import StepActivity      from './steps/StepActivity';
import Step2Profile      from './steps/Step2Profile';
import Step3CurrentWeight from './steps/Step3CurrentWeight';
import StepWeightGoal    from './steps/StepWeightGoal';
import Step4GoalWeight   from './steps/Step4GoalWeight';
import Step6Diet         from './steps/Step6Diet';
import Step7Summary      from './steps/Step7Summary';
import styles from './Onboarding.module.css';

const INITIAL_DATA = {
  goal: '', activity: '', weightGoal: '',
  name: '', height: '', age: '', gender: '',
  currentWeight: '', goalWeight: '', pace: 0.5, targetDate: '',
  diet: '', allergies: '',
};

/**
 * Returns the ordered list of step components based on accumulated data.
 * Always called with the *current* data so we can skip steps correctly.
 */
function buildSteps(data) {
  // Narrative order: who → where now → where going → why → how → diet → reveal
  const steps = [
    Step1Welcome,
    Step2Profile,       // Namn, ålder, längd, kön
    Step3CurrentWeight, // Nuläge
    StepWeightGoal,     // Riktning: gå ner / hålla / gå upp
  ];

  if (data.weightGoal !== 'maintain') {
    steps.push(Step4GoalWeight); // Destination + takt
  }

  steps.push(StepGoal);     // Motivation / varför
  steps.push(StepActivity); // Livsstil
  steps.push(Step6Diet);    // Kost
  steps.push(Step7Summary); // Reveal
  return steps;
}

export default function Onboarding() {
  const { complete, saveDraft } = useOnboarding();
  const [step, setStep]  = useState(1);
  const [data, setData]  = useState(INITIAL_DATA);
  const [direction, setDirection] = useState('forward');

  // Rebuild steps every render so navigation is always correct
  const steps = buildSteps(data);
  const isWelcome = step === 1;
  const isLast    = step === steps.length;

  function next(partial) {
    const newData = { ...data, ...partial };

    // Auto-set goalWeight for "maintain"
    if (partial.weightGoal === 'maintain' && newData.currentWeight) {
      newData.goalWeight = newData.currentWeight;
      newData.pace = 0;
      newData.targetDate = '';
    }

    setData(newData);
    saveDraft(newData);
    setDirection('forward');

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(12);
    }

    if (step === steps.length) {
      complete(newData);
    } else {
      setStep((s) => s + 1);
    }
  }

  function back() {
    setDirection('backward');
    setStep((s) => Math.max(1, s - 1));
  }

  function goToStep(n) {
    setDirection(n > step ? 'forward' : 'backward');
    setStep(n);
  }

  const StepComponent = steps[step - 1];

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        {!isWelcome && (
          <div className={styles.topRow}>
            <StepProgress
              current={step - 1}
              total={steps.length - 1}
              onStepClick={(n) => goToStep(n + 1)}
            />
            <button className={styles.back} onClick={back} aria-label="Tillbaka">
              ← Tillbaka
            </button>
          </div>
        )}

        <div
          key={step}
          className={[
            styles.stepWrap,
            direction === 'backward' ? styles.stepWrapBackward : styles.stepWrapForward,
          ].join(' ')}
        >
          <StepComponent
            data={data}
            onNext={next}
            submitLabel={isLast ? 'Spara' : 'Nästa'}
          />
        </div>

        {!isWelcome && !isLast && (
          <button className={styles.skip} onClick={() => next({})}>
            Hoppa över
          </button>
        )}
      </div>
    </div>
  );
}
