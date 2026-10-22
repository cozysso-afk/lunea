import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// No API calls, time-dependent data, card redraws, browser oracles or models.
const source = fs.readFileSync(new URL('../lunea-prediction-engine-v1.js',import.meta.url),'utf8');
const context={window:{}};
vm.runInNewContext(source,context,{filename:'lunea-prediction-engine-v1.js'});
const engine=context.window.LUNEA_CONTACT_PREDICTION_V1;
assert.ok(engine);
assert.equal(engine.version,'contact-prediction-v1.0.0');

const asOf='2026-10-22T09:45:00.000Z';
const deadline='2026-12-31';
const newTopic='그는 마지막 카톡에 답하지 않더라도 새로운 화제로 먼저 연락할까? 12월 말';
const pos='1. 새로운 화제로 먼저 연락할 가능성 및 실현 신호 (Yes/No)';
const cards=[
  {code:'Swords02',name:'Two of Swords (검 2)',position:pos,isReversed:false,subCards:[{code:'Temperance'}]},
  {code:'Cups11',position:'2. 연락 수단 비교: 카카오톡'},
  {code:'Sun',position:'3. 시기별 가능성: 11월 말'},
  {code:'Wands08',position:'전체 추가 카드 #1'}
];
const read = (question,cardsArg=cards) => engine.evaluate({question,cards:cardsArg,asOf});

assert.equal(engine.eventFromQuestion(newTopic),'new_topic');
assert.equal(engine.eventFromQuestion('마지막 카톡에 답장할까?'),'reply');
assert.equal(engine.eventFromQuestion('그가 먼저 전화를 걸까?'),'call');
assert.equal(engine.eventFromQuestion('나에 대한 그리움이 남았을까?'),null);

// All 78 RWS upright identities have an explicit contact-policy score.
const majors=['Fool','Magician','High Priestess','Empress','Emperor','Hierophant','Lovers','Chariot','Strength','Hermit','Wheel','Justice','Hanged Man','Death','Temperance','Devil','Tower','Star','Moon','Sun','Judgement','World'];
for(const code of majors)assert.ok(Number.isInteger(engine.scoreCard({code},'new_topic').score),code);
for(const suit of ['Wands','Cups','Swords','Pents'])
  for(let n=1;n<=14;n++) {
    const code=suit+String(n).padStart(2,'0');
    assert.ok(Number.isInteger(engine.scoreCard({code},'new_topic').score),code);
  }
assert.equal(engine.cardCode({name:'Page of Cups (컵 11)'}),'Cups11');
assert.equal(engine.cardCode({name:'XIV. Temperance (절제)'}),'Temperance');

const baseline=read(newTopic);
assert.equal(baseline.eligible,true);
assert.equal(baseline.deadline.date,deadline);
assert.equal(baseline.kind,'new_topic');
assert.equal(baseline.verdict,'NO');
assert.equal(baseline.evidence.length,1);
assert.equal(baseline.evidence[0].code,'Swords02');
assert.equal(baseline.skipped.length,3);
assert.equal(JSON.stringify(baseline),JSON.stringify(read(newTopic)),'same exact inputs must have same full verdict');

const changedAux=cards.map(c=>({...c}));
changedAux[1]={code:'Chariot',position:'연락 수단 비교: 카카오톡'};
changedAux[2]={code:'Magician',position:'시기별 가능성: 11월 말'};
changedAux[3]={code:'Judgement',position:'전체 추가 카드 #1'};
assert.equal(read(newTopic,changedAux).verdict,'NO','channel/timing/extras must not override outcome');

const newTopicYes=read('12월 말까지 새 화제로 먼저 연락할까?',[
  {code:'Cups11',position:'최종 결과'}
]);
assert.equal(newTopicYes.verdict,'YES');
const replyNo=read('2026-10-25까지 내 마지막 카톡에 답장할까?',[
  {code:'Cups08',position:'실제 답장 여부'}
]);
assert.equal(replyNo.kind,'reply');
assert.equal(replyNo.verdict,'NO');
const abstain=read('2026-12-31까지 새 화제로 먼저 연락할까?',[
  {code:'Lovers',position:'최종 결과'}
]);
assert.equal(abstain.verdict,'UNDETERMINED','emotional positivity must not force action YES');
assert.equal(read('새 화제로 먼저 연락할까?').eligible,false,'no checkable cutoff => no frozen verdict');
assert.equal(read('2026-12-31까지 새 화제로 먼저 연락할까?',[
  {code:'Cups11',position:'그의 감정'}
]).verdict,'UNDETERMINED','no outcome slot => abstain');
assert.equal(read('2026-12-31까지 새 화제로 먼저 연락할까?',[
  {code:'Cups11',position:'최종 결과',isReversed:true}
]).verdict,'UNDETERMINED','reversed cards must not be mechanically inverted');
assert.equal(engine.parseDeadline('72시간 안에 먼저 연락할까?',asOf).instant,'2026-10-25T09:45:00.000Z');
assert.equal(engine.scoreCard({code:'Cups08'},'reply').score,-2);
assert.equal(engine.scoreCard({code:'Cups08'},'new_topic').score,-1);
assert.match(engine.attachPrompt('BASE',baseline),/사전 판정: NO 우세/);
assert.match(engine.attachPrompt('BASE',baseline),/AI는 카드별 지지·반대 근거만 설명/);

// Integration guardrails: the old archive and journal continue to own saving.
// Changes must be additive; no migration of old LUNEA_ARCHIVE_V3 records.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const journal=fs.readFileSync(new URL('../lunea-reading-journal-v2.js',import.meta.url),'utf8');
assert.match(html,/lunea-prediction-engine-v1\.js/);
assert.match(html,/luneaContactPredictionV1=prediction\?\.eligible\?prediction:null/);
assert.match(html,/prediction:luneaContactPredictionV1\?/);
assert.match(html,/temperature:\.2,topP:\.95/);
assert.match(journal,/existing\?\.prediction\?\.version/);
assert.match(journal,/최초 연락 행동 예측/);

console.log('Contact Prediction V1 deterministic policy and integration: PASS');
