import {MARKERS as M} from './protocol.mjs';
import {badgesFor, badgeUrl} from './badges.mjs';

export const DEFAULT_ASSET_BASE = 'https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/assets/badges/';

const STYLE = {
  best: {borderColor: '#FF00FF37', tagColor: '#E600E932', textColor: '#27C04F'},
  good: {borderColor: '#FF2D9943', tagColor: '#3300E932', textColor: '#27C04F'},
  ok: {borderColor: '#FF858283', tagColor: '#33FFFFFF', textColor: '#FFFFFF'},
  resolution: {borderColor: '#FF858283', tagColor: '#33FFFFFF', textColor: '#FFFFFF'},
  transparent: {borderColor: '#00000000', tagColor: '#00000000', textColor: '#FFFFFF'},
  language: {borderColor: '#00000000', tagColor: '#00000000', textColor: '#80FFFFFF'},
};

const LEGACY_FILTER_STYLE = Object.freeze({
  borderColor: '#2EFFFFFF',
  tagColor: '#22000000',
  textColor: '#FFFFFF',
  tagStyle: 'filled and bordered',
});

const LEGACY_GROUP_COLORS = Object.freeze({
  gp: '#96CEB4',
  gq: '#96CEB4',
  gr: '#4ECDC4',
  gv: '#FF6B6B',
  ga: '#45B7D1',
  gc: '#FFD700',
  gl: '#FFA07A',
});

function hasSemanticColor(value) {
  return value.borderColor !== STYLE.resolution.borderColor
    && value.borderColor !== STYLE.transparent.borderColor;
}

function applyFilterTheme(filters, badgeFamily, icon) {
  if (badgeFamily === 'modern') return filters;
  return filters.map((value) => (
    icon === 'colored' && hasSemanticColor(value)
      ? value
      : {...value, ...LEGACY_FILTER_STYLE}
  ));
}

function applyGroupTheme(values, badgeFamily) {
  if (badgeFamily === 'modern') return values;
  return values.map((value) => ({
    ...value,
    borderColor: '#00000000',
    color: LEGACY_GROUP_COLORS[value.id],
  }));
}

function filter(id, name, pattern, image, style, groupId, assetBase) {
  return {
    id,
    name,
    pattern,
    type: 'filter',
    isEnabled: true,
    imageURL: image ? badgeUrl(assetBase, image) : '',
    ...style,
    tagStyle: 'filled and bordered',
    groupId,
  };
}

function requires(required, excluded = []) {
  return `(?s)^${required.map((value) => `(?=.*${value})`).join('')}${excluded.map((value) => `(?!.*${value})`).join('')}`;
}

function qualityStyle(icon, kind) {
  return icon === 'mono' ? STYLE.resolution : STYLE[kind];
}

function sourceArtwork(badges, icon, source, sourceBadgeStyle) {
  if (sourceBadgeStyle === 'icon-only') return badges.quality.sourceIcon(icon, source);
  return badges.quality.source(icon, source);
}

function sourceFilters(badges, icon, sourceBadgeStyle, assetBase) {
  return [
    filter('q-r', 'Remux', requires([M.Remux]), sourceArtwork(badges, icon, 'remux', sourceBadgeStyle), qualityStyle(icon, 'best'), 'gq', assetBase),
    filter('q-b', 'BluRay', requires([M.BluRay]), sourceArtwork(badges, icon, 'blu-ray', sourceBadgeStyle), qualityStyle(icon, 'best'), 'gq', assetBase),
    filter('q-w', 'WebDL', requires([M.Web]), sourceArtwork(badges, icon, 'web-dl', sourceBadgeStyle), qualityStyle(icon, 'best'), 'gq', assetBase),
  ];
}

