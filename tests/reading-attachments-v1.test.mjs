import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../lunea-reading-attachments-v1.js',import.meta.url),'utf8');
const read=name=>fs.readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const reading=(o={})=>({category:'LOVE',title:'관계의 흐름',question:'이 관계는 어떻게 흘러갈까?',positions:['현재','상대'],drawn:[{code:'MA01',name:'The Magician',position:'현재',isReversed:false,subCards:[]},{code:'C02',name:'Two of Cups',position:'상대',isReversed:true,subCards:[{code:'W08',name:'Eight of Wands',isReversed:false}]}],...o});
const archiveRow=(id,c,o={})=>({id,title:c.title,q:c.question,cards:c.drawn.map(x=>({position:x.position,name:x.name,isReversed:x.isReversed,subCards:(x.subCards||[]).map(s=>({name:s.name,isReversed:s.isReversed}))})),...o});

function harness(){
  const values=new Map(),docListeners=new Map(),winListeners=new Map(),groups=[],restored=[],cleared=[];let snapshots=0;
  const localStorage={getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const document={hidden:false,documentElement:{dataset:{luneaHomeRuntimeReady:'1'}},getElementById(){return null},addEventListener(t,h){(docListeners.get(t)||docListeners.set(t,[]).get(t)).push(h)}};
  const window={window:null,state:reading(),startSpread(){return 'started'},LUNEA_LOAD_FEATURE_GROUP:async g=>{groups.push(g);return true},LUNEA_READING_DRAFT_V1:{snapshot(){snapshots++}},addEventListener(t,h){(winListeners.get(t)||winListeners.set(t,[]).get(t)).push(h)},dispatchEvent(){return true}};window.window=window;
  class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail}}
  vm.runInNewContext(source,{window,document,localStorage,CustomEvent,console,queueMicrotask,setTimeout,clearTimeout});
  return{api:window.LUNEA_READING_ATTACHMENTS_V1,window,document,localStorage,values,docListeners,winListeners,groups,restored,cleared,snapshots:()=>snapshots};
}

function timingHarness(){
  const h=harness();let timingRestores=0;
  h.window.LUNEA_LOAD_FEATURE_GROUP=async group=>{
    h.groups.push(group);
    if(group==='timing')h.window.LUNEA_DRAFT_TIMING_V50={restore:draft=>{assert.ok(draft.timingSupport);timingRestores++;return true}};
    return true;
  };
  return {...h,timingRestores:()=>timingRestores};
}

test('signature binds exact reading dimensions',()=>{
  const {api}=harness(),base=reading(),sig=api.signature(base);assert.ok(sig.startsWith('r1:'));
  for(const variant of [reading({category:'CAREER'}),reading({title:'다른 배열'}),reading({question:'다른 질문'}),reading({positions:['원인','결과']}),reading({drawn:[{...base.drawn[0],isReversed:true},base.drawn[1]]})])assert.notEqual(api.signature(variant),sig);
});

test('five computed attachments capture and restore; Timing remains V50 draft-owned',async()=>{
  const h=harness(),names=['astroTransit','astroReturns','thaiTaksa','thaiTaksaRange','horary'];
  for(const name of names){h.api.register(name,{group:name.startsWith('thai')?'finish':'astro',capture:()=>({kind:name}),restore:v=>{h.restored.push(v.kind);return true},toArchive:v=>v,clear:()=>h.cleared.push(name)});assert.equal(h.api.notifyChanged(name),true)}
  h.api.register('timing',{group:'timing',draft:false,capture:()=>({kind:'timing'}),toArchive:v=>v,clear:()=>h.cleared.push('timing')});h.api.notifyChanged('timing');await Promise.resolve();
  const draft=h.api.captureDraft(h.window.state);assert.equal(Object.hasOwn(draft,'timing'),false);assert.equal(Object.keys(h.api.captureArchive()).length,6);
  h.api.prepareRestore();assert.equal(await h.api.restoreDraft({...h.window.state,attachments:draft}),true);assert.deepEqual(h.restored.sort(),names.sort());assert.deepEqual([...new Set(h.groups)].sort(),['astro','finish']);assert.equal(typeof h.window.fetch,'undefined');
});

test('wrong reading rejects all attachments and legacy timingSupport remains compatible',async()=>{
  const h=harness(),exact=h.window.state,sig=h.api.signature(exact),draft={...exact,attachments:{version:1,readingSignature:sig,horary:{version:1,readingSignature:sig,data:{kind:'h'}}}};
  h.api.register('horary',{capture:()=>null,restore:()=>{h.restored.push('h');return true}});h.api.register('timing',{draft:false,capture:()=>null,toArchive:v=>v});
  h.window.state=reading({drawn:[{...exact.drawn[0],isReversed:true},exact.drawn[1]]});assert.equal(await h.api.restoreDraft(draft),false);assert.deepEqual(h.restored,[]);
  h.window.state=exact;assert.equal(await h.api.restoreDraft({...exact,timingSupport:{imgSrc:'timing_042.jpg',label:'곧',meaning:'가까운 시기'}}),true);assert.equal(h.api.captureArchive().timing.primary.id,'LT-042');
});

test('legacy timingSupport lazy-loads V50 and restores exactly once on a cold draft restore',async()=>{
  const h=timingHarness(),draft={...h.window.state,timingSupport:{imgSrc:'timing_042.jpg',label:'곧',meaning:'가까운 시기'}};
  h.api.register('timing',{draft:false,capture:()=>null,toArchive:value=>value});
  assert.equal(await h.api.restoreDraft(draft),true);
  assert.equal(h.groups.filter(group=>group==='timing').length,1);
  assert.equal(h.timingRestores(),1);
  assert.equal(h.api.captureArchive().timing.primary.id,'LT-042');
});

