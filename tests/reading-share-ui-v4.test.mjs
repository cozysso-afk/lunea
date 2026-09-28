import assert from 'node:assert/strict';
import fs from 'node:fs';

const loader = fs.readFileSync(new URL('../lunea-reading-share-ui-v4.js', import.meta.url), 'utf8');
const ui = fs.readFileSync(new URL('../lunea-reading-share-ui-v6.js', import.meta.url), 'utf8');
const touch = fs.readFileSync(new URL('../lunea-horizontal-touch-stability-v1.js', import.meta.url), 'utf8');

assert.match(loader, /lunea-reading-share-oracle-pages-v1\.js/, 'stable entry must install standalone Oracle pagination');
assert.match(loader, /lunea-reading-share-ui-v6\.js/, 'stable entry must route to V6 preview UI');
assert.ok(loader.indexOf('lunea-reading-share-oracle-pages-v1.js') < loader.indexOf('lunea-reading-share-ui-v6.js'), 'Oracle pagination must install before V6');
assert.match(ui, /scroll-snap-type:x mandatory/, 'preview must be a swipeable horizontal 4:5 carousel');
assert.match(ui, /aspect-ratio:4\/5/, 'preview cards must stay 4:5');
assert.match(ui, /공유창 열기/, 'native share remains the only primary action');
assert.doesNotMatch(ui, /PNG 파일 저장/, 'redundant direct PNG download button must not appear');
assert.match(ui, /navigator\.share/, 'native iOS share sheet must be used');
assert.match(ui, /stopImmediatePropagation/, 'V6 must own the share button over older renderers');
assert.match(touch, /lunea-reading-share-ui-v4\.js/, 'runtime must load the stable share entry');

console.log('reading-share-ui stable loader / V6 contract OK');
