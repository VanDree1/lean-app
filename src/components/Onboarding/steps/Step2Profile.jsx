import { useEffect, useRef, useState } from 'react';
import s from '../Step.module.css';

const GENDERS = ['Man', 'Kvinna'];
const PROFILE_STORAGE_KEY = 'djur_i_juni_profile';

export default function Step2Profile({ data, onNext, submitLabel = 'Nästa' }) {
  const hideToastTimeoutRef = useRef(null);
  const nextStepTimeoutRef = useRef(null);
  const [profile, setProfile] = useState(() => {
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
  const [showToast, setShowToast] = useState(false);

  useEffect(() => () => {
    clearTimeout(hideToastTimeoutRef.current);
    clearTimeout(nextStepTimeoutRef.current);
  }, []);

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
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

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(payload));
    setShowToast(true);
    clearTimeout(hideToastTimeoutRef.current);
    clearTimeout(nextStepTimeoutRef.current);
    hideToastTimeoutRef.current = setTimeout(() => setShowToast(false), 4000);
    nextStepTimeoutRef.current = setTimeout(() => onNext(payload), 650);
  }

  const valid =
    profile.name.trim() &&
    Number(profile.age) > 0 &&
    Number(profile.height) > 0;

  return (
    <form className={s.step} onSubmit={handleSubmit} noValidate>
      {showToast && (
        <div className={s.toast} role="status" aria-live="polite">
          <span className={s.toastIcon} aria-hidden="true">✓</span>
          <div className={s.toastText}>
            <span className={s.toastTitle}>Din profil är sparad.</span>
            <span className={s.toastBody}>Du kan ändra den när du vill.</span>
          </div>
        </div>
      )}

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

      <button className={s.btnPrimary} type="submit" disabled={!valid}>
        {submitLabel}
      </button>
    </form>
  );
}
