import { calcTargets } from './useProfile';

const GOAL_TONES = {
  fat_loss: {
    hero: {
      quote: 'Lugn konsekvens slår intensiv perfektion.',
      subtle: 'Håll underskottet enkelt och låt aktiviteten göra jobbet.',
    },
    daily: {
      body: 'Kalorier, rörelse och sömn på ett ställe.',
      meta: 'Håll dagen enkel.',
      primaryFieldLabel: 'Kalorier ätit',
      secondaryFieldLabel: 'Sömn',
      workoutLabel: 'Dagens träning',
      workoutHint: 'Rörelse hjälper underskottet utan att allt behöver bli hårt.',
    },
    log: {
      title: 'Vikt och aktivitet',
      body: 'Fokus ligger på kalorier, steg och att hålla rytmen jämn över veckan.',
    },
    coach: {
      title: 'Tips från coachen',
      body: () => 'Prioritera vardagsrörelsen. När stegen sitter blir underskottet lättare att hålla än om allt ska lösas med vilja.',
    },
    quote: {
      status: 'Konsekvens',
      lead: 'Håll takten.',
      fallbacks: [
        { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
        { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Will Durant' },
        { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
      ],
    },
    stats: {
      secondaryKey: 'steps',
      secondaryLabel: 'Steg idag',
      secondaryUnit: 'STEG',
      priority: 'activity',
    },
  },
  muscle: {
    hero: {
      quote: 'Bygg lugnt. Behåll rytmen.',
      subtle: 'Protein och återhämtning avgör mer än en enskild hård dag.',
    },
    daily: {
      body: 'Mat, träning och sömn i samma rytm.',
      meta: 'Bygg runt återhämtning.',
      primaryFieldLabel: 'Kalorier ätit',
      secondaryFieldLabel: 'Sömn',
      workoutLabel: 'Dagens träning',
      workoutHint: 'Träning och sömn ska stötta återhämtning, inte bara kännas hårda.',
    },
    log: {
      title: 'Protein och vikt',
      body: 'När målet är att bygga muskler ska protein få mer utrymme än extra brus i appen.',
    },
    coach: {
      title: 'Tips från coachen',
      body: ({ proteinGoal }) => `Sikta på runt ${proteinGoal} g protein idag och låt sömnen bära återhämtningen. Jämn nivå slår en perfekt kväll.`,
    },
    quote: {
      status: 'Återhämtning',
      lead: 'Bygg i lugn takt.',
      fallbacks: [
        { text: 'Strength does not come from winning. Your struggles develop your strengths.', author: 'Arnold Schwarzenegger' },
        { text: 'The resistance that you fight physically in the gym and the resistance that you fight in life can only build a strong character.', author: 'Arnold Schwarzenegger' },
        { text: 'Absorb what is useful, discard what is useless, and add what is specifically your own.', author: 'Bruce Lee' },
      ],
    },
    stats: {
      secondaryKey: 'protein',
      secondaryLabel: 'Protein idag',
      secondaryUnit: 'G',
      priority: 'protein',
    },
  },
  energy: {
    hero: {
      quote: 'Mer energi börjar med mindre brus.',
      subtle: 'Jämn mat, bra sömn och rimlig aktivitet gör dagen lättare.',
    },
    daily: {
      body: 'Fånga sömn, mat och rörelse utan extra friktion.',
      meta: 'Håll energin jämn.',
      primaryFieldLabel: 'Kalorier ätit',
      secondaryFieldLabel: 'Sömn',
      workoutLabel: 'Dagens träning',
      workoutHint: 'Håll träningsdelen lätt om energin är låg. Jämnhet först.',
    },
    log: {
      title: 'Sömn och rytm',
      body: 'När energin är målet är sömn och jämn dagsrytm viktigare än att maxa allt samtidigt.',
    },
    coach: {
      title: 'Tips från coachen',
      body: () => 'Skydda sömnen först. När sömnen sitter blir både hunger, fokus och träning lättare att styra.',
    },
    quote: {
      status: 'Balans',
      lead: 'Sänk bruset.',
      fallbacks: [
        { text: 'Nature does not hurry, yet everything is accomplished.', author: 'Lao Tzu' },
        { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
        { text: 'It is not enough to be busy. The question is: what are we busy about?', author: 'Henry David Thoreau' },
      ],
    },
    stats: {
      secondaryKey: 'steps',
      secondaryLabel: 'Steg idag',
      secondaryUnit: 'STEG',
      priority: 'activity',
    },
  },
  target: {
    hero: {
      quote: 'Du bygger något hållbart nu.',
      subtle: 'En tydlig riktning gör dagen enklare att läsa av.',
    },
    daily: {
      body: 'Logga det viktigaste och håll kursen tydlig.',
      meta: 'Små justeringar räcker.',
      primaryFieldLabel: 'Kalorier ätit',
      secondaryFieldLabel: 'Sömn',
      workoutLabel: 'Dagens träning',
      workoutHint: 'Rena loggar gör det lättare att se om riktningen faktiskt håller.',
    },
    log: {
      title: 'Målvikt och riktning',
      body: 'Det viktiga här är tydlighet: vad du åt, hur du rörde dig och om dagen drog åt rätt håll.',
    },
    coach: {
      title: 'Tips från coachen',
      body: () => 'Titta på trenden, inte bara dagens känsla. En klar riktning gör små avvikelser mindre dramatiska.',
    },
    quote: {
      status: 'Riktning',
      lead: 'Håll kursen.',
      fallbacks: [
        { text: 'A goal without a plan is just a wish.', author: 'Antoine de Saint-Exupéry' },
        { text: 'First say to yourself what you would be; and then do what you have to do.', author: 'Epictetus' },
        { text: 'Well begun is half done.', author: 'Aristotle' },
      ],
    },
    stats: {
      secondaryKey: 'steps',
      secondaryLabel: 'Steg idag',
      secondaryUnit: 'STEG',
      priority: 'activity',
    },
  },
};

function defaultTone() {
  return GOAL_TONES.fat_loss;
}

export function getGoalTone(profile = {}) {
  const goal = profile.goal || 'fat_loss';
  const tone = GOAL_TONES[goal] || defaultTone();
  const { kcalGoal, proteinGoal } = calcTargets(profile);
  const stepGoal = profile.activity === 'very_active' ? 10000 : profile.activity === 'sedentary' ? 6000 : 8000;

  return {
    goal,
    kcalGoal,
    proteinGoal: profile.proteinGoal ?? proteinGoal,
    stepGoal,
    ...tone,
  };
}

export function useGoalTone(profile = {}) {
  return getGoalTone(profile);
}
