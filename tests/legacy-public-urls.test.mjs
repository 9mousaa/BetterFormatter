import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(
  path.join(projectRoot, 'tests/fixtures/legacy-public-paths.json'),
  'utf8',
));
const legacyPathSet = new Set(manifest);
const repositoryPrefix = '/9mousaa/BetterFormatter/main/';
const representativeHashes = new Map([
  ['fusion-tags.json', 'aea6eeda1c148e7bc95c841a928617f4d16e31b317f0f6032b81c5dc7994372e'],
  ['presets/colored-bgb-combo-always.json', 'b3f4db55123305acfc6fb5ac87a5616dd8504c0426eb634850a8af94d2c6f989'],
  ['images/truehd.png', '0f0079641955f791ce7eb2115bd38a13d1971348764963f4f83d2146c1b54d67'],
]);

function nestedImageUrls(value, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) nestedImageUrls(item, found);
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key === 'imageURL' && typeof item === 'string' && item) found.push(item);
      else nestedImageUrls(item, found);
    }
  }
  return found;
}

test('retains every public JSON and image path from before PR #3', () => {
  assert.equal(manifest.length, 143);
  for (const relativePath of manifest) {
    assert.equal(fs.existsSync(path.join(projectRoot, relativePath)), true, relativePath);
  }
});

test('keeps representative legacy payloads byte-identical', () => {
  for (const [relativePath, expected] of representativeHashes) {
    const actual = crypto.createHash('sha256')
      .update(fs.readFileSync(path.join(projectRoot, relativePath)))
      .digest('hex');
    assert.equal(actual, expected, relativePath);
  }
});

test('parses legacy JSON and retains every referenced image that existed before PR #3', () => {
  for (const relativePath of manifest.filter((entry) => entry.endsWith('.json'))) {
    const document = JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), 'utf8'));
    for (const imageUrl of nestedImageUrls(document)) {
      const url = new URL(imageUrl);
      if (url.hostname !== 'raw.githubusercontent.com' || !url.pathname.startsWith(repositoryPrefix)) continue;
      const localPath = url.pathname.slice(repositoryPrefix.length);
      if (!legacyPathSet.has(localPath)) continue;
      assert.equal(fs.existsSync(path.join(projectRoot, localPath)), true, `${relativePath}: ${localPath}`);
    }
  }
});
