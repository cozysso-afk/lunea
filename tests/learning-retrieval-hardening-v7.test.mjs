import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=name=>fs.readFileSync(new URL(`../${name}`,import.meta.url),'utf8');

function runtime(){
  const values=new Map();
  const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const document={readyState:'loading',getElementById(){return null},addEventListener(){}};
  const window={addEventListener(){}};window.window=window;
  const base={window,document,localStorage,console:{info(){},warn(){},error(){}},setInterval(){return 0},clearInterval(){},setTimeout(){return 0},requestAnimationFrame(fn){fn()},MutationObserver:class{observe(){}},Date,Math,Set,Map,JSON,String,Array,Number,Error};
  vm.runInNewContext(read('lunea-user-spread-learning-v1.js'),base);
  return window.LUNEA_SPREAD_LEARNING_V1;
}

test('profile v4 recognizes named/role pairs without turning one-person scenarios into pairs',()=>{
  const api=runtime();
  const named=api.profile('진과 한에게 내가 각각 어떤 사람으로 남아 있고 누가 더 미련이 큰가?',{category:'LOVE'});
  assert.equal(named.version,4);
  assert.equal(named.domain,'relationship');
  assert.equal(named.target,'pair');
  assert.ok(named.modes.includes('compare'));

  const dotted=api.profile('나와 진·한의 관계가 각각 어떻게 정리되는가?',{category:'LOVE'});
  assert.equal(dotted.target,'pair');

  const roles=api.profile('전남친과 소개팅남 중 누가 더 관계 의지가 강한가?',{category:'LOVE'});
  assert.equal(roles.target,'pair');
  assert.ok(roles.modes.includes('compare'));

  const scenario=api.profile('A에게 카톡과 DM을 각각 보내면 반응이 어떻게 다른가?',{category:'LOVE'});
  assert.notEqual(scenario.target,'pair');

  const abstract=api.profile('감정과 행동의 차이가 왜 생기나?',{category:'LOVE'});
  assert.notEqual(abstract.target,'pair');
});

test('learning prompt guidance never exposes prior raw question, layout title, positions, or card count',()=>{
  const api=runtime();
  const priorQuestion='과거 질문 원문 절대노출금지 테스트 관계 감정 행동 원인';
  const positions=['절대노출금지 포지션 하나','절대노출금지 포지션 둘','절대노출금지 포지션 셋'];
  const result=api.recordManual({question:priorQuestion,spreadTitle:'절대노출금지 배열명',positions,category:'LOVE'});
  assert.equal(result.saved,true);
  const out=api.formatForPrompt(priorQuestion,3,{category:'LOVE'});
  assert.match(out,/사용자 학습 구조 참고/);
  assert.match(out,/질문 구조:/);
  assert.match(out,/참고 가능한 요구축:/);
  assert.doesNotMatch(out,/과거 질문 원문 절대노출금지/);
  assert.doesNotMatch(out,/절대노출금지 배열명/);
  assert.doesNotMatch(out,/절대노출금지 포지션/);
  assert.doesNotMatch(out,/카드 수|최종 포지션/);
});

test('manual learning no longer aliases final positions into requestedAxes',()=>{
  const api=runtime();
  const result=api.recordManual({question:'A의 현재 감정과 행동 의도는?',spreadTitle:'직접 배열',positions:['감정','행동 의도','실제 행동'],category:'LOVE'});
  assert.equal(result.saved,true);
  assert.deepEqual(Array.from(result.row.requestedAxes||[]),[]);
  assert.ok(Array.from(api.guidanceAxes(result.row,result.row.structureProfile)).length>=1);
});

test('preflight and loader enforce structure-only learned guidance and fresh caches',()=>{
  const preflight=read('lunea-ai-spread-preflight-v2.js');
  const learning=read('lunea-user-spread-learning-v1.js');
  const loader=read('lunea-structural-routing-v4.js');
  assert.doesNotMatch(preflight,/const axes=x\.requestedAxes\.length\?x\.requestedAxes:x\.positions/);
  assert.doesNotMatch(preflight,/당시 카드 수:/);
  assert.doesNotMatch(preflight,/과거 질문: \$\{x\.question\}/);
  assert.match(preflight,/과거 학습의 질문 원문·포지션 원문·배열명·카드 수는 현재 배열 설계 근거로 사용하지 않는다/);
  assert.doesNotMatch(learning,/\.\.\.\(row\.positions\|\|\[\]\)/,'raw historical positions must not participate in semantic retrieval scoring');
  assert.match(learning,/guidanceAxes/);
  assert.equal((loader.match(/lunea-user-spread-learning-v1\.js\?v=109/g)||[]).length,2);
  assert.equal((loader.match(/lunea-ai-spread-preflight-v2\.js\?v=106/g)||[]).length,2);
});
