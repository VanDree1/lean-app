import { useState } from 'react';
import { calcTargets } from '../hooks/useProfile';
import { useOnboarding } from '../components/Onboarding/useOnboarding';
import ProfileModal from '../components/Onboarding/ProfileModal';
import styles from './Profile.module.css';

const PROFILE_KEY = 'djur_juni_profile';
const LEGACY_PROFILE_KEY = 'djur-i-juni:profile';

const GOALS = [
  { value: 'fat_loss', label: 'Bränna fett', desc: 'Minska kroppsfett' },
  { value: 'muscle',   label: 'Bygga muskler', desc: 'Stärka kroppen' },
  { value: 'energy',   label: 'Mer energi', desc: 'Orka mer i vardagen' },
  { value: 'target',   label: 'Nå målvikt', desc: 'Specifik målsättning' },
];

const ACTIVITIES = [
  { value: 'sedentary',   label: 'Stillasittande', desc: 'Kontor, lite rörelse' },
  { value: 'light',       label: 'Måttligt aktiv', desc: 'Tränar 1–3×/vecka' },
  { value: 'very_active', label: 'Mycket aktiv', desc: 'Tränar 4+/vecka' },
];

const DIETS = [
  { value: 'Allätare',    desc: 'Äter allt – inga restriktioner' },
  { value: 'Pescetarian', desc: 'Fisk & skaldjur, inga landdjur' },
  { value: 'Vegetarian',  desc: 'Ägg & mejeri, inget kött eller fisk' },
  { value: 'Vegan',       desc: '100% växtbaserat' },
];

const GENDERS = ['Man', 'Kvinna'];

function saveField(field, value, setProfile) {
  try {
    const nextData = { [field]: value, updatedAt: Date.now() };
    setProfile((prev) => ({ ...prev, ...nextData }));
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
      ...(JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')),
      ...nextData,
    }));
    localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify({
      ...(JSON.parse(localStorage.getItem(LEGACY_PROFILE_KEY) || '{}')),
      ...nextData,
    }));
    window.dispatchEvent(new Event('djur-i-juni:profile-updated'));
  } catch { /* ignore */ }
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

// ── Edit sheet ──────────────────────────────────────────────────────────────

