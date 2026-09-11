import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
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
 for(const c of E.cards){assert.ok(c.baseMessageKo.length>40);assert.ok(c.keyDetails.length>=2);assert.equal(Object.keys(c.contextMessages).length,7);assert.equal(Object.keys(c.contextAdjustments).length,7);assert.equal(typeof c.contactStyle,'string')}
});
for(const [q,c] of [
 ['헤어진 전남친이 연락할까?','REUNION'],['합격 발표 연락 올까?','OFFICIAL'],['면접 결과 연락은?','WORK_BIZ'],
 ['인스타 스토리 보고 DM할까?','SOCIAL'],['오래 연락 없던 친구에게 소식 올까?','PERSONAL'],['썸 상대에게 연락 올까?','LOVE'],
 ['그 사람이 오늘 연락할까?','GENERAL'],['신청한 서비스 승인 연락이 올까?','OFFICIAL'],['거래처가 답장을 줄까?','WORK_BIZ']
])test(`local context: ${q}`,()=>assert.equal(E.classify(q),c));
test('manual override always beats AUTO, invalid/prototype override falls back',()=>{for(const c of Object.keys(E.CONTEXTS))assert.equal(E.resolveContext('전남친',c),c);assert.equal(E.resolveContext('전남친','constructor'),'REUNION')});
test('all 546 card/context scores deterministic and bounded; supplied timestamp stable',()=>{
 for(const card of E.cards)for(const c of Object.keys(E.CONTEXTS)){const a=E.result('합성 질문',c,card.code,'2026-09-11T00:00:00Z');const b=E.result('다른 문장',c,card.code);assert.equal(a.score,b.score);assert.ok(a.score>=0&&a.score<=100);assert.equal(a.createdAt,'2026-09-11T00:00:00Z')}
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
 for(const part of ['합성 질문','공적 · 결과','Justice','실제 확률이 아니라','Key Details','정방향'])assert.ok(text.includes(part));
});