function bgbFilters(badges, icon, assetBase) {
  const sources = [
    ['r', 'Remux', M.Remux, 'remux'],
    ['b', 'BluRay', M.BluRay, 'blu-ray'],
    ['w', 'WebDL', M.Web, 'web-dl'],
  ];
  const classes = [
    ['b', 'Best', M.Best, 'best', 'best'],
    ['g', 'Good', M.Good, 'good', 'good'],
    ['o', 'OK', M.OK, 'ok', 'ok'],
  ];
  return classes.flatMap(([classId, className, classMarker, imageClass, style]) =>
    sources.map(([sourceId, sourceName, sourceMarker, imageSource]) => {
      const image = classId === 'o'
        ? badges.quality.rank('mono', 'ok', imageSource)
        : badges.quality.rank(icon, imageClass, imageSource);
      return filter(`q-${classId}${sourceId}`, `${className} ${sourceName}`, requires([sourceMarker, classMarker]), image, qualityStyle(icon, style), 'gq', assetBase);
    }),
  );
}

function tierFilters(badges, icon, sourceBadgeStyle, assetBase) {
  const definitions = [];
  for (let tier = 1; tier <= 5; tier += 1) {
    definitions.push(['rmx', 'Remux', M.Remux, 'remux', tier]);
    definitions.push(['blu', 'BluRay', M.BluRay, 'blu-ray', tier]);
    definitions.push(['web', 'Web', M.Web, 'web-dl', tier]);
  }
  definitions.push(['blu', 'BluRay', M.BluRay, 'blu-ray', 6]);
  definitions.push(['web', 'Web', M.Web, 'web-dl', 6]);
  definitions.push(['blu', 'BluRay', M.BluRay, 'blu-ray', 7]);
  definitions.push(['blu', 'BluRay', M.BluRay, 'blu-ray', 8]);
  const ranked = definitions.map(([id, name, sourceMarker, imageSource, tier]) =>
    filter(
      `q-${id}-t${tier}`,
      `${name} T${tier}`,
      requires([sourceMarker, M[`Tier${tier}`]]),
      badges.quality.tier(icon, imageSource, tier),
      qualityStyle(icon, 'best'),
      'gq',
      assetBase,
    ),
  );
  const unranked = [
    ['rmx', 'Remux', M.Remux, 'remux'],
    ['blu', 'BluRay', M.BluRay, 'blu-ray'],
    ['web', 'Web', M.Web, 'web-dl'],
  ].map(([id, name, sourceMarker, source]) =>
    filter(
      `q-${id}-u`,
      name,
      requires([sourceMarker, M.Unranked]),
      sourceBadgeStyle === 'icon-only' ? badges.quality.sourceIcon('mono', source) : badges.quality.source('mono', source),
      STYLE.resolution,
      'gq',
      assetBase,
    ),
  );
  return [...ranked, ...unranked];
}

const percentageColor = (score) => {
  const hue = (score / 100) * 120;
  const color = hslHex(hue, 100, 45);
  return {borderColor: `#66${color}`, tagColor: `#33${color}`, textColor: `#FF${color}`};
};

function hslHex(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : [0, c, x];
  return [r, g, b].map((value) => Math.round((value + m) * 255).toString(16).padStart(2, '0').toUpperCase()).join('');
}

function percentageFilters(badges, icon, sourceBadgeStyle, assetBase) {
  const digits = Array.from({length: 10}, (_, digit) => M[`Digit${digit}`]);
  const digitAlternative = `(?:${digits.join('|')})`;
  const scores = [];
  for (let score = 100; score >= 1; score -= 1) {
    const encoded = String(score).split('').map((digit) => M[`Digit${digit}`]).join('');
    scores.push(filter(`pct-${score}`, `${score}%`, `(?s)^(?=.*${M.Score}${encoded}(?!${digitAlternative}))`, '', icon === 'mono' ? STYLE.resolution : percentageColor(score), 'gp', assetBase));
  }
  return [...scores, ...sourceFilters(badges, icon, sourceBadgeStyle, assetBase)];
}

