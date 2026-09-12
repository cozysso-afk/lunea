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
  get parentNode(){return this.parentElement}
  get nextSibling(){return this.parentElement?.children[this.parentElement.children.indexOf(this)+1]||null}
  get nextElementSibling(){return this.nextSibling}
  insertBefore(node,before){node.remove();node.parentElement=this;const i=this.children.indexOf(before);this.children.splice(i<0?this.children.length:i,0,node);return node}
  click(){if(this.disabled)return;return this.emit('click')}focus(){document.activeElement=this}getClientRects(){return this.hidden||this.parentElement?.hidden?[]:[{}]}remove(){if(this.parentElement){const i=this.parentElement.children.indexOf(this);if(i>=0)this.parentElement.children.splice(i,1);this.parentElement=null}}
 }
 document=new Node('document');document.readyState='loading';document.documentElement=new Node('html');document.head=new Node('head');document.body=new Node('body');document.appendChild(document.documentElement);document.documentElement.appendChild(document.head);document.documentElement.appendChild(document.body);document.createElement=tag=>new Node(tag);document.getElementById=id=>document.querySelector('#'+id);
 const sourceHtml=read('index.html');const host=new Node();host.innerHTML=sourceHtml.match(/<section class="category" id="luneaSignalMessageSection"[\s\S]*?<\/section>/)[0];document.body.appendChild(host);const entry=document.getElementById('luneaMessageOracleEntry');
 const map=new Map([['TAROT_KEEP','unchanged']]),loaded=[];let draws=0,confirm=true,copied='';
 const context=vm.createContext({document,console,setTimeout,clearTimeout,Image:class{set src(value){this.url=value;const done=()=>assetFail?this.onerror?.():this.onload?.();if(holdAssets)pendingAssets.push(done);else queueMicrotask(done)}async decode(){}},matchMedia:()=>({matches:reduced}),Element:Node,CustomEvent:class{},queueMicrotask,state:Object.freeze({category:'DAILY',drawn:Object.freeze(['keep'])}),fetch(){throw Error('No API')},crypto:{getRandomValues(b){b[0]=draws++;return b}},confirm:()=>confirm,navigator:{clipboard:{writeText:async t=>{copied=t}}},localStorage:{getItem:k=>map.get(k)||null,setItem(k,v){if(denied)throw Error('quota');map.set(k,v)},removeItem:k=>map.delete(k)},addEventListener(){},dispatchEvent(){}});
 context.window=context;
 const html=read('index.html');vm.runInContext(html.split('\n').find(line=>line.startsWith("document.querySelectorAll('.category-header').forEach")),context);vm.runInContext(html.slice(html.indexOf('const MAJORS='),html.indexOf('const TAROT_DECK='))+'const TAROT_DECK=[...MAJORS,...buildMinor()];',context);
 if(loader){vm.runInContext(read('lunea-structural-routing-v4.js').replace('  boot().catch(err=>{','  W.__messageTest={groupForTarget,installLazyTriggers};\n  boot().catch(err=>{'),context);context.__messageTest.installLazyTriggers()}
 else{vm.runInContext(read('lunea-message-oracle-v1.js'),context);vm.runInContext(read('lunea-message-oracle-ui-v1.js').replace('  W.LUNEA_MESSAGE_ORACLE_UI_V1=', '  W.__messagePresentation=Object.freeze({renderScore,visibleMessage,visibleContextMessage,detailCells,copyResultText});\n  W.LUNEA_MESSAGE_ORACLE_UI_V1='),context)}
 return {document,entry,context,map,loaded,query:s=>document.querySelector(s),draws:()=>draws,setConfirm:v=>confirm=v,copied:()=>copied,animations:()=>animations,finishFlips:async()=>{activeAnimations.forEach(a=>a.finish());activeAnimations=[];await Promise.resolve()},releaseAssets:()=>{pendingAssets.forEach(f=>f());pendingAssets=[]}};
}
async function start(h){await h.entry.click();h.query('#moQuestion').value='합성 면접 결과 연락';await h.query('#moQuestion').emit('input');await h.query('.mo-form').emit('submit');await h.finishFlips()}

