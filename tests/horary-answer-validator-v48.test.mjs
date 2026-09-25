import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-horary-answer-validator-v48.js', import.meta.url), 'utf8');
const bridgeSource = fs.readFileSync(new URL('../lunea-horary-interpretation-bridge-v47.js', import.meta.url), 'utf8');

assert.match(source, /HORARY ANSWER VALIDATOR V48/);
assert.match(source, /retry-once guard ON/);
assert.match(source, /verdict_direction/);
assert.match(source, /derived_scope/);
assert.match(source, /invented_obstruction/);
assert.match(source, /out_of_orb_promotion/);
assert.match(source, /invented_probability/);
assert.match(source, /invented_timing/);
assert.match(source, /prashna_averaging/);
assert.match(bridgeSource, /lunea-horary-answer-validator-v48\.js/);

const basePrompt = `LUNEA HORARY INTERPRETATION ENGINE V2
[질문 원문]
우리가 다시 만날 수 있을까?

[질문 분류]
- family: reconciliation · 재회·관계 회복
- mode: outcome
- topic: general

[HORARY ENGINE RESULT · AUTHORITATIVE]
AUTHORITATIVE JUDGMENT: NO · direct perfection: NO · derived event axis: VALID · Reception: mutual · nearest geometric aspect: out-of-orb · confirmed obstruction: none · timing unit: unavailable

[절대 금지]
- 엔진 밖 사실을 만들지 마라.`;

function makeContext(fetchImpl, prompt = basePrompt) {
  const context = {
    window:null,
    console:{info(){},warn(){},error(){}},
    URL,
    Response,
    structuredClone:globalThis.structuredClone,
    Date,
    fetch:fetchImpl,
    LUNEA_HORARY_INTERPRETATION_V47:{aiPrompt(){return prompt;}},
    LUNEA_HORARY_INTERPRETATION_BRIDGE_V47:{qualityLockedPrompt(value){return value;}}
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

const staticContext = makeContext(async () => new Response('{}', {status:200}));
const api = staticContext.LUNEA_HORARY_ANSWER_VALIDATOR_V48;
assert.ok(api);
assert.equal(api.version, '48.0');

const bad = `### 한줄 결론
재회 가능성이 높고 결국 성사될 가능성이 큽니다.

### 실제 성사·행동 근거
유효 오브 밖의 기하학적 각이 성사각으로 작동합니다. 근거: nearest aspect
prohibition이 작동해 잠시 막습니다. 근거: 추정
3주 안, 9월 30일 전후로 70% 정도입니다. 근거: timing`;
const badCheck = api.validate(bad, basePrompt);
assert.equal(badCheck.ok, false);
const badCodes = new Set(badCheck.violations.map(row => row.code));
for (const code of ['verdict_direction','derived_scope','invented_obstruction','out_of_orb_promotion','invented_probability','invented_timing']) {
  assert.ok(badCodes.has(code), `expected ${code}`);
}

const safe = `### 한줄 결론
재회 자체는 현재 계산만으로 긍정할 수 없어. 근거: AUTHORITATIVE JUDGMENT: NO

### 실제 성사·행동 근거
직접 성사 근거는 없고 파생 사건축만 유효하므로, 파생 사건을 재회 성사로 확대하지 않아. 근거: direct perfection: NO · derived event axis: VALID

### 의향·감정·수용성
상호 리셉션은 수용성 근거지만 사건 성사를 대신하지 않아. 근거: Reception: mutual

### 방해·반증 근거
확정 방해는 확인되지 않아. 근거: confirmed obstruction: none

### 신뢰도와 불확실성
유효 오브 밖의 nearest aspect는 성사각으로 채택하지 않아. 근거: out-of-orb`;
assert.equal(api.validate(safe, basePrompt).ok, true);

const prashnaPrompt = `${basePrompt}\n\n[PRASHNA V1]\nPrashna result: conflicting direction`;
const averaged = `${safe}\n\n### Horary ↔ Prashna 교차\n두 체계를 평균해서 절충 결론을 내립니다. 근거: 두 체계`;
const prashnaCheck = api.validate(averaged, prashnaPrompt);
assert.ok(prashnaCheck.violations.some(row => row.code === 'prashna_averaging'));

const leaked = `${safe}\nPRIVATE SELF-CHECK`;
assert.ok(api.validate(leaked, basePrompt).violations.some(row => row.code === 'private_instruction_leak'));

// Runtime: first bad answer is discarded, a corrected request is sent once, and the corrected answer is returned.
let calls = [];
const badPayload = {candidates:[{content:{parts:[{text:bad}]}}]};
const safePayload = {candidates:[{content:{parts:[{text:safe}]}}]};
const runtime = makeContext(async (input, init) => {
  calls.push({input, init});
  const payload = calls.length === 1 ? badPayload : safePayload;
  return new Response(JSON.stringify(payload), {status:200, headers:{'content-type':'application/json'}});
});
const requestBody = JSON.stringify({contents:[{parts:[{text:'[HORARY V1 · 질문시각 점성술 계산 결과]\nlegacy prompt'}]}]});
const response = await runtime.fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini:test:generateContent', {method:'POST', body:requestBody});
const returned = await response.json();
assert.equal(calls.length, 2, 'invalid first answer should retry exactly once');
assert.equal(returned.candidates[0].content.parts[0].text, safe);
const retryBody = JSON.parse(calls[1].init.body);
assert.match(retryBody.contents[0].parts[0].text, /HORARY ANSWER VALIDATOR V48 · RETRY/);
assert.match(retryBody.contents[0].parts[0].text, /verdict_direction/);
assert.equal(runtime.__LUNEA_LAST_HORARY_VALIDATION_V48__.stage, 'retry');
assert.equal(runtime.__LUNEA_LAST_HORARY_VALIDATION_V48__.ok, true);

// Runtime: if the retry also fails, do not surface the bad prose; return a deterministic safe hold.
let failedCalls = 0;
const heldRuntime = makeContext(async () => {
  failedCalls += 1;
  return new Response(JSON.stringify(badPayload), {status:200, headers:{'content-type':'application/json'}});
});
const heldResponse = await heldRuntime.fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini:test:generateContent', {method:'POST', body:requestBody});
const heldData = await heldResponse.json();
const heldText = heldData.candidates[0].content.parts[0].text;
assert.equal(failedCalls, 2);
assert.match(heldText, /자동 검증을 두 번 통과하지 못해 이번 해설은 보류/);
assert.doesNotMatch(heldText, /70%/);
assert.equal(heldData.lunea_validator.status, 'held');
assert.equal(heldRuntime.__LUNEA_LAST_HORARY_VALIDATION_V48__.stage, 'held');

// Non-Horary Gemini requests must remain single-pass and untouched.
let otherCalls = 0;
const otherRuntime = makeContext(async () => {
  otherCalls += 1;
  return new Response(JSON.stringify({candidates:[{content:{parts:[{text:'TAROT OK'}]}}]}), {status:200});
});
const otherBody = JSON.stringify({contents:[{parts:[{text:'TAROT READING ONLY'}]}]});
const otherResponse = await otherRuntime.fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini:test:generateContent', {method:'POST', body:otherBody});
assert.equal(otherCalls, 1);
assert.equal((await otherResponse.json()).candidates[0].content.parts[0].text, 'TAROT OK');

console.log('LUNEA Horary Answer Validator V48 runtime regression: PASS');
