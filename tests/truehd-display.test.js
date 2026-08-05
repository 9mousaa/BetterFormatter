const assert = require('assert');
const {execFileSync} = require('child_process');
const {createHash} = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PRESETS = path.join(ROOT, 'presets');
const DOLBY_IDS = new Set([
  'a-at-dv',
  'a-at',
  'a-th-dv',
  'a-th',
  'a-th-at',
  'a-dp-dv',
  'a-dp',
  'a-dd-dv',
  'a-dd',
  'a-dv',
]);
const LEGACY_SHA256 = {
  'colored-bgb-combo-always.json': 'b3f4db55123305acfc6fb5ac87a5616dd8504c0426eb634850a8af94d2c6f989',
  'colored-bgb-combo-nodv.json': 'a41a46ee20db110e62014db479d6b574bd9688b0cf2d9f2686bea762a24e98fe',
  'colored-bgb-sep-always.json': '183f87f504b661c599f782af9173d5da8323cf51f24552b8e5d61363f46db7d3',
  'colored-bgb-sep-nodv.json': '8e527175b65773bd4e0b816440238089904d1a2cea6beb9082f2eff2698e597c',
  'colored-pct-combo-always.json': 'b63e87d0163b57816b30833a7b26e4e16b9dd0572d2bb09aa6a9928b2afe3eb7',
  'colored-pct-combo-nodv.json': '1983b4141cf92f9a0ee879bf5b891c489d79ca414b3e2f350bb076f95e2517f5',
  'colored-pct-sep-always.json': '698c2496f2e1a0c8a1fe19e609ee930a754e6ff7d1fd51248319598f4873657b',
  'colored-pct-sep-nodv.json': '96a8df3e2f7527982e296325cabf9c9652854765d698323c035dd16d40bb8999',
  'colored-src-combo-always.json': '2c73f1a8f976336ba3ba4e8d078dafcdac08ecaf56f7a214a5f483d0ea2ac345',
  'colored-src-combo-nodv.json': '57397ed49bbf5e80d5d360802055033c460f06bc9f279d095c10b97754d41691',
  'colored-src-sep-always.json': 'd7d5afcd5d827b6a9cb1ae2cdd42876dd0818a23826358ae8e5c457aab2eff4e',
  'colored-src-sep-nodv.json': '3e5d6aaadbf1c9b258641558846225d2ad3277319f32e6d06b39f7b824180b56',
  'colored-tier-combo-always.json': '2bc531a5648b0b7801a911ba80519fc2009c4764e896c73d27cc201daa145f83',
  'colored-tier-combo-nodv.json': 'e57b3bb331e886b083369f1c56802d70d8871f191f52b7511de7a7332deda50f',
  'colored-tier-sep-always.json': '24eaa8af90da9880b4847f6d35be3502cf943cef83e89da26e13320e730b7f12',
  'colored-tier-sep-nodv.json': '0b2bedb8ab0417d9f92c5825538a876943089dd4bb5d1435926ae67e8db292a8',
  'mono-bgb-combo-always.json': '9e1172e596604a4407bca42ce405eeebf06053eac5a3a5fa707fe57802ef7562',
  'mono-bgb-combo-nodv.json': 'b1fd57b245cbc3fcd0c30ff9f9ba6ec52812eab038ff4145d3c74a348246ca09',
  'mono-bgb-sep-always.json': 'd0e5d2c6b72ee491cce037b79dd9bf117a2d666f5ae532c2564c12ba34669776',
  'mono-bgb-sep-nodv.json': 'f83ab1521e8cedc3da23142860c8f339df3b6c6514526b5bcbd3037bed693546',
  'mono-pct-combo-always.json': '0a4b1c5b28f7b8b0d63874802bed1a74460c7b89da85a9fadaedafe9a3ef470a',
  'mono-pct-combo-nodv.json': 'da6742ea28d0674f5cf1ff699a0cff53cb4c6c97145f493b2ce35f90476596d1',
  'mono-pct-sep-always.json': 'a4f896e833a67b4fc00cd109e18082788a428674f336c2a4bc4589598fb48fca',
  'mono-pct-sep-nodv.json': '7224f66a76fb7997bf4b91747c61475071c326ae2f2356701f419762d37ac103',
  'mono-src-combo-always.json': 'cdffa1d22213f93ccf3ee9d384ad57c0f95ba9370ba868f63598399dc43a2c35',
  'mono-src-combo-nodv.json': '9177d75d5d74b2dcb3f8183c66e28cae230a7fc8a06b7f2eb54d42cda64af966',
  'mono-src-sep-always.json': '321fe39d3a0ee7de353d5eabac1df31f0e80158f04d57cf42cb2d653c12f3512',
  'mono-src-sep-nodv.json': '0ee5e8f77a0d9ac8b501f91054766034d0c46777a3ce9ee5076bfb1bdeea41e1',
  'mono-tier-combo-always.json': 'f0f6c273261219ff486ecaf79b2f7d847c6f27e49b743f1874ca59e4cec425a7',
  'mono-tier-combo-nodv.json': '10fd3fc7f09dfc8f19e1bc99b24ff472d24066a36e86186ede39be49fdb6b76a',
  'mono-tier-sep-always.json': '9a6bc01102467ff4604dcedaf9cbdfcfbf756ba2551ab1118acd041ee8449604',
  'mono-tier-sep-nodv.json': '377f349421b0c9600f2f6dcebec8a51e31bf7e112cd6d87f4a0d64c5d32c7f53',
};

