import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../lunea-reading-consistency-v1.js',import.meta.url),'utf8');
const database=new Map();
function boot(){
  const localStorage={
    getItem:k=>database.has(k)?database.get(k):null,
    setItem:(k,v)=>database.set(k,String(v))
  };
  const window={localStorage};
  vm.runInNewContext(source,{window,Date,JSON,Map,String,Array,Object,RegExp});
  return window.LUNEA_READING_CONSISTENCY_V1;
}
const engine=boot();
assert.equal(engine.version,'reading-consistency-v1');
const reading={
  category:'LOVE',title:'연락운',question:'2026-12-31까지 새 화제로 선톡할까?',
  rationale:'행동을 보는 3장 배열',positions:['현재','행동','결과'],
  drawn:[
    {code:'Swords02',name:'Two of Swords',position:'결과',isReversed:false,subCards:[{code:'Cups11',name:'Page of Cups',isReversed:false}]},
    {code:'Sun',name:'The Sun',position:'행동',isReversed:false,subCards:[]}
  ]
};
const profile={thaiDay:'화요일',thaiRuler:'Mars',saju:'계수',zodiac:'Scorpio'};
const signature=engine.fingerprint(reading,profile);
assert.ok(signature.includes('2026-12-31'));
assert.equal(signature,engine.fingerprint(structuredClone(reading),structuredClone(profile)));
assert.notEqual(signature,engine.fingerprint({...reading,question:'2026-11-30까지 새 화제로 선톡할까?'},profile));
assert.notEqual(signature,engine.fingerprint({...reading,drawn:[{...reading.drawn[0],isReversed:true},reading.drawn[1]]},profile));
assert.notEqual(signature,engine.fingerprint({...reading,drawn:[{...reading.drawn[0],position:'현재'},reading.drawn[1]]},profile));
assert.notEqual(signature,engine.fingerprint({...reading,drawn:[{...reading.drawn[0],subCards:[]},reading.drawn[1]]},profile));
assert.notEqual(signature,engine.fingerprint({...reading,drawn:reading.drawn.slice().reverse()},profile));
assert.equal(engine.fingerprint({...reading,drawn:[]},profile),'');
const narrative='질문에 대한 핵심 결론은 불확실입니다. 검 2는 결정 유보를 상징합니다. 컵 시종은 감정적 메시지의 성향을 설명하지만 실제 발신을 증명하지 않습니다.';
const accepted=engine.validate('[LUNEA_VERDICT:UNCERTAIN]\n'+narrative+'\n[LUNEA_END:UNCERTAIN]');
assert.equal(accepted.ok,true);
assert.equal(accepted.verdict,'UNCERTAIN');
assert.equal(accepted.text,narrative);
assert.equal(engine.validate('[LUNEA_VERDICT:YES]\n'+narrative+'\n[LUNEA_END:NO]').ok,false);
assert.equal(engine.validate('[LUNEA_VERDICT:YES]\n'+narrative).ok,false);
assert.equal(engine.validate('[LUNEA_VERDICT:YES]\n'+narrative+'\n결론: NO\n[LUNEA_END:YES]').ok,false);
assert.equal(engine.validate('[LUNEA_VERDICT:NON_BINARY]\n'+narrative+'\n[LUNEA_END:NON_BINARY]').ok,true);
assert.match(engine.readingPrompt('BASE RWS'),/감정\/의향\/실제 행동\/현실 결과를 혼동하지 않는다/);
assert.match(engine.readingPrompt('BASE RWS'),/LUNEA_VERDICT/);
assert.match(engine.readingPrompt('BASE RWS'),/끌림의 존재·강도, 그 끌림에 따른 긴장·부담·자기통제, 실제 표현·연락 행동을 서로 독립된 축/);
assert.match(engine.readingPrompt('BASE RWS'),/부담 카드\(예: 완드 10\)가 나와도 끌림의 부재로 자동 판정하지 않고/);
assert.match(engine.readingPrompt('BASE RWS'),/강한 성적 끌림을 확정하지 않는다/);
const saved=engine.save(signature,accepted);
assert.ok(saved);
assert.equal(engine.get(signature).text,narrative);
assert.equal(engine.get(signature).verdict,'UNCERTAIN');
assert.equal(boot().get(signature).text,narrative,'browser reload should reuse first accepted reading');
assert.equal(engine.get(engine.fingerprint({...reading,question:'새 질문'},profile)),null);
assert.equal(engine.save('',accepted),null);
assert.equal(engine.save(signature,{verdict:'YES',text:''}),null);


