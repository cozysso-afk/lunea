import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-manual-everywhere-v1.js', import.meta.url), 'utf8');

assert.equal((source.match(/function makeIntimacyManual/g) || []).length, 1);
assert.equal((source.match(/function hydrateCategories/g) || []).length, 1);
assert.ok(!/setTimeout\s*\(\s*hydrateCategories/.test(source));
assert.ok(!/requestAnimationFrame\s*\(\s*hydrateCategories/.test(source));

console.log('INTIMACY manual repair single-owner contract: OK');