function EditSheet({ field, profile, setProfile, onClose }) {
  const [value, setValue] = useState(profile[field.key] ?? '');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const parsed = field.type === 'number' ? (parseFloat(value) || null) : value;
    saveField(field.key, parsed, setProfile);
    setSaved(true);
    setTimeout(() => onClose(), 700);
  }

  const valid = field.required ? String(value).trim() !== '' && (field.type !== 'number' || Number(value) > 0) : true;

  return (
    <div className={styles.sheetOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <h2 className={styles.sheetTitle}>{saved ? '✓ Sparat' : field.label}</h2>
          <button className={styles.sheetClose} onClick={onClose} aria-label="Stäng">✕</button>
        </div>

        {field.type === 'text' || field.type === 'number' ? (
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
            />
            {field.hint && <p className={styles.sheetHint}>{field.hint}</p>}
          </div>
        ) : field.type === 'options' ? (
          <div className={styles.sheetBody}>
            <div className={styles.optionList}>
              {field.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={value === opt.value ? styles.optionSelected : styles.option}
                  onClick={() => setValue(opt.value)}
                >
                  <span className={styles.optionLabel}>{opt.label ?? opt.value}</span>
                  {opt.desc && <span className={styles.optionDesc}>{opt.desc}</span>}
                </button>
              ))}
            </div>
          </div>
        ) : field.type === 'chips' ? (
          <div className={styles.sheetBody}>
            <div className={styles.chipRow}>
              {field.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={value === opt ? styles.chipSelected : styles.chip}
                  onClick={() => setValue(value === opt ? '' : opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className={styles.sheetFooter}>
          <button type="button" className={styles.sheetCancel} onClick={onClose} disabled={saved}>Avbryt</button>
          <button type="button" className={saved ? styles.sheetSaved : styles.sheetSave} onClick={handleSave} disabled={!valid || saved}>
            {saved ? '✓ Sparat!' : 'Spara'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Field definitions ────────────────────────────────────────────────────────

const FIELDS = {
  name:          { key: 'name',          label: 'Namn',           type: 'text',    placeholder: 'Ditt förnamn', required: true },
  age:           { key: 'age',           label: 'Ålder',          type: 'number',  placeholder: 'år', min: 1, max: 120, required: true },
  height:        { key: 'height',        label: 'Längd',          type: 'number',  placeholder: 'cm', min: 1, max: 250, hint: 'I centimeter', required: true },
  gender:        { key: 'gender',        label: 'Kön',            type: 'chips',   options: GENDERS },
  goal:          { key: 'goal',          label: 'Mål',            type: 'options', options: GOALS, required: true },
  activity:      { key: 'activity',      label: 'Aktivitetsnivå', type: 'options', options: ACTIVITIES, required: true },
  currentWeight: { key: 'currentWeight', label: 'Nuv. vikt',      type: 'number',  placeholder: 'kg', min: 1, max: 500, hint: 'I kilo', required: true },
  goalWeight:    { key: 'goalWeight',    label: 'Målvikt',        type: 'number',  placeholder: 'kg', min: 1, max: 500, hint: 'I kilo' },
  diet:          { key: 'diet',          label: 'Kost',           type: 'options', options: DIETS },
  allergies:     { key: 'allergies',     label: 'Allergier',      type: 'text',    placeholder: 'T.ex. laktos, nötter' },
};

// ── Row components ───────────────────────────────────────────────────────────

function ProfileRow({ fieldKey, value, onEdit }) {
  const display = value || <span className={styles.rowEmpty}>Lägg till</span>;
  return (
    <button type="button" className={styles.row} onClick={() => onEdit(fieldKey)}>
      <span className={styles.rowLabel}>{FIELDS[fieldKey].label}</span>
      <span className={styles.rowRight}>
        <span className={styles.rowValue}>{display}</span>
        <span className={styles.rowChevron}>›</span>
      </span>
    </button>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>{title}</p>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

const GOAL_LABEL    = { fat_loss: 'Bränna fett', muscle: 'Bygga muskler', energy: 'Mer energi', target: 'Nå målvikt' };
const ACTIVITY_LABEL = { sedentary: 'Stillasittande', light: 'Måttligt aktiv', very_active: 'Mycket aktiv' };

export default function Profile({ profile, setProfile }) {
  const derivedTargets = calcTargets(profile);
  const kcalGoal = profile.caloriesGoal ?? derivedTargets.kcalGoal;
  const proteinGoal = profile.proteinGoal ?? derivedTargets.proteinGoal;
  const { reset } = useOnboarding();
  const [editing, setEditing] = useState(null); // fieldKey or null
  const [showWizard, setShowWizard] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const p = profile;
  const initials = getInitials(p.name);

  return (
    <main className={styles.main}>
      <div className={styles.stack}>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.heroText}>
            <h2 className={styles.heroName}>{p.name || 'Din profil'}</h2>
            <p className={styles.heroSub}>
              {GOAL_LABEL[p.goal] || 'Sätt ditt mål'} · {ACTIVITY_LABEL[p.activity] || 'Välj nivå'}
            </p>
          </div>
        </div>

        {/* Calculated targets */}
        <div className={styles.statRow}>
          <div className={styles.statPill}>
            <span className={styles.statVal}>{kcalGoal}</span>
            <span className={styles.statLabel}>kcal / dag</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statVal}>{proteinGoal}g</span>
            <span className={styles.statLabel}>protein / dag</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statVal}>{p.currentWeight ? `${p.currentWeight} kg` : '–'}</span>
            <span className={styles.statLabel}>nuv. vikt</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statVal}>{p.goalWeight ? `${p.goalWeight} kg` : '–'}</span>
            <span className={styles.statLabel}>målvikt</span>
          </div>
        </div>

        {/* Sections */}
        <SectionCard title="Personuppgifter">
          <ProfileRow fieldKey="name"   value={p.name}   onEdit={setEditing} />
          <ProfileRow fieldKey="age"    value={p.age ? `${p.age} år` : ''}   onEdit={setEditing} />
          <ProfileRow fieldKey="height" value={p.height ? `${p.height} cm` : ''} onEdit={setEditing} />
          <ProfileRow fieldKey="gender" value={p.gender} onEdit={setEditing} />
        </SectionCard>

        <SectionCard title="Mål & träning">
          <ProfileRow fieldKey="goal"     value={GOAL_LABEL[p.goal]}       onEdit={setEditing} />
          <ProfileRow fieldKey="activity" value={ACTIVITY_LABEL[p.activity]} onEdit={setEditing} />
          <ProfileRow fieldKey="currentWeight" value={p.currentWeight ? `${p.currentWeight} kg` : ''} onEdit={setEditing} />
          <ProfileRow fieldKey="goalWeight"    value={p.goalWeight ? `${p.goalWeight} kg` : ''}    onEdit={setEditing} />
        </SectionCard>

        <SectionCard title="Kost">
          <ProfileRow fieldKey="diet"      value={p.diet}      onEdit={setEditing} />
          <ProfileRow fieldKey="allergies" value={p.allergies} onEdit={setEditing} />
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
        <EditSheet field={FIELDS[editing]} profile={profile} setProfile={setProfile} onClose={() => setEditing(null)} />
      )}

      {showWizard && (
        <ProfileModal onClose={() => setShowWizard(false)} />
      )}
    </main>
  );
}
