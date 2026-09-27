import assert from 'node:assert/strict';
import fs from 'node:fs';

const cross = fs.readFileSync(new URL('../lunea-horary-prashna-cross-v2.js', import.meta.url), 'utf8');
const horary = fs.readFileSync(new URL('../astro-horary-v1.js', import.meta.url), 'utf8');
const prashna = fs.readFileSync(new URL('../lunea-prashna-v1.js', import.meta.url), 'utf8');
const post = fs.readFileSync(new URL('../lunea-horary-post-actions-v44.js', import.meta.url), 'utf8');
const interpretation = fs.readFileSync(new URL('../lunea-horary-interpretation-engine-v47.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-horary-location-button-v39.js', import.meta.url), 'utf8');

assert.match(cross, /LUNEA_HORARY_PRASHNA_CROSS_V2/);
assert.match(cross, /\/v1\/horary-prashna\/cross-interpretation/);
assert.match(cross, /relationshipLabel/);
for (const value of ['agreement', 'partial_agreement', 'conflict', 'insufficient']) assert.match(cross, new RegExp(value));
assert.match(cross, /HORARY 결론/);
assert.match(cross, /PRASHNA 결론/);
assert.match(cross, />일치</);
assert.match(cross, />충돌</);
assert.match(cross, />이유</);
assert.match(cross, />불확실성</);
assert.doesNotMatch(cross, /progress-bar|combinedScore|weightedScore/);
assert.match(cross, /점수·등급은 합산하지 않으며 어느 체계도 다른 체계를 덮어쓰지 않아/);

assert.match(loader, /lunea-horary-prashna-cross-v2\.js/);
assert.match(loader, /CROSS_V2_MARKER/);
assert.match(loader, /text\.includes\(CROSS_V2_MARKER\)/);
assert.match(horary, /LUNEA_ASTRO_HORARY_V1/);
assert.match(horary, /getCurrent:\(\) => stateHorary\.result/);
assert.match(horary, /cross_interpretation_v2/);
assert.match(horary, /restoreSnapshot/);
assert.match(prashna, /await W\.LUNEA_HORARY_PRASHNA_CROSS_V2\?\.refresh\?\.\(\)/);
assert.match(prashna, /restoreData/);
assert.match(post, /\[HORARY ↔ PRASHNA · CROSS V2\]/);
assert.match(post, /cross_interpretation_v2/);
assert.match(interpretation, /Cross V2의 relationship·agreements·conflicts/);

for (const forbidden of [
  '없는 aspect, house, reception, Prashna factor를 만들지 않는다',
  '확률 수치나 정확한 날짜를 만들지 않는다',
  '평균·합산·투표하지 않는다',
  '어느 체계가 더 맞다고 선언하지 않는다',
]) assert.ok(cross.includes(forbidden), `missing guard: ${forbidden}`);

console.log('LUNEA Horary ↔ Prashna Cross Interpretation V2 frontend contract: PASS');
