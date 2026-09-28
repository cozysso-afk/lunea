import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../lunea-learning-success-gate-v1.js',import.meta.url),'utf8');
let saves=0;
let shouldThrow=false;
const learning={record(payload){
  if(shouldThrow) throw new Error('save failed');
  saves++;
  return {saved:true,row:payload};
}};
const originalStart=function startSpread(question){return{question};};
const window={
  LUNEA_SPREAD_LEARNING_V1:learning,
  startSpread:originalStart,
};
window.window=window;

vm.runInNewContext(source,{
  window,
  console:{info(){},warn(){},error(){}},
  Object,Error
});

const gate=window.LUNEA_LEARNING_SUCCESS_GATE_V1;
assert.ok(gate,'success gate API should be exposed');
assert.equal(gate.version,2,'success gate must expose the wrapper-free V2 contract');
assert.equal(typeof gate.commit,'function');
assert.equal(window.startSpread,originalStart,'success gate must not wrap or replace startSpread');

const empty=gate.commit(null);
assert.equal(empty.saved,false);
assert.equal(empty.reason,'empty_payload');
assert.equal(saves,0);

const payload={question:'재회 가능성',positions:['현재','장벽']};
const saved=gate.commit(payload);
assert.equal(saved.saved,true);
assert.equal(saved.row,payload);
assert.equal(saves,1,'explicit post-success commit must write exactly once');

shouldThrow=true;
const failed=gate.commit({question:'연락 가능성',positions:['현재','행동']});
assert.equal(failed.saved,false);
assert.equal(failed.reason,'commit_failed');
assert.equal(saves,1,'failed learning write must not count as a saved correction');

window.LUNEA_SPREAD_LEARNING_V1=null;
const unavailable=gate.commit({question:'다른 질문'});
assert.equal(unavailable.saved,false);
assert.equal(unavailable.reason,'learning_unavailable');
assert.equal(saves,1);

console.log('spread-learning success-gate V2 tests: PASS');
