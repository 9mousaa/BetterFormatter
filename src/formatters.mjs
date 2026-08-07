import {JEOR_DESCRIPTION, JEOR_NAME, SNOAK_DESCRIPTION, SNOAK_NAME} from './formatter-templates.mjs';
import {MARKERS as M} from './protocol.mjs';

const CLASSIC_NAME = `{stream.quality::exists["{stream.quality::title}"||""]}`;
const FILENAME_DESCRIPTION = `{stream.filename::exists["{stream.filename}"||""]}`;
const CLASSIC_DESCRIPTION = `${FILENAME_DESCRIPTION}\n{service.shortName::exists["{service.shortName}"||""]}{stream.type::exists[" · {stream.type::title::replace('P2p','P2P')}"||""]}{stream.size::>0[" · {stream.size::bytes}"||""]}`;

const RENORIA_NAME = `{stream.resolution::exists["{stream.resolution::replace('2160p','4K')::replace('1440p','2K')}{stream.nSeScore::exists[" "||""]}"||""]}{stream.nSeScore::exists["{stream.nSeScore::pstar::replace('★','●')::replace('⯪','◐')::replace('☆','')}"||""]}`;
const RENORIA_DESCRIPTION = `{metadata.title}{? ({stream.year})?}{? {stream.seasonEpisode::join(' · ')}?}\n{stream.releaseGroup::exists["{stream.releaseGroup} · "||""]}{addon.name}{stream.size::>0[" · {stream.size::rbytes::replace(' ','')}"||""]}`;

const VISIBLE_FORMATTERS = Object.freeze({
  classic: {name: CLASSIC_NAME, description: CLASSIC_DESCRIPTION},
  filename: {name: CLASSIC_NAME, description: FILENAME_DESCRIPTION},
  renoria: {name: RENORIA_NAME, description: RENORIA_DESCRIPTION},
  jeor: {name: JEOR_NAME, description: JEOR_DESCRIPTION},
  snoak: {name: SNOAK_NAME, description: SNOAK_DESCRIPTION},
});

export function visibleFormatter(style) {
  const formatter = VISIBLE_FORMATTERS[style];
  if (!formatter) throw new RangeError(`unknown formatter style: ${style}`);
  return {...formatter};
}

function condition(field, modifier, value) {
  return `{${field}::${modifier}["${value}"||""]}`;
}

function sourceFacts() {
  const ranked = [
    condition('stream.rseMatched::string', '~Remux T', M.Remux),
    `{stream.rseMatched::string::~UHD Bluray T::or::stream.rseMatched::string::~HD Bluray T::or::stream.rseMatched::string::~BD T["${M.BluRay}"||""]}`,
    condition('stream.rseMatched::string', '~Web T', M.Web),
  ].join('');
  const fallback = `{stream.rseMatched::string::~Remux T::or::stream.rseMatched::string::~UHD Bluray T::or::stream.rseMatched::string::~HD Bluray T::or::stream.rseMatched::string::~BD T::or::stream.rseMatched::string::~Web T[""||"{stream.quality::=BluRay REMUX[\"${M.Remux}\"||\"\"]}{stream.quality::=BluRay[\"${M.BluRay}\"||\"\"]}{stream.quality::=WEB-DL[\"${M.Web}\"||\"\"]}"]}`;
  return ranked + fallback;
}

function tierFacts() {
  const tierMarkers = [M.Tier1, M.Tier2, M.Tier3, M.Tier4, M.Tier5, M.Tier6, M.Tier7, M.Tier8];
  const tiers = tierMarkers.map((value, index) => condition('stream.rseMatched::string', `~T${index + 1}`, value)).join('');
  const anyTier = Array.from({length: 8}, (_, index) => `stream.rseMatched::string::~T${index + 1}`).join('::or::');
  const knownSource = `stream.rseMatched::string::~Remux T::or::stream.rseMatched::string::~UHD Bluray T::or::stream.rseMatched::string::~HD Bluray T::or::stream.rseMatched::string::~BD T::or::stream.rseMatched::string::~Web T::or::stream.quality::in('BluRay REMUX','BluRay','WEB-DL')`;
  return `${tiers}{${anyTier}[""||"{${knownSource}[\"${M.Unranked}\"||\"\"]}"]}`;
}

function bgbFacts() {
  return `{stream.nSeScore::>=90["${M.Best}"||"{stream.nSeScore::>=50[\"${M.Good}\"||\"${M.OK}\"]}"]}`;
}

function percentageFacts() {
  const replacements = Array.from({length: 10}, (_, digit) => `::replace('${digit}','${M[`Digit${digit}`]}')`).join('');
  return `{stream.nSeScore::>0["${M.Score}{stream.nSeScore::string${replacements}}"||""]}`;
}

function seaDexFacts() {
  return condition('stream.seadex', 'istrue', M.SeaDex) + condition('stream.seadexBest', 'istrue', M.SeaDexBest);
}

