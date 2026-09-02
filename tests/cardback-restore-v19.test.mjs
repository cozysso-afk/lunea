import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-cardback-restore-v19.js', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../.github/workflows/bump-lunea-loader-413.yml', import.meta.url), 'utf8');

class FakeStyle {
  constructor() { this.values = new Map(); }
  setProperty(name, value) { this.values.set(name, String(value)); }
  removeProperty(name) { this.values.delete(name); }
  getPropertyValue(name) { return this.values.get(name) || ''; }
}

class FakeClassList {
  constructor(initial = []) { this.set = new Set(initial); }
  add(...names) { names.forEach(name => this.set.add(name)); }
  remove(...names) { names.forEach(name => this.set.delete(name)); }
  contains(name) { return this.set.has(name); }
}

class HTMLElement {
  constructor(tag = 'div') {
    this.nodeType = 1;
    this.tagName = String(tag).toUpperCase();
    this.id = '';
    this.parentElement = null;
    this.children = [];
    this.dataset = {};
    this.style = new FakeStyle();
    this.classList = new FakeClassList();
    this.attributes = new Map();
    this.complete = false;
    this.naturalWidth = 0;
    this.onload = null;
    this.onerror = null;
  }
  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }
  prepend(child) {
    child.parentElement = this;
    this.children.unshift(child);
    return child;
  }
  replaceWith(next) {
    if (!this.parentElement) return;
    const parent = this.parentElement;
    const index = parent.children.indexOf(this);
    if (index >= 0) parent.children[index] = next;
    next.parentElement = parent;
    this.parentElement = null;
  }
  matches(selector) {
    if (selector === '#cards') return this.id === 'cards';
    if (selector === '.tarot-card .back') {
      return this.classList.contains('back') && !!this.closest('.tarot-card');
    }
    return false;
  }
  closest(selector) {
    let node = this;
    while (node) {
      if (selector === '#cards' && node.id === 'cards') return node;
      if (selector === '.tarot-card' && node.classList?.contains('tarot-card')) return node;
      node = node.parentElement;
    }
    return null;
  }
  querySelector(selector) {
    if (selector === ':scope > img') {
      return this.children.find(child => child.tagName === 'IMG') || null;
    }
    return null;
  }
  querySelectorAll(selector) {
    const out = [];
    const visit = node => {
      for (const child of node.children || []) {
        if (selector === '.tarot-card .back' && child.matches?.('.tarot-card .back')) out.push(child);
        visit(child);
      }
    };
    visit(this);
    return out;
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) {
    if (name === 'src' && this.attributes.has('src')) return this.attributes.get('src');
    return this.attributes.get(name) ?? null;
  }
  removeAttribute(name) { this.attributes.delete(name); }
  set src(value) { this.attributes.set('src', String(value)); }
  get src() { return this.attributes.get('src') || ''; }
}

const head = new HTMLElement('head');
const cards = new HTMLElement('div');
cards.id = 'cards';
const overlay = new HTMLElement('div');
overlay.id = 'spreadOverlay';
overlay.classList.add('show');

const roots = [head, cards, overlay];
const findById = id => {
  let found = null;
  const visit = node => {
    if (!node || found) return;
    if (node.id === id) { found = node; return; }
    (node.children || []).forEach(visit);
  };
  roots.forEach(visit);
  return found;
};

const observers = [];
class MutationObserver {
  constructor(callback) { this.callback = callback; this.target = null; }
  observe(target, options) { this.target = target; this.options = options; observers.push(this); }
  disconnect() {}
}

const document = {
  readyState: 'complete',
  baseURI: 'https://example.test/lunea/',
  hidden: false,
  head,
  getElementById: findById,
  createElement: tag => new HTMLElement(tag),
  querySelectorAll(selector) {
    if (selector === '#cards .tarot-card .back') return cards.querySelectorAll('.tarot-card .back');
    return [];
  },
  addEventListener() {}
};

const state = {category: 'LOVE'};
const window = {addEventListener() {}};
window.window = window;

vm.runInNewContext(source, {
  window,
  document,
  state,
  HTMLElement,
  MutationObserver,
  URL,
  Date,
  Map,
  Set,
  Array,
  String,
  Number,
  Object,
  console,
  setTimeout(callback) { callback(); return 1; },
  requestAnimationFrame(callback) { callback(); return 1; }
});

assert.equal(window.LUNEA_CARD_BACK_RESTORE_V19?.version, '19.1', 'V19.1 repair API missing');
assert.equal(window.LUNEA_CARD_BACK_RESTORE_V19?.assetKey, '1911', 'card-back asset key missing');

// Simulate the real failure mode: a card is created AFTER boot and its old iOS
// image listener has already hidden the image. The observer receives the WRAPPER
// as its mutation root, not document/#cards.
const wrapper = new HTMLElement('div');
wrapper.classList.add('tarot-card-wrapper');
const tarot = new HTMLElement('div');
tarot.classList.add('tarot-card');
const back = new HTMLElement('div');
back.classList.add('back');
const legacyImg = new HTMLElement('img');
legacyImg.style.setProperty('display', 'none');
legacyImg.setAttribute('src', 'back_love.PNG');
back.appendChild(legacyImg);
tarot.appendChild(back);
wrapper.appendChild(tarot);
cards.appendChild(wrapper);

const cardsObserver = observers.find(observer => observer.target === cards);
assert.ok(cardsObserver, 'cards MutationObserver was not installed');
cardsObserver.callback([{addedNodes:[wrapper]}]);

const managed = back.querySelector(':scope > img');
assert.ok(managed, 'managed card-back image missing');
assert.notEqual(managed, legacyImg, 'legacy image with unknown error listeners must be replaced');
assert.equal(managed.dataset.luneaCardbackManaged, '1911');
assert.ok(managed.classList.contains('lunea-category-cardback'));
assert.match(managed.getAttribute('src') || '', /back_love\.PNG/);
assert.match(back.style.getPropertyValue('background-image'), /back_love\.PNG/);
assert.match(back.style.getPropertyValue('background-image'), /lunea_cardback=1911/);

// A transient load error must retry with a fresh URL instead of remaining hidden.
managed.style.setProperty('display', 'none');
managed.onerror();
assert.equal(managed.style.getPropertyValue('display'), '');
assert.match(managed.getAttribute('src') || '', /lunea_cardback=1911-/);

// Reusing/restoring the same card DOM under another category must switch backs.
state.category = 'STOCK';
window.LUNEA_CARD_BACK_RESTORE_V19.repairRoot(document);
assert.match(back.style.getPropertyValue('background-image'), /back_stock\.PNG/);
assert.match(back.querySelector(':scope > img').getAttribute('src') || '', /back_stock\.PNG/);

// Guard against the original subtree-selector regression.
assert.ok(!source.includes("root.querySelectorAll?.('#cards .tarot-card .back')"), 'broken ancestor-qualified subtree selector returned');
assert.match(source, /root\.querySelectorAll\?\.\('\.tarot-card \.back'\)/, 'relative subtree selector missing');

// Every Pages release must bust the nested card-back repair URL too. The
// workflow now stamps all behavior-critical nested assets in one shared loop.
assert.match(workflow, /'lunea-cardback-restore-v19\.js'/);
assert.match(workflow, /if count != 2:/);
assert.match(workflow, /Could not stamp both nested loader paths for \{asset\}/);
assert.match(workflow, /lunea-structural-routing-v4\.js/);

console.log('Tarot card-back dynamic restore V19.1 regression tests: PASS');
