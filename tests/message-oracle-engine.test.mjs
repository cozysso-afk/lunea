import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
export function canonicalDeck(){
 const html=read('index.html');const c=vm.createContext({});
 vm.runInContext(html.slice(html.indexOf('const MAJORS='),html.indexOf('const TAROT_DECK='))+ 'globalThis.deck=[...MAJORS,...buildMinor()];',c);
 return JSON.parse(JSON.stringify(c.deck));
}
export function engine(){const c=vm.createContext({});vm.runInContext(read('lunea-message-oracle-v1.js'),c);return c.LUNEA_MESSAGE_ORACLE_V1}
const E=engine(), deck=canonicalDeck();
test('78 unique semantic records exactly cover canonical 22 majors and 56 minors',()=>{
 assert.equal(E.cards.length,78);assert.equal(new Set(E.cards.map(c=>c.code)).size,78);
 assert.deepEqual([...E.cards.map(c=>c.code)].sort(),deck.map(c=>c.code).sort());
 assert.equal(E.cards.filter(c=>!/(Wands|Cups|Swords|Pents)\d{2}/.test(c.code)).length,22);
 for(const suit of ['Wands','Cups','Swords','Pents'])assert.equal(E.cards.filter(c=>c.code.startsWith(suit)).length,14);
 assert.equal(new Set(E.cards.map(c=>c.baseMessageKo)).size,78);
 for(const c of E.cards){assert.ok(c.baseMessageKo.length>40);assert.ok(c.keyDetails.length>=2);assert.equal(Object.keys(c.contextMessages).length,7);assert.equal(Object.keys(c.contextAdjustments).length,7);assert.equal(typeof c.profile,'string');assert.equal(typeof c.contactStyle,'string')}
});
for(const [q,c] of [
 ['헤어진 전남친이 연락할까?','REUNION'],['합격 발표 연락 올까?','OFFICIAL'],['면접 결과 연락은?','WORK_BIZ'],
 ['인스타 스토리 보고 DM할까?','SOCIAL'],['오래 연락 없던 친구에게 소식 올까?','PERSONAL'],['썸 상대에게 연락 올까?','LOVE'],
 ['그 사람이 오늘 연락할까?','GENERAL'],['신청한 서비스 승인 연락이 올까?','OFFICIAL'],['거래처가 답장을 줄까?','WORK_BIZ']
])test(`local context: ${q}`,()=>assert.equal(E.classify(q),c));
test('manual override always beats AUTO, invalid/prototype override falls back',()=>{for(const c of Object.keys(E.CONTEXTS))assert.equal(E.resolveContext('전남친',c),c);assert.equal(E.resolveContext('전남친','constructor'),'REUNION')});
for(const [question,context,intent] of [
 ['그가 연락할까?','LOVE','CONTACT_ARRIVAL'],['내 카톡에 답장할까?','LOVE','REPLY'],
 ['면접 결과 연락 올까?','WORK_BIZ','RESULT_NOTICE'],['승인됐다는 연락이 올까?','OFFICIAL','APPROVAL'],
 ['전남친이 다시 연락할까?','REUNION','RECONTACT'],['내 인스타 스토리 보고 있을까?','SOCIAL','SOCIAL_OBSERVE'],
 ['dm 보낼까?','SOCIAL','SOCIAL_ACTION'],['미팅 일정 확정 연락 올까?','WORK_BIZ','SCHEDULE'],
 ['오래 연락 없던 친구 소식 올까?','PERSONAL','PERSONAL_NEWS'],['새로운 소식이 궁금해','GENERAL','GENERAL_NEWS']
])test(`local intent: ${question}`,()=>assert.equal(E.classifyIntent(question,context),intent));
test('semantic profiles expose ten bounded axes and court/suit roles for every card',()=>{
 const keys=['directness','speed','formality','observation','reciprocity','restriction','suddenness','completion','repetition','delay'];
 for(const card of E.cards){const axes=E.semanticProfile(card.code);for(const key of keys)assert.ok(E.AXIS_LEVELS.includes(axes[key]),`${card.code} ${key}`);assert.ok(axes.suit);assert.ok(axes.courtRole)}
 assert.equal(E.semanticProfile('Swords11').courtRole,'PAGE');assert.equal(E.semanticProfile('Wands12').courtRole,'KNIGHT');assert.equal(E.semanticProfile('Cups13').courtRole,'QUEEN');assert.equal(E.semanticProfile('Pents14').courtRole,'KING');
 assert.equal(E.semanticProfile('bad'),null);
});
test('all 546 card/context scores deterministic and bounded; supplied timestamp stable',()=>{
 const snapshot=[];
 for(const card of E.cards)for(const c of Object.keys(E.CONTEXTS)){const a=E.result('합성 질문',c,card.code,'2026-09-11T00:00:00Z');const b=E.result('다른 문장',c,card.code);assert.equal(a.score,b.score);assert.ok(a.score>=0&&a.score<=100);assert.equal(a.createdAt,'2026-09-11T00:00:00Z');snapshot.push([card.code,c,a.score])}
 assert.equal(createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),'51292d2e8b9fd5870076fccc875ab6f400bc739367ab6bf63b2b4dfe2edc2bc0','all pre-upgrade card/context scores must remain byte-for-byte identical');
});
test('contact semantics distinguish formal, reciprocal, silent and observing cards',()=>{
 const score=(code,c)=>E.result('합성 질문',c,code).score;
 assert.ok(score('Hierophant','OFFICIAL')>score('Hierophant','LOVE'));
 assert.ok(score('Cups02','LOVE')>score('Cups02','OFFICIAL'));
 assert.ok(score('Justice','OFFICIAL')>75);assert.ok(score('Judgement','REUNION')>85);
 assert.ok(score('Swords08','GENERAL')<30);assert.ok(score('Wands08','GENERAL')>85);
 const page=E.describe(E.result('합성 질문','SOCIAL','Swords11'));
 assert.ok(page.card.keyDetails.includes('관망'));assert.ok(page.card.keyDetails.includes('SNS/온라인'));assert.match(page.message,/직접 연락/);
 assert.match(E.describe(E.result('합성 질문','GENERAL','High Priestess')).message,/거절로 단정/);
 assert.match(E.describe(E.result('합성 질문','GENERAL','Tower')).message,/좋은 소식이라고 단정하지/);
});
test('secure draw reaches each code, rejects biased tail and never touches normal Tarot state or API',()=>{
 const c=vm.createContext({state:Object.freeze({category:'DAILY',drawn:Object.freeze(['keep'])}),fetch(){throw Error('No API allowed')},Math:Object.freeze(Object.assign(Object.create(Math),{random(){throw Error('No Math.random')}}))});
 vm.runInContext(read('lunea-message-oracle-v1.js'),c);const api=c.LUNEA_MESSAGE_ORACLE_V1,before=JSON.stringify(c.state);
 for(let n=0;n<78;n++)assert.equal(api.draw('합성 질문','GENERAL',{getRandomValues(b){b[0]=n}}).cardCode,api.cards[n].code);
 let calls=0;assert.equal(api.draw('합성 질문','GENERAL',{getRandomValues(b){b[0]=calls++===0?0xffffffff:0}}).cardCode,'Fool');assert.equal(calls,2);
 assert.equal(JSON.stringify(c.state),before);assert.throws(()=>api.draw('','GENERAL'));assert.throws(()=>api.draw('합성 질문','GENERAL',{}));
});
test('restore validates, recomputes score, strips extras and never draws',()=>{
 const r=E.result('합성 질문','OFFICIAL','Justice');const safe=E.restore({...r,score:999,apiKey:'CANARY',drawn:['keep']});
 assert.equal(safe.score,r.score);assert.deepEqual(Object.keys(safe).sort(),['cardCode','context','createdAt','question','score'].sort());
 for(const v of [null,[],{},'text',{...r,cardCode:'bad'},{...r,context:'constructor'},{...r,createdAt:'bad'},{...r,question:'x'.repeat(2001)}])assert.equal(E.restore(v),null);
});
test('feature-local bounded save/dedup/clear preserve all unrelated storage',()=>{
 const map=new Map([['LUNEA_SPREAD_CORRECTION_MEMORY_V1','keep'],['LUNEA_MESSAGE_ORACLE_LAST_V1','{bad']]);
 const store=E.storage({getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});assert.equal(store.last(),null);
 const r=E.result('합성 질문','PERSONAL','Cups06');store.remember(r);store.save(r);store.save(r);assert.equal(store.saved().length,1);
 for(let i=0;i<110;i++)store.save({...r,question:'합성 '+i});assert.equal(store.saved().length,100);
 store.clear();assert.equal(store.last(),null);assert.equal(store.saved().length,100);assert.equal(map.get('LUNEA_SPREAD_CORRECTION_MEMORY_V1'),'keep');
 assert.equal(E.storage({getItem(){throw Error()},setItem(){throw Error()},removeItem(){throw Error()}}).remember(r),false);
});
test('copy has question, final context, canonical name, score caveat, message and details',()=>{
 const text=E.copyText(E.result('합성 질문','OFFICIAL','Justice'),deck);
 for(const part of ['합성 질문','공적 · 결과','Justice','실제 통계 확률이 아니며','합격·승인·긍정 결과 확률이 아니라','Key Details','정방향'])assert.ok(text.includes(part));
});

