const FRAME = '\u2063';
const ZERO = '\u200b';
const ONE = '\u200d';

export function marker(id) {
  if (!Number.isInteger(id) || id < 0 || id > 127) throw new RangeError('marker id must be 0...127');
  const bits = id.toString(2).padStart(7, '0').replaceAll('0', ZERO).replaceAll('1', ONE);
  return `${FRAME}${bits}${FRAME}`;
}

const names = [
  'Remux', 'BluRay', 'Web',
  'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5', 'Tier 6', 'Tier 7', 'Tier 8', 'Unranked',
  '4K', '1080p', '720p',
  'SDR', 'HDR', 'HDR10', 'HDR10+', 'DV', 'IMAX', 'IMAX Enhanced',
  'Atmos', 'TrueHD', 'DD+', 'DD', 'DTS:X', 'DTS-HD MA', 'DTS-HD', 'DTS',
  '5.1', '6.1', '7.1',
  'SeaDex', 'SeaDex Best',
  'Best', 'Good', 'OK', 'Score',
  'Digit 0', 'Digit 1', 'Digit 2', 'Digit 3', 'Digit 4',
  'Digit 5', 'Digit 6', 'Digit 7', 'Digit 8', 'Digit 9',
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Portuguese (Brazil)', 'Russian', 'Chinese', 'Japanese', 'Korean',
  'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish',
  'Arabic', 'Hindi', 'Turkish', 'Greek', 'Hungarian', 'Czech',
  'Ukrainian', 'Romanian', 'Bulgarian', 'Vietnamese', 'Thai', 'Multi / Dual Audio',
];

export const MARKER_NAMES = Object.freeze(Object.fromEntries(names.map((name, id) => [id, name])));

const keys = [
  'Remux', 'BluRay', 'Web',
  'Tier1', 'Tier2', 'Tier3', 'Tier4', 'Tier5', 'Tier6', 'Tier7', 'Tier8', 'Unranked',
  'Resolution4K', 'Resolution1080p', 'Resolution720p',
  'SDR', 'HDR', 'HDR10', 'HDR10Plus', 'DV', 'IMAX', 'IMAXEnhanced',
  'Atmos', 'TrueHD', 'DDPlus', 'DD', 'DTSX', 'DTSHDMA', 'DTSHD', 'DTS',
  'Channels51', 'Channels61', 'Channels71',
  'SeaDex', 'SeaDexBest',
  'Best', 'Good', 'OK', 'Score',
  'Digit0', 'Digit1', 'Digit2', 'Digit3', 'Digit4',
  'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9',
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'PortugueseBrazil', 'Russian', 'Chinese', 'Japanese', 'Korean',
  'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish',
  'Arabic', 'Hindi', 'Turkish', 'Greek', 'Hungarian', 'Czech',
  'Ukrainian', 'Romanian', 'Bulgarian', 'Vietnamese', 'Thai', 'MultiDual',
];

export const MARKERS = Object.freeze(Object.fromEntries(keys.map((key, id) => [key, marker(id)])));

const markerByValue = new Map(Array.from({length: 128}, (_, id) => [marker(id), id]));
const markerPattern = new RegExp(`${FRAME}[${ZERO}${ONE}]{7}${FRAME}`, 'gu');

export function markerIdsInText(text) {
  return [...String(text).matchAll(markerPattern)].map(([value]) => markerByValue.get(value));
}

export function stringifyExport(value) {
  return `${JSON.stringify(value, null, 2)
    .replaceAll(FRAME, '\\u2063')
    .replaceAll(ZERO, '\\u200b')
    .replaceAll(ONE, '\\u200d')}\n`;
}
