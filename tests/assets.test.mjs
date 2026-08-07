import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import * as badgeCatalog from '../src/badges.mjs';
import {allFusionConfigurations} from '../src/configuration.mjs';
import {generateFusionExport} from '../src/fusion.mjs';

const {BADGE_FAMILIES, RETAINED_UNUSED_BADGE_PATHS, allBadgePaths, badgeUrl, badgesFor} = badgeCatalog;

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const badgeRoot = path.join(projectRoot, 'assets/badges');
const expectedGeneralSeaDex = [
  'legacy/quality/colored/sea-dex.png',
  'legacy/quality/mono/sea-dex.png',
  'modern/quality/colored/sea-dex.png',
  'modern/quality/mono/sea-dex.png',
];
const compactSourceHashes = new Map([
  ['modern/quality/colored/source-icons/blu-ray.png', '03c4ed5b96323feb92171758a3b03c729115cc1a71796df1a7282414acc07413'],
  ['modern/quality/colored/source-icons/remux.png', '754ff2d2f115ad94c6b209d936c436bd7a3a6465bae890c8c450100ada4b6319'],
  ['modern/quality/colored/source-icons/web-dl.png', '5dcd1b6df7598acc0083ff4f6c227eadb02e867a5806dc6898ba5d44bc2ffa18'],
  ['modern/quality/colored/source-icons/blu-ray-bright.png', '4b9553d125074ffe78b4b603f5ee23ba3440db51986fe00ea4c020a682d615cc'],
  ['modern/quality/colored/source-icons/remux-bright.png', '7adcdddd610eaf7d572811c3c273deee1deb061cac6694a9d18e67b4b5d3f3a2'],
  ['modern/quality/colored/source-icons/web-dl-bright.png', '387a408524c81d3985ae385d0af976d0c370fb6d11c4811569eb9fc43420283a'],
  ['modern/quality/mono/source-icons/blu-ray.png', 'e0fe58d15ae9a73108bc6b483c188f0d89bdd95716d33f392acba1fb69c05e6d'],
  ['modern/quality/mono/source-icons/remux.png', '905f10e1dee40cd5683d73fec92b54ce023feb766095005018a3c193d73f9b32'],
  ['modern/quality/mono/source-icons/web-dl.png', '7b314c899f7a3745dbaa47d9727ea03c40264451a0e778270b1415d7dff99238'],
]);
const brightCompactSources = [...compactSourceHashes.keys()].filter((name) => name.endsWith('-bright.png'));
const expectedRetained = [...brightCompactSources].sort();
const legacySources = ['remux', 'blu-ray', 'web-dl'];
const legacyTierCounts = {remux: 5, 'blu-ray': 8, 'web-dl': 6};
const legacyColoredQualityNames = [
  ...legacySources,
  ...['best', 'good'].flatMap((rank) => legacySources.map((source) => `${rank}-${source}`)),
  ...Object.entries(legacyTierCounts).flatMap(([source, count]) => (
    Array.from({length: count}, (_, index) => `${source}-tier-${index + 1}`)
  )),
  'sea-dex',
  'sea-dex-best',
  'sea-dex-alt',
];
assert.equal(legacyColoredQualityNames.length, 31);
const legacyOriginalPngPaths = [
  'legacy/audio/dolby-atmos.png',
  'legacy/audio/dolby-digital-plus.png',
  'legacy/audio/dolby-digital.png',
  'legacy/audio/dolby-truehd.png',
  'legacy/audio/dts-hd-ma.png',
  'legacy/audio/dts-hd.png',
  'legacy/audio/dts-x.png',
  'legacy/audio/dts.png',
  'legacy/channels/5.1.png',
  'legacy/channels/6.1.png',
  'legacy/channels/7.1.png',
  'legacy/quality/mono/blu-ray-tier-1.png',
  'legacy/quality/mono/blu-ray-tier-2.png',
  'legacy/quality/mono/blu-ray-tier-3.png',
  'legacy/quality/mono/remux-tier-1.png',
  'legacy/quality/mono/remux-tier-2.png',
  'legacy/quality/mono/remux-tier-3.png',
  'legacy/quality/mono/web-dl-tier-1.png',
  'legacy/quality/mono/web-dl-tier-2.png',
  'legacy/quality/mono/web-dl-tier-3.png',
  'legacy/resolution/1080p.png',
  'legacy/resolution/4k.png',
  'legacy/resolution/720p.png',
  'legacy/visual/dolby-vision.png',
  'legacy/visual/hdr.png',
  'legacy/visual/hdr10-plus.png',
  'legacy/visual/hdr10.png',
  'legacy/visual/sdr.png',
].sort();
const legacyCanonicalInputPaths = [
  'legacy/quality/mono/blu-ray.png',
];
const legacyGeneratedPngPaths = [
  'legacy/quality/mono/remux.png',
  'legacy/quality/mono/web-dl.png',
  'legacy/quality/mono/best-remux.png',
  'legacy/quality/mono/best-blu-ray.png',
  'legacy/quality/mono/best-web-dl.png',
  'legacy/quality/mono/good-remux.png',
  'legacy/quality/mono/good-blu-ray.png',
  'legacy/quality/mono/good-web-dl.png',
  'legacy/quality/mono/ok-remux.png',
  'legacy/quality/mono/ok-blu-ray.png',
  'legacy/quality/mono/ok-web-dl.png',
  ...[4, 5].map((tier) => `legacy/quality/mono/remux-tier-${tier}.png`),
  ...[4, 5, 6, 7, 8].map((tier) => `legacy/quality/mono/blu-ray-tier-${tier}.png`),
  ...[4, 5, 6].map((tier) => `legacy/quality/mono/web-dl-tier-${tier}.png`),
  ...['sea-dex', 'sea-dex-best', 'sea-dex-alt']
    .map((name) => `legacy/quality/mono/${name}.png`),
  ...legacyColoredQualityNames.map((name) => `legacy/quality/colored/${name}.png`),
].sort();
const legacyPngPaths = [
  ...legacyOriginalPngPaths,
  ...legacyCanonicalInputPaths,
  ...legacyGeneratedPngPaths,
].sort();

