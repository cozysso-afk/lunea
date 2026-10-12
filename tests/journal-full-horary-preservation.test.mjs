import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../lunea-reading-journal-v2.js', import.meta.url), 'utf8');
const start = source.indexOf('  function mergedReading(');
const end = source.indexOf('\n  function clean(', start);
assert.ok(start >= 0 && end > start);
const context = vm.createContext({});
vm.runInContext('const clone = value => JSON.parse(JSON.stringify(value));\n' + source.slice(start,end) + '\nthis.merge = mergedReading;', context);
const json = value => JSON.parse(JSON.stringify(value));

test('full Horary / Cross / AI evidence survives lightweight list refresh without mutation', () => {
  const full = {id:'same',ai:'complete interpretation',horary:{schema:'LUNEA_HORARY_V1',planets:{Venus:{longitude:123}},cross_interpretation_v2:{schema:'LUNEA_HORARY_PRASHNA_CROSS_V2'},prashna_v1:{schema:'LUNEA_PRASHNA_V1'}}};
  const light = {id:'same',ai:'short',horary:{schema:'LUNEA_HORARY_V1',lightweight:true,screenSnapshot:{}}};
  const before = json(full);
  const result = context.merge(full,light);
  assert.deepEqual(json(result), before);
  assert.notEqual(result, full);
  assert.deepEqual(full,before);
  assert.match(source,/existing\.reading = mergedReading\(existing\.reading, incoming\.reading\)/);
  assert.match(source,/found\.reading = mergedReading\(found\.reading, reading\)/);
});

test('full new payloads and ordinary tarot updates still replace old reading content', () => {
  assert.deepEqual(json(context.merge({ai:'old',horary:{lightweight:true}}, {ai:'new',horary:{schema:'LUNEA_HORARY_V1'}})), {ai:'new',horary:{schema:'LUNEA_HORARY_V1'}});
  assert.deepEqual(json(context.merge({ai:'old',cards:[]}, {ai:'new',cards:[{code:'Sun'}]})), {ai:'new',cards:[{code:'Sun'}]});
  assert.deepEqual(json(context.merge(null,{horary:{lightweight:true}})),{horary:{lightweight:true}});
});
