import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-intimacy-v34.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../.github/workflows/bump-lunea-loader-413.yml', import.meta.url), 'utf8');
const window = {};
window.window = window;
vm.runInNewContext(source, {
  window,
  console,
  Object,
  Array,
  String,
  Number,
  Boolean,
  Map,
  Set,
  RegExp,
  JSON
});

const api = window.LUNEA_INTIMACY_V34;

test('exposes complete 78-card intimacy database', () => {
  assert.ok(api, 'INTIMACY API missing');
  assert.equal(api.version, '34.0');
  assert.equal(Object.keys(api.cards).length, 78);

  const majors = ['Fool','Magician','High Priestess','Empress','Emperor','Hierophant','Lovers','Chariot','Strength','Hermit','Wheel of Fortune','Justice','Hanged Man','Death','Temperance','Devil','Tower','Star','Moon','Sun','Judgement','World'];
  for (const code of majors) assert.ok(api.cards[code], `missing major ${code}`);
  for (const suit of ['Wands','Cups','Swords','Pents']) {
    for (let n = 1; n <= 14; n += 1) {
      const code = `${suit}${String(n).padStart(2, '0')}`;
      assert.ok(api.cards[code], `missing minor ${code}`);
    }
  }
});

test('every card follows the normalized axis/risk contract', () => {
  const axisKeys = [...api.axes];
  const riskKeys = [...api.risks];
  const paces = new Set(['fast','slow','steady','variable','matched','blocked']);

  for (const [code, card] of Object.entries(api.cards)) {
    assert.equal(typeof card.core, 'string', `${code} core missing`);
    assert.equal(typeof card.shadow, 'string', `${code} shadow missing`);
    assert.deepEqual(Object.keys(card.axes), axisKeys, `${code} axis keys mismatch`);
    assert.deepEqual(Object.keys(card.risks), riskKeys, `${code} risk keys mismatch`);
    for (const value of Object.values(card.axes)) {
      assert.ok(Number.isInteger(value) && value >= -2 && value <= 2, `${code} invalid axis ${value}`);
    }
    for (const value of Object.values(card.risks)) {
      assert.ok(Number.isInteger(value) && value >= 0 && value <= 3, `${code} invalid risk ${value}`);
    }
    assert.ok(paces.has(card.pace), `${code} invalid pace ${card.pace}`);
    assert.ok(Array.isArray(card.tags) && card.tags.length >= 2, `${code} tags missing`);
  }
});

test('ships exactly five fixed intimacy spreads with required position counts', () => {
  const expected = {
    intimacy_core_5: 5,
    desire_tension_6: 6,
    rhythm_boundary_7: 7,
    reunion_intimacy_6: 6,
    intimacy_ab_9: 9
  };
  assert.deepEqual(Object.keys(api.spreads), Object.keys(expected));
  for (const [id, count] of Object.entries(expected)) {
    const spread = api.getSpread(id);
    assert.equal(spread.cardCount, count, `${id} card count`);
    assert.equal(spread.positions.length, count, `${id} positions length`);
    spread.positions.forEach((position, index) => {
      assert.equal(position.index, index + 1);
      assert.ok(position.label.length > 4);
      assert.ok(position.focusAxes.length > 0);
    });
    assert.equal(api.getSpread(spread.title)?.id, id, `${id} title lookup`);
  }
});

test('adult/minor and interpretation safety contract is explicit', () => {
  assert.equal(api.isMinorQuestion('16살 남자친구와 속궁합이 궁금해'), true);
  assert.equal(api.isMinorQuestion('고등학생 상대와 신체적 궁합'), true);
  assert.equal(api.isMinorQuestion('30살 성인 커플의 친밀감 리듬'), false);

  const prompt = api.buildPromptLayer([
    {code:'Devil', isReversed:false},
    {code:'Temperance', isReversed:true}
  ], '신체적 속궁합 · CORE 5', '성인 커플의 속궁합');
  assert.match(prompt, /미성년자가 포함된/);
  assert.match(prompt, /실제 동의\(consent\)/);
  assert.match(prompt, /신체 크기/);
  assert.match(prompt, /강렬함 ≠ 좋은 궁합/);
  assert.match(prompt, /정방향 core의 주근거: 강렬한 육체적 끌림/);
  assert.match(prompt, /제한·반증으로 함께 검토할 shadow: 집착·소유·권력 불균형/);
  assert.match(prompt, /역방향 shadow의 주근거: 지나친 양보/);
  assert.match(prompt, /유지·회복 가능성 또는 대안으로 검토할 core: 서로 다른 욕구와 템포/);
  assert.match(prompt, /정방향도 core만으로 결론내리지 말고 shadow의 제한·반증/);
  assert.match(prompt, /역방향도 자동 부정이 아니며/);
  assert.match(prompt, /상대의 욕구·속마음·동의·행동 계획을 카드 사실로 단정하지 않는다/);
  assert.doesNotMatch(prompt, /focus axes:|focus risks:|attraction:2|obsession:3/);
  assert.equal(api.getCard('Temperance').axes.mutuality, 2);
});

test('structural loader and cache-stamp workflow include INTIMACY V34', () => {
  assert.equal((loader.match(/lunea-intimacy-v34\.js\?v=(?:3401|[0-9a-f]{12})/g) || []).length, 2, 'loader must include V34 in both paths');
  assert.match(workflow, /'lunea-intimacy-v34\.js'/, 'cache stamp workflow must include V34');
});

console.log('LUNEA INTIMACY V34 tests: PASS');
