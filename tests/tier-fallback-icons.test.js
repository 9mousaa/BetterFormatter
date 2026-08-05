const assert = require('assert');
const fs = require('fs');
const path = require('path');

const PRESETS = path.join(__dirname, '..', 'presets');
const FALLBACKS = {
  'q-rmx-u': {name: 'Remux', image: 'mono-remux.png'},
  'q-blu-u': {name: 'BluRay', image: 'mono-bluray.png'},
  'q-web-u': {name: 'Web', image: 'mono-webdl.png'},
};
const NEUTRAL_STYLE = {
  borderColor: '#FF858283',
  tagColor: '#33FFFFFF',
  tagStyle: 'filled and bordered',
  textColor: '#FFFFFF',
};

const tierPresets = fs.readdirSync(PRESETS)
  .filter(name => /^(?:colored|mono)-tier-.*\.json$/.test(name))
  .sort();

assert.strictEqual(tierPresets.length, 16, 'expected every Tier preset variant');

for (const presetName of tierPresets) {
  const preset = JSON.parse(fs.readFileSync(path.join(PRESETS, presetName), 'utf8'));
  const fallbacks = preset.filters.filter(filter => FALLBACKS[filter.id]);

  assert.strictEqual(fallbacks.length, 3, `${presetName}: expected three fallbacks`);

  for (const fallback of fallbacks) {
    const expected = FALLBACKS[fallback.id];
    assert.strictEqual(fallback.name, expected.name, `${presetName}: ${fallback.id} name`);
    assert(fallback.pattern.length > 0, `${presetName}: ${fallback.id} pattern`);
    assert(
      fallback.imageURL.endsWith(`/${expected.image}`),
      `${presetName}: ${fallback.id} should use ${expected.image}`,
    );
    assert.deepStrictEqual(
      {
        borderColor: fallback.borderColor,
        tagColor: fallback.tagColor,
        tagStyle: fallback.tagStyle,
        textColor: fallback.textColor,
      },
      NEUTRAL_STYLE,
      `${presetName}: ${fallback.id} style`,
    );
  }
}

console.log('PASS all Tier fallback filters use neutral styling with mono icons');
