import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Execute the real owner. Only expose its closure for tests; no copied guard,
// random-draw implementation, browser automation, network, or user storage.
const source = fs.readFileSync(new URL('../timing-oracle-v1.js', import.meta.url), 'utf8');
function fixture() {
  let now = new Date(2026, 8, 10, 23, 50).getTime();
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const storage = new Map([['untouched-user-data', 'keep']]);
  const nodes = new Map();
  function element(id) {
    const classes = new Set();
    return {id, value:'', textContent:'', innerHTML:'', dataset:{},
      style:{removeProperty(){}},
      classList:{add(...xs){xs.forEach(x=>classes.add(x));},remove(...xs){xs.forEach(x=>classes.delete(x));},contains(x){return classes.has(x);}},
      setAttribute(){}, addEventListener(){}, removeEventListener(){},
      insertAdjacentElement(){}, remove(){}
    };
  }
  for (const id of ['timingQuestion','timingQuestionField','timingHelp','timingOverlay','timingFlip','timingInner','timingResult','timingActions','timingAIText','timingRefine','timingImage','timingLabelKo','timingLabelEn','spreadQuestion','timingSupportBtn','cards','luneaTimingInline']) nodes.set(id,element(id));
  const state = {category:'LOVE',question:'합성 A에게 이번 주 연락이 올까?',title:'연락운',id:'reading-1'};
  const window = {};
  const localStorage = {getItem(k){return storage.get(k) ?? null;},setItem(k,v){storage.set(k,v);}};
  let confirmations = 0, accepted = true, rngCalls = 0;
  const context = {window,state,Date:Clock,console,URL,localStorage,
    secureRandomInt(){rngCalls++;return 0;},
    confirm(){confirmations++;return accepted;},alert(message){throw Error(message);},
    document:{readyState:'loading',baseURI:'https://fixture.invalid/',body:element('body'),addEventListener(){},getElementById(id){return nodes.get(id)||null;},querySelector(){return null;}}
  };
  const expose = 'window.guardTest={timingState,TIMING_CARDS,questionSignature,recentSameQuestion,openTimingModal,currentQuestionForModal,performTimingDraw,performRefineDraw};';
  vm.runInNewContext(source.replace(/\}\)\(\);\s*$/, `${expose}\n})();`),context);
  const api = window.guardTest;
  const history = () => JSON.parse(localStorage.getItem('LUNEA_TIMING_HISTORY_V1') || '[]');
  return {api,state,nodes,storage,history,
    get confirms(){return confirmations;},get rngCalls(){return rngCalls;},
    accept(value){accepted=value;},advance(ms){now+=ms;},
    open(q=state.question,mode='support'){
      if(mode==='support'){state.question=q;nodes.get('spreadQuestion').textContent=`“${q}”`;}
      api.openTimingModal(mode,q);
      if(mode==='standalone') nodes.get('timingQuestion').value=q;
      assert.equal(api.currentQuestionForModal(),q);
    },
    draw(){api.performTimingDraw(false);},
    seedLegacy(q,atOffset=0){localStorage.setItem('LUNEA_TIMING_HISTORY_V1',JSON.stringify([{sig:api.questionSignature(q),at:now+atOffset,cardId:'LT-003',label:'합성 기존 결과'}]));}
  };
}

const cases = [
  ['same support question keeps protection across spread/category/ID changes',()=>{
    const f=fixture();f.open();f.draw();f.state.category='GENERAL';f.state.title='다른 배열';f.state.id='reading-2';f.open();f.draw();assert.equal(f.confirms,1);
  }],
  ['different support question does not inherit a warning',()=>{
    const f=fixture();f.open();f.draw();f.open('합성 B 프로젝트의 다음 달 일정은?');f.draw();assert.equal(f.confirms,0);
  }],
  ['DAILY history does not warn on unrelated LOVE/GENERAL',()=>{
    const f=fixture();f.state.category='DAILY';f.open('오늘의 합성 데일리 흐름은?');f.draw();f.state.category='LOVE';f.open('합성 A의 연락은 언제?');f.draw();f.state.category='GENERAL';f.open('합성 일정은 언제?');f.draw();assert.equal(f.confirms,0);
  }],
  ['same-day DAILY retains repeat protection',()=>{
    const f=fixture();f.state.category='DAILY';f.open('오늘의 합성 데일리 흐름은?');f.draw();f.open();f.draw();assert.equal(f.confirms,1);
  }],
  ['different-day DAILY does not collide within 24 hours',()=>{
    const f=fixture();f.state.category='DAILY';f.open('오늘의 합성 데일리 흐름은?');f.draw();f.advance(20*60*1000);f.open();f.draw();assert.equal(f.confirms,0);
  }],
  ['standalone uses typed B, not prior support or standalone A',()=>{
    const f=fixture();f.open();f.draw();f.open('합성 독립 질문 A는 언제?','standalone');f.draw();f.nodes.get('timingQuestion').value='합성 독립 질문 B는 언제?';f.draw();assert.equal(f.confirms,0);assert.equal(f.api.timingState.question,'합성 독립 질문 B는 언제?');
  }],
  ['spacing/punctuation-only variants keep same-question protection',()=>{
    const f=fixture();f.open('합성 A 연락 언제?');f.draw();f.open('합성A  연락, 언제!!');f.draw();assert.equal(f.confirms,1);
  }],
  ['refine stays separate from primary repeat guard and history',()=>{
    const f=fixture();f.open('합성 A에게 연락이 올까?');f.draw();f.api.timingState.primary=f.api.TIMING_CARDS.find(c=>c.id==='LT-012');const h=JSON.stringify(f.history());f.api.performRefineDraw();assert.ok(f.api.timingState.refine);assert.equal(f.confirms,0);assert.equal(JSON.stringify(f.history()),h);
  }],
  ['cancel confirmation does not draw or mutate history/result',()=>{
    const f=fixture();f.open();f.draw();const h=JSON.stringify(f.history()),p=f.api.timingState.primary,n=f.rngCalls;f.accept(false);f.draw();assert.equal(f.confirms,1);assert.equal(f.rngCalls,n);assert.equal(f.api.timingState.primary,p);assert.equal(JSON.stringify(f.history()),h);assert.equal(f.storage.get('untouched-user-data'),'keep');
  }],
  ['legacy exact-question history remains protective without invented category',()=>{
    const f=fixture();f.seedLegacy(f.state.question);f.open();f.draw();assert.equal(f.confirms,1);assert.equal(f.history().length,2);assert.equal(f.history()[1].label,'합성 기존 결과');
  }],
  ['legacy prior-day entry does not acquire current DAILY date',()=>{
    const f=fixture();f.state.category='DAILY';const q='오늘의 합성 데일리 흐름은?';f.seedLegacy(q);f.advance(20*60*1000);f.open(q);f.draw();assert.equal(f.confirms,0);assert.equal(f.history().length,2);
  }],
  ['new DAILY context does not attach to standalone with same template text',()=>{
    const f=fixture();f.state.category='DAILY';f.open('오늘의 합성 데일리 흐름은?');f.draw();f.open('오늘의 합성 데일리 흐름은?','standalone');f.draw();assert.equal(f.confirms,0);
  }]
];
let failed=0;
for(const [name,test] of cases){try{test();console.log('PASS',name);}catch(error){failed++;console.error('FAIL',name, error.message);}}
console.log(`${cases.length-failed}/${cases.length} guard cases passed (VM fixtures, not browser E2E)`);
process.exitCode=failed?1:0;
