import { useEffect, useRef, useState } from 'react';
import { useOnboarding } from './useOnboarding';
import StepProgress from './StepProgress';
import StepGoal         from './steps/StepGoal';
import StepActivity     from './steps/StepActivity';
import Step2Profile       from './steps/Step2Profile';
import Step3CurrentWeight from './steps/Step3CurrentWeight';
import Step4GoalWeight    from './steps/Step4GoalWeight';
import Step6Diet          from './steps/Step6Diet';
import styles from './Onboarding.module.css';
import pm from './ProfileModal.module.css';

const STEPS = [StepGoal, StepActivity, Step2Profile, Step3CurrentWeight, Step4GoalWeight, Step6Diet];

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
  const { complete, saveDraft } = useOnboarding();
  const closeTimeoutRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState(loadSaved);
  const [saved, setSaved] = useState(false);

  useEffect(() => () => clearTimeout(closeTimeoutRef.current), []);

  function next(partial) {
    const newData = { ...profileData, ...partial };
    setProfileData(newData);
    saveDraft(newData);
    if (currentStep === STEPS.length) {
      complete(newData);
      setSaved(true);
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => onClose(), 1400);
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function back() {
    setCurrentStep((s) => Math.max(1, s - 1));
  }

  const StepComponent = STEPS[currentStep - 1];
  const isLast = currentStep === STEPS.length;

  return (
    <div className={pm.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={[styles.card, pm.modalCard].join(' ')}>
        {saved && (
          <div className={pm.savedState} role="status" aria-live="polite">
            <div className={pm.savedGlow} aria-hidden="true" />
            <div className={pm.savedBanner}>
              <span className={pm.savedIcon} aria-hidden="true">✓</span>
              <div className={pm.savedText}>
                <span className={pm.savedTitle}>Din profil är sparad.</span>
                <span className={pm.savedBody}>Alla ändringar är uppdaterade i appen.</span>
              </div>
            </div>
          </div>
        )}

        <div className={pm.header}>
          <div className={pm.headerTop}>
            <div>
              <p className={pm.eyebrow}>Profil</p>
              <h2 className={pm.title}>Justera din riktning</h2>
            </div>
            <button className={pm.close} onClick={onClose} aria-label="Stäng">✕</button>
          </div>
          <StepProgress
            current={currentStep}
            total={STEPS.length}
            onStepClick={setCurrentStep}
          />
        </div>

        <div className={pm.scrollBody}>
          {currentStep > 1 && (
            <button className={styles.back} onClick={back} aria-label="Tillbaka">
              ← Tillbaka
            </button>
          )}

          <div key={currentStep} className={[styles.stepWrap, pm.stepFade].join(' ')}>
            <StepComponent
              data={profileData}
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
    </div>
  );
}