test('interpret API works without storage timestamps and is deeply deterministic',()=>{
 const input={question:'면접 결과 연락 올까?',context:'WORK_BIZ',cardCode:'Devil'};
 const a=E.interpret(input),b=E.interpret(input);
 assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
 assert.equal(a.intent,'RESULT_NOTICE');assert.equal(a.score,E.result(input.question,input.context,input.cardCode).score);
 assert.equal(a.details.length,4);assert.ok(a.shortMessage);assert.ok(a.fullMessage);assert.ok(a.caveat);assert.equal(a.contextLabel,'업무');
});

test('all 78 x 7 visible interpretations are nonempty, bounded, context-safe and diverse',()=>{
 const questions={LOVE:'그가 연락할까?',REUNION:'전남친이 다시 연락할까?',OFFICIAL:'심사 결과 연락 올까?',WORK_BIZ:'면접 결과 연락 올까?',SOCIAL:'내 인스타 스토리 보고 있을까?',PERSONAL:'오래 연락 없던 친구 소식 올까?',GENERAL:'새로운 소식이 궁금해'};
 const nonRomantic=new Set(['OFFICIAL','WORK_BIZ','SOCIAL','PERSONAL','GENERAL']),all=[];
 for(const card of E.cards)for(const context of Object.keys(E.CONTEXTS)){
  const value=E.result(questions[context],context,card.code,'2026-09-11T00:00:00Z'),reading=E.interpret(value);
  assert.ok(reading.shortMessage);assert.ok(reading.fullMessage);assert.ok(reading.caveat);assert.equal(reading.details.length,4);
  assert.ok(reading.shortMessage.length<=110,`${card.code} ${context} short ${reading.shortMessage.length}`);
  assert.ok(reading.fullMessage.length<=125,`${card.code} ${context} full ${reading.fullMessage.length}`);
  for(const detail of reading.details){assert.ok(detail.label&&detail.value);assert.ok(detail.label.length<=5);assert.ok(detail.value.length<=5)}
  const visible=reading.shortMessage+' '+reading.fullMessage+' '+reading.details.map(x=>x.label+x.value).join(' ');
  if(nonRomantic.has(context))assert.doesNotMatch(visible,/사랑|호감|마음|연애\s*감정/,`${card.code} ${context}`);
  if(reading.intent==='RESULT_NOTICE')assert.doesNotMatch(visible,/합격\s*확률|승인\s*확률|성공\s*확률/);
  if(reading.intent==='SOCIAL_OBSERVE')assert.doesNotMatch(visible,/DM이\s*온다|직접\s*연락이\s*온다|반드시\s*DM/);
  assert.equal(reading.score,value.score,'interpretation must not alter score');all.push(reading);
 }
 const distinct=new Set(all.map(x=>x.shortMessage)).size;
 assert.ok(distinct>=450,`distinct short messages ${distinct}`);
 assert.equal(E.diagnostics.specialOverrideCount,8);assert.equal(E.diagnostics.fallbackCount,0);
 console.log(`Message Oracle quality: ${distinct} distinct short messages / ${E.diagnostics.specialOverrideCount} overrides / ${E.diagnostics.fallbackCount} fallbacks`);
});

