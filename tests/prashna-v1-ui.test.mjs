import assert from 'node:assert/strict';
import fs from 'node:fs';

const prashna = fs.readFileSync(new URL('../lunea-prashna-v1.js', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../lunea-horary-location-button-v39.js', import.meta.url), 'utf8');

// Independent calculation contract.
assert.match(prashna, /\/v1\/prashna/);
assert.match(prashna, /LUNEA_PRASHNA_V1_LAST/);
assert.match(prashna, /Sidereal\/Lahiri/);
assert.match(prashna, /VARA · 일출 경계/);
assert.match(prashna, /LUNEA_PRASHNA_RULESET_V1/);
assert.match(prashna, /자동 YES\/NO 없음/);
assert.match(prashna, /Horary Tropical 좌표와 독립 계산/);

// A stored result is usable only for the exact current Horary inputs.
assert.match(prashna, /JSON\.stringify\(\[input\.question, input\.moment, input\.place, input\.topic\]\)/);
assert.match(prashna, /state\.signature !== signatureOf\(\)/);
assert.match(prashna, /saved\?\.signature === sig/);
assert.match(prashna, /promptBlock/);
assert.match(prashna, /if \(!data \|\| state\.signature !== signatureOf\(\)\) return ''/);

// Horary and Prashna share the exact same geolocation bridge, but not planetary positions.
assert.match(bridge, /\/v1\\\/\(\?:horary\|prashna\)/);
assert.match(bridge, /lunea-prashna-v1\.js/);
assert.match(bridge, /readCurrentGeo/);
assert.match(bridge, /next\.lat = geo\.lat/);
assert.match(bridge, /next\.lon = geo\.lon/);

// AI cross-check is narrow: only a real Horary prompt, only when a matching Prashna block exists.
assert.match(bridge, /HORARY_MARKER = '\[HORARY V1 · 질문시각 점성술 계산 결과\]'/);
assert.match(bridge, /PRASHNA_MARKER = '\[PRASHNA V1 · 독립 질문시각 Jyotisha 계산\]'/);
assert.match(bridge, /if \(!text\.includes\(HORARY_MARKER\) \|\| text\.includes\(PRASHNA_MARKER\)\) return init/);
assert.match(bridge, /LUNEA_PRASHNA_V1\?\.promptBlock\?\.\(\)/);
assert.match(bridge, /if \(!block\) return init/);
assert.match(bridge, /Horary와 Prashna를 먼저 서로 독립적으로 해석한다/);
assert.match(bridge, /체계 간 충돌/);
assert.match(bridge, /한 체계의 약한 근거를 다른 체계의 강한 근거인 것처럼 합산하지 않는다/);
assert.match(bridge, /generativelanguage\\\.googleapis\\\.com/);

console.log('LUNEA Prashna V1 UI / Horary cross-check contract: PASS');
