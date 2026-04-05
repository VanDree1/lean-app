import { useEffect, useMemo, useRef, useState } from 'react';
import s from '../Step.module.css';

const GENDERS = ['Man', 'Kvinna'];
const PROFILE_STORAGE_KEY = 'djur-i-juni:profile';

export default function Step2Profile({ data, onNext, onChangeData, showFooter = true, submitLabel = 'Nästa' }) {
  const controlled = typeof onChangeData === 'function';
  const autosaveTimeoutRef = useRef(null);
  const [localProfile, setLocalProfile] = useState(() => {
    const initial = {
      name: data.name ?? '',
      age: data.age ?? '',
      height: data.height ?? '',
      gender: data.gender ?? '',
    };

    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!stored) return initial;

      const parsed = JSON.parse(stored);
      return {
        ...initial,
        name: parsed?.name ?? initial.name,
        age: parsed?.age ?? initial.age,
        height: parsed?.height ?? initial.height,
        gender: parsed?.gender ?? initial.gender,
      };
    } catch {
      return initial;
    }
  });
  const [saveState, setSaveState] = useState('idle');
  const profile = useMemo(() => (
    controlled
      ? {
        name: data.name ?? '',
        age: data.age ?? '',
        height: data.height ?? '',
        gender: data.gender ?? '',
      }
      : localProfile
  ), [controlled, data.age, data.gender, data.height, data.name, localProfile]);

  useEffect(() => () => {
    clearTimeout(autosaveTimeoutRef.current);
  }, []);

  useEffect(() => {
    const hasContent = profile.name || profile.age || profile.height || profile.gender;
    if (!hasContent) return;

    clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(() => {
      try {
        const existing = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || '{}');
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...existing, ...profile }));
      } catch {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      }
      setSaveState('saved');
    }, 220);
  }, [profile]);

  function updateProfile(field, value) {
    setSaveState('saving');
    if (controlled) {
      onChangeData({ [field]: value });
    } else {
      setLocalProfile((current) => ({ ...current, [field]: value }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      name: profile.name.trim(),
      age: profile.age,
      height: profile.height,
      gender: profile.gender,
    };

    const validProfile =
      payload.name &&
      Number(payload.age) > 0 &&
      Number(payload.height) > 0;

    if (!validProfile) return;

    try {
      const existing = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || '{}');
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...existing, ...payload }));
    } catch {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(payload));
    }
    setSaveState('saved');
    onNext(payload);
  }

  const valid =
    profile.name.trim() &&
    Number(profile.age) > 0 &&
    Number(profile.height) > 0;

  return (
    <form className={[s.step, !showFooter ? s.stepFooterless : ''].join(' ')} onSubmit={showFooter ? handleSubmit : (e) => e.preventDefault()} noValidate>
      <p className={s.kicker}>Om dig</p>
      <h2 className={s.title}>Om dig</h2>
      <p className={s.subtitle}>
        Det här räcker för att sätta en plan som känns rimlig från start.
      </p>

      <div className={s.field}>
        <label className={s.label} htmlFor="ob-name">Namn</label>
        <input
          id="ob-name"
          className={s.input}
          type="text"
          value={profile.name}
          onChange={(e) => updateProfile('name', e.target.value)}
          placeholder="Ditt förnamn"
          autoFocus
        />
      </div>

      <div className={s.twoCol}>
        <div className={s.field}>
          <label className={s.label} htmlFor="ob-age">Ålder</label>
          <input
            id="ob-age"
            className={s.input}
            type="number"
            inputMode="numeric"
            value={profile.age}
            onChange={(e) => updateProfile('age', e.target.value)}
            placeholder="t.ex. 28"
            min="1"
            max="120"
          />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="ob-height">Längd (cm)</label>
          <input
            id="ob-height"
            className={s.input}
            type="number"
            inputMode="decimal"
            value={profile.height}
            onChange={(e) => updateProfile('height', e.target.value)}
            placeholder="t.ex. 178"
            min="1"
            max="250"
          />
        </div>
      </div>

      <div className={s.field}>
        <span className={s.label}>Kön</span>
        <div className={s.radios}>
          {GENDERS.map((g) => (
            <button
              type="button"
              key={g}
              className={profile.gender === g ? s.radioSelected : s.radio}
              onClick={() => updateProfile('gender', profile.gender === g ? '' : g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className={s.profilePreviewCompact} aria-live="polite">
        <div className={s.profilePreviewHead}>
          <span className={s.profilePreviewTitle}>Utkast</span>
          <span className={s.profileSaveState}>
            {saveState === 'saving' ? 'Sparar...' : saveState === 'saved' ? 'Sparat' : 'Inte sparat än'}
          </span>
        </div>
        <div className={s.profilePreviewRow}>
          <span className={s.profileChip}>{profile.name.trim() || 'Namn saknas'}</span>
          <span className={s.profileChip}>{profile.age ? `${profile.age} år` : 'Ålder saknas'}</span>
          <span className={s.profileChip}>{profile.height ? `${profile.height} cm` : 'Längd saknas'}</span>
          {profile.gender && <span className={s.profileChip}>{profile.gender}</span>}
        </div>
      </div>

      {showFooter && (
        <button className={s.btnPrimary} type="submit" disabled={!valid}>
          {submitLabel}
        </button>
      )}
    </form>
  );
}
