export const GOAL_OPTIONS = [
  { value: 'fat_loss', label: 'Gå ner i vikt', desc: 'Minska kroppsfett och bli lättare' },
  { value: 'recomposition', label: 'Bygga muskler och gå ner i vikt', desc: 'Starkare kropp med skarpare form' },
  { value: 'muscle', label: 'Bygga muskler', desc: 'Öka styrka och muskelmassa' },
  { value: 'energy', label: 'Mer energi', desc: 'Orka mer i vardagen' },
  { value: 'target', label: 'Nå målvikt', desc: 'Tydlig siffra och riktning' },
];

export const GOAL_LABELS = Object.fromEntries(
  GOAL_OPTIONS.map((goal) => [goal.value, goal.label]),
);
