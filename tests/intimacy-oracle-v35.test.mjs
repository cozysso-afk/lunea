import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-intimacy-oracle-v35.js', import.meta.url), 'utf8');

const tarot = {
  Devil: {
    code:'Devil', pace:'fast',
    axes:{attraction:2,desire:2,initiative:2,receptivity:1,emotionalSafety:-1,communication:-1,mutuality:0,satisfaction:1,attachment:1},
    risks:{obsession:3,boundary:2,avoidance:0,instability:2},
    tags:['craving']
  },
  Sun: {
    code:'Sun', pace:'matched',
    axes:{attraction:2,desire:2,initiative:1,receptivity:2,emotionalSafety:2,communication:2,mutuality:2,satisfaction:2,attachment:2},
    risks:{obsession:0,boundary:0,avoidance:0,instability:0},
    tags:['mutuality']
  },
  Lovers: {
    code:'Lovers', pace:'matched',
    axes:{attraction:2,desire:2,initiative:1,receptivity:2,emotionalSafety:2,communication:2,mutuality:2,satisfaction:2,attachment:2},
    risks:{obsession:0,boundary:0,avoidance:0,instability:0},
    tags:['chemistry']
  },
  HighPriestess: {
    code:'High Priestess', pace:'slow',
    axes:{attraction:1,desire:1,initiative:-2,receptivity:1,emotionalSafety:1,communication:0,mutuality:0,satisfaction:1,attachment:1},
    risks:{obsession:0,boundary:0,avoidance:1,instability:0},
    tags:['hidden_desire']
  }
};

const window = {
  LUNEA_INTIMACY_V34: {
    getCard(code) { return tarot[code] || null; }
  }
};
window.window = window;

vm.runInNewContext(source, {window, console, Object, Array, Map, Set, String, Number});

const api = window.LUNEA_INTIMACY_ORACLE_V35;
assert.ok(api, 'oracle API missing');
assert.equal(api.version, '35.0');
assert.equal(Object.keys(api.cards).length, 36, 'oracle must have exactly 36 cards');
assert.equal(Object.keys(api.families).length, 6, 'oracle must have six families');

const cards = Object.values(api.cards);
const codes = cards.map(card => card.code);
assert.deepEqual(codes, Array.from({length:36}, (_,i) => `O${String(i+1).padStart(2,'0')}`));
assert.equal(new Set(cards.map(card => card.title)).size, 36, 'oracle titles must be unique');

for (const family of Object.keys(api.families)) {
  assert.equal(cards.filter(card => card.family === family).length, 6, `${family} must contain six cards`);
}
for (const card of cards) {
  assert.ok(['supportive','mixed','caution'].includes(card.tone), `${card.code} invalid tone`);
  assert.equal(Object.keys(card.axes).length, 9, `${card.code} axis count`);
  assert.equal(Object.keys(card.risks).length, 4, `${card.code} risk count`);
  Object.values(card.axes).forEach(value => assert.ok(value >= -3 && value <= 3, `${card.code} axis out of range`));
  Object.values(card.risks).forEach(value => assert.ok(value >= 0 && value <= 3, `${card.code} risk out of range`));
  assert.ok(card.light.length >= 20, `${card.code} light meaning too short`);
  assert.ok(card.shadow.length >= 20, `${card.code} shadow meaning too short`);
}

const possession = api.combinePair('Devil', 'O29');
assert.ok(possession, 'Devil + Possession combination missing');
assert.ok(possession.rules.some(rule => rule.id === 'magnetic_but_compulsive'));
assert.ok(possession.rules.some(rule => rule.id === 'attraction_boundary_conflict'));
assert.equal(possession.risks.obsession.level, 'high');
assert.equal(possession.risks.boundary.level, 'high');

const synchrony = api.combinePair('Sun', 'O09');
assert.ok(synchrony.rules.some(rule => rule.id === 'mutual_fit'), 'Sun + Synchrony should support mutual fit');
assert.equal(synchrony.pace.relation, 'aligned');

const offbeat = api.combinePair('Lovers', 'O10');
assert.ok(offbeat.rules.some(rule => rule.id === 'rhythm_mismatch'), 'Lovers + Offbeat must preserve rhythm mismatch');
assert.equal(offbeat.axes.mutuality.signal, 'conflict');

const fantasyBlocked = api.combinePair('HighPriestess', 'O17');
assert.ok(fantasyBlocked.rules.some(rule => rule.id === 'desire_blocked'), 'hidden desire + low initiative should remain blocked');

const consentSymbol = api.getCard('O21');
assert.ok(consentSymbol.tags.includes('consent_symbol'));
assert.match(consentSymbol.shadow, /현실의 동의.*증명/);

const oracleStack = api.combineOracleCards(['O26','O29','O31']);
assert.ok(oracleStack.repeatedFamilies.includes('bond'), 'same-family repetition should be detected');
assert.match(oracleStack.cautionRule, /경고 카드/);

const contract = api.promptContract();
assert.match(contract, /모순되는 신호는 평균내지 않는다/);
assert.match(contract, /attachment와 satisfaction을 분리/);
assert.match(contract, /현실의 동의를 증명하지 않는다/);
assert.doesNotMatch(contract, /퍼센트로 변환한다|%/);

console.log('LUNEA INTIMACY ORACLE V35 data/combination contract: PASS');
