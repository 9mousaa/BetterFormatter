import assert from 'node:assert/strict';
import test from 'node:test';

import {DEFAULT_STATE, resolveSelection} from '../src/ui-state.mjs';
import {markerIdsInText} from '../src/protocol.mjs';

test('resolves the default UI state to a matched formatter and Fusion pair', () => {
  const selected = resolveSelection(DEFAULT_STATE);
  assert.equal(DEFAULT_STATE.priority, 'dv');
  assert.equal(selected.dolbyProfile, 'compact-dv-combined');
  assert.equal(selected.badgeFamily, 'modern');
  assert.equal(selected.icon, 'colored');
  assert.equal(selected.pairingPriorityVisible, false);
  assert.equal(selected.quality, 'tiers');
  assert.equal(selected.formatterStyle, 'classic');
  assert.equal(selected.sourceBadgeStyle, 'detailed');
  assert.equal(selected.seadexMode, 'split');
  assert.match(selected.fusionUrl, /exports\/fusion\/modern\/tiers\/languages-shown\/detailed\/split\/dv-priority\/colored-atmos-priority-dv-atmos\.json$/);
  assert.match(selected.formatterUrl, /exports\/aiostreams\/classic\/preferred-only\.json$/);
  assert.deepEqual(markerIdsInText(selected.markerSnippet).slice(-29), Array.from({length: 29}, (_, index) => index + 49));
});

test('normalizes Legacy selections to supported standalone badges', () => {
  const selected = resolveSelection({
    ...DEFAULT_STATE,
    badgeFamily: 'legacy',
    icon: 'mono',
    carrier: 'combined',
    dvAudio: 'combined',
    priority: 'dv',
  });
  assert.equal(selected.carrier, 'separate');
  assert.equal(selected.dvAudio, 'separate');
  assert.equal(selected.dolbyProfile, 'detailed-separate');
  assert.equal(selected.pairingPriorityVisible, false);
  assert.match(selected.fusionUrl, /exports\/fusion\/legacy\/tiers\/languages-shown\/detailed\/split\/dv-priority\/mono-audio-separate-dv-separate\.json$/);
  assert.match(selected.formatterUrl, /exports\/aiostreams\/classic\/preferred-only\.json$/);
});

test('changes only the Fusion export when the badge family changes', () => {
  const modern = resolveSelection(DEFAULT_STATE);
  const legacy = resolveSelection({...DEFAULT_STATE, badgeFamily: 'legacy'});
  assert.notEqual(modern.fusionUrl, legacy.fusionUrl);
  assert.equal(modern.formatterUrl, legacy.formatterUrl);
  assert.equal(modern.markerSnippet, legacy.markerSnippet);
});

test('preserves the compact source preference while canonicalizing unsupported selections', () => {
  const compact = {...DEFAULT_STATE, sourceBadgeStyle: 'icon-only'};
  const modern = resolveSelection(compact);
  const legacy = resolveSelection({...compact, badgeFamily: 'legacy'});
  const scores = resolveSelection({...compact, quality: 'best-good-ok'});
  assert.equal(modern.sourceBadgeStyle, 'icon-only');
  assert.equal(modern.fusionConfiguration.sourceBadgeStyle, 'icon-only');
  assert.equal(legacy.sourceBadgeStyle, 'icon-only');
  assert.equal(legacy.fusionConfiguration.sourceBadgeStyle, 'detailed');
  assert.equal(scores.sourceBadgeStyle, 'icon-only');
  assert.equal(scores.fusionConfiguration.sourceBadgeStyle, 'detailed');
});

test('maps every SeaDex display mode only to Fusion', () => {
  const formatterUrl = resolveSelection(DEFAULT_STATE).formatterUrl;
  for (const seadexMode of ['split', 'combined', 'off']) {
    const selected = resolveSelection({...DEFAULT_STATE, seadexMode});
    const publicMode = seadexMode === 'off' ? 'hidden' : seadexMode;
    assert.match(selected.fusionUrl, new RegExp(`/${publicMode}/`));
    assert.equal(selected.formatterUrl, formatterUrl);
  }
});

test('shows pairing priority only for two overlapping combined choices', () => {
  const hidden = resolveSelection({...DEFAULT_STATE, carrier: 'combined', dvAudio: 'separate'});
  const shown = resolveSelection({...DEFAULT_STATE, carrier: 'combined', dvAudio: 'combined', priority: 'dv'});
  assert.equal(hidden.pairingPriorityVisible, false);
  assert.equal(shown.pairingPriorityVisible, true);
  assert.equal(shown.dolbyProfile, 'audio-combined-dv-priority');
});

test('removes languages from both sides of the matched pair', () => {
  const selected = resolveSelection({...DEFAULT_STATE, languageMode: 'off'});
  assert.match(selected.fusionUrl, /\/languages-hidden\//);
  assert.match(selected.formatterUrl, /\/hidden\.json$/);
  assert.equal(markerIdsInText(selected.markerSnippet).some((id) => id >= 49 && id <= 77), false);
});

test('maps all detected and configured language modes to the same Fusion filters', () => {
  const all = resolveSelection({...DEFAULT_STATE, languageMode: 'languages'});
  const configured = resolveSelection({...DEFAULT_STATE, languageMode: 'uLanguages'});
  assert.equal(all.fusionUrl, configured.fusionUrl);
  assert.notEqual(all.formatterUrl, configured.formatterUrl);
  assert.match(all.markerSnippet, /stream\.languages/);
  assert.match(configured.markerSnippet, /stream\.uLanguages/);
});

test('keeps the formatter URL universal across non-language settings', () => {
  const base = resolveSelection(DEFAULT_STATE).formatterUrl;
  const changes = [
    {quality: 'percentages'}, {seadexMode: 'off'}, {carrier: 'combined'},
    {dvAudio: 'separate'}, {hdrPolicy: 'show-both'}, {badgeFamily: 'legacy'},
    {icon: 'mono'}, {sourceBadgeStyle: 'icon-only'},
  ];
  for (const change of changes) assert.equal(resolveSelection({...DEFAULT_STATE, ...change}).formatterUrl, base);
});

test('explains each quality prerequisite', () => {
  assert.match(resolveSelection({...DEFAULT_STATE, quality: 'best-good-ok'}).prerequisite, /scored sorting/i);
  assert.match(resolveSelection({...DEFAULT_STATE, quality: 'percentages'}).prerequisite, /scored sorting/i);
  assert.match(resolveSelection({...DEFAULT_STATE, quality: 'tiers'}).prerequisite, /VidHin/i);
  assert.match(resolveSelection({...DEFAULT_STATE, quality: 'source'}).prerequisite, /does not require/i);
});

test('resolves a session custom formatter without inventing a public export URL', () => {
  const customFormatter = {name: 'Custom name', description: 'Custom description'};
  const selected = resolveSelection(
    {...DEFAULT_STATE, formatterStyle: 'custom'},
    {customFormatter},
  );
  assert.equal(selected.formatterStyle, 'custom');
  assert.equal(selected.formatterUrl, null);
  assert.deepEqual(selected.formatter, customFormatter);
  assert.match(selected.fusionUrl, /exports\/fusion\//);
});
