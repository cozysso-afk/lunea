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
assert.match(source, /version:'32\.0'/);
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

// Cards stay primary and Thai remains a supporting, non-timing layer.
assert.match(source, /실제 RWS 카드와 각 카드 포지션이 본체다/);
assert.match(source, /사건 발생일이나 결과 확정 근거로 쓰지 않는다/);
assert.match(source, /Transit\/Return\/Timing Oracle/);
assert.match(source, /Western Astrology, Saju, Thai Astrology/);

// Subject routing should occur before generic contact routing.
assert.ok(source.indexOf("return '시험'") < source.indexOf("return '연락'"), 'exam/contact routing priority regressed');
assert.ok(source.indexOf("return '직장'") < source.indexOf("return '연락'"), 'career/contact routing priority regressed');

// Load the bridge before the final prompt policy so V2 can see the Thai block.
const bridgeToken = 'lunea-thai-tarot-bridge-v32.js?v=3201';
const finalToken = 'lunea-final-prompt-priority-v1.js?v=';
assert.equal(loader.split(bridgeToken).length - 1, 2, 'bridge must exist in both structural loader paths');
const firstBridge = loader.indexOf(bridgeToken);
const firstFinal = loader.indexOf(finalToken);
const secondBridge = loader.indexOf(bridgeToken, firstBridge + 1);
const secondFinal = loader.indexOf(finalToken, firstFinal + 1);
assert.ok(firstBridge >= 0 && firstBridge < firstFinal, 'parser-path bridge must load before final prompt policy');
assert.ok(secondBridge >= 0 && secondBridge < secondFinal, 'sequential bridge must load before final prompt policy');

// The standalone Thai experience remains present and independent.
assert.match(loader, /lunea-thai-standalone-v24\.js\?v=2401/);
assert.match(standalone, /LUNEA THAI ASTROLOGY STANDALONE V24/);
assert.match(standalone, /luneaThaiHomeTileV24/);
assert.match(standalone, /오늘의 Taksa 계산/);

console.log('Thai standalone + optional tarot bridge V32 regression tests: PASS');
