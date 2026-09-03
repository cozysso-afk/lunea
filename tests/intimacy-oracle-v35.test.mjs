import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-intimacy-oracle-v35.js', import.meta.url), 'utf8');

const tarot = {
  Devil:{code:'Devil',pace:'fast',axes:{attraction:2,desire:2,initiative:2,receptivity:1,emotionalSafety:-1,communication:-1,mutuality:0,satisfaction:1,attachment:1},risks:{obsession:3,boundary:2,avoidance:0,instability:2},tags:['craving']},
  Sun:{code:'Sun',pace:'matched',axes:{attraction:2,desire:2,initiative:1,receptivity:2,emotionalSafety:2,communication:2,mutuality:2,satisfaction:2,attachment:2},risks:{obsession:0,boundary:0,avoidance:0,instability:0},tags:['mutuality']},
  Lovers:{code:'Lovers',pace:'matched',axes:{attraction:2,desire:2,initiative:1,receptivity:2,emotionalSafety:2,communication:2,mutuality:2,satisfaction:2,attachment:2},risks:{obsession:0,boundary:0,avoidance:0,instability:0},tags:['chemistry']},
  'High Priestess':{code:'High Priestess',pace:'slow',axes:{attraction:1,desire:1,initiative:-2,receptivity:1,emotionalSafety:1,communication:0,mutuality:0,satisfaction:1,attachment:1},risks:{obsession:0,boundary:0,avoidance:1,instability:0},tags:['hidden_desire']}
};

const window = {LUNEA_INTIMACY_V34:{getCard(code){return tarot[code] || null;}}};
window.window = window;
vm.runInNewContext(source,{window,console,Object,Array,Map,Set,String,Number});

const api = window.LUNEA_INTIMACY_ORACLE_V35;
assert.ok(api,'oracle API missing');
assert.equal(api.version,'35.2');
assert.equal(Object.keys(api.cards).length,36);
assert.equal(Object.keys(api.families).length,6);

const expectedTitles = ['ATTRACTION','CHEMISTRY','CRAVING','TEMPTATION','CURIOSITY','PASSION','TRUST','SAFETY','TENDERNESS','OPENNESS','VULNERABILITY','AFTERGLOW','INITIATION','SURRENDER','RHYTHM','EXPLORATION','PATIENCE','RECEPTIVITY','HESITATION','DISTANCE','MISMATCH','FRUSTRATION','REPRESSION','WITHDRAWAL','BOUNDARY','CONTROL','SECRECY','OBSESSION','DEPENDENCY','IMBALANCE','BONDING','ATTACHMENT','RECONNECTION','DEEPENING','SATISFACTION','RELEASE'];
const cards = Object.values(api.cards);
assert.deepEqual(cards.map(card=>card.code),Array.from({length:36},(_,i)=>`O${String(i+1).padStart(2,'0')}`));
assert.deepEqual(cards.map(card=>card.enTitle),expectedTitles);
assert.equal(new Set(cards.map(card=>card.koTitle)).size,36);
for(const family of Object.keys(api.families)) assert.equal(cards.filter(card=>card.family===family).length,6,`${family} must contain six cards`);

for(const card of cards){
  assert.ok(['supportive','mixed','caution'].includes(card.tone));
  assert.equal(Object.keys(card.axes).length,9);
  assert.equal(Object.keys(card.risks).length,4);
  Object.values(card.axes).forEach(value=>assert.ok(value>=-3&&value<=3));
  Object.values(card.risks).forEach(value=>assert.ok(value>=0&&value<=3));
  assert.ok(card.light.length>=20);
  assert.ok(card.shadow.length>=20);
  assert.match(card.asset,/assets\/intimacy-oracle\/oracle_atlas_v36\.jpg$/);
  assert.equal(card.sprite.columns,6);
  assert.equal(card.sprite.rows,6);
  assert.ok(card.sprite.column>=0&&card.sprite.column<=5);
  assert.ok(card.sprite.row>=0&&card.sprite.row<=5);
}

const obsession = api.combinePair('Devil','O28');
assert.ok(obsession.rules.some(rule=>rule.id==='magnetic_but_compulsive'));
assert.ok(obsession.rules.some(rule=>rule.id==='attraction_boundary_conflict'));
assert.equal(obsession.risks.obsession.level,'high');
assert.equal(obsession.risks.boundary.level,'high');

const synchrony = api.combinePair('Sun','O15');
assert.ok(synchrony.rules.some(rule=>rule.id==='mutual_fit'));
assert.equal(synchrony.pace.relation,'aligned');

const mismatch = api.combinePair('Lovers','O21');
assert.ok(mismatch.rules.some(rule=>rule.id==='rhythm_mismatch'));
assert.equal(mismatch.axes.mutuality.signal,'conflict');

const blocked = api.combinePair('HighPriestess','O23');
assert.ok(blocked.rules.some(rule=>rule.id==='desire_blocked'));

const stack = api.combineOracleCards(['O28','O29','O30']);
assert.ok(stack.repeatedFamilies.includes('boundary'));
assert.match(stack.cautionRule,/경고 카드/);

const contract = api.promptContract();
assert.match(contract,/모순되는 신호는 평균내지 않는다/);
assert.match(contract,/attachment와 satisfaction을 분리/);
assert.match(contract,/현실의 동의를 증명하지 않는다/);
assert.doesNotMatch(contract,/%/);

console.log('LUNEA INTIMACY ORACLE V35.2 canonical data/combination contract: PASS');
