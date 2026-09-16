import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui = fs.readFileSync(new URL('../lunea-reading-share-ui-v4.js', import.meta.url), 'utf8');
const touch = fs.readFileSync(new URL('../lunea-horizontal-touch-stability-v1.js', import.meta.url), 'utf8');

assert.match(ui, /scroll-snap-type:x mandatory/, 'preview must be a swipeable horizontal 4:5 carousel');
assert.match(ui, /aspect-ratio:4\/5/, 'preview cards must stay 4:5');
assert.match(ui, /공유창 열기/, 'native share remains the only primary action');
assert.doesNotMatch(ui, /PNG 파일 저장/, 'redundant direct PNG download button must not appear');
assert.match(ui, /navigator\.share/, 'native iOS share sheet must be used');
assert.match(ui, /stopImmediatePropagation/, 'V4 must own the share button over older renderers');
assert.match(touch, /lunea-reading-share-ui-v4\.js/, 'runtime must load preview UI V4');

console.log('reading-share-ui-v4 contract OK');
