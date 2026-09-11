import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const question='그와의 신체적 끌림과 성적 리듬을 알고 싶어';
const proposal=()=>({spreadTitle:'친밀감 구조',positions:['신체적 끌림','성적 리듬','서로의 경계'],_luneaPreflight:{category:'INTIMACY',primaryIntent:'신체적 친밀감',requestedAxes:['끌림','리듬']}});
function harness(){
  const values=new Map(),nodes=new Map(),alerts=[];
  let quota=Infinity,startResult,starts=0,fail=false;
  function node(id){if(!nodes.has(id)){const classes=new Set();nodes.set(id,{id,value:'',textContent:'',checked:false,dataset:{},style:{},disabled:false,onclick:null,
    classList:{add(...xs){xs.forEach(x=>classes.add(x))},remove(...xs){xs.forEach(x=>classes.delete(x))},contains:x=>classes.has(x),toggle(x,v){v===false?classes.delete(x):classes.add(x)}},
    setAttribute(){},addEventListener(){},focus(){},replaceChildren(){},appendChild(){},querySelector(){return null}})}return nodes.get(id)}
  const document={readyState:'loading',getElementById:node,querySelector(){return null},querySelectorAll(){return[]},body:node('body'),documentElement:node('html'),head:node('head'),addEventListener(){}};
  const state={category:'INTIMACY',isAi:true,__luneaUniversalAI:true,allowReversed:false};
  const window={addEventListener(){},designSpread:async()=>proposal(),startSpread(){starts++;if(fail)throw Error('synthetic start failure');return startResult}};window.window=window;
  const localStorage={getItem:k=>values.get(k)||null,setItem(k,v){if(k==='LUNEA_SPREAD_USAGE_MEMORY_V1'&&v.length>quota)throw Error('quota');values.set(k,String(v))},removeItem:k=>values.delete(k)};
  const context=vm.createContext({window,document,state,localStorage,console:{info(){},warn(){},error(){}},setTimeout(){return 0},clearTimeout(){},setInterval(){return 0},clearInterval(){},requestAnimationFrame:f=>f(),MutationObserver:class{observe(){}},alert:x=>alerts.push(x),queueMicrotask,
    secureShuffle:x=>x.slice(),secureBool:()=>false,TAROT_DECK:Array.from({length:32},(_,i)=>({code:'T'+i})),makeCardWrapper:()=>({}),showOverlay(){}});
  const load=(file,expose='')=>vm.runInContext(read(file).replace(/\n\}\)\(\);\s*$/,`\n${expose}\n})();`),context);
  load('lunea-user-spread-learning-v1.js');
  load('lunea-learning-success-gate-v1.js');window.LUNEA_LEARNING_SUCCESS_GATE_V1.installRecordGate();window.LUNEA_LEARNING_SUCCESS_GATE_V1.installStartGate();
  node('question').value=question;
  return {window,state,node,values,context,load,alerts,api:window.LUNEA_SPREAD_LEARNING_V1,setResult:v=>startResult=v,setFail:v=>fail=v,setQuota:v=>quota=v,starts:()=>starts};
}
async function runPreview(h,kind,{edit=false,cancel=false,designFail=false}={}){
  const designer=async()=>{if(designFail)throw Error('synthetic AI failure');return proposal()};
  if(kind==='v2'){
    h.load('lunea-ai-spread-preflight-v2.js','window.__install=install;window.__caseContext=caseContext;');
    h.window.__install();h.window.designSpread=designer;
  }else{
    h.window.LUNEA_AI_SPREAD_PREFLIGHT={design:designer};
    h.load('lunea-universal-ai-opal-v20.js','window.__install=installDrawWrapper;');h.window.__install();
  }
  const task=h.node('drawBtn').onclick({preventDefault(){}});
  await new Promise(setImmediate);
  if(designFail){await task;return;}
  const prefix=kind==='v2'?'luneaSpreadPreview':'luneaV20Preview';
  assert.equal(h.node(prefix+'Overlay').classList.contains('show'),true,'actual production preview opened');
  assert.equal(h.api.count(),0,'opening does not learn');assert.equal(h.api.usageList().length,0);
  if(edit==='positions')h.node(prefix+'Positions').value+='\n사용자 추가 축';
  else if(edit)h.node(prefix+'Title').value='사용자가 바꾼 구조';
  h.node(prefix+(cancel?'Close':'Confirm')).onclick();
  await task;
}
for(const kind of ['v2','v20']){
  test(`${kind}: unchanged accepted start stores usage only`,async()=>{const h=harness();await runPreview(h,kind);assert.equal(h.starts(),1);assert.equal(h.api.count(),0);const row=h.api.usageList()[0];assert.equal(row.source,'ai_usage');assert.equal(row.category,'INTIMACY');assert.equal(row.positionCount,3)});
  test(`${kind}: edited successful start stores correction only`,async()=>{const h=harness();await runPreview(h,kind,{edit:true});assert.equal(h.api.count(),1);assert.equal(h.api.list()[0].source,'ai_correction');assert.equal(h.api.list()[0].category,'INTIMACY');assert.equal(h.api.usageList().length,0)});
  test(`${kind}: position edit records correction only`,async()=>{const h=harness();await runPreview(h,kind,{edit:'positions'});assert.equal(h.api.count(),1);assert.equal(h.api.list()[0].positions.length,4);assert.equal(h.api.usageList().length,0)});
  test(`${kind}: AI failure never starts or learns`,async()=>{const h=harness();await runPreview(h,kind,{designFail:true});assert.equal(h.starts(),0);assert.equal(h.api.count(),0);assert.equal(h.api.usageList().length,0)});
  test(`${kind}: cancel never starts or learns`,async()=>{const h=harness();await runPreview(h,kind,{cancel:true});assert.equal(h.starts(),0);assert.equal(h.api.count(),0);assert.equal(h.api.usageList().length,0)});
  for(const failure of ['throw','false','ok_false','reject'])test(`${kind}: ${failure} start stores neither signal`,async()=>{
    for(const edit of [false,true]){const h=harness();if(failure==='throw')h.setFail(true);else if(failure==='false')h.setResult(false);else if(failure==='ok_false')h.setResult({ok:false});else h.window.startSpread=()=>Promise.reject(Error('synthetic rejection'));
      await runPreview(h,kind,{edit});assert.equal(h.api.count(),0);assert.equal(h.api.usageList().length,0)}
  });
  test(`${kind}: async start must finish before learning`,async()=>{const h=harness();let resolve;h.setResult(new Promise(r=>resolve=r));const task=runPreview(h,kind);await new Promise(setImmediate);assert.equal(h.starts(),1);assert.equal(h.api.usageList().length,0);resolve();await task;assert.equal(h.api.usageList().length,1)});
}
function usagePayload(){const spread=proposal();return {question,category:'INTIMACY',originalSpread:spread,correctedSpread:spread,meta:spread._luneaPreflight}}
test('usage aggregates, remains weak, isolates category, and preserves correction bytes',()=>{
 const h=harness(),p=usagePayload();h.api.recordManual({question,category:'INTIMACY',spreadTitle:'직접 설계',positions:['끌림','리듬'],symmetric:false});
 const before=h.values.get(h.api.key);h.api.recordUsage(p);assert.equal(h.api.findUsage(question,2,{category:'INTIMACY'}).length,0,'single acceptance is not a template');
 h.api.recordUsage(p);assert.equal(h.api.usageList().length,1);assert.equal(h.api.usageList()[0].useCount,2);
 assert.equal(h.api.find(question,3,{category:'INTIMACY'})[0].row.source,'manual');
 const matches=h.api.findUsage('그와의 신체적 끌림과 성적 리듬은 어떤지',2,{category:'INTIMACY'});assert.equal(matches.length,1);assert.equal(matches[0].priority,'weak_usage');
 for(const category of ['LOVE','CAREER'])assert.equal(h.api.findUsage(question,3,{category}).length,0);
 assert.equal(h.values.get(h.api.key),before,'usage must not rewrite correction memory');
});
test('usage projects structure only, rejects edits, bounds storage and survives quota independently',()=>{
 const h=harness(),p=usagePayload();p.drawn=[{code:'SECRET_RNG'}];p.meta.debug={apiKey:'SECRET_KEY'};p.correctedSpread.cards=['SECRET_CARD'];p.interpretation='SECRET_PROSE';
 h.api.recordUsage(p);assert.doesNotMatch(h.values.get(h.api.usageKey),/SECRET|drawn|apiKey|interpretation|cards/);
 assert.equal(h.api.recordUsage({...p,correctedSpread:{spreadTitle:'edited',positions:p.originalSpread.positions}}).saved,false);
 h.api.recordManual({question:'기존 기록',positions:['하나','둘'],category:'GENERAL'});const before=h.values.get(h.api.key);
 for(let i=0;i<505;i++)h.api.recordUsage({...p,question:`합성 질문 ${i}`});assert.equal(h.api.usageList().length,500);
 h.setQuota(4000);assert.equal(h.api.recordUsage(p).saved,true);assert.ok(h.api.usageList().length<500);assert.equal(h.values.get(h.api.key),before);
});
test('dedup includes category and ordered spread structure',()=>{
 const h=harness(),p=usagePayload();h.api.recordUsage(p);h.api.recordUsage({...p,category:'LOVE'});
 const sp={spreadTitle:'다른 구조',positions:['성적 리듬','신체적 끌림']};h.api.recordUsage({...p,originalSpread:sp,correctedSpread:sp});assert.equal(h.api.usageList().length,3);
});
test('manual INTIMACY actual start keeps one manual row, symmetric target and axes',()=>{
 const h=harness();h.node('luneaManualAB').checked=true;h.node('luneaManualPositions').value='끌림\n리듬';
 h.load('lunea-manual-structure-v1.js','window.__manual=startManualSpread;');
 h.window.__manual(question,['A 끌림','A 리듬','B 끌림','B 리듬'],'직접 A/B','');
 const row=h.api.list()[0];assert.equal(h.api.count(),1);assert.equal(row.source,'manual');assert.equal(row.category,'INTIMACY');assert.equal(row.targetStructure,'두 사람 A/B 대칭 비교');assert.equal(row.requestedAxes.length,2);assert.equal(h.api.usageList().length,0);
});
test('preflight retrieves usage separately below manual/correction guidance',()=>{
 const h=harness();h.api.recordManual({question,category:'INTIMACY',positions:['끌림','리듬']});h.api.recordUsage(usagePayload());h.api.recordUsage(usagePayload());
 h.load('lunea-ai-spread-preflight-v2.js','window.__cases=caseContext;');const c=h.window.__cases(question);
 assert.equal(c.learnedMatches[0].source,'manual');assert.match(c.usageText,/AI 채택 사용 참고/);assert.doesNotMatch(c.usageText,/교정 정답/);
 assert.match(read('lunea-ai-spread-preflight-v2.js'),/사용자 직접 설계 > 사용자 교정 > 반복 AI 채택 사용/);
});