function gitBlobId(data) {
  return crypto.createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
}

function pngPaths(family) {
  const familyRoot = path.join(badgeRoot, family);
  if (!fs.existsSync(familyRoot)) return [];
  return fs.readdirSync(familyRoot, {recursive: true, withFileTypes: true})
    .filter((entry) => entry.isFile() && entry.name.endsWith('.png'))
    .map((entry) => path.relative(badgeRoot, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'))
    .sort();
}

function familyFingerprint(paths) {
  const hash = crypto.createHash('sha256');
  for (const relativePath of [...paths].sort()) {
    hash.update(relativePath.slice('legacy/'.length));
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(badgeRoot, relativePath)));
  }
  return hash.digest('hex');
}

test('resolves Modern and Legacy semantic badge catalogs', () => {
  assert.deepEqual(BADGE_FAMILIES, ['modern', 'legacy']);
  const modern = badgesFor('modern');
  const legacy = badgesFor('legacy');
  assert.equal(modern.quality.tier('colored', 'web-dl', 1), 'modern/quality/colored/web-dl-tier-1.png');
  assert.equal(legacy.quality.tier('mono', 'blu-ray', 8), 'legacy/quality/mono/blu-ray-tier-8.png');
  assert.equal(modern.visual.hdr10Plus, 'modern/visual/hdr10-plus.png');
  assert.equal(legacy.visual.hdr10Plus, 'legacy/visual/hdr10-plus.png');
  assert.equal(modern.audio.ddPlusAtmos, 'modern/audio/dolby-digital-plus-atmos.png');
  assert.equal(legacy.audio.ddPlusAtmos, null);
  assert.equal(modern.combined.dvAtmos, 'modern/combined/dolby-vision-atmos.png');
  assert.equal(legacy.combined, null);
  assert.equal(legacy.visual.imax, 'modern/visual/imax.png');
  assert.equal(legacy.visual.imaxEnhanced, 'modern/visual/imax-enhanced.png');
  assert.equal(modern.channels['6.1'], 'modern/channels/6.1.png');
  assert.equal(legacy.channels['6.1'], 'legacy/channels/6.1.png');
  assert.equal(modern.visual.sdr, 'modern/visual/sdr.png');
  assert.equal(legacy.visual.sdr, 'legacy/visual/sdr.png');
  assert.equal(modern.quality.seaDex('colored', 'general'), 'modern/quality/colored/sea-dex.png');
  assert.equal(legacy.quality.seaDex('mono', 'general'), 'legacy/quality/mono/sea-dex.png');
  assert.equal(modern.quality.sourceIcon('colored', 'remux'), 'modern/quality/colored/source-icons/remux.png');
  assert.equal(modern.quality.sourceIcon('mono', 'web-dl'), 'modern/quality/mono/source-icons/web-dl.png');
  assert.equal(modern.quality.sourceIconBright('blu-ray'), 'modern/quality/colored/source-icons/blu-ray-bright.png');
  assert.equal(legacy.quality.sourceIcon('mono', 'remux'), null);
  assert.equal(legacy.quality.sourceIconBright('remux'), null);
  assert.equal(
    badgeUrl('https://example.test/assets/badges', legacy.resolution['4k']),
    'https://example.test/assets/badges/legacy/resolution/4k.png',
  );
  assert.throws(() => badgesFor('unknown'), /unknown badge family/);

  const paths = allBadgePaths();
  assert.equal(new Set(paths).size, paths.length);
  for (const relativePath of paths) {
    assert.match(relativePath, /^(?:modern|legacy)\/(?:quality\/(?:colored|mono)(?:\/source-icons)?|resolution|visual|audio|combined|channels)\/[a-z0-9.-]+\.png$/);
    assert.doesNotMatch(relativePath.replace('/source-icons/', '/'), /(?:icon|dot|webdl|bluray|digitalplus|[A-Z])/u);
  }
});