test('every supported intent returns a useful deterministic result',()=>{
 const cases=[
  ['그가 연락할까?','LOVE'],['내 카톡에 답장할까?','LOVE'],['면접 결과 연락 올까?','WORK_BIZ'],['승인됐다는 연락이 올까?','OFFICIAL'],
  ['전남친이 다시 연락할까?','REUNION'],['내 인스타 스토리 보고 있을까?','SOCIAL'],['DM 보낼까?','SOCIAL'],
  ['미팅 일정 확정 연락 올까?','WORK_BIZ'],['오래 연락 없던 친구 소식 올까?','PERSONAL'],['새로운 소식이 궁금해','GENERAL']
 ];
 const found=new Set();for(const [question,context] of cases){const reading=E.interpret({question,context,cardCode:'Fool'});found.add(reading.intent);assert.ok(reading.shortMessage&&reading.fullMessage&&reading.details.length===4)}
 assert.deepEqual([...found].sort(),Object.keys(E.INTENTS).sort());
});

test('priority cards keep intent-specific distinctions without score changes',()=>{
 const cases=[
  ['그가 연락할까?','LOVE','High Priestess',/지켜보는 신호/],
  ['내 인스타 스토리 보고 있을까?','SOCIAL','High Priestess',/관찰·확인/],
  ['면접 결과 연락 올까?','WORK_BIZ','High Priestess',/비공개 검토/],
  ['심사 결과 연락 올까?','OFFICIAL','Justice',/결과의 유불리/],
  ['내 인스타 스토리 보고 있을까?','SOCIAL','Swords11',/확인·관찰/],
  ['DM 보낼까?','SOCIAL','Swords11',/직접 DM 행동/],
  ['면접 결과 연락 올까?','WORK_BIZ','Tower',/긍정 결과를 뜻하지/],
  ['면접 결과','WORK_BIZ','Devil',/연락과 긍정 결과는 별개/]
 ];
 for(const [question,context,cardCode,pattern] of cases){const before=E.result(question,context,cardCode).score,reading=E.interpret({question,context,cardCode});assert.match(reading.shortMessage,pattern);assert.equal(reading.score,before);assert.equal(reading.specialOverride,true)}
});

