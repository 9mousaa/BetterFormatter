import {MARKERS as M} from './protocol.mjs';

const languages = (...values) => values.map((key) => M[key]);

const LANGUAGE_NAMES = new Map([
  ['English', 'English'], ['Spanish', 'Spanish'], ['French', 'French'], ['German', 'German'],
  ['Italian', 'Italian'], ['Portuguese', 'Portuguese'], ['PortugueseBrazil', 'Portuguese (Brazil)'],
  ['Russian', 'Russian'], ['Chinese', 'Chinese'], ['Japanese', 'Japanese'], ['Korean', 'Korean'],
  ['Dutch', 'Dutch'], ['Swedish', 'Swedish'], ['Norwegian', 'Norwegian'], ['Danish', 'Danish'],
  ['Finnish', 'Finnish'], ['Polish', 'Polish'], ['Arabic', 'Arabic'], ['Hindi', 'Hindi'],
  ['Turkish', 'Turkish'], ['Greek', 'Greek'], ['Hungarian', 'Hungarian'], ['Czech', 'Czech'],
  ['Ukrainian', 'Ukrainian'], ['Romanian', 'Romanian'], ['Bulgarian', 'Bulgarian'],
  ['Vietnamese', 'Vietnamese'], ['Thai', 'Thai'], ['MultiDual', 'Multi'],
].map(([key, name]) => [M[key], name]));

const SMALL_LANGUAGE_CODES = Object.freeze({
  English: 'ᴇɴ', Spanish: 'ᴇs', French: 'ғʀ', German: 'ᴅᴇ', Italian: 'ɪᴛ',
  Portuguese: 'ᴘᴛ', 'Portuguese (Brazil)': 'ᴘᴛ-ʙʀ', Japanese: 'ᴊᴀ', Chinese: 'ᴢʜ',
  Korean: 'ᴋᴏ', Multi: 'ᴍᴜʟᴛɪ',
});

export const PREVIEW_CATALOG = Object.freeze({
  silo: {
    quality: 'Web-Dl', metadataTitle: 'Silo', year: 2025, seasonEpisode: 'S02·E01',
    seasonEpisodeParts: ['S02', 'E01'], group: 'NTb', size: '28 GB', bitrate: '25 Mbps',
    filename: 'Silo.S02E01.2025.2160p.ATVP.WEB-DL.DDP5.1.Atmos.DV.HDR10Plus.H.265-NTb.mkv',
    score: 100, res: '4K', source: M.Web, tier: M.Tier1,
    common: M.Resolution4K + M.HDR10Plus + M.DV + M.Atmos + M.DDPlus + M.Channels51,
    languages: languages('English', 'Spanish', 'French', 'German', 'Portuguese'),
    uLanguages: languages('English', 'Spanish'),
  },
  knight: {
    quality: 'Web-Dl', metadataTitle: 'A Knight of the Seven Kingdoms', year: 2026, seasonEpisode: 'S01·E01',
    seasonEpisodeParts: ['S01', 'E01'], group: 'NTb', size: '1 GB', bitrate: '8 Mbps',
    filename: 'A.Knight.of.the.Seven.Kingdoms.S01E01.The.Hedge.Knight.720p.HMAX.WEB-DL.DDP5.1.H.264-NTb.mkv',
    score: 90, res: '720p', source: M.Web, tier: M.Tier2,
    common: M.Resolution720p + M.DDPlus + M.Channels51,
    languages: languages('English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese'),
    uLanguages: languages('English'),
  },
  chainsaw: {
    quality: 'Web-Dl', metadataTitle: 'Chainsaw Man – The Movie: Reze Arc', year: 2025, seasonEpisode: '',
    seasonEpisodeParts: [], group: 'chasa', size: '11 GB', bitrate: '18 Mbps',
    filename: '[chasa] Chainsaw Man - The Movie Reze Arc (2025) (WEB-DL 2160p HEVC EAC3 5.1 Atmos) [Dual Audio].mkv',
    score: 89, res: '4K', source: M.Web, tier: M.Unranked,
    common: M.SeaDex + M.Resolution4K + M.HDR + M.Atmos + M.DDPlus + M.Channels51,
    languages: languages('English', 'Japanese', 'MultiDual'),
    uLanguages: languages('English', 'Japanese'),
  },
  frieren: {
    quality: 'Bluray Remux', metadataTitle: 'Frieren: Beyond Journey’s End', year: 2023, seasonEpisode: 'S01·E01',
    seasonEpisodeParts: ['S01', 'E01'], group: 'PMR', size: '7 GB', bitrate: '42 Mbps',
    filename: "Frieren Beyond Journey's End - S01E01 (BD Remux 1080p AVC FLAC AAC) [Dual Audio] [PMR].mkv",
    score: 50, res: '1080p', source: M.Remux, tier: M.Tier3,
    common: M.SeaDex + M.SeaDexBest + M.Resolution1080p + M.SDR + M.Channels61,
    languages: languages('English', 'Japanese', 'MultiDual'),
    uLanguages: languages('English', 'Japanese'),
  },
  topGun: {
    quality: 'Bluray', metadataTitle: 'Top Gun: Maverick', year: 2022, seasonEpisode: '',
    seasonEpisodeParts: [], group: 'MTeam', size: '86 GB', bitrate: '74 Mbps',
    filename: 'Top.Gun.Maverick.2022.2160p.UHD.BluRay.IMAX.HDR10.TrueHD.7.1.Atmos.DTS.DD-MTeam.mkv',
    score: 49, res: '4K', source: M.BluRay, tier: M.Tier2,
    common: M.Resolution4K + M.IMAX + M.HDR10 + M.Atmos + M.TrueHD + M.DTS + M.DD + M.Channels71,
    languages: languages('English', 'Spanish', 'French', 'German', 'Italian'),
    uLanguages: languages('English'),
  },
});

