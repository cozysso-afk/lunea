import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-reading-boundary-reset-v31.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');

function classList(initial = []) {
  const set = new Set(initial);
  return {
    add(...xs) { xs.forEach(x => set.add(x)); },
    remove(...xs) { xs.forEach(x => set.delete(x)); },
    contains(x) { return set.has(x); }
  };
}

function node(id) {
  return {
    id,
    removed: false,
    textContent: '',
    children: [1, 2],
    classList: classList(['show', 'flipped']),
    remove() { this.removed = true; },
    replaceChildren() { this.children = []; },
    closest() { return null; }
  };
}

const ids = new Map();
for (const id of [
  'luneaTimingInline', 'luneaTimingABInline', 'luneaTimingABCards',
  'luneaTimingABPanel', 'luneaTimingABAI', 'timingFlip', 'timingInner',
  'timingResult', 'timingActions', 'timingAIText', 'spreadQuestion'
]) ids.set(id, node(id));
ids.get('timingAIText').textContent = '이전 질문 AI 시기 해석';
ids.get('luneaTimingABAI').textContent = '이전 A/B 시기 해석';
ids.get('spreadQuestion').textContent = '“이전 질문”';

let observedQuestionCallback = null;
class MutationObserver {
  constructor(cb) { this.cb = cb; }
  observe(target) {
    if (target === ids.get('spreadQuestion')) observedQuestionCallback = this.cb;
  }
  disconnect() {}
}

const document = {
  readyState: 'complete',
  documentElement: { dataset: {} },
  getElementById(id) { return ids.get(id) || null; },
  addEventListener() {},
};

let starts = 0;
const window = {
  LUNEA_TIMING_AB_LAST: {A:{id:'LT-001'}, B:{id:'LT-002'}},
  startSpread() { starts += 1; return 'started'; }
};
window.window = window;

vm.runInNewContext(source, {
  window,
  document,
  MutationObserver,
  console,
  setInterval() { return 1; },
  clearInterval() {},
  requestAnimationFrame(cb) { cb(); return 1; },
  queueMicrotask(cb) { cb(); },
  String,
  RegExp,
  Set,
  Map,
  Object,
  Array,
});

assert.equal(window.LUNEA_READING_BOUNDARY_V31?.version, 31, 'V31 reset API missing');
assert.equal(typeof window.startSpread, 'function');
assert.equal(window.startSpread.__luneaReadingBoundaryV31, true, 'startSpread boundary wrapper missing');

const out = window.startSpread('새 질문');
assert.equal(out, 'started');
assert.equal(starts, 1, 'base startSpread must still run exactly once');
assert.equal(ids.get('luneaTimingInline').removed, true, 'stale single Timing inline must be removed');
assert.equal(ids.get('luneaTimingABInline').removed, true, 'stale A/B Timing inline must be removed');
assert.deepEqual(ids.get('luneaTimingABCards').children, [], 'A/B source cards must be cleared so V16 cannot resurrect them');
assert.equal(window.LUNEA_TIMING_AB_LAST, null, 'A/B memory source must be cleared');
assert.equal(ids.get('timingInner').classList.contains('flipped'), false, 'hidden Timing card must be unflipped');
assert.equal(ids.get('timingResult').classList.contains('show'), false, 'old Timing result must be hidden');
assert.equal(ids.get('timingActions').classList.contains('show'), false, 'old Timing actions must be hidden');
assert.equal(ids.get('timingAIText').textContent, '', 'old Timing AI text must be cleared');
assert.equal(ids.get('luneaTimingABAI').textContent, '', 'old A/B Timing AI text must be cleared');

// Regression fallback: even if a legacy path bypasses the wrapped startSpread,
// changing the displayed tarot question must clear a stale inline result.
ids.get('luneaTimingInline').removed = false;
ids.get('luneaTimingABInline').removed = false;
ids.get('luneaTimingABCards').children = [1];
window.LUNEA_TIMING_AB_LAST = {A:{id:'LT-003'}};
ids.get('spreadQuestion').textContent = '“완전히 다른 새 질문”';
assert.equal(typeof observedQuestionCallback, 'function', 'spread question observer missing');
observedQuestionCallback();
assert.equal(ids.get('luneaTimingInline').removed, true, 'question boundary must remove stale single Timing inline');
assert.equal(ids.get('luneaTimingABInline').removed, true, 'question boundary must remove stale A/B Timing inline');
assert.deepEqual(ids.get('luneaTimingABCards').children, [], 'question boundary must clear A/B source cards');
assert.equal(window.LUNEA_TIMING_AB_LAST, null, 'question boundary must clear A/B memory');

const matches = loader.match(/lunea-reading-boundary-reset-v31\.js\?v=3101/g) || [];
assert.equal(matches.length, 2, 'V31 boundary reset must load in parsing and sequential loader paths');
const lastGeneral = loader.lastIndexOf('lunea-general-order-v30-5.js?v=3005');
const lastBoundary = loader.lastIndexOf('lunea-reading-boundary-reset-v31.js?v=3101');
const lastReveal = loader.lastIndexOf('lunea-boot-reveal-v29.js?v=2902');
assert.ok(lastBoundary > lastGeneral, 'V31 boundary reset must load after final spread wrappers/order patches');
assert.ok(lastReveal > lastBoundary, 'V31 boundary reset must be installed before boot reveal');

console.log('Timing Oracle reading-boundary V31 regression tests: PASS');
