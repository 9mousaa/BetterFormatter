import assert from 'node:assert/strict';
import test from 'node:test';

import {
  allFormatterConfigurations,
  allFusionConfigurations,
  canonicalDolbyProfile,
  dolbyProfilesFor,
  fusionExportPath,
  formatterExportPath,
  sourceBadgeStylesFor,
} from '../src/configuration.mjs';

test('canonicalizes the two overlapping combination priorities', () => {
  assert.equal(
    canonicalDolbyProfile({carrier: 'combined', dvAudio: 'combined', priority: 'audio'}),
    'audio-combined',
  );
  assert.equal(
    canonicalDolbyProfile({carrier: 'combined', dvAudio: 'combined', priority: 'dv'}),
    'audio-combined-dv-priority',
  );
});

test('maps independent Dolby selections to six canonical outputs', () => {
  const profiles = new Set([
    canonicalDolbyProfile({carrier: 'compact', dvAudio: 'separate'}),
    canonicalDolbyProfile({carrier: 'compact', dvAudio: 'combined'}),
    canonicalDolbyProfile({carrier: 'separate', dvAudio: 'separate'}),
    canonicalDolbyProfile({carrier: 'separate', dvAudio: 'combined'}),
    canonicalDolbyProfile({carrier: 'combined', dvAudio: 'separate'}),
    canonicalDolbyProfile({carrier: 'combined', dvAudio: 'combined', priority: 'audio'}),
    canonicalDolbyProfile({carrier: 'combined', dvAudio: 'combined', priority: 'dv'}),
  ]);

  assert.deepEqual([...profiles].sort(), [
    'audio-combined',
    'audio-combined-dv-priority',
    'compact-dv-combined',
    'compact-separate',
    'detailed-dv-combined',
    'detailed-separate',
  ]);
});

test('uses stable app-specific public export paths', () => {
  assert.equal(
    fusionExportPath({
      badgeFamily: 'modern',
      quality: 'tiers',
      languageBadges: true,
      sourceBadgeStyle: 'icon-only',
      seadexMode: 'combined',
      icon: 'mono',
      dolbyProfile: 'audio-combined',
      hdrPolicy: 'show-both',
    }),
    'exports/fusion/modern/tiers/languages-shown/icon-only/combined/always-show/mono-atmos-carrier-dv-separate.json',
  );
  assert.equal(
    formatterExportPath({style: 'renoria', languageMode: 'uLanguages'}),
    'exports/aiostreams/renoria/preferred-only.json',
  );
});

test('maps every internal export value to friendly public slugs', () => {
  const cases = [
    ['best-good-ok', 'best-good-ok'],
    ['tiers', 'tiers'],
    ['source', 'quality-badges'],
    ['percentages', 'percentages'],
  ];
  for (const [quality, publicQuality] of cases) {
    assert.match(fusionExportPath({
      badgeFamily: 'modern', quality, languageBadges: false, sourceBadgeStyle: 'detailed',
      seadexMode: 'off', icon: 'colored', dolbyProfile: 'compact-separate', hdrPolicy: 'suppress-with-dv',
    }), new RegExp(`/modern/${publicQuality}/languages-hidden/detailed/hidden/dv-priority/colored-atmos-priority-dv-separate\\.json$`));
  }
});

test('generates six Modern Dolby profiles and two Legacy standalone profiles', () => {
  assert.deepEqual(dolbyProfilesFor('modern'), [
    'compact-separate',
    'compact-dv-combined',
    'detailed-separate',
    'detailed-dv-combined',
    'audio-combined',
    'audio-combined-dv-priority',
  ]);
  assert.deepEqual(dolbyProfilesFor('legacy'), ['compact-separate', 'detailed-separate']);
  assert.throws(() => dolbyProfilesFor('unknown'), /unknown badge family/);

  const configurations = allFusionConfigurations();
  assert.equal(configurations.length, 1200);
  assert.equal(configurations.filter(({badgeFamily}) => badgeFamily === 'modern').length, 1008);
  assert.equal(configurations.filter(({badgeFamily}) => badgeFamily === 'legacy').length, 192);
  assert.equal(new Set(configurations.map(fusionExportPath)).size, 1200);
  assert.deepEqual(sourceBadgeStylesFor('modern', 'tiers'), ['detailed', 'icon-only']);
  assert.deepEqual(sourceBadgeStylesFor('modern', 'best-good-ok'), ['detailed']);
  assert.deepEqual(sourceBadgeStylesFor('legacy', 'tiers'), ['detailed']);

  const formatters = allFormatterConfigurations();
  assert.equal(formatters.length, 15);
  assert.equal(new Set(formatters.map(formatterExportPath)).size, 15);
  assert.deepEqual([...new Set(formatters.map(({style}) => style))], ['classic', 'filename', 'renoria', 'jeor', 'snoak']);
});
