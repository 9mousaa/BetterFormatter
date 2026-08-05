export const BADGE_FAMILIES = Object.freeze(['modern', 'legacy']);

const VARIANTS = Object.freeze(['colored', 'mono']);
const SOURCES = Object.freeze(['remux', 'blu-ray', 'web-dl']);
const RANKS = Object.freeze(['best', 'good', 'ok']);
const SEADEX_KINDS = Object.freeze(['general', 'best', 'alt']);
const SOURCE_TIERS = Object.freeze({remux: 5, 'blu-ray': 8, 'web-dl': 6});

function checked(values, value, label) {
  if (!values.includes(value)) throw new RangeError(`unknown ${label}: ${value}`);
  return value;
}

function createBadgeCatalog(family) {
  const root = checked(BADGE_FAMILIES, family, 'badge family');
  const qualityPath = (variant, name) => `${root}/quality/${variant}/${name}.png`;
  const familyPath = (category, name) => `${root}/${category}/${name}.png`;
  const modernPath = (category, name) => `modern/${category}/${name}.png`;

  function qualitySource(variant, source) {
    return qualityPath(checked(VARIANTS, variant, 'variant'), checked(SOURCES, source, 'source'));
  }

  function qualityRank(variant, rank, source) {
    const selectedVariant = checked(VARIANTS, variant, 'variant');
    const selectedRank = checked(RANKS, rank, 'rank');
    const selectedSource = checked(SOURCES, source, 'source');
    if (selectedRank === 'ok' && selectedVariant !== 'mono') {
      throw new RangeError('OK quality artwork is available only in mono');
    }
    return qualityPath(selectedVariant, `${selectedRank}-${selectedSource}`);
  }

  function qualityTier(variant, source, tier) {
    const selectedVariant = checked(VARIANTS, variant, 'variant');
    const selectedSource = checked(SOURCES, source, 'source');
    if (!Number.isInteger(tier) || tier < 1 || tier > SOURCE_TIERS[selectedSource]) {
      throw new RangeError(`unknown ${selectedSource} tier: ${tier}`);
    }
    return qualityPath(selectedVariant, `${selectedSource}-tier-${tier}`);
  }

  function qualitySeaDex(variant, kind) {
    const selectedVariant = checked(VARIANTS, variant, 'variant');
    const selectedKind = checked(SEADEX_KINDS, kind, 'SeaDex kind');
    return qualityPath(selectedVariant, selectedKind === 'general' ? 'sea-dex' : `sea-dex-${selectedKind}`);
  }

  function qualitySourceIcon(variant, source) {
    const selectedVariant = checked(VARIANTS, variant, 'variant');
    const selectedSource = checked(SOURCES, source, 'source');
    return family === 'modern' ? qualityPath(selectedVariant, `source-icons/${selectedSource}`) : null;
  }

  function qualitySourceIconBright(source) {
    const selectedSource = checked(SOURCES, source, 'source');
    return family === 'modern' ? qualityPath('colored', `source-icons/${selectedSource}-bright`) : null;
  }

  return Object.freeze({
    quality: Object.freeze({
      source: qualitySource,
      rank: qualityRank,
      tier: qualityTier,
      seaDex: qualitySeaDex,
      sourceIcon: qualitySourceIcon,
      sourceIconBright: qualitySourceIconBright,
    }),
    resolution: Object.freeze({
      '4k': familyPath('resolution', '4k'),
      '1080p': familyPath('resolution', '1080p'),
      '720p': familyPath('resolution', '720p'),
    }),
    visual: Object.freeze({
      sdr: familyPath('visual', 'sdr'),
      hdr: familyPath('visual', 'hdr'),
      hdr10: familyPath('visual', 'hdr10'),
      hdr10Plus: familyPath('visual', 'hdr10-plus'),
      imax: family === 'legacy' ? modernPath('visual', 'imax') : familyPath('visual', 'imax'),
      imaxEnhanced: family === 'legacy' ? modernPath('visual', 'imax-enhanced') : familyPath('visual', 'imax-enhanced'),
      dolbyVision: familyPath('visual', 'dolby-vision'),
    }),
    audio: Object.freeze({
      dts: familyPath('audio', 'dts'),
      dtsHd: familyPath('audio', 'dts-hd'),
      dtsHdMa: familyPath('audio', 'dts-hd-ma'),
      dtsX: familyPath('audio', 'dts-x'),
      atmos: familyPath('audio', 'dolby-atmos'),
      trueHd: familyPath('audio', 'dolby-truehd'),
      ddPlus: familyPath('audio', 'dolby-digital-plus'),
      dd: familyPath('audio', 'dolby-digital'),
      trueHdAtmos: family === 'modern' ? familyPath('audio', 'dolby-truehd-atmos') : null,
      ddPlusAtmos: family === 'modern' ? familyPath('audio', 'dolby-digital-plus-atmos') : null,
    }),
    combined: family === 'modern' ? Object.freeze({
      dvAtmos: familyPath('combined', 'dolby-vision-atmos'),
      dvTrueHd: familyPath('combined', 'dolby-vision-truehd'),
      dvDdPlus: familyPath('combined', 'dolby-vision-digital-plus'),
      dvDd: familyPath('combined', 'dolby-vision-digital'),
    }) : null,
    channels: Object.freeze({
      '7.1': familyPath('channels', '7.1'),
      '6.1': familyPath('channels', '6.1'),
      '5.1': familyPath('channels', '5.1'),
    }),
  });
}

const CATALOGS = Object.freeze(Object.fromEntries(BADGE_FAMILIES.map((family) => [family, createBadgeCatalog(family)])));

export function badgesFor(family) {
  return CATALOGS[checked(BADGE_FAMILIES, family, 'badge family')];
}

export const BADGES = badgesFor('modern');

export const RETAINED_UNUSED_BADGE_PATHS = Object.freeze([
  ...SOURCES.map((source) => badgesFor('modern').quality.sourceIconBright(source)),
].sort());

function catalogPaths(catalog) {
  const paths = [];
  for (const variant of VARIANTS) {
    for (const source of SOURCES) paths.push(catalog.quality.source(variant, source));
    for (const source of SOURCES) paths.push(catalog.quality.sourceIcon(variant, source));
    for (const rank of ['best', 'good']) {
      for (const source of SOURCES) paths.push(catalog.quality.rank(variant, rank, source));
    }
    for (const [source, tierCount] of Object.entries(SOURCE_TIERS)) {
      for (let tier = 1; tier <= tierCount; tier += 1) paths.push(catalog.quality.tier(variant, source, tier));
    }
    for (const kind of SEADEX_KINDS) paths.push(catalog.quality.seaDex(variant, kind));
  }
  for (const source of SOURCES) paths.push(catalog.quality.sourceIconBright(source));
  for (const source of SOURCES) paths.push(catalog.quality.rank('mono', 'ok', source));
  for (const category of ['resolution', 'visual', 'audio', 'combined', 'channels']) {
    const entries = catalog[category] ? Object.values(catalog[category]) : [];
    paths.push(...entries.filter(Boolean));
  }
  return paths.filter(Boolean);
}

export function allBadgePaths() {
  return [...new Set(BADGE_FAMILIES.flatMap((family) => catalogPaths(badgesFor(family))))].sort();
}

export function badgeUrl(assetBase, relativePath) {
  const normalizedBase = assetBase.endsWith('/') ? assetBase : `${assetBase}/`;
  return new URL(relativePath, normalizedBase).href;
}
