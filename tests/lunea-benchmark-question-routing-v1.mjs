import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

function loadLearning() {
  const values = new Map();
  const localStorage = {
    getItem:k=>values.get(k)??null,
    setItem:(k,v)=>values.set(k,String(v)),
    removeItem:k=>values.delete(k)
  };
  const window={addEventListener(){}}; window.window=window;
  vm.runInNewContext(read('lunea-user-spread-learning-v1.js'),{
    window,localStorage,
    document:{readyState:'loading',addEventListener(){},getElementById(){return null}},
    console:{info(){},warn(){},error(){}},setInterval(){return 0},clearInterval(){},setTimeout(){return 0},requestAnimationFrame(fn){fn()},MutationObserver:class{observe(){}},Date,Math,Set,Map,JSON,String,Array,Number,Error
  });
  return window.LUNEA_SPREAD_LEARNING_V1;
}

function loadPreflight(category='GENERAL') {
  let source=read('lunea-ai-spread-preflight-v2.js').replace(/\n\}\)\(\);\s*$/, '\nwindow.__benchSegments=questionSegments;window.__benchFallback=detailedFallback;\n})();');
  const state={category};
  const window={addEventListener(){}}; window.window=window;
  vm.runInNewContext(source,{
    window,state,localStorage:{getItem(){return null}},
    document:{readyState:'loading',getElementById(){return null},addEventListener(){},head:{appendChild(){}},body:{appendChild(){},classList:{add(){},remove(){}}}},
    console:{info(){},warn(){},error(){}},setInterval(){return 0},clearInterval(){},setTimeout(){return 0},fetch(){throw new Error('network disabled in benchmark')},JSON,String,Array,Number,Error,Set,Map
  });
  return {segments:window.__benchSegments,fallback:window.__benchFallback};
}

const cases=[
  {id:1,name:'단순 감정',q:'A는 현재 나를 어떻게 생각하고 있나?',domain:'relationship',target:'single_or_unspecified',modes:['perception']},
  {id:2,name:'감정↔행동',q:'A에게 감정이 남아 있다면 왜 행동하지 않는가?',domain:'relationship',target:'single_or_unspecified',modes:['feeling','action','cause']},
  {id:3,name:'조건부 연락',q:'내가 먼저 연락하지 않을 경우 A가 먼저 연락할 가능성과 계기는?',domain:'relationship',target:'single_or_unspecified',modes:['action','cause','outcome']},
  {id:4,name:'두 사람 감정 비교',q:'A와 B 중 현재 나에게 감정이 더 강하게 남은 사람은?',domain:'relationship',target:'pair',modes:['feeling','compare']},
  {id:5,name:'비선택 대칭 인식',q:'A와 B가 나를 각각 어떻게 인식하는가?',domain:'relationship',target:'pair',modes:['perception','compare']},
  {id:6,name:'사실 불확실',q:'A는 내가 올린 게시물을 실제로 보았는가?',domain:'general',target:'single_or_unspecified',modes:['observation']},
  {id:7,name:'연락 중단 원인',q:'상대가 갑자기 연락을 끊은 주된 이유는?',domain:'relationship',target:'single_or_unspecified',modes:['action','cause']},
  {id:8,name:'사후 사건 인식',q:'이미 끝난 만남에서 상대는 그날을 어떻게 받아들이고 있나?',domain:'relationship',target:'single_or_unspecified',stage:'after'},
  {id:9,name:'관계 변화 시기',q:'향후 3개월 중 관계 변화 가능성이 가장 높은 시기는?',domain:'relationship',target:'single_or_unspecified',modes:['timing','outcome']},
  {id:10,name:'YES/NO 연락 시기',q:'이번 달 안에 A에게 연락이 올 가능성이 있는가?',domain:'relationship',target:'single_or_unspecified',modes:['action','timing','outcome']},
  {id:11,name:'1인 다중 시나리오',q:'지금 답장 / 내일 답장 / 답장하지 않음 중 각각의 흐름은?',domain:'relationship',target:'single_scenarios',modes:['action','compare']},
  {id:12,name:'장문 복합 관계',q:'A의 현재 감정이 어떤지, 그리고 실제 연락 의도가 있는지, 추가로 연락을 막는 장애물이 무엇인지, 마지막으로 관계가 움직일 계기와 시기와 최종 흐름을 모두 알고 싶다',domain:'relationship',target:'single_or_unspecified',modes:['feeling','action','timing','cause','outcome'],minSegments:4,category:'LOVE'},
  {id:13,name:'INTIMACY 비교',q:'두 사람의 신체적 끌림·성적 리듬·욕구 차이·만족 가능성은?',domain:'intimacy',target:'pair',modes:['feeling','outcome'],category:'INTIMACY'},
  {id:14,name:'친밀감/집착 경계',q:'강한 끌림이 건강한 친밀감인지 집착·소유욕 쪽인지?',domain:'intimacy',target:'single_or_unspecified',category:'INTIMACY'},
  {id:15,name:'커리어 선택 비교',q:'현재 직장을 유지하는 것과 이직하는 것의 6개월 흐름 비교',domain:'career',target:'single_or_unspecified',modes:['compare']},
  {id:16,name:'시험 병목',q:'현재 공부 방식에서 합격 가능성을 가장 크게 막는 요인은?',domain:'study',target:'single_or_unspecified',modes:['cause','outcome']},
  {id:17,name:'투자 근거/반증',q:'보유 종목을 계속 들고 갈 때 확인해야 할 상승 근거와 하락 반증, 리스크와 판단 기준은?',domain:'stock',target:'single_or_unspecified'},
  {id:18,name:'A/B 복합 대칭',q:'A와 B 각각 감정·미련·행동 가능성·관계 종료 계기를 같은 축으로 비교',domain:'relationship',target:'pair',modes:['feeling','action','cause','compare','outcome']},
  {id:19,name:'무행동 조건 관계',q:'내가 아무 행동도 하지 않을 때 이 관계가 어떻게 정리되는가?',domain:'relationship',target:'single_or_unspecified',modes:['action','outcome']},
  {id:20,name:'극장문 스트레스',q:'A와 B 각각 과거에 나를 어떻게 봤는지, 현재 감정과 미련은 어떤지, 실제 행동 의도와 연락 가능성은 어떤지, 움직임을 막는 이유는 무엇인지, 향후 3개월의 변화 계기와 시기는 언제인지, 아무 행동도 하지 않을 때 관계가 어떻게 종결되는지 같은 축으로 비교하고 싶다',domain:'relationship',target:'pair',modes:['perception','feeling','action','cause','timing','compare','outcome'],minSegments:6,category:'LOVE'}
];

