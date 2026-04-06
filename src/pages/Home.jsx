import { useEffect, useRef, useState } from 'react';
import { Activity, Bike, Check, Dumbbell, Flower2, Footprints } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber/AnimatedNumber';
import HeroCard from '../components/HeroCard/HeroCard';
import MotivationTip from '../components/MotivationTip/MotivationTip';
import QuickStats from '../components/QuickStats/QuickStats';
import WeightModal from '../components/Weight/WeightModal';
import { useWeightLog } from '../components/Weight/useWeightLog';
import { useGoalTone } from '../hooks/useGoalTone';
import { useInsights } from '../hooks/useInsights';
import { useAppStore } from '../store/useAppStore';
import Journal from './Journal';
import styles from './Home.module.css';
const WEIGHT_TREND = [103.2, 102.5, 102.1, 101.8, 101.0, 100.5, 100.0];
const WORKOUTS = {
  gym: { name: 'Gym', met: 6.0, Icon: Dumbbell },
  run: { name: 'Löpning', met: 9.8, Icon: Footprints },
  yoga: { name: 'Yoga', met: 3.0, Icon: Flower2 },
  cycle: { name: 'Cykling', met: 7.5, Icon: Bike },
  other: { name: 'Annat', met: 5.0, Icon: Activity },
};

function isSameDayAsToday(value) {
  if (!value) return false;

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayText = new Date().toDateString();

  if (value === todayIso || value === todayText) return true;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  return parsed.toISOString().slice(0, 10) === todayIso;
}

function formatSavedTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function preventWheelValueChange(event) {
  event.currentTarget.blur();
}

