import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lunea-manual-everywhere-v1.js', import.meta.url), 'utf8');

const categoryFn = source.slice(source.indexOf('function categoryForContent'), source.indexOf('function hydrateCategories'));
assert.match(categoryFn, /lunea-intimacy-category/);
assert.ok(categoryFn.indexOf('lunea-intimacy-category') < categoryFn.indexOf('firstReading'),
  'INTIMACY must be classified by cabinet before looking for a late reading row');

console.log('INTIMACY pre-AI manual repair contract: OK');
