import { useCallback, useState } from 'react';
import { calcTargets } from '../hooks/useProfile';
import { useOnboarding } from '../components/Onboarding/useOnboarding';
import ProfileModal from '../components/Onboarding/ProfileModal';
import { useAppStore } from '../store/useAppStore';
import { getDisplayName } from '../utils/displayName';
import { GOAL_LABELS, GOAL_OPTIONS } from '../utils/goals';
import styles from './Profile.module.css';

const GOALS = GOAL_OPTIONS;

const ACTIVITIES = [
  { value: 'sedentary',   label: 'Stillasittande', desc: 'Kontor, lite rörelse' },
  { value: 'light',       label: 'Måttligt aktiv',  desc: 'Tränar 1–3×/vecka' },
  { value: 'very_active', label: 'Mycket aktiv',    desc: 'Tränar 4+/vecka' },
];

const DIETS = [
  { value: 'Allätare',    desc: 'Äter allt – inga restriktioner' },
  { value: 'Pescetarian', desc: 'Fisk & skaldjur, inga landdjur' },
  { value: 'Vegetarian',  desc: 'Ägg & mejeri, inget kött eller fisk' },
  { value: 'Vegan',       desc: '100% växtbaserat' },
];

const GENDERS = ['Man', 'Kvinna'];

const GOAL_LABEL     = GOAL_LABELS;
const ACTIVITY_LABEL = { sedentary: 'Stillasittande', light: 'Måttligt aktiv', very_active: 'Mycket aktiv' };