test('all requested priority cards stay useful and non-romantic in result-notice contexts',()=>{
 const codes=['Devil','Tower','Justice','Hierophant','Judgement','World','High Priestess','Hanged Man','Hermit','Moon','Swords11','Swords08','Cups02','Fool'];
 for(const context of ['OFFICIAL','WORK_BIZ'])for(const cardCode of codes){
  const reading=E.interpret({question:context==='WORK_BIZ'?'면접 결과 연락 올까?':'심사 결과 연락 올까?',context,cardCode});
  assert.equal(reading.intent,'RESULT_NOTICE');assert.ok(reading.shortMessage&&reading.fullMessage);assert.equal(reading.details.length,4);
  assert.doesNotMatch(reading.shortMessage+' '+reading.fullMessage,/사랑|호감|마음|연애\s*감정|합격\s*확률|승인\s*확률|성공\s*확률/);
 }
 assert.match(E.interpret({question:'면접 결과 연락 올까?',context:'WORK_BIZ',cardCode:'Hanged Man'}).shortMessage,/제한적|약|지연|보류/);
 assert.match(E.interpret({question:'면접 결과 연락 올까?',context:'WORK_BIZ',cardCode:'Hermit'}).shortMessage,/약|지연|대기/);
 assert.match(E.interpret({question:'면접 결과 연락 올까?',context:'WORK_BIZ',cardCode:'Moon'}).shortMessage,/제한적|확인|조율/);
});
