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
    attrs: {},
    onclick: null,
    remove() { this.removed = true; },
    replaceChildren() { this.children = []; },
    setAttribute(k, v) { this.attrs[k] = v; },
    closest(selector) { return selector === 'button' ? this : null; }
  };
}

const ids = new Map();
for (const id of [
  'luneaTimingInline', 'luneaTimingABInline', 'luneaTimingABCards',
  'luneaTimingABPanel', 'luneaTimingABAI', 'timingFlip', 'timingInner',
  'timingResult', 'timingActions', 'timingAIText', 'spreadQuestion',
  'timingSupportBtn', 'timingOverlay', 'drawBtn', 'dailyBtn',
  'luneaDraftRestore', 'retry'
]) ids.set(id, node(id));

ids.get('timingAIText').textContent = '이전 질문 AI 시기 해석';
ids.get('luneaTimingABAI').textContent = '이전 A/B 시기 해석';
ids.get('spreadQuestion').textContent = '“이전 질문”';
ids.get('timingSupportBtn').textContent = '⌛ 오늘 밤';

let observedQuestionCallback = null;
let captureClick = null;
class MutationObserver {
  constructor(cb) { this.cb = cb; }
  observe(target) {
    if (target === ids.get('spreadQuestion')) observedQuestionCallback = this.cb;
  }
  disconnect() {}
}

const body = { classList: classList(['modal-open']) };
const document = {
  readyState: 'complete',
  documentElement: { dataset: {} },
  body,
  getElementById(id) { return ids.get(id) || null; },
  querySelector(selector) {
    if (selector === '.overlay.show' && ids.get('timingOverlay').classList.contains('show')) return ids.get('timingOverlay');
    return null;
  },
  addEventListener(type, cb, capture) {
    if (type === 'click' && capture) captureClick = cb;
  },
};

let internalTiming = { primary: 'LT-004', refine: 'LT-010', ai: 'old' };
ids.get('timingSupportBtn').onclick = () => {
  internalTiming = { primary: null, refine: null, ai: '' };
  ids.get('timingOverlay').classList.add('show');
};

let starts = 0;
const window = {
  LUNEA_TIMING_AB_LAST: {A:{id:'LT-001'}, B:{id:'LT-002'}},
  startSpread() { starts += 1; return 'started'; }
};
window.window = window;
const state = { __luneaManualMode: false };

