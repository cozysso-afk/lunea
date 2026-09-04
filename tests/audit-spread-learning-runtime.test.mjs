import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('13-20 card manual path completes draw and learns after success', () => {
  let source = fs.readFileSync(new URL('../lunea-manual-limit20-v17.js', import.meta.url), 'utf8');
  source = source.replace(/\n\}\)\(\);\s*$/, '\nwindow.__auditLaunchManual = launchManual;\n})();');

  let learned = 0, oracleDraws = 0, tarotRepairs = 0, overlays = 0;
  const alerts = [];
  const nodes = new Map();
  const node = (id, extra={}) => ({
    id, value:'', checked:false, textContent:'', style:{}, dataset:{},
    classList:{add(){},remove(){},toggle(){}}, replaceChildren(){}, appendChild(){},
    focus(){}, addEventListener(){}, querySelector(){return null}, ...extra
  });
  nodes.set('luneaManualTitle', node('luneaManualTitle',{value:'13장 직접 배열'}));
  nodes.set('luneaManualAB', node('luneaManualAB',{checked:false}));
  for (const id of ['cards','results','aiBox','spreadType','spreadQuestion','spreadRationale','luneaStructuralV4Pager','sheet']) nodes.set(id,node(id));

  const document = {readyState:'loading',body:{classList:{add(){}}},getElementById:id=>nodes.get(id)||null,addEventListener(){}};
  const state = {category:'INTIMACY',__luneaManualOriginCategory:'INTIMACY',allowReversed:false};
  const window = {
    addEventListener(){},
    LUNEA_SPREAD_LEARNING_V1:{recordManual(){learned++; return {saved:true}}},
    LUNEA_INTIMACY_BURGUNDY_V40:{repairTarotCards(){tarotRepairs++}},
    LUNEA_INTIMACY_ORACLE_UI_V36:{performOracleDraw(){oracleDraws++}},
  };
  window.window=window;
  const deck=Array.from({length:30},(_,i)=>({code:`C${i+1}`}));
  vm.runInNewContext(source, {
    window, document, state, localStorage:{setItem(){},getItem(){return null}}, console,
    setInterval(){return 0}, clearInterval(){}, setTimeout(fn){fn();return 0}, clearTimeout(){},
    secureShuffle:x=>x.slice(), TAROT_DECK:deck, secureBool:()=>false,
    makeCardWrapper:()=>({}), showOverlay:()=>{overlays++}, alert:m=>alerts.push(String(m)), JSON, Set, String, Error
  });
  assert.equal(typeof window.__auditLaunchManual,'function');
  const positions=Array.from({length:13},(_,i)=>`포지션 ${i+1}`);
  window.__auditLaunchManual('13장 수동 배열이 학습되는지', {positions,symmetric:false,axes:[]});
  assert.deepEqual(alerts,[],`13-20 manual path raised an alert: ${alerts.join(' | ')}`);
  assert.equal(state.drawn?.length,13);
  assert.equal(learned,1);
  assert.equal(tarotRepairs,1);
  assert.equal(oracleDraws,1);
  assert.equal(overlays,1);
});

test('INTIMACY learning has its own structural domain', () => {
  const source=fs.readFileSync(new URL('../lunea-user-spread-learning-v1.js',import.meta.url),'utf8');
  const values=new Map();
  const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const window={addEventListener(){}}; window.window=window;
  vm.runInNewContext(source,{
    window,localStorage,
    document:{readyState:'loading',addEventListener(){},getElementById(){return null}},
    console:{info(){},warn(){},error(){}},setInterval(){return 0},clearInterval(){},setTimeout(){return 0},requestAnimationFrame(fn){fn()},MutationObserver:class{observe(){}},Date,Math,Set,JSON
  });
  const learning=window.LUNEA_SPREAD_LEARNING_V1;
  const p=learning.profile('A와 B 중 누구와 속궁합과 성적 리듬이 더 잘 맞는지 비교');
  assert.equal(p.domain,'intimacy',`INTIMACY question is currently classified as ${p.domain}`);
});

test('same normalized question can be retained separately by category', () => {
  const source=fs.readFileSync(new URL('../lunea-user-spread-learning-v1.js',import.meta.url),'utf8');
  const values=new Map();
  const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const window={addEventListener(){}}; window.window=window;
  vm.runInNewContext(source,{
    window,localStorage,
    document:{readyState:'loading',addEventListener(){},getElementById(){return null}},
    console:{info(){},warn(){},error(){}},setInterval(){return 0},clearInterval(){},setTimeout(){return 0},requestAnimationFrame(fn){fn()},MutationObserver:class{observe(){}},Date,Math,Set,JSON
  });
  const learning=window.LUNEA_SPREAD_LEARNING_V1;
  learning.recordManual({question:'A와 B 관계 비교',spreadTitle:'LOVE 비교',positions:['감정','행동'],category:'LOVE'});
  learning.recordManual({question:'A와 B 관계 비교',spreadTitle:'INTIMACY 비교',positions:['끌림','리듬'],category:'INTIMACY'});
  assert.equal(learning.count(),2,'LOVE and INTIMACY corrections with the same question should not overwrite each other');
});

console.log('spread-learning runtime audit completed');
