import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const transit = read('lunea-transit-range-v1.js');
const horary = read('astro-horary-v1.js');
const lifecycle = read('lunea-reading-lifecycle-v59.js');

// Transit V3 is the canonical long-range chip owner and must absorb V57's old marker.
assert.match(transit, /matches\.forEach\(node => \{ if \(node !== button\) node\.remove\(\); \}\)/);
assert.match(transit, /button\.dataset\.luneaV57Days = String\(days\)/);
assert.match(transit, /__luneaLongRangeDedupeV3/);

// Opening a different Horary context, including blank standalone entry, invalidates old result.
assert.match(horary, /const previousMode = stateHorary\.mode/);
assert.match(horary, /const changed = q !== stateHorary\.question \|\| mode !== previousMode/);

// New reading sessions clear exact-reading attachments so Horary cannot leak forward.
assert.match(lifecycle, /LUNEA_READING_ATTACHMENTS_V1\?\.clearForNewReading\?\.\(\)/);

console.log('astro UI/state boundary invariants: OK');
