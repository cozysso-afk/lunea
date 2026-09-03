import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../lunea-intimacy-burgundy-v40.js', import.meta.url), 'utf8');
const order = fs.readFileSync(new URL('../lunea-reading-action-order-v33.js', import.meta.url), 'utf8');
const back = fs.readFileSync(new URL('../assets/intimacy-oracle/back_intimacy.svg', import.meta.url), 'utf8');

test('INTIMACY tarot uses its dedicated lightweight card back instead of GENERAL fallback', () => {
  assert.match(source, /const RELEASE = '40\.1'/);
  assert.match(source, /back_intimacy\.svg/);
  assert.match(source, /CARD_BACK_SRC/);
  assert.match(source, /lunea-intimacy-tarot-card/);
  assert.match(source, /repairTarotWrapper/);
  assert.match(source, /repairTarotCards/);
  assert.match(back, /<svg[\s>]/);
  assert.match(back, /LUNEA/);
  assert.match(back, /INTIMACY/);
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
  assert.match(source, /__luneaIntimacyV401Wrapped/);
  assert.match(source, /new MutationObserver/);
  assert.match(source, /childList:true, subtree:true/);
  assert.match(source, /requestAnimationFrame\(repairTarotCards\)/);
});

test('V40 tarot repair inherits the stamped action-order build token', () => {
  assert.match(order, /lunea-intimacy-burgundy-v40\.js\?v=\$\{encodeURIComponent\(SELF_VERSION\)\}/);
});
