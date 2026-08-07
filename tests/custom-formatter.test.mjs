import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  composeCustomFormatter,
  customFormatterFileName,
  parseCustomFormatter,
  renderCustomFormatter,
  stripFusionMarkerExpressions,
} from '../src/custom-formatter.mjs';
import {markerSuffix} from '../src/formatters.mjs';
import {formatterContextFor, PREVIEW_CATALOG} from '../src/preview.mjs';
import {marker, markerIdsInText, stringifyExport} from '../src/protocol.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tamtaroNames = ['appletv', 'chillio', 'debug', 'default', 'minimalist'];

function tamtaro(name) {
  const file = path.join(projectRoot, `tests/fixtures/formatters/tamtaro-3.0.2-${name}.json`);
  return {file, raw: fs.readFileSync(file, 'utf8'), value: JSON.parse(fs.readFileSync(file, 'utf8'))};
}

test('keeps the pinned formatter engine free of Node-only Buffer globals', () => {
  const engine = fs.readFileSync(path.join(projectRoot, 'src/vendor/aiostreams-formatter-engine.mjs'), 'utf8');
  assert.doesNotMatch(engine, /\bBuffer\b/u);
});

test('accepts the same formatter object shape as AIOStreams and discards extra keys', () => {
  assert.deepEqual(
    parseCustomFormatter({name: '{stream.quality}', description: '{stream.filename}', ignored: true}, 'Example.JSON'),
    {
      formatter: {name: '{stream.quality}', description: '{stream.filename}'},
      sourceStem: 'Example',
    },
  );
});

test('rejects values that do not contain string name and description fields', () => {
  for (const value of [null, {}, {name: '', description: 7}, {name: false, description: ''}]) {
    assert.throws(() => parseCustomFormatter(value), /invalid AIOStreams formatter/i);
  }
});

test('accepts exactly 5000 characters per field and rejects longer templates', () => {
  assert.equal(parseCustomFormatter({name: 'n'.repeat(5000), description: ''}).formatter.name.length, 5000);
  assert.throws(
    () => parseCustomFormatter({name: '', description: 'd'.repeat(5001)}),
    /description exceeds 5,000 characters/i,
  );
  assert.throws(
    () => parseCustomFormatter({name: 'n'.repeat(5000) + marker(1), description: ''}),
    /name exceeds 5,000 characters/i,
  );
});

test('removes complete Fusion frames while preserving isolated invisible Unicode', () => {
  const isolated = '\u200bA\u200dB\u2063';
  assert.equal(stripFusionMarkerExpressions(`${isolated}${marker(7)}tail`), `${isolated}tail`);
});

test('removes complete marker-only expressions instead of leaving empty formatter logic', () => {
  assert.equal(stripFusionMarkerExpressions(markerSuffix({languageMode: 'uLanguages'})), '');
  assert.equal(stripFusionMarkerExpressions(`{?${markerSuffix({languageMode: 'off'})}?}`), '');
});

test('removes unfamiliar marker-only conditions while retaining isolated invisible characters', () => {
  const isolated = '\u200b\u200d';
  const input = `Before{stream.quality::exists["${marker(41)}"||"${marker(42)}"]}After${isolated}`;
  assert.equal(stripFusionMarkerExpressions(input), `BeforeAfter${isolated}`);
});

test('preserves visible output when a formatter expression also contains a Fusion marker', () => {
  const input = `{stream.quality::exists["Visible${marker(2)}"||""]}`;
  assert.equal(stripFusionMarkerExpressions(input), '{stream.quality::exists["Visible"||""]}');
});

test('cleans both imported fields before retaining the base formatter', () => {
  const payload = markerSuffix({languageMode: 'off'});
  const parsed = parseCustomFormatter({name: `Name${payload}`, description: `Description${marker(3)}`});
  assert.deepEqual(parsed.formatter, {name: 'Name', description: 'Description'});
});

test('appends the complete selected marker payload to description when it fits', () => {
  const base = {name: 'Visible name', description: 'Visible description'};
  const composed = composeCustomFormatter(base, {languageMode: 'uLanguages'});
  assert.equal(composed.name, base.name);
  assert.equal(composed.description, base.description + markerSuffix({languageMode: 'uLanguages'}));
});

test('allocates whole marker expressions across both formatter fields when required', () => {
  const base = {name: 'n'.repeat(2000), description: 'd'.repeat(2000)};
  const composed = composeCustomFormatter(base, {languageMode: 'off', maxLength: 4000});
  assert(composed.name.length > base.name.length);
  assert(composed.description.length > base.description.length);
  assert(composed.name.length <= 4000);
  assert(composed.description.length <= 4000);
  assert.deepEqual(
    [...new Set(markerIdsInText(composed.name + composed.description))].sort((a, b) => a - b),
    Array.from({length: 49}, (_, index) => index),
  );
});

test('reports required and available capacity when both fields cannot hold the markers', () => {
  const base = {name: 'n'.repeat(4900), description: 'd'.repeat(4900)};
  assert.throws(
    () => composeCustomFormatter(base, {languageMode: 'off'}),
    /requires 3,116 marker characters but only 200 are available/i,
  );
});

