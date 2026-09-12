import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
function harness(fetch){
 const timers=new Map();let id=0;
 const nodes={};const node=key=>nodes[key]??=( {value:'',textContent:'',disabled:false,classList:{add(){},remove(){}},focus(){}} );
 const c={console,AbortController,document:{readyState:'loading',addEventListener(){},getElementById:node,querySelectorAll:()=>[{value:'Sun'}]},setTimeout:fn=>{timers.set(++id,fn);return id},clearTimeout:id=>timers.delete(id),fetch,localStorage:{getItem:k=>k==='LUNEA_ASTRO_API_URL'?'https://synthetic.invalid':JSON.stringify({planets:{Sun:{longitude:1}}}),setItem(){}},state:{question:'질문'},alert(){}};c.window=c;vm.createContext(c);vm.runInContext(read('lunea-astro-request-v1.js'),c);
 return {c,node,timers,expire:()=>{for(const f of [...timers.values()])f()}};
}
test('deadline settles a request even when fetch ignores abort',async()=>{
 let signal;const h=harness((u,o)=>{signal=o.signal;return new Promise(()=>{})});const p=h.c.LUNEA_ASTRO_REQUEST_V1.json('/test');await flush();h.expire();await assert.rejects(p,/120초/);assert.equal(signal.aborted,true);assert.equal(h.timers.size,0);
});
test('deadline covers stalled JSON body after successful headers',async()=>{
 const h=harness(async()=>({ok:true,json:()=>new Promise(()=>{})}));const p=h.c.LUNEA_ASTRO_REQUEST_V1.json('/test');await flush();h.expire();await assert.rejects(p,/대기를 중단/);
});
test('boundary during preparation settles and prevents a late POST',async()=>{
 let release,calls=0;const h=harness(()=>{calls++;});const p=h.c.LUNEA_ASTRO_REQUEST_V1.json('/test',{}, {prepare:()=>new Promise(r=>release=r)});await flush();h.c.LUNEA_ASTRO_REQUEST_V1.cancelScope('reading');await assert.rejects(p,{name:'AbortError'});release();await flush();assert.equal(calls,0);
});
test('successful response, invalid JSON and HTTP failure always clear deadlines without retries',async()=>{
 for(const mode of ['ok','json','http']){let calls=0;const h=harness(async()=>{calls++;return{ok:mode!=='http',status:503,json:async()=>{if(mode==='json')throw Error();return{detail:'서버 사용 불가',value:1}}}});const p=h.c.LUNEA_ASTRO_REQUEST_V1.json('/test');if(mode==='ok')assert.equal((await p).data.value,1);else await assert.rejects(p);assert.equal(calls,1);assert.equal(h.timers.size,0)}
});
test('Return production handler exits calculating state on stalled response body',async()=>{
 const h=harness(async()=>({ok:true,json:()=>new Promise(()=>{})}));
 vm.runInContext(read('astro-return-v1.js').replace('  function boot(){','  window.testRunReturn=run;\n  function boot(){'),h.c);
 h.node('astroReturnPlace').value='서울';const p=h.c.testRunReturn();assert.equal(h.node('astroReturnRun').disabled,true);await flush();h.expire();await p;assert.equal(h.node('astroReturnRun').disabled,false);assert.match(h.node('astroReturnStatus').textContent,/계산 실패:.*120초/);
});
test('Horary production handler releases button on stalled JSON and tolerates denied storage',async()=>{
 const h=harness(async()=>({ok:true,json:()=>new Promise(()=>{})}));
 h.c.localStorage.setItem=()=>{throw Error('denied')};
 const src=read('astro-horary-v1.js');const end=src.lastIndexOf('})();');vm.runInContext(src.slice(0,end)+'window.testRunHorary=runHorary;'+src.slice(end),h.c);
 for(const [k,v] of Object.entries({astroHoraryQuestion:'연락이 올까?',astroHoraryMoment:'2026-09-12T12:00',astroHoraryPlace:'서울',astroHoraryTopic:'contact'}))h.node(k).value=v;
 const p=h.c.testRunHorary();await flush();h.expire();await p;assert.equal(h.node('astroHoraryRun').disabled,false);assert.match(h.node('astroHoraryStatus').textContent,/계산 실패:.*120초/);
});
test('failed Return is removed from pending state and cannot auto-resume',()=>{
 const source=read('lunea-astro-resume-v23.js');const a=source.indexOf('  function checkSuccess()'),b=source.indexOf('  function wrap(',a);const cleared=[];
 vm.runInNewContext(source.slice(a,b)+'checkSuccess();',{succeeded:()=>false,clearPending:k=>cleared.push(k),$:()=>({textContent:'계산 실패: timeout'}),paintBadge(){}});assert.deepEqual(cleared,['returns']);
});
test('Return production success still renders and restores the run button',async()=>{
 const h=harness(async()=>({ok:true,json:async()=>({returns:{Sun:{previous:null,next:null,anchor_chart:{}}},location:{place_resolved:'서울'}})}));
 vm.runInContext(read('astro-return-v1.js').replace('  function boot(){','  window.testRunReturn=run;\n  function boot(){'),h.c);
 h.node('astroReturnPlace').value='서울';await h.c.testRunReturn();assert.equal(h.node('astroReturnRun').disabled,false);assert.match(h.node('astroReturnStatus').textContent,/계산 완료/);
});
test('editing Horary input during a request clears the calculating status as well as button',async()=>{
 let resolve;const h=harness(()=>new Promise(r=>resolve=r));const src=read('astro-horary-v1.js'),end=src.lastIndexOf('})();');vm.runInContext(src.slice(0,end)+'window.testRunHorary=runHorary;'+src.slice(end),h.c);
 for(const [k,v] of Object.entries({astroHoraryQuestion:'연락이 올까?',astroHoraryMoment:'2026-09-12T12:00',astroHoraryPlace:'서울',astroHoraryTopic:'contact'}))h.node(k).value=v;
 const p=h.c.testRunHorary();await flush();h.node('astroHoraryQuestion').value='다른 질문';resolve({ok:true,json:async()=>({schema:'LUNEA_HORARY_V1'})});await p;assert.equal(h.node('astroHoraryRun').disabled,false);assert.match(h.node('astroHoraryStatus').textContent,/입력이 바뀌어/);
});
