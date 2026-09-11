/* Executable production UI + loader with a tiny DOM double. No layout claims. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
function harness({loader=false,denied=false}={}){
 let document;
 class Node {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.attrs={};this.dataset={};this.events={};this.hidden=false;this.value='';this.text='';this.isConnected=true;const set=new Set();this.classList={add:(...v)=>v.forEach(x=>set.add(x)),remove:(...v)=>v.forEach(x=>set.delete(x)),contains:x=>set.has(x),toggle(x){if(set.has(x)){set.delete(x);return false}set.add(x);return true}}}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='id')this.id=v;if(k==='class')this.className=v;if(k.startsWith('data-'))this.dataset[k.slice(5)]=v}
  getAttribute(k){return this.attrs[k]??null}
  removeAttribute(k){delete this.attrs[k]}
  appendChild(n){n.parentElement=this;this.children.push(n);if(n.tagName==='script'){loaded.push(n.src);queueMicrotask(()=>{try{vm.runInContext(read(n.src.replace('./','').split('?')[0]),context);n.onload?.()}catch{n.onerror?.()}})}return n}
  replaceChildren(...n){this.children=[];n.forEach(x=>this.appendChild(x))}
  set textContent(v){this.text=String(v);this.children=[]} get textContent(){return this.text+this.children.map(n=>n.textContent).join('')}
  set innerHTML(html){this.children=[];const stack=[this];for(const token of html.match(/<[^>]*>|[^<]+/g)||[]){if(token.startsWith('</')){stack.pop();continue}if(token.startsWith('<')){const tag=token.match(/^<([\w-]+)/)?.[1];if(!tag)continue;const n=new Node(tag);for(const m of token.matchAll(/([\w-]+)="([^"]*)"/g))n.setAttribute(m[1],m[2]);if(/\shidden(?:\s|>)/.test(token))n.hidden=true;stack.at(-1).appendChild(n);if(!['img','br','input'].includes(tag))stack.push(n)}else stack.at(-1).text+=token}}
  matches(s){return s.split(',').some(x=>{x=x.trim();if(x.startsWith('#'))return this.id===x.slice(1);if(x.startsWith('.'))return (this.className||'').split(' ').includes(x.slice(1));const m=x.match(/^\[([^=]+)="([^"]+)"\]$/);return m?(m[1].startsWith('data-')?this.dataset[m[1].slice(5)]:this.attrs[m[1]])===m[2]:this.tagName===x})}
  querySelectorAll(s){return this.children.flatMap(n=>[...(n.matches(s)?[n]:[]),...n.querySelectorAll(s)])}querySelector(s){return this.querySelectorAll(s)[0]||null}
  closest(s){return this.matches(s)?this:this.parentElement?.closest(s)||null}
  addEventListener(type,f){(this.events[type]??=[]).push(f)}
  async emit(type,extra={}){const e={target:this,preventDefault(){},stopImmediatePropagation(){},...extra};for(const f of this.events[type]||[])await f(e)}
  click(){return this.emit('click')}focus(){document.activeElement=this}getClientRects(){return this.hidden||this.parentElement?.hidden?[]:[{}]}remove(){}
 }
 document=new Node('document');document.readyState='loading';document.documentElement=new Node('html');document.head=new Node('head');document.body=new Node('body');document.appendChild(document.documentElement);document.documentElement.appendChild(document.head);document.documentElement.appendChild(document.body);document.createElement=tag=>new Node(tag);document.getElementById=id=>document.querySelector('#'+id);
 const sourceHtml=read('index.html');const host=new Node();host.innerHTML=sourceHtml.match(/<section class="category" id="luneaSignalMessageSection"[\s\S]*?<\/section>/)[0];document.body.appendChild(host);const entry=document.getElementById('luneaMessageOracleEntry');
 const map=new Map([['TAROT_KEEP','unchanged']]),loaded=[];let draws=0,confirm=true,copied='';
 const context=vm.createContext({document,console,Element:Node,CustomEvent:class{},queueMicrotask,clearTimeout(){},state:Object.freeze({category:'DAILY',drawn:Object.freeze(['keep'])}),fetch(){throw Error('No API')},crypto:{getRandomValues(b){b[0]=draws++;return b}},confirm:()=>confirm,navigator:{clipboard:{writeText:async t=>{copied=t}}},localStorage:{getItem:k=>map.get(k)||null,setItem(k,v){if(denied)throw Error('quota');map.set(k,v)},removeItem:k=>map.delete(k)},addEventListener(){},dispatchEvent(){}});
 context.window=context;
 const html=read('index.html');vm.runInContext(html.split('\n').find(line=>line.startsWith("document.querySelectorAll('.category-header').forEach")),context);vm.runInContext(html.slice(html.indexOf('const MAJORS='),html.indexOf('const TAROT_DECK='))+'const TAROT_DECK=[...MAJORS,...buildMinor()];',context);
 if(loader){vm.runInContext(read('lunea-structural-routing-v4.js').replace('  boot().catch(err=>{','  W.__messageTest={groupForTarget,installLazyTriggers};\n  boot().catch(err=>{'),context);context.__messageTest.installLazyTriggers()}
 else{vm.runInContext(read('lunea-message-oracle-v1.js'),context);vm.runInContext(read('lunea-message-oracle-ui-v1.js'),context)}
 return {document,entry,context,map,loaded,query:s=>document.querySelector(s),draws:()=>draws,setConfirm:v=>confirm=v,copied:()=>copied};
}
async function start(h){await h.entry.click();h.query('#moQuestion').value='합성 면접 결과 연락';await h.query('#moQuestion').emit('input');await h.query('.mo-form').emit('submit')}
test('first entry installs final style before opening and base draw has no API/state mutation',async()=>{
 const h=harness();assert.ok(h.query('#luneaMessageOracleStyle'));assert.equal(h.query('#luneaMessageOracleOverlay').dataset.open,undefined);
 await start(h);assert.equal(h.query('#luneaMessageOracleOverlay').dataset.open,'true');assert.equal(h.query('.mo-result').hidden,false);assert.equal(h.query('.mo-form').hidden,true);assert.equal(h.query('.mo-image').src,'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_00_Fool.jpg');
 assert.match(h.query('.mo-result-context').textContent,/업무/);assert.equal(h.draws(),1);assert.equal(JSON.stringify(h.context.state),'{"category":"DAILY","drawn":["keep"]}');
});
test('manual context is saved; close/reopen and fresh-page restore do not redraw',async()=>{
 const h=harness();await h.entry.click();h.query('#moQuestion').value='합성 전남친 연락';await h.query('[data-context="OFFICIAL"]').click();await h.query('.mo-form').emit('submit');
 const saved=h.map.get('LUNEA_MESSAGE_ORACLE_LAST_V1');assert.equal(JSON.parse(saved).context,'OFFICIAL');
 await h.query('.mo-close').click();await h.entry.click();assert.equal(h.draws(),1);
 const fresh=harness();fresh.map.set('LUNEA_MESSAGE_ORACLE_LAST_V1',saved);await fresh.entry.click();assert.equal(fresh.draws(),0);assert.equal(fresh.query('.mo-result').hidden,false);
});
test('copy/save/redraw confirmation cancel/new-question are isolated and functional',async()=>{
 const h=harness();await start(h);await h.query('[data-action="copy"]').click();assert.match(h.copied(),/LUNEA MESSAGE ORACLE/);
 await h.query('[data-action="save"]').click();await h.query('[data-action="save"]').click();assert.equal(h.query('.mo-saved-list').children.length,1);
 const before=h.map.get('LUNEA_MESSAGE_ORACLE_LAST_V1');h.setConfirm(false);await h.query('[data-action="redraw"]').click();assert.equal(h.draws(),1);assert.equal(h.map.get('LUNEA_MESSAGE_ORACLE_LAST_V1'),before);
 h.setConfirm(true);await h.query('[data-action="redraw"]').click();assert.equal(h.draws(),2);
 await h.query('[data-action="new"]').click();assert.equal(h.query('.mo-result').hidden,true);assert.equal(h.query('#moQuestion').value,'');assert.equal(h.map.has('LUNEA_MESSAGE_ORACLE_LAST_V1'),false);assert.equal(h.map.get('TAROT_KEEP'),'unchanged');
 await h.query('.mo-saved-list').children[0].click();assert.equal(h.draws(),2);assert.equal(h.query('.mo-result').hidden,false);
});
test('empty question/canceled opening draws nothing; hostile question stays plain text',async()=>{
 const h=harness();await h.entry.click();await h.query('.mo-form').emit('submit');assert.equal(h.draws(),0);await h.query('.mo-close').click();assert.equal(h.map.size,1);
 await h.entry.click();h.query('#moQuestion').value='<img src=x onerror=CANARY> 합성 질문';await h.query('.mo-form').emit('submit');assert.match(h.query('.mo-result-context').textContent,/onerror=CANARY/);assert.equal(h.query('.mo-result-context').children.length,0);
});
test('storage denied keeps immediate result usable and reports inability to save',async()=>{
 const h=harness({denied:true});await start(h);assert.equal(h.query('.mo-result').hidden,false);assert.match(h.query('.mo-status').textContent,/저장하지 못/);await h.query('[data-action="save"]').click();assert.match(h.query('.mo-status').textContent,/저장 공간/);
});
test('actual loader Message group loads only engine+UI, gates/replays entry once, ignores DAILY signal',async()=>{
 const h=harness({loader:true});assert.equal(h.context.__messageTest.groupForTarget(h.entry),'message');assert.equal(h.context.__messageTest.groupForTarget(h.entry.parentElement),null);
 assert.equal(h.query('#luneaMessageOracleOverlay'),null);
 await h.document.emit('click',{target:h.entry});await new Promise(setImmediate);await new Promise(setImmediate);
 assert.deepEqual(h.loaded,['./lunea-message-oracle-v1.js?v=101','./lunea-message-oracle-ui-v1.js?v=101']);
 assert.equal(h.query('#luneaMessageOracleOverlay').dataset.open,'true');assert.equal(h.draws(),0);
 assert.ok(h.document.head.children.findIndex(n=>n.id==='luneaMessageOracleStyle')>=0);
});

test('real Home markup uses existing expandable category handler and never opens a Tarot spread',async()=>{
 const h=harness();const header=h.query('.category-header'),category=h.query('#luneaSignalMessageSection');
 assert.equal(header.getAttribute('aria-expanded'),'false');await header.click();assert.equal(header.getAttribute('aria-expanded'),'true');assert.equal(category.classList.contains('active'),true);
 await header.emit('keydown',{key:'Enter'});assert.equal(header.getAttribute('aria-expanded'),'false');assert.equal(h.entry.matches('.reading-item'),false);assert.equal(h.draws(),0);
});
