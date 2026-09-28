import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-reading-boundary-reset-v31.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');
const executable = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

function classList(initial = []) {
  const set = new Set(initial);
  return {
    add(...xs) { xs.forEach(x => set.add(x)); },
    remove(...xs) { xs.forEach(x => set.delete(x)); },
    contains(x) { return set.has(x); },
    toggle(x, force) {
      if (force === true) set.add(x);
      else if (force === false) set.delete(x);
      else if (set.has(x)) set.delete(x);
      else set.add(x);
      return set.has(x);
    }
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

let supportHandlerCalls = 0;
ids.get('timingSupportBtn').onclick = () => {
  supportHandlerCalls += 1;
  ids.get('timingOverlay').classList.add('show');
};

let observedQuestionCallback = null;
let captureClick = null;
class MutationObserver {
  constructor(cb) { this.cb = cb; }
  observe(target) {
    if (target === ids.get('spreadQuestion')) observedQuestionCallback = this.cb;
  }
  disconnect() {}
}

const body = {
  classList: classList(['modal-open']),
  style: {removeProperty() {}}
};
const documentElement = {
  dataset: {},
  style: {removeProperty() {}}
};
const document = {
  readyState: 'complete',
  documentElement,
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

let starts = 0;
const originalStartSpread = function startSpread() { starts += 1; return 'started'; };
const window = {
  LUNEA_TIMING_AB_LAST: {A:{id:'LT-001'}, B:{id:'LT-002'}},
  startSpread: originalStartSpread
};
window.window = window;

vm.runInNewContext(source, {
  window,
  document,
  MutationObserver,
  console,
  String,
  RegExp,
  Set,
  Map,
  Object,
  Array,
});

const api = window.LUNEA_READING_BOUNDARY_V31;
assert.equal(api?.version, 31.2, 'V31.2 reset API missing');
assert.equal(window.startSpread, originalStartSpread, 'V31.2 must never wrap or replace startSpread');
assert.equal(starts, 0, 'loading boundary cleanup must not start a reading');
assert.equal(supportHandlerCalls, 0, 'V31.2 must never call the Timing support onclick handler');

function seedStaleTiming(label='⌛ 오늘 밤') {
  ids.get('luneaTimingInline').removed = false;
  ids.get('luneaTimingABInline').removed = false;
  ids.get('luneaTimingABCards').children = [1, 2];
  ids.get('timingInner').classList.add('flipped');
  ids.get('timingResult').classList.add('show');
  ids.get('timingActions').classList.add('show');
  ids.get('timingAIText').textContent = '이전 질문 AI 시기 해석';
  ids.get('luneaTimingABAI').textContent = '이전 A/B 시기 해석';
  ids.get('timingSupportBtn').textContent = label;
  ids.get('timingOverlay').classList.add('show');
  body.classList.add('modal-open');
  window.LUNEA_TIMING_AB_LAST = {A:{id:'LT-003'}, B:{id:'LT-005'}};
}

function assertVisualReset(reason) {
  assert.equal(ids.get('luneaTimingInline').removed, true, `${reason}: single Timing inline must be removed`);
  assert.equal(ids.get('luneaTimingABInline').removed, true, `${reason}: A/B Timing inline must be removed`);
  assert.deepEqual(ids.get('luneaTimingABCards').children, [], `${reason}: A/B source cards must be cleared`);
  assert.equal(window.LUNEA_TIMING_AB_LAST, null, `${reason}: A/B memory source must be cleared`);
  assert.equal(ids.get('timingInner').classList.contains('flipped'), false, `${reason}: hidden Timing card must be unflipped`);
  assert.equal(ids.get('timingResult').classList.contains('show'), false, `${reason}: old Timing result must be hidden`);
  assert.equal(ids.get('timingActions').classList.contains('show'), false, `${reason}: old Timing actions must be hidden`);
  assert.equal(ids.get('timingAIText').textContent, '', `${reason}: old Timing AI text must be cleared`);
  assert.equal(ids.get('luneaTimingABAI').textContent, '', `${reason}: old A/B Timing AI text must be cleared`);
  assert.equal(ids.get('timingSupportBtn').textContent, '⏳ 시기 카드', `${reason}: support label must be reset`);
  assert.equal(ids.get('timingOverlay').classList.contains('show'), false, `${reason}: Timing overlay must be closed`);
  assert.equal(supportHandlerCalls, 0, `${reason}: cleanup must not invoke Timing draw/open handler`);
}

api.resetTimingBoundary('unit-test');
assertVisualReset('direct API');
assert.equal(documentElement.dataset.luneaTimingBoundary, 'unit-test');
assert.equal(body.classList.contains('modal-open'), false, 'modal lock must clear when no overlay remains visible');

assert.equal(typeof captureClick, 'function', 'capture click safety net missing');
for (const id of ['drawBtn','dailyBtn','luneaDraftRestore','retry']) {
  seedStaleTiming();
  captureClick({target: ids.get(id)});
  assertVisualReset(id);
  assert.equal(documentElement.dataset.luneaTimingBoundary, 'direct-reading-entry');
}

seedStaleTiming();
ids.get('spreadQuestion').textContent = '“완전히 다른 새 질문”';
assert.equal(typeof observedQuestionCallback, 'function', 'spread question observer missing');
observedQuestionCallback();
assertVisualReset('question observer');
assert.equal(documentElement.dataset.luneaTimingBoundary, 'question-change');

const out = window.startSpread('새 질문');
assert.equal(out, 'started');
assert.equal(starts, 1, 'canonical startSpread must remain independently callable exactly once');
assert.equal(supportHandlerCalls, 0, 'canonical start must not be intercepted by V31.2');

assert.doesNotMatch(executable, /timingSupportBtn[^\n]*onclick|onclick\.call/, 'V31.2 executable code must not use the Timing button as a closure-reset back door');
assert.doesNotMatch(executable, /W\.startSpread\s*=|setInterval|queueMicrotask|requestAnimationFrame/, 'V31.2 executable code must remain synchronous and non-wrapping');

const matches = loader.match(/lunea-reading-boundary-reset-v31\.js\?v=3102/g) || [];
assert.equal(matches.length, 2, 'V31.2 boundary reset must load in parsing and sequential loader paths');
assert.doesNotMatch(loader, /lunea-reading-boundary-reset-v31\.js\?v=3101/, 'stale V31 cache key must be inactive');
assert.match(loader, /lunea-general-order-v30-5\.js\?v=(?:3005|[0-9a-f]{12})/, 'final GENERAL order asset missing');
assert.match(loader, /lunea-boot-reveal-v29\.js\?v=(?:2902|[0-9a-f]{12})/, 'boot reveal asset missing');
const lastGeneral = loader.lastIndexOf('lunea-general-order-v30-5.js?v=');
const lastBoundary = loader.lastIndexOf('lunea-reading-boundary-reset-v31.js?v=3102');
const lastReveal = loader.lastIndexOf('lunea-boot-reveal-v29.js?v=');
assert.ok(lastBoundary > lastGeneral, 'V31.2 boundary reset must load after final spread/order patches');
assert.ok(lastReveal > lastBoundary, 'V31.2 boundary reset must load before boot reveal');

console.log('Timing Oracle reading-boundary V31.2 synchronous regression tests: PASS');
