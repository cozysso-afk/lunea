import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const files = [
  'lunea-home-visual-v36.js',
  'lunea-home-portal-v8.js',
  'lunea-mobile-interaction-hotfix-v1.js',
  'lunea-meihua-v1.js',
  'lunea-lenormand-v1.js',
  'lunea-thai-standalone-v24.js',
  'lunea-message-oracle-home-v1.js',
  'lunea-intimacy-clean-v39.js',
  'lunea-cache-refresh-v1.js',
];

for (const file of files) {
  const path = new URL(`../${file}`, import.meta.url);
  execFileSync(process.execPath, ['--check', path.pathname], {stdio:'pipe'});
}

const owner = read('lunea-home-visual-v36.js');
const portal = read('lunea-home-portal-v8.js');
const hotfix = read('lunea-mobile-interaction-hotfix-v1.js');
const meihua = read('lunea-meihua-v1.js');
const lenormand = read('lunea-lenormand-v1.js');
const thai = read('lunea-thai-standalone-v24.js');
const signal = read('lunea-message-oracle-home-v1.js');
const loader = read('lunea-cache-refresh-v1.js');

assert.match(owner, /order:Object\.freeze\(\['general','love','career','stock','timing','intimacy','signal','divider','lenormand','meihua','horary','thai'\]\)/);
assert.match(owner, /new MutationObserver\(requestLayout\)/, 'late tiles must be handled by one event-driven owner');
assert.match(owner, /duplicates\.forEach\(node => node\.remove\(\)\)/, 'BFCache restore must remove duplicate managed tiles');
assert.match(owner, /addEventListener\('pageshow', apply/);
assert.match(owner, /visibilitychange[\s\S]*apply\(\)/);
assert.doesNotMatch(owner, /setInterval\(/, 'V36 must not win ownership through a settle interval');
assert.doesNotMatch(owner, /setTimeout\([^,]+,\s*(?:[2-9]\d{3}|\d{5,})\s*\)/, 'V36 retries must stay short and bounded');

assert.doesNotMatch(meihua, /insertBefore\(tile\s*,\s*intimacy/, 'Meihua must not position itself beside Intimacy');
assert.doesNotMatch(meihua, /addEventListener\('pageshow'/, 'Meihua must not independently act on BFCache restore');
assert.doesNotMatch(lenormand, /normalizePortalOrder\?\./, 'Lenormand must not invoke a competing sorter');
assert.doesNotMatch(lenormand, /addEventListener\('pageshow'/, 'Lenormand must not independently act on BFCache restore');
assert.doesNotMatch(hotfix, /PORTAL_RANK|\.sort\(\(a, b\) => a\.rank/, 'mobile hotfix must not own Home order');
assert.doesNotMatch(thai, /setInterval\([\s\S]*injectHomeTile/, 'Thai Home creation must not poll for seconds');
for (const source of [portal, hotfix, meihua, lenormand, thai, signal]) {
  assert.match(source, /lunea:home-(?:tile|portal)-ready|LUNEA_HOME_LAYOUT_V36/, 'tile producers must notify the layout owner');
}

assert.match(loader, /loadHomeVisualV36/);
assert.match(loader, /\.\/lunea-home-visual-v36\.js/);
assert.doesNotMatch(loader, /loadHomeFinalTuneV32\(\)/, 'the long-running V35 owner must not be loaded');
assert.doesNotMatch(loader, /loadHomeReadabilityV31\(\)/, 'legacy Home visual owner must not be loaded');

assert.match(owner, /-webkit-backdrop-filter:blur\(9px\)/, 'primary cards must use one clear-glass material layer');
assert.match(owner, /animation:luneaV36AuroraDrift 12s/);
assert.match(owner, /animation-duration:14s/, 'secondary drift must be weaker and slower');
assert.match(owner, /scale\(\.985\)/, 'touch compression must be preserved');
assert.match(owner, /300ms ease/, 'glass bloom must stay in the requested range');
assert.match(owner, /@media\(prefers-reduced-motion:reduce\)/);
assert.match(owner, /animation:none/);
assert.doesNotMatch(owner, /(?:7\/10|progress-bar|combined-score)/i, 'Home must not imply a combined score');
assert.doesNotMatch(owner, /lunea-daily-celestial|lunea-v22-moon|dailyBtn/, 'V36 must not downgrade DAILY ORBIT 6');

console.log('Home layout owner and Visual V36 contract tests passed');
