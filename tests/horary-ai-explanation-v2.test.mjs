import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const bridgeSource = fs.readFileSync('lunea-horary-interpretation-bridge-v47.js','utf8');
const uiSource = fs.readFileSync('lunea-horary-ai-explanation-v2.js','utf8');

assert.match(bridgeSource, /AI EXPLANATION V2 · EVIDENCE-LINKED/, 'Explanation V2 prompt contract missing');
assert.match(bridgeSource, /“판정:”/, 'judgment label contract missing');
assert.match(bridgeSource, /“근거:”/, 'evidence link contract missing');
assert.match(bridgeSource, /“반증:”/, 'counter-evidence contract missing');
assert.match(bridgeSource, /“불확실성:”/, 'uncertainty contract missing');
assert.match(bridgeSource, /평균·합산·절충하지 않는다/, 'Prashna independence contract missing');
assert.match(bridgeSource, /VALIDATOR ALLOWED ALIASES/, 'validator alias contract missing');
assert.match(bridgeSource, /기하학적으로 접근 중/, 'out-of-orb wording contract missing');
assert.match(bridgeSource, /lunea-horary-ai-explanation-v2\.js/, 'Explanation V2 loader missing');
assert.match(uiSource, /never recalculates Horary \/ Prashna \/ Cross facts/, 'presentation-only invariant missing');
assert.doesNotMatch(uiSource, /fetch\s*\(/, 'presentation layer must not own network requests');
assert.doesNotMatch(uiSource, /localStorage\./, 'presentation layer must not own storage');

const bridgeDocument = {
  readyState:'loading',
  currentScript:{src:'https://example.test/lunea-horary-interpretation-bridge-v47.js?v=test-build'},
  addEventListener(){},
  getElementById(){ return null; },
  createElement(){ return {id:'',src:'',async:false,onerror:null}; },
  head:{appendChild(){}},
  documentElement:{appendChild(){}}
};
const passthroughFetch = async () => ({ok:true});
const bridgeWindow = {
  fetch:passthroughFetch,
  LUNEA_HORARY_INTERPRETATION_V47:{
    aiPrompt(){ return 'LUNEA HORARY INTERPRETATION ENGINE V2\n[HORARY ENGINE RESULT · AUTHORITATIVE]\ndirect perfection: NO'; }
  }
};
const bridgeContext = {
  window:bridgeWindow,
  document:bridgeDocument,
  URL,
  console:{info(){},error(){}},
  setTimeout(){},
  structuredClone:globalThis.structuredClone
};
vm.runInNewContext(bridgeSource, bridgeContext, {filename:'lunea-horary-interpretation-bridge-v47.js'});
const bridge = bridgeWindow.LUNEA_HORARY_INTERPRETATION_BRIDGE_V47;
assert.ok(bridge, 'bridge API missing');
assert.equal(bridge.version, '47.4');

const base = 'LUNEA HORARY INTERPRETATION ENGINE V2\n[HORARY ENGINE RESULT · AUTHORITATIVE]\ndirect perfection: NO';
const locked = bridge.qualityLockedPrompt(base);
assert.match(locked, /FINAL VERDICT LOCK · V2 QA/);
assert.match(locked, /AI EXPLANATION V2 · EVIDENCE-LINKED/);
assert.equal((locked.match(/AI EXPLANATION V2 · EVIDENCE-LINKED/g) || []).length, 1, 'Explanation lock must be idempotent');
assert.equal(bridge.qualityLockedPrompt(locked), locked, 'quality lock should not duplicate itself');

const crossBase = `LUNEA HORARY INTERPRETATION ENGINE V2
[HORARY ENGINE RESULT · AUTHORITATIVE]
AUTHORITATIVE JUDGMENT: NO · direct perfection: NO
[HORARY ↔ PRASHNA CROSS INTERPRETATION V2 · AUTHORITATIVE]
Horary: 7H square · Reception: mutual
Prashna: subject_lord_dignity`;
const crossLocked = bridge.qualityLockedPrompt(crossBase);
assert.match(crossLocked, /aspect: square · 사각 · 스퀘어/);
assert.match(crossLocked, /Reception: mutual · 상호 리셉션/);
assert.equal((crossLocked.match(/\[VALIDATOR ALLOWED ALIASES · 출력 금지\]/g) || []).length, 1, 'validator aliases must be emitted once');
assert.equal(bridge.qualityLockedPrompt(crossLocked), crossLocked, 'validator aliases must be idempotent');

const rewritten = bridge.rewrite({
  method:'POST',
  body:JSON.stringify({contents:[{parts:[{text:base}]}]})
});
const rewrittenPrompt = JSON.parse(rewritten.body).contents[0].parts[0].text;
assert.match(rewrittenPrompt, /FINAL VERDICT LOCK · V2 QA/);
assert.match(rewrittenPrompt, /AI EXPLANATION V2 · EVIDENCE-LINKED/);

const uiDocument = {readyState:'loading',addEventListener(){}};
const uiWindow = {};
vm.runInNewContext(uiSource, {
  window:uiWindow,
  document:uiDocument,
  console:{info(){}},
  setTimeout(){},
  requestAnimationFrame:null
}, {filename:'lunea-horary-ai-explanation-v2.js'});
const ui = uiWindow.LUNEA_HORARY_AI_EXPLANATION_V2;
assert.ok(ui, 'Explanation V2 presentation API missing');
assert.equal(ui.version, '2.0');
assert.equal(ui.isTransient('계산 근거를 질문 원문에 맞춰 판정하는 중…'), true);

const assessment = ui.assessText(`### 한줄 결론\n판정: 연락 사건 근거는 있으나 관계 성사는 별도다.\n근거: derived-event axis만 유효하다.\n반증: direct perfection은 없다.\n### Horary ↔ Prashna 교차\n두 체계는 독립적으로 읽는다.\n### 신뢰도와 불확실성\n불확실성: 현실 사건 시점은 보장하지 않는다.`);
assert.equal(assessment.final, true);
assert.equal(assessment.evidenceLinked, true);
assert.equal(assessment.counterEvidence, true);
assert.equal(assessment.uncertainty, true);
assert.equal(assessment.prashnaSeparated, true);

console.log('Horary AI Explanation V2 · evidence-linked contract OK');