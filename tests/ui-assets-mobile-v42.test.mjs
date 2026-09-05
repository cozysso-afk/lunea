import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const backs = read('lunea-cardback-sector-v20.js');
const timing = read('lunea-timing-image-assets-v16.js');
const horary = read('lunea-horary-mobile-stability-v42.js');
const loader = read('lunea-cache-refresh-v1.js');

for (const file of [
  'tarot_back_general.jpeg',
  'tarot_back_love.jpeg',
  'tarot_back_stock.jpeg',
  'tarot_back_career_study.jpeg'
]) assert.match(backs, new RegExp(file.replace('.', '\\.')));

assert.match(backs, /DAILY:\s*'tarot_back_general\.jpeg'/);
assert.match(backs, /GENERAL:\s*'tarot_back_general\.jpeg'/);
assert.doesNotMatch(backs, /back_daily\.PNG|back_love\.PNG|back_stock\.PNG|back_career\.PNG/);

assert.match(timing, /n >= 41 && n <= 50 \? 'PNG' : 'jpg'/);
assert.match(timing, /n < 1 \|\| n > 60/);
assert.match(timing, /hasCorrectAssetPath/);
assert.match(timing, /timing-card-label\{display:none!important\}/);

assert.match(horary, /align-items:flex-start!important/);
assert.match(horary, /height:100dvh!important/);
assert.match(horary, /overscroll-behavior:contain!important/);
assert.match(horary, /overflow-anchor:none!important/);
assert.match(horary, /body\.style\.position = 'fixed'/);
assert.match(horary, /W\.scrollTo\?\.\(0, y\)/);

for (const asset of [
  'lunea-cardback-sector-v20.js',
  'lunea-timing-image-assets-v16.js',
  'lunea-horary-mobile-stability-v42.js'
]) assert.ok(loader.includes(asset), `${asset} missing from cache loader`);

assert.ok(loader.indexOf('lunea-horary-balance-guard-v41.js') < loader.indexOf('lunea-horary-mobile-stability-v42.js'), 'V42 must load after V41');
console.log('LUNEA uploaded assets + Horary mobile V42 contracts: PASS');
