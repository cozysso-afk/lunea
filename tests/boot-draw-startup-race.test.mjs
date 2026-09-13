import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

const sourcePath = new URL('../lunea-boot-reveal-v29.js', import.meta.url);
const source = fs.readFileSync(sourcePath, 'utf8');
execFileSync(process.execPath, ['--check', sourcePath.pathname], {stdio:'pipe'});

class FakeButton {
  constructor() {
    this.onclick = null;
    this.disabled = false;
    this.listeners = [];
  }
  addEventListener(type, fn, capture=false) {
    this.listeners.push({type, fn, capture:!!capture});
  }
  removeEventListener(type, fn, capture=false) {
    this.listeners = this.listeners.filter(x => !(x.type === type && x.fn === fn && x.capture === !!capture));
  }
  click() {
    const event = {
      defaultPrevented:false,
      stopped:false,
      preventDefault(){ this.defaultPrevented = true; },
      stopImmediatePropagation(){ this.stopped = true; },
    };
    for (const item of [...this.listeners]) {
      if (item.type !== 'click' || !item.capture) continue;
      item.fn.call(this, event);
      if (event.stopped) break;
    }
    if (!event.stopped && typeof this.onclick === 'function') this.onclick.call(this, event);
  }
}

const button = new FakeButton();
const label = {textContent:'질문 분석 & 맞춤 배열 설계'};
const select = {querySelector(selector){ return selector === 'option[value="365"]' ? {} : null; }};
const root = {
  dataset:{luneaCoreSpreadEntries:'ready'},
  classList:{remove(){}, add(){}}
};
const timers = [];
let baseCalls = 0;
let finalCalls = 0;
button.onclick = () => { baseCalls += 1; };

const document = {
  readyState:'complete',
  documentElement:root,
  getElementById(id) {
    if (id === 'drawBtn') return button;
    if (id === 'drawLabel') return label;
    if (id === 'astroTransitDays') return select;
    return null;
  },
  querySelector(selector) {
    if (selector === '#luneaHomePortalV8 .lunea-v8-tile') return {};
    if (selector === '[data-lunea-long-days="365"]') return {};
    return null;
  },
  querySelectorAll(selector) {
    if (selector === '[data-lunea-universal-ai="1"]') return [{},{},{},{}];
    if (selector === '[data-manual-spread="1"]') return [{},{},{},{}];
    if (selector === '.reading-item') {
      return [
        {dataset:{title:'5 CARD · CORE FLOW'}},
        {dataset:{title:'6 CARD · FULL VIEW'}},
      ];
    }
    return [];
  },
  addEventListener(){},
};

const window = {window:null, addEventListener(){}};
window.window = window;
const performance = {now(){ return 100; }};
const setTimeout = fn => { timers.push(fn); return timers.length; };
const clearTimeout = () => {};
const requestAnimationFrame = () => 0;

vm.runInNewContext(source, {
  window,
  document,
  performance,
  setTimeout,
  clearTimeout,
  requestAnimationFrame,
  console,
});

button.click();
assert.equal(baseCalls, 0, 'early draw click must not fall through to the incomplete handler');
assert.equal(label.textContent, '카드 엔진 준비 중…', 'early draw click should show startup feedback');
assert.ok(timers.length > 0, 'early draw click should queue a readiness retry');

const finalHandler = () => { finalCalls += 1; };
finalHandler.__luneaUniversalV20Wrapped = true;
button.onclick = finalHandler;
window.LUNEA_AI_SPREAD_PREFLIGHT = {design(){}};

while (timers.length) timers.shift()();
assert.equal(finalCalls, 1, 'queued draw click must replay exactly once after the final pipeline becomes ready');
assert.equal(baseCalls, 0, 'the incomplete handler must never receive the queued click');
assert.equal(label.textContent, '질문 분석 & 맞춤 배열 설계', 'draw label must be restored before replay');

console.log('boot draw startup race regression: ok');
