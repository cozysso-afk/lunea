import fs from 'node:fs';
import assert from 'node:assert/strict';

const v36 = fs.readFileSync('lunea-intimacy-oracle-ui-v36.js','utf8');
const v40 = fs.readFileSync('lunea-intimacy-burgundy-v40.js','utf8');
const v43 = fs.readFileSync('lunea-intimacy-repair-v43.js','utf8');

assert.match(v36, /BACK_ASSET='\.\/assets\/intimacy-oracle\/back_intimacy_final\.jpg'/);
assert.match(v36, /function repairIntimacyTarotBacks\(\)\{return false\}/);
assert.match(v36, /function patchTarotBack\(\)\{return false\}/);
assert.doesNotMatch(v36, /if\(intimacy\(\)\)return'assets\/intimacy-oracle\/back_intimacy'/);
assert.doesNotMatch(v40, /CARD_BACK_SRC/);
assert.doesNotMatch(v40, /background-image[^\n]*back_intimacy/);
assert.match(v43, /FINAL_ORACLE_ATLAS = '\.\/assets\/intimacy-oracle\/oracle_atlas_final\.jpg'/);
assert.match(v43, /FINAL_ORACLE_BACK = '\.\/assets\/intimacy-oracle\/back_intimacy_final\.jpg'/);
assert.match(v43, /#luneaManualPanel/);
console.log('INTIMACY V43 asset routing contract OK');
