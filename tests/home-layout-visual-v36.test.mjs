import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const files = [
  'lunea-home-visual-v36.js',
  'lunea-home-portal-v8.js',
  'lunea-mobile-interaction-hotfix-v1.js',
  'lunea-meihua-v1.js',
  'lunea-meihua-ui-final-v2.js',
  'lunea-lenormand-v1.js',
  'lunea-thai-standalone-v24.js',
  'lunea-thai-art-polish-v26.js',
  'lunea-message-oracle-home-v1.js',
  'lunea-intimacy-clean-v39.js',
  'lunea-cache-refresh-v1.js',
  'lunea-sector-color-system-v28.js',
];

for (const file of files) {
  const path = new URL(`../${file}`, import.meta.url);
  execFileSync(process.execPath, ['--check', path.pathname], {stdio:'pipe'});
}

const owner = read('lunea-home-visual-v36.js');
const portal = read('lunea-home-portal-v8.js');
const hotfix = read('lunea-mobile-interaction-hotfix-v1.js');
const meihua = read('lunea-meihua-v1.js');
const meihuaUi = read('lunea-meihua-ui-final-v2.js');
const lenormand = read('lunea-lenormand-v1.js');
const thai = read('lunea-thai-standalone-v24.js');
const thaiArt = read('lunea-thai-art-polish-v26.js');
const signal = read('lunea-message-oracle-home-v1.js');
const loader = read('lunea-cache-refresh-v1.js');
const sectorColors = read('lunea-sector-color-system-v28.js');

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
assert.match(meihuaUi, /html:not\(\.lunea-home-visual-v36\) #luneaHomePortalV8 \.lunea-v8-tile\[data-key="meihua"\]/, 'legacy Meihua geometry must yield to V36');
assert.doesNotMatch(meihuaUi, /(?<!html:not\(\.lunea-home-visual-v36\) )#luneaHomePortalV8 \.lunea-v8-tile\[data-key="meihua"\]/, 'Meihua must not override V36 Home geometry');
assert.match(thai, /html:not\(\.lunea-home-visual-v36\) \.lunea-thai-home-tile/, 'legacy Thai geometry must yield to V36');
assert.doesNotMatch(thai, /(?<!html:not\(\.lunea-home-visual-v36\) )\.lunea-thai-home-tile\s*\{/, 'Thai must not override V36 Home geometry');
assert.match(thaiArt, /html:not\(\.lunea-home-visual-v36\) #luneaThaiHomeTileV24/, 'Thai art polish must yield Home surface ownership to V36');
assert.doesNotMatch(thaiArt, /(?<!html:not\(\.lunea-home-visual-v36\) )#luneaThaiHomeTileV24\s*\{/, 'Thai art polish must not restore a solid legacy V36 card body');
assert.match(sectorColors, /html:not\(\.lunea-home-visual-v36\) \.lunea-v8-tile\[data-lunea-sector\]/, 'legacy sector surfaces must yield to V36');
assert.doesNotMatch(sectorColors, /(?<!html:not\(\.lunea-home-visual-v36\) )\.lunea-v8-tile\[data-lunea-sector\]/, 'sector colors must not override V36 Home surfaces');
for (const source of [portal, hotfix, meihua, lenormand, thai, signal]) {
  assert.match(source, /lunea:home-(?:tile|portal)-ready|LUNEA_HOME_LAYOUT_V36/, 'tile producers must notify the layout owner');
}

assert.match(loader, /loadHomeVisualV36/);
assert.match(loader, /\.\/lunea-home-visual-v36\.js/);
assert.doesNotMatch(loader, /loadHomeFinalTuneV32\(\)/, 'the long-running V35 owner must not be loaded');
assert.doesNotMatch(loader, /loadHomeReadabilityV31\(\)/, 'legacy Home visual owner must not be loaded');

assert.match(owner, /-webkit-backdrop-filter:blur\(9px\)/, 'primary cards must use one clear-glass material layer');
assert.match(owner, /--v36-strength:\.22/, 'primary cards must expose visible internal aurora pockets');
assert.match(owner, /z-index:0;inset:-46% -34%/, 'aurora layer must remain inside the visible glass stack');
assert.match(owner, /rgba\(var\(--v36-a\),\.31\)/, 'aurora light pocket must be visible without becoming a solid fill');
assert.match(owner, /animation:luneaV36AuroraDrift 12s/);
assert.match(owner, /animation-duration:14s/, 'secondary drift must be weaker and slower');
assert.match(owner, /scale\(\.985\)/, 'touch compression must be preserved');
assert.match(owner, /300ms ease/, 'glass bloom must stay in the requested range');
assert.match(owner, /\.cat-text h3::before,[\s\S]*\.cat-text h3::after\{content:none!important;display:none!important\}/, 'SIGNAL must render its real title only once');
assert.doesNotMatch(owner, /h3::after\{content:'SIGNAL · MESSAGE'/, 'SIGNAL must not synthesize a duplicate title');
assert.match(signal, /height:82px!important;min-height:82px!important/, 'SIGNAL collapsed capsule must have deliberate visual weight');
assert.match(signal, /width:50px!important;height:50px!important;flex:0 0 50px!important/, 'SIGNAL icon must use a full glass well');
assert.match(signal, /width:34px!important;height:34px!important;flex:0 0 34px!important;border-radius:999px!important/, 'SIGNAL plus control must be a circular glass button');
assert.match(signal, /animation:luneaSignalMessageAurora 13s/, 'SIGNAL aurora must drift independently and subtly');
assert.match(signal, /height:78px!important;min-height:78px!important/, 'SIGNAL capsule must remain substantial at <=390px');
assert.match(signal, /@media\(prefers-reduced-motion:reduce\)[\s\S]*animation:none!important/, 'SIGNAL aurora must respect reduced motion');
assert.match(owner, /\.thai-v24-copy b\{[\s\S]*white-space:nowrap;overflow:hidden;text-overflow:ellipsis/, 'Thai title must stay on one contained line');
assert.match(owner, /\.thai-v24-copy span\{[\s\S]*white-space:nowrap;overflow:hidden;text-overflow:ellipsis/, 'Thai description must not overlap or escape the card');
assert.match(owner, /@media\(prefers-reduced-motion:reduce\)/);
assert.match(owner, /animation:none/);
assert.doesNotMatch(owner, /(?:7\/10|progress-bar|combined-score)/i, 'Home must not imply a combined score');
assert.doesNotMatch(owner, /lunea-daily-celestial|lunea-v22-moon|dailyBtn/, 'V36 must not downgrade DAILY ORBIT 6');

console.log('Home layout owner and Visual V36.2 SIGNAL capsule contract tests passed');
