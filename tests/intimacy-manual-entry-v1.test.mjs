import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-manual-everywhere-v1.js', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../lunea-intimacy-ai-bridge-v34.js', import.meta.url), 'utf8');

assert.match(source, /MANUAL SPREAD EVERYWHERE V1\.4/);
assert.match(source, /function categoryForContent\(content\)/);
assert.match(source, /content\.closest\?\.\('\.lunea-intimacy-category'\)/,
  'INTIMACY cabinet must be recognized before its late AI row exists');
assert.match(source, /if \(!item && category === 'INTIMACY'\) item = makeIntimacyManual\(content\)/,
  'INTIMACY direct-input row must be repaired deterministically');
assert.match(source, /item\.dataset\.cat = 'INTIMACY'/);
assert.match(source, /item\.dataset\.manualSpread = '1'/);
assert.ok(!/MutationObserver/.test(source), 'manual entry repair must not add observer polling');
assert.ok(!/setInterval\s*\(/.test(source), 'manual entry repair must not poll');

assert.match(bridge, /INTIMACY AI BRIDGE V34\.5/);
assert.match(bridge, /function hydrateManualEntry\(\)/);
assert.match(bridge, /LUNEA_MANUAL_EVERYWHERE_V1\?\.hydrateCategories\?\.\(\)/,
  'late INTIMACY cabinet/AI creation must trigger the existing manual hydrator once');
assert.match(bridge, /content\.prepend\(item\);\s*hydrateManualEntry\(\);/,
  'manual row repair must run immediately after the INTIMACY AI row is attached');
assert.ok(!/MutationObserver/.test(bridge), 'INTIMACY bridge must not add observer polling for manual repair');

console.log('INTIMACY manual entry boot/late-cabinet repair: OK');
