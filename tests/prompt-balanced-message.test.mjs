import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-message-oracle-support-v1.js', import.meta.url), 'utf8');

class FakeElement {
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.parentElement = null;
    this.textContent = '';
    this.id = '';
    this.className = '';
    this.type = '';
    this.src = '';
    this.alt = '';
    this.listeners = new Map();
    this.classList = {contains: () => false};
  }

  get childNodes() { return this.children; }
  get firstChild() { return this.children[0] || null; }
  get lastChild() { return this.children.at(-1) || null; }
  get nextSibling() {
    if (!this.parentNode) return null;
    const index = this.parentNode.children.indexOf(this);
    return this.parentNode.children[index + 1] || null;
  }

  appendChild(node) {
    if (node.parentNode) node.remove();
    node.parentNode = this;
    node.parentElement = this;
    this.children.push(node);
    return node;
  }

  insertBefore(node, reference) {
    if (node.parentNode) node.remove();
    node.parentNode = this;
    node.parentElement = this;
    const index = this.children.indexOf(reference);
    this.children.splice(index < 0 ? this.children.length : index, 0, node);
    return node;
  }

  replaceChildren(...nodes) {
    for (const child of this.children) {
      child.parentNode = null;
      child.parentElement = null;
    }
    this.children = [];
    for (const node of nodes) this.appendChild(node);
  }

  remove() {
    if (!this.parentNode) return;
    const index = this.parentNode.children.indexOf(this);
    if (index >= 0) this.parentNode.children.splice(index, 1);
    this.parentNode = null;
    this.parentElement = null;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  querySelector() { return null; }
}

function makeDocument() {
  const head = new FakeElement('head');
  const body = new FakeElement('body');
  const findById = (node, id) => {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = findById(child, id);
      if (found) return found;
    }
    return null;
  };
  const document = {
    head,
    body,
    documentElement: body,
    hidden: false,
    createElement: tagName => new FakeElement(tagName),
    getElementById: id => findById(head, id) || findById(body, id),
    querySelector: () => null,
    addEventListener() {}
  };
  const cards = document.createElement('div');
  cards.id = 'cards';
  body.appendChild(cards);
  return document;
}

function loadSupportAdapter() {
  const document = makeDocument();
  const notifications = [];
  const result = {
    question: '이번 지원의 승인 결과 통지가 올까?',
    context: 'OFFICIAL',
    cardCode: 'Justice',
    score: 72,
    createdAt: '2026-10-12T00:00:00.000Z'
  };
  const interpretation = Object.freeze({
    contextLabel: '공식 결과',
    intent: 'APPROVAL',
    score: 72,
    shortMessage: '승인 통지 신호는 중간 이상이에요. 통지와 승인 여부는 별개예요.',
    fullMessage: '통지 신호와 승인 결과는 별개로 보조해야 해요.',
    details: Object.freeze([{label: '통지', value: '중간 이상'}])
  });
  const registry = {
    signature: () => 'exact-reading-signature',
    register() {},
    notifyChanged(name) { notifications.push(name); }
  };
  const window = {
    state: {question: result.question, drawn: [{code: 'The Star'}]},
    LUNEA_READING_ATTACHMENTS_V1: registry,
    LUNEA_MESSAGE_ORACLE_V1: {
      INTENTS: {APPROVAL: '승인 통지'},
      describe: value => value?.question === result.question ? {...result} : null,
      interpret: value => value?.cardCode === result.cardCode ? interpretation : null,
      identity: code => code === result.cardCode ? {name: 'Justice'} : null
    },
    LUNEA_LOAD_FEATURE_GROUP: async name => name === 'message',
    LUNEA_MESSAGE_ORACLE_UI_V1: {
      openSupport: ({onResult}) => Promise.resolve(onResult(result))
    },
    promptString: () => 'BASE PROMPT',
    addEventListener() {}
  };
  window.window = window;

  class FakeMutationObserver {
    constructor(callback) { this.callback = callback; }
    observe() {}
  }

  const context = vm.createContext({
    window,
    document,
    MutationObserver: FakeMutationObserver,
    TAROT_DECK: [{code: 'Justice', name: 'Justice'}],
    console,
    queueMicrotask: fn => fn(),
    promptString: window.promptString
  });
  vm.runInContext(source, context, {filename: 'lunea-message-oracle-support-v1.js'});
  return {context, document, notifications, window};
}

test('Message Oracle inline DOM and prompt block distinguish delivery signals from outcomes', async () => {
  const {context, document, notifications, window} = loadSupportAdapter();
  const support = window.LUNEA_MESSAGE_ORACLE_SUPPORT_V1;

  assert.ok(support, 'active support adapter must expose its public API');
  assert.equal(await support.open(), true, 'the exact-reading support flow must accept the current result');
  assert.deepEqual(notifications, ['messageOracle'], 'accepted exact-reading result must still notify the attachment registry');
  assert.equal(support.capture().score, 72, 'copy clarification must not alter the engine score');

  const inline = document.getElementById('luneaMessageOracleInline');
  assert.ok(inline, 'accepted result must render the production inline support element');
  const text = inline.children[1];
  const title = text.children[1];
  const description = text.children[3];
  assert.equal(title.tagName, 'B');
  assert.equal(title.textContent, 'Justice · 연락·소식 도착·전달 신호 72%');
  assert.equal(description.tagName, 'SMALL');
  assert.equal(description.textContent, '공식 결과 · 승인 통지 · 도착·전달 신호(좋은 결과·성공 확률 아님)');

  const block = support.promptBlock();
  assert.match(block, /^\[MESSAGE ORACLE · 현재 리딩의 연락·소식 보조\]/);
  assert.match(block, /카드 기반 연락·소식 도착·전달 신호: 72%/);
  assert.match(block, /도착·전달 신호일 뿐/);
  assert.match(block, /실제 통계 확률/);
  assert.match(block, /좋은 결과·성공 확률/);
  assert.match(block, /RWS 포지션을 바꾸지 말고/);
  assert.equal(context.promptString(), `BASE PROMPT\n\n${block}`,
    'the legacy bare prompt binding must keep the exact-reading block and its clarified meaning');
});