function getInitials(name) {
  const displayName = getDisplayName(name);
  if (!displayName) return '?';
  return displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

// ── Field definitions ────────────────────────────────────────────────────────

const FIELDS = {
  caloriesGoal:  { key: 'caloriesGoal',  label: 'Kalorimål',      type: 'number',  placeholder: 'kcal', min: 800,  max: 6000, hint: 'Ditt dagliga kaloriintag i kcal' },
  proteinGoal:   { key: 'proteinGoal',   label: 'Proteinmål',     type: 'number',  placeholder: 'g',    min: 20,   max: 400,  hint: 'Ditt dagliga proteinintag i gram' },
  goalWeight:    { key: 'goalWeight',    label: 'Viktmål',         type: 'number',  placeholder: 'kg',   min: 30,   max: 300,  hint: 'I kilo' },
  currentWeight: { key: 'currentWeight', label: 'Nuv. vikt',       type: 'number',  placeholder: 'kg',   min: 30,   max: 300,  hint: 'I kilo' },
  name:          { key: 'name',          label: 'Namn',            type: 'text',    placeholder: 'Ditt förnamn' },
  age:           { key: 'age',           label: 'Ålder',           type: 'number',  placeholder: 'år',   min: 1,    max: 120 },
  height:        { key: 'height',        label: 'Längd',           type: 'number',  placeholder: 'cm',   min: 100,  max: 250,  hint: 'I centimeter' },
  gender:        { key: 'gender',        label: 'Kön',             type: 'chips',   options: GENDERS },
  goal:          { key: 'goal',          label: 'Mål',             type: 'options', options: GOALS },
  activity:      { key: 'activity',      label: 'Aktivitetsnivå',  type: 'options', options: ACTIVITIES },
  allergies:     { key: 'allergies',     label: 'Allergier & intol.', type: 'text', placeholder: 'T.ex. laktos, nötter' },
};

// ── Auto-saving EditSheet ────────────────────────────────────────────────────
// Options / chips: tap = save + close instantly (no button needed)
// Text / number:   saving happens on close (✕ or backdrop)

function EditSheet({ field, profile, onSave, onClose }) {
  const [value, setValue] = useState(profile[field.key] ?? '');

  function commitAndClose(val) {
    const parsed = field.type === 'number'
      ? (parseFloat(val) || null)
      : (String(val).trim() || null);
    // Only update if valid and changed
    if (parsed !== null && parsed !== profile[field.key]) {
      onSave(field.key, parsed);
    }
    onClose();
  }

  function handleOptionSelect(val) {
    onSave(field.key, val);
    onClose();
  }

  return (
    <div className={styles.sheetOverlay} onClick={(e) => e.target === e.currentTarget && commitAndClose(value)}>
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <h2 className={styles.sheetTitle}>{field.label}</h2>
          <button className={styles.sheetDone} onClick={() => commitAndClose(value)} aria-label="Klar">
            Klar
          </button>
        </div>

        {(field.type === 'text' || field.type === 'number') && (
          <div className={styles.sheetBody}>
            <input
              className={styles.sheetInput}
              type={field.type === 'number' ? 'number' : 'text'}
              inputMode={field.type === 'number' ? 'decimal' : 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={field.placeholder || ''}
              autoFocus
              min={field.min}
              max={field.max}
              onKeyDown={(e) => e.key === 'Enter' && commitAndClose(value)}
            />
            {field.hint && <p className={styles.sheetHint}>{field.hint}</p>}
          </div>
        )}

        {field.type === 'options' && (
          <div className={styles.sheetBody}>
            <div className={styles.optionList}>
              {field.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={value === opt.value ? styles.optionSelected : styles.option}
                  onClick={() => handleOptionSelect(opt.value)}
                >
                  <span className={styles.optionLabel}>{opt.label ?? opt.value}</span>
                  {opt.desc && <span className={styles.optionDesc}>{opt.desc}</span>}
                  {value === opt.value && <span className={styles.optionCheck}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {field.type === 'chips' && (
          <div className={styles.sheetBody}>
            <div className={styles.chipRow}>
              {field.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={value === opt ? styles.chipSelected : styles.chip}
                  onClick={() => handleOptionSelect(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Row ──────────────────────────────────────────────────────────────────────

function ProfileRow({ label, value, onEdit, accent }) {
  return (
    <button type="button" className={styles.row} onClick={onEdit}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowRight}>
        <span className={accent ? styles.rowValueAccent : styles.rowValue}>
          {value || <span className={styles.rowEmpty}>Lägg till</span>}
        </span>
        <span className={styles.rowChevron}>›</span>
      </span>
    </button>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className={styles.section}>
      {title && <p className={styles.sectionTitle}>{title}</p>}
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Profile({ profile }) {
  const { updateProfile, state } = useAppStore();
  const latestWeight = state.weightLog?.[0]?.weight ?? profile.currentWeight ?? null;
  const derivedTargets = calcTargets(profile);
  const { reset } = useOnboarding();
  const [editing, setEditing] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const p = profile;
  const displayName = getDisplayName(p.name);
  const initials = getInitials(p.name);

  const saveField = useCallback((key, value) => {
    updateProfile({ [key]: value, updatedAt: Date.now() });
  }, [updateProfile]);

  const kcalGoal   = p.caloriesGoal ?? derivedTargets.kcalGoal;
  const proteinGoal = p.proteinGoal ?? derivedTargets.proteinGoal;

  return (
    <main className={styles.main}>
      <div className={styles.stack}>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.heroText}>
            <h2 className={styles.heroName}>{displayName || 'Din profil'}</h2>
            <p className={styles.heroSub}>
              {GOAL_LABEL[p.goal] || 'Sätt ditt mål'} · {ACTIVITY_LABEL[p.activity] || 'Välj nivå'}
            </p>
          </div>
        </div>

        {/* Mål */}
        <SectionCard title="Mål">
          <ProfileRow
            label="Kalorimål"
            value={kcalGoal ? `${kcalGoal} kcal` : null}
            onEdit={() => setEditing('caloriesGoal')}
            accent
          />
          <ProfileRow
            label="Proteinmål"
            value={proteinGoal ? `${proteinGoal} g` : null}
            onEdit={() => setEditing('proteinGoal')}
          />
          <ProfileRow
            label="Nuv. vikt"
            value={latestWeight ? `${latestWeight} kg` : null}
            onEdit={() => setEditing('currentWeight')}
          />
          <ProfileRow
            label="Viktmål"
            value={p.goalWeight ? `${p.goalWeight} kg` : null}
            onEdit={() => setEditing('goalWeight')}
          />
        </SectionCard>

        {/* Kosthållning — inline pills, no sheet */}
        <SectionCard title="Kosthållning">
          <div className={styles.dietGrid}>
            {DIETS.map((d) => (
              <button
                key={d.value}
                type="button"
                className={p.diet === d.value ? styles.dietPillActive : styles.dietPill}
                onClick={() => saveField('diet', d.value)}
              >
                <span className={styles.dietPillLabel}>{d.value}</span>
                <span className={styles.dietPillDesc}>{d.desc}</span>
              </button>
            ))}
          </div>
          <ProfileRow
            label="Allergier & intol."
            value={p.allergies || null}
            onEdit={() => setEditing('allergies')}
          />
        </SectionCard>

        {/* Personuppgifter */}
        <SectionCard title="Personuppgifter">
          <ProfileRow label="Namn"   value={displayName}                       onEdit={() => setEditing('name')} />
          <ProfileRow label="Ålder"  value={p.age ? `${p.age} år` : null}      onEdit={() => setEditing('age')} />
          <ProfileRow label="Längd"  value={p.height ? `${p.height} cm` : null} onEdit={() => setEditing('height')} />
          <ProfileRow label="Kön"    value={p.gender}                           onEdit={() => setEditing('gender')} />
        </SectionCard>

        {/* Träning */}
        <SectionCard title="Träning">
          <ProfileRow label="Mål"             value={GOAL_LABEL[p.goal]}         onEdit={() => setEditing('goal')} />
          <ProfileRow label="Aktivitetsnivå"  value={ACTIVITY_LABEL[p.activity]} onEdit={() => setEditing('activity')} />
        </SectionCard>

        {/* Actions */}
        <button type="button" className={styles.actionBtn} onClick={() => setShowWizard(true)}>
          Gå igenom guiden igen
        </button>

        {!confirmReset ? (
          <button type="button" className={styles.resetBtn} onClick={() => setConfirmReset(true)}>
            Skapa ny profil
          </button>
        ) : (
          <div className={styles.confirmBox}>
            <p className={styles.confirmText}>All profildata raderas. Säker?</p>
            <div className={styles.confirmRow}>
              <button type="button" className={styles.confirmCancel} onClick={() => setConfirmReset(false)}>Avbryt</button>
              <button type="button" className={styles.confirmOk} onClick={reset}>Ja, börja om</button>
            </div>
          </div>
        )}

      </div>

      {editing && (
        <EditSheet
          field={FIELDS[editing]}
          profile={profile}
          onSave={saveField}
          onClose={() => setEditing(null)}
        />
      )}

      {showWizard && (
        <ProfileModal onClose={() => setShowWizard(false)} />
      )}
    </main>
  );
}
