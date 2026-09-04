import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const source = fs.readFileSync(new URL('../lunea-intimacy-oracle-ui-v36.js', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../lunea-intimacy-ai-bridge-v34.js', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../.github/workflows/bump-lunea-loader-413.yml', import.meta.url), 'utf8');

const cards = Object.fromEntries(Array.from({length:36},(_,i)=>{
  const code=`O${String(i+1).padStart(2,'0')}`;
  return [code,{code,enTitle:`CARD_${i+1}`,koTitle:`카드${i+1}`,family:'spark',tone:'supportive',pace:'steady',asset:`./assets/intimacy-oracle/cards/oracle_${String(i+1).padStart(2,'0')}.png`,sprite:{column:i%6,row:Math.floor(i/6),columns:6,rows:6}}];
}));
const window={LUNEA_INTIMACY_ORACLE_V35:{cards}}; window.window=window;
vm.runInNewContext(source,{window,console,crypto:webcrypto,Uint32Array,Object,Array,Set,String,Number,RegExp,Math,JSON});
const core=window.LUNEA_INTIMACY_ORACLE_UI_V36_CORE;
assert.ok(core); assert.equal(core.version,'36.2');
assert.doesNotMatch(source,/Math\.random\s*\(/);
assert.match(source,/crypto\.getRandomValues/);

const draw=core.drawOracleCards(3,'리듬 · 경계 · 조율');
assert.equal(draw.length,3);
assert.equal(new Set(draw.map(card=>card.code)).size,3);
assert.deepEqual(Array.from(draw,card=>card.lens),['끌림·욕구 렌즈','리듬·경계 렌즈','유대·여운 렌즈']);
assert.ok(draw.every(card=>card.sprite?.columns===6 && card.sprite?.rows===6));

assert.equal(core.assignOracleForTarotIndex(0,9,'A/B 친밀감 비교',3),0);
assert.equal(core.assignOracleForTarotIndex(2,9,'A/B 친밀감 비교',3),0);
assert.equal(core.assignOracleForTarotIndex(7,9,'A/B 친밀감 비교',3),0);
assert.equal(core.assignOracleForTarotIndex(3,9,'A/B 친밀감 비교',3),1);
assert.equal(core.assignOracleForTarotIndex(5,9,'A/B 친밀감 비교',3),1);
assert.equal(core.assignOracleForTarotIndex(8,9,'A/B 친밀감 비교',3),1);
assert.equal(core.assignOracleForTarotIndex(6,9,'A/B 친밀감 비교',3),2);

const questions=core.fallbackQuestions('A/B 친밀감 비교');
assert.equal(questions.length,3); assert.ok(questions.every(q=>q.length>=20));

assert.doesNotMatch(source,/AI 질문 추천/);
assert.doesNotMatch(source,/generativelanguage\.googleapis\.com/);
assert.doesNotMatch(source,/responseMimeType/);
assert.match(source,/LUNEA_INTIMACY_ORACLE_DRAFT_V1/);
assert.match(source,/intimacyOracle/);
assert.match(source,/buildOraclePromptLayer/);
assert.equal(core.backAsset,'./assets/intimacy-oracle/oracle_back_intimacy_final.png');
assert.equal(core.cardRoot,'./assets/intimacy-oracle/cards');
assert.doesNotMatch(source,/tarot_back_intimacy_final\.png/);

assert.match(bridge,/lunea-intimacy-oracle-v35\.js\?v=352/);
assert.match(bridge,/lunea-intimacy-oracle-ui-v36\.js\?v=3613/);
assert.match(bridge,/__LUNEA_READING_ACTION_ORDER_V33__/);
assert.match(workflow,/'lunea-intimacy-ai-bridge-v34\.js'/);

const pngSig=[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a];
const oracleBack = fs.readFileSync(new URL('../assets/intimacy-oracle/oracle_back_intimacy_final.png', import.meta.url));
assert.ok(oracleBack.length > 100_000,'Oracle back is unexpectedly small');
assert.deepEqual([...oracleBack.subarray(0,8)],pngSig,'Oracle back must be PNG');
for(let i=1;i<=36;i++){
  const name=`oracle_${String(i).padStart(2,'0')}.png`;
  const png=fs.readFileSync(new URL(`../assets/intimacy-oracle/cards/${name}`, import.meta.url));
  assert.ok(png.length>5_000,`${name} is unexpectedly small`);
  assert.deepEqual([...png.subarray(0,8)],pngSig,`${name} must be PNG`);
}
assert.doesNotMatch(source,/oracle_atlas_final/);

console.log('LUNEA INTIMACY ORACLE UI V36 secure draw / A-B / explicit Oracle PNG contract: PASS');