const exported=engine.exportPrompt('RWS CARDS',signature,saved);
const id=engine.readingId(signature);
assert.match(exported,/RWS CARDS/);
assert.match(exported,/끌림의 존재·강도, 그 끌림에 따른 긴장·부담·자기통제, 실제 표현·연락 행동을 서로 독립된 축/);
assert.match(exported,/부담 카드\(예: 완드 10\)가 나와도 끌림의 부재로 자동 판정하지 않고/);
assert.ok(exported.includes('[LUNEA_READING_ID:'+id+']'));
assert.ok(exported.includes('기존 판정 코드: UNCERTAIN'));
assert.ok(exported.includes(narrative));
assert.doesNotMatch(exported,/첫 줄은 반드시 \[LUNEA_VERDICT:코드\] 하나만 출력한다/);
const distinctKey=engine.fingerprint({...reading,question:'다른 질문, 2027-01-31까지?'},profile);
const distinctId=engine.readingId(distinctKey);
assert.notEqual(distinctId,id);
const importBody='타로 카드의 질문 자리와 결과 자리를 각각 나눠서 살펴보면 현재 상황에서는 한 방향만으로 결론을 확정하기 어렵습니다. 보류의 근거가 더 중요합니다.';
const external='[LUNEA_READING_ID:'+distinctId+']\n[LUNEA_VERDICT:UNCERTAIN]\n'+importBody+'\n[LUNEA_END:UNCERTAIN]';
const checkedExternal=engine.parseExternal(external,distinctKey);
assert.equal(checkedExternal.ok,true);
assert.equal(checkedExternal.source,'chatgpt');
assert.equal(engine.parseExternal(external,signature).ok,false,'cross-reading import must be rejected');
assert.equal(engine.parseExternal(external.replace('[LUNEA_END:UNCERTAIN]','[LUNEA_END:YES]'),distinctKey).ok,false);
assert.equal(engine.parseExternal('[LUNEA_VERDICT:UNCERTAIN]\n'+importBody+'\n[LUNEA_END:UNCERTAIN]',distinctKey).ok,false,'missing ID must be rejected');
assert.equal(engine.get(distinctKey),null);
const acceptedExternal=engine.save(distinctKey,checkedExternal);
assert.equal(acceptedExternal.source,'chatgpt');
assert.equal(engine.get(distinctKey).text,importBody);
const rewritten=engine.save(distinctKey,{verdict:'YES',text:'다른 모델의 새 결론이 기존 내용을 덮어써서는 안 됩니다. 이것은 동일한 사건에 대한 별도 판정입니다.'});
assert.equal(rewritten.verdict,'UNCERTAIN','first imported conclusion must not be overwritten');
const noFirst=engine.exportPrompt('RAW RWS',engine.fingerprint({...reading,question:'빈 리딩'},profile),null);
assert.ok(noFirst.includes('저장된 최초 결론이 없습니다.'));

// Do not change real-world card draws or the old journal persistence contract.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const journal=fs.readFileSync(new URL('../lunea-reading-journal-v2.js',import.meta.url),'utf8');
assert.match(html,/lunea-reading-consistency-v1\.js/);
assert.match(html,/getLuneaAcceptedReading\(readingKey\)/);
assert.match(html,/consistency\.validate\(response\)/);
assert.match(html,/readingFingerprint:/);
assert.match(html,/temperature:\.2,topP:\.95/);
assert.match(journal,/existing\?\.conclusion\?\.version/);
assert.match(journal,/최초 판정/);
console.log('LUNEA reading consistency V1: PASS');
