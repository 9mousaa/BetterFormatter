import assert from 'node:assert/strict';
import test from 'node:test';

import {generateFusionExport} from '../src/fusion.mjs';
import {MARKERS as M, markerIdsInText} from '../src/protocol.mjs';
import * as preview from '../src/preview.mjs';

const EXPECTED_FILENAMES = [
  'Silo.S02E01.2025.2160p.ATVP.WEB-DL.DDP5.1.Atmos.DV.HDR10Plus.H.265-NTb.mkv',
  'A.Knight.of.the.Seven.Kingdoms.S01E01.The.Hedge.Knight.720p.HMAX.WEB-DL.DDP5.1.H.264-NTb.mkv',
  '[chasa] Chainsaw Man - The Movie Reze Arc (2025) (WEB-DL 2160p HEVC EAC3 5.1 Atmos) [Dual Audio].mkv',
  "Frieren Beyond Journey's End - S01E01 (BD Remux 1080p AVC FLAC AAC) [Dual Audio] [PMR].mkv",
  'Top.Gun.Maverick.2022.2160p.UHD.BluRay.IMAX.HDR10.TrueHD.7.1.Atmos.DTS.DD-MTeam.mkv',
];

const streamsFor = (quality) => preview.previewStreamsFor?.(quality) ?? [];
const ids = (text) => markerIdsInText(text);

function matchingIds(stream, state, dolbyProfile = 'audio-combined') {
  const exported = generateFusionExport({
    quality: state.quality,
    languageBadges: state.languageMode !== 'off',
    icon: 'colored',
    dolbyProfile,
    hdrPolicy: state.hdrPolicy ?? 'suppress-with-dv',
  });
  const facts = preview.factsFor(stream, state);
  return exported.filters.filter((filter) => {
    const pattern = filter.pattern.replace(/^\(\?s\)/, '');
    return new RegExp(pattern, 'su').test(facts);
  }).map((filter) => filter.id);
}

test('uses one stable five-release fixture catalog', () => {
  assert.deepEqual(Object.values(preview.PREVIEW_CATALOG ?? {}).map((stream) => stream.filename), EXPECTED_FILENAMES);
});

test('keeps the same five fixture identities across every quality system', () => {
  const identities = streamsFor('tiers').map((stream) => stream.filename);
  for (const quality of ['best-good-ok', 'percentages', 'source']) {
    assert.deepEqual(streamsFor(quality).map((stream) => stream.filename), identities);
  }
  assert.deepEqual(streamsFor('best-good-ok').map((stream) => stream.score), [100, 90, 89, 50, 49]);
  assert.deepEqual(streamsFor('percentages').map((stream) => stream.score), [100, 90, 89, 50, 1]);
  assert.deepEqual(streamsFor('tiers').map((stream) => [stream.source, stream.tier]), [
    [M.Web, M.Tier1],
    [M.Web, M.Tier2],
    [M.Web, M.Unranked],
    [M.Remux, M.Tier3],
    [M.BluRay, M.Tier2],
  ]);
  assert.deepEqual(streamsFor('source').map((stream) => stream.source), [M.Web, M.Web, M.Web, M.Remux, M.BluRay]);
});

