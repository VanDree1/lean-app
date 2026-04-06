export function getDisplayName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return '';

  if (
    trimmed.length >= 3 &&
    trimmed[0] === trimmed[1] &&
    trimmed[0] === trimmed[0].toUpperCase() &&
    trimmed[2] === trimmed[2].toLowerCase()
  ) {
    return trimmed.slice(1);
  }

  return trimmed;
}

export function getFirstName(name) {
  return getDisplayName(name).split(' ')[0] || '';
}
