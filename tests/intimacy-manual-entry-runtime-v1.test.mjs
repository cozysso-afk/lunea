import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-manual-everywhere-v1.js', import.meta.url), 'utf8');

assert.match(source, /function categoryForContent\(content\)/);
assert.match(source, /content\.closest\?\.\('\.lunea-intimacy-category'\)/);
assert.match(source, /if \(!item && category === 'INTIMACY'\) item = makeIntimacyManual\(content\)/);
assert.ok(!/MutationObserver/.test(source));
assert.ok(!/setInterval\s*\(/.test(source));

console.log('INTIMACY manual runtime repair contract: OK');
