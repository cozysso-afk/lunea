import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../lunea-intimacy-burgundy-v40.js', import.meta.url), 'utf8');
const order = fs.readFileSync(new URL('../lunea-reading-action-order-v33.js', import.meta.url), 'utf8');
const backUrl = new URL('../assets/intimacy-oracle/back_intimacy_final.jpg', import.meta.url);

test('INTIMACY tarot uses the supplied final shared card back instead of the placeholder', () => {
  assert.match(source, /const RELEASE = '40\.2'/);
  assert.match(source, /back_intimacy_final\.jpg/);
  assert.doesNotMatch(source, /CARD_BACK_SRC = `\.\/assets\/intimacy-oracle\/back_intimacy\.svg/);
  assert.match(source, /CARD_BACK_SRC/);
  assert.match(source, /lunea-intimacy-tarot-card/);
  assert.match(source, /repairTarotWrapper/);
  assert.match(source, /repairTarotCards/);
  assert.equal(fs.existsSync(backUrl), true);
  const back = fs.readFileSync(backUrl);
  assert.deepEqual([...back.subarray(0, 3)], [0xff, 0xd8, 0xff]);
  assert.ok(back.length > 100000, 'tarot back should be the supplied full artwork');
});

test('INTIMACY tarot fronts keep the complete Rider-Waite artwork visible and recover hidden images', () => {
  assert.match(source, /\.front>img/);
  assert.match(source, /object-fit:contain!important/);
  assert.match(source, /object-position:center!important/);
  assert.match(source, /frontImg\.style\.removeProperty\('opacity'\)/);
  assert.match(source, /frontImg\.style\.removeProperty\('display'\)/);
  assert.match(source, /frontImg\.dataset\.luneaIntimacyCardface/);
});

test('card factory and dynamic draws are repaired after iOS creates them', () => {
  assert.match(source, /wrapCardFactory/);
  assert.match(source, /__luneaIntimacyV402Wrapped/);
  assert.match(source, /__luneaIntimacyV402Observed/);
  assert.match(source, /new MutationObserver/);
  assert.match(source, /childList:true, subtree:true/);
  assert.match(source, /requestAnimationFrame\(repairTarotCards\)/);
});

test('V40 tarot repair inherits the stamped action-order build token', () => {
  assert.match(order, /lunea-intimacy-burgundy-v40\.js\?v=\$\{encodeURIComponent\(SELF_VERSION\)\}/);
});
