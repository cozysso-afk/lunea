import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const manual = read('lunea-manual-structure-v1.js');
const everywhere = read('lunea-manual-everywhere-v1.js');
const manual20 = read('lunea-manual-limit20-v17.js');
const loader = read('lunea-structural-routing-v4.js');

test('base manual entry resolves its owning category instead of hard-coding GENERAL', () => {
  assert.doesNotMatch(manual, /opener\(\s*['"]GENERAL['"]/);
  assert.match(manual, /__luneaManualOriginCategory = originCategory/);
  assert.match(manual, /state\.category = originCategory/);
  assert.match(manual, /state\.__luneaIntimacyReading = originCategory === 'INTIMACY'/);
});

test('category-specific manual entry preserves category and catches late INTIMACY cabinets', () => {
  assert.match(everywhere, /item\.dataset\.cat = category/);
  assert.match(everywhere, /state\.__luneaManualOriginCategory = cat/);
  assert.match(everywhere, /state\.category = cat/);
  assert.match(everywhere, /MutationObserver/);
  assert.match(everywhere, /scanCategories/);
});

test('13-20 card manual path preserves origin category', () => {
  assert.match(manual20, /__luneaManualOriginCategory \|\| state\?\.category/);
  assert.match(manual20, /state\.category = originCategory/);
  assert.match(manual20, /state\.__luneaIntimacyReading = originCategory === 'INTIMACY'/);
});

test('nested loader cache keys are bumped in parser and sequential paths', () => {
  assert.equal((loader.match(/lunea-manual-structure-v1\.js\?v=105/g) || []).length, 2);
  assert.equal((loader.match(/lunea-manual-everywhere-v1\.js\?v=103/g) || []).length, 2);
  assert.equal((loader.match(/lunea-manual-limit20-v17\.js\?v=1705/g) || []).length, 2);
  assert.doesNotMatch(loader, /lunea-manual-structure-v1\.js\?v=103/);
});
