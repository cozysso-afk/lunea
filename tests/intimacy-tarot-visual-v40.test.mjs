import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../lunea-intimacy-burgundy-v40.js', import.meta.url), 'utf8');
const order = fs.readFileSync(new URL('../lunea-reading-action-order-v33.js', import.meta.url), 'utf8');
const tarotBack = new URL('../assets/intimacy-oracle/tarot_back_intimacy_final.png', import.meta.url);

test('INTIMACY tarot uses its dedicated final PNG back instead of GENERAL or Oracle fallback', () => {
  assert.match(source, /const RELEASE = '40\.2'/);
  assert.match(source, /tarot_back_intimacy_final\.png/);
  assert.match(source, /TAROT_BACK_SRC/);
  assert.doesNotMatch(source, /back_intimacy\.svg/);
  assert.doesNotMatch(source, /oracle_back_intimacy_final\.png/);
  assert.match(source, /lunea-intimacy-tarot-card/);
  assert.match(source, /repairTarotWrapper/);
  assert.match(source, /repairTarotCards/);
  assert.equal(fs.existsSync(tarotBack), true);
  const bytes = fs.readFileSync(tarotBack);
  assert.ok(bytes.length > 100_000);
  assert.deepEqual([...bytes.subarray(0,8)],[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
});

test('INTIMACY tarot fronts keep the complete Rider-Waite artwork visible and recover hidden images', () => {
  assert.match(source, /\.front>img/);
  assert.match(source, /object-fit:contain!important/);
  assert.match(source, /object-position:center!important/);
  assert.match(source, /frontImg\.style\.removeProperty\('opacity'\)/);
  assert.match(source, /frontImg\.style\.removeProperty\('display'\)/);
  assert.match(source, /frontImg\.dataset\.luneaIntimacyCardface/);
});

test('card factory and dynamic 20-card draws are repaired after iOS creates them', () => {
  assert.match(source, /wrapCardFactory/);
  assert.match(source, /__luneaIntimacyV402Wrapped/);
  assert.match(source, /new MutationObserver/);
  assert.match(source, /childList:true, subtree:true/);
  assert.match(source, /requestAnimationFrame\(repairTarotCards\)/);
});

test('shared restore cannot overwrite the final INTIMACY Tarot back', () => {
  const restoreAt = source.indexOf('repairVisibleReading?.()');
  const finalAt = source.indexOf('wrappers.forEach(repairTarotWrapper)', restoreAt);
  assert.ok(restoreAt >= 0 && finalAt > restoreAt);
  assert.match(source, /backImg\.setAttribute\('src', TAROT_BACK_SRC\)/);
});

test('V40 tarot repair inherits the stamped action-order build token', () => {
  assert.match(order, /script\.src = `\$\{src\}\?v=\$\{encodeURIComponent\(SELF_VERSION\)\}`/);
});