function supportHarness(){
 const h=harness();
 h.context.state={category:'CAREER',title:'합성 배열',question:'면접 결과 연락 올까?',positions:['현재'],drawn:[{code:'M1',name:'The Magician',position:'현재',isReversed:false}]};
 const host=h.document.createElement('div');host.id='spreadOverlay';
 const bar=h.document.createElement('div');bar.className='actionbar';host.appendChild(bar);
 const cards=h.document.createElement('div');cards.id='cards';host.appendChild(cards);h.document.body.appendChild(host);
 // This DOM double's document selector does not parse descendant combinators.
 const query=h.document.querySelector.bind(h.document);
 h.document.querySelector=s=>s==='#spreadOverlay .actionbar'?bar:query(s);
 let snapshots=0,draft;
 h.context.LUNEA_READING_DRAFT_V1={snapshot(){snapshots++;draft={...h.context.state,attachments:h.context.LUNEA_READING_ATTACHMENTS_V1.captureDraft()}}};
 h.context.LUNEA_LOAD_FEATURE_GROUP=async()=>true;
 vm.runInContext(read('lunea-reading-attachments-v1.js'),h.context);
 vm.runInContext(read('lunea-message-oracle-support-v1.js'),h.context);
 const api=h.context.LUNEA_MESSAGE_ORACLE_SUPPORT_V1;
 return {...h,api,registry:h.context.LUNEA_READING_ATTACHMENTS_V1,host,cards,bar,snapshots:()=>snapshots,draft:()=>JSON.parse(JSON.stringify(draft))};
}

test('support opens without draw; inherits canonical question; one draw autosaves only attachment',async()=>{
 const h=supportHarness(),original=JSON.stringify(h.context.state);
 await h.api.open();assert.equal(h.draws(),0);assert.equal(h.query('#moQuestion').readOnly,true);
 assert.equal(h.query('#moQuestion').value,h.context.state.question);assert.equal(h.query('#luneaMessageOracleInline'),null);
 assert.equal(h.query('[data-action="new"]').hidden,true);
 await h.query('.mo-form').emit('submit');await h.finishFlips();
 assert.equal(h.draws(),1);assert.equal(h.snapshots(),1);assert.ok(h.draft().attachments.messageOracle);
 assert.equal(h.document.querySelectorAll('#luneaMessageOracleInline').length,1);
 assert.equal(h.map.has('LUNEA_MESSAGE_ORACLE_LAST_V1'),false);assert.equal(JSON.stringify(h.context.state),original);
 assert.equal(h.context.LUNEA_MESSAGE_ORACLE_V1.interpret(h.api.capture()).intent,'RESULT_NOTICE');
});

test('support close/reopen, redraw cancel/confirm and standalone storage stay independent',async()=>{
 const h=supportHarness();await start(h);const standalone=h.map.get('LUNEA_MESSAGE_ORACLE_LAST_V1');
 await h.api.open();assert.equal(h.query('.mo-card').dataset.face,'back');
 await h.query('.mo-form').emit('submit');await h.finishFlips();const first=h.api.capture().cardCode;
 await h.query('.mo-close').click();await h.api.open();assert.equal(h.draws(),2);
 h.setConfirm(false);await h.query('[data-action="redraw"]').click();assert.equal(h.draws(),2);
 h.setConfirm(true);await h.query('[data-action="redraw"]').click();await h.finishFlips();assert.equal(h.draws(),3);
 assert.notEqual(h.api.capture().cardCode,first);assert.equal(h.document.querySelectorAll('#luneaMessageOracleInline').length,1);
 assert.equal(h.map.get('LUNEA_MESSAGE_ORACLE_LAST_V1'),standalone);
 await h.entry.click();assert.equal(h.query('#moQuestion').readOnly,false);
 assert.equal(h.query('.mo-score-text').textContent,JSON.parse(standalone).score+'%');
});

test('cold exact draft restore uses saved Message identity with zero draw and rejects different cards',async()=>{
 const h=supportHarness();await h.api.open();await h.query('.mo-form').emit('submit');await h.finishFlips();
 const draft=h.draft(),fresh=supportHarness();
 assert.equal(await fresh.registry.restoreDraft(draft),true);assert.equal(fresh.draws(),0);
 assert.equal(fresh.api.capture().cardCode,h.api.capture().cardCode);
 assert.equal(fresh.document.querySelectorAll('#luneaMessageOracleInline').length,1);
 fresh.registry.clearForNewReading();fresh.context.state={...fresh.context.state,drawn:[{name:'Different',isReversed:true}]};
 assert.equal(await fresh.registry.restoreDraft(draft),false);assert.equal(fresh.api.capture(),null);
 assert.equal(fresh.document.querySelectorAll('#luneaMessageOracleInline').length,0);
 await fresh.api.open();assert.equal(fresh.query('.mo-card').dataset.face,'back');assert.equal(fresh.draws(),0);
});

