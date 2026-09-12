import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../lunea-astro-origin-failover-v57.js',import.meta.url),'utf8');
function harness(fetch){const calls=[],timers=[];const c={URL,AbortController,console,fetch:(...args)=>{calls.push(args);return fetch(...args)},setTimeout:f=>{timers.push(f);return timers.length},clearTimeout(){}};c.window=c;vm.runInNewContext(source,c);return{c,calls,timers}}
for(const path of ['/v1/returns/context','/v1/horary','/v1/transits/scan'])test(path+' never repeats a failed computation',async()=>{
 const h=harness(async()=>{throw new TypeError('network failure')});await assert.rejects(h.c.fetch('https://lunea-astro-api.onrender.com'+path,{method:'POST',body:'synthetic'}));assert.equal(h.calls.length,1);assert.equal(h.timers.length,1);
});
test('HTTP 503 is returned once rather than sending another computation',async()=>{const response={status:503};const h=harness(async()=>response);assert.equal(await h.c.fetch('https://lunea-astro-api.onrender.com/v1/horary',{method:'POST'}),response);assert.equal(h.calls.length,1)});
test('successful health selects one origin and calculation preserves body and cancellation signal',async()=>{
 const response={ok:true,status:200};const h=harness(async()=>response);await h.c.fetch('https://lunea-astro-api.onrender.com/health');const signal=new AbortController().signal;await h.c.fetch('https://lunea-astro-api.onrender.com/v1/returns/context',{method:'POST',body:'unchanged',signal});assert.equal(h.calls.length,2);assert.equal(h.calls[1][0],'https://lunea-astro-api-v2.onrender.com/v1/returns/context');assert.equal(h.calls[1][1].signal,signal);assert.equal(h.calls[1][1].body,'unchanged');
});
