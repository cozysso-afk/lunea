import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const finalSrc=read('lunea-final-prompt-priority-v1.js');
const glossSrc=read('interpretation-gloss-v1.js');
const intimacySrc=read('lunea-intimacy-v34.js');

const timing=[
  '[TIMING ORACLE · 질문 섹터]',
  '- 섹터 선택 방식: 직접 선택',
  '- 해석 섹터: 재회',
  '- 이 섹터는 질문의 맥락을 좁히는 정보다.'
].join('\n');
const cards='1. [목소리에 대한 반응] VII. The Chariot 정방향\n2. [끌림] Ten of Wands 정방향';
const base=[
  '[질문 원문]','"통화 후 마음과 연락을 왜 이어가지 않는가?"','',
  '[질문 유형]','feeling_action_gap','',
  '[뽑힌 카드]',cards,'',timing,'',timing,'',timing
].join('\n');
const env={
  window:{addEventListener(){}},
  document:{readyState:'complete',addEventListener(){}},
  console:{info(){},warn(){}},String,RegExp,Object,Array,Date,
  setInterval(){return 1;},clearInterval(){},setTimeout(){return 1;},
  promptString:()=>base
};
env.window.window=env.window;
const context=vm.createContext(env);
vm.runInContext(glossSrc,context,{filename:'interpretation-gloss-v1.js'});
vm.runInContext(finalSrc,context,{filename:'lunea-final-prompt-priority-v1.js'});
const output=context.promptString();
const count=(s,x)=>s.split(x).length-1;
assert.equal(count(output,'[TIMING ORACLE · 질문 섹터]'),1,'remove only exact repeated Timing context');
assert.equal(count(output,'[FINAL READING PRIORITY · 최종 근거 우선순위]'),1);
assert.equal(count(output,'[해석 문체 · 용어 표기 규칙 — 최종 출력에 반드시 적용]'),1);
assert.equal(count(output,'[최종 해석 품질 규칙 — 다른 모든 문체 규칙보다 우선]'),1);
assert.ok(output.includes(cards),'RWS cards and positions must survive unchanged');
assert.match(output,/감정·의도·행동·결과와 원인·배경을 분리한다/);
assert.match(output,/과대해석 방지/);
assert.match(output,/과소해석 방지/);
assert.match(output,/임의 확률/);
assert.ok(!output.includes('[SELF-CHECK · 최종 출력 전 내부 검수]'),'repeated audit checklist removed');
assert.equal(context.promptString(),output,'assembly is stable across repeat calls');

// Distinct sector blocks are not silently merged.
const other=timing.replace('해석 섹터: 재회','해석 섹터: 금전 · 투자');
const separate=vm.createContext({...env,window:{addEventListener(){}},promptString:()=>base+'\n\n'+other});
vm.runInContext(finalSrc,separate);
assert.equal(count(separate.promptString(),'[TIMING ORACLE · 질문 섹터]'),2,'distinct context is preserved');

// Cause-specific evidence hierarchy, without the prior lengthy checklist.
const cause=context.window.LUNEA_FINAL_PROMPT_PRIORITY_V1.build(
  '[질문 원문]\n"답장이 늦은 이유?"\n\n[질문 유형]\ncause\n\n[뽑힌 카드]\n1. [업무] Seven of Pentacles'
);
assert.match(cause,/interpretation_rule_version=cause-rws-v1/);
assert.match(cause,/상태와 실제 행동을 바꾼 원인을 구분/);
assert.ok(cause.length<3300,'cause-policy boilerplate should be compact');

// The intimacy card evidence, reversal, and safety guard remain available.
const itx=vm.createContext({window:{},console,Object,Array,String,Number,Boolean,Map,Set,RegExp,JSON});
vm.runInContext(intimacySrc,itx);
const intimacy=itx.window.LUNEA_INTIMACY_V34.buildPromptLayer(
  [{code:'Chariot',isReversed:false,position:'목소리 반응'},
   {code:'Wands10',isReversed:false,position:'성적 끌림'}],
  '친밀감 질문','1년 만의 통화'
);
assert.match(intimacy,/성인 간 친밀감/);
assert.match(intimacy,/상대 관련 포지션은 카드상 가설로만 쓰고/);
assert.match(intimacy,/강렬함 ≠ 좋은 궁합/);
assert.match(intimacy,/실제 동의\(consent\)의 증거가 아니며/);
assert.match(intimacy,/Chariot \/ upright \/ position: 목소리 반응/);
assert.match(intimacy,/Wands10 \/ upright \/ position: 성적 끌림/);
assert.match(intimacy,/정방향 core의 주근거/);
assert.match(intimacy,/제한·반증으로 함께 검토할 shadow/);
assert.ok(!intimacy.includes('- 질문: 1년 만의 통화'),'question should not be duplicated');

console.log('Lean shared RWS/Timing/Intimacy prompt contracts: PASS');
