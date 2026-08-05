import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {markerIdsInText} from '../src/protocol.mjs';

const upstreamRoot = process.env.AIOSTREAMS_DIR;
if (!upstreamRoot) throw new Error('Set AIOSTREAMS_DIR to a built AIOStreams checkout.');

const engineRoot = path.join(upstreamRoot, 'packages/core/dist/formatters/engine');
const [{parseTemplate}, {compileTemplate}, {comparatorFunctions}] = await Promise.all([
  import(pathToFileURL(path.join(engineRoot, 'parser.js'))),
  import(pathToFileURL(path.join(engineRoot, 'compile.js'))),
  import(pathToFileURL(path.join(engineRoot, 'comparators.js'))),
]);

const exportRoot = path.resolve('exports/aiostreams');
const files = fs.readdirSync(exportRoot, {recursive: true, withFileTypes: true})
  .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
  .map((entry) => path.join(entry.parentPath, entry.name))
  .sort();
assert.equal(files.length, 15, 'unexpected formatter export count');

const fixture = {
  addon: {name: 'Debrid'},
  metadata: {title: 'Severance', queryType: 'series'},
  service: {cached: true, shortName: 'RD'},
  stream: {
    audioChannels: ['7.1'],
    audioTags: ['Atmos', 'TrueHD'],
    bitrate: 25_000_000,
    country: '',
    date: null,
    editions: [],
    filename: 'Severance.2022.S02E03.2160p.BluRay.REMUX.IMAX.Enhanced.DV.HDR10.TrueHD.Atmos.7.1-NTb.mkv',
    folderSize: 0,
    indexer: '',
    languages: ['English', 'Portuguese (Brazil)', 'Multi'],
    library: false,
    message: '',
    network: '',
    nSeScore: 94,
    preloading: false,
    private: false,
    proxied: true,
    quality: 'BluRay REMUX',
    releaseGroup: 'NTb',
    resolution: '2160p',
    rseMatched: ['Remux T1'],
    seScore: 94,
    seadex: true,
    seadexBest: true,
    seasonPack: false,
    seasonEpisode: ['S02', 'E03'],
    seeders: 0,
    size: 18_500_000_000,
    subbed: false,
    subtitles: [],
    title: 'Severance',
    type: 'debrid',
    uLanguages: ['English', 'Portuguese (Brazil)', 'Multi'],
    uSmallLanguageCodes: ['ᴇɴ', 'ᴘᴛ-ʙʀ', 'ᴍᴜʟᴛɪ'],
    uSmallSubtitleCodes: [],
    visualTags: ['DV', 'HDR10', 'IMAX'],
    year: 2022,
  },
};

const hooks = {
  comparators: comparatorFunctions,
  resolveVariable(source, value) {
    return source.split('.').reduce((current, key) => current?.[key], value);
  },
};
const stripInvisibleMarkers = (value) => value.replace(/[\u200b\u200d\u2063]/gu, '');

