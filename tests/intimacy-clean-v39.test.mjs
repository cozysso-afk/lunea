import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const v39Url = new URL('../lunea-intimacy-clean-v39.js', import.meta.url);
const source = fs.readFileSync(v39Url, 'utf8');
const v40 = fs.readFileSync(new URL('../lunea-intimacy-burgundy-v40.js', import.meta.url), 'utf8');
const order = fs.readFileSync(new URL('../lunea-reading-action-order-v33.js', import.meta.url), 'utf8');

test('V39 source parses as valid JavaScript', () => {
  const check = spawnSync(process.execPath, ['--check', fileURLToPath(v39Url)], {encoding:'utf8'});
  assert.equal(check.status, 0, check.stderr || check.stdout || 'V39 syntax check failed');
});

test('Home tile keeps dedicated INTIMACY artwork while source header uses the small shared heart', () => {
  assert.match(source, /const RELEASE = '39\.0'/);
  assert.match(source, /intimacy_sector_final\.png\?v=/);
  assert.match(source, /HOME_TILE_ID = 'luneaIntimacyHomeTileV39'/);
  assert.match(source, /\.lunea-v8-object img/);
  assert.match(source, /icon\.textContent !== '♡'/);
  assert.match(source, /icon\.textContent = '♡'/);
  assert.doesNotMatch(source, /icon\.replaceChildren\(img\)/);
  assert.doesNotMatch(source, /lunea-intimacy-sector-art-v39/);
});

test('burgundy owner preserves the approved source heart instead of reclaiming it with SVG artwork', () => {
  assert.match(v40, /categoryIcon:'♡'/);
  assert.doesNotMatch(v40, /forceIcon\(\$\('\.cat-icon', category\), CATEGORY_ICON_SRC\)/);
});

test('legacy orbit presentation is removed without adding a global mutation observer', () => {
  assert.match(source, /luneaIntimacyLegacyV35Style/);
  assert.match(source, /luneaIntimacyUiV37Style/);
  assert.doesNotMatch(source, /MutationObserver/);
});

test('INTIMACY becomes one Home Portal entry while the opened source header stays visible with the small heart', () => {
  assert.match(source, /tile\.dataset\.key = 'intimacy'/);
  assert.match(source, /grid\.appendChild\(tile\)/);
  assert.match(source, /grid-column:1\/-1!important/);
  assert.match(source, /:not\(\.lunea-thai-home-tile\)/);
  assert.doesNotMatch(source, /lunea-intimacy-category\.lunea-v8-source-category\.lunea-v8-source-active > \.category-header\{\s*display:none!important;/);
  assert.doesNotMatch(source, /lunea-intimacy-category\.lunea-v8-source-category\.lunea-v8-source-active > \.category-content\{\s*padding-top:5px!important;/);
  assert.match(source, /\.lunea-intimacy-category \.category-header\{[\s\S]*padding:15px 16px!important;/);
  assert.match(source, /font-size:22px!important;line-height:1!important;/);
});

test('source-active state is derived from actual open state and stale active state is cleared', () => {
  assert.match(source, /const wasOpen = category\.classList\.contains\('active'\)/);
  assert.match(source, /category\.classList\.toggle\('lunea-v8-source-active', wasOpen\)/);
});

test('approved opened INTIMACY rows keep the final contained-card geometry and ORIGINAL badge', () => {
  assert.match(source, /grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(source, /border:1px solid var\(--lio-list-border/);
  assert.match(source, /border-radius:14px!important/);
  assert.match(source, /badge\.textContent = 'ORIGINAL'/);
  assert.match(source, /lunea-intimacy-list-label\{display:none!important\}/);
});

test('approved action-order owner restores all current INTIMACY presentation runtimes', () => {
  assert.match(order, /INTIMACY_CLEAN_LOADER_ID/);
  assert.match(order, /INTIMACY_BURGUNDY_LOADER_ID/);
  assert.match(order, /INTIMACY_REPAIR_LOADER_ID/);
  assert.match(order, /ensureScript\(INTIMACY_CLEAN_LOADER_ID, '\.\/lunea-intimacy-clean-v39\.js'/);
  assert.match(order, /ensureScript\(INTIMACY_BURGUNDY_LOADER_ID, '\.\/lunea-intimacy-burgundy-v40\.js'/);
  assert.match(order, /ensureScript\(INTIMACY_REPAIR_LOADER_ID, '\.\/lunea-intimacy-repair-v43\.js'/);
  const boot = order.indexOf('function boot()');
  assert.ok(order.indexOf('ensureIntimacyCleanUi();', boot) > boot);
  assert.ok(order.indexOf('ensureIntimacyBurgundyUi();', boot) > boot);
  assert.ok(order.indexOf('ensureIntimacyRepairUi();', boot) > boot);
});

console.log('LUNEA INTIMACY clean UI V39 golden regression tests: PASS');