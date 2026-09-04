import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

function learningContext(seed=[]) {
  const KEY='LUNEA_SPREAD_CORRECTION_MEMORY_V1';
  const values=new Map([[KEY,JSON.stringify(seed)]]);
  const localStorage={getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const window={addEventListener(){}}; window.window=window;
  vm.runInNewContext(read('lunea-user-spread-learning-v1.js'),{
    window,localStorage,
    document:{readyState:'loading',addEventListener(){},getElementById(){return null}},
    console:{info(){},warn(){},error(){}},setInterval(){return 0},clearInterval(){},setTimeout(){return 0},requestAnimationFrame(fn){fn()},MutationObserver:class{observe(){}},Date,Math,Set,JSON
  });
  return {learning:window.LUNEA_SPREAD_LEARNING_V1,values,KEY};
}

test('13-20 card manual path completes draw and learns once', () => {
  let source=read('lunea-manual-limit20-v17.js').replace(/\n\}\)\(\);\s*$/, '\nwindow.__auditLaunchManual=launchManual;\n})();');
  let learned=0, oracleDraws=0, tarotRepairs=0, overlays=0; const alerts=[];
  const nodes=new Map();
  const node=(id,extra={})=>({id,value:'',checked:false,textContent:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},replaceChildren(){},appendChild(){},focus(){},addEventListener(){},querySelector(){return null},...extra});
  for(const id of ['cards','results','aiBox','spreadType','spreadQuestion','spreadRationale','luneaStructuralV4Pager','sheet'])nodes.set(id,node(id));
  nodes.set('luneaManualTitle',node('luneaManualTitle',{value:'13장 직접 배열'}));
  nodes.set('luneaManualAB',node('luneaManualAB',{checked:false}));
  const document={readyState:'loading',body:{classList:{add(){}}},getElementById:id=>nodes.get(id)||null,addEventListener(){}};
  const state={category:'INTIMACY',__luneaManualOriginCategory:'INTIMACY',allowReversed:false};
  let learnedPayload=null;
  const window={addEventListener(){},LUNEA_SPREAD_LEARNING_V1:{recordManual(p){learned++;learnedPayload=p;return{saved:true}}},LUNEA_INTIMACY_BURGUNDY_V40:{repairTarotCards(){tarotRepairs++}},LUNEA_INTIMACY_ORACLE_UI_V36:{performOracleDraw(){oracleDraws++}}}; window.window=window;
  vm.runInNewContext(source,{window,document,state,localStorage:{setItem(){},getItem(){return null}},console,setInterval(){return 0},clearInterval(){},setTimeout(fn){fn();return 0},clearTimeout(){},secureShuffle:x=>x.slice(),TAROT_DECK:Array.from({length:30},(_,i)=>({code:`C${i+1}`})),secureBool:()=>false,makeCardWrapper:()=>({}),showOverlay:()=>{overlays++},alert:m=>alerts.push(String(m)),JSON,Set,String,Error});
  window.__auditLaunchManual('13장 수동 배열이 학습되는지',{positions:Array.from({length:13},(_,i)=>`포지션 ${i+1}`),symmetric:false,axes:[]});
  assert.deepEqual(alerts,[]);
  assert.equal(state.drawn.length,13);
  assert.equal(learned,1);
  assert.equal(learnedPayload.category,'INTIMACY');
  assert.equal(tarotRepairs,1); assert.equal(oracleDraws,1); assert.equal(overlays,1);
});

test('LOVE and INTIMACY memories are isolated and sexual questions classify as intimacy', () => {
  const {learning}=learningContext();
  assert.equal(learning.version,5);
  assert.equal(learning.profile('A와 B 중 누구와 속궁합과 성적 리듬이 더 잘 맞는지 비교').domain,'intimacy');
  const q='A와 B 관계를 같은 축으로 비교';
  const love=learning.record({question:q,category:'LOVE',originalSpread:{spreadTitle:'기본',positions:['a','b']},correctedSpread:{spreadTitle:'LOVE 구조',positions:['감정','행동','현실 장벽']}});
  const intimacy=learning.record({question:q,category:'INTIMACY',originalSpread:{spreadTitle:'기본',positions:['a','b']},correctedSpread:{spreadTitle:'INTIMACY 구조',positions:['신체적 끌림','성적 리듬','경계']}});
  assert.equal(love.saved,true); assert.equal(intimacy.saved,true); assert.equal(learning.count(),2);
  assert.equal(learning.find(q,3,{category:'LOVE'})[0]?.row.spreadTitle,'LOVE 구조');
  assert.equal(learning.find(q,3,{category:'INTIMACY'})[0]?.row.spreadTitle,'INTIMACY 구조');
  assert.ok(learning.find(q,3,{category:'LOVE'}).every(x=>x.row.category==='LOVE'));
});