function DailyFocusCard({ latestWeight, eaten, setEaten, burned, setBurned, locked, tone, sleepHoursToday, setSleepHoursToday, lowEnergyMode, onOpenJournal }) {
  const { state, completeDailyCheckin, unlockDailyCheckin } = useAppStore();
  const weight = Number(latestWeight) || 100;
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSavedState, setShowSavedState] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [isEditingToday, setIsEditingToday] = useState(false);
  const [caloriesInput, setCaloriesInput] = useState('');
  const [sleepHours, setSleepHours] = useState(String(sleepHoursToday || 8));
  const [activeWorkoutKey, setActiveWorkoutKey] = useState(null);
  const [duration, setDuration] = useState(30);
  const [comment, setComment] = useState('');
  const [savedAt, setSavedAt] = useState(() => formatSavedTime(state.daily.savedAt));
  const caloriesInputRef = useRef(null);
  const sleepInputRef = useRef(null);
  const workoutSectionRef = useRef(null);
  const todayString = new Date().toDateString();
  const todayCheckin = (() => {
    try {
      const stored = state.daily.dailyCheckin;
      if (isSameDayAsToday(stored?.date)) return stored;
      return null;
    } catch {
      return null;
    }
  })();
  const isLoggedToday = locked && Boolean(todayCheckin);
  const activeWorkout = activeWorkoutKey ? WORKOUTS[activeWorkoutKey] : null;
  const workoutEntries = Object.entries(WORKOUTS).sort(([a], [b]) => {
    if (!lowEnergyMode) return 0;

    const rank = (key) => {
      if (key === 'yoga') return 0;
      if (key === 'run') return 1;
      if (key === 'cycle') return 2;
      if (key === 'other') return 3;
      if (key === 'gym') return 4;
      return 5;
    };

    return rank(a) - rank(b);
  });
  const estimatedCalories = activeWorkout
    ? Math.round(activeWorkout.met * weight * (duration / 60))
    : 0;
  const parsedCalories = parseInt(caloriesInput, 10);
  const parsedSleep = Number(sleepHours);
  const canSave =
    Number.isFinite(parsedCalories) &&
    parsedCalories >= 0 &&
    Number.isFinite(parsedSleep) &&
    parsedSleep > 0 &&
    parsedSleep <= 24;
  const summaryItems = isLoggedToday
    ? [
        `${todayCheckin?.calories ?? eaten} kcal`,
        todayCheckin?.workoutName
          ? `${todayCheckin.workoutName}${todayCheckin?.duration ? ` ${todayCheckin.duration} min` : ''}`
          : 'Ingen träning',
        `${todayCheckin?.sleepHours ?? 0} h sömn`,
      ]
    : [];

  useEffect(() => {
    if (!showActionPicker) return;
    const timer = window.setTimeout(() => {
      caloriesInputRef.current?.focus();
      caloriesInputRef.current?.select();
    }, 40);

    return () => window.clearTimeout(timer);
  }, [showActionPicker]);

  function handleCheckIn() {
    setIsEditingToday(false);
    setCaloriesInput(String(todayCheckin?.calories ?? eaten ?? 0));
    setSleepHours(String(todayCheckin?.sleepHours ?? sleepHoursToday ?? 8));
    setActiveWorkoutKey(todayCheckin?.workoutKey ?? null);
    setDuration(Number(todayCheckin?.duration) || 30);
    setComment(todayCheckin?.comment ?? '');
    setShowActionPicker(true);
  }

  function completeCheckIn() {
    if (!Number.isFinite(parsedCalories) || parsedCalories < 0) return;
    if (!Number.isFinite(parsedSleep) || parsedSleep <= 0 || parsedSleep > 24) return;

    const alreadyLogged = locked || Boolean(todayCheckin);
    const currentStreak = state.daily.streak || 0;
    const nextStreak = alreadyLogged ? currentStreak : currentStreak + 1;
    const workoutBurn = activeWorkout ? estimatedCalories : 0;
    const previousBurn = Number(todayCheckin?.burned) || 0;
    const nextBurnedTotal = Math.max(0, burned - previousBurn + workoutBurn);
    const nextCheckin = {
      date: todayString,
      calories: parsedCalories,
      workoutKey: activeWorkoutKey,
      workoutName: activeWorkout?.name ?? '',
      duration,
      burned: workoutBurn,
      sleepHours: parsedSleep,
      comment: comment.trim(),
    };

    setIsCompleting(true);
    setEaten(parsedCalories);
    setBurned(nextBurnedTotal);
    setSleepHoursToday(parsedSleep);
    const savedAtIso = new Date().toISOString();
    completeDailyCheckin({
      calories: parsedCalories,
      burned: nextBurnedTotal,
      sleepHours: parsedSleep,
      checkin: nextCheckin,
      lastLoggedDate: todayString,
      streak: nextStreak,
      savedAt: savedAtIso,
    });
    setSavedAt(formatSavedTime(savedAtIso));
    setShowSavedState(true);

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([18, 24, 28]);
    }

    window.setTimeout(() => {
      setShowSavedState(false);
      setShowActionPicker(false);
      setIsCompleting(false);
    }, 800);
  }

  function handleFormKeyDown(event, field) {
    if (event.key !== 'Enter') return;
    if (event.shiftKey) return;
    event.preventDefault();

    if (field === 'calories') {
      sleepInputRef.current?.focus();
      sleepInputRef.current?.select?.();
      return;
    }

    if (field === 'sleep') {
      if (!activeWorkoutKey) {
        if (canSave) completeCheckIn();
        return;
      }

      workoutSectionRef.current?.focus();
      return;
    }

    if (!canSave) return;
    completeCheckIn();
  }

  function handleUnlock(event) {
    event.stopPropagation();
    setIsEditingToday(true);
    unlockDailyCheckin();
    setCaloriesInput(String(todayCheckin?.calories ?? eaten ?? 0));
    setSleepHours(String(todayCheckin?.sleepHours ?? sleepHoursToday ?? 8));
    setActiveWorkoutKey(todayCheckin?.workoutKey ?? null);
    setDuration(Number(todayCheckin?.duration) || 30);
    setComment(todayCheckin?.comment ?? '');
    setShowActionPicker(true);
  }

  return (
    <>
      {isLoggedToday ? (
        <section
          className={[
            styles.focusCard,
            styles.focusCheckin,
            isCompleting ? styles.focusCardCompleting : '',
            styles.focusCardLogged,
          ].join(' ')}
          aria-labelledby="today-title"
          role="group"
        >
          <div className={styles.focusContent}>
            <div className={styles.focusMain}>
              <p className={styles.sectionEyebrow}>Idag</p>
              <h2 id="today-title" className={styles.focusTitle}>Dagens insats är klar.</h2>
              <p className={styles.focusBody}>Kalorier, träning och sömn är sparat.</p>
              <div className={styles.focusSummaryRow}>
                {summaryItems.map((item) => (
                  <span key={item} className={styles.focusSummaryPill}>
                    {item}
                  </span>
                ))}
              </div>
              <div className={styles.focusMetaActions}>
                <button type="button" className={styles.focusEditLink} onClick={handleUnlock}>
                  Lås upp
                </button>
                <button type="button" className={styles.focusJournalLink} onClick={onOpenJournal}>
                  Journal
                </button>
              </div>
              {savedAt ? <p className={styles.focusSavedMeta}>Sparad {savedAt}</p> : null}
            </div>
          </div>

          <div className={styles.focusStatus} aria-hidden="true">
            <span className={styles.focusCheckWrap}>
              <Check size={18} strokeWidth={1.8} className={styles.focusCheckIcon} />
            </span>
          </div>
        </section>
      ) : (
        <button
          type="button"
          className={[
            styles.focusCard,
            styles.focusCheckin,
            isCompleting ? styles.focusCardCompleting : '',
            styles.focusCardTodo,
          ].join(' ')}
          aria-labelledby="today-title"
          onClick={handleCheckIn}
        >
          <div className={styles.focusContent}>
            <div className={styles.focusMain}>
              <p className={styles.sectionEyebrow}>Idag</p>
              <h2 id="today-title" className={styles.focusTitle}>Logga dagen</h2>
              <p className={styles.focusBody}>{lowEnergyMode ? tone.recovery.dailyBody : tone.daily.body}</p>
              <p className={styles.focusMeta}>{lowEnergyMode ? tone.recovery.dailyMeta : tone.daily.meta}</p>
            </div>
          </div>

          <div className={styles.focusStatus} aria-hidden="true">
            <span className={styles.focusPulseDot} />
          </div>
        </button>
      )}
      {showActionPicker && (
        <section className={styles.focusInlineSheet} role="dialog" aria-label="Fyll i dagens insats">
          <div className={styles.focusSheetHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Dagens insats</p>
              <h3 className={styles.focusSheetTitle}>
                {isEditingToday ? 'Justera dagen' : 'Fyll i dagen'}
              </h3>
              {isEditingToday ? (
                <p className={styles.focusSheetSubtitle}>Dagens värden är redan ifyllda.</p>
              ) : null}
            </div>
            <button
              type="button"
              className={styles.focusSheetClose}
              onClick={() => {
                setShowActionPicker(false);
                setIsEditingToday(false);
              }}
              aria-label="Stäng dagens insats"
            >
              ✕
            </button>
          </div>
          <div className={styles.focusForm}>
            <div className={styles.focusTopFields}>
            <label className={styles.focusField}>
              <span className={styles.focusFieldLabel}>{tone.daily.primaryFieldLabel}</span>
              <input
                ref={caloriesInputRef}
                type="number"
                inputMode="numeric"
                className={styles.focusInput}
                value={caloriesInput}
                onChange={(event) => setCaloriesInput(event.target.value)}
                onKeyDown={(event) => handleFormKeyDown(event, 'calories')}
                onWheel={preventWheelValueChange}
                placeholder="Till exempel 1850"
                min="0"
              />
            </label>

            <label className={styles.focusField}>
              <span className={styles.focusFieldLabel}>{tone.daily.secondaryFieldLabel}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                max="24"
                ref={sleepInputRef}
                className={styles.focusInput}
                value={sleepHours}
                onChange={(event) => setSleepHours(event.target.value)}
                onKeyDown={(event) => handleFormKeyDown(event, 'sleep')}
                onWheel={preventWheelValueChange}
                placeholder="Till exempel 8"
              />
            </label>
            </div>

            <label className={styles.focusField}>
              <span className={styles.focusFieldLabel}>Kommentar</span>
              <input
                type="text"
                className={styles.focusInput}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Valfritt"
                maxLength={90}
              />
            </label>

            <div
              ref={workoutSectionRef}
              tabIndex={activeWorkout ? 0 : -1}
              className={[styles.focusField, !activeWorkout ? styles.focusFieldMuted : ''].join(' ')}
              onKeyDown={(event) => handleFormKeyDown(event, 'workout')}
            >
              <div className={styles.focusFieldHeader}>
                <span className={styles.focusFieldLabel}>{tone.daily.workoutLabel}</span>
                {activeWorkout ? <span className={styles.focusFieldHint}>+{estimatedCalories} kcal</span> : null}
              </div>
              {!activeWorkout ? (
                <p className={styles.focusFieldCopy}>
                  {lowEnergyMode ? tone.recovery.dailyBody : tone.daily.workoutHint}
                </p>
              ) : null}
              <div className={styles.workoutGrid}>
                {workoutEntries.map(([key, workout]) => {
                  const active = activeWorkoutKey === key;
                  const isRecoveryPick = key === 'yoga' || key === 'run';
                  const isDimmedInRecovery = lowEnergyMode && key === 'gym';
                  const workoutLabel = lowEnergyMode && key === 'run' ? 'Promenad' : workout.name;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={[
                        styles.workoutOption,
                        active ? styles.workoutOptionActive : '',
                        lowEnergyMode && isRecoveryPick ? styles.workoutOptionRecovery : '',
                        isDimmedInRecovery ? styles.workoutOptionDim : '',
                      ].join(' ')}
                      onClick={() => setActiveWorkoutKey(active ? null : key)}
                      aria-pressed={active}
                      aria-label={workoutLabel}
                    >
                      <workout.Icon size={24} strokeWidth={1.5} />
                      <span className={styles.workoutLabel}>{workoutLabel}</span>
                    </button>
                  );
                })}
              </div>
              {activeWorkout && (
                <div className={styles.workoutDetail}>
                  <div className={styles.workoutDetailHeader}>
                    <span className={styles.workoutDetailName}>{activeWorkout.name}</span>
                    <span className={styles.workoutDuration}>{duration} min</span>
                  </div>
                  <input
                    className={styles.workoutSlider}
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={duration}
                    onChange={(event) => setDuration(Number(event.target.value))}
                    onKeyDown={handleFormKeyDown}
                    aria-label="Träningslängd i minuter"
                  />
                  <div className={styles.workoutScale}>
                    <span>10 min</span>
                    <span>120 min</span>
                  </div>
                  <p className={styles.workoutEstimate}>+{estimatedCalories} kcal</p>
                </div>
              )}
            </div>
          </div>
          <div className={styles.focusSheetActions}>
            {showSavedState ? (
              <div className={styles.focusSavedState} aria-live="polite">
                <span className={styles.focusSavedCheck}>
                  <Check size={16} strokeWidth={1.9} />
                </span>
                <span className={styles.focusSavedText}>Dagen är sparad</span>
              </div>
            ) : null}
              <button
                type="button"
                className={styles.focusSheetSecondary}
                onClick={() => {
                  setShowActionPicker(false);
                  setIsEditingToday(false);
                }}
                disabled={showSavedState}
              >
                Avbryt
              </button>
            <button
              type="button"
              className={styles.focusSheetPrimary}
              onClick={completeCheckIn}
              disabled={!canSave || showSavedState}
            >
              {showSavedState ? 'Sparat' : isEditingToday ? 'Uppdatera dagen' : 'Spara dagens insats'}
            </button>
          </div>
        </section>
      )}
    </>
  );
}

