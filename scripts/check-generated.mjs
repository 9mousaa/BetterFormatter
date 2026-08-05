import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const {buildExports} = require('../build.js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'betterformatter-drift-'));

function filesBelow(directory) {
  return fs.readdirSync(directory, {recursive: true, withFileTypes: true})
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .map((entry) => path.relative(directory, entry))
    .sort();
}

try {
  await buildExports({outputRoot: temporary});
  const committedRoot = path.join(root, 'exports');
  const generatedRoot = path.join(temporary, 'exports');
  const committedFiles = filesBelow(committedRoot);
  const generatedFiles = filesBelow(generatedRoot);
  assert.deepEqual(generatedFiles, committedFiles, 'generated export file list drifted');
  for (const relativePath of committedFiles) {
    assert.equal(
      fs.readFileSync(path.join(generatedRoot, relativePath), 'utf8'),
      fs.readFileSync(path.join(committedRoot, relativePath), 'utf8'),
      `${relativePath} drifted from build.js`,
    );
  }
  console.log(`Verified ${committedFiles.length} deterministic generated exports.`);
} finally {
  fs.rmSync(temporary, {recursive: true, force: true});
}