test('retains only approved bright alternate artwork outside generated Fusion exports', () => {
  assert.deepEqual(RETAINED_UNUSED_BADGE_PATHS, expectedRetained);
  assert.equal(
    gitBlobId(fs.readFileSync(path.join(badgeRoot, expectedGeneralSeaDex[2]))),
    'f9b29c1aa8042c94f2f2212da1f3679c60d1cddf',
  );
  assert.equal(
    gitBlobId(fs.readFileSync(path.join(badgeRoot, expectedGeneralSeaDex[3]))),
    '6604bbdfe9bf99b49753cb172d185ffc1b4a79f2',
  );
});

test('imports compact Modern source artwork byte-for-byte', () => {
  assert.equal(compactSourceHashes.size, 9);
  for (const [relativePath, expectedHash] of compactSourceHashes) {
    const data = fs.readFileSync(path.join(badgeRoot, relativePath));
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'), expectedHash, relativePath);
    assert.equal(data.readUInt32BE(20), 320, relativePath);
  }
});

test('retains protected developer Legacy artwork and the complete generated inventory', () => {
  assert.deepEqual(pngPaths('legacy'), legacyPngPaths);
  assert.equal(legacyOriginalPngPaths.length, 28);
  assert.equal(legacyCanonicalInputPaths.length, 1);
  assert.equal(legacyGeneratedPngPaths.length, 55);
  assert.equal(legacyPngPaths.length, 84);
  assert.equal(
    crypto.createHash('sha256')
      .update(fs.readFileSync(path.join(badgeRoot, legacyCanonicalInputPaths[0])))
      .digest('hex'),
    'ef18ba976a67b93b7937b8a5136a4087b3b6e8916aaf4dcea9261707ae306339',
  );
  assert.equal(
    familyFingerprint(legacyOriginalPngPaths),
    '7a40658918566db725afb4010855dd12879f5945d2f0c893ae24a9ebf1794779',
  );
});

test('contains both complete family catalogs and only permits explicitly retained unused badges', () => {
  const referenced = new Set();
  for (const configuration of allFusionConfigurations()) {
    for (const filter of generateFusionExport(configuration).filters) {
      if (filter.imageURL) referenced.add(new URL(filter.imageURL).pathname.split('/assets/badges/')[1]);
    }
  }
  const present = new Set(BADGE_FAMILIES.flatMap((family) => pngPaths(family)));
  assert.deepEqual([...present].sort(), allBadgePaths());
  assert.deepEqual([...present].filter((name) => !referenced.has(name)).sort(), expectedRetained);
  assert.deepEqual([...referenced].filter((name) => !present.has(name)).sort(), []);
  assert.equal([...present].some((name) => /coming-soon/iu.test(name)), false);
});

test('keeps every badge as a transparent family-height PNG', () => {
  for (const family of BADGE_FAMILIES) {
    for (const name of pngPaths(family)) {
      const data = fs.readFileSync(path.join(badgeRoot, name));
      assert.equal(data.subarray(1, 4).toString(), 'PNG', name);
      assert.equal(data.readUInt32BE(20), family === 'modern' ? 320 : 80, name);
      assert.equal(data[25], 6, `${name}: expected RGBA PNG`);
    }
  }
});
