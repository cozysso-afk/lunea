import assert from 'node:assert/strict';
import fs from 'node:fs';

const fix = fs.readFileSync(new URL('../lunea-reading-share-single-support-v1.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-reading-share-ui-v4.js', import.meta.url), 'utf8');

assert.doesNotThrow(() => new Function(fix), 'single-support share fix must remain valid JavaScript');
assert.match(fix, /itemsOnPage !== 1/, 'only lone support items should receive the expanded layout');
assert.match(fix, /TARGET_W = 800/, 'single support panel should expand substantially on the 1080px canvas');
assert.match(fix, /singleSupportExpanded:true/, 'repaired compose result must mark the expanded layout');
assert.match(loader, /lunea-reading-share-single-support-v1\.js/, 'stable share loader must load the single-support layout fix');
assert.ok(
  loader.indexOf('lunea-reading-share-single-support-v1.js') < loader.indexOf('lunea-reading-share-ui-v6.js'),
  'single-support layout fix must load before Share UI V6'
);

console.log('reading-share single-support layout contract OK');
