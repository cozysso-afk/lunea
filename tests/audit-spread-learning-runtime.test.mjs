import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Audit 1: 13-20 card manual path must finish a real draw and only then learn it.
{
  let source = fs.readFileSync(new URL('../lunea-manual-limit20-v17.js', import.meta.url), 'utf8');
  source = source.replace(/\n\}\)\(\);\s*$/, '\nwindow.__auditLaunchManual = launchManual;\n})();');

  let learned = 0;
  let oracleDraws = 0;
  let tarotRepairs = 0;
  let overlays = 0;
  const alerts = [];
  const nodes = new Map();
  const node = (id, extra={}) => ({
    id,
    value:'', checked:false, textContent:'',
    style:{},
    dataset:{},
    classList:{add(){},remove(){},toggle(){}},
    replaceChildren(){}, appendChild(){}, focus(){},
    addEventListener(){}, querySelector(){return null},
    ...extra
  });
  nodes.set('luneaManualTitle', node('luneaManualTitle',{value:'13장 직접 배열'}));
  nodes.set('luneaManualAB', node('luneaManualAB',{checked:false}));
  nodes.set('cards', node('cards'));
  nodes.set('results', node('results'));
  nodes.set('aiBox', node('aiBox'));
  nodes.set('spreadType', node('spreadType'));
  nodes.set('spreadQuestion', node('spreadQuestion'));
  nodes.set('spreadRationale', node('spreadRationale'));
  nodes.set('luneaStructuralV4Pager', node('luneaStructuralV4Pager'));
  nodes.set('sheet', node('sheet'));

  const document = {
    readyState:'loading',
    body:{classList:{add(){}}},
    getElementById(id){return nodes.get(id)||null},
    addEventListener(){},
  };
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
    window, document, state,
    localStorage:{setItem(){},getItem(){return null}},
    console,
    setInterval(){return 0}, clearInterval(){}, setTimeout(fn){fn();return 0}, clearTimeout(){},
    secureShuffle:x=>x.slice(), TAROT_DECK:deck, secureBool:()=>false,
    makeCardWrapper:()=>({}), showOverlay:()=>{overlays++},
    alert:m=>alerts.push(String(m)), JSON, Set, String, Error
  });
  assert.equal(typeof window.__auditLaunchManual,'function','launchManual audit hook should be exposed');
  const positions=Array.from({length:13},(_,i)=>`포지션 ${i+1}`);
  window.__auditLaunchManual('13장 수동 배열이 학습되는지', {positions,symmetric:false,axes:[]});
  assert.deepEqual(alerts,[],`13-20 manual path raised an alert: ${alerts.join(' | ')}`);
  assert.equal(state.drawn?.length,13,'13-card manual draw should finish with all cards');
  assert.equal(learned,1,'successful 13-card manual draw should be learned exactly once');
  assert.equal(tarotRepairs,1,'INTIMACY 13-card manual draw should apply dedicated Tarot repair');
  assert.equal(oracleDraws,1,'INTIMACY 13-card manual draw should attach Oracle draw');
  assert.equal(overlays,1,'successful manual draw should open reading overlay');
}

// Audit 2: INTIMACY learning needs a distinct structural domain, otherwise LOVE/relationship
// corrections can compete with sexual-intimacy corrections under the same broad profile.
{
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
}

console.log('spread-learning runtime audit: PASS');
