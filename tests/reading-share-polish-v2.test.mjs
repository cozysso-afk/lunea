import assert from 'node:assert/strict';
import fs from 'node:fs';

const polish = fs.readFileSync(new URL('../lunea-reading-share-polish-v2.js', import.meta.url), 'utf8');
const touch = fs.readFileSync(new URL('../lunea-horizontal-touch-stability-v1.js', import.meta.url), 'utf8');

assert.match(polish, /BW=1080,BH=1350/, 'share output must remain 4:5');
assert.match(polish, /commons\.wikimedia\.org\/w\/api\.php/, 'RWS Wikimedia Special:FilePath URLs must resolve to CORS-safe direct artwork');
assert.match(polish, /origin=\*/, 'Wikimedia API request must permit cross-origin Pages use');
assert.match(polish, /off<source\.length;off\+=6/, 'main tarot pages should use spacious six-card pagination');
assert.match(polish, /추가\\s\*카드/, 'additional cards must be separated from the main spread');
assert.match(polish, /await cover\(p\)/, 'share must render a dedicated polished cover');
assert.match(polish, /owner\(\)\.renderFiles\(\)/, 'existing oracle/support pages must be preserved');
assert.match(polish, /dataset\.luneaShareRenderer='v2'/, 'the existing single share button must be rebound to V2');
assert.match(touch, /lunea-reading-share-polish-v2\.js/, 'runtime must load the polished renderer');
assert.match(touch, /order:9999!important/, 'share button must remain the final action');

console.log('reading-share-polish-v2 contract OK');
