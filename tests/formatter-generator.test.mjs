import assert from 'node:assert/strict';
import test from 'node:test';

import {allFormatterConfigurations} from '../src/configuration.mjs';
import {generateFormatter, markerSuffix, visibleFormatter} from '../src/formatters.mjs';
import * as formatterModule from '../src/formatters.mjs';
import {markerIdsInText} from '../src/protocol.mjs';

const CLASSIC_NAME = `{stream.quality::exists["{stream.quality::title}"||""]}`;
const CLASSIC_SERVICE_DESCRIPTION = `{stream.filename::exists["{stream.filename}"||""]}\n{service.shortName::exists["{service.shortName}"||""]}{stream.type::exists[" · {stream.type::title::replace('P2p','P2P')}"||""]}{stream.size::>0[" · {stream.size::bytes}"||""]}`;

test('preserves the two Classic visible formatter variants independently of quality mode', () => {
  assert.deepEqual(visibleFormatter('classic'), {
    name: CLASSIC_NAME,
    description: CLASSIC_SERVICE_DESCRIPTION,
  });
  assert.equal(visibleFormatter('filename').name, CLASSIC_NAME);
  assert.equal(visibleFormatter('filename').description, `{stream.filename::exists["{stream.filename}"||""]}`);
});

test('provides the renamed Renoria visible formatter without fallbacks', () => {
  const formatter = visibleFormatter('renoria');
  assert.match(formatter.name, /replace\('2160p','4K'\)/);
  assert.equal(formatter.description.split('\n').length, 2);
  assert.match(formatter.description, /^\{metadata\.title\}/);
  assert.doesNotMatch(formatter.description, /Unknown|smallcaps|translate/);
  assert.match(formatter.description, /seasonEpisode::join\(' · '\)/);
  assert.match(formatter.description, /stream\.releaseGroup/);
  assert.match(formatter.description, /stream\.size::rbytes/);
});

test('preserves the cleaned Snoak and Jeor visible layouts', () => {
  const snoak = visibleFormatter('snoak');
  assert.match(snoak.name, /stream\.title/);
  assert.match(snoak.description, /stream\.folderSize/);
  assert.match(snoak.description, /🎟️/u);
  assert.doesNotMatch(snoak.name + snoak.description, /[\u200b\u200d\u2063]/u);

  const jeor = visibleFormatter('jeor');
  assert.match(jeor.name, /⏳/u);
  assert.match(jeor.description, /uSmallLanguageCodes/);
  assert.match(jeor.description, /uSmallSubtitleCodes/);
  assert.match(jeor.description, /ʙᴇsᴛ ʀᴇʟᴇᴀsᴇ/u);
  assert.doesNotMatch(jeor.name + jeor.description, /[\u200b\u200d\u2063]/u);
  assert.doesNotMatch(jeor.name + jeor.description, /quality::=BluRay REMUX|WEBRip/);
});

test('emits every non-language marker family in every formatter', () => {
  const hidden = [...new Set(markerIdsInText(markerSuffix({languageMode: 'off'})))].sort((a, b) => a - b);
  assert.deepEqual(hidden, Array.from({length: 49}, (_, index) => index));
  for (const languageMode of ['languages', 'uLanguages']) {
    const ids = [...new Set(markerIdsInText(markerSuffix({languageMode})))].sort((a, b) => a - b);
    assert.deepEqual(ids, Array.from({length: 78}, (_, index) => index));
  }
});

test('emits the complete curated language registry from either documented language field', () => {
  const expected = Array.from({length: 29}, (_, index) => index + 49);
  for (const languageMode of ['languages', 'uLanguages']) {
    const suffix = markerSuffix({languageMode});
    const languageIds = markerIdsInText(suffix).filter((id) => id >= 49 && id <= 77);
    assert.deepEqual(languageIds, expected);
    assert.match(suffix, new RegExp(`stream\\.${languageMode}`));
  }

  const off = markerIdsInText(markerSuffix({languageMode: 'off'}));
  assert.equal(off.some((id) => id >= 49 && id <= 77), false);
});

test('keeps Portuguese variants separate and shares one marker for Multi and Dual Audio', () => {
  const suffix = markerSuffix({languageMode: 'languages'});
  assert.match(suffix, /stream\.languages::~Portuguese/);
  assert.match(suffix, /stream\.languages::~Portuguese \(Brazil\)/);
  assert.match(suffix, /stream\.languages::in\('Multi','Dual Audio'\)/);
  assert.doesNotMatch(suffix, /Dubbed|Original|Unknown/);
});

test('emits parsed SDR and 6.1 channel facts in every formatter profile', () => {
  const ids = markerIdsInText(markerSuffix({languageMode: 'off'}));
  assert(ids.includes(15));
  assert(ids.includes(31));
  const suffix = markerSuffix({languageMode: 'off'});
  assert.match(suffix, /stream\.visualTags::~SDR/);
  assert.match(suffix, /stream\.audioChannels::~6\.1/);
  assert.doesNotMatch(suffix, /stream\.filename::lower/);
});

test('generates all 15 universal formatter exports below the AIOStreams limit', () => {
  const configurations = allFormatterConfigurations();
  assert.equal(configurations.length, 15);
  for (const configuration of configurations) {
    const formatter = generateFormatter(configuration);
    assert.deepEqual(Object.keys(formatter), ['name', 'description']);
    assert(formatter.name.length < 5000, JSON.stringify(configuration));
    assert(formatter.description.length < 5000, JSON.stringify(configuration));
    const visible = visibleFormatter(configuration.style);
    assert.equal(formatter.name.startsWith(visible.name), true);
    assert.equal(formatter.description.startsWith(visible.description), true);
    const ids = markerIdsInText(formatter.name + formatter.description);
    assert(ids.includes(0) && ids.includes(48));
    assert.equal(ids.includes(49), configuration.languageMode !== 'off');
    assert.doesNotMatch(formatter.name + formatter.description, /Asian|quality::in\('WEB-DL','WEBRip'\)/iu);
  }
});

test('keeps SeaDex facts universal regardless of display settings', () => {
  for (const seadexMode of ['split', 'combined', 'off']) {
    const ids = markerIdsInText(markerSuffix({languageMode: 'off', seadexMode}));
    assert(ids.includes(33));
    assert(ids.includes(34));
  }
});

test('splits only Jeor marker categories across name and description', () => {
  const jeor = generateFormatter({style: 'jeor', languageMode: 'uLanguages'});
  const nameIds = markerIdsInText(jeor.name);
  const descriptionIds = markerIdsInText(jeor.description);
  assert(nameIds.includes(3) && nameIds.includes(35) && nameIds.includes(38) && nameIds.includes(49));
  assert.equal(nameIds.includes(0), false);
  assert(descriptionIds.includes(0) && descriptionIds.includes(12) && descriptionIds.includes(33));
  assert.equal(descriptionIds.includes(35), false);
});

test('accepts the AIOStreams maximum length and rejects fields that exceed it', () => {
  assert.doesNotThrow(
    () => formatterModule.assertFormatterWithinLimit({name: 'x'.repeat(5000), description: ''}),
  );
  assert.throws(
    () => formatterModule.assertFormatterWithinLimit({name: '', description: 'x'.repeat(5001)}),
    /at most 5000 characters/,
  );
});