function qualityFilters(badges, quality, icon, sourceBadgeStyle, assetBase) {
  if (quality === 'best-good-ok') return bgbFilters(badges, icon, assetBase);
  if (quality === 'tiers') return tierFilters(badges, icon, sourceBadgeStyle, assetBase);
  if (quality === 'percentages') return percentageFilters(badges, icon, sourceBadgeStyle, assetBase);
  return sourceFilters(badges, icon, sourceBadgeStyle, assetBase);
}

function seaDexFilters(badges, icon, seadexMode, assetBase) {
  if (seadexMode === 'off') return [];
  if (seadexMode === 'combined') {
    return [filter('v-seadex', 'SeaDex', requires([M.SeaDex]), badges.quality.seaDex(icon, 'general'), qualityStyle(icon, 'best'), 'gv', assetBase)];
  }
  return [
    filter('v-seadex-best', 'SeaDex Best', requires([M.SeaDex, M.SeaDexBest]), badges.quality.seaDex(icon, 'best'), qualityStyle(icon, 'best'), 'gv', assetBase),
    filter('v-seadex-alt', 'SeaDex Alt', requires([M.SeaDex], [M.SeaDexBest]), badges.quality.seaDex(icon, 'alt'), qualityStyle(icon, 'good'), 'gv', assetBase),
  ];
}

function commonVisualFilters(badges, icon, hdrPolicy, assetBase) {
  const dvExclusion = hdrPolicy === 'suppress-with-dv' ? [M.DV] : [];
  return [
    filter('r-4k', '4K', requires([M.Resolution4K]), badges.resolution['4k'], STYLE.resolution, 'gr', assetBase),
    filter('r-1080', '1080p', requires([M.Resolution1080p]), badges.resolution['1080p'], STYLE.resolution, 'gr', assetBase),
    filter('r-720', '720p', requires([M.Resolution720p]), badges.resolution['720p'], STYLE.resolution, 'gr', assetBase),
    filter('a-dtsx', 'DTS:X', requires([M.DTSX]), badges.audio.dtsX, STYLE.resolution, 'ga', assetBase),
    filter('a-dtsma', 'DTS-HD MA', requires([M.DTSHDMA], [M.DTSX]), badges.audio.dtsHdMa, STYLE.resolution, 'ga', assetBase),
    filter('a-dtshd', 'DTS-HD', requires([M.DTSHD], [M.DTSX, M.DTSHDMA]), badges.audio.dtsHd, STYLE.resolution, 'ga', assetBase),
    filter('a-dts', 'DTS', requires([M.DTS], [M.DTSX, M.DTSHDMA, M.DTSHD]), badges.audio.dts, STYLE.resolution, 'ga', assetBase),
    filter('v-sdr', 'SDR', requires([M.SDR], [M.HDR, M.HDR10, M.HDR10Plus, M.DV]), badges.visual.sdr, STYLE.resolution, 'gv', assetBase),
    filter('v-hdr10p', 'HDR10+', requires([M.HDR10Plus], dvExclusion), badges.visual.hdr10Plus, STYLE.resolution, 'gv', assetBase),
    filter('v-h10', 'HDR10', requires([M.HDR10], [M.HDR10Plus, ...dvExclusion]), badges.visual.hdr10, STYLE.resolution, 'gv', assetBase),
    filter('v-hdr', 'HDR', requires([M.HDR], [M.HDR10Plus, M.HDR10, ...dvExclusion]), badges.visual.hdr, STYLE.resolution, 'gv', assetBase),
    filter('v-imax-enhanced', 'IMAX Enhanced', requires([M.IMAXEnhanced]), badges.visual.imaxEnhanced, STYLE.resolution, 'gv', assetBase),
    filter('v-imax', 'IMAX', requires([M.IMAX], [M.IMAXEnhanced]), badges.visual.imax, STYLE.resolution, 'gv', assetBase),
  ];
}

function detailedCarrierPattern(marker, dvCombined) {
  if (!dvCombined) return requires([marker]);
  return `(?s)^(?=.*${marker})(?:(?=.*${M.Atmos})|(?!.*${M.DV}))`;
}

