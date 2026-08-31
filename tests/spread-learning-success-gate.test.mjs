import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../lunea-learning-success-gate-v1.js',import.meta.url),'utf8');
let previewShown=true;
let saves=0;
let shouldThrow=false;
const overlay={classList:{contains(name){return name==='show'&&previewShown;}}};
const document={
  readyState:'loading',
  getElementById(id){return id==='luneaV20PreviewOverlay'?overlay:null;}
};
const learning={record(payload){saves++;return{saved:true,row:payload};}};
const window={
  LUNEA_SPREAD_LEARNING_V1:learning,
  startSpread(question){if(shouldThrow)throw new Error('draw failed');return{question};},
  addEventListener(){}
};
window.window=window;

vm.runInNewContext(source,{
  window,document,
  console:{info(){},warn(){},error(){}},
  setInterval(){return 0;},clearInterval(){},
  setTimeout(){return 1;},clearTimeout(){},
  Date,String,Error,Promise
});

const gate=window.LUNEA_LEARNING_SUCCESS_GATE_V1;
assert.ok(gate,'success gate API should be exposed');
assert.equal(gate.installRecordGate(),true);
assert.equal(gate.installStartGate(),true);

const deferred=learning.record({question:'재회 가능성',positions:['현재','장벽']});
assert.equal(deferred.saved,false);
assert.equal(deferred.reason,'deferred_until_draw');
assert.equal(saves,0,'preview confirmation alone must not learn');
assert.equal(gate.pending()?.question,'재회 가능성');

previewShown=false;
window.startSpread('재회 가능성',['현재','장벽'],'테스트','');
assert.equal(saves,1,'successful matching draw must commit exactly once');
assert.equal(gate.pending(),null);

previewShown=true;
learning.record({question:'연락 가능성',positions:['현재','행동']});
previewShown=false;
shouldThrow=true;
assert.throws(()=>window.startSpread('연락 가능성',['현재','행동'],'실패',''),/draw failed/);
assert.equal(saves,1,'failed draw must not become a learned correction');
assert.equal(gate.pending(),null);

console.log('spread-learning success-gate tests: PASS');
