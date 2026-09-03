import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-intimacy-readability-v36.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../.github/workflows/bump-lunea-loader-413.yml', import.meta.url), 'utf8');
const icon = fs.readFileSync(new URL('../assets/intimacy-oracle/intimacy_sector_v37.svg', import.meta.url), 'utf8');

test('INTIMACY uses a category-style rounded-square celestial artwork asset', () => {
  assert.match(source, /const RELEASE = '36\.3'/);
  assert.match(source, /intimacy_sector_v37\.svg\?v=/);
  assert.match(source, /lunea-intimacy-sector-art-v37/);
  assert.match(source, /border-radius:22px!important/);
  assert.match(source, /object-fit:cover!important/);
  assert.match(icon, /viewBox="0 0 180 180"/);
  assert.match(icon, /radialGradient id="pearl"/);
  assert.match(icon, /linearGradient id="cres"/);
  assert.match(icon, /A49 49 0 1 0/);
});

test('INTIMACY artwork inherits the cache-busted loader build token', () => {
  assert.match(source, /document\.currentScript/);
  assert.match(source, /searchParams\.get\('v'\)/);
  assert.match(source, /encodeURIComponent\(SCRIPT_VERSION\)/);
  assert.match(workflow, /'lunea-intimacy-readability-v36\.js'/);
});

test('INTIMACY logo guard repairs any later overwrite of the category artwork', () => {
  assert.match(source, /function guardIcon\(category\)/);
  assert.match(source, /new MutationObserver/);
  assert.match(source, /observer\.observe\(icon, \{ childList: true, subtree: false \}\)/);
});

test('mobile spread typography is genuinely readable instead of 11px gray copy', () => {
  assert.match(source, /padding:18px 50px 18px 17px!important/);
  assert.match(source, /font-size:17\.4px!important/);
  assert.match(source, /font-size:13\.4px!important/);
  assert.match(source, /line-height:1\.65!important/);
  assert.match(source, /rgba\(244,236,246,\.9\)/);
  assert.match(source, /-webkit-line-clamp:unset!important/);
});

test('mobile spread copy is shortened into scannable evidence labels', () => {
  assert.match(source, /const DISPLAY_COPY/);
  assert.match(source, /굵기\/압박감/);
  assert.match(source, /내가 원하는 방식\/리듬/);
  assert.match(source, /실제 케미\/긴장/);
  assert.match(source, /INTIMACY · 고정 배열/);
  assert.match(source, /function polishCopy\(category\)/);
});

test('count and action pills are smaller than the reading copy and stay top-right', () => {
  assert.match(source, /top:17px!important/);
  assert.match(source, /width:30px!important/);
  assert.match(source, /height:30px!important/);
  assert.match(source, /lunea-count-label/);
  assert.match(source, /min-width:42px!important/);
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

console.log('LUNEA INTIMACY readability / category artwork V36.3: PASS');