function SleepRecoveryCard({ sleepHoursToday, setSleepHoursToday, lowEnergyMode, tone }) {
  return (
    <section className={styles.noteCard} aria-label={tone.recovery.sleepTitle}>
      <div className={styles.contextHeader}>
        <p className={styles.sectionEyebrow}>{tone.recovery.sleepTitle}</p>
        <span className={styles.contextStatus}>{lowEnergyMode ? tone.recovery.quoteStatus : 'Återhämtning'}</span>
      </div>
      <div className={styles.sleepTopRow}>
        <div className={styles.sleepValueWrap}>
          <span className={styles.sleepValue}>
            <AnimatedNumber value={sleepHoursToday} duration={500} decimals={1} />
          </span>
          <span className={styles.sleepUnit}>timmar</span>
        </div>
        <span className={[styles.sleepBadge, lowEnergyMode ? styles.sleepBadgeWarning : ''].join(' ')}>
          {lowEnergyMode ? 'Låg energi' : 'Stabil'}
        </span>
      </div>
      <input
        className={styles.sleepSlider}
        type="range"
        min="3"
        max="10"
        step="0.5"
        value={sleepHoursToday}
        onChange={(event) => {
          const next = Number(event.target.value);
          setSleepHoursToday(next);
        }}
        aria-label="Sömn i timmar"
      />
      <div className={styles.sleepScale}>
        <span>3 h</span>
        <span>10 h</span>
      </div>
      <p className={styles.contextBody}>{tone.recovery.sleepBody}</p>
    </section>
  );
}