test('emits quality facts for boundaries, tiers, sources, and WEBRip exclusion', () => {
  const bestGoodOk = streamsFor('best-good-ok');
  assert(ids(preview.factsFor(bestGoodOk[0], {quality: 'best-good-ok', languageMode: 'off'})).includes(35));
  assert(ids(preview.factsFor(bestGoodOk[2], {quality: 'best-good-ok', languageMode: 'off'})).includes(36));
  assert(ids(preview.factsFor(bestGoodOk[4], {quality: 'best-good-ok', languageMode: 'off'})).includes(37));

  const percentages = streamsFor('percentages');
  const percentageIds = ids(preview.factsFor(percentages[4], {quality: 'percentages', languageMode: 'off'}));
  assert.deepEqual(percentageIds.slice(percentageIds.indexOf(38), percentageIds.indexOf(38) + 2), [38, 40]);

  const tiers = streamsFor('tiers');
  assert(matchingIds(tiers[0], {quality: 'tiers', languageMode: 'off'}).includes('q-web-t1'));
  assert(matchingIds(tiers[1], {quality: 'tiers', languageMode: 'off'}).includes('q-web-t2'));
  assert(matchingIds(tiers[2], {quality: 'tiers', languageMode: 'off'}).includes('q-web-u'));

  const webRip = {...streamsFor('source')[2], source: '', tier: '', quality: 'WebRip'};
  assert.equal(ids(preview.factsFor(webRip, {quality: 'source', languageMode: 'off'})).some((id) => [0, 1, 2].includes(id)), false);
  assert.equal(matchingIds(webRip, {quality: 'source', languageMode: 'off'}).some((id) => id === 'q-w'), false);
});

test('keeps all detected and configured-only language facts distinct', () => {
  const stream = streamsFor('source')[2];
  const all = ids(preview.factsFor(stream, {quality: 'source', languageMode: 'languages'}));
  const configured = ids(preview.factsFor(stream, {quality: 'source', languageMode: 'uLanguages'}));
  assert.notDeepEqual(all, configured);
  assert(all.includes(49));
  assert(all.includes(77));
  assert(configured.includes(49));
  assert.equal(ids(preview.factsFor(stream, {quality: 'source', languageMode: 'off'})).some((id) => id >= 49 && id <= 77), false);
});

test('fixtures exercise HDR policy and both Dolby pairing priorities', () => {
  const hailMary = streamsFor('best-good-ok')[0];
  const suppress = matchingIds(hailMary, {quality: 'best-good-ok', languageMode: 'off', hdrPolicy: 'suppress-with-dv'}, 'audio-combined');
  const showBoth = matchingIds(hailMary, {quality: 'best-good-ok', languageMode: 'off', hdrPolicy: 'show-both'}, 'audio-combined');
  assert(suppress.includes('a-dv'));
  assert(suppress.includes('a-dp-at'));
  assert.equal(suppress.includes('v-hdr10p'), false);
  assert(showBoth.includes('v-hdr10p'));

  const dvFirst = matchingIds(hailMary, {quality: 'best-good-ok', languageMode: 'off', hdrPolicy: 'show-both'}, 'audio-combined-dv-priority');
  assert(dvFirst.includes('a-at-dv'));
  assert(dvFirst.includes('a-dp'));

  const trueHdAtmos = streamsFor('source')[4];
  assert(matchingIds(trueHdAtmos, {quality: 'source', languageMode: 'off'}, 'audio-combined').includes('a-th-at'));
  assert(matchingIds(trueHdAtmos, {quality: 'source', languageMode: 'off'}, 'audio-combined').includes('c-71'));
});

test('fixtures expose generic HDR and plain DTS while retaining the DD hierarchy', () => {
  const chainsaw = streamsFor('source')[2];
  const topGun = streamsFor('source')[4];
  assert(matchingIds(chainsaw, {quality: 'source', languageMode: 'off'}, 'detailed-separate').includes('v-hdr'));
  const topGunMatches = matchingIds(topGun, {quality: 'source', languageMode: 'off'}, 'detailed-separate');
  assert(topGunMatches.includes('a-dts'));
  assert(ids(preview.factsFor(topGun, {quality: 'source', languageMode: 'off'})).includes(25));
  assert.equal(topGunMatches.includes('a-dd'), false);
});

