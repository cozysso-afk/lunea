import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui = fs.readFileSync(new URL('../lunea-reading-share-ui-v6.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-reading-share-ui-v4.js', import.meta.url), 'utf8');
const touch = fs.readFileSync(new URL('../lunea-horizontal-touch-stability-v1.js', import.meta.url), 'utf8');

assert.match(loader, /lunea-reading-share-ui-v6\.js/, 'stable share loader must route to V6');
assert.match(ui, /const BW = 1080;/, 'approved logical layout width must remain 1080');
assert.match(ui, /const BH = 1350;/, 'approved logical layout height must remain 1350');
assert.match(ui, /const OUTPUT_WIDTH = 1200;/, 'iPhone-optimized PNG width must be 1200');
assert.match(ui, /const OUTPUT_HEIGHT = 1500;/, 'iPhone-optimized PNG height must be 1500');
assert.match(ui, /async function normalizeResult/, 'V6 must normalize rendered pages before sharing');
assert.match(ui, /ctx\.drawImage\(source, 0, 0, source\.width, source\.height, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT\)/, 'each page must be flattened into the exact 4:5 output frame');
assert.match(ui, /im\.naturalWidth !== OUTPUT_WIDTH \|\| im\.naturalHeight !== OUTPUT_HEIGHT/, 'encoded PNG dimensions must be verified before preview/share');
assert.match(ui, /output:Object\.freeze\(\{width:OUTPUT_WIDTH,height:OUTPUT_HEIGHT,aspectRatio:'4:5'\}\)/, 'runtime API must expose the 4:5 output contract');
assert.doesNotMatch(ui, /PNG 파일 저장/, 'share UI must not bring back the redundant direct-download button');
assert.match(ui, /navigator\.share\(\{files/, 'native iPhone share sheet remains the save path');

assert.match(touch, /grid-template-columns:repeat\(6,minmax\(0,1fr\)\)!important/, 'reading action grid must use six CSS tracks');
assert.match(touch, /> button\{[\s\S]*?grid-column:span 2!important/, 'ordinary actions must remain visually three-up');
assert.match(touch, /#luneaTopCopyPrompt\{[\s\S]*?grid-column:span 3!important[\s\S]*?order:9998!important/, 'master prompt must occupy the left half of the final row');
assert.match(touch, /#luneaShareReadingPng\{[\s\S]*?grid-column:span 3!important[\s\S]*?order:9999!important/, 'PNG share must occupy the right half of the final row');
assert.doesNotMatch(touch, /lunea-reading-action-tail-v1\.js/, 'the unstable DOM-moving action-tail loader must stay disconnected');

console.log('reading share output V6 contract OK');