function PatternInsightCard({ insight }) {
  if (!insight) return null;

  return (
    <section className={[styles.noteCard, styles.insightCard, styles[`insightTone${insight.tone === 'warning' ? 'Warning' : insight.tone === 'positive' ? 'Positive' : 'Neutral'}`]].join(' ')} aria-label={insight.title}>
      <div className={styles.contextHeader}>
        <p className={styles.sectionEyebrow}>{insight.title}</p>
        <span className={styles.contextStatus}>{insight.status}</span>
      </div>
      <p className={styles.contextBody}>{insight.body}</p>
    </section>
  );
}

function WeightJourney({ onOpen, onOpenHistory, profile, locked }) {
  const { recent, current } = useWeightLog();
  const startWeight = profile.startWeight ?? profile.weight ?? profile.currentWeight ?? 100;
  const goalWeight = profile.goalWeight ?? 90;
  const lost = startWeight - current;
  const totalToLose = startWeight - goalWeight;
  const progress = totalToLose > 0
    ? Math.min(100, Math.max(0, (lost / totalToLose) * 100))
    : 0;
  const lowest = recent.length > 0 ? Math.min(...recent.map((entry) => entry.weight)) : current;
  const isLowest = current <= lowest;
  const minTrend = Math.min(...WEIGHT_TREND);
  const maxTrend = Math.max(...WEIGHT_TREND);
  const trendRange = maxTrend - minTrend || 1;
  const trendPath = WEIGHT_TREND.map((value, index) => {
    const x = (index / (WEIGHT_TREND.length - 1)) * 100;
    const y = 85 - (((value - minTrend) / trendRange) * 55);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <section
      className={[styles.weightCard, locked ? styles.weightCardLocked : ''].join(' ')}
      role="button"
      tabIndex={locked ? -1 : 0}
      onClick={locked ? undefined : onOpen}
      onKeyDown={(event) => {
        if (locked) return;
        if (event.key === 'Enter') onOpen();
      }}
      aria-disabled={locked}
    >
      <div className={styles.weightSparkline} aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.weightSparklineSvg}>
          <path d={trendPath} className={styles.weightSparklinePath} />
        </svg>
      </div>

      <div className={styles.weightContent}>
      <div className={styles.weightHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Logga vikt</p>
          <h2 className={styles.weightValue}>
            <AnimatedNumber value={current} duration={800} decimals={1} />
            <span className={styles.weightUnit}>kg</span>
          </h2>
        </div>
        <div className={styles.weightBadge}>{progress.toFixed(0)}% klart</div>
      </div>

      <div className={styles.milestoneWrap}>
        <div className={styles.milestoneHeader}>
          <span>Start {startWeight}</span>
          <span>Nu {current.toFixed(1)}</span>
          <span>Mål {goalWeight}</span>
        </div>
        <div className={styles.milestoneTrack}>
          <div className={styles.milestoneFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.weightFooter}>
        <p className={styles.weightMessage}>
          {locked
            ? 'Dagens vikt är stängd.'
            : isLowest
              ? 'Nytt lägsta. Fortsätt registrera vikten lugnt.'
              : 'Tryck här för att logga eller justera dagens vikt.'}
        </p>
        <button
          type="button"
          className={styles.weightHistoryLink}
          onClick={(event) => {
            event.stopPropagation();
            onOpenHistory();
          }}
        >
          Öppna historik
        </button>
      </div>
      </div>
    </section>
  );
}

export default function Home({ profile }) {
  const { state, setDailyValues } = useAppStore();
  const { current: latestWeight } = useWeightLog();
  const tone = useGoalTone(profile);
  const insight = useInsights({
    dailyEntries: state.daily.dailyEntries,
    weightLog: state.weightLog,
    goal: tone.goal,
  });
  const [modal, setModal] = useState(null);
  const eaten = state.daily.calories;
  const burned = state.daily.burned;
  const isDayLocked = isSameDayAsToday(state.daily.lastLoggedDate) && isSameDayAsToday(state.daily.dailyCheckin?.date);
  const sleepHoursToday = state.daily.sleepHours;
  const lowEnergyMode = sleepHoursToday < 6;
  const setEaten = (value) => setDailyValues({ calories: value });
  const setBurned = (value) => setDailyValues({ burned: value });
  const setSleepHoursToday = (value) => setDailyValues({ sleepHours: value });

  return (
    <main className={styles.main}>
      <div className={styles.stack}>
        <HeroCard profile={profile} />
        <DailyFocusCard
          latestWeight={latestWeight}
          eaten={eaten}
          setEaten={setEaten}
          burned={burned}
          setBurned={setBurned}
          locked={isDayLocked}
          tone={tone}
          sleepHoursToday={sleepHoursToday}
          setSleepHoursToday={setSleepHoursToday}
          lowEnergyMode={lowEnergyMode}
          onOpenJournal={() => setModal('journal')}
        />
        <SleepRecoveryCard
          sleepHoursToday={sleepHoursToday}
          setSleepHoursToday={setSleepHoursToday}
          lowEnergyMode={lowEnergyMode}
          tone={tone}
        />
        <div className={styles.logSection}>
        <div className={styles.logSectionHeader}>
          <p className={styles.sectionEyebrow}>Logga idag</p>
          <h2 className={styles.logSectionTitle}>{tone.log.title}</h2>
          <p className={styles.logSectionBody}>{tone.log.body}</p>
          </div>
        <WeightJourney
          profile={profile}
          locked={isDayLocked}
          onOpen={() => setModal('weight')}
          onOpenHistory={() => setModal('journal')}
        />
        <QuickStats
          profile={profile}
          locked={isDayLocked}
        />
        </div>
        <PatternInsightCard insight={insight} />
        <MotivationTip profile={profile} lowEnergyMode={lowEnergyMode} recoveryTone={tone.recovery} />
      </div>

      {modal === 'weight' && <WeightModal onClose={() => setModal(null)} onOpenJournal={() => setModal('journal')} />}
      {modal === 'journal' && <Journal onClose={() => setModal(null)} />}
    </main>
  );
}
