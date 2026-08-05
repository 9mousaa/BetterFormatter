import {BADGE_FAMILIES} from './badges.mjs';

export const QUALITIES = ['best-good-ok', 'tiers', 'source', 'percentages'];
export const ICONS = ['colored', 'mono'];
export const HDR_POLICIES = ['suppress-with-dv', 'show-both'];
export const LANGUAGE_MODES = ['off', 'languages', 'uLanguages'];
export const FORMATTER_STYLES = ['classic', 'filename', 'renoria', 'jeor', 'snoak'];
export const SOURCE_BADGE_STYLES = ['detailed', 'icon-only'];
export const SEADEX_MODES = ['split', 'combined', 'off'];

const QUALITY_SLUGS = Object.freeze({
  'best-good-ok': 'best-good-ok',
  tiers: 'tiers',
  source: 'quality-badges',
  percentages: 'percentages',
});
const SEADEX_SLUGS = Object.freeze({split: 'split', combined: 'combined', off: 'hidden'});
const HDR_SLUGS = Object.freeze({'suppress-with-dv': 'dv-priority', 'show-both': 'always-show'});
const DOLBY_SLUGS = Object.freeze({
  'compact-separate': 'atmos-priority-dv-separate',
  'compact-dv-combined': 'atmos-priority-dv-atmos',
  'detailed-separate': 'audio-separate-dv-separate',
  'detailed-dv-combined': 'audio-separate-dv-atmos',
  'audio-combined': 'atmos-carrier-dv-separate',
  'audio-combined-dv-priority': 'dv-atmos-carrier-separate',
});
const LANGUAGE_MODE_SLUGS = Object.freeze({
  off: 'hidden',
  uLanguages: 'preferred-only',
  languages: 'all-detected',
});

export const DOLBY_PROFILES = [
  'compact-separate',
  'compact-dv-combined',
  'detailed-separate',
  'detailed-dv-combined',
  'audio-combined',
  'audio-combined-dv-priority',
];

const LEGACY_DOLBY_PROFILES = Object.freeze(['compact-separate', 'detailed-separate']);

export function dolbyProfilesFor(badgeFamily) {
  if (!BADGE_FAMILIES.includes(badgeFamily)) throw new RangeError(`unknown badge family: ${badgeFamily}`);
  return badgeFamily === 'modern' ? DOLBY_PROFILES : LEGACY_DOLBY_PROFILES;
}

export function canonicalDolbyProfile({carrier, dvAudio, priority = 'audio'}) {
  if (carrier === 'combined') {
    if (dvAudio === 'combined' && priority === 'dv') return 'audio-combined-dv-priority';
    return 'audio-combined';
  }
  if (carrier === 'compact') {
    return dvAudio === 'combined' ? 'compact-dv-combined' : 'compact-separate';
  }
  return dvAudio === 'combined' ? 'detailed-dv-combined' : 'detailed-separate';
}

export function sourceBadgeStylesFor(badgeFamily, quality) {
  if (!BADGE_FAMILIES.includes(badgeFamily)) throw new RangeError(`unknown badge family: ${badgeFamily}`);
  return badgeFamily === 'modern' && quality !== 'best-good-ok' ? SOURCE_BADGE_STYLES : ['detailed'];
}

export function fusionExportPath({badgeFamily = 'modern', quality, languageBadges, sourceBadgeStyle, seadexMode, icon, dolbyProfile, hdrPolicy}) {
  const language = languageBadges ? 'languages-shown' : 'languages-hidden';
  return `exports/fusion/${badgeFamily}/${QUALITY_SLUGS[quality]}/${language}/${sourceBadgeStyle}/${SEADEX_SLUGS[seadexMode]}/${HDR_SLUGS[hdrPolicy]}/${icon}-${DOLBY_SLUGS[dolbyProfile]}.json`;
}

export function formatterExportPath({style, languageMode}) {
  return `exports/aiostreams/${style}/${LANGUAGE_MODE_SLUGS[languageMode]}.json`;
}

export function allFusionConfigurations() {
  return BADGE_FAMILIES.flatMap((badgeFamily) =>
    QUALITIES.flatMap((quality) =>
      [false, true].flatMap((languageBadges) =>
        sourceBadgeStylesFor(badgeFamily, quality).flatMap((sourceBadgeStyle) =>
          SEADEX_MODES.flatMap((seadexMode) =>
            ICONS.flatMap((icon) =>
              dolbyProfilesFor(badgeFamily).flatMap((dolbyProfile) =>
                HDR_POLICIES.map((hdrPolicy) => ({badgeFamily, quality, languageBadges, sourceBadgeStyle, seadexMode, icon, dolbyProfile, hdrPolicy})),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

export function allFormatterConfigurations() {
  return FORMATTER_STYLES.flatMap((style) =>
    LANGUAGE_MODES.map((languageMode) => ({style, languageMode})),
  );
}