test('support cannot draw into a reading changed while modal or assets are pending',async()=>{
 const h=supportHarness();await h.api.open();h.context.state.question='다른 질문';
 await h.query('.mo-form').emit('submit');assert.equal(h.draws(),0);assert.equal(h.api.capture(),null);
});

test('support archive enriches exact new ID and coexists with all other evidence',async()=>{
 const h=supportHarness(),c=h.context.state;
 for(const name of ['timing','astroTransit','thaiTaksa','thaiTaksaRange','astroReturns','horary']){
  h.registry.register(name,{capture:()=>({keep:name})});h.registry.notifyChanged(name);
 }
 const intimacy=h.document.createElement('div');intimacy.id='intimacy-keep';h.host.appendChild(intimacy);
 await h.api.open();await h.query('.mo-form').emit('submit');await h.finishFlips();
 const row=id=>({id,title:c.title,q:c.question,cards:c.drawn});
 h.map.set('LUNEA_ARCHIVE_V3',JSON.stringify([{...row('decoy'),q:'unrelated'},row('new'),row('old')]));
 assert.equal(h.registry.enrichNewArchive(new Set(['old']),c),true);
 const rows=JSON.parse(h.map.get('LUNEA_ARCHIVE_V3'));assert.equal(rows[0].messageOracle,undefined);
 for(const key of ['messageOracle','timing','astroTransit','thaiTaksa','thaiTaksaRange','astroReturns','horary'])assert.ok(rows[1][key],key);
 assert.ok(rows[1].messageOracle.fullMessage);assert.equal(rows[2].messageOracle,undefined);assert.ok(h.query('#intimacy-keep'));
 // Execute the production Journal text helper, with no engine or network.
 vm.runInContext(read('lunea-journal-detail-v51.js').replace('  function richText(reading) {','  W.__journalMessageText=messageText;\n  function richText(reading) {').replace(/  if \(document.readyState[\s\S]*$/, '})();'),h.context);
 assert.match(h.context.__journalMessageText(rows[1].messageOracle),/면접 결과 연락/);
});

test('all normal Tarot categories use the same support engine and isolated signature',async()=>{
 for(const [category,question,intent] of [
  ['LOVE','그 사람이 연락할까?','CONTACT_ARRIVAL'],['CAREER','면접 결과 연락 올까?','RESULT_NOTICE'],
  ['SOCIAL','인스타 스토리 보고 있을까?','SOCIAL_OBSERVE'],['LOVE','전남친이 다시 연락할까?','RECONTACT'],
  ['INTIMACY','상대가 답장할까?','REPLY'],['DAILY','오늘 연락 올까?','CONTACT_ARRIVAL'],
  ['GENERAL','소식 올까?','CONTACT_ARRIVAL'],['STOCK','거래처 답장 올까?','REPLY']]){
   const h=supportHarness();h.context.state={...h.context.state,category,question};
   await h.api.open();await h.query('.mo-form').emit('submit');await h.finishFlips();
   assert.ok(h.api.capture(),category);assert.equal(h.context.LUNEA_MESSAGE_ORACLE_V1.interpret(h.api.capture()).intent,intent,question);
 }
});

test('production authoring-row owner orders every sector idempotently and retains node handlers',()=>{
 const h=supportHarness();let source=read('lunea-manual-everywhere-v1.js');
 source=source.slice(0,source.lastIndexOf("  if (document.readyState === 'loading')"))+'  W.__orderRows=orderAuthoringRows;})();';
 vm.runInContext(source,h.context);
 for(const category of ['GENERAL','CAREER','LOVE','STOCK','INTIMACY']){
  const parent=h.document.createElement('div');
  const row=(id,dataset)=>{const n=h.document.createElement('div');n.id=id;n.className='reading-item';n.dataset={cat:category,...dataset};parent.appendChild(n);return n};
  const direct=row('manual',{manualSpread:'1'}),fixed=row('fixed',{count:'5'}),ai=row('ai',{count:'0'});
  const handler=()=>{};direct.addEventListener('click',handler);
  h.context.__orderRows(parent);assert.deepEqual(parent.children.map(n=>n.id),['ai','manual','fixed']);
  h.context.__orderRows(parent);assert.deepEqual(parent.children,[ai,direct,fixed]);assert.equal(direct.events.click[0],handler);
 }
 const noAi=h.document.createElement('div');const fixed=h.document.createElement('div');fixed.className='reading-item';noAi.appendChild(fixed);
 h.context.__orderRows(noAi);assert.deepEqual(noAi.children,[fixed]);
});

test('production action owner orders coexisting support nodes, leaves intimacy intact, and is idempotent',async()=>{
 const h=supportHarness();
 for(const id of ['luneaHoraryInline','luneaReturnInline','luneaThaiRangeInline','luneaThaiTarotBridgeInline','luneaAstroTransitInline','luneaTimingInline','intimacy-keep']){
  const n=h.document.createElement('div');n.id=id;h.host.appendChild(n);
 }
 let source=read('lunea-reading-action-order-v33.js');
 source=source.slice(0,source.lastIndexOf("  if (document.readyState"))+'})();';
 vm.runInContext(source,h.context);
 await h.api.open();await h.query('.mo-form').emit('submit');await h.finishFlips();
 const expected=['cards','luneaTimingInline','luneaMessageOracleInline','luneaAstroTransitInline','luneaThaiTarotBridgeInline','luneaThaiRangeInline','luneaReturnInline','luneaHoraryInline','intimacy-keep'];
 assert.deepEqual(h.host.children.filter(n=>n!==h.bar).map(n=>n.id),expected);
 h.context.LUNEA_READING_ACTION_ORDER_V33.reorder();
 assert.deepEqual(h.host.children.filter(n=>n!==h.bar).map(n=>n.id),expected);
 h.context.state.drawn[0].subCards=[{name:'New clarifier'}];
 h.context.LUNEA_READING_ACTION_ORDER_V33.reorder();
 assert.equal(h.query('#luneaMessageOracleInline'),null);assert.ok(h.query('#luneaTimingInline'));
});
test('final action ranks preserve handlers and canonical relative order with optional controls',()=>{
 const h=supportHarness();
 const expected=['flipAll','extraCard','saveReading','retry','timingSupportBtn','luneaMessageOracleSupportBtn','astroTransitBtn','astroReturnBtn','astroHoraryBtn','thaiTaksaBtn','luneaThaiTarotRangeBtn','aiRead','luneaTopCopyPrompt'];
 h.bar.replaceChildren();
 const handler=()=>{};
 for(const id of [...expected].reverse()){const n=h.document.createElement('button');n.id=id;n.addEventListener('click',handler);h.bar.appendChild(n)}
 let source=read('lunea-reading-action-order-v33.js');source=source.slice(0,source.lastIndexOf('  if (document.readyState'))+'})();';vm.runInContext(source,h.context);
 const api=h.context.LUNEA_READING_ACTION_ORDER_V33;api.reorder();
 assert.deepEqual(h.bar.children.map(n=>n.id),expected);assert.ok(h.bar.children.every(n=>n.events.click[0]===handler));
 h.query('#thaiTaksaBtn').id='luneaThaiTarotBridgeBtn';h.query('#astroReturnBtn').remove();api.reorder();
 assert.deepEqual(h.bar.children.map(n=>n.id),expected.filter(id=>id!=='astroReturnBtn').map(id=>id==='thaiTaksaBtn'?'luneaThaiTarotBridgeBtn':id));
 assert.match(source,/actionbar\.actionbar\{[\s\S]*?repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(source,/ORDER\.map\(\(id,index\)=>/);assert.match(source,/grid-column:1 \/ -1!important/);
});
test('one card coordinate scale keeps aspect and typographic ratios with symmetric content gutters',()=>{
 const h=harness(),css=h.query('#luneaMessageOracleStyle').textContent;
 assert.match(css,/width:calc\(100% - 32px\);max-width:340px;aspect-ratio:846\/1399;container-type:inline-size/);
 for(const viewport of [390,402,430]){const content=viewport-24-2-32,card=Math.min(340,content-32);assert.equal((content-card)/2,16);assert.ok(card<content);assert.ok(4.242424*card/100>=12.5)}
 assert.match(css,/font:500 4\.242424cqw\/1\.46/);assert.match(css,/word-break:normal;overflow-wrap:normal;text-wrap:pretty/);
 assert.doesNotMatch(css,/line-clamp|text-overflow:ellipsis/);
});
test('standalone and support opening plus redraw reset stale sheet scroll without extra draws',async()=>{
 const h=supportHarness(),sheet=h.query('.mo-sheet');sheet.scrollTop=900;sheet.scrollLeft=8;
 await h.entry.click();assert.equal(sheet.scrollTop,0);assert.equal(sheet.scrollLeft,0);assert.equal(h.draws(),0);
 sheet.scrollTop=900;await h.api.open();assert.equal(sheet.scrollTop,0);assert.equal(h.draws(),0);
 await h.query('.mo-form').emit('submit');await h.finishFlips();sheet.scrollTop=900;
 await h.query('.mo-close').click();await h.api.open();assert.equal(sheet.scrollTop,0);assert.equal(h.draws(),1);
 sheet.scrollTop=900;await h.query('[data-action="redraw"]').click();await h.finishFlips();assert.equal(sheet.scrollTop,0);assert.equal(h.draws(),2);
});
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
 assert.deepEqual(h.loaded,['./lunea-message-oracle-v1.js?v=103','./lunea-message-oracle-ui-v1.js?v=20260912-message-polish-1']);
 assert.equal(h.query('#luneaMessageOracleOverlay').dataset.open,'true');assert.equal(h.draws(),0);
 assert.ok(h.document.head.children.findIndex(n=>n.id==='luneaMessageOracleStyle')>=0);
});

test('real Home markup uses existing expandable category handler and never opens a Tarot spread',async()=>{
 const h=harness();const header=h.query('.category-header'),category=h.query('#luneaSignalMessageSection');
 const logo=h.query('.message-oracle-home-logo');assert.equal(logo.tagName,'img');assert.equal(logo.getAttribute('src'),'./assets/message-oracle/message_oracle_logo.png?v=101');assert.equal(logo.getAttribute('aria-hidden'),'true');
 assert.equal(h.query('.message-oracle-home-contexts').textContent,'연애 · 재회 · 결과 · 업무 · SNS');
 assert.equal(header.getAttribute('aria-expanded'),'false');await header.click();assert.equal(header.getAttribute('aria-expanded'),'true');assert.equal(category.classList.contains('active'),true);
 await header.emit('keydown',{key:'Enter'});assert.equal(header.getAttribute('aria-expanded'),'false');assert.equal(h.entry.matches('.reading-item'),false);assert.equal(h.draws(),0);
});

test('Home Message section gains moderate weight without becoming a hero tile',()=>{
 const css=read('index.html').match(/\/\* Expandable Message tool section;[\s\S]*?#luneaMessageOracleLoadStatus\{[^}]*\}/)?.[0]||'';
 const px=(selector,property)=>Number(css.match(new RegExp(`${selector}\\{[^}]*${property}:([\\d.]+)px`))?.[1]);
 const logo=px('#luneaSignalMessageSection \\.message-oracle-home-logo','width');
 const padding=px('#luneaSignalMessageSection \\.category-header','padding');
 const oldHeight=50+16*2,newHeight=logo+padding*2;
 assert.equal(logo,56);assert.ok(newHeight/oldHeight>=1.20&&newHeight/oldHeight<=1.30,newHeight/oldHeight);
 assert.equal(px('#luneaSignalMessageSection \\.cat-text h3','font-size'),15.5);assert.equal(px('#luneaSignalMessageSection \\.cat-text p','font-size'),12);
 assert.match(css,/\.message-oracle-home-contexts\{[^}]*white-space:normal;[^}]*overflow-wrap:anywhere/);
 assert.match(css,/\.cat-left\{[^}]*min-width:0;[^}]*align-items:center/);assert.match(css,/\.toggle\{[^}]*flex:0 0 auto/);
});

test('Home and overlay reuse the byte-locked approved transparent logo',()=>{
 const b=fs.readFileSync(new URL('../assets/message-oracle/message_oracle_logo.png',import.meta.url));assert.equal(b.length,1432655);assert.equal(createHash('sha256').update(b).digest('hex'),'dcd1da89454db6add489b35d3358daab80319e53b56ecb4687d9baf136cf4b0a');assert.equal(b.subarray(1,4).toString(),'PNG');
 const h=harness();assert.equal(h.query('.mo-symbol').getAttribute('src'),h.query('.message-oracle-home-logo').getAttribute('src'));
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
test('all seven contexts produce four concise labeled cells and context-safe presentation',async()=>{
 const questions={LOVE:'그가 연락할까?',REUNION:'전남친이 다시 연락할까?',OFFICIAL:'심사 결과 연락 올까?',WORK_BIZ:'면접 결과 연락 올까?',SOCIAL:'내 인스타 스토리 보고 있을까?',PERSONAL:'오래 연락 없던 친구 소식 올까?',GENERAL:'새로운 소식이 궁금해'};
 for(const c of ['LOVE','REUNION','OFFICIAL','WORK_BIZ','SOCIAL','PERSONAL','GENERAL']){
  const h=harness({reduced:true});await h.entry.click();h.query('#moQuestion').value=questions[c];await h.query('[data-context="'+c+'"]').click();await h.query('.mo-form').emit('submit');
  const cells=h.query('.mo-details').children;assert.equal(cells.length,4);for(const cell of cells){assert.equal(cell.children.length,2);assert.ok(cell.children[0].textContent.length<=5);assert.ok(cell.children[1].textContent.length<=5)}
  const row=JSON.parse(h.map.get('LUNEA_MESSAGE_ORACLE_LAST_V1')),d=h.context.LUNEA_MESSAGE_ORACLE_V1.describe(row),reading=h.context.LUNEA_MESSAGE_ORACLE_V1.interpret(row);
  const shown=h.context.__messagePresentation.visibleMessage(d);assert.equal(h.query('.mo-score').textContent,d.score+'%');assert.equal(h.query('.mo-bottom').textContent,h.context.LUNEA_MESSAGE_ORACLE_V1.CONTEXTS[c]);assert.ok(h.query('.mo-full-text').textContent.includes(reading.fullMessage));assert.equal(h.query('.mo-message').textContent,shown);assert.equal(shown,reading.shortMessage);
  if(c==='OFFICIAL'||c==='WORK_BIZ')assert.equal(cells[0].children[0].textContent,'통지');if(c==='SOCIAL')assert.equal(cells[0].children[0].textContent,'관찰');
 }
});

test('non-romantic priority cards use context-safe visible messages without changing scores',()=>{
 const h=harness(),api=h.context.LUNEA_MESSAGE_ORACLE_V1,p=h.context.__messagePresentation;
 const codes=['Devil','Tower','Justice','Hierophant','Judgement','World','High Priestess','Swords11','Swords08','Cups02','Fool'];
 for(const context of ['OFFICIAL','WORK_BIZ','SOCIAL','PERSONAL','GENERAL'])for(const code of codes){
  const result=api.result('합성 비연애 질문',context,code),before=result.score,d=api.describe(result),message=p.visibleMessage(d);
  const guidance=p.visibleContextMessage(d);assert.ok(message.length>=20&&message.length<=60,context+' '+code);assert.doesNotMatch(message+' '+guidance,/강한 관심|집착성|호감|연애/);assert.equal(result.score,before);
 }
});

test('UI delegates all 78 x 7 visible messages and details to the engine without copied composition',()=>{
 const h=harness(),api=h.context.LUNEA_MESSAGE_ORACLE_V1,p=h.context.__messagePresentation;
 const nonRomantic=new Set(['OFFICIAL','WORK_BIZ','SOCIAL','PERSONAL','GENERAL']);
 for(const card of api.cards){
  for(const context of Object.keys(api.CONTEXTS)){
   const result=api.result('합성 연락 질문',context,card.code),score=result.score,d=api.describe(result),reading=api.interpret(result);
   assert.equal(p.visibleMessage(d),reading.shortMessage,`${card.code} ${context} short`);
   assert.equal(p.visibleContextMessage(d),reading.fullMessage,`${card.code} ${context} full`);
   assert.deepEqual(JSON.parse(JSON.stringify(p.detailCells(d))),JSON.parse(JSON.stringify(reading.details)),`${card.code} ${context} details`);
   assert.equal(result.score,score);assert.equal(reading.score,score);
   if(nonRomantic.has(context))assert.doesNotMatch(reading.shortMessage+' '+reading.fullMessage,/사랑|호감|연애\s*감정|마음/,`${card.code} ${context} wording`);
  }
 }
 const source=read('lunea-message-oracle-ui-v1.js');assert.doesNotMatch(source,/const CONTEXT_COPY|const FORM_COPY|function messageFormGroup/);
});

test('Devil work result distinguishes contact strength from outcome and gives concrete details',async()=>{
 const h=harness({reduced:true}),api=h.context.LUNEA_MESSAGE_ORACLE_V1,p=h.context.__messagePresentation;
 const result=api.result('면접 결과','WORK_BIZ','Devil'),d=api.describe(result);
 assert.equal(d.score,67);
 assert.equal(p.visibleMessage(d),'결과 통지 신호는 중간 이상이에요. 제약·압박으로 검토가 반복되며, 연락과 긍정 결과는 별개예요.');
 assert.deepEqual(JSON.parse(JSON.stringify(p.detailCells(d))),[
  {label:'통지',value:'중간 이상'},{label:'검토',value:'반복 가능'},{label:'제약',value:'큼'},{label:'속도',value:'지연 가능'}
 ]);
 api.storage(h.context.localStorage).remember(result);await h.entry.click();
 assert.equal(h.query('.mo-message').textContent,p.visibleMessage(d));assert.doesNotMatch(h.query('.mo-full-text').textContent,/강한 관심|집착성/);assert.match(h.query('#moScoreNote').textContent,/합격·승인·긍정 결과 확률이 아니/);assert.match(h.query('.mo-question-summary').textContent,/결과 방향과 별도/);
 assert.deepEqual(h.query('.mo-details').children.map(cell=>cell.children.map(n=>n.textContent)),[['통지','중간 이상'],['검토','반복 가능'],['제약','큼'],['속도','지연 가능']]);
 await h.query('[data-action="copy"]').click();assert.doesNotMatch(h.copied(),/강한 관심|집착성/);assert.match(h.copied(),/합격·승인·긍정 결과 확률이 아니라/);
});
test('all 78 restored identities get stable names and upright canonical images without drawing',async()=>{
 const h=harness({reduced:true}),api=h.context.LUNEA_MESSAGE_ORACLE_V1;
 for(const c of api.cards){const row=api.result('합성 복원 질문','GENERAL',c.code);api.storage(h.context.localStorage).save(row)}
 await h.entry.click();for(const button of h.query('.mo-saved-list').children){await button.click();assert.ok(h.query('.mo-name-en').textContent);assert.ok(h.query('.mo-name-ko').textContent);assert.ok(h.query('.mo-image').alt);assert.equal(h.query('.mo-card').dataset.face,'front')}
 assert.equal(h.draws(),0);assert.equal(h.animations(),0);
});


test('score typography distinguishes 9%, 34%, 57%, 67% and 100% without changing a result',()=>{
 const h=harness();for(const [score,digits] of [[9,'1'],[34,'2'],[57,'2'],[67,'2'],[68,'2'],[100,'3']]){h.context.__messagePresentation.renderScore(score);assert.equal(h.query('.mo-score-text').textContent,score+'%');assert.equal(h.query('.mo-score').textContent,score+'%');assert.equal(h.query('.mo-score').dataset.digits,digits);assert.match(h.query('.mo-score').getAttribute('aria-label'),/결과 성공 확률이 아님/)}assert.equal(h.draws(),0);
});
test('approved source-space slots keep geometry while inner typography is optically centered',()=>{
 const h=harness(),css=h.query('#luneaMessageOracleStyle').textContent;
 const rule=name=>css.match(new RegExp(`#luneaMessageOracleOverlay \\.${name}\\{([^}]*)\\}`))?.[1]||'';
 const value=(body,property)=>Number(body.match(new RegExp(`${property}:([\\d.]+)%`))?.[1]);
 const specs={
  'mo-score':{x:359,y:89,w:126,h:126},
  'mo-message':{x:101,y:875,w:643,h:201},
  'mo-bottom':{x:293,y:1254,w:259,h:52}
 };
 for(const [name,expected] of Object.entries(specs)){
  const body=rule(name);assert.ok(body,name);
  const actual={x:value(body,'left')*846/100,y:value(body,'top')*1399/100,w:value(body,'width')*846/100,h:value(body,'height')*1399/100};
  for(const key of Object.keys(expected))assert.ok(Math.abs(actual[key]-expected[key])<.001,`${name} ${key}: ${actual[key]}`);
  assert.match(body,/display:flex/);assert.match(body,/align-items:center/);assert.match(body,/justify-content:center/);assert.match(body,/text-align:center/);assert.doesNotMatch(body,/transform:/);
 }
 assert.equal(specs['mo-score'].x+specs['mo-score'].w/2,422);assert.equal(specs['mo-score'].y+specs['mo-score'].h/2,152);
 assert.equal(specs['mo-message'].x+specs['mo-message'].w/2,422.5);assert.equal(specs['mo-message'].y+specs['mo-message'].h/2,975.5);
 assert.equal(specs['mo-bottom'].x+specs['mo-bottom'].w/2,422.5);assert.equal(specs['mo-bottom'].y+specs['mo-bottom'].h/2,1280);
 assert.match(rule('mo-message'),/margin:0/);assert.match(rule('mo-message'),/padding:0/);assert.match(rule('mo-bottom'),/line-height:1/);
 const scoreText=rule('mo-score-text'),messageInner=rule('mo-message-inner'),messageText=rule('mo-message-text');
 assert.match(scoreText,/display:grid/);assert.match(scoreText,/place-items:center/);assert.match(scoreText,/line-height:1/);assert.match(scoreText,/transform:translateY\(-\.30303cqw\)/);
 assert.match(messageInner,/display:flex/);assert.match(messageInner,/align-items:center/);assert.match(messageInner,/justify-content:center/);assert.match(messageInner,/width:88%/);assert.match(messageInner,/max-height:100%/);
 assert.match(messageText,/margin:0/);assert.match(messageText,/font:500 4\.242424cqw\/1\.46/);assert.match(messageText,/text-align:center/);
});
test('title and each detail pair are centered as compact typographic units',()=>{
 const h=harness(),css=h.query('#luneaMessageOracleStyle').textContent;
 const rule=name=>css.match(new RegExp(`#luneaMessageOracleOverlay \\.${name}\\{([^}]*)\\}`))?.[1]||'';
 assert.match(rule('mo-identity'),/display:grid/);assert.match(rule('mo-identity'),/grid-template: minmax\(0,1fr\)\/minmax\(0,1fr\)/);assert.match(rule('mo-identity'),/place-items:stretch/);
 assert.match(rule('mo-identity-inner'),/display:grid/);assert.match(rule('mo-identity-inner'),/place-content:center/);assert.match(rule('mo-identity-inner'),/place-self:stretch/);assert.match(rule('mo-identity-inner'),/margin:0 4%/);assert.match(rule('mo-identity-inner'),/text-align:center/);
 assert.match(rule('mo-detail'),/display:grid/);assert.match(rule('mo-detail'),/place-content:center/);assert.match(rule('mo-detail'),/place-items:center/);assert.match(rule('mo-detail'),/gap:\.30303cqw/);
 assert.match(rule('mo-detail-label'),/margin:0/);assert.match(rule('mo-detail-value'),/margin:0/);
 assert.ok(h.query('.mo-identity-inner'));assert.ok(h.query('.mo-message-inner'));assert.ok(h.query('.mo-message-text'));
});
test('header uses the approved transparent PNG logo and styles scope the dark input override to Message',()=>{
 const h=harness();assert.equal(h.query('.mo-symbol').tagName,'img');assert.equal(h.query('.mo-symbol').getAttribute('src'),'./assets/message-oracle/message_oracle_logo.png?v=101');assert.equal(h.query('.mo-symbol').getAttribute('aria-hidden'),'true');
 const css=h.query('#luneaMessageOracleStyle').textContent;assert.match(css,/color:#393140!important;-webkit-text-fill-color:#393140!important/);assert.match(css,/\.mo-card-front\{[^}]*background:transparent/);assert.match(css,/mask-image:url\('[^']*message_oracle_front_mask.png/);assert.match(css,/mask-image:url\('[^']*message_oracle_back_mask.png/);
});
