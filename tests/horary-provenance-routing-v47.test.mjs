import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const postSource = fs.readFileSync(new URL('../lunea-horary-post-actions-v44.js', import.meta.url), 'utf8');
const bridgeSource = fs.readFileSync(new URL('../lunea-horary-interpretation-bridge-v47.js', import.meta.url), 'utf8');
const validatorSource = fs.readFileSync(new URL('../lunea-horary-answer-validator-v48.js', import.meta.url), 'utf8');

const classes = (...initial) => {
  const values = new Set(initial);
  return {contains(value){ return values.has(value); }, add(value){ values.add(value); }};
};

const nodes = {
  astroHoraryQuestion:{value:'이 계약은 성사될까?'},
  astroHoraryMoment:{value:'2026-10-12T19:00'},
  astroHoraryPlace:{value:'Seoul'},
  astroHoraryTopic:{value:'general'},
  astroHoraryResult:{
    classList:classes('show'),
    innerText:'LEGACY SCREEN RESULT · this must be replaced only for the dedicated action',
    textContent:'LEGACY SCREEN RESULT · this must be replaced only for the dedicated action'
  }
};
const sent = [];
const document = {
  readyState:'complete',
  getElementById(id){ return nodes[id] || null; },
  addEventListener(){},
  createElement(){ return {style:{}, setAttribute(){}, remove(){}}; },
  head:{appendChild(){}},
  documentElement:{appendChild(){}}
};
const canonical = `LUNEA HORARY INTERPRETATION ENGINE V2
[질문 원문]
이 계약은 성사될까?

[질문 분류]
- family: general

[HORARY ENGINE RESULT · AUTHORITATIVE]
AUTHORITATIVE JUDGMENT: YES · direct perfection: YES · confirmed obstruction: none

[절대 금지]
- 엔진 밖 사실을 만들지 마라.`;
const validAnswer = `### 한줄 결론
성사될 가능성이 높아. 근거: AUTHORITATIVE JUDGMENT: YES`;
const context = {
  window:null,
  document,
  URL,
  Response,
  structuredClone:globalThis.structuredClone,
  Date,
  console:{info(){}, warn(){}, error(){}},
  setTimeout(){ return 0; },
  setInterval(){ return 0; },
  clearInterval(){},
  fetch:async (input, init) => {
    sent.push({input, init});
    return new Response(JSON.stringify({candidates:[{content:{parts:[{text:validAnswer}]}}]}), {status:200});
  },
  LUNEA_HORARY_INTERPRETATION_V47:{aiPrompt(){ return canonical; }}
};
context.window = context;
vm.createContext(context);

// This is the active runtime order: V44 creates the dedicated prompt, V47
// canonicalizes that provenance, and V48 validates the response as its outer
// fetch wrapper. No browser or real model is involved.
vm.runInContext(postSource, context, {filename:'lunea-horary-post-actions-v44.js'});
const dedicatedPrompt = context.LUNEA_HORARY_POST_ACTIONS_V44.aiPrompt();
assert.match(dedicatedPrompt, /^\[LUNEA HORARY AI REQUEST V47\]/);
assert.match(dedicatedPrompt, /LEGACY SCREEN RESULT/);
vm.runInContext(bridgeSource, context, {filename:'lunea-horary-interpretation-bridge-v47.js'});
vm.runInContext(validatorSource, context, {filename:'lunea-horary-answer-validator-v48.js'});

await context.fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini:test:generateContent', {
  method:'POST',
  body:JSON.stringify({contents:[{parts:[{text:dedicatedPrompt}]}]})
});
assert.equal(sent.length, 1, 'a valid dedicated Horary answer must remain single-pass');
const dedicatedBody = JSON.parse(sent[0].init.body).contents[0].parts[0].text;
assert.match(dedicatedBody, /^\[LUNEA HORARY AI REQUEST V47\]\nLUNEA HORARY INTERPRETATION ENGINE V2/);
assert.match(dedicatedBody, /\[FINAL VERDICT LOCK · V2 QA\]/);
assert.match(dedicatedBody, /\[AI EXPLANATION V2 · EVIDENCE-LINKED\]/);
assert.doesNotMatch(dedicatedBody, /LEGACY SCREEN RESULT/);
assert.equal(context.__LUNEA_LAST_HORARY_VALIDATION_V48__.stage, 'first');
assert.equal(context.__LUNEA_LAST_HORARY_VALIDATION_V48__.ok, true);

// General Tarot can include legacy Horary support, but it has no dedicated
// action provenance. Its original cards and positions must reach fetch intact.
const tarotPrompt = `[뽑힌 카드]\n연인\n[포지션]\n현재\n[질문]\n그와의 관계를 어떻게 이해할까?\n\n[HORARY V1 · 질문시각 점성술 계산 결과]\n보조 참고만 하고 타로를 덮어쓰지 마라.`;
await context.fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini:test:generateContent', {
  method:'POST',
  body:JSON.stringify({contents:[{parts:[{text:tarotPrompt}]}]})
});
assert.equal(sent.length, 2, 'Tarot prompt remains a single untouched request');
assert.equal(JSON.parse(sent[1].init.body).contents[0].parts[0].text, tarotPrompt);
assert.match(JSON.parse(sent[1].init.body).contents[0].parts[0].text, /연인/);
assert.match(JSON.parse(sent[1].init.body).contents[0].parts[0].text, /현재/);

const quotedMarkerPrompt = tarotPrompt.replace('그와의 관계를 어떻게 이해할까?', '"[LUNEA HORARY AI REQUEST V47]"라는 문구를 봤는데 그와의 관계는?');
assert.equal(context.LUNEA_HORARY_INTERPRETATION_BRIDGE_V47.isHoraryPrompt(quotedMarkerPrompt), false);
assert.equal(context.LUNEA_HORARY_ANSWER_VALIDATOR_V48.isHoraryPrompt(quotedMarkerPrompt), false);
const priorValidation = context.__LUNEA_LAST_HORARY_VALIDATION_V48__;
await context.fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini:test:generateContent', {
  method:'POST', body:JSON.stringify({contents:[{parts:[{text:quotedMarkerPrompt}]}]})
});
assert.equal(sent.length, 3);
assert.equal(JSON.parse(sent[2].init.body).contents[0].parts[0].text, quotedMarkerPrompt);
assert.equal(context.__LUNEA_LAST_HORARY_VALIDATION_V48__, priorValidation, 'quoted user text cannot activate Horary validator');
assert.match(context.LUNEA_HORARY_INTERPRETATION_BRIDGE_V47.withHoraryProvenance(quotedMarkerPrompt), /^\[LUNEA HORARY AI REQUEST V47\]\n/);

console.log('Horary provenance routing V47/V48 VM regression: PASS');
