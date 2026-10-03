import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-manual-everywhere-v1.js', import.meta.url), 'utf8');

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

console.log('INTIMACY manual entry boot repair: OK');