test('serializes a composed download with only AIOStreams fields and escaped markers', () => {
  const formatter = composeCustomFormatter({name: 'Name', description: 'Description'}, {languageMode: 'off'});
  const json = stringifyExport(formatter);
  assert.deepEqual(Object.keys(JSON.parse(json)), ['name', 'description']);
  assert.match(json, /\\u2063\\u200b/u);
  assert.doesNotMatch(json, /[\u2063\u200b\u200d]/u);
});

test('derives safe fusion download names from local files and URLs', () => {
  assert.equal(customFormatterFileName('Example'), 'Example-fusion.json');
  assert.equal(parseCustomFormatter({name: '', description: ''}, 'https://example.test/path/My Format.json?raw=1').sourceStem, 'My Format');
  assert.equal(parseCustomFormatter({name: '', description: ''}, 'https://example.test/').sourceStem, 'formatter');
  assert.equal(customFormatterFileName('../'), 'formatter-fusion.json');
  assert.equal(customFormatterFileName('report\u202efdp'), 'reportfdp-fusion.json');
  assert.equal(customFormatterFileName('\u200b\u2063'), 'formatter-fusion.json');
  assert.equal(customFormatterFileName('a'.repeat(121)), `${'a'.repeat(120)}-fusion.json`);
});

test('accepts every supplied Tamtaro formatter without removing its isolated Unicode', () => {
  for (const name of tamtaroNames) {
    const fixture = tamtaro(name);
    const parsed = parseCustomFormatter(fixture.value, fixture.file);
    assert.deepEqual(parsed.formatter, fixture.value, name);
    assert.equal(parsed.sourceStem, `tamtaro-3.0.2-${name}`);
  }
});

test('fits the supplied Tamtaro formatters across both fields or reports the real combined limit', () => {
  for (const name of tamtaroNames) {
    const formatter = parseCustomFormatter(tamtaro(name).value).formatter;
    assert.doesNotThrow(() => composeCustomFormatter(formatter, {languageMode: 'off'}), `${name}: hidden`);
    if (name === 'default') {
      assert.throws(() => composeCustomFormatter(formatter, {languageMode: 'uLanguages'}), /only 4,337 are available/i);
    } else {
      assert.doesNotThrow(() => composeCustomFormatter(formatter, {languageMode: 'uLanguages'}), `${name}: preferred`);
    }
  }
});

test('renders custom templates with AIOStreams conditions and modifiers', () => {
  const rendered = renderCustomFormatter(
    {
      name: `{stream.quality::exists["{stream.quality::title}"||"Unknown"]}`,
      description: `{service.cached["⚡ "||"⏳ "]}{stream.filename::replace('.mkv','')}`,
    },
    {
      service: {cached: true},
      stream: {quality: 'Web-Dl', filename: 'Example.Release.mkv'},
    },
  );
  assert.deepEqual(rendered, {name: 'Web-dl', description: '⚡ Example.Release'});
  assert.equal(
    renderCustomFormatter({name: '{stream.filename::base64}', description: ''}, {stream: {filename: 'café'}}).name,
    'Y2Fmw6k=',
  );
});

test('renders stream.year with string modifiers like AIOStreams', () => {
  const rendered = renderCustomFormatter(
    {name: `{stream.year::replace('-20', '-')}`, description: ''},
    formatterContextFor(PREVIEW_CATALOG.silo),
  );
  assert.equal(rendered.name, '2025');
});

test('applies AIOStreams nested conditions, groups, and layout tools', () => {
  const rendered = renderCustomFormatter(
    {
      name: `{stream.quality::exists["{stream.quality::title}"||"Unknown"]}`,
      description: `First{tools.newLine}{?{stream.filename::replace('.mkv','')}?}\n{stream.message::exists["{tools.removeLine}"||"Last"]}`,
    },
    {stream: {quality: 'web-dl', filename: 'Example.mkv', message: 'remove'}},
  );
  assert.deepEqual(rendered, {name: 'Web-dl', description: 'First\nExample'});
});

test('renders every supplied Tamtaro formatter without leaking layout sentinels', () => {
  const context = formatterContextFor(PREVIEW_CATALOG.silo);
  for (const name of tamtaroNames) {
    const rendered = renderCustomFormatter(tamtaro(name).value, context);
    assert(rendered.name.length > 0, name);
    assert(rendered.description.length > 0, name);
    assert.doesNotMatch(rendered.name + rendered.description, /[\u0011\u0012]/u, name);
    assert.doesNotMatch(rendered.name + rendered.description, /\{unknown_propertyName\(/u, name);
  }
});

test('keeps AIOStreams parser diagnostics tolerant instead of rejecting the formatter', () => {
  assert.deepEqual(
    renderCustomFormatter({name: '{unknown.field}', description: 'Visible'}, {}),
    {name: '{invalid_expression(unknown.field)}', description: 'Visible'},
  );
});