const STABLE_SELECTION = Object.freeze(['silo', 'knight', 'chainsaw', 'frieren', 'topGun']);
const SCORE_OVERRIDES = Object.freeze({
  'best-good-ok': [100, 90, 89, 50, 49],
  percentages: [100, 90, 89, 50, 1],
});

export function previewStreamsFor(quality) {
  if (!['tiers', 'best-good-ok', 'source', 'percentages'].includes(quality)) {
    throw new RangeError(`unknown preview quality: ${quality}`);
  }
  return STABLE_SELECTION.map((key, index) => ({
    ...PREVIEW_CATALOG[key],
    ...(SCORE_OVERRIDES[quality] ? {score: SCORE_OVERRIDES[quality][index]} : {}),
  }));
}

function bgbFact(score) {
  return score >= 90 ? M.Best : score >= 50 ? M.Good : M.OK;
}

function percentageFact(score) {
  return M.Score + String(score).split('').map((digit) => M[`Digit${digit}`]).join('');
}

export function scoreFacts(quality, score) {
  if (quality === 'best-good-ok') return bgbFact(score);
  if (quality === 'percentages') return percentageFact(score);
  return '';
}

export function factsFor(stream, state) {
  const languageFacts = state.languageMode === 'off' ? '' : stream[state.languageMode].join('');
  return stream.source + stream.tier + bgbFact(stream.score) + percentageFact(stream.score) + stream.common + languageFacts;
}

function renoriaDescription(stream) {
  const episode = stream.seasonEpisodeParts.length ? ` ${stream.seasonEpisodeParts.join(' · ')}` : '';
  return `${stream.metadataTitle} (${stream.year})${episode}\n${stream.group} · Debrid · ${stream.size.replace(' ', '')}`;
}

export function streamName(stream, state) {
  if (state.formatterStyle === 'renoria') return `${stream.res} ${'●'.repeat(Math.max(1, Math.round(stream.score / 25)))}`;
  if (state.formatterStyle === 'snoak') {
    return [stream.metadataTitle, stream.seasonEpisodeParts.join(' · ')].filter(Boolean).join(' ');
  }
  if (state.formatterStyle === 'jeor') {
    const episode = stream.seasonEpisodeParts.length ? ` |   ${stream.seasonEpisodeParts.join(' · ')}` : '';
    return `${stream.metadataTitle}${episode}`;
  }
  return stream.quality;
}

export function streamDescription(stream, state) {
  if (state.formatterStyle === 'renoria') return renoriaDescription(stream);
  if (state.formatterStyle === 'filename') return stream.filename;
  if (state.formatterStyle === 'snoak') return `${stream.size} · ${stream.bitrate}\nDebrid [RD] 🎟️ ${stream.group}`;
  if (state.formatterStyle === 'jeor') return `◈ ${stream.size} · ${stream.bitrate}\n⛊ [RD] Debrid · ${stream.group}\n⛿ ᴇɴ`;
  return `${stream.filename}\nRD · Debrid · ${stream.size}`;
}

