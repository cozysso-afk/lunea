import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const spread = read('lunea-fixed-spread-depth-v30.js');
const horary = read('lunea-horary-balance-v19.js');
const loader = read('lunea-structural-routing-v4.js');

const expectedSpreads = new Map([
  ['YES / NO', 5],
  ['TIMELINE', 5],
  ['시험 합격운', 6],
  ['직장 내 대인관계 & 평판', 6],
  ['이직 & 커리어 전환', 7],
  ['일반 금전운 & 재물 흐름', 6],
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
  assert.match(block.slice(0, 1200), new RegExp(`count:\\s*${count}\\b`), `wrong count for ${title}`);
}

assert.match(spread, /version:\s*30\.2/, 'V30.2 export missing');
assert.match(spread, /fixedPositions\s*=\s*function/, 'fixedPositions wrapper missing');
assert.match(spread, /el\.dataset\.count\s*=\s*String\(preset\.count\)/, 'menu draw count patch missing');

for (const topic of ['reconciliation','contact','relationship','exam','career','stock','money','home','health','legal','friend','travel','contract','purchase','communication']) {
  assert.ok(horary.includes(`return '${topic}'`), `Horary auto topic missing: ${topic}`);
}
assert.match(horary, /version:19\.2/, 'Horary V19.2 export missing');
assert.match(horary, /balance_v3/, 'Horary V3 UI bridge missing');
assert.match(horary, /support_score/, 'Horary support score rendering missing');
assert.match(horary, /constraint_score/, 'Horary constraint score rendering missing');

assert.match(loader, /lunea-horary-balance-v19\.js\?v=1902/, 'V19.2 cache URL missing');
assert.match(loader, /lunea-fixed-spread-depth-v30\.js\?v=3002/, 'V30.2 cache URL missing');
const spreadIndex = loader.lastIndexOf('lunea-fixed-spread-depth-v30.js?v=3002');
const revealIndex = loader.lastIndexOf('lunea-boot-reveal-v29.js?v=2902');
assert.ok(spreadIndex >= 0 && revealIndex > spreadIndex, 'boot reveal must run after V30 UI patch');

console.log('V30 spread/Horary contract tests passed');
