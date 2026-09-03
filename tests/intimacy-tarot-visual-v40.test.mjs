import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../lunea-intimacy-burgundy-v40.js', import.meta.url), 'utf8');
const order = fs.readFileSync(new URL('../lunea-reading-action-order-v33.js', import.meta.url), 'utf8');
const back = fs.readFileSync(new URL('../assets/intimacy-oracle/back_intimacy.PNG', import.meta.url));
const atlas = fs.readFileSync(new URL('../assets/intimacy-oracle/oracle_atlas_v36.jpg', import.meta.url));

test('V42 uses the dedicated PNG INTIMACY card back and real 36-card atlas', () => {
  assert.match(source, /const RELEASE = '42\.0'/);
  assert.match(source, /back_intimacy\.PNG/);
  assert.match(source, /oracle_atlas_v36\.jpg/);
  assert.match(source, /CARD_BACK_SRC/);
  assert.match(source, /ORACLE_ATLAS_SRC/);
  assert.deepEqual([...back.subarray(1, 4)], [0x50, 0x4e, 0x47]);
  assert.ok(back.length > 10000, 'INTIMACY PNG card back is unexpectedly small');
  assert.deepEqual([...atlas.subarray(0, 3)], [0xff, 0xd8, 0xff]);
  assert.deepEqual([...atlas.subarray(-2)], [0xff, 0xd9]);
  assert.ok(atlas.length > 100000, '36-card oracle atlas regressed to the tiny placeholder');
});

test('V42 applies the burgundy system to the whole INTIMACY reading overlay', () => {
  assert.match(source, /body\.lunea-intimacy-reading #spreadOverlay/);
  assert.match(source, /body\.lunea-intimacy-reading #spreadOverlay \.modal/);
  assert.match(source, /body\.lunea-intimacy-reading #spreadOverlay \.actionbar/);
  assert.match(source, /body\.lunea-intimacy-reading #spreadOverlay #cards/);
  assert.match(source, /linear-gradient\(165deg,#27101f/);
});

test('Oracle modes are user-facing and explain what one-card vs three-card means', () => {
  assert.match(source, /오라클 1장 보조/);
  assert.match(source, /오라클 3장 심층/);
  assert.match(source, /전체 친밀감 흐름에 오라클 한 장/);
  assert.match(source, /끌림·욕구 \/ 리듬·경계 \/ 유대·여운/);
  assert.match(source, /polishOracleTools/);
  assert.match(source, /polishOracleLensLabels/);
});

test('INTIMACY tarot fronts keep the complete Rider-Waite artwork visible and recover hidden images', () => {
  assert.match(source, /\.front>img/);
  assert.match(source, /object-fit:contain!important/);
  assert.match(source, /object-position:center!important/);
  assert.match(source, /frontImg\.style\.removeProperty\('opacity'\)/);
  assert.match(source, /frontImg\.style\.removeProperty\('display'\)/);
  assert.match(source, /frontImg\.dataset\.luneaIntimacyCardface/);
});

test('dynamic card creation remains repaired and V42 inherits the stamped action-order build token', () => {
  assert.match(source, /wrapCardFactory/);
  assert.match(source, /new MutationObserver/);
  assert.match(source, /childList:true, subtree:true/);
  assert.match(order, /lunea-intimacy-burgundy-v40\.js\?v=\$\{encodeURIComponent\(SELF_VERSION\)\}/);
});
