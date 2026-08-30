import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-user-spread-learning-v1.js', import.meta.url), 'utf8');
const KEY = 'LUNEA_SPREAD_CORRECTION_MEMORY_V1';
const values = new Map();
const localStorage = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); }
};

const seeded = Array.from({length:1005}, (_, i) => ({
  id:`seed_${i}`,
  question:`기존 학습 질문 ${i}`,
  questionKey:`기존학습질문${i}`,
  spreadTitle:'기존 배열',
  positions:['축 1','축 2'],
  requestedAxes:[],
  source:'manual',
  createdAt:1000+i,
  updatedAt:1000+i
}));
localStorage.setItem(KEY, JSON.stringify(seeded));

const window = {addEventListener() {}};
window.window = window;
vm.runInNewContext(source, {
  window,
  localStorage,
  document: {readyState:'loading', addEventListener() {}, getElementById() { return null; }},
  console: {info() {}, warn() {}, error() {}},
  setInterval() { return 0; },
  clearInterval() {},
  setTimeout() { return 0; },
  requestAnimationFrame(fn) { fn(); },
  MutationObserver: class { observe() {} },
  Date,
  Math,
  Set,
  JSON
});

const learning = window.LUNEA_SPREAD_LEARNING_V1;
assert.equal(learning.max, 1000);
const saved = learning.recordManual({
  question:'새로 확정한 수동 배열',
  spreadTitle:'새 배열',
  positions:['현재','장벽','행동','결과']
});
assert.equal(saved.saved, true);
assert.equal(learning.count(), 1000, 'a write must compact oversized memory to the newest 1000 rows');
assert.equal(learning.list()[0].question, '새로 확정한 수동 배열');
assert.ok(!learning.list().some(row => row.questionKey === '기존학습질문1004'), 'old overflow tail should be discarded after compaction');

console.log('spread-learning retention tests: PASS');
