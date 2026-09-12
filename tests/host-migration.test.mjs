import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Deterministic DB-I/O double exercises commit/abort without a network or real user store.
function setup(initial={},rows=[],abort=false,quotaKey='') {
  const memory=new Map(Object.entries(initial)),journal=new Map(rows.map(r=>[r.id,r]));let quota=true;
  const storage={getItem:k=>memory.get(k)??null,setItem(k,v){if(k===quotaKey&&quota){quota=false;throw Error('quota')}memory.set(k,String(v))},removeItem:k=>memory.delete(k)};
  const indexedDB={open(){const req={};queueMicrotask(()=>{req.result={close(){},transaction(name,mode){assert.equal(name,'journal');let cancelled=false;const pending=new Map(journal);const tx={abort(){cancelled=true;queueMicrotask(()=>tx.onabort?.())},objectStore(){return {getAll(){const r={};queueMicrotask(()=>{r.result=[...journal.values()];r.onsuccess()});return r},put(row){pending.set(row.id,structuredClone(row))}}}};if(mode==='readwrite')queueMicrotask(()=>{if(cancelled)return;if(abort){tx.onabort();return}journal.clear();for(const [k,v] of pending)journal.set(k,v);tx.oncomplete()});return tx}};req.onsuccess()});return req}};
  const sandbox={localStorage:storage,indexedDB,location:{origin:'https://old.example',href:'https://old.example/'},URL,console,setTimeout,fetch(){throw Error('NO NETWORK')}};
  vm.runInNewContext(fs.readFileSync(new URL('../lunea-host-migration-v1.js',import.meta.url),'utf8'),sandbox);
  return {api:sandbox.LUNEA_HOST_MIGRATION_V1,memory,journal};
}
const payload=(localStorage={},journal=[])=>({format:'lunea-host-transfer',version:1,localStorage,journal});
const row=id=>({id,reading:{question:'테스트 질문',drawn:[{code:'M00',isReversed:true}],timing:{label:'테스트'},messageOracle:{cardCode:'M01'}}});
test('exports required non-secret stores and raw IndexedDB evidence; excludes auth, API and pending requests',async()=>{
  const {api}=setup({LUNEA_API_KEY:'SECRET_CANARY_123',LUNEA_SUPABASE_SESSION_V1:'{"access_token":"TOKEN_CANARY_123"}',LUNEA_ASTRO_PENDING_V23:'pending',LUNEA_ASTRO_API_URL:'https://old.example/__lunea_api',LUNEA_USER_PROFILE:'{"name":"테스트"}',LUNEA_LAST_READING_DRAFT_V1:JSON.stringify({drawn:[{code:'M00',isReversed:true}],attachments:{horary:{result:'saved'},messageOracle:{cardCode:'M01'}}}),LUNEA_SPREAD_USAGE_MEMORY_V1:'[{"source":"ai_usage","useCount":3}]'},[row('A')]);
  const data=await api.capture();assert.equal(data.journal[0].reading.messageOracle.cardCode,'M01');assert.equal(Object.keys(data.localStorage).length,3);assert.doesNotMatch(JSON.stringify(data),/SECRET_CANARY|TOKEN_CANARY|pending|__lunea_api/);
});
test('full export/import roundtrip keeps all allowlisted values and saved evidence',async()=>{
  const {api}=setup();const values=Object.fromEntries(api.keys.map(k=>[k,k.includes('MEMORY')?'[]':'{"test":"보존"}']));const source=setup(values,[row('A')]);const data=await source.api.capture();const dest=setup();await dest.api.restore(data);assert.deepEqual(Object.fromEntries(dest.memory),values);assert.deepEqual(dest.journal.get('A'),row('A'));
});
test('merges archive and learning arrays without deleting destination-only rows',async()=>{
  const {api,memory,journal}=setup({LUNEA_ARCHIVE_V3:'[{"id":"old"},{"id":"same","v":1}]',LUNEA_SPREAD_CORRECTION_MEMORY_V1:'[{"id":"manual","source":"manual"}]'},[row('old')]);
  await api.restore(payload({LUNEA_ARCHIVE_V3:'[{"id":"same","v":2}]',LUNEA_SPREAD_CORRECTION_MEMORY_V1:'[{"id":"correction","source":"ai_correction"}]'},[row('new')]));
  assert.equal(JSON.parse(memory.get('LUNEA_ARCHIVE_V3')).length,2);assert.equal(JSON.parse(memory.get('LUNEA_ARCHIVE_V3'))[0].v,2);assert.equal(JSON.parse(memory.get('LUNEA_SPREAD_CORRECTION_MEMORY_V1')).length,2);assert.equal(journal.size,2);
});
test('rejects unknown keys and credential fields before any writes',async()=>{
  const {api,memory}=setup({LUNEA_MODEL:'original'});for(const bad of [payload({LUNEA_API_KEY:'x'}),payload({LUNEA_USER_PROFILE:'{"password":"CANARY"}'}),payload({LUNEA_USER_PROFILE:'{"note":"Bearer CANARY"}'})])await assert.rejects(api.restore(bad));assert.equal(memory.size,1);
});
test('known API key accidentally copied into a note fails export closed',async()=>{const {api}=setup({LUNEA_API_KEY:'MY_SECRET_CANARY',LUNEA_USER_PROFILE:'{"note":"MY_SECRET_CANARY"}'});await assert.rejects(api.capture());});
test('rejects wrong schema, duplicate journal IDs, excessive nesting and prototype properties',()=>{const {api}=setup();for(const bad of [{},payload({},[row('x'),row('x')]),payload({LUNEA_USER_PROFILE:'{"__proto__":{}}'}),payload({LUNEA_USER_PROFILE:'['.repeat(45)+'0'+']'.repeat(45)})])assert.throws(()=>api.validate(bad));});
test('IndexedDB abort rolls localStorage back and preserves journal',async()=>{const {api,memory,journal}=setup({LUNEA_MODEL:'old'},[row('old')],true);await assert.rejects(api.restore(payload({LUNEA_MODEL:'new'},[row('new')])));assert.equal(memory.get('LUNEA_MODEL'),'old');assert.equal(journal.size,1);assert.ok(journal.has('old'));});
test('quota error restores old keys, removes newly added keys, aborts journal',async()=>{const {api,memory,journal}=setup({LUNEA_MODEL:'old'},[row('old')],false,'LUNEA_USER_PROFILE');await assert.rejects(api.restore(payload({LUNEA_MODEL:'new',LUNEA_USER_PROFILE:'{}'},[row('new')])));assert.equal(memory.get('LUNEA_MODEL'),'old');assert.ok(!memory.has('LUNEA_USER_PROFILE'));assert.ok(!journal.has('new'));});
test('owned old-host image URLs become relative; external RWS and question stay untouched',()=>{const {api}=setup();const r=api.portable({imgSrc:'https://old.example/assets/timing-oracle/cards/LT-001.png',question:'https://old.example/assets/a.png',image:'https://commons.wikimedia.org/a.jpg'},'https://old.example/');assert.equal(r.imgSrc,'./assets/timing-oracle/cards/LT-001.png');assert.match(r.question,/^https:/);assert.match(r.image,/wikimedia/);});
test('isolated transfer screen loads no reading/autosave/calculation owners',()=>{const html=fs.readFileSync(new URL('../lunea-host-transfer.html',import.meta.url),'utf8');assert.deepEqual([...html.matchAll(/<script src="([^"]+)/g)].map(x=>x[1]),['./lunea-host-migration-v1.js?v=20260912-pages-transfer-1']);assert.doesNotMatch(html,/serviceWorker/);});