const learning=loadLearning();
let passed=0,total=0;
const rows=[];

for(const c of cases){
  const p=learning.profile(c.q,{category:c.category||''});
  const failures=[];
  const check=(ok,label)=>{total++; if(ok)passed++; else failures.push(label)};
  check(p.domain===c.domain,`domain expected=${c.domain} actual=${p.domain}`);
  check(p.target===c.target,`target expected=${c.target} actual=${p.target}`);
  if(c.stage)check(p.stage===c.stage,`stage expected=${c.stage} actual=${p.stage}`);
  for(const mode of c.modes||[])check(p.modes.includes(mode),`missing mode=${mode} actual=[${p.modes.join(',')}]`);
  let segCount='-';
  if(c.minSegments){
    const pre=loadPreflight(c.category||'GENERAL');
    const seg=pre.segments(c.q); segCount=seg.length;
    check(seg.length>=c.minSegments,`segments expected>=${c.minSegments} actual=${seg.length}`);
    const base={spreadTitle:'기본',positions:['현재 상황','숨은 변수','핵심 조언']};
    const fb=pre.fallback(c.q,base,'benchmark');
    check(!!fb&&Array.isArray(fb.positions)&&fb.positions.length>=c.minSegments&&fb.positions.length<=20,`fallback positions invalid actual=${fb?.positions?.length??0}`);
  }
  rows.push({id:c.id,name:c.name,pass:failures.length===0,domain:p.domain,target:p.target,modes:p.modes.join('|'),stage:p.stage,segments:segCount,failures});
}

const score=Math.round((passed/Math.max(1,total))*1000)/10;
console.log('\nLUNEA QUESTION ROUTING BENCHMARK V1');
console.log(`Criteria: ${passed}/${total} PASS · score ${score}%`);
console.log('='.repeat(88));
for(const r of rows){
  console.log(`${String(r.id).padStart(2,'0')} ${r.pass?'PASS':'FAIL'} · ${r.name}`);
  console.log(`   domain=${r.domain} target=${r.target} stage=${r.stage} modes=${r.modes}${r.segments!=='-'?` segments=${r.segments}`:''}`);
  for(const f of r.failures)console.log(`   - ${f}`);
}
console.log('='.repeat(88));
console.log(`Question-level: ${rows.filter(x=>x.pass).length}/${rows.length} fully PASS`);
console.log(`Criterion-level: ${passed}/${total} (${score}%)`);

if(rows.some(r=>!r.pass))process.exitCode=1;