function dolbyFilters(badges, profile, assetBase) {
  const detailed = profile.startsWith('detailed');
  const compact = profile.startsWith('compact');
  const dvCombined = profile.endsWith('dv-combined');
  const audioCombined = profile.startsWith('audio-combined');
  const dvPriority = profile === 'audio-combined-dv-priority';
  const result = [];

  if (audioCombined) {
    if (dvPriority) {
      result.push(filter('a-at-dv', 'Atmos + DV', requires([M.Atmos, M.DV]), badges.combined.dvAtmos, STYLE.transparent, 'ga', assetBase));
      result.push(filter('a-th-dv', 'TrueHD + DV', requires([M.TrueHD, M.DV], [M.Atmos]), badges.combined.dvTrueHd, STYLE.transparent, 'ga', assetBase));
      result.push(filter('a-dp-dv', 'DD+ + DV', requires([M.DDPlus, M.DV], [M.Atmos, M.TrueHD]), badges.combined.dvDdPlus, STYLE.transparent, 'ga', assetBase));
      result.push(filter('a-dd-dv', 'DD + DV', requires([M.DD, M.DV], [M.Atmos, M.TrueHD, M.DDPlus]), badges.combined.dvDd, STYLE.transparent, 'ga', assetBase));
      result.push(filter('a-dv', 'DV', requires([M.DV], [M.Atmos, M.TrueHD, M.DDPlus, M.DD]), badges.visual.dolbyVision, STYLE.transparent, 'gv', assetBase));
      result.push(filter('a-th-at', 'TrueHD + Atmos', requires([M.TrueHD, M.Atmos], [M.DV]), badges.audio.trueHdAtmos, STYLE.transparent, 'ga', assetBase));
      result.push(filter('a-dp-at', 'DD+ + Atmos', requires([M.DDPlus, M.Atmos], [M.TrueHD, M.DV]), badges.audio.ddPlusAtmos, STYLE.transparent, 'ga', assetBase));
      result.push(filter('a-at', 'Atmos', requires([M.Atmos], [M.TrueHD, M.DDPlus, M.DV]), badges.audio.atmos, STYLE.transparent, 'ga', assetBase));
      result.push(filter('a-th', 'TrueHD', `(?s)^(?=.*${M.TrueHD})(?:(?=.*${M.DV})(?=.*${M.Atmos})|(?!.*${M.DV})(?!.*${M.Atmos}))`, badges.audio.trueHd, STYLE.transparent, 'ga', assetBase));
      result.push(filter('a-dp', 'DD+', `(?s)^(?=.*${M.DDPlus})(?!.*${M.TrueHD})(?:(?=.*${M.DV})(?=.*${M.Atmos})|(?!.*${M.DV})(?!.*${M.Atmos}))`, badges.audio.ddPlus, STYLE.transparent, 'ga', assetBase));
      result.push(filter('a-dd', 'DD', requires([M.DD], [M.DDPlus, M.TrueHD, M.Atmos, M.DV]), badges.audio.dd, STYLE.transparent, 'ga', assetBase));
      return result;
    }

    result.push(filter('a-dv', 'DV', requires([M.DV]), badges.visual.dolbyVision, STYLE.transparent, 'gv', assetBase));
    result.push(filter('a-th-at', 'TrueHD + Atmos', requires([M.TrueHD, M.Atmos]), badges.audio.trueHdAtmos, STYLE.transparent, 'ga', assetBase));
    result.push(filter('a-dp-at', 'DD+ + Atmos', requires([M.DDPlus, M.Atmos], [M.TrueHD]), badges.audio.ddPlusAtmos, STYLE.transparent, 'ga', assetBase));
    result.push(filter('a-at', 'Atmos', requires([M.Atmos], [M.TrueHD, M.DDPlus]), badges.audio.atmos, STYLE.transparent, 'ga', assetBase));
    result.push(filter('a-th', 'TrueHD', requires([M.TrueHD], [M.Atmos]), badges.audio.trueHd, STYLE.transparent, 'ga', assetBase));
    result.push(filter('a-dp', 'DD+', requires([M.DDPlus], [M.Atmos, M.TrueHD]), badges.audio.ddPlus, STYLE.transparent, 'ga', assetBase));
    result.push(filter('a-dd', 'DD', requires([M.DD], [M.DDPlus, M.TrueHD, M.Atmos]), badges.audio.dd, STYLE.transparent, 'ga', assetBase));
    return result;
  }

  if (dvCombined) {
    result.push(filter('a-at-dv', 'Atmos + DV', requires([M.Atmos, M.DV]), badges.combined.dvAtmos, STYLE.transparent, 'ga', assetBase));
    result.push(filter('a-at', 'Atmos', requires([M.Atmos], [M.DV]), badges.audio.atmos, STYLE.transparent, 'ga', assetBase));
    result.push(filter('a-th-dv', 'TrueHD + DV', requires([M.TrueHD, M.DV], [M.Atmos]), badges.combined.dvTrueHd, STYLE.transparent, 'ga', assetBase));
    result.push(filter('a-th', 'TrueHD', detailed ? detailedCarrierPattern(M.TrueHD, true) : requires([M.TrueHD], [M.Atmos, M.DV]), badges.audio.trueHd, STYLE.transparent, 'ga', assetBase));
    result.push(filter('a-dp-dv', 'DD+ + DV', requires([M.DDPlus, M.DV], [M.Atmos, M.TrueHD]), badges.combined.dvDdPlus, STYLE.transparent, 'ga', assetBase));
    result.push(filter('a-dp', 'DD+', detailed ? detailedCarrierPattern(M.DDPlus, true) : requires([M.DDPlus], [M.Atmos, M.TrueHD, M.DV]), badges.audio.ddPlus, STYLE.transparent, 'ga', assetBase));
    result.push(filter('a-dd-dv', 'DD + DV', requires([M.DD, M.DV], [M.Atmos, M.TrueHD, M.DDPlus]), badges.combined.dvDd, STYLE.transparent, 'ga', assetBase));
    result.push(filter('a-dd', 'DD', requires([M.DD], [M.Atmos, M.TrueHD, M.DDPlus, M.DV]), badges.audio.dd, STYLE.transparent, 'ga', assetBase));
    result.push(filter('a-dv', 'DV', requires([M.DV], [M.Atmos, M.TrueHD, M.DDPlus, M.DD]), badges.visual.dolbyVision, STYLE.transparent, 'gv', assetBase));
    return result;
  }

  result.push(filter('a-dv', 'DV', requires([M.DV]), badges.visual.dolbyVision, STYLE.transparent, 'gv', assetBase));
  result.push(filter('a-at', 'Atmos', requires([M.Atmos]), badges.audio.atmos, STYLE.transparent, 'ga', assetBase));
  result.push(filter('a-th', 'TrueHD', compact ? requires([M.TrueHD], [M.Atmos]) : requires([M.TrueHD]), badges.audio.trueHd, STYLE.transparent, 'ga', assetBase));
  result.push(filter('a-dp', 'DD+', compact ? requires([M.DDPlus], [M.Atmos, M.TrueHD]) : requires([M.DDPlus]), badges.audio.ddPlus, STYLE.transparent, 'ga', assetBase));
  result.push(filter('a-dd', 'DD', requires([M.DD], [M.DDPlus, M.TrueHD, M.Atmos]), badges.audio.dd, STYLE.transparent, 'ga', assetBase));
  return result;
}

