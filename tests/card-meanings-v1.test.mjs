import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const html = read('index.html');
const source = read('lunea-card-meanings-v1.js');
const window = {};
const context = vm.createContext({window, console});
vm.runInContext(html.slice(html.indexOf('const MAJORS='), html.indexOf('const TAROT_DECK=')) + '\nglobalThis.deck=[...MAJORS,...buildMinor()];', context);
vm.runInContext(source, context);
const api = window.LUNEA_CARD_MEANINGS_V1;

test('all 78 actual deck codes have distinct upright and reversed descriptions', () => {
  assert.equal(context.deck.length, 78);
  for (const card of context.deck) {
    const up = api.meaning(card), rev = api.meaning({...card, isReversed:true});
    assert.ok(up.length >= 25, card.code);
    assert.ok(rev.length >= 25, card.code);
    assert.notEqual(up, rev, card.code);
    assert.ok(up.length < 130 && rev.length < 130, 'notes stay short');
  }
  assert.equal(api.meaning({code:'unknown'}), '');
  assert.match(api.meaning({code:'Death'}), /문자 그대로의 죽음을 뜻하지/);
  assert.match(api.meaning({code:'Swords07'}), /외도를 확정하지/);
});

test('real reveal appends one note and leaves intimacy and clarify controls intact', () => {
  const notes = [];
  const box = {querySelector(){return notes.find(n => n.className === 'lunea-card-meaning');},appendChild(n){notes.push(n);}};
  context.state = {category:'LOVE',drawn:[{code:'Moon',isReversed:true}]};
  context.document = {getElementById(){return box;},createElement(){return {};}};
  api.appendNote(0); api.appendNote(0);
  assert.equal(notes.length,1);
  assert.equal(notes[0].textContent,api.meaning(context.state.drawn[0]));
  context.state.category='INTIMACY'; notes.length=0;
  api.appendNote(0);
  assert.equal(notes.length,0,'existing INTIMACY owner keeps its own note');
  assert.match(html,/appendChild\(box\);window\.LUNEA_CARD_MEANINGS_V1\?\.appendNote\(i\)/);
});

test('size questions remain answerable symbolically without invented anatomy', () => {
  const intimacy = {};
  vm.runInNewContext(read('lunea-intimacy-v34.js'),{window:intimacy,console});
  const prompt = intimacy.LUNEA_INTIMACY_V34.buildPromptLayer([{code:'Devil'}],'속궁합 · 19+','성인 상대의 물리적인 크기와 굵기가 궁금해');
  assert.match(prompt,/크기·굵기·길이·형태를 묻는 질문이나 포지션을 삭제하거나 다른 질문으로 바꾸지 않는다/);
  assert.match(prompt,/실제 신체 크기는 카드로 확인할 수 없/);
  assert.match(prompt,/cm 수치, 치수 범위, 평균 이상\/이하/);
  assert.match(prompt,/성인 상대의 물리적인 크기와 굵기가 궁금해/);
});
