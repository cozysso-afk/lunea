import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-lag-guard-v1.js', import.meta.url), 'utf8');

assert.match(source, /releaseStaleReadingDrawLock/);
assert.match(source, /READING_MODE_SELECTOR/);
assert.match(source, /document\.addEventListener\('pointerdown', repair, true\)/);
assert.match(source, /document\.addEventListener\('click', repair, true\)/);
assert.ok(!/W\.startSpread\s*=/.test(source), 'stale-lock repair must not wrap startSpread');
assert.ok(!/setInterval\s*\(/.test(source), 'stale-lock repair must not add polling');

const handlers = new Map();
const removed = [];
const drawBtn = {
  disabled:true,
  attrs:new Map([['aria-busy','true']]),
  getAttribute(name){ return this.attrs.get(name) || null; },
  removeAttribute(name){ removed.push(name); this.attrs.delete(name); }
};
const body = {classList:{remove(){}},style:{removeProperty(){}}};
const documentElement = {style:{removeProperty(){}}};
const document = {
  readyState:'complete',
  body,
  documentElement,
  head:{appendChild(){}},
  getElementById(id){ return id === 'drawBtn' ? drawBtn : null; },
  querySelector(){ return null; },
  createElement(){ return {id:'',style:{},textContent:''}; },
  addEventListener(type,fn){ handlers.set(type,fn); }
};
const windowHandlers = new Map();
const context = {
  console,
  document,
  performance:{now:()=>100},
  requestAnimationFrame(fn){ fn(); return 1; },
  setTimeout(fn){ fn(); return 1; },
  clearTimeout(){},
  AbortController,
  window:null,
  fetch:async()=>({ok:true})
};
context.window = context;
context.addEventListener = (type,fn) => windowHandlers.set(type,fn);

vm.createContext(context);
vm.runInContext(source, context);

assert.ok(context.LUNEA_LAG_GUARD_V1, 'lag guard API should install');
assert.equal(context.LUNEA_LAG_GUARD_V1.version, 1.2);
assert.equal(typeof handlers.get('pointerdown'), 'function');
assert.equal(typeof handlers.get('click'), 'function');

const modeTarget = {
  closest(selector){ return selector.includes('data-manual-spread') ? this : null; }
};
handlers.get('pointerdown')({target:modeTarget});
assert.equal(drawBtn.disabled, false, 'manual mode entry must release stale disabled draw button');
assert.equal(drawBtn.getAttribute('aria-busy'), null, 'manual mode entry must clear stale aria-busy');
assert.ok(removed.includes('aria-busy'));

// Reproduce a later AI -> manual -> AI cycle leaving the button locked again.
drawBtn.disabled = true;
drawBtn.attrs.set('aria-busy','true');
const aiTarget = {
  closest(selector){ return selector.includes('data-lunea-universal-ai') ? this : null; }
};
handlers.get('click')({target:aiTarget});
assert.equal(drawBtn.disabled, false, 'AI mode entry must recover the same stale lock on later questions');
assert.equal(drawBtn.getAttribute('aria-busy'), null);

// Unrelated UI clicks must never unlock an actively owned draw button.
drawBtn.disabled = true;
drawBtn.attrs.set('aria-busy','true');
handlers.get('click')({target:{closest(){return null;}}});
assert.equal(drawBtn.disabled, true, 'non-reading clicks must not touch draw ownership');
assert.equal(drawBtn.getAttribute('aria-busy'), 'true');

console.log('mixed AI/manual stale draw-lock regression: PASS');