function commonFacts() {
  return [
    condition('stream.resolution', '=2160p', M.Resolution4K),
    condition('stream.resolution', '=1080p', M.Resolution1080p),
    condition('stream.resolution', '=720p', M.Resolution720p),
    condition('stream.visualTags', '~SDR', M.SDR),
    condition('stream.audioTags', '~DTS:X', M.DTSX),
    condition('stream.audioTags', '~DTS-HD MA', M.DTSHDMA),
    condition('stream.audioTags', '~DTS-HD', M.DTSHD),
    condition('stream.audioTags', '~DTS', M.DTS),
    condition('stream.visualTags', '~HDR10+', M.HDR10Plus),
    condition('stream.visualTags', '~HDR10', M.HDR10),
    condition('stream.visualTags', '~HDR', M.HDR),
    condition('stream.visualTags', '~IMAX', M.IMAX),
    `{stream.filename::~imax enhanced::or::stream.filename::~imax.enhanced::or::stream.filename::~imax_enhanced::or::stream.filename::~imax-enhanced::or::stream.filename::~imaxenhanced["${M.IMAXEnhanced}"||""]}`,
    condition('stream.visualTags', '~DV', M.DV),
    condition('stream.audioTags', '~Atmos', M.Atmos),
    condition('stream.audioTags', '~TrueHD', M.TrueHD),
    condition('stream.audioTags', '~DD+', M.DDPlus),
    condition('stream.audioTags', '~DD', M.DD),
    condition('stream.audioChannels', '~7.1', M.Channels71),
    condition('stream.audioChannels', '~6.1', M.Channels61),
    condition('stream.audioChannels', '~5.1', M.Channels51),
  ].join('');
}

const LANGUAGE_FACTS = [
  [['English'], M.English], [['Spanish'], M.Spanish], [['French'], M.French],
  [['German'], M.German], [['Italian'], M.Italian], [['Portuguese'], M.Portuguese],
  [['Portuguese (Brazil)'], M.PortugueseBrazil], [['Russian'], M.Russian],
  [['Chinese'], M.Chinese], [['Japanese'], M.Japanese], [['Korean'], M.Korean],
  [['Dutch'], M.Dutch], [['Swedish'], M.Swedish], [['Norwegian'], M.Norwegian],
  [['Danish'], M.Danish], [['Finnish'], M.Finnish], [['Polish'], M.Polish],
  [['Arabic'], M.Arabic], [['Hindi'], M.Hindi], [['Turkish'], M.Turkish],
  [['Greek'], M.Greek], [['Hungarian'], M.Hungarian], [['Czech'], M.Czech],
  [['Ukrainian'], M.Ukrainian], [['Romanian'], M.Romanian], [['Bulgarian'], M.Bulgarian],
  [['Vietnamese'], M.Vietnamese], [['Thai'], M.Thai], [['Multi', 'Dual Audio'], M.MultiDual],
];

function languageFacts(languageMode) {
  if (languageMode === 'off') return '';
  const field = `stream.${languageMode}`;
  return LANGUAGE_FACTS.map(([languages, value]) => languages.length === 1
    ? condition(field, `~${languages[0]}`, value)
    : condition(field, `in(${languages.map((language) => `'${language}'`).join(',')})`, value)).join('');
}

function qualityFacts() {
  return tierFacts() + bgbFacts() + percentageFacts();
}

function descriptionFacts() {
  return sourceFacts() + seaDexFacts() + commonFacts();
}

export function markerSuffix({languageMode = 'off'} = {}) {
  return markerFragments({languageMode}).join('');
}

export function markerFragments({languageMode = 'off'} = {}) {
  const suffix = descriptionFacts() + qualityFacts() + languageFacts(languageMode);
  const fragments = [];
  let start = -1;
  let depth = 0;
  for (let index = 0; index < suffix.length; index += 1) {
    if (suffix[index] === '{') {
      if (depth === 0) start = index;
      depth += 1;
    } else if (suffix[index] === '}' && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        fragments.push(suffix.slice(start, index + 1));
        start = -1;
      }
    }
  }
  return fragments;
}

export function generateFormatter({style, languageMode = 'off'}) {
  const visible = visibleFormatter(style);
  if (style === 'jeor') {
    return assertFormatterWithinLimit({
      name: visible.name + qualityFacts() + languageFacts(languageMode),
      description: visible.description + descriptionFacts(),
    });
  }
  return assertFormatterWithinLimit({
    name: visible.name,
    description: visible.description + markerSuffix({languageMode}),
  });
}

export function assertFormatterWithinLimit(formatter) {
  for (const [field, value] of Object.entries(formatter)) {
    if (value.length > 5000) throw new RangeError(`formatter ${field} must remain at most 5000 characters`);
  }
  return formatter;
}
