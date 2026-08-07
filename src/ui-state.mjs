import {canonicalDolbyProfile, formatterExportPath, fusionExportPath} from './configuration.mjs';
import {generateFormatter, markerSuffix} from './formatters.mjs';

export const PUBLIC_BASE = 'https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/';

export const DEFAULT_STATE = Object.freeze({
  badgeFamily: 'modern',
  quality: 'tiers',
  icon: 'colored',
  carrier: 'compact',
  dvAudio: 'combined',
  priority: 'dv',
  hdrPolicy: 'suppress-with-dv',
  languageMode: 'uLanguages',
  formatterStyle: 'classic',
  sourceBadgeStyle: 'detailed',
  seadexMode: 'split',
});

const PREREQUISITES = {
  'best-good-ok': 'Requires AIOStreams scored sorting so nSeScore can classify Best, Good, and OK.',
  percentages: 'Requires AIOStreams scored sorting so nSeScore can display the exact percentage.',
  tiers: 'Requires VidHin’s English Ranked Stream Expressions so rseMatched contains source tier labels.',
  source: 'Source Label Only does not require a scoring template, but it still requires the invisible formatter markers.',
};

export function resolveSelection(state, {publicBase = PUBLIC_BASE, customFormatter = null} = {}) {
  const normalized = state.badgeFamily === 'legacy'
    ? {
        ...state,
        carrier: state.carrier === 'combined' ? 'separate' : state.carrier,
        dvAudio: state.dvAudio === 'combined' ? 'separate' : state.dvAudio,
      }
    : {...state, badgeFamily: state.badgeFamily ?? 'modern'};
  const dolbyProfile = canonicalDolbyProfile(normalized);
  const languageBadges = normalized.languageMode !== 'off';
  const fusionConfiguration = {
    badgeFamily: normalized.badgeFamily,
    quality: normalized.quality,
    languageBadges,
    sourceBadgeStyle: normalized.badgeFamily === 'modern' && normalized.quality !== 'best-good-ok'
      ? normalized.sourceBadgeStyle
      : 'detailed',
    seadexMode: normalized.seadexMode,
    icon: normalized.icon,
    dolbyProfile,
    hdrPolicy: normalized.hdrPolicy,
  };
  const formatterConfiguration = {
    style: normalized.formatterStyle,
    languageMode: normalized.languageMode,
  };
  const custom = normalized.formatterStyle === 'custom';
  return {
    ...normalized,
    dolbyProfile,
    languageBadges,
    pairingPriorityVisible: normalized.badgeFamily === 'modern' && normalized.carrier === 'combined' && normalized.dvAudio === 'combined',
    fusionConfiguration,
    formatterConfiguration,
    fusionUrl: new URL(fusionExportPath(fusionConfiguration), publicBase).href,
    formatterUrl: custom ? null : new URL(formatterExportPath(formatterConfiguration), publicBase).href,
    formatter: custom ? customFormatter : generateFormatter(formatterConfiguration),
    markerSnippet: markerSuffix({languageMode: normalized.languageMode}),
    prerequisite: PREREQUISITES[normalized.quality],
  };
}
