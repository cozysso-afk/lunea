import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../lunea-learning-cloud-sync-v1.js',import.meta.url),'utf8');
const values=new Map();
const localStorage={getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
const window={addEventListener(){}};window.window=window;
const document={readyState:'loading',getElementById(){return null},querySelector(){return null},addEventListener(){},head:{appendChild(){}},body:{appendChild(){},classList:{add(){},remove(){}}}};
vm.runInNewContext(source,{window,document,localStorage,console:{info(){},warn(){},error(){}},setTimeout(){return 0},clearTimeout(){},setInterval(){return 0},clearInterval(){},fetch(){throw new Error('network should not run')},Date,Map,Array,Object,String,Number,JSON,RegExp,Error,Promise});

const api=window.LUNEA_LEARNING_CLOUD_SYNC_V1;
assert.ok(api,'cloud sync API should be exposed');
assert.equal(api.version,1);
assert.equal(api.max,1000);

const local=[{question:'같은 상대 답장 시점',questionKey:'같은상대답장시점',positions:['지금','내일'],updatedAt:200,source:'manual'}];
const remote=[
  {question_key:'같은상대답장시점',source:'ai_correction',updated_at:'1970-01-01T00:00:00.100Z',payload:{question:'old',questionKey:'같은상대답장시점',positions:['A','B'],updatedAt:100,source:'ai_correction'}},
  {question_key:'새원격',source:'manual',updated_at:'1970-01-01T00:00:00.300Z',payload:{question:'새 원격',questionKey:'새원격',positions:['하나','둘'],updatedAt:300,source:'manual'}}
];
const merged=api.mergeRows(local,remote);
assert.equal(merged.length,2);
assert.equal(merged.find(x=>x.questionKey==='같은상대답장시점').positions[0],'지금','newer local correction wins');
assert.equal(merged.find(x=>x.questionKey==='새원격').source,'manual');
assert.ok(api.questionKey({questionKey:' a '.repeat(700)}).length<=1024,'question key respects DB constraint');

const manyLocal=Array.from({length:1005},(_,i)=>({question:`q${i}`,questionKey:`q${i}`,positions:['a','b'],updatedAt:i+1,source:'manual'}));
assert.equal(api.mergeRows(manyLocal,[]).length,1000,'cloud merge must retain the same 1000-row cap as local learning');

console.log('spread-learning-cloud-sync tests: PASS');
