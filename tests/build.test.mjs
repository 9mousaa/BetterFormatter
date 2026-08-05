import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import buildModule from '../build.js';

const {buildExports} = buildModule;

test('writes the complete escaped export matrix to a selected output root', async (context) => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'betterformatter-build-'));
  context.after(() => fs.rmSync(outputRoot, {recursive: true, force: true}));

  const result = await buildExports({outputRoot, assetBase: 'http://192.0.2.1:4173/assets/badges/'});
  assert.deepEqual(result, {fusion: 1200, aiostreams: 15});

  const jsonFiles = fs.readdirSync(path.join(outputRoot, 'exports'), {recursive: true})
    .filter((entry) => entry.endsWith('.json'));
  assert.equal(jsonFiles.length, 1215);

  const fusionPath = path.join(outputRoot, 'exports/fusion/modern/quality-badges/languages-hidden/detailed/split/always-show/colored-atmos-priority-dv-separate.json');
  const legacyPath = path.join(outputRoot, 'exports/fusion/legacy/quality-badges/languages-hidden/detailed/split/always-show/mono-audio-separate-dv-separate.json');
  const formatterPath = path.join(outputRoot, 'exports/aiostreams/renoria/preferred-only.json');
  const fusionRaw = fs.readFileSync(fusionPath, 'utf8');
  const legacyRaw = fs.readFileSync(legacyPath, 'utf8');
  const formatterRaw = fs.readFileSync(formatterPath, 'utf8');
  assert.match(fusionRaw, /\\u2063/);
  assert.match(formatterRaw, /\\u200b/);
  assert.equal(fusionRaw.includes('\u2063'), false);
  assert.equal(formatterRaw.includes('\u200b'), false);
  assert.match(fusionRaw, /http:\/\/192\.0\.2\.1:4173\/assets\/badges\/modern\//);
  assert.match(legacyRaw, /http:\/\/192\.0\.2\.1:4173\/assets\/badges\/legacy\//);
  assert.doesNotThrow(() => JSON.parse(fusionRaw));
  const legacyExport = JSON.parse(legacyRaw);
  assert(legacyExport.filters.every((filter) => (
    filter.borderColor === '#2EFFFFFF'
    && filter.tagColor === '#22000000'
    && filter.textColor === '#FFFFFF'
    && filter.tagStyle === 'filled and bordered'
  )));
  assert.deepEqual(
    Object.fromEntries(legacyExport.groups.map(({id, color}) => [id, color])),
    {gq: '#96CEB4', gr: '#4ECDC4', gv: '#FF6B6B', ga: '#45B7D1', gc: '#FFD700'},
  );
  assert.doesNotThrow(() => JSON.parse(formatterRaw));
});
