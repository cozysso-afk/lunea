import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-intimacy-readability-v36.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../.github/workflows/bump-lunea-loader-413.yml', import.meta.url), 'utf8');
const icon = fs.readFileSync(new URL('../assets/intimacy-oracle/intimacy_sector_v37.svg', import.meta.url), 'utf8');

test('INTIMACY uses a category-style rounded-square celestial artwork asset', () => {
  assert.match(source, /const RELEASE = '36\.5'/);
  assert.match(source, /intimacy_sector_v37\.svg\?v=/);
  assert.match(source, /lunea-intimacy-sector-art-v37/);
  assert.match(source, /border-radius:20px!important/);
  assert.match(source, /object-fit:cover!important/);
  assert.match(icon, /viewBox="0 0 180 180"/);
  assert.match(icon, /radialGradient id="pearl"/);
  assert.match(icon, /linearGradient id="cres"/);
});

test('INTIMACY artwork inherits the cache-busted loader build token', () => {
  assert.match(source, /document\.currentScript/);
  assert.match(source, /searchParams\.get\('v'\)/);
  assert.match(source, /encodeURIComponent\(SCRIPT_VERSION\)/);
  assert.match(workflow, /'lunea-intimacy-readability-v36\.js'/);
});

test('touch targets stay interactive and decorative children cannot steal taps', () => {
  assert.match(source, /pointer-events:auto!important/);
  assert.match(source, /touch-action:manipulation!important/);
  assert.match(source, /reading-item > \*/);
  assert.match(source, /cat-icon > \*/);
  assert.match(source, /pointer-events:none!important/);
});

test('readability layer is static and does not mutate live spread copy or observe the icon forever', () => {
  assert.doesNotMatch(source, /MutationObserver/);
  assert.doesNotMatch(source, /function guardIcon/);
  assert.doesNotMatch(source, /DISPLAY_COPY/);
  assert.doesNotMatch(source, /function polishCopy/);
});

test('mobile layout stays compact and uses spacing instead of oversized type', () => {
  assert.match(source, /padding:13px 46px 13px 13px!important/);
  assert.match(source, /gap:8px!important/);
  assert.match(source, /font-size:14\.3px!important/);
  assert.match(source, /font-size:10\.8px!important/);
  assert.match(source, /line-height:1\.52!important/);
  assert.match(source, /-webkit-line-clamp:unset!important/);
});

test('count and action pills stay outside the text flow', () => {
  assert.match(source, /top:13px!important/);
  assert.match(source, /width:28px!important/);
  assert.match(source, /height:28px!important/);
  assert.match(source, /lunea-count-label/);
  assert.match(source, /min-width:40px!important/);
  assert.match(source, /!\/\^\\d\+\$\//);
});

test('structural loader loads readability repair after legacy INTIMACY layer in both paths', () => {
  const legacy = 'lunea-intimacy-legacy-v35.js';
  const repair = 'lunea-intimacy-readability-v36.js';
  assert.equal((loader.match(/lunea-intimacy-readability-v36\.js\?v=/g) || []).length, 2);
  const firstLegacy = loader.indexOf(legacy);
  const firstRepair = loader.indexOf(repair);
  const lastLegacy = loader.lastIndexOf(legacy);
  const lastRepair = loader.lastIndexOf(repair);
  assert.ok(firstLegacy >= 0 && firstRepair > firstLegacy);
  assert.ok(lastLegacy >= 0 && lastRepair > lastLegacy);
});

console.log('LUNEA INTIMACY touch-safe layout V36.5: PASS');