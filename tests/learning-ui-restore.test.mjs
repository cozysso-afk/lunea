import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

class Node {
  constructor(tag='div') {
    this.tagName=tag; this.children=[]; this.attrs={}; this.events={}; this.style={}; this.text=''; this.value=''; this.parentElement=null;
    const set=new Set(); this.classList={add:(...v)=>v.forEach(x=>set.add(x)),remove:(...v)=>v.forEach(x=>set.delete(x)),contains:x=>set.has(x),toggle:(x,on)=>{if(on===false)set.delete(x);else set.add(x)}};
  }
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='id')this.id=String(v);if(k==='class'){this.className=String(v);for(const name of String(v).split(/\s+/))this.classList.add(name)}}
  getAttribute(k){return this.attrs[k]??null}
  appendChild(n){n.parentElement=this;this.children.push(n);return n}
  insertAdjacentElement(position,n){assert.equal(position,'afterend');const parent=this.parentElement;const index=parent.children.indexOf(this);n.parentElement=parent;parent.children.splice(index+1,0,n);return n}
  set textContent(v){this.text=String(v);this.children=[]} get textContent(){return this.text+this.children.map(n=>n.textContent).join('')}
  set innerHTML(html){this.children=[];const stack=[this];for(const token of html.match(/<[^>]*>|[^<]+/g)||[]){if(token.startsWith('</')){stack.pop();continue}if(token.startsWith('<')){const tag=token.match(/^<([\w-]+)/)?.[1];if(!tag)continue;const n=new Node(tag);for(const m of token.matchAll(/([\w-]+)="([^"]*)"/g))n.setAttribute(m[1],m[2]);if(/\sstyle="([^"]*)"/.test(token)){for(const pair of RegExp.$1.split(';')){const [k,v]=pair.split(':');if(k)n.style[k.trim()]=v?.trim()}}stack.at(-1).appendChild(n);if(!['input','br'].includes(tag))stack.push(n)}else stack.at(-1).text+=token}}
  matches(selector){if(selector.startsWith('#'))return this.id===selector.slice(1);if(selector.startsWith('.')){const names=selector.slice(1).split('.');return names.every(name=>this.classList.contains(name))}return this.tagName===selector}
  querySelectorAll(selector){return this.children.flatMap(n=>[...(n.matches(selector)?[n]:[]),...n.querySelectorAll(selector)])}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null}
  addEventListener(type,handler){(this.events[type]??=[]).push(handler)}
  async click(){for(const handler of this.events.click||[])await handler({target:this})}
}