function generate() {
  execFileSync(process.execPath, ['build.js'], {cwd: ROOT, stdio: 'pipe'});
}

function presetFiles() {
  return fs.readdirSync(PRESETS).filter(name => name.endsWith('.json')).sort();
}

function snapshotPresets() {
  return Object.fromEntries(
    presetFiles().map(name => [name, fs.readFileSync(path.join(PRESETS, name), 'utf8')]),
  );
}

function readPreset(name) {
  return JSON.parse(fs.readFileSync(path.join(PRESETS, name), 'utf8'));
}

function presetSha256(name) {
  return createHash('sha256')
    .update(fs.readFileSync(path.join(PRESETS, name)))
    .digest('hex');
}

function matches(pattern, filename) {
  let source = pattern;
  let flags = '';
  if (source.startsWith('(?i)')) {
    source = source.slice(4);
    flags = 'i';
  }
  return new RegExp(source, flags).test(filename);
}

function matchingDolbyIds(preset, filename) {
  return preset.filters
    .filter(filter => DOLBY_IDS.has(filter.id) && matches(filter.pattern, filename))
    .map(filter => filter.id);
}

const filenames = {
  dvAtmosTruehd: 'Movie.2160p.DV.TrueHD.7.1.Atmos.mkv',
  atmosTruehd: 'Movie.2160p.TrueHD.7.1.Atmos.mkv',
  dvTruehd: 'Movie.2160p.DV.TrueHD.7.1.mkv',
  truehd: 'Movie.2160p.TrueHD.7.1.mkv',
  dvAtmos: 'Movie.2160p.DV.DDP5.1.Atmos.mkv',
  atmos: 'Movie.2160p.DDP5.1.Atmos.mkv',
  dv: 'Movie.2160p.DV.DTS-HD.MA.7.1.mkv',
};

const matrix = [
  {
    preset: 'colored-bgb-combo-nodv.json',
    expected: {
      dvAtmosTruehd: ['a-at-dv'],
      atmosTruehd: ['a-at'],
      dvTruehd: ['a-th-dv'],
      truehd: ['a-th'],
      dvAtmos: ['a-at-dv'],
      atmos: ['a-at'],
      dv: ['a-dv'],
    },
  },
  {
    preset: 'colored-bgb-combo-nodv-truehd-always.json',
    expected: {
      dvAtmosTruehd: ['a-at-dv', 'a-th-at'],
      atmosTruehd: ['a-at', 'a-th-at'],
      dvTruehd: ['a-th-dv'],
      truehd: ['a-th'],
      dvAtmos: ['a-at-dv'],
      atmos: ['a-at'],
      dv: ['a-dv'],
    },
  },
  {
    preset: 'colored-bgb-sep-nodv.json',
    expected: {
      dvAtmosTruehd: ['a-dv', 'a-at'],
      atmosTruehd: ['a-at'],
      dvTruehd: ['a-dv', 'a-th'],
      truehd: ['a-th'],
      dvAtmos: ['a-dv', 'a-at'],
      atmos: ['a-at'],
      dv: ['a-dv'],
    },
  },
  {
    preset: 'colored-bgb-sep-nodv-truehd-always.json',
    expected: {
      dvAtmosTruehd: ['a-dv', 'a-at', 'a-th-at'],
      atmosTruehd: ['a-at', 'a-th-at'],
      dvTruehd: ['a-dv', 'a-th'],
      truehd: ['a-th'],
      dvAtmos: ['a-dv', 'a-at'],
      atmos: ['a-at'],
      dv: ['a-dv'],
    },
  },
];

