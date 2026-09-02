import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = path => fs.readFileSync(path, 'utf8');
const spread = read('lunea-fixed-spread-depth-v30.js');
const horary = read('lunea-horary-balance-v19-5.js');
const generalOrder = read('lunea-general-order-v30-5.js');
const loader = read('lunea-structural-routing-v4.js');

for (const file of [
  'lunea-fixed-spread-depth-v30.js',
  'lunea-horary-balance-v19-5.js',
  'lunea-general-order-v30-5.js',
  'lunea-structural-routing-v4.js'
]) {
  execFileSync(process.execPath, ['--check', file], {stdio:'pipe'});
}

const expectedSpreads = new Map([
  ['YES / NO', 5],
  ['TIMELINE', 5],
  ['시험 합격운', 6],
  ['직장 내 대인관계 & 평판', 6],
  ['이직 & 커리어 전환', 7],
  ['일반 금전운 & 재물 흐름', 9],
  ['친구·지인 관계 & 주변 인연운', 6],
  ['상대 속마음', 7],
  ['연락운 & 시기', 7],
  ['재회운', 7],
  ['매수 판단', 5],
  ['보유 / 익절', 7],
  ['매도 타이밍', 7],
]);

for (const [title, count] of expectedSpreads) {
  assert.ok(spread.includes(`'${title}': {`), `missing V30 preset: ${title}`);
  const block = spread.slice(spread.indexOf(`'${title}': {`));
  assert.match(block.slice(0, 1800), new RegExp(`count:\\s*${count}\\b`), `wrong count for ${title}`);
}

assert.match(spread, /version:\s*30\.3/, 'V30.3 export missing');
assert.match(spread, /fixedPositions\s*=\s*function/, 'fixedPositions wrapper missing');
assert.match(spread, /el\.dataset\.count\s*=\s*String\(preset\.count\)/, 'menu draw count patch missing');

const moneyBlock = spread.slice(spread.indexOf("'일반 금전운 & 재물 흐름': {"), spread.indexOf("'친구·지인 관계 & 주변 인연운': {"));
for (const axis of ['수입축', '고정비', '누수', '현금여력', '외부위험', '단기흐름', '중기전략']) {
  assert.ok(moneyBlock.includes(axis), `money spread axis missing: ${axis}`);
}
assert.match(moneyBlock, /1~3개월/, 'money spread short-term horizon missing');
assert.match(moneyBlock, /3~6개월/, 'money spread medium-term horizon missing');

const finalGeneralOrder = [
  '질문 맞춤 AI 배열',
  '직접 입력 배열',
  'ONE CARD',
  'YES / NO',
  'TIMELINE',
  '5 CARD · CORE FLOW',
  '6 CARD · FULL VIEW',
  'DEEP FLOW',
  'CELTIC CROSS'
];
let finalLast = -1;
for (const title of finalGeneralOrder) {
  const idx = generalOrder.indexOf(`'${title}'`);
  assert.ok(idx > finalLast, `final GENERAL order wrong around ${title}`);
  finalLast = idx;
}
assert.match(generalOrder, /version:30\.5/, 'GENERAL order V30.5 export missing');

for (const topic of ['reconciliation','contact','relationship','exam','career','stock','money','home','health','legal','friend','travel','contract','purchase','communication']) {
  assert.ok(horary.includes(`return '${topic}'`), `Horary auto topic missing: ${topic}`);
}
assert.match(horary, /version:19\.5/, 'Horary V19.5 export missing');
assert.match(horary, /balance_v31/, 'Horary V3.1 UI bridge missing');
assert.match(horary, /balance_v3/, 'Horary V3 fallback missing');
assert.match(horary, /BALANCE V3\.1/, 'Horary Gemini/UI bridge must expose V3.1 evidence');
assert.match(horary, /translation_of_light/, 'Translation of Light prompt/UI bridge missing');
assert.match(horary, /collection_of_light/, 'Collection of Light prompt/UI bridge missing');
assert.match(horary, /confirmed_obstructions/, 'confirmed obstruction bridge missing');
assert.match(horary, /reception_v31/, 'V3.1 reception bridge missing');
assert.doesNotMatch(horary, /HORARY BALANCE V2 · 최종 판정/, 'V19.5 must not append the old V2 prompt block');
assert.match(horary, /support_score/, 'Horary support score rendering missing');
assert.match(horary, /constraint_score/, 'Horary constraint score rendering missing');
assert.match(horary, /luneaTopicManualV195/, 'manual topic override guard missing');

// Subject-specific houses must win before the generic action word "연락".
const inferStart = horary.indexOf('function inferTopic');
const inferEnd = horary.indexOf('function ensureOptions', inferStart);
const inferBlock = horary.slice(inferStart, inferEnd);
const contactIdx = inferBlock.indexOf("return 'contact'");
for (const topic of ['friend', 'contract', 'exam', 'career', 'stock', 'money', 'home', 'health']) {
  const idx = inferBlock.indexOf(`return '${topic}'`);
  assert.ok(idx >= 0 && idx < contactIdx, `${topic} must route before generic contact`);
}
assert.ok(inferBlock.indexOf("return 'reconciliation'") < contactIdx, 'reconciliation must route before contact');
assert.ok(inferBlock.indexOf("return 'communication'") < contactIdx, 'document/news route must win before generic contact');

assert.match(loader, /lunea-horary-balance-v19-5\.js\?v=1905/, 'V19.5 cache URL missing');
assert.doesNotMatch(loader, /lunea-horary-balance-v19-4\.js\?v=1904/, 'legacy V19.4 bridge must be inactive');
assert.doesNotMatch(loader, /lunea-horary-balance-v18\.js\?v=1803/, 'legacy V18 bridge must be inactive');
assert.doesNotMatch(loader, /lunea-horary-balance-v19\.js\?v=1903/, 'legacy V19.3 bridge must be inactive');
assert.match(loader, /lunea-fixed-spread-depth-v30\.js\?v=3003/, 'V30.3 cache URL missing');
assert.match(loader, /lunea-general-order-v30-5\.js\?v=3005/, 'GENERAL V30.5 cache URL missing');
const spreadIndex = loader.lastIndexOf('lunea-fixed-spread-depth-v30.js?v=3003');
const generalOrderIndex = loader.lastIndexOf('lunea-general-order-v30-5.js?v=3005');
const revealIndex = loader.lastIndexOf('lunea-boot-reveal-v29.js?v=2902');
assert.ok(spreadIndex >= 0 && generalOrderIndex > spreadIndex, 'GENERAL V30.5 must run after spread-depth V30.3');
assert.ok(revealIndex > generalOrderIndex, 'boot reveal must run after final GENERAL order patch');

assert.match(generalOrder, /manual\.dataset\.title\s*=\s*'직접 입력 배열'/, 'manual GENERAL title metadata repair missing');
assert.match(generalOrder, /manual\.dataset\.cat\s*=\s*'GENERAL'/, 'manual GENERAL category metadata repair missing');

console.log('V30.5 GENERAL priority / Horary V19.5 V3.1 contract tests passed');