const LANGUAGE_FILTERS = [
  ['en', '🇬🇧', M.English], ['es', '🇪🇸', M.Spanish], ['fr', '🇫🇷', M.French],
  ['de', '🇩🇪', M.German], ['it', '🇮🇹', M.Italian], ['pt', '🇵🇹', M.Portuguese],
  ['pt-br', '🇧🇷', M.PortugueseBrazil], ['ru', '🇷🇺', M.Russian], ['zh', '🇨🇳', M.Chinese],
  ['ja', '🇯🇵', M.Japanese], ['ko', '🇰🇷', M.Korean], ['nl', '🇳🇱', M.Dutch],
  ['sv', '🇸🇪', M.Swedish], ['no', '🇳🇴', M.Norwegian], ['da', '🇩🇰', M.Danish],
  ['fi', '🇫🇮', M.Finnish], ['pl', '🇵🇱', M.Polish], ['ar', '🇸🇦', M.Arabic],
  ['hi', '🇮🇳', M.Hindi], ['tr', '🇹🇷', M.Turkish], ['el', '🇬🇷', M.Greek],
  ['hu', '🇭🇺', M.Hungarian], ['cs', '🇨🇿', M.Czech], ['uk', '🇺🇦', M.Ukrainian],
  ['ro', '🇷🇴', M.Romanian], ['bg', '🇧🇬', M.Bulgarian], ['vi', '🇻🇳', M.Vietnamese],
  ['th', '🇹🇭', M.Thai],
  ['mu', '🌐', M.MultiDual],
];

