import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-intimacy-clean-v39.js', import.meta.url), 'utf8');
const order = fs.readFileSync(new URL('../lunea-reading-action-order-v33.js', import.meta.url), 'utf8');

test('V39 uses the dedicated square artwork and forcibly removes the old orbit presentation', () => {
  assert.match(source, /const RELEASE = '39\.0'/);
  assert.match(source, /intimacy_sector_v37\.svg\?v=/);
  assert.match(source, /lunea-intimacy-sector-art-v39/);
  assert.match(source, /icon\.replaceChildren\(img\)/);
  assert.match(source, /luneaIntimacyLegacyV35Style/);
  assert.match(source, /luneaIntimacyUiV37Style/);
  assert.doesNotMatch(source, /MutationObserver/);
});

test('INTIMACY becomes a real Home Portal tile with its own artwork', () => {
  assert.match(source, /HOME_TILE_ID = 'luneaIntimacyHomeTileV39'/);
  assert.match(source, /tile\.dataset\.key = 'intimacy'/);
  assert.match(source, /lunea-v8-source-category/);
  assert.match(source, /grid\.appendChild\(tile\)/);
  assert.match(source, /grid-column:1\/-1!important/);
  assert.match(source, /\.lunea-v8-object img/);
  assert.match(source, /:not\(\.lunea-thai-home-tile\)/);
});

test('opened INTIMACY uses LOVE-like divider rows instead of boxed cards', () => {
  assert.match(source, /border-top:1px solid rgba\(255,255,255,\.065\)!important/);
  assert.match(source, /border-radius:0!important/);
  assert.match(source, /background:transparent!important/);
  assert.match(source, /position:static!important/);
  assert.match(source, /padding:13px 1px!important/);
  assert.match(source, /lunea-intimacy-list-label\{display:none!important\}/);
});

test('only the dedicated INTIMACY AI entry gets a contained panel', () => {
  assert.match(source, /reading-item\[data-intimacy-ai="1"\]/);
  assert.match(source, /border-radius:14px!important/);
  assert.match(source, /badge\.textContent = 'ORIGINAL'/);
});

test('V39 is loaded after late feature modules and inherits the stamped action-order build token', () => {
  assert.match(order, /SELF_VERSION/);
  assert.match(order, /lunea-intimacy-clean-v39\.js\?v=\$\{encodeURIComponent\(SELF_VERSION\)\}/);
  assert.match(order, /ensureIntimacyCleanUi\(\)/);
  const boot = order.indexOf('function boot()');
  const call = order.indexOf('ensureIntimacyCleanUi();', boot);
  assert.ok(call > boot, 'V39 loader must be invoked during the late action-order boot');
});

console.log('LUNEA INTIMACY clean UI V39 regression tests: PASS');
