import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-user-spread-learning-v1.js', import.meta.url), 'utf8');
const values = new Map();
const localStorage = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); }
};
const casebook = {
  formatForPrompt(question) { return `STATIC CASEBOOK: ${question}`; },
  find() { return []; },
  familyCount: 1,
  utteranceCount: 1
};
const window = {LUNEA_QUESTION_CASEBOOK_V1: casebook, addEventListener() {}};
window.window = window;

vm.runInNewContext(source, {
  window,
  localStorage,
  document: {readyState:'complete', addEventListener() {}, getElementById() { return null; }},
  console: {info() {}, warn() {}, error() {}},
  setInterval() { return 0; },
  clearInterval() {},
  setTimeout(fn) { fn(); return 0; },
  requestAnimationFrame(fn) { fn(); },
  MutationObserver: class { observe() {} },
  Date,
  Math,
  Set,
  JSON
});

const learning = window.LUNEA_SPREAD_LEARNING_V1;
assert.ok(learning, 'learning API should be exposed');

const manual = learning.recordManual({
  question:'같은 상대에게 지금 답장할지 내일 답장할지 비교',
  spreadTitle:'답장 시점 비교',
  positions:['지금 답장 반응','내일 답장 반응','후속 흐름 차이'],
  axes:['지금','내일']
});
assert.equal(manual.saved, true);

const bridged = casebook.formatForPrompt('같은 상대에게 바로 답장하는 경우와 하루 뒤 답장하는 경우 비교', 4);
assert.match(bridged, /최우선 · 이 사용자가 직접 고친 과거 정답/);
assert.match(bridged, /답장 시점 비교/);
assert.match(bridged, /지금 답장 반응/);
assert.match(bridged, /STATIC CASEBOOK:/, 'static casebook must remain after learned corrections');

console.log('spread-learning bridge tests: PASS');
