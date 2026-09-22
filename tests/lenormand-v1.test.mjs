import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const sourcePath = new URL('../lunea-lenormand-v1.js', import.meta.url);
const loaderPath = new URL('../lunea-cache-refresh-v1.js', import.meta.url);
const hotfixPath = new URL('../lunea-mobile-interaction-hotfix-v1.js', import.meta.url);
const source = fs.readFileSync(sourcePath, 'utf8');
const loader = fs.readFileSync(loaderPath, 'utf8');
const hotfix = fs.readFileSync(hotfixPath, 'utf8');

execFileSync(process.execPath, ['--check', sourcePath.pathname], {stdio:'pipe'});
execFileSync(process.execPath, ['--check', loaderPath.pathname], {stdio:'pipe'});
execFileSync(process.execPath, ['--check', hotfixPath.pathname], {stdio:'pipe'});

let seed = 0x12345678;
const crypto = {
  getRandomValues(array) {
    for (let i=0;i<array.length;i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      array[i] = seed;
    }
    return array;
  }
};
const document = {
  readyState:'loading',
  addEventListener(){},
  getElementById(){return null;},
  querySelector(){return null;},
  querySelectorAll(){return [];},
};
const window = {addEventListener(){}};
window.window = window;
const context = vm.createContext({window,document,crypto,console,setTimeout(){},setInterval(){return 1;},clearInterval(){},Math,Date,JSON,Uint8Array,Uint32Array,Number,Object,String,Array,RangeError});
vm.runInContext(source, context, {filename:'lunea-lenormand-v1.js'});

const api = window.LUNEA_LENORMAND_V1;
assert.ok(api, 'Lenormand API should be exposed');
assert.equal(api.version, 1);
assert.equal(api.cards.length, 36, 'deck must contain exactly 36 cards');
assert.equal(new Set(api.cards.map(c=>c.id)).size, 36, 'card IDs must be unique');
assert.equal(new Set(api.cards.map(c=>c.number)).size, 36, 'card numbers must be unique');
assert.deepEqual([...api.cards.map(c=>c.number)], Array.from({length:36},(_,i)=>i+1));

for (const card of api.cards) {
  assert.match(card.id, /^LN-\d{3}$/);
  assert.match(card.image, /^\.\/lenormand_\d{3}_[a-z0-9_]+\.jpg$/);
  const localImage = new URL('..' + card.image.slice(1), import.meta.url);
  assert.ok(fs.existsSync(localImage), `missing image: ${card.image}`);
}

for (const count of [3,5,9]) {
  for (let attempt=0;attempt<80;attempt++) {
    const draw = api.draw(count);
    assert.equal(draw.length,count);
    assert.equal(new Set(draw.map(c=>c.id)).size,count, `${count}-card draw must not duplicate cards`);
  }
}

const first5 = api.cards.slice(0,5);
const five = api.analyze(first5);
assert.equal(five.center.id,'LN-003');
assert.equal(five.adjacent.length,4);
assert.equal(five.mirrors.length,2);
assert.deepEqual(Array.from(five.mirrors[0], x=>x), [] , 'placeholder');
