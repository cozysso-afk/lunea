import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-ai-response-guard-v1.js', import.meta.url), 'utf8');
const window = {};
window.window = window;

vm.runInNewContext(source, {
  window,
  AbortController,
  console:{info(){},warn(){},error(){}},
  Map,
  Object,
  Array,
  String,
  Number,
  Error,
  Promise
});

const guard = window.LUNEA_AI_RESPONSE_GUARD_V1;
assert.ok(guard, 'guard API should be exposed');
assert.equal(guard.version, '1.0');

const first = guard.begin('horary','sig-a');
assert.equal(guard.isCurrent(first,'sig-a'), true);
const second = guard.begin('horary','sig-b');
assert.equal(first.signal.aborted, true, 'new request should abort previous request in the same scope');
assert.equal(guard.isLatest(first), false);
assert.equal(guard.isCurrent(second,'sig-b'), true);
assert.equal(guard.isCurrent(second,'sig-a'), false, 'signature mismatch must make response stale');
assert.throws(() => guard.assertCurrent(second,'sig-a'), error => error?.luneaStale === true);
assert.equal(guard.finish(second), true);

const multipart = await guard.parseResponse({
  ok:true,
  status:200,
  async json(){
    return {candidates:[{finishReason:'STOP',content:{parts:[{text:'첫 문장. '},{text:'둘째 문장.'}]}}]};
  }
});
assert.equal(multipart.text, '첫 문장. 둘째 문장.', 'all Gemini text parts must be concatenated');

await assert.rejects(
  guard.parseResponse({ok:true,status:200,async json(){return {candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'잘린 응답'}]}}]};}}),
  /길이 제한/
);

await assert.rejects(
  guard.parseResponse({ok:true,status:200,async json(){return {promptFeedback:{blockReason:'SAFETY'},candidates:[]};}}),
  /차단/
);

await assert.rejects(
  guard.parseResponse({ok:true,status:200,async json(){return {candidates:[{finishReason:'STOP',content:{parts:[]}}]};}}),
  /본문이 비어/
);

await assert.rejects(
  guard.parseResponse({ok:false,status:503,async json(){return {error:{message:'upstream unavailable'}};}}),
  /upstream unavailable/
);

console.log('AI response guard V1 contract: PASS');