for (const file of files) {
  const formatter = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(Object.keys(formatter).sort(), ['description', 'name']);
  for (const field of ['name', 'description']) {
    assert.ok(formatter[field].length < 5000, `${file} ${field} exceeds 5,000 characters`);
    const parsed = parseTemplate(formatter[field]);
    assert.deepEqual(parsed.diagnostics, [], `${file} ${field} has parser diagnostics`);
    const rendered = compileTemplate(formatter[field], hooks)(fixture);
    assert.ok(rendered.length < 5000, `${file} ${field} rendered above 5,000 characters`);
    assert.doesNotMatch(rendered, /\{(?:unknown|unable|cannot)_/, `${file} ${field} rendered an engine error`);
  }
}

const renoriaFixture = JSON.parse(fs.readFileSync(path.join(exportRoot, 'renoria/preferred-only.json'), 'utf8'));
const renoriaName = compileTemplate(renoriaFixture.name, hooks)(fixture);
const renoriaDescription = compileTemplate(renoriaFixture.description, hooks)(fixture);
assert.equal(renoriaName, '4K ●●●●◐');
assert.match(renoriaDescription, /^Severance \(2022\) S02 · E03\nNTb · Debrid · 19GB/);
const renoriaIds = markerIdsInText(renoriaDescription);
for (const markerId of [0, 3, 12, 17, 19, 20, 21, 22, 23, 32, 33, 34, 35, 38, 49, 55, 77]) {
  assert(renoriaIds.includes(markerId), `fixture did not emit expected M${markerId}`);
}

const tierDescription = compileTemplate(renoriaFixture.description, hooks);
const tierCases = [
  ['Remux T1', 'BluRay REMUX', [0, 3]],
  ['UHD Bluray T8', 'BluRay', [1, 10]],
  ['HD Bluray T6', 'BluRay', [1, 8]],
  ['BD T7', 'BluRay', [1, 9]],
  ['Web T6', 'WEB-DL', [2, 8]],
  [undefined, 'BluRay REMUX', [0, 11]],
  ['Not Ranked', 'WEB-DL', [2, 11]],
];
for (const [rseLabel, quality, expected] of tierCases) {
  const rendered = tierDescription({...fixture, stream: {...fixture.stream, quality, rseMatched: rseLabel ? [rseLabel] : []}});
  const ids = markerIdsInText(rendered);
  for (const markerId of expected) assert(ids.includes(markerId), `${rseLabel ?? 'missing RSE'} did not emit M${markerId}`);
}
const webRip = tierDescription({...fixture, stream: {...fixture.stream, quality: 'WEBRip', rseMatched: []}});
assert.equal(markerIdsInText(webRip).includes(2), false, 'WEBRip emitted the WEB-DL marker');

const configuredFormatter = JSON.parse(fs.readFileSync(path.join(exportRoot, 'classic/preferred-only.json'), 'utf8'));
const detectedFormatter = JSON.parse(fs.readFileSync(path.join(exportRoot, 'classic/all-detected.json'), 'utf8'));
const renderConfigured = compileTemplate(configuredFormatter.description, hooks);
const renderDetected = compileTemplate(detectedFormatter.description, hooks);
const languages = [
  ['English', 49], ['Spanish', 50], ['French', 51], ['German', 52], ['Italian', 53],
  ['Portuguese', 54], ['Portuguese (Brazil)', 55], ['Russian', 56], ['Chinese', 57],
  ['Japanese', 58], ['Korean', 59], ['Dutch', 60], ['Swedish', 61], ['Norwegian', 62],
  ['Danish', 63], ['Finnish', 64], ['Polish', 65], ['Arabic', 66], ['Hindi', 67],
  ['Turkish', 68], ['Greek', 69], ['Hungarian', 70], ['Czech', 71], ['Ukrainian', 72],
  ['Romanian', 73], ['Bulgarian', 74], ['Vietnamese', 75], ['Thai', 76],
  ['Multi', 77], ['Dual Audio', 77],
];
for (const [language, markerId] of languages) {
  const configuredIds = markerIdsInText(renderConfigured({...fixture, stream: {...fixture.stream, uLanguages: [language]}}));
  const detectedIds = markerIdsInText(renderDetected({...fixture, stream: {...fixture.stream, languages: [language]}}));
  assert(configuredIds.includes(markerId), `uLanguages did not emit M${markerId} for ${language}`);
  assert(detectedIds.includes(markerId), `languages did not emit M${markerId} for ${language}`);
}
const configuredOnly = renderConfigured({...fixture, stream: {...fixture.stream, languages: ['English'], uLanguages: []}});
assert.equal(markerIdsInText(configuredOnly).includes(49), false, 'uLanguages formatter read stream.languages');
const ignored = renderConfigured({...fixture, stream: {...fixture.stream, dubbed: true, subtitles: ['English'], uLanguages: ['Unknown']}});
assert.equal(markerIdsInText(ignored).some((id) => id >= 49 && id <= 77), false, 'unapproved language fallback emitted a marker');

const sdr61 = renderConfigured({
  ...fixture,
  stream: {
    ...fixture.stream,
    audioChannels: ['6.1'],
    filename: 'Example.2026.1080p.WEB-DL.SDR.DTS-ES.6.1-GROUP.mkv',
    uLanguages: [],
    visualTags: ['SDR'],
  },
});
const sdr61Ids = markerIdsInText(sdr61);
assert(sdr61Ids.includes(15), 'SDR did not emit M15');
assert(sdr61Ids.includes(31), '6.1 did not emit M31');

const jeorFormatter = JSON.parse(fs.readFileSync(path.join(exportRoot, 'jeor/preferred-only.json'), 'utf8'));
const jeorName = compileTemplate(jeorFormatter.name, hooks)(fixture);
const jeorDescription = compileTemplate(jeorFormatter.description, hooks)(fixture);
const jeorNameIds = markerIdsInText(jeorName);
const jeorDescriptionIds = markerIdsInText(jeorDescription);
for (const markerId of [3, 35, 38, 49]) assert(jeorNameIds.includes(markerId), `Jeor name did not emit M${markerId}`);
for (const markerId of [0, 12, 33]) assert(jeorDescriptionIds.includes(markerId), `Jeor description did not emit M${markerId}`);
assert.equal(stripInvisibleMarkers(jeorName), '\nSeverance  |   S02 · E03');
assert.equal(stripInvisibleMarkers(jeorDescription), '◈ 18.5 GB · 25 Mbps (94)\n⛊ [RD] Debrid · NTb\n⛿ ᴇɴ · ᴘᴛ-ʙʀ · ᴍᴜʟᴛɪ  ʙᴇsᴛ ʀᴇʟᴇᴀsᴇ ');

const snoakFormatter = JSON.parse(fs.readFileSync(path.join(exportRoot, 'snoak/preferred-only.json'), 'utf8'));
assert.equal(stripInvisibleMarkers(compileTemplate(snoakFormatter.name, hooks)(fixture)), 'Severance S02 · E03');
assert.equal(stripInvisibleMarkers(compileTemplate(snoakFormatter.description, hooks)(fixture)), '18.5 GB · 25 Mbps\nDebrid [RD] 🎟️ NTb');

console.log(`Parsed and rendered ${files.length} formatter exports with upstream AIOStreams.`);
