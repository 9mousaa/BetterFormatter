import assert from 'node:assert/strict';
import test from 'node:test';

import {MARKERS, MARKER_NAMES, marker, markerIdsInText, stringifyExport} from '../src/protocol.mjs';

test('encodes every marker as a framed seven-bit big-endian value', () => {
  assert.equal(marker(0), '\u2063\u200b\u200b\u200b\u200b\u200b\u200b\u200b\u2063');
  assert.equal(marker(1), '\u2063\u200b\u200b\u200b\u200b\u200b\u200b\u200d\u2063');
  assert.equal(marker(127), '\u2063\u200d\u200d\u200d\u200d\u200d\u200d\u200d\u2063');
  assert.equal(new Set(Array.from({length: 128}, (_, id) => marker(id))).size, 128);
  assert.throws(() => marker(128), /0\.\.\.127/);
});

test('publishes the approved M0 through M77 assignments and reserves M78 through M127', () => {
  assert.equal(Object.keys(MARKER_NAMES).length, 78);
  assert.equal(MARKER_NAMES[0], 'Remux');
  assert.equal(MARKER_NAMES[10], 'Tier 8');
  assert.equal(MARKER_NAMES[15], 'SDR');
  assert.equal(MARKER_NAMES[31], '6.1');
  assert.equal(MARKER_NAMES[38], 'Score');
  assert.equal(MARKER_NAMES[49], 'English');
  assert.equal(MARKER_NAMES[54], 'Portuguese');
  assert.equal(MARKER_NAMES[55], 'Portuguese (Brazil)');
  assert.equal(MARKER_NAMES[77], 'Multi / Dual Audio');
  for (let id = 78; id <= 127; id += 1) assert.equal(MARKER_NAMES[id], undefined);
  assert.equal(MARKERS.Web, marker(2));
  assert.equal(MARKERS.SDR, marker(15));
  assert.equal(MARKERS.Channels61, marker(31));
  assert.equal(MARKERS.PortugueseBrazil, marker(55));
});

test('finds framed marker IDs without confusing unframed zero-width characters', () => {
  assert.deepEqual(markerIdsInText(`x${marker(2)}${marker(77)}y`), [2, 77]);
  assert.deepEqual(markerIdsInText('\u200b\u200d'), []);
});

test('writes marker characters as explicit JSON unicode escapes', () => {
  const json = stringifyExport({pattern: marker(3)});
  assert.match(json, /\\u2063\\u200b\\u200b\\u200b\\u200b\\u200b\\u200d\\u200d\\u2063/);
  assert.equal(json.includes('\u2063'), false);
  assert.deepEqual(JSON.parse(json), {pattern: marker(3)});
});
