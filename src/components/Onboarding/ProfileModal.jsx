import { useEffect, useRef, useState } from 'react';
import { useOnboarding } from './useOnboarding';
import StepProgress from './StepProgress';
import StepGoal         from './steps/StepGoal';
import StepActivity     from './steps/StepActivity';
import Step2Profile       from './steps/Step2Profile';
import Step3CurrentWeight from './steps/Step3CurrentWeight';
import Step4GoalWeight    from './steps/Step4GoalWeight';
import Step6Diet          from './steps/Step6Diet';
import { useAppStore } from '../../store/useAppStore';
import styles from './Onboarding.module.css';
import pm from './ProfileModal.module.css';

const STEPS = [StepGoal, StepActivity, Step2Profile, Step3CurrentWeight, Step4GoalWeight, Step6Diet];
const STEP_TITLES = [
  'Mål',
  'Aktivitet',
  'Om dig',
  'Nuvarande vikt',
  'Målvikt',
  'Kost',
];

const EMPTY = {
  name: '', height: '', age: '', gender: '', activity: '',
  currentWeight: '', goalWeight: '', pace: 0.5, targetDate: '',
  diet: '', allergies: '',
};

function isPositiveNumber(value) {
  return Number(value) > 0;
}

function buildGoalWeightPatch(data) {
  const current = parseFloat(data.currentWeight) || 0;
  const goal = parseFloat(data.goalWeight);
  const pace = Number(data.pace) || 0;
  const isGain = data.weightGoal === 'gain';
  const validGoal = !Number.isNaN(goal) && goal >= 30 && goal <= 300 && (isGain ? goal > current : goal < current);

  if (!validGoal || !pace || current <= 0) {
    return {
      goalWeight: data.goalWeight,
      pace,
      targetDate: '',
    };
  }

  const diff = isGain ? goal - current : current - goal;
  const weeks = diff / pace;
  const date = new Date();
  date.setDate(date.getDate() + Math.round(weeks * 7));

  return {
    goalWeight: data.goalWeight,
    pace,
    targetDate: date.toISOString().slice(0, 10),
  };
}

function getStepPatch(step, data) {
  switch (step) {
    case 1:
      return { goal: data.goal || '' };
    case 2:
      return { activity: data.activity || '' };
    case 3:
      return {
        name: data.name?.trim?.() || '',
        age: data.age || '',
        height: data.height || '',
        gender: data.gender || '',
      };
    case 4:
      return {
        currentWeight: data.currentWeight ? String(parseFloat(data.currentWeight)) : '',
      };
    case 5:
      return buildGoalWeightPatch(data);
    case 6:
      return {
        diet: data.diet || '',
        allergies: data.allergies || '',
      };
    default:
      return {};
  }
}

function canProceed(step, data) {
  switch (step) {
    case 1:
      return Boolean(data.goal);
    case 2:
      return Boolean(data.activity);
    case 3:
      return Boolean(data.name?.trim()) && isPositiveNumber(data.age) && isPositiveNumber(data.height);
    case 4:
      return isPositiveNumber(data.currentWeight);
    case 5: {
      const current = parseFloat(data.currentWeight) || 0;
      const goal = parseFloat(data.goalWeight);
      const isGain = data.weightGoal === 'gain';
      return current > 0 && !Number.isNaN(goal) && goal >= 30 && goal <= 300 && Number(data.pace) > 0 &&
        (isGain ? goal > current : goal < current);
    }
    case 6:
      return Boolean(data.diet);
    default:
      return false;
  }
}

export default function ProfileModal({ onClose }) {
  const { state } = useAppStore();
  const { complete, saveDraft } = useOnboarding();
  const closeTimeoutRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState(() => ({ ...EMPTY, ...(state.onboarding || {}) }));
  const [saved, setSaved] = useState(false);

  useEffect(() => () => clearTimeout(closeTimeoutRef.current), []);

  useEffect(() => {
    if (!saved) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([14, 36, 18]);
    }
  }, [saved]);

  function updateProfileData(partial) {
    setProfileData((current) => ({ ...current, ...partial }));
  }

  function next() {
    const patch = getStepPatch(currentStep, profileData);
    const newData = { ...profileData, ...patch };

    setProfileData(newData);
    saveDraft(newData);
    if (currentStep === STEPS.length) {
      complete(newData);
      setSaved(true);
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => onClose(), 1900);
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function back() {
    setCurrentStep((s) => Math.max(1, s - 1));
  }

  const StepComponent = STEPS[currentStep - 1];
  const isLast = currentStep === STEPS.length;
  const nextEnabled = canProceed(currentStep, profileData);
  const currentStepTitle = STEP_TITLES[currentStep - 1];
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className={pm.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={[styles.card, pm.modalCard].join(' ')}>
        {saved && (
          <div className={pm.savedState} role="status" aria-live="polite">
            <div className={pm.savedVeil} aria-hidden="true" />
            <div className={pm.savedHalo} aria-hidden="true" />
            <div className={pm.savedBurst} aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => (
                <span
                  key={index}
                  className={pm.savedSpark}
                  style={{ '--spark-index': index }}
                />
              ))}
            </div>
            <div className={pm.savedBanner}>
              <span className={pm.savedIcon} aria-hidden="true">✓</span>
              <div className={pm.savedText}>
                <span className={pm.savedEyebrow}>Grattis</span>
                <span className={pm.savedTitle}>Din profil har skapats.</span>
                <span className={pm.savedBody}>Allt finns sparat och klart att använda i appen.</span>
              </div>
            </div>
          </div>
        )}

        <div className={pm.header}>
          <div className={pm.headerTop}>
            <p className={pm.eyebrow}>Din profil</p>
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
              onChangeData={updateProfileData}
              showFooter={false}
            />
          </div>
        </div>

        <div className={pm.footer}>
          <div className={pm.footerMeta}>
            <div className={pm.footerStepCopy}>
              <span className={pm.footerEyebrow}>Steg {currentStep} av {STEPS.length}</span>
              <span className={pm.footerTitle}>{currentStepTitle}</span>
            </div>
            <span className={[pm.footerStatus, nextEnabled ? pm.footerStatusReady : ''].join(' ')}>
              {nextEnabled ? 'Redo' : 'Fyll i för att fortsätta'}
            </span>
          </div>
          <div className={pm.footerProgress} aria-hidden="true">
            <div className={pm.footerProgressFill} style={{ width: `${progress}%` }} />
          </div>
          <button
            type="button"
            className={[pm.footerButton, !nextEnabled ? pm.footerButtonDisabled : ''].join(' ')}
            disabled={!nextEnabled || saved}
            onClick={next}
          >
            {isLast ? 'Spara' : 'Nästa'}
          </button>
        </div>
      </div>
    </div>
  );
}
