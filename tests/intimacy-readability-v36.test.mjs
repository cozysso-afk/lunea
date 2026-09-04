import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-intimacy-readability-v36.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-structural-routing-v4.js', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../.github/workflows/bump-lunea-loader-413.yml', import.meta.url), 'utf8');
const icon = fs.readFileSync(new URL('../assets/intimacy-oracle/intimacy_sector_final.png', import.meta.url));

test('V38 runtime guard is release-aware so an older open PWA session cannot suppress a newer repair', () => {
  assert.match(source, /const RELEASE = '38\.0'/);
  assert.match(source, /const RUNTIME_KEY = '__LUNEA_INTIMACY_UI_RELEASE__'/);
  assert.match(source, /if \(W\[RUNTIME_KEY\] === RELEASE\) return/);
  assert.match(source, /W\[RUNTIME_KEY\] = RELEASE/);
  assert.doesNotMatch(source, /if \(W\.__LUNEA_INTIMACY_UI_V37__\) return/);
});

test('INTIMACY uses the square celestial artwork with img and CSS fallback', () => {
  assert.match(source, /intimacy_sector_final\.png\?v=/);
  assert.match(source, /lunea-intimacy-sector-art-v37/);
  assert.match(source, /background:#181329 url\('\$\{ICON_SRC\}'\) center\/cover no-repeat!important/);
  assert.match(source, /icon\.replaceChildren\(img, sentinel\)/);
  assert.match(source, /object-fit:cover!important/);
  assert.equal(icon.subarray(0,8).toString('hex'), '89504e470d0a1a0a');
});

test('legacy V35 cannot overwrite the square logo after its delayed installer runs', () => {
  assert.match(source, /lunea-intimacy-sector-mark-v37-sentinel/);
  assert.match(source, /lunea-intimacy-sector-mark lunea-intimacy-sector-mark-v37-sentinel/);
  assert.match(source, /display:none!important/);
  assert.match(source, /late legacy timers cannot overwrite V37 artwork/);
});

test('INTIMACY artwork inherits the cache-busted loader build token', () => {
  assert.match(source, /document\.currentScript/);
  assert.match(source, /searchParams\.get\('v'\)/);
  assert.match(source, /encodeURIComponent\(SCRIPT_VERSION\)/);
  assert.match(workflow, /'lunea-intimacy-readability-v36\.js'/);
});

test('PWA resume and late boot paths re-apply the current release without observers', () => {
  assert.match(source, /\[350, 1200, 3000\]\.forEach/);
  assert.match(source, /addEventListener\('pageshow'/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /dataset\.luneaIntimacyUiRelease = RELEASE/);
  assert.doesNotMatch(source, /MutationObserver/);
});

test('touch targets remain native and decoration cannot steal taps', () => {
  assert.match(source, /pointer-events:auto!important/);
  assert.match(source, /touch-action:manipulation!important/);
  assert.match(source, /pointer-events:none!important/);
});

test('fixed spread copy is normalized once into concise scannable labels', () => {
  assert.match(source, /const COPY/);
  assert.match(source, /나의 방식\/리듬/);
  assert.match(source, /실제 케미\/긴장/);
  assert.match(source, /INTIMACY · 고정 배열/);
  assert.match(source, /function normalizeCopy/);
});

test('mobile list is compact, spaced, and clamps descriptions to two lines', () => {
  assert.match(source, /padding:9px 12px 14px!important/);
  assert.match(source, /gap:10px!important/);
  assert.match(source, /padding:13px 46px 13px 14px!important/);
  assert.match(source, /font-size:14\.6px!important/);
  assert.match(source, /font-size:10\.9px!important/);
  assert.match(source, /-webkit-line-clamp:2!important/);
});

test('count pills stay quiet and outside text flow', () => {
  assert.match(source, /top:14px!important/);
  assert.match(source, /width:27px!important/);
  assert.match(source, /height:27px!important/);
  assert.match(source, /lunea-count-label/);
  assert.match(source, /min-width:39px!important/);
});

test('repair is loaded after legacy INTIMACY in both loader paths', () => {
  const legacy = 'lunea-intimacy-legacy-v35.js';
  const repair = 'lunea-intimacy-readability-v36.js';
  assert.equal((loader.match(/lunea-intimacy-readability-v36\.js\?v=/g) || []).length, 2);
  assert.ok(loader.indexOf(repair) > loader.indexOf(legacy));
  assert.ok(loader.lastIndexOf(repair) > loader.lastIndexOf(legacy));
});

console.log('LUNEA INTIMACY stable sector-aligned UI V38.0: PASS');