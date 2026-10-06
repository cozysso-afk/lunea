import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync(new URL('../'+name, import.meta.url), 'utf8');
const context = {
  console:{info(){},warn(){},error(){}},
  document:{querySelector(){return null;},querySelectorAll(){return [];},getElementById(){return null;},readyState:'loading'},
  localStorage:{getItem(){return null;},setItem(){}},
  setInterval(){return 1;},clearInterval(){},setTimeout(){return 1;},addEventListener(){}
};
context.window=context;
vm.createContext(context);
vm.runInContext(read('spread-engine-v7.4.js'),context);
const analyze=context.LUNEA_SPREAD_ENGINE_V7.analyze;
const cases=[
  ['그가 오늘 약속을 내일 미루려는 이유는? 단순한 컨디션 문제인가? 아니면 다른 문제인가?', 'social', 'candidate'],
  ['그가 컨디션 때문에 약속을 미룬 건가?', 'social', 'candidate'],
  ['그가 피곤해서 약속을 미뤘나?', 'social', 'candidate'],
  ['스트레스 때문에 답장이 늦는 이유가 뭘까?', 'love', 'candidate'],
  ['컨디션 때문에 업무 보고를 미룬 이유는?', 'career', 'candidate'],
  ['프로젝트 출시가 지연된 이유는 피로 때문인가?', 'project', 'candidate'],
  ['왜 몸이 이렇게 피곤한가?', 'wellbeing', 'target'],
  ['몸이 피곤한 이유는?', 'wellbeing', 'target']
];
for(const [question,domain,role] of cases){
  const result=analyze(question);
  assert.equal(result.domains[0],domain,question);
  assert.equal(result.causeFrame.healthRole,role,question);
  if(role==='candidate'){
    assert.equal(result.kind,'cause',question);
    assert.ok(!result.domains.includes('wellbeing'),question);
  }
}
const mixed=analyze('그가 약속을 미룬 이유는? 나는 왜 몸이 피곤한가?');
assert.ok(mixed.domains.includes('wellbeing'),'independent health question must survive');
assert.ok(mixed.causeFrame.compound);
assert.equal(analyze('내가 먼저 연락할까 말까?').kind,'contact_decision');
assert.equal(analyze('내 프사를 봤을까?').kind,'observation');
assert.equal(context.LUNEA_CAUSE_QUESTION_V1.analyze('왜 약속을 미뤘나?','advice').kind,'advice');

const prompt=q=>`[질문 원문]\n"${q}"\n\n[질문 유형]\ncause\n\n[뽑힌 카드]\n1. [표면적 계기] 힘 정방향`;
context.promptString=()=>prompt(cases[0][0]);
vm.runInContext(read('lunea-final-prompt-priority-v1.js'),context);
const api=context.LUNEA_FINAL_PROMPT_PRIORITY_V1;
const policy=api.build(prompt(cases[0][0]));
assert.match(policy,/interpretation_rule_version=cause-rws-v1/);
assert.doesNotMatch(policy,/최소 1회 실질적으로 반영|계산값이 있는 보조 체계를 단순히 생략하지 않는다/);
assert.equal(api.isCausePrompt(prompt('왜 약속을 미뤘나?').replace('\ncause\n','\nadvice\n')),false);
assert.equal(api.build(prompt('질문').replace('\ncause\n','\nadvice\n')).includes('[CAUSE RWS POLICY'),false);

// Aux presence cannot select a different cause policy or alter question routing.
const aux='\n[WESTERN ASTROLOGY · 서양점성술]\n- Sun(태양): Pisces 12°\n- Moon(달): Gemini 3°\n[THAI ASTROLOGY · MAHA TAKSA 계산 결과]\n반대 방향\n[SAJU / FOUR PILLARS · 사주명리]\n- 일간: 경금';
assert.equal(api.build(prompt(cases[0][0])+aux),policy);
assert.equal(api.build(prompt('컨디션인가?')),policy,'no event-specific card formula');
// Reinstallation after another module wraps the prompt stays idempotent.
const initial=context.promptString;
context.promptString=()=>initial()+aux;
api.ensure();
const twice=context.promptString();
assert.equal((twice.match(/\[CAUSE RWS POLICY/g)||[]).length,1);
assert.equal((twice.match(/\[FINAL READING PRIORITY/g)||[]).length,1);
assert.match(twice,/힘 정방향/);
assert.match(twice,/반대 방향/,'input evidence is preserved rather than rewritten');

console.log(`PASS: ${cases.length} classification cases; independent health axis; non-cause compatibility; auxiliary-invariant policy; prompt rewrap idempotence. LLM semantic accuracy is not exercised.`);