test('legacy local memories are retained and assigned a category instead of being cleared', () => {
  const seed=[{id:'old1',question:'그와의 속궁합과 성적 리듬',questionKey:'그와의속궁합과성적리듬',spreadTitle:'기존 배열',positions:['끌림','리듬','경계'],source:'manual',createdAt:1,updatedAt:1}];
  const {learning}=learningContext(seed);
  assert.equal(learning.count(),1);
  assert.equal(learning.list()[0].category,'INTIMACY');
  assert.equal(learning.list()[0].structureProfile.domain,'intimacy');
});

test('preflight uses learned memory as classified guidance instead of direct spread copying', () => {
  const source=read('lunea-ai-spread-preflight-v2.js');
  assert.doesNotMatch(source,/learnedLongSpread|LEARNED LONG SPREAD V5/,'learned long spreads must not bypass AI classification');
  assert.match(source,/사용자가 과거에 확정한 학습 사례 — 복사 금지/);
  assert.match(source,/과거 포지션 문구나 카드 수를 통째로 따라 하지 않는다/);
  assert.match(source,/cases\.learnedText/);
});

test('detailed question fallback splits explicit requirements when normal spread design is insufficient', () => {
  let source=read('lunea-ai-spread-preflight-v2.js').replace(/\n\}\)\(\);\s*$/, '\nwindow.__auditSegments=questionSegments;window.__auditFallback=detailedFallback;\n})();');
  const state={category:'LOVE'};
  const window={addEventListener(){}};window.window=window;
  vm.runInNewContext(source,{window,state,localStorage:{getItem(){return null}},document:{readyState:'loading',getElementById(){return null},addEventListener(){},head:{appendChild(){}},body:{appendChild(){},classList:{add(){},remove(){}}}},console:{info(){},warn(){},error(){}},setInterval(){return 0},clearInterval(){},setTimeout(){return 0},fetch(){throw new Error('network should not run')},JSON,String,Array,Number,Error,Set});
  const q='A가 지금 나를 어떻게 생각하는지, 그리고 아직 감정이 남았는지, 추가로 실제 연락 의도가 있는지, 마지막으로 연락을 막는 현실적 이유가 무엇인지 알고 싶다';
  const seg=window.__auditSegments(q);
  assert.ok(seg.length>=4,`expected >=4 semantic segments, got ${seg.length}`);
  const base={spreadTitle:'기본',positions:['현재 상황','숨은 변수','핵심 조언']};
  const fallback=window.__auditFallback(q,base,'test');
  assert.equal(fallback.layoutType,'question-segment-fallback-v6');
  assert.ok(fallback.positions.length>=4&&fallback.positions.length<=20);
  assert.equal(fallback._luneaPreflight.category,'LOVE');
});

test('cloud sync key separates same question by category', () => {
  let source=read('lunea-learning-cloud-sync-v1.js');
  const values=new Map(); const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const window={addEventListener(){}}; window.window=window;
  vm.runInNewContext(source,{window,localStorage,document:{readyState:'loading',getElementById(){return null},querySelector(){return null},body:{appendChild(){}},head:{appendChild(){}}},console:{info(){},warn(){},error(){}},setInterval(){return 0},clearInterval(){},setTimeout(){return 0},clearTimeout(){},fetch:async()=>({ok:true,json:async()=>[]}),Date,Map,JSON,String,Array,Error});
  const api=window.LUNEA_LEARNING_CLOUD_SYNC_V1;
  const love=api.questionKey({questionKey:'같은질문',category:'LOVE'});
  const intimacy=api.questionKey({questionKey:'같은질문',category:'INTIMACY'});
  assert.notEqual(love,intimacy);
  assert.match(love,/^LOVE::/); assert.match(intimacy,/^INTIMACY::/);
});
