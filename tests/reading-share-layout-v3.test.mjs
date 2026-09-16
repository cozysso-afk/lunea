import assert from 'node:assert/strict';
import fs from 'node:fs';

const v3 = fs.readFileSync(new URL('../lunea-reading-share-polish-v3.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-horizontal-touch-stability-v1.js', import.meta.url), 'utf8');

assert.doesNotThrow(() => new Function(v3), 'share layout V3 must remain valid JavaScript');
assert.match(v3, /function supportItems\(p\)/, 'V3 must collect additional/timing/message support cards');
assert.match(v3, /off<items\.length;off\+=4/, 'support cards must be consolidated four per 4:5 page');
assert.match(v3, /kind:'tarot'/, 'additional tarot cards must join the support layout');
assert.match(v3, /kind:'timing'/, 'Timing Oracle cards must join the support layout');
assert.match(v3, /kind:'message'/, 'Message Oracle must join the support layout');
assert.match(v3, /baseTarotPages=Math\.ceil/, 'V3 must preserve later non-duplicated oracle/AI pages from the owner');
assert.match(v3, /throw Error\(`타로 이미지 로딩 실패:/, 'missing RWS artwork must fail instead of exporting blank cards');
assert.match(loader, /lunea-reading-share-polish-v3\.js/, 'runtime must load V3 share presentation');
assert.doesNotMatch(loader, /lunea-reading-share-polish-v2\.js/, 'runtime must not load the retired sparse V2 presentation');

console.log('reading-share-layout-v3 contract OK');
