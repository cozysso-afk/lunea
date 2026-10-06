import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');

const core = read('timing-oracle-v1.js');
const preload = read('lunea-timing-weekday-preload-v1.js');
const v16 = read('lunea-timing-image-assets-v16.js');
const v65 = read('lunea-recovery-ui-v65.js');
const boundary = read('lunea-reading-boundary-reset-v31.js');
const loader = read('lunea-structural-routing-v4.js');

assert.match(core, /assets\/timing-oracle\/cards\/LT-/, 'Timing core must directly prefer canonical LT artwork');
assert.match(core, /n >= 61 && n <= 67/, 'Timing core must keep weekday cards in the canonical asset directory');
assert.match(core, /data-lunea-timing-card-id/, 'inline Timing result must carry its semantic card id');
assert.match(core, /LUNEA_TIMING_ORACLE_V1 = Object\.freeze/, 'Timing core reset API must be public');
assert.match(core, /resetSupport:clearSupportTiming/, 'Timing core must expose closure-state reset');
assert.match(preload, /20261006-weekday-v2/, 'weekday preload must fetch the patched Timing core with a fresh cache key');

assert.match(v16, /n > 67/, 'artwork upgrader must support the full 67-card deck');
assert.match(v16, /assets\/timing-oracle\/cards\/LT-/, 'V16 must map 001-060 to canonical LT artwork');
assert.match(v16, /delete img\.dataset\.luneaTimingArtworkV65/, 'stale V65 ownership marker must be invalidated');
assert.match(v16, /luneaTimingCardId/, 'V16 must stamp the semantic Timing card id');

assert.match(v65, /Array\.from\(\{length:67\}/, 'V65 must know all 67 Timing cards');
assert.match(v65, /scheduleGeneration/, 'V65 delayed sync must be cancellable');
assert.match(v65, /liveSessionId !== sessionId/, 'V65 delayed sync must not cross reading sessions');
assert.match(v65, /pieces\.length\) return null/, 'V65 must not use stale dataset fallback over a current label');

assert.match(boundary, /LUNEA_RECOVERY_UI_V65\?\.cancelPending/, 'reading boundary must cancel old artwork sync');
assert.match(boundary, /LUNEA_TIMING_ORACLE_V1\?\.resetSupport/, 'reading boundary must clear Timing private state');
assert.match(boundary, /\.reading-item\[data-cat\]/, 'new sector reading selection must be a Timing boundary');
assert.match(loader, /lunea-reading-boundary-reset-v31\.js\?v=3103/, 'V31.3 must use a fresh loader key');

console.log('Timing Oracle session/artwork regression contracts: PASS');
