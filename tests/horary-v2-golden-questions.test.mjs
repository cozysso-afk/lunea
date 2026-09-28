import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const modeSource = read('lunea-horary-question-modes-v37.js');
const engineSource = read('lunea-horary-interpretation-engine-v47.js');
const bridgeSource = read('lunea-horary-interpretation-bridge-v47.js');

// Load the real V37 classifier without booting the browser UI.
const bootIndex = modeSource.indexOf('  function boot() {');
assert.ok(bootIndex > 0, 'V37 boot boundary should exist');
const modeHarnessSource = modeSource.slice(0, bootIndex) + `
  W.__HORARY_V37_CLASSIFY_FOR_TEST__ = classifyQuestion;
})();\n`;
const modeContext = {window:null, console:{info(){},warn(){},error(){}}};
modeContext.window = modeContext;
vm.createContext(modeContext);
vm.runInContext(modeHarnessSource, modeContext);
const classifyQuestion = modeContext.__HORARY_V37_CLASSIFY_FOR_TEST__;
assert.equal(typeof classifyQuestion, 'function');

const nodes = new Map([
  ['astroHoraryQuestion', {value:''}],
  ['astroHoraryTopic', {value:'general'}],
  ['astroHoraryResult', {
    innerText:'AUTHORITATIVE JUDGMENT: NO · direct perfection: NO · derived event axis: VALID · Reception: mutual · nearest geometric aspect: out-of-orb · confirmed obstruction: none · timing unit: unavailable',
    textContent:'AUTHORITATIVE JUDGMENT: NO · direct perfection: NO · derived event axis: VALID · Reception: mutual · nearest geometric aspect: out-of-orb · confirmed obstruction: none · timing unit: unavailable',
    classList:{contains(name){return name === 'show';}}
  }]
]);

const engineContext = {
  window:null,
  console:{info(){},warn(){},error(){}},
  document:{getElementById(id){return nodes.get(id) || null;}},
  LUNEA_HORARY_QUESTION_MODES_V37:{classifyQuestion},
};
engineContext.window = engineContext;
vm.createContext(engineContext);
vm.runInContext(engineSource, engineContext);
const engine = engineContext.LUNEA_HORARY_INTERPRETATION_V47;
assert.ok(engine);

const bridgeContext = {
  window:null,
  console:{info(){},warn(){},error(){}},
  URL,
  structuredClone:globalThis.structuredClone,
  fetch:async()=>({ok:true}),
};
bridgeContext.window = bridgeContext;
vm.createContext(bridgeContext);
vm.runInContext(bridgeSource, bridgeContext);
const bridge = bridgeContext.LUNEA_HORARY_INTERPRETATION_BRIDGE_V47;
assert.ok(bridge);

const cases = [
  {id:'contact_timing', q:'그가 이번 주 안에 나에게 먼저 연락할까?', family:'contact', mode:'timing', must:['상대의 3H=radical 9H','마음은 긍정인데 행동근거가 약하면']},
  {id:'contact_reply', q:'그가 내 메시지에 답장할까?', family:'contact', mode:'outcome', must:['derived event axis','실제 연락 행동']},
  {id:'reconciliation', q:'우리가 다시 만날 수 있을까?', family:'reconciliation', mode:'outcome', must:['연락 가능성','관계 회복 가능성']},
  {id:'relationship', q:'그 사람과 다시 사귈 수 있을까?', family:'reconciliation', mode:'outcome', must:['1H↔7H','재회축']},
  {id:'descriptive', q:'그 사람의 속마음과 현재 감정은 어떤가?', family:'descriptive', mode:'descriptive', must:['### 상태·감정·수용성','단정적 심리묘사로 확대하지']},
  {id:'exam', q:'이번 자격증 시험에 합격할까?', family:'exam', mode:'outcome', must:['합격이라는 사건 성사','능력 근거만으로 합격을 확정하지']},
  {id:'career', q:'이직해서 새 회사에 들어갈 수 있을까?', family:'career', mode:'outcome', must:['직업/고용/상대 기관 축','실제 채용/계약/승인']},
  {id:'money', q:'보유 주식을 지금 매도하면 수익이 날까?', family:'money', mode:'outcome', must:['가격 방향이나 수익률을 차트에 없는 숫자로 만들지','금전·투자']},
  {id:'timing', q:'이 계획은 언제 성사될까?', family:'timing', mode:'timing', must:['각도 차이를 임의로 일/주/달로 환산하지','### Moon과 전개·시기']},
  {id:'location', q:'잃어버린 반지는 집 안 어디에 있을까?', family:'location', mode:'location', must:['### 위치 핵심 단서','물리적 위치 단서']},
  {id:'comparison', q:'A회사와 B회사 중 어느 쪽이 더 나을까?', family:'comparison', mode:'comparison', must:['### 비교 기준','동일 기준으로 후보를 나란히']},
  {id:'multi_person', q:'두 사람 중 어느 상대가 나에게 더 마음이 있나?', family:'multi_person', mode:'multi_person', must:['다중 인물 보호','A=7H, B=5H']},
  {id:'general', q:'이 계획은 결국 성사될까?', family:'general', mode:'outcome', must:['direct/derived/indirect perfection','### 한줄 결론']},
];