function languageFilters(assetBase) {
  return LANGUAGE_FILTERS.map(([id, name, value]) => filter(`l-${id}`, name, requires([value]), '', STYLE.language, 'gl', assetBase));
}

function groups(quality, languageBadges) {
  const result = [];
  if (quality === 'percentages') result.push({borderColor: '#00000000', color: '#27C04F', id: 'gp', isExpanded: true, name: 'Score'});
  result.push({borderColor: STYLE.best.borderColor, color: '#27C04F', id: 'gq', isExpanded: true, name: 'Quality'});
  result.push({borderColor: STYLE.resolution.borderColor, color: '#FFBE01', id: 'gr', isExpanded: true, name: 'Resolution'});
  result.push({borderColor: STYLE.resolution.borderColor, color: '#FF6B6B', id: 'gv', isExpanded: true, name: 'Visual'});
  result.push({borderColor: '#00000000', color: '#45B7D1', id: 'ga', isExpanded: true, name: 'Audio'});
  result.push({borderColor: '#00000000', color: '#FFD700', id: 'gc', isExpanded: true, name: 'Channels'});
  if (languageBadges) result.push({borderColor: '#00000000', color: '#4ECDC4', id: 'gl', isExpanded: true, name: 'Language'});
  return result;
}

export function generateFusionExport(configuration, {assetBase = DEFAULT_ASSET_BASE} = {}) {
  const {
    badgeFamily = 'modern', quality, icon, dolbyProfile, hdrPolicy, languageBadges,
    sourceBadgeStyle = 'detailed', seadexMode = 'split',
  } = configuration;
  const badges = badgesFor(badgeFamily);
  const filters = [
    ...qualityFilters(badges, quality, icon, sourceBadgeStyle, assetBase),
    ...seaDexFilters(badges, icon, seadexMode, assetBase),
    ...commonVisualFilters(badges, icon, hdrPolicy, assetBase),
    ...dolbyFilters(badges, dolbyProfile, assetBase),
    filter('c-71', '7.1', requires([M.Channels71]), badges.channels['7.1'], STYLE.transparent, 'gc', assetBase),
    filter('c-61', '6.1', requires([M.Channels61], [M.Channels71]), badges.channels['6.1'], STYLE.transparent, 'gc', assetBase),
    filter('c-51', '5.1', requires([M.Channels51], [M.Channels61, M.Channels71]), badges.channels['5.1'], STYLE.transparent, 'gc', assetBase),
    ...(languageBadges ? languageFilters(assetBase) : []),
  ];
  return {
    filters: applyFilterTheme(filters, badgeFamily, icon),
    groups: applyGroupTheme(groups(quality, languageBadges), badgeFamily),
  };
}
