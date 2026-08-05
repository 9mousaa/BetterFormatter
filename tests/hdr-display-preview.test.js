const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements = new Map();

function element(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      classList: {add() {}, remove() {}},
      innerHTML: '',
      querySelectorAll() { return []; },
      style: {},
      textContent: '',
      value: '',
    });
  }
  return elements.get(id);
}

const context = vm.createContext({
  console,
  document: {
    getElementById: element,
    querySelectorAll() { return []; },
  },
  navigator: {clipboard: {writeText() { return Promise.resolve(); }}},
  setTimeout,
});

vm.runInContext(script, context);

function hdr10BadgeCount(mode) {
  vm.runInContext(`C.hdr='${mode}';preview()`, context);
  return (element('pv').innerHTML.match(/HDR10\.png/g) || []).length;
}

assert.strictEqual(hdr10BadgeCount('nodv'), 1, 'Only when no DV should hide hybrid HDR');
assert.strictEqual(hdr10BadgeCount('always'), 2, 'Always should show hybrid HDR');
console.log('PASS HDR Display toggle changes the hybrid preview');
