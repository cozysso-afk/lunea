import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=n=>fs.readFileSync(new URL(`../${n}`,import.meta.url),'utf8');
const restore=read('lunea-cardback-restore-v19.js');
const ios=read('lunea-ios-performance-v3.js');
const v40=read('lunea-intimacy-burgundy-v40.js');
const v38=read('lunea-intimacy-readability-v36.js');
const v39=read('lunea-intimacy-clean-v39.js');
const oracle=read('lunea-intimacy-oracle-ui-v36.js');
test('shared card-back owner recognizes INTIMACY instead of falling back to GENERAL',()=>{
  assert.match(restore,/INTIMACY: 'assets\/intimacy-oracle\/tarot_back_intimacy_final\.png'/);
  assert.match(restore,/__LUNEA_INTIMACY_ACTIVE__/);
  assert.match(restore,/return 'INTIMACY'/);
});
test('iOS card factory chooses the INTIMACY back before insertion',()=>{
  assert.match(ios,/__LUNEA_INTIMACY_ACTIVE__/);
  assert.match(ios,/tarot_back_intimacy_final\.png/);
});
test('V40 no longer calls shared restore as an intermediate paint',()=>{
  const fn=v40.slice(v40.indexOf('function repairTarotCards'),v40.indexOf('function wrapCardFactory'));
  assert.doesNotMatch(fn,/repairVisibleReading/);
});
test('all live cabinet layers point at the same final sector PNG',()=>{
  assert.match(v38,/intimacy_sector_final\.png/);
  assert.match(v39,/intimacy_sector_final\.png/);
  assert.doesNotMatch(v38,/intimacy_sector_v37\.svg/);
  assert.doesNotMatch(v39,/intimacy_sector_v37\.svg/);
});
test('Oracle cards use normalized assets without CSS crop or double grading',()=>{
  assert.match(oracle,/CARD_ASSET_VERSION='v46'/);
  assert.match(oracle,/backgroundSize='100% 100%'/);
  assert.match(oracle,/filter:none/);
  assert.doesNotMatch(oracle,/brightness\(1\.12\)/);
});
