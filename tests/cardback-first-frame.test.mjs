import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const index = read('index.html');
const ios = read('lunea-ios-performance-v3.js');
const restore = read('lunea-cardback-restore-v19.js');
const finalOwner = read('lunea-cardback-sector-v20.js');

for (const asset of [
  'tarot_back_general.jpeg',
  'tarot_back_love.jpeg',
  'tarot_back_stock.jpeg',
  'tarot_back_career_study.jpeg',
  'assets/intimacy-oracle/tarot_back_intimacy_final.png'
]) assert.ok((index + ios + restore + finalOwner).includes(asset), asset + ' missing');

assert.match(index, /function deckBackFile\(\)/);
assert.match(index, /const backSrc=deckBackFile\(\)/);
assert.match(index, /data-lunea-cardback-first-frame="1"/);
const baseFactory = index.slice(index.indexOf('function makeCardWrapper'), index.indexOf('function flipAt'));
assert.doesNotMatch(baseFactory, /back_love\.PNG|back_stock\.PNG|back_career\.PNG|back_general\.PNG|back_daily\.PNG/);
assert.doesNotMatch(baseFactory, /prefix\.PNG|prefix\}\}\.PNG/);

const iosFactory = ios.slice(ios.indexOf('W.makeCardWrapper = function'), ios.indexOf("console.info('✦ LUNEA iOS Performance V3 patched makeCardWrapper')"));
assert.match(iosFactory, /deckBackFile/);
assert.match(iosFactory, /tarot_back_love\.jpeg/);
assert.match(iosFactory, /tarot_back_stock\.jpeg/);
assert.match(iosFactory, /tarot_back_career_study\.jpeg/);
assert.match(iosFactory, /luneaCardbackFirstFrame/);
assert.doesNotMatch(iosFactory, /back_love\.PNG|back_stock\.PNG|back_career\.PNG|back_general\.PNG|back_daily\.PNG/);
assert.doesNotMatch(iosFactory, /prefix \+ '\.PNG'/);

assert.match(restore, /const RELEASE = '19\.2'/);
assert.match(restore, /LOVE: 'tarot_back_love\.jpeg'/);
assert.match(restore, /STOCK: 'tarot_back_stock\.jpeg'/);
assert.match(restore, /CAREER: 'tarot_back_career_study\.jpeg'/);
assert.doesNotMatch(restore, /LOVE: 'back_love\.PNG'|STOCK: 'back_stock\.PNG'|CAREER: 'back_career\.PNG'|GENERAL: 'back_general\.PNG'|DAILY: 'back_daily\.PNG'/);

console.log('Tarot card-back first-frame contracts: PASS');