test('changing combination priority affects only fixtures that contain DV', () => {
  const fixtures = streamsFor('tiers');
  const state = {quality: 'tiers', languageMode: 'off'};
  const audioFirst = fixtures.map((stream) => matchingIds(stream, state, 'audio-combined'));
  const dvFirst = fixtures.map((stream) => matchingIds(stream, state, 'audio-combined-dv-priority'));

  assert(audioFirst[0].includes('a-dv') && audioFirst[0].includes('a-dp-at'));
  assert(dvFirst[0].includes('a-at-dv') && dvFirst[0].includes('a-dp'));
  assert.deepEqual(dvFirst[2].filter((id) => id.startsWith('a-')), audioFirst[2].filter((id) => id.startsWith('a-')));
  assert.deepEqual(dvFirst[4].filter((id) => id.startsWith('a-')), audioFirst[4].filter((id) => id.startsWith('a-')));
});

test('fixtures include representative SDR and 6.1 facts', () => {
  for (const quality of ['best-good-ok', 'percentages', 'tiers', 'source']) {
    const fixtures = streamsFor(quality);
    assert(fixtures.some((stream) => ids(stream.common).includes(15)), `${quality}: SDR`);
    assert(fixtures.some((stream) => ids(stream.common).includes(31)), `${quality}: 6.1`);
  }
  const stream = streamsFor('source').find((fixture) => ids(fixture.common).includes(31));
  const matched = matchingIds(stream, {quality: 'source', languageMode: 'off'}, 'detailed-separate');
  assert(matched.includes('v-sdr'));
  assert(matched.includes('c-61'));
});

test('preview facts always carry universal SeaDex markers', () => {
  const stream = preview.PREVIEW_CATALOG.chainsaw;
  const split = ids(preview.factsFor(stream, {quality: 'source', languageMode: 'off', seadexMode: 'split'}));
  const combined = ids(preview.factsFor(stream, {quality: 'source', languageMode: 'off', seadexMode: 'combined'}));
  const off = ids(preview.factsFor(stream, {quality: 'source', languageMode: 'off', seadexMode: 'off'}));
  assert(split.includes(33) && !split.includes(34));
  assert.deepEqual(combined, split);
  assert.deepEqual(off, split);
});

test('renders all five formatter preview styles from the selected fixtures', () => {
  const stream = streamsFor('best-good-ok')[0];
  assert.equal(preview.streamName(stream, {formatterStyle: 'classic'}), 'Web-Dl');
  assert.equal(preview.streamName(stream, {formatterStyle: 'renoria'}), '4K ●●●●');
  assert.equal(preview.streamDescription(stream, {formatterStyle: 'filename'}), EXPECTED_FILENAMES[0]);
  assert.match(preview.streamDescription(stream, {formatterStyle: 'classic'}), /RD · Debrid · 28 GB$/);
  assert.equal(preview.streamDescription(stream, {formatterStyle: 'renoria'}), 'Silo (2025) S02 · E01\nNTb · Debrid · 28GB');
  assert.match(preview.streamName(stream, {formatterStyle: 'snoak'}), /^Silo S02 · E01$/);
  assert.match(preview.streamDescription(stream, {formatterStyle: 'snoak'}), /Debrid \[RD\] 🎟️ NTb$/u);
  assert.match(preview.streamName(stream, {formatterStyle: 'jeor'}), /Silo/);
  assert.match(preview.streamDescription(stream, {formatterStyle: 'jeor'}), /\[RD\] Debrid · NTb/);
});

test('builds an AIOStreams formatter context without changing Fusion fixture facts', () => {
  const stream = preview.PREVIEW_CATALOG.silo;
  const before = preview.factsFor(stream, {quality: 'tiers', languageMode: 'uLanguages'});
  const context = preview.formatterContextFor(stream);
  assert.equal(context.metadata.title, 'Silo');
  assert.equal(context.stream.resolution, '2160p');
  assert.equal(context.stream.quality, 'Web-Dl');
  assert.deepEqual(context.stream.seasonEpisode, ['S02', 'E01']);
  assert.deepEqual(context.stream.uLanguages, ['English', 'Spanish']);
  assert.equal(context.service.shortName, 'RD');
  assert.equal(preview.factsFor(stream, {quality: 'tiers', languageMode: 'uLanguages'}), before);
});