test('saved keys lazy-load groups before adapters register',async()=>{
  const h=harness(),sig=h.api.signature(h.window.state);await h.api.restoreDraft({...h.window.state,attachments:{version:1,readingSignature:sig,astroTransit:{version:1,readingSignature:sig,data:{}},thaiTaksaRange:{version:1,readingSignature:sig,data:{}}}});assert.deepEqual([...new Set(h.groups)].sort(),['astro','finish']);
});

test('archive enrichment touches only the new exact row, never archive[0]',()=>{
  const h=harness(),c=h.window.state,old=archiveRow('old',c,{astroTransit:{old:true}}),target=archiveRow('target',c),decoy=archiveRow('decoy',c,{cards:[{name:'Wrong',position:'현재'}],horary:{keep:true}});h.localStorage.setItem('LUNEA_ARCHIVE_V3',JSON.stringify([decoy,target,old]));
  const fields={astroTransit:{schema:'LUNEA_TRANSIT_SCAN_V1'},timing:{primary:{id:'LT-001'}},horary:{schema:'LUNEA_HORARY_V1'}};assert.equal(h.api.enrichNewArchive(new Set(['old']),c,fields),true);const rows=JSON.parse(h.localStorage.getItem('LUNEA_ARCHIVE_V3'));assert.deepEqual(rows[0].horary,{keep:true});assert.equal(rows[1].attachmentSchema,'LUNEA_READING_ATTACHMENTS_V1');assert.deepEqual(rows[2].astroTransit,{old:true});
});

test('capture-phase save enriches the exact row created by base save',async()=>{
  const h=harness(),c=h.window.state;h.api.register('astroTransit',{capture:()=>({result:{schema:'LUNEA_TRANSIT_SCAN_V1'}}),toArchive:s=>s.result});h.api.notifyChanged('astroTransit');h.localStorage.setItem('LUNEA_ARCHIVE_V3',JSON.stringify([archiveRow('old',c)]));
  const click=(h.docListeners.get('click')||[])[0];click({target:{closest:s=>s==='#saveReading'?{}:null}});h.localStorage.setItem('LUNEA_ARCHIVE_V3',JSON.stringify([archiveRow('decoy',c,{cards:[]}),archiveRow('created',c),archiveRow('old',c)]));await Promise.resolve();const rows=JSON.parse(h.localStorage.getItem('LUNEA_ARCHIVE_V3'));assert.equal(rows[1].attachmentSchema,'LUNEA_READING_ATTACHMENTS_V1');assert.deepEqual(rows[1].astroTransit,{schema:'LUNEA_TRANSIT_SCAN_V1'});
});

test('termination snapshots are nonblocking and oversized data fails closed',()=>{
  const h=harness(),before=h.snapshots();for(const f of h.winListeners.get('pagehide')||[])f();for(const f of h.winListeners.get('beforeunload')||[])f();h.document.hidden=true;for(const f of h.docListeners.get('visibilitychange')||[])f();assert.equal(h.snapshots()-before,3);
  h.api.register('astroTransit',{capture:()=>({huge:'x'.repeat(230000)})});assert.equal(h.api.notifyChanged('astroTransit'),false);assert.equal(h.api.register('messageOracle',{capture:()=>null}),true);
});

test('production owners register state adapters and disable legacy archive[0] mutation',()=>{
  const owners=new Map([['astro-transit-v1.js','astroTransit'],['astro-return-v1.js','astroReturns'],['lunea-thai-tarot-bridge-v32.js','thaiTaksa'],['lunea-thai-range-v33.js','thaiTaksaRange'],['astro-horary-v1.js','horary'],['timing-oracle-v1.js','timing']]);
  for(const [file,name] of owners){const code=read(file);assert.match(code,new RegExp(`register\\('${name}'`));assert.match(code,new RegExp(`notifyChanged\\?\\.\\('${name}'\\)`));assert.match(code,/capture:/);if(name!=='timing')assert.match(code,/restore:/)}
  for(const file of ['astro-transit-v1.js','astro-return-v1.js','astro-horary-v1.js','timing-oracle-v1.js'])assert.match(read(file),/if\s*\(window\.LUNEA_READING_ATTACHMENTS_V1\)\s*return/);
  for(const file of ['astro-transit-v1.js','astro-return-v1.js','lunea-thai-range-v33.js'])assert.match(read(file),/hasSavedResult/);
  const draft=read('lunea-reading-draft-v1.js');assert.match(draft,/captureDraft\?\.\(s\)/);assert.match(draft,/prepareRestore\?\.\(\)/);assert.match(draft,/restoreDraft\?\.\(d\)/);
  const loader=read('lunea-structural-routing-v4.js');assert.match(loader,/lunea-reading-draft-v1\.js[\s\S]*lunea-reading-attachments-v1\.js/);assert.doesNotMatch(source,/Storage\.prototype\./);
  const horary=read('astro-horary-v1.js');assert.match(horary,/judgment_support:enriched\.judgment_support/);for(const n of ['LUNEA_HORARY_TOPIC_V19','LUNEA_HORARY_QUESTION_MODES_V37','LUNEA_HORARY_HARDENING_V38','LUNEA_HORARY_TRADITIONAL_CORE_V40','LUNEA_HORARY_BALANCE_GUARD_V41']){assert.match(horary,new RegExp(`${n}\\?\\.restoreResult`));assert.match(horary,new RegExp(`${n}\\?\\.clearResult`))}
  assert.match(read('lunea-journal-detail-v51.js'),/dataset\?\.sourceArchiveId/);assert.match(read('lunea-reading-journal-v2.js'),/el\.dataset\.sourceArchiveId/);assert.match(read('index.html'),/el\.dataset\.sourceArchiveId=String\(item\.id\)/);
});