let passed = 0;
for (const row of cases) {
  nodes.get('astroHoraryQuestion').value = row.q;
  nodes.get('astroHoraryTopic').value = 'general';
  delete engineContext.LUNEA_PRASHNA_V1;

  const actualMode = engine.questionMode(row.q);
  const actualFamily = engine.classifyFamily(row.q, 'general', actualMode).key;
  assert.equal(actualMode, row.mode, `${row.id}: mode`);
  assert.equal(actualFamily, row.family, `${row.id}: family`);

  const prompt = engine.aiPrompt();
  assert.match(prompt, new RegExp(`family: ${row.family} ·`), `${row.id}: family must be visible in prompt`);
  assert.match(prompt, /AUTHORITATIVE JUDGMENT: NO/, `${row.id}: engine result must be preserved verbatim`);
  assert.match(prompt, /nearest geometric aspect를 valid perfection으로 바꾸지 마라/, `${row.id}: geometric aspect guard`);
  assert.match(prompt, /엔진에 없는 “3도니까 3일\/3주” 같은 단위 변환을 발명하지 않는다/, `${row.id}: timing invention guard`);
  assert.match(prompt, /각 핵심 판단에는 바로 뒤에 “근거:”/, `${row.id}: evidence label contract`);
  for (const text of row.must) assert.ok(prompt.includes(text), `${row.id}: missing family contract: ${text}`);

  const locked = bridge.qualityLockedPrompt(prompt);
  assert.match(locked, /\[FINAL VERDICT LOCK · V2 QA\]/, `${row.id}: final verdict lock`);
  assert.match(locked, /NO\/부정\/근거부족 판정을 reception·dignity·Moon 분위기만으로 YES\/긍정으로 올리지 마라/, `${row.id}: NO must stay NO`);
  assert.match(locked, /direct perfection이 없고 derived-event perfection만 유효하면 그 파생 사건만 긍정/, `${row.id}: derived-event scope lock`);
  assert.match(locked, /confirmed obstruction: none/, `${row.id}: no invented obstruction`);
  assert.match(locked, /out-of-orb \/ geometric-only \/ nearest aspect/, `${row.id}: out-of-orb lock`);
  assert.match(locked, /달력 날짜나 N일\/N주\/N개월 수치를 새로 쓰지 마라/, `${row.id}: timing number lock`);
  assert.match(locked, /PRIVATE SELF-CHECK · 출력 금지/, `${row.id}: private preflight`);
  passed++;
}

// Prashna must be appended only after Horary and explicitly treated as a cross-check.
nodes.get('astroHoraryQuestion').value = '그가 나에게 연락할까?';
engineContext.LUNEA_PRASHNA_V1 = {promptBlock(){return '[PRASHNA V1]\nPrashna result: conflicting direction';}};
const prashnaPrompt = engine.aiPrompt();
const lockedPrashna = bridge.qualityLockedPrompt(prashnaPrompt);
assert.ok(prashnaPrompt.indexOf('[HORARY ENGINE RESULT · AUTHORITATIVE]') < prashnaPrompt.indexOf('[PRASHNA V1]'));
assert.match(prashnaPrompt, /Horary를 먼저 독립적으로 결론낸 뒤 Prashna를 별도로 요약한다/);
assert.match(lockedPrashna, /Prashna가 Horary와 다르면 평균·절충 결론을 만들지 말고 체계 간 충돌/);

console.log(`LUNEA Horary V2 golden question QA: ${passed}/${cases.length} PASS`);
