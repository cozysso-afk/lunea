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

const historicalQuestion = '같은 상대에게 지금 답장할지 내일 답장할지 비교';
const historicalTitle = '답장 시점 비교';
const historicalPosition = '지금 답장 반응';
const manual = learning.recordManual({
  question:historicalQuestion,
  spreadTitle:historicalTitle,
  positions:[historicalPosition,'내일 답장 반응','후속 흐름 차이'],
  axes:['지금','내일']
});
assert.equal(manual.saved, true);

const bridged = casebook.formatForPrompt('같은 상대에게 바로 답장하는 경우와 하루 뒤 답장하는 경우 비교', 4);
assert.match(bridged, /\[사용자가 확정한 과거 구조 참고\]/, 'learned guidance must be framed as structure-only reference');
assert.match(bridged, /질문 구조:/, 'learned guidance must expose the structural profile');
assert.match(bridged, /참고 가능한 요구축:\s*지금\s*\/\s*내일/, 'only reusable requested axes should be exposed');
assert.doesNotMatch(bridged, new RegExp(historicalQuestion), 'raw historical question must not leak into preflight guidance');
assert.doesNotMatch(bridged, new RegExp(historicalTitle), 'historical spread title must not leak into preflight guidance');
assert.doesNotMatch(bridged, new RegExp(historicalPosition), 'historical final positions must not leak into preflight guidance');
assert.match(bridged, /STATIC CASEBOOK:/, 'static casebook must remain after learned structural guidance');

console.log('spread-learning bridge tests: PASS');
