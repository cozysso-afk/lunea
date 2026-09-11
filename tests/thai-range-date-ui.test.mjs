import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('V57 keeps exactly one visible date mirror and synchronizes without polling', () => {
  const source = read('lunea-thai-date-display-v57.js');
  class Element {
    constructor(tag = 'span') {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.parentNode = null;
      this.className = '';
      this.dataset = {};
      this.events = {};
      this.value = '';
      this.type = '';
      this.textContent = '';
    }
    appendChild(node) {
      if (node.parentNode) node.parentNode.children = node.parentNode.children.filter(child => child !== node);
      node.parentNode = this;
      this.children.push(node);
      return node;
    }
    insertBefore(node, before) {
      if (node.parentNode) node.parentNode.children = node.parentNode.children.filter(child => child !== node);
      node.parentNode = this;
      const index = this.children.indexOf(before);
      this.children.splice(index < 0 ? this.children.length : index, 0, node);
      return node;
    }
    matches(selector) {
      if (selector.startsWith('.')) return this.className.split(/\s+/).includes(selector.slice(1));
      return false;
    }
    closest(selector) { return this.matches(selector) ? this : this.parentNode?.closest(selector) || null; }
    querySelectorAll(selector) {
      const matches = [];
      for (const child of this.children) {
        if (child.matches(selector)) matches.push(child);
        matches.push(...child.querySelectorAll(selector));
      }
      return matches;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    addEventListener(type, handler) { (this.events[type] ||= []).push(handler); }
    dispatch(type) { for (const handler of this.events[type] || []) handler({target:this}); }
  }
  class HTMLInputElement extends Element {
    constructor() { super('input'); this.type = 'date'; }
  }

  const root = new Element('html');
  const head = new Element('head');
  root.appendChild(head);
  const fields = [new Element('label'), new Element('label')];
  const inputs = fields.map((field, index) => {
    field.className = 'thai-v33-field';
    const input = new HTMLInputElement();
    input.value = index ? '2026-09-24' : '2026-09-11';
    field.appendChild(input);
    root.appendChild(field);
    return input;
  });
  const document = {
    readyState: 'complete',
    documentElement: root,
    head,
    createElement: tag => new Element(tag),
    getElementById: id => root.querySelectorAll('.never').find(node => node.id === id) || head.children.find(node => node.id === id) || null,
    querySelectorAll(selector) {
      if (selector === '.thai-v33-field input[type="date"]') return inputs;
      return root.querySelectorAll(selector);
    },
  };
  const window = {window:null}; window.window = window;
  vm.runInNewContext(source, {window, document, HTMLInputElement, console:{info(){}}});

  const api = window.LUNEA_THAI_DATE_DISPLAY_V57;
  assert.ok(api);
  assert.doesNotMatch(source, /setInterval\s*\(/);
  assert.doesNotMatch(source, /new MutationObserver/);
  assert.match(source, /opacity:0!important/);
  assert.match(source, /-webkit-text-fill-color:transparent!important/);
  for (const [index, input] of inputs.entries()) {
    const shell = input.closest('.thai-v57-date-shell');
    assert.ok(shell, `input ${index} has a date shell`);
    assert.equal(shell.querySelectorAll('.thai-v57-date-visible').length, 1);
    assert.equal(shell.children.at(-1), input, 'native date input remains the top interactive element');
  }
  assert.equal(inputs[0].closest('.thai-v57-date-shell').querySelector('.thai-v57-date-visible').textContent, '2026. 9. 11.');
  inputs[0].value = '2026-12-09';
  api.sync(inputs[0]);
  assert.equal(inputs[0].closest('.thai-v57-date-shell').querySelector('.thai-v57-date-visible').textContent, '2026. 12. 9.');
  inputs[1].value = '2026-10-01';
  inputs[1].dispatch('change');
  assert.equal(inputs[1].closest('.thai-v57-date-shell').querySelector('.thai-v57-date-visible').textContent, '2026. 10. 1.');
  api.syncAll();
  api.syncAll();
  for (const input of inputs) assert.equal(input.closest('.thai-v57-date-shell').querySelectorAll('.thai-v57-date-visible').length, 1);
});

test('V33 exposes five presets, accepts 90 inclusive days, rejects 91, and explicitly syncs mirrors', () => {
  const source = read('lunea-thai-range-v33.js');
  const stopped = source.replace(
    /if\(document\.readyState==='loading'\)[\s\S]*?else boot\(\);\n\}\)\(\);\s*$/,
    '})();'
  );
  const syncCalls = [];
  const window = {
    window: null,
    LUNEA_THAI_DATE_DISPLAY_V57: {sync(input) { syncCalls.push(input); }},
  };
  window.window = window;
  const document = {readyState:'loading', addEventListener(){}};
  vm.runInNewContext(stopped, {window, document, localStorage:{getItem(){return null}}, console, Date, Intl, URL, fetch(){throw new Error('network must not run')}});
  const api = window.LUNEA_THAI_RANGE_V33;
  assert.ok(api);
  assert.equal(api.maxDays, 90);
  for (const days of [7,14,30,60,90]) assert.equal((source.match(new RegExp(`data-days="${days}"`, 'g')) || []).length, 2);
  assert.equal((source.match(/직접 날짜 선택 가능 · 최대 90일/g) || []).length, 2);

  const chips = [7,14,30,60,90].map(days => ({dataset:{days:String(days)}, classList:{toggle(){}}}));
  const root = {querySelectorAll(selector) { return selector === '.thai-v33-chip' ? chips : []; }};
  const start = {value:'2026-09-11'};
  const end = {value:''};
  api.setQuickRange(start, end, 90, root);
  assert.equal(end.value, '2026-12-09');
  assert.deepEqual(syncCalls, [start,end]);
  assert.deepEqual(JSON.parse(JSON.stringify(api.validateRange(start,end))), {start:'2026-09-11',end:'2026-12-09',days:90});
  end.value = '2026-12-10';
  assert.throws(() => api.validateRange(start,end), /Thai 기간은 최대 90일까지/);
});
