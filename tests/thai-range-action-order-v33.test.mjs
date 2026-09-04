import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rangeUrl = new URL('../lunea-thai-range-v33.js', import.meta.url);
const orderUrl = new URL('../lunea-reading-action-order-v33.js', import.meta.url);
const rangeSource = fs.readFileSync(rangeUrl, 'utf8');
const orderSource = fs.readFileSync(orderUrl, 'utf8');
const loader = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../.github/workflows/bump-lunea-loader-413.yml', import.meta.url), 'utf8');

execFileSync(process.execPath, ['--check', fileURLToPath(rangeUrl)], {stdio:'pipe'});
execFileSync(process.execPath, ['--check', fileURLToPath(orderUrl)], {stdio:'pipe'});

assert.match(rangeSource, /LUNEA THAI TAKSA RANGE V33/);
assert.match(rangeSource, /version:'33\.0'/);
assert.match(rangeSource, /\/v1\/thai\/taksa\/range/);
assert.match(rangeSource, /const MAX_DAYS = 90/);
assert.match(rangeSource, /data-days="7"/);
assert.match(rangeSource, /data-days="14"/);
assert.match(rangeSource, /data-days="30"/);
assert.match(rangeSource, /type="date" id="luneaThaiStandaloneRangeStart"/);
assert.match(rangeSource, /type="date" id="luneaThaiStandaloneRangeEnd"/);
assert.match(rangeSource, /type="date" id="luneaThaiTarotRangeStart"/);
assert.match(rangeSource, /type="date" id="luneaThaiTarotRangeEnd"/);

// Standalone and tarot modes both exist, but neither may auto-call the API on boot.
assert.match(rangeSource, /runStandaloneRange/);
assert.match(rangeSource, /runTarotRange/);
const boot = rangeSource.match(/function boot\(\) \{([\s\S]*?)\n  \}\n\n  W\.LUNEA_THAI_RANGE_V33/);
assert.ok(boot, 'V33 boot function not found');
assert.ok(!boot[1].includes('runStandaloneRange();'), 'standalone Thai range became automatic');
assert.ok(!boot[1].includes('runTarotRange();'), 'tarot Thai range became automatic');

// Tarot period evidence stays exact-question scoped and is visible to Final Priority V2.
assert.match(rangeSource, /tarotState\.question !== currentQuestion\(\)/);
assert.match(rangeSource, /question !== currentQuestion\(\)/);
assert.match(rangeSource, /\[THAI ASTROLOGY · MAHA TAKSA 계산 결과\]/);
assert.match(rangeSource, /연결 모드: 현재 타로 질문의 기간 Taksa 캘린더/);
assert.match(rangeSource, /천체의 이동각을 계산하는 Western Transit이 아니라/);
assert.match(rangeSource, /사건 발생일을 확정하지 않는다/);
assert.match(rangeSource, /수요일 밤 Rahu 분리/);

// The period observer must not repaint an existing inline result on every card mutation.
assert.match(rangeSource, /tarotState\.result && !\$\(TAROT_INLINE_ID\)\) renderTarotInline\(\)/);
assert.match(rangeSource, /tarotState\.renderSignature === signature/);

// Stable reading action order requested for the 3-column mobile grid.
const expectedOrder = [
  'flipAll','aiRead','saveReading',
  'retry','extraCard','timingSupportBtn',
  'astroTransitBtn','luneaThaiTarotBridgeBtn','luneaThaiTarotRangeBtn',
  'astroReturnBtn','astroHoraryBtn'
];
for (let i = 0; i < expectedOrder.length - 1; i += 1) {
  assert.ok(orderSource.indexOf(`'${expectedOrder[i]}'`) < orderSource.indexOf(`'${expectedOrder[i+1]}'`), `action order regressed around ${expectedOrder[i]}`);
}
assert.match(orderSource, /Unknown\/future buttons are preserved/);
assert.match(orderSource, /const desired = \[\.\.\.known\.map\(x => x\.node\), \.\.\.unknown\.map\(x => x\.node\)\]/);
assert.match(orderSource, /if \(already\) return true/);

// Long spreads get small convenience controls immediately after the prompt-copy box.
assert.match(orderSource, /LUNEA READING ACTION ORDER V33\.4/);
assert.match(orderSource, /version:'33\.4'/);
assert.match(orderSource, /luneaBottomReadingActions/);
assert.match(orderSource, /luneaBottomAiRead/);
assert.match(orderSource, /luneaBottomSaveReading/);
assert.match(orderSource, /copyBox\.insertAdjacentElement\('afterend', root\)/);
assert.match(orderSource, /ai\.textContent = '🔮 AI 해석'/);
assert.match(orderSource, /save\.textContent = '💾 저장'/);
assert.match(orderSource, /clickSource\('aiRead'\)/);
assert.match(orderSource, /clickSource\('saveReading'\)/);
assert.ok(!orderSource.includes("document.getElementById('copyPrompt').onclick"), 'prompt-copy behavior must not be replaced');

// iOS Thai period date controls must never use intrinsic grid width that can overlap.
assert.match(orderSource, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)!important/);
assert.match(orderSource, /\.thai-v33-field\{min-width:0!important;overflow:hidden\}/);
assert.match(orderSource, /input\[type="date"\]/);
assert.match(orderSource, /min-width:0!important/);
assert.match(orderSource, /max-width:100%!important/);
assert.match(orderSource, /@media\(max-width:360px\)/);

// Both parser and sequential loader paths must include the modules, regardless of build-stamp value.
for (const asset of [
  'lunea-thai-range-v33.js',
  'lunea-reading-action-order-v33.js',
  'lunea-thai-tarot-bridge-v32.js'
]) {
  const pattern = new RegExp(asset.replaceAll('.', '\\.') + "\\?v=[^\"']+", 'g');
  assert.equal((loader.match(pattern) || []).length, 2, `${asset} must exist in both structural loader paths`);
}

// Future Pages releases must cache-bust all behavior-critical Thai/action modules.
for (const asset of [
  'lunea-thai-tarot-bridge-v32.js',
  'lunea-thai-range-v33.js',
  'lunea-reading-action-order-v33.js'
]) {
  assert.match(workflow, new RegExp(asset.replaceAll('.', '\\.')));
}

console.log('Thai range V33 + reading action order V33.4 regression tests: PASS');