function markerNames(values) {
  return values.map((value) => LANGUAGE_NAMES.get(value)).filter(Boolean);
}

function tagsFromMarkers(text, definitions) {
  return definitions.filter(([, value]) => text.includes(value)).map(([name]) => name);
}

function numericUnit(value, multiplier) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number * multiplier : 0;
}

function rseLabel(stream) {
  const source = stream.source === M.Remux ? 'Remux' : stream.source === M.BluRay ? 'UHD Bluray' : 'Web';
  const tier = Array.from({length: 8}, (_, index) => index + 1).find((value) => stream.tier === M[`Tier${value}`]);
  return tier ? `${source} T${tier}` : '';
}

function withNullDefaults(value) {
  return new Proxy(value, {
    get(target, property, receiver) {
      if (typeof property === 'symbol' || Reflect.has(target, property)) {
        return Reflect.get(target, property, receiver);
      }
      return null;
    },
  });
}

export function formatterContextFor(stream) {
  const allLanguages = markerNames(stream.languages);
  const preferredLanguages = markerNames(stream.uLanguages);
  const resolution = { '4K': '2160p', '1080p': '1080p', '720p': '720p' }[stream.res] ?? stream.res;
  const visualTags = tagsFromMarkers(stream.common, [
    ['SDR', M.SDR], ['HDR10+', M.HDR10Plus], ['HDR10', M.HDR10], ['HDR', M.HDR],
    ['DV', M.DV], ['IMAX Enhanced', M.IMAXEnhanced], ['IMAX', M.IMAX],
  ]);
  const audioTags = tagsFromMarkers(stream.common, [
    ['DTS:X', M.DTSX], ['DTS-HD MA', M.DTSHDMA], ['DTS-HD', M.DTSHD], ['DTS', M.DTS],
    ['Atmos', M.Atmos], ['TrueHD', M.TrueHD], ['DD+', M.DDPlus], ['DD', M.DD],
  ]);
  const audioChannels = tagsFromMarkers(stream.common, [
    ['7.1', M.Channels71], ['6.1', M.Channels61], ['5.1', M.Channels51],
  ]);
  return {
    config: withNullDefaults({addonName: 'BetterFormatter Preview'}),
    addon: withNullDefaults({name: 'Debrid', presetId: 'preview', manifestUrl: 'https://example.test/manifest.json'}),
    metadata: withNullDefaults({
      title: stream.metadataTitle,
      titles: [stream.metadataTitle],
      queryType: stream.seasonEpisodeParts.length ? 'series' : 'movie',
      type: stream.seasonEpisodeParts.length ? 'series' : 'movie',
      year: stream.year,
      genres: [],
      country: '',
    }),
    service: withNullDefaults({id: 'realdebrid', name: 'Real-Debrid', shortName: 'RD', cached: true}),
    stream: withNullDefaults({
      ...stream,
      title: stream.metadataTitle,
      year: stream.year == null ? null : String(stream.year),
      resolution,
      seasonEpisode: [...stream.seasonEpisodeParts],
      type: 'debrid',
      size: numericUnit(stream.size, 1_000_000_000),
      bitrate: numericUnit(stream.bitrate, 1_000_000),
      folderSize: 0,
      releaseGroup: stream.group,
      rseMatched: rseLabel(stream) ? [rseLabel(stream)] : [],
      seScore: stream.score,
      nSeScore: stream.score,
      regexScore: 0,
      nRegexScore: 0,
      regexMatched: '',
      rankedRegexMatched: [],
      seadex: stream.common.includes(M.SeaDex),
      seadexBest: stream.common.includes(M.SeaDexBest),
      visualTags,
      audioTags,
      audioChannels,
      languages: allLanguages,
      uLanguages: preferredLanguages,
      smallLanguageCodes: allLanguages.map((name) => SMALL_LANGUAGE_CODES[name] ?? name.toLowerCase()),
      uSmallLanguageCodes: preferredLanguages.map((name) => SMALL_LANGUAGE_CODES[name] ?? name.toLowerCase()),
      subtitles: [],
      uSubtitles: [],
      smallSubtitleCodes: [],
      uSmallSubtitleCodes: [],
      subbed: false,
      dubbed: false,
      proxied: true,
      private: false,
      preloading: false,
      library: false,
      message: '',
      indexer: '',
      network: '',
      editions: [],
      seeders: 0,
      country: '',
      date: null,
      seasonPack: false,
    }),
    debug: withNullDefaults({}),
  };
}
