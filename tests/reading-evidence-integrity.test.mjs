import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const html=read('index.html');
function aiHarness(){
 const nodes={aiRead:{},aiBox:{}};
 Object.defineProperty(nodes.aiBox,'innerHTML',{set(){nodes.aiText={textContent:'pending'}}});
 const pending=[];
 const c={window:{},$:id=>nodes[id],state:{category:'LOVE',title:'마음',question:'그 사람 마음은?',positions:['마음'],drawn:[{name:'Two of Cups',position:'마음',isReversed:false,subCards:[]}]},localStorage:{getItem:()=> 'synthetic'},flipAt(){},promptString:()=> 'synthetic prompt',fetch:()=>new Promise((resolve,reject)=>pending.push({resolve,reject})),alert(){}};
 vm.runInNewContext(html.split('\n').find(l=>l.startsWith("$('aiRead').onclick=")),c);
 const resolve=(i,text)=>pending[i].resolve({json:async()=>({candidates:[{content:{parts:[{text}]}}]})});
 return {c,nodes,pending,resolve};
}
test('completed response appears only in its original reading',async()=>{const h=aiHarness();const p=h.nodes.aiRead.onclick();h.resolve(0,'valid');await p;assert.equal(h.nodes.aiText.textContent,'valid');assert.equal(h.nodes.aiRead.disabled,false)});
for(const change of ['question','card','subcard','position','node','epoch'])test(`stale response cannot write after ${change} changes`,async()=>{
 const h=aiHarness(),p=h.nodes.aiRead.onclick();
 if(change==='question')h.c.state.question='새 질문';
 if(change==='card')h.c.state.drawn[0].isReversed=true;
 if(change==='subcard')h.c.state.drawn[0].subCards.push({name:'The Tower'});
 if(change==='position')h.c.state.drawn[0].position='장애물';
 if(change==='node')h.nodes.aiText={textContent:'new reading'};
 if(change==='epoch')h.c.window.__luneaAiEpoch++;
 h.resolve(0,'stale');await p;assert.notEqual(h.nodes.aiText.textContent,'stale');
});
test('older response or failure cannot overwrite a newer request or release its button',async()=>{
 for(const fail of [false,true]){const h=aiHarness();const a=h.nodes.aiRead.onclick(),b=h.nodes.aiRead.onclick();if(fail)h.pending[0].reject(Error('old failure'));else h.resolve(0,'old');await a;assert.equal(h.nodes.aiRead.disabled,true);assert.equal(h.nodes.aiText.textContent,'pending');h.resolve(1,'new');await b;assert.equal(h.nodes.aiText.textContent,'new');assert.equal(h.nodes.aiRead.disabled,false)}
});
test('selecting even the same spread invalidates an in-flight request immediately',async()=>{
 const h=aiHarness();for(const id of ['sheetCat','sheetTitle','sheetDesc','drawLabel','sheet'])h.nodes[id]={classList:{add(){}}};
 vm.runInNewContext(html.split('\n').find(l=>l.startsWith('function openSheet('))+';this.open=openSheet;',h.c);
 const p=h.nodes.aiRead.onclick();h.c.open('LOVE','마음','',1);h.resolve(0,'stale');await p;assert.notEqual(h.nodes.aiText.textContent,'stale');assert.equal(h.nodes.aiRead.disabled,false);
});
test('new and partial profiles do not inherit fabricated fields; saved values remain',()=>{
 const a=html.indexOf('let profile='),b=html.indexOf('function esc(',a);
 for(const saved of [{},{saju:'庚(경금)'},{saju:'癸(계수)',zodiac:'Scorpio ♏ (전갈자리)',thaiDay:'화요일'}]){
 const c={document:{},localStorage:{getItem:()=>JSON.stringify(saved)}};vm.runInNewContext(html.slice(a,b)+';this.result=profile;',c);
 assert.equal(c.result.saju,saved.saju||'');assert.equal(c.result.zodiac,saved.zodiac||'');assert.equal(c.result.thaiDay,saved.thaiDay||'');
 }
});
test('profile saving accepts explicit blank fields and preserves unrelated saved fields',()=>{
 const source=read('profile-advanced-v2.js');const nodes={saveProfile:{},thai:{value:''},saju:{value:''},zodiac:{value:''}};let saved;
 const c={FALLBACK:{saju:'庚(경금)',zodiac:'Pisces',thaiDay:'목요일'},BIRTH_TIME_KEY:'time',BIRTH_PLACE_KEY:'place',window:{},document:{getElementById:id=>nodes[id]},readProfile:()=>({saju:'old',zodiac:'old',thaiDay:'old',custom:'keep'}),getDetailFromForm:()=>({}),writeProfile:p=>{saved=p},syncProfile(){},hideOverlay(){},alert(){},localStorage:{setItem(){},removeItem(){}},profile:{}};
 const start=source.indexOf('  function installSaveHandler()'),end=source.indexOf('  function ',start+12);
 vm.runInNewContext(source.slice(start,end)+'installSaveHandler();',c);nodes.saveProfile.onclick();assert.equal(saved.saju,'');assert.equal(saved.zodiac,'');assert.equal(saved.thaiDay,'');assert.equal(saved.custom,'keep');
});
test('other-person questions with 나한테/내가 stay on the other-person axis',()=>{
 const w={addEventListener(){}};const c={window:w,document:{readyState:'loading'},console,setInterval(){},setTimeout(){},clearInterval(){}};
 vm.runInNewContext(read('lunea-final-prompt-priority-v1.js'),c);const api=w.LUNEA_FINAL_PROMPT_PRIORITY_V1;
 for(const q of ['그 사람은 나한테 어떤 마음이야?','걔는 내가 보고 싶다는 생각을 할까?','상대는 나에게 어떤 감정이 있어?'])assert.equal(api.classify(q),'other_focused',q);
 for(const q of ['내가 이직할까?','상대 마음은 어떻고 내가 어떻게 해야 해?'])assert.equal(api.classify(q),'self_relevant',q);
});
