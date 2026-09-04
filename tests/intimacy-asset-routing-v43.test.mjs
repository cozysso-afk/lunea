import fs from 'node:fs';
import assert from 'node:assert/strict';

const v34 = fs.readFileSync('lunea-intimacy-ai-bridge-v34.js','utf8');
const v36 = fs.readFileSync('lunea-intimacy-oracle-ui-v36.js','utf8');
const v40 = fs.readFileSync('lunea-intimacy-burgundy-v40.js','utf8');
const v43 = fs.readFileSync('lunea-intimacy-repair-v43.js','utf8');

// AI/manual INTIMACY entrypoints must keep the true category instead of silently
// falling back to LOVE, otherwise the burgundy/card-back routing is bypassed.
assert.match(v34, /openSheet\('INTIMACY'/);
assert.doesNotMatch(v34, /openSheet\('LOVE', item\.dataset\.title/);
assert.match(v34, /state\.category = 'INTIMACY'/);

// Final visual assets are PNG only. The runtime must not depend on the old JPG
// final assets or the tiny legacy atlas for visible Oracle rendering.
assert.match(v36, /BACK_ASSET='\.\/assets\/intimacy-oracle\/back_intimacy_final\.png'/);
assert.match(v36, /ATLAS_ASSET='\.\/assets\/intimacy-oracle\/oracle_atlas_final\.png'/);
assert.match(v36, /backgroundImage=`url\(\\"\$\{ATLAS_ASSET\}\\"\)`/);
assert.doesNotMatch(v36, /back_intimacy_final\.jpg/);
assert.doesNotMatch(v36, /oracle_atlas_final\.jpg/);
assert.doesNotMatch(v36, /generativelanguage\.googleapis\.com/);
assert.match(v36, /function repairIntimacyTarotBacks\(\)\{return false\}/);
assert.match(v36, /function patchTarotBack\(\)\{return false\}/);

// Tarot back ownership stays with the core/category back system and must never
// be rewritten to an Oracle back.
assert.doesNotMatch(v40, /CARD_BACK_SRC/);
assert.doesNotMatch(v40, /background-image[^\n]*back_intimacy/);
assert.match(v40, /intimacy_sector_final\.png/);

// Manual burgundy is explicitly scoped to the active manual panel marker so
// GENERAL/LOVE/etc. manual spreads do not inherit the INTIMACY skin.
assert.match(v43, /#luneaManualPanel\[data-lunea-intimacy-theme\]/);
assert.doesNotMatch(v43, /body:has\(\.lunea-intimacy-category\) #luneaManualPanel/);
assert.match(v43, /function clearManualContext\(\)/);
assert.match(v43, /s\.category = 'INTIMACY'/);

// Oracle UI stays simple: 0/1/3 draw modes remain available; no paid question
// helper is exposed by the final runtime.
assert.match(v43, /function simplifyOracleTools\(\)/);
assert.match(v43, /0:'타로만',1:'오라클 1장',3:'오라클 3장'/);
assert.match(v43, /FINAL_ORACLE_ATLAS = '\.\/assets\/intimacy-oracle\/oracle_atlas_final\.png'/);
assert.match(v43, /FINAL_ORACLE_BACK = '\.\/assets\/intimacy-oracle\/back_intimacy_final\.png'/);
assert.doesNotMatch(v43, /\.jpg'/);

console.log('INTIMACY PNG routing / category / manual-theme / Oracle-UX contract OK');