test('Home priming creates one existing learning bar and reconnects the existing auth/recovery UI', async () => {
  const values=new Map([['LUNEA_SPREAD_CORRECTION_MEMORY_V1','KEEP_ME']]);
  const localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const document=new Node('document');document.readyState='loading';document.head=new Node('head');document.body=new Node('body');document.appendChild(document.head);document.appendChild(document.body);document.createElement=tag=>new Node(tag);document.getElementById=id=>document.querySelector('#'+id);
  const engine=new Node('div');engine.setAttribute('class','engine-strip');document.body.appendChild(engine);
  const windowEvents={};
  const learningRows=[
    {question:'manual',questionKey:'manual',positions:['A','B'],updatedAt:2,source:'manual'},
    {question:'correction',questionKey:'correction',positions:['A','B'],updatedAt:1,source:'ai_correction'},
  ];
  const window={
    window:null,
    LUNEA_SPREAD_LEARNING_V1:{key:'LUNEA_SPREAD_CORRECTION_MEMORY_V1',list:()=>learningRows,record:x=>x,recordManual:x=>x,clear(){}},
    addEventListener(type,handler){(windowEvents[type]??=[]).push(handler)},
  }; window.window=window;
  class MutationObserver{observe(){} disconnect(){}}
  const context=vm.createContext({window,document,localStorage,console:{info(){},warn(){},error(){}},setTimeout(fn){queueMicrotask(fn);return 1},clearTimeout(){},setInterval(fn){queueMicrotask(fn);return 1},clearInterval(){},fetch(){throw new Error('network must not run while signed out')},Date,Map,Array,Object,String,Number,JSON,RegExp,Error,Promise,URLSearchParams,MutationObserver,location:{hash:'',pathname:'/',search:''},history:{replaceState(){}}});
  vm.runInContext(read('lunea-learning-cloud-sync-v1.js'),context);
  vm.runInContext(read('lunea-learning-auth-recovery-v2.js'),context);
  for(const handler of windowEvents.DOMContentLoaded||[]) await handler();
  for(const handler of document.events.DOMContentLoaded||[]) await handler();
  await Promise.resolve(); await Promise.resolve();

  assert.equal(document.querySelectorAll('#luneaLearningSyncBar').length,1);
  assert.equal(document.querySelector('#luneaLearningLocalCount').textContent,'2/1000');
  assert.match(document.querySelector('#luneaLearningSyncStatus').textContent,/이 기기에 안전하게 학습 중/);
  const allIds=node=>[...(node.id?[node.id]:[]),...node.children.flatMap(allIds)];
  assert.ok(document.querySelector('#luneaLearningResetPassword'), allIds(document).join(','));
  await document.querySelector('#luneaLearningSyncBtn').click();
  assert.ok(document.querySelector('#luneaLearningSyncOverlay').classList.contains('show'));
  assert.ok(document.querySelector('#luneaLearningEmail'));
  assert.ok(document.querySelector('#luneaLearningPassword'));
  assert.equal(document.querySelector('#luneaLearningSignUp').textContent,'계정 만들기');
  assert.equal(document.querySelector('#luneaLearningSignIn').textContent,'로그인 + 동기화');

  localStorage.setItem('LUNEA_SUPABASE_SESSION_V1',JSON.stringify({access_token:'synthetic',refresh_token:'synthetic',expires_at:Date.now()+3600000,user:{id:'u1',email:'test@example.test'}}));
  window.LUNEA_LEARNING_CLOUD_SYNC_V1.open();
  assert.match(document.querySelector('#luneaLearningAuthState').textContent,/로그인됨 · test@example\.test/);
  assert.equal(document.querySelector('#luneaLearningSignedOut').style.display,'none');
  assert.equal(document.querySelector('#luneaLearningSignedIn').style.display,'block');
  assert.ok(document.querySelector('#luneaLearningSyncNow'));
  assert.ok(document.querySelector('#luneaLearningSignOut'));
  assert.equal(localStorage.getItem('LUNEA_SPREAD_CORRECTION_MEMORY_V1'),'KEEP_ME');

  vm.runInContext(read('lunea-learning-cloud-sync-v1.js'),context);
  vm.runInContext(read('lunea-learning-auth-recovery-v2.js'),context);
  assert.equal(document.querySelectorAll('#luneaLearningSyncBar').length,1);
});

test('deterministic loader primes learning after Home reveal without loading reading UI', () => {
  const source=read('lunea-structural-routing-v4.js');
  const learning=source.match(/learning:\[([\s\S]*?)\n\s*\],\n\s*intimacy:/)?.[1]||'';
  assert.match(learning,/lunea-user-spread-learning-v1\.js/);
  assert.ok(learning.indexOf('lunea-learning-cloud-sync-v1.js') < learning.indexOf('lunea-learning-auth-recovery-v2.js'));
  assert.match(learning,/lunea-learning-success-gate-v1\.js/);
  const prime=source.match(/function primeLearningUI\(\)\{([\s\S]*?)\n\s*\}/)?.[1]||'';
  assert.match(prime,/loadGroup\('learning'\)/);
  assert.doesNotMatch(prime,/loadGroup\('reading'\)/);
  const boot=source.slice(source.indexOf('async function boot(){'),source.indexOf("boot().catch(err=>{"));
  assert.ok(boot.indexOf('revealHome();') < boot.indexOf('primeLearningUI();'));
  assert.ok(boot.indexOf('primeLearningUI();') < boot.indexOf('await Promise.all([shellPromise,homeRuntimePromise])'));
});