vm.runInNewContext(source, {
  window,
  document,
  state,
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

assert.equal(window.LUNEA_READING_BOUNDARY_V31?.version, 31.1, 'V31.1 reset API missing');
assert.equal(typeof window.startSpread, 'function');
assert.equal(window.startSpread.__luneaReadingBoundaryV31, true, 'startSpread boundary wrapper missing');

const out = window.startSpread('새 질문');
assert.equal(out, 'started');
assert.equal(starts, 1, 'base startSpread must still run exactly once');
assert.equal(internalTiming.primary, null, 'single Timing closure state must be cleared on startSpread');
assert.equal(ids.get('luneaTimingInline').removed, true, 'stale single Timing inline must be removed');
assert.equal(ids.get('luneaTimingABInline').removed, true, 'stale A/B Timing inline must be removed');
assert.deepEqual(ids.get('luneaTimingABCards').children, [], 'A/B source cards must be cleared so V16 cannot resurrect them');
assert.equal(window.LUNEA_TIMING_AB_LAST, null, 'A/B memory source must be cleared');
assert.equal(ids.get('timingInner').classList.contains('flipped'), false, 'hidden Timing card must be unflipped');
assert.equal(ids.get('timingResult').classList.contains('show'), false, 'old Timing result must be hidden');
assert.equal(ids.get('timingActions').classList.contains('show'), false, 'old Timing actions must be hidden');
assert.equal(ids.get('timingAIText').textContent, '', 'old Timing AI text must be cleared');
assert.equal(ids.get('luneaTimingABAI').textContent, '', 'old A/B Timing AI text must be cleared');
assert.equal(ids.get('timingSupportBtn').textContent, '◐ 시기 오라클', 'old Timing card label must not survive on support button');
assert.equal(ids.get('timingOverlay').classList.contains('show'), false, 'closure-reset bridge must not leave Timing overlay open');

function seedStaleTiming(label='⌛ 오늘 밤') {
  ids.get('luneaTimingInline').removed = false;
  ids.get('luneaTimingABInline').removed = false;
  ids.get('luneaTimingABCards').children = [1, 2];
  ids.get('timingSupportBtn').textContent = label;
  internalTiming = { primary: 'LT-004', refine: 'LT-010', ai: 'old' };
  window.LUNEA_TIMING_AB_LAST = {A:{id:'LT-003'}, B:{id:'LT-005'}};
}

function click(id) {
  assert.equal(typeof captureClick, 'function', 'capture click safety net missing');
  captureClick({target: ids.get(id)});
}

// Manual <=12 and Manual 13-20 both own drawBtn and render cards directly.
// The question can be identical to the previous reading, so text-change fallback
// alone is insufficient. Manual draw entry must clear both UI + closure state.
seedStaleTiming();
state.__luneaManualMode = true;
click('drawBtn');
assert.equal(internalTiming.primary, null, 'manual direct draw must clear single Timing closure state');
assert.equal(ids.get('luneaTimingInline').removed, true, 'manual direct draw must clear single Timing UI');
assert.equal(window.LUNEA_TIMING_AB_LAST, null, 'manual direct draw must clear A/B Timing memory');
assert.equal(ids.get('timingSupportBtn').textContent, '◐ 시기 오라클', 'manual direct draw must reset old Timing label');

// Fixed/AI drawBtn flows already go through startSpread. Do not clear merely on
// drawBtn capture while AI preview is still cancellable.
seedStaleTiming('⌛ 다음 주');
state.__luneaManualMode = false;
click('drawBtn');
assert.equal(internalTiming.primary, 'LT-004', 'non-manual drawBtn capture must wait for startSpread');
assert.equal(ids.get('luneaTimingInline').removed, false, 'non-manual preview click must not clear current Timing early');
window.startSpread('AI 확정 질문');
assert.equal(internalTiming.primary, null, 'AI/fixed confirmed startSpread must clear Timing state');
assert.equal(ids.get('luneaTimingInline').removed, true, 'AI/fixed confirmed startSpread must clear Timing UI');

// DAILY same-day restore renders saved cards directly without startSpread.
seedStaleTiming();
click('dailyBtn');
assert.equal(internalTiming.primary, null, 'Daily restore entry must clear single Timing closure state');
assert.equal(ids.get('luneaTimingInline').removed, true, 'Daily restore entry must clear stale Timing UI');

// Last-reading recovery also restores DOM directly.
seedStaleTiming();
click('luneaDraftRestore');
assert.equal(internalTiming.primary, null, 'Draft restore entry must clear single Timing closure state');
assert.equal(ids.get('luneaTimingABInline').removed, true, 'Draft restore entry must clear stale A/B Timing UI');

// Manual Retry bypasses startSpread and redraws with the exact same question.
seedStaleTiming();
click('retry');
assert.equal(internalTiming.primary, null, 'Retry entry must clear single Timing closure state');
assert.equal(window.LUNEA_TIMING_AB_LAST, null, 'Retry entry must clear A/B Timing memory');

// Regression fallback: even if a legacy path bypasses all known entry buttons,
// changing the displayed tarot question must clear a stale inline result.
seedStaleTiming();
ids.get('spreadQuestion').textContent = '“완전히 다른 새 질문”';
assert.equal(typeof observedQuestionCallback, 'function', 'spread question observer missing');
observedQuestionCallback();
assert.equal(ids.get('luneaTimingInline').removed, true, 'question boundary must remove stale single Timing inline');
assert.equal(ids.get('luneaTimingABInline').removed, true, 'question boundary must remove stale A/B Timing inline');
assert.deepEqual(ids.get('luneaTimingABCards').children, [], 'question boundary must clear A/B source cards');
assert.equal(window.LUNEA_TIMING_AB_LAST, null, 'question boundary must clear A/B memory');
assert.equal(internalTiming.primary, null, 'question boundary must clear single Timing closure state');

const matches = loader.match(/lunea-reading-boundary-reset-v31\.js\?v=3102/g) || [];
assert.equal(matches.length, 2, 'V31.1 boundary reset must load in parsing and sequential loader paths');
assert.doesNotMatch(loader, /lunea-reading-boundary-reset-v31\.js\?v=3101/, 'stale V31 cache key must be inactive');
const lastGeneral = loader.lastIndexOf('lunea-general-order-v30-5.js?v=3005');
const lastBoundary = loader.lastIndexOf('lunea-reading-boundary-reset-v31.js?v=3102');
const lastReveal = loader.lastIndexOf('lunea-boot-reveal-v29.js?v=2902');
assert.ok(lastBoundary > lastGeneral, 'V31.1 boundary reset must load after final spread wrappers/order patches');
assert.ok(lastReveal > lastBoundary, 'V31.1 boundary reset must be installed before boot reveal');

console.log('Timing Oracle reading-boundary V31.1 all-entrypoint regression tests: PASS');
