import { useState } from 'react';
import { useOnboarding } from './useOnboarding';
import StepProgress from './StepProgress';
import Step2Profile       from './steps/Step2Profile';
import Step3CurrentWeight from './steps/Step3CurrentWeight';
import Step4GoalWeight    from './steps/Step4GoalWeight';
import Step6Diet          from './steps/Step6Diet';
import styles from './Onboarding.module.css';
import pm from './ProfileModal.module.css';

const STEPS = [Step2Profile, Step3CurrentWeight, Step4GoalWeight, Step6Diet];

const EMPTY = {
  name: '', height: '', age: '', gender: '', activity: '',
  currentWeight: '', goalWeight: '', pace: 0.5, targetDate: '',
  diet: '', allergies: '',
};

function loadSaved() {
  try {
    const raw = localStorage.getItem('djur-i-juni:onboarding');
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export default function ProfileModal({ onClose }) {
  const { complete }    = useOnboarding();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(loadSaved);

  function next(partial) {
    const newData = { ...data, ...partial };
    setData(newData);
    if (step === STEPS.length) {
      complete(newData);
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  const StepComponent = STEPS[step - 1];
  const isLast = step === STEPS.length;

  return (
    <div className={pm.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.card}>
        <div className={pm.header}>
          <div className={pm.headerTop}>
            <div>
              <p className={pm.eyebrow}>Profil</p>
              <h2 className={pm.title}>Justera din riktning</h2>
            </div>
            <button className={pm.close} onClick={onClose} aria-label="Stäng">✕</button>
          </div>
          <StepProgress
            current={step}
            total={STEPS.length}
            onStepClick={setStep}
          />
        </div>

        {step > 1 && (
          <button className={styles.back} onClick={back} aria-label="Tillbaka">
            ← Tillbaka
          </button>
        )}

        <div key={step} className={styles.stepWrap}>
          <StepComponent
            data={data}
            onNext={next}
            submitLabel={isLast ? 'Spara' : undefined}
          />
        </div>

        {!isLast && (
          <button className={styles.skip} onClick={() => next({})}>
            Hoppa över
          </button>
        )}
      </div>
    </div>
  );
}