const tests = [];
function test(name, fn) {
  tests.push({name, fn});
}

test('generates 32 backward-compatible defaults and 32 TrueHD Always variants', () => {
  const files = presetFiles();
  const always = files.filter(name => name.endsWith('-truehd-always.json'));
  const defaults = files.filter(name => !name.endsWith('-truehd-always.json'));

  assert.strictEqual(files.length, 64);
  assert.strictEqual(defaults.length, 32);
  assert.strictEqual(always.length, 32);
  assert(defaults.includes('colored-bgb-combo-nodv.json'));
});

test('places TrueHD Display before HDR Display in the configurator', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const truehdPosition = html.indexOf('<div class="sec"><h2>TrueHD Display</h2>');
  const hdrPosition = html.indexOf('<div class="sec"><h2>HDR Display</h2>');

  assert.notStrictEqual(truehdPosition, -1);
  assert.notStrictEqual(hdrPosition, -1);
  assert(truehdPosition < hdrPosition, 'TrueHD Display should appear before HDR Display');
});

test('keeps all legacy presets byte-for-byte compatible', () => {
  assert.deepStrictEqual(
    Object.keys(LEGACY_SHA256).sort(),
    presetFiles().filter(name => !name.endsWith('-truehd-always.json')),
  );
  for (const [name, expectedHash] of Object.entries(LEGACY_SHA256)) {
    assert.strictEqual(presetSha256(name), expectedHash, name);
  }
});

test('adds one mutually exclusive Atmos+TrueHD filter only to Always presets', () => {
  for (const name of presetFiles()) {
    const filters = readPreset(name).filters.filter(filter => filter.id === 'a-th-at');
    if (name.endsWith('-truehd-always.json')) {
      assert.strictEqual(filters.length, 1, name);
      assert.strictEqual(filters[0].name, 'TrueHD', name);
      assert(filters[0].imageURL.endsWith('/truehd.png'), name);
      assert.strictEqual(
        filters[0].pattern,
        '(?i)^(?=.*\\btrue[\\s._-]?hd\\b)(?=.*\\batmos\\b)',
        name,
      );
    } else {
      assert.strictEqual(filters.length, 0, name);
    }
  }
});

test('changes Always presets only by adding the Atmos+TrueHD filter', () => {
  const alwaysFiles = presetFiles().filter(name => name.endsWith('-truehd-always.json'));
  for (const alwaysName of alwaysFiles) {
    const legacyName = alwaysName.replace('-truehd-always.json', '.json');
    const alwaysPreset = readPreset(alwaysName);
    const withoutTruehdAlways = {
      ...alwaysPreset,
      filters: alwaysPreset.filters.filter(filter => filter.id !== 'a-th-at'),
    };
    assert.deepStrictEqual(withoutTruehdAlways, readPreset(legacyName), alwaysName);
  }
});

test('matches the approved Dolby and TrueHD badge matrix', () => {
  for (const {preset: presetName, expected} of matrix) {
    const preset = readPreset(presetName);
    for (const [scenario, expectedIds] of Object.entries(expected)) {
      assert.deepStrictEqual(
        matchingDolbyIds(preset, filenames[scenario]),
        expectedIds,
        `${presetName}: ${scenario}`,
      );
    }
  }
});

test('generates presets deterministically', () => {
  const first = snapshotPresets();
  generate();
  const second = snapshotPresets();
  assert.deepStrictEqual(second, first);
});

generate();

let failures = 0;
for (const {name, fn} of tests) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${name}`);
    console.error(error.stack);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`PASS ${tests.length} tests`);
}
