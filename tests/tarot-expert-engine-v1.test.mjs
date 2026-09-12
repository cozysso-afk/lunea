import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');

function harness(){
  const c={console,setTimeout(){},clearTimeout(){}};
  c.window=c;
  vm.createContext(c);
  vm.runInContext(read('lunea-tarot-expert-engine-v1.js'),c);
  return c;
}

const prompt=`당신은 숙련된 타로 리더다.

[질문 원문]
"나를 좋아하는지, 실제로 연락할지도 궁금해"

[질문 유형]
love

[뽑힌 카드]
1. [감정]
- Card: Two of Cups
- Orientation: Upright (정방향)
- Golden Dawn Attribution: Water of Water
- Classical Ruler: Venus
- Keyword: union

2. [행동]
- Card: Two of Swords
- Orientation: Reversed (역방향)
- Golden Dawn Attribution: Moon
- Classical Ruler: Moon
- Keyword: stalemate

3. [의사소통]
- Card: Queen of Swords
- Orientation: Upright (정방향)
- Golden Dawn Attribution: Air of Air
- Classical Ruler: Mercury
- Keyword: boundary`;

test('engine installs without replacing the base prompt body',()=>{
  const h=harness();
  const base=()=>prompt;
  h.promptString=base;
  assert.equal(h.LUNEA_TAROT_EXPERT_ENGINE_V1.install(),true);
  const out=h.promptString();
  assert.match(out,/\[질문 원문\]/);
  assert.match(out,/\[LUNEA TAROT EXPERT ENGINE V1 · 동적 해석 프로토콜\]/);
  assert.equal(out.match(/\[LUNEA TAROT EXPERT ENGINE V1 ·/g).length,1);
});

test('question axes explicitly separate feelings, contact and action',()=>{
  const h=harness();
  const out=h.LUNEA_TAROT_EXPERT_ENGINE_V1.build(prompt);
  assert.match(out,/감정\/호감/);
  assert.match(out,/연락\/소식/);
  assert.match(out,/행동\/실행/);
  assert.match(out,/감정\/호감 → 연락 → 실제 행동 → 재회\/관계 성립/);
});

test('reversed card receives a dynamic mode rule rather than a fixed opposite',()=>{
  const h=harness();
  const out=h.LUNEA_TAROT_EXPERT_ENGINE_V1.build(prompt);
  assert.match(out,/2번 \[행동\] Two of Swords: 역방향 후보 모드/);
  assert.match(out,/과잉\/과소·감소, 내면화, 막힘·지연/);
});

test('minor arcana combines suit domain with rank stage',()=>{
  const h=harness();
  const out=h.LUNEA_TAROT_EXPERT_ENGINE_V1.build(prompt);
  assert.match(out,/Two of Cups: 수트=Cups\(감정·관계·정서적 교류\); 단계=선택·균형·대응/);
  assert.match(out,/Two of Swords: 수트=Swords\(생각·판단·말·갈등·경계\); 단계=선택·균형·대응/);
});

test('court cards are interpreted as role/style before literal gendered people',()=>{
  const h=harness();
  const out=h.LUNEA_TAROT_EXPERT_ENGINE_V1.build(prompt);
  assert.match(out,/Queen of Swords: 사람을 특정하기보다 해당 포지션의 행동 양식·역할·대응 스타일/);
  assert.match(out,/성별·신원·특정 제3자를 카드만으로 만들지 않는다/);
});

test('evidence hierarchy and anti-majority rule are explicit',()=>{
  const h=harness();
  const out=h.LUNEA_TAROT_EXPERT_ENGINE_V1.build(prompt);
  assert.match(out,/질문 원문 → 2\) 포지션의 기능 → 3\) 해당 카드의 정\/역방향/);
  assert.match(out,/다수결 금지/);
  assert.match(out,/앞 단계의 직접 근거가 뒤 단계의 일반론보다 우선/);
});

test('production reading group loads the engine before final prompt assembly',()=>{
  const s=read('lunea-structural-routing-v4.js');
  assert.ok(s.indexOf("./lunea-tarot-reference-v1.js")<s.indexOf("./lunea-tarot-expert-engine-v1.js"));
  assert.ok(s.indexOf("./lunea-tarot-expert-engine-v1.js")<s.indexOf("./lunea-final-prompt-priority-v1.js"));
});

test('engine is idempotent when installed twice',()=>{
  const h=harness();
  h.promptString=()=>prompt;
  h.LUNEA_TAROT_EXPERT_ENGINE_V1.install();
  const first=h.promptString();
  h.LUNEA_TAROT_EXPERT_ENGINE_V1.install();
  const second=h.promptString();
  assert.equal(second,first);
});

test('compact deck codes retain suit and court roles without inventing major courts',()=>{
  const api=harness().LUNEA_TAROT_EXPERT_ENGINE_V1;
  const input=prompt.replace('Two of Cups','Cups02').replace('Two of Swords','Pents08').replace('Queen of Swords','Swords13');
  const out=api.build(input);
  assert.match(out,/Cups02: 수트=Cups/);
  assert.match(out,/Pents08: 수트=Pentacles/);
  assert.match(out,/Swords13: 수트=Swords/);
  assert.doesNotMatch(api.build(prompt.replace('Queen of Swords','Major13')),/Major13: 인물\/역할/);
});

test('rebuilding expert block preserves subsequent oracle and final instructions',()=>{
  const h=harness();h.promptString=()=>prompt;
  h.LUNEA_TAROT_EXPERT_ENGINE_V1.install();
  const prior=h.promptString()+'\n\n[메시지 오라클]\n현재 질문의 오라클 근거\n[최종 지시]\n보존할 지시';
  h.promptString=()=>prior;h.LUNEA_TAROT_EXPERT_ENGINE_V1.install();
  const result=h.promptString();
  assert.match(result,/현재 질문의 오라클 근거/);assert.match(result,/보존할 지시/);
  assert.equal(result.match(/\[LUNEA TAROT EXPERT ENGINE V1 ·/g).length,1);
});

test('no card section means no fabricated card map from unrelated text',()=>{
  const out=harness().LUNEA_TAROT_EXPERT_ENGINE_V1.build(prompt.replace('[뽑힌 카드]','[인용된 예시]'));
  assert.doesNotMatch(out,/1번 \[감정\] Two of Cups/);
});

test('all live minor names including Pents and Korean suffixes receive structure; majors do not',()=>{
  const h=harness(),html=read('index.html');
  vm.runInContext(html.slice(html.indexOf('const MAJORS='),html.indexOf('// State / profile / storage'))+'this.deck=TAROT_DECK;',h);
  let minors=0,courts=0;
  for(const card of h.deck){
    const input=prompt.slice(0,prompt.indexOf('[뽑힌 카드]'))+'[뽑힌 카드]\n1. [역할]\n- Card: '+card.name+'\n- Orientation: Upright\n';
    const out=h.LUNEA_TAROT_EXPERT_ENGINE_V1.build(input);
    if(!/^(Wands|Cups|Swords|Pents)\d{2}$/.test(card.code))assert.doesNotMatch(out,/수트=|1번 .*: (?:사람을 특정|인물\/역할)/);
    else{assert.match(out,/수트=/,card.name);minors++;if(card.primaryType==='Court'){assert.match(out,/해당 포지션의 행동 양식/);courts++;}}
  }
  assert.equal(minors,56);assert.equal(courts,16);
});
