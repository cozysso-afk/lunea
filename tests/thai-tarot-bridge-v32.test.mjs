import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const bridgeUrl = new URL('../lunea-thai-tarot-bridge-v32.js', import.meta.url);
const bridgePath = fileURLToPath(bridgeUrl);
const source = fs.readFileSync(bridgeUrl, 'utf8');
const loader = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');
const standalone = fs.readFileSync(new URL('../lunea-thai-standalone-v24.js', import.meta.url), 'utf8');

execFileSync(process.execPath, ['--check', bridgePath], {stdio:'pipe'});

assert.match(source, /LUNEA_THAI_TAROT_BRIDGE_V32/);
assert.match(source, /V32\.1 performance repair/);
assert.match(source, /version:'32\.1'/);
assert.match(source, /luneaThaiTarotBridgeBtn/);
assert.match(source, /🇹🇭 Thai 보조/);
assert.match(source, /\/v1\/thai\/taksa/);
assert.match(source, /current_iso:new Date\(\)\.toISOString\(\)/);
assert.match(source, /timezone:'Asia\/Seoul'/);

// The calculation must be opt-in, never an automatic side effect of drawing cards.
const bootMatch = source.match(/function boot\(\) \{([\s\S]*?)\n  \}\n\n  W\.LUNEA_THAI_TAROT_BRIDGE_V32/);
assert.ok(bootMatch, 'bridge boot function not found');
assert.ok(!bootMatch[1].includes('runForCurrentQuestion();'), 'Thai API calculation became automatic');
assert.match(source, /button\.onclick = runForCurrentQuestion/);

// Results must be exact-question scoped so an earlier Taksa result cannot leak.
assert.match(source, /bridgeState\.question !== currentQuestion\(\)/);
assert.match(source, /question !== currentQuestion\(\)/);
assert.match(source, /clearResult\(\)/);

// Performance regression guard: the old bridge rewrote innerHTML on every body
// mutation and recursively woke its own MutationObserver. V32.1 must memoize the
// rendered payload, scope the observer, RAF-throttle maintenance, and only
// recreate the inline card if it has actually disappeared.
assert.match(source, /renderSignature/);
assert.match(source, /bridgeState\.renderSignature === signature/);
assert.match(source, /const observerTarget = \$\('spreadOverlay'\) \|\| document\.body/);
assert.match(source, /requestAnimationFrame\(run\)/);
assert.match(source, /bridgeState\.result && !\$\(INLINE_ID\)\) renderInline\(\)/);
assert.ok(!source.includes("const bodyObserver = new MutationObserver(() => {\n      ensureQuestionScope();\n      injectButton();\n      renderInline();"), 'recursive body-wide render loop returned');

// Cards stay primary and Thai remains a supporting, non-timing layer.
assert.match(source, /실제 RWS 카드와 각 카드 포지션이 본체다/);
assert.match(source, /사건 발생일이나 결과 확정 근거로 쓰지 않는다/);
assert.match(source, /Transit\/Return\/Timing Oracle/);
assert.match(source, /Western Astrology, Saju, Thai Astrology/);

// Subject routing should occur before generic contact routing.
assert.ok(source.indexOf("return '시험'") < source.indexOf("return '연락'"), 'exam/contact routing priority regressed');
assert.ok(source.indexOf("return '직장'") < source.indexOf("return '연락'"), 'career/contact routing priority regressed');

// Load the bridge before Thai Range and Final Priority so all Thai computed
// blocks are visible to the final evidence-policy wrapper.
const bridgeToken = 'lunea-thai-tarot-bridge-v32.js?v=3202';
const rangeToken = 'lunea-thai-range-v33.js?v=3301';
const finalToken = 'lunea-final-prompt-priority-v1.js?v=';
assert.equal(loader.split(bridgeToken).length - 1, 2, 'bridge must exist in both structural loader paths');
assert.equal(loader.split(rangeToken).length - 1, 2, 'Thai range must exist in both structural loader paths');
for (let offset = 0, i = 0; i < 2; i += 1) {
  const bridgeIndex = loader.indexOf(bridgeToken, offset);
  const rangeIndex = loader.indexOf(rangeToken, bridgeIndex + 1);
  const finalIndex = loader.indexOf(finalToken, rangeIndex + 1);
  assert.ok(bridgeIndex >= 0 && bridgeIndex < rangeIndex && rangeIndex < finalIndex, `Thai prompt load order regressed on path ${i+1}`);
  offset = finalIndex + 1;
}

// The standalone Thai experience remains present and independent.
assert.match(loader, /lunea-thai-standalone-v24\.js\?v=2401/);
assert.match(standalone, /LUNEA THAI ASTROLOGY STANDALONE V24/);
assert.match(standalone, /luneaThaiHomeTileV24/);
assert.match(standalone, /오늘의 Taksa 계산/);

console.log('Thai standalone + optional tarot bridge V32.1 regression tests: PASS');
