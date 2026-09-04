import fs from 'node:fs';
import assert from 'node:assert/strict';

const v34 = fs.readFileSync('lunea-intimacy-ai-bridge-v34.js','utf8');
const v36 = fs.readFileSync('lunea-intimacy-oracle-ui-v36.js','utf8');
const v40 = fs.readFileSync('lunea-intimacy-burgundy-v40.js','utf8');
const v43 = fs.readFileSync('lunea-intimacy-repair-v43.js','utf8');

assert.match(v34, /openSheet\('INTIMACY'/);
assert.doesNotMatch(v34, /openSheet\('LOVE', item\.dataset\.title/);
assert.match(v34, /state\.category = 'INTIMACY'/);

// Oracle front/back assets are explicitly Oracle-only PNGs.
assert.match(v36, /BACK_ASSET='\.\/assets\/intimacy-oracle\/oracle_back_intimacy_final\.png'/);
assert.match(v36, /ATLAS_ASSET='\.\/assets\/intimacy-oracle\/oracle_atlas_final\.png'/);
assert.doesNotMatch(v36, /back_intimacy_final\.png/);
assert.doesNotMatch(v36, /generativelanguage\.googleapis\.com/);
assert.match(v36, /function repairIntimacyTarotBacks\(\)\{return false\}/);
assert.match(v36, /function patchTarotBack\(\)\{return false\}/);

// Tarot owns a different PNG and is applied after the shared restore layer,
// so Oracle imagery cannot leak into Tarot and the generic back cannot win late.
assert.match(v40, /TAROT_BACK_SRC = `\.\/assets\/intimacy-oracle\/tarot_back_intimacy_final\.png/);
assert.match(v40, /backImg\.setAttribute\('src', TAROT_BACK_SRC\)/);
const restoreAt = v40.indexOf('repairVisibleReading?.()');
const applyAt = v40.indexOf('wrappers.forEach(repairTarotWrapper)', restoreAt);
assert.ok(restoreAt >= 0 && applyAt > restoreAt, 'shared restore must run before the INTIMACY Tarot back is applied');
assert.doesNotMatch(v40, /oracle_back_intimacy_final\.png/);
assert.match(v40, /intimacy_sector_final\.png/);

assert.match(v43, /#luneaManualPanel\[data-lunea-intimacy-theme\]/);
assert.doesNotMatch(v43, /body:has\(\.lunea-intimacy-category\) #luneaManualPanel/);
assert.match(v43, /function clearManualContext\(\)/);
assert.match(v43, /s\.category = 'INTIMACY'/);
assert.match(v43, /FINAL_ORACLE_ATLAS = '\.\/assets\/intimacy-oracle\/oracle_atlas_final\.png'/);
assert.match(v43, /FINAL_ORACLE_BACK = '\.\/assets\/intimacy-oracle\/oracle_back_intimacy_final\.png'/);
assert.doesNotMatch(v43, /tarot_back_intimacy_final\.png/);

console.log('INTIMACY separate Tarot/Oracle PNG routing contract OK');
