import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const engineSource = fs.readFileSync(new URL('../lunea-horary-interpretation-engine-v47.js', import.meta.url), 'utf8');
const bridgeSource = fs.readFileSync(new URL('../lunea-horary-interpretation-bridge-v47.js', import.meta.url), 'utf8');
const loaderSource = fs.readFileSync(new URL('../lunea-cache-refresh-v1.js', import.meta.url), 'utf8');

assert.match(engineSource, /HORARY INTERPRETATION ENGINE V47 · V2/);
assert.match(engineSource, /상대의 3H=radical 9H/);
assert.match(engineSource, /reception.*실제 연락/i);
assert.match(engineSource, /Translation of Light \/ Collection of Light/);
assert.match(engineSource, /confirmed prohibition \/ frustration \/ refranation/);
assert.match(engineSource, /정확각\(exact aspect\).*현실 사건 발생 보장시각/);
assert.match(engineSource, /엔진에 없는 “3도니까 3일\/3주” 같은 단위 변환을 발명하지 않는다/);
assert.match(engineSource, /마음\/호감\/수용성/);
assert.match(engineSource, /실제로 연락함\/만남\/합격\/계약\/재회함/);
assert.match(engineSource, /근거:/);
assert.match(engineSource, /체계 간 충돌/);
assert.match(loaderSource, /lunea-horary-interpretation-engine-v47\.js/);
assert.match(loaderSource, /lunea-horary-interpretation-bridge-v47\.js/);
assert.match(loaderSource, /script\.onload = \(\) => loadBuildScopedScript\('luneaHoraryInterpretationBridgeV47Loader'/);

const nodes = new Map([
  ['astroHoraryQuestion', {value:'그가 이번 주 안에 나에게 먼저 연락할까?'}],
  ['astroHoraryTopic', {value:'contact'}],
  ['astroHoraryResult', {
    innerText:'TRADITIONAL CORE V6 · direct perfection: NO · derived event axis present · Reception: mutual · confirmed obstruction: none',
    textContent:'TRADITIONAL CORE V6 · direct perfection: NO · derived event axis present · Reception: mutual · confirmed obstruction: none',
    classList:{contains(name){return name === 'show';}}
  }]
]);
const context = {
  console,
  document:{getElementById(id){return nodes.get(id) || null;}},
  window:null,
};
context.window = context;
context.LUNEA_HORARY_HARDENING_V38 = {effectiveMode(){return {key:'outcome'};}};
vm.createContext(context);
vm.runInContext(engineSource, context);

const api = context.LUNEA_HORARY_INTERPRETATION_V47;
assert.ok(api, 'V47 interpretation API should install');
assert.equal(api.classifyFamily().key, 'contact');
const prompt = api.aiPrompt();
assert.match(prompt, /family: contact · 연락·메시지/);
assert.match(prompt, /질문자=1H, 상대=7H, 상대의 연락행위=상대의 3H=radical 9H/);
assert.match(prompt, /Reception = 의향·수용성·관계적 태도/);
assert.match(prompt, /유효 direct perfection/);
assert.match(prompt, /derived event axis/);
assert.match(prompt, /잠재 개입 후보를 confirmed prohibition\/frustration으로 승격하지 마라/);
assert.match(prompt, /마음은 긍정인데 행동근거가 약하면 그 모순을 그대로 쓴다/);
assert.match(prompt, /### 실제 성사·행동 근거/);

let captured = null;
const bridgeContext = {
  console,
  URL,
  window:null,
  structuredClone: globalThis.structuredClone,
  fetch: async (input, init) => { captured = {input, init}; return {ok:true}; },
  LUNEA_HORARY_INTERPRETATION_V47:{aiPrompt(){return 'LUNEA HORARY INTERPRETATION ENGINE V2\nNEW STRICT PROMPT';}}
};
bridgeContext.window = bridgeContext;
vm.createContext(bridgeContext);
vm.runInContext(bridgeSource, bridgeContext);

const oldHorary = JSON.stringify({contents:[{parts:[{text:'[HORARY V1 · 질문시각 점성술 계산 결과]\nOLD'}]}]});
await bridgeContext.fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini:test:generateContent', {method:'POST', body:oldHorary});
let sent = JSON.parse(captured.init.body);
assert.equal(sent.contents[0].parts[0].text, 'LUNEA HORARY INTERPRETATION ENGINE V2\nNEW STRICT PROMPT');

const tarotBody = JSON.stringify({contents:[{parts:[{text:'TAROT READING ONLY'}]}]});
await bridgeContext.fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini:test:generateContent', {method:'POST', body:tarotBody});
sent = JSON.parse(captured.init.body);
assert.equal(sent.contents[0].parts[0].text, 'TAROT READING ONLY', 'non-Horary Gemini prompts must stay untouched');

console.log('LUNEA Horary Interpretation Engine V47 · V2 regression: PASS');
