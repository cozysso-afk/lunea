/* Executable production UI + loader with a tiny DOM double. No layout claims. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
function harness({loader=false,denied=false,reduced=false,assetFail=false,holdAssets=false}={}){
 let document;let animations=0,activeAnimations=[],pendingAssets=[];
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
  animate(frames,options){animations++;assert.deepEqual(JSON.parse(JSON.stringify(frames)),[{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}]);assert.equal(options.duration,640);let finish;const finished=new Promise(r=>finish=r);const animation={finished,cancel:()=>finish(),finish};activeAnimations.push(animation);return animation}
  click(){if(this.disabled)return;return this.emit('click')}focus(){document.activeElement=this}getClientRects(){return this.hidden||this.parentElement?.hidden?[]:[{}]}remove(){}
 }
 document=new Node('document');document.readyState='loading';document.documentElement=new Node('html');document.head=new Node('head');document.body=new Node('body');document.appendChild(document.documentElement);document.documentElement.appendChild(document.head);document.documentElement.appendChild(document.body);document.createElement=tag=>new Node(tag);document.getElementById=id=>document.querySelector('#'+id);
 const sourceHtml=read('index.html');const host=new Node();host.innerHTML=sourceHtml.match(/<section class="category" id="luneaSignalMessageSection"[\s\S]*?<\/section>/)[0];document.body.appendChild(host);const entry=document.getElementById('luneaMessageOracleEntry');
 const map=new Map([['TAROT_KEEP','unchanged']]),loaded=[];let draws=0,confirm=true,copied='';
 const context=vm.createContext({document,console,setTimeout,clearTimeout,Image:class{set src(value){this.url=value;const done=()=>assetFail?this.onerror?.():this.onload?.();if(holdAssets)pendingAssets.push(done);else queueMicrotask(done)}async decode(){}},matchMedia:()=>({matches:reduced}),Element:Node,CustomEvent:class{},queueMicrotask,state:Object.freeze({category:'DAILY',drawn:Object.freeze(['keep'])}),fetch(){throw Error('No API')},crypto:{getRandomValues(b){b[0]=draws++;return b}},confirm:()=>confirm,navigator:{clipboard:{writeText:async t=>{copied=t}}},localStorage:{getItem:k=>map.get(k)||null,setItem(k,v){if(denied)throw Error('quota');map.set(k,v)},removeItem:k=>map.delete(k)},addEventListener(){},dispatchEvent(){}});
 context.window=context;
 const html=read('index.html');vm.runInContext(html.split('\n').find(line=>line.startsWith("document.querySelectorAll('.category-header').forEach")),context);vm.runInContext(html.slice(html.indexOf('const MAJORS='),html.indexOf('const TAROT_DECK='))+'const TAROT_DECK=[...MAJORS,...buildMinor()];',context);
 if(loader){vm.runInContext(read('lunea-structural-routing-v4.js').replace('  boot().catch(err=>{','  W.__messageTest={groupForTarget,installLazyTriggers};\n  boot().catch(err=>{'),context);context.__messageTest.installLazyTriggers()}
 else{vm.runInContext(read('lunea-message-oracle-v1.js'),context);vm.runInContext(read('lunea-message-oracle-ui-v1.js').replace('  W.LUNEA_MESSAGE_ORACLE_UI_V1=', '  W.__renderMessageScore=renderScore;\n  W.LUNEA_MESSAGE_ORACLE_UI_V1='),context)}
 return {document,entry,context,map,loaded,query:s=>document.querySelector(s),draws:()=>draws,setConfirm:v=>confirm=v,copied:()=>copied,animations:()=>animations,finishFlips:async()=>{activeAnimations.forEach(a=>a.finish());activeAnimations=[];await Promise.resolve()},releaseAssets:()=>{pendingAssets.forEach(f=>f());pendingAssets=[]}};
}
async function start(h){await h.entry.click();h.query('#moQuestion').value='합성 면접 결과 연락';await h.query('#moQuestion').emit('input');await h.query('.mo-form').emit('submit');await h.finishFlips()}
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
 h.setConfirm(true);await h.query('[data-action="redraw"]').click();assert.equal(h.draws(),2);await h.finishFlips();
 await h.query('[data-action="new"]').click();assert.equal(h.query('.mo-result').hidden,true);assert.equal(h.query('#moQuestion').value,'');assert.equal(h.map.has('LUNEA_MESSAGE_ORACLE_LAST_V1'),false);assert.equal(h.map.get('TAROT_KEEP'),'unchanged');
 await h.query('.mo-saved-list').children[0].click();assert.equal(h.draws(),2);assert.equal(h.query('.mo-result').hidden,false);
});
test('empty question/canceled opening draws nothing; hostile question stays plain text',async()=>{
 const h=harness();await h.entry.click();await h.query('.mo-form').emit('submit');assert.equal(h.draws(),0);await h.query('.mo-close').click();assert.equal(h.map.size,1);
 await h.entry.click();h.query('#moQuestion').value='<img src=x onerror=CANARY> 합성 질문';await h.query('.mo-form').emit('submit');assert.match(h.query('.mo-result-context').textContent,/onerror=CANARY/);assert.equal(h.query('.mo-question-summary').children.length,0);
});
test('storage denied keeps immediate result usable and reports inability to save',async()=>{
 const h=harness({denied:true});await start(h);assert.equal(h.query('.mo-result').hidden,false);assert.match(h.query('.mo-status').textContent,/저장하지 못/);await h.query('[data-action="save"]').click();assert.match(h.query('.mo-status').textContent,/저장 공간/);
});
test('actual loader Message group loads only engine+UI, gates/replays entry once, ignores DAILY signal',async()=>{
 const h=harness({loader:true});assert.equal(h.context.__messageTest.groupForTarget(h.entry),'message');assert.equal(h.context.__messageTest.groupForTarget(h.entry.parentElement),null);
 assert.equal(h.query('#luneaMessageOracleOverlay'),null);
 await h.document.emit('click',{target:h.entry});await new Promise(setImmediate);await new Promise(setImmediate);
 assert.deepEqual(h.loaded,['./lunea-message-oracle-v1.js?v=101','./lunea-message-oracle-ui-v1.js?v=104']);
 assert.equal(h.query('#luneaMessageOracleOverlay').dataset.open,'true');assert.equal(h.draws(),0);
 assert.ok(h.document.head.children.findIndex(n=>n.id==='luneaMessageOracleStyle')>=0);
});

test('real Home markup uses existing expandable category handler and never opens a Tarot spread',async()=>{
 const h=harness();const header=h.query('.category-header'),category=h.query('#luneaSignalMessageSection');
 assert.equal(header.getAttribute('aria-expanded'),'false');await header.click();assert.equal(header.getAttribute('aria-expanded'),'true');assert.equal(category.classList.contains('active'),true);
 await header.emit('keydown',{key:'Enter'});assert.equal(header.getAttribute('aria-expanded'),'false');assert.equal(h.entry.matches('.reading-item'),false);assert.equal(h.draws(),0);
});


test('approved JPEG bytes and source dimensions are locked; no cropping or conversion',()=>{
 for(const [name,bytes,hash] of [
 ['message_oracle_front_frame.jpeg',388177,'48ea7dd1c4cbb68a53c816a2d3edcf4035620b454a834f0141b31f24e1c65194'],
 ['message_oracle_back.jpeg',577868,'7ed5a1315fb892d260056a5faa5f13abc3e9661c5f9a67545f13e70ba029e6ac']]){
  const b=fs.readFileSync(new URL('../assets/message-oracle/'+name,import.meta.url));assert.equal(b.length,bytes);assert.equal(createHash('sha256').update(b).digest('hex'),hash);assert.equal(b.readUInt16BE(0),0xffd8);
 }
});
test('first visible card is approved back only; no result or decorative text overlay',async()=>{
 const h=harness();await h.entry.click();assert.equal(h.query('.mo-card').dataset.face,'back');assert.equal(h.query('.mo-result').hidden,true);assert.equal(h.query('.mo-card-back').children.length,1);assert.equal(h.query('.mo-back-art').getAttribute('src'),'./assets/message-oracle/message_oracle_back.jpeg?v=101');assert.equal(h.query('.mo-card-back').getAttribute('aria-hidden'),'true');assert.equal(h.animations(),0);assert.equal(h.draws(),0);
});
test('asset readiness holds first paint; asset failure remains closed with retry message',async()=>{
 const h=harness({holdAssets:true});const opening=h.entry.click();await Promise.resolve();assert.equal(h.query('#luneaMessageOracleOverlay').dataset.open,undefined);h.releaseAssets();await opening;assert.equal(h.query('#luneaMessageOracleOverlay').dataset.open,'true');
 const failed=harness({assetFail:true});await failed.entry.click();assert.equal(failed.query('#luneaMessageOracleOverlay').dataset.open,undefined);assert.match(failed.query('#luneaMessageOracleLoadStatus').textContent,/이미지를 불러오지 못/);assert.equal(failed.draws(),0);
});
test('draw causes exactly one flip; double-tap cannot draw during animation; reopen never flips',async()=>{
 const h=harness();await h.entry.click();h.query('#moQuestion').value='합성 질문';await h.query('.mo-form').emit('submit');assert.equal(h.draws(),1);assert.equal(h.animations(),1);assert.equal(h.query('.mo-card').dataset.face,'front');
 await h.query('[data-action="redraw"]').click();assert.equal(h.draws(),1);await h.finishFlips();
 await h.query('[data-action="redraw"]').click();assert.equal(h.draws(),2);assert.equal(h.animations(),2);await h.finishFlips();await h.query('.mo-close').click();await h.entry.click();assert.equal(h.draws(),2);assert.equal(h.animations(),2);assert.equal(h.query('.mo-card').dataset.face,'front');
 await h.query('[data-action="new"]').click();assert.equal(h.query('.mo-card').dataset.face,'back');assert.equal(h.query('.mo-result').hidden,true);
});
test('reduced motion reveals immediately, with no animation or additional RNG',async()=>{
 const h=harness({reduced:true});await start(h);assert.equal(h.query('.mo-card').dataset.face,'front');assert.equal(h.draws(),1);assert.equal(h.animations(),0);assert.equal(h.query('[data-action="redraw"]').disabled,false);
});
test('all seven contexts produce four concise labeled cells; full engine prose stays intact',async()=>{
 for(const c of ['LOVE','REUNION','OFFICIAL','WORK_BIZ','SOCIAL','PERSONAL','GENERAL']){
  const h=harness({reduced:true});await h.entry.click();h.query('#moQuestion').value='합성 질문';await h.query('[data-context="'+c+'"]').click();await h.query('.mo-form').emit('submit');
  const cells=h.query('.mo-details').children;assert.equal(cells.length,4);for(const cell of cells){assert.equal(cell.children.length,2);assert.ok(cell.children[0].textContent.length<=5);assert.ok(cell.children[1].textContent.length<=5)}
  const row=JSON.parse(h.map.get('LUNEA_MESSAGE_ORACLE_LAST_V1')),d=h.context.LUNEA_MESSAGE_ORACLE_V1.describe(row);
  assert.equal(h.query('.mo-score').textContent,d.score+'%');assert.equal(h.query('.mo-bottom').textContent,h.context.LUNEA_MESSAGE_ORACLE_V1.CONTEXTS[c]);assert.ok(h.query('.mo-full-text').textContent.includes(d.message));assert.ok(d.message.startsWith(h.query('.mo-message').textContent));
  if(c==='OFFICIAL')assert.equal(cells[0].children[0].textContent,'결과 신호');if(c==='SOCIAL')assert.equal(cells[1].children[0].textContent,'관찰');
 }
});
test('all 78 restored identities get stable names and upright canonical images without drawing',async()=>{
 const h=harness({reduced:true}),api=h.context.LUNEA_MESSAGE_ORACLE_V1;
 for(const c of api.cards){const row=api.result('합성 복원 질문','GENERAL',c.code);api.storage(h.context.localStorage).save(row)}
 await h.entry.click();for(const button of h.query('.mo-saved-list').children){await button.click();assert.ok(h.query('.mo-name-en').textContent);assert.ok(h.query('.mo-name-ko').textContent);assert.ok(h.query('.mo-image').alt);assert.equal(h.query('.mo-card').dataset.face,'front')}
 assert.equal(h.draws(),0);assert.equal(h.animations(),0);
});


test('score typography distinguishes 9%, 34% and 100% without changing a result',()=>{
 const h=harness();for(const [score,digits] of [[9,'1'],[34,'2'],[100,'3']]){h.context.__renderMessageScore(score);assert.equal(h.query('.mo-score').textContent,score+'%');assert.equal(h.query('.mo-score').dataset.digits,digits)}assert.equal(h.draws(),0);
});
test('header uses the approved transparent PNG logo and styles scope the dark input override to Message',()=>{
 const h=harness();assert.equal(h.query('.mo-symbol').tagName,'img');assert.equal(h.query('.mo-symbol').getAttribute('src'),'./assets/message-oracle/message_oracle_logo.png?v=101');assert.equal(h.query('.mo-symbol').getAttribute('aria-hidden'),'true');
 const css=h.query('#luneaMessageOracleStyle').textContent;assert.match(css,/color:#393140!important;-webkit-text-fill-color:#393140!important/);assert.match(css,/\.mo-card-front\{[^}]*background:transparent/);assert.match(css,/mask-image:url\('[^']*message_oracle_front_mask.png/);assert.match(css,/mask-image:url\('[^']*message_oracle_back_mask.png/);
});
