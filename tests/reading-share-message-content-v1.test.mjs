import assert from 'node:assert/strict';
import fs from 'node:fs';

const fix = fs.readFileSync(new URL('../lunea-reading-share-message-content-v1.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-reading-share-ui-v4.js', import.meta.url), 'utf8');

assert.doesNotThrow(() => new Function(fix), 'Message Oracle share content fix must remain valid JavaScript');
assert.match(fix, /messageOracleFrameFilled:true/, 'compose result must mark the Message Oracle frame as filled');
assert.match(fix, /value\.score/, 'share frame must render the signal score');
assert.match(fix, /value\.shortMessage/, 'share frame must render the short message');
assert.match(fix, /value\.details/, 'share frame must render the four detail cells');
assert.match(fix, /value\.contextLabel/, 'share frame must render the context label');
assert.ok(
  loader.indexOf('lunea-reading-share-message-content-v1.js') < loader.indexOf('lunea-reading-share-single-support-v1.js'),
  'Message Oracle content must be painted before a lone support card is enlarged'
);
assert.ok(
  loader.indexOf('lunea-reading-share-single-support-v1.js') < loader.indexOf('lunea-reading-share-ui-v6.js'),
  'layout fixes must load before Share UI V6'
);

console.log('reading-share-message-content-v1 contract OK');
