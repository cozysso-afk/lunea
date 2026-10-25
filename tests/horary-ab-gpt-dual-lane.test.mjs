import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

for(const file of [
  'lunea-horary-ab-v1.js',
  'lunea-horary-question-modes-v37.js',
  'lunea-reading-consistency-v1.js',
  'lunea-reading-journal-v2.js',
  'lunea-journal-detail-v51.js'
]) execFileSync(process.execPath,['--check',file]);

const guardSource=fs.readFileSync('lunea-horary-ab-v1.js','utf8');
const modeSource=fs.readFileSync('lunea-horary-question-modes-v37.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/saveChatgpt\(readingKey,checked\)/);
assert.match(html,/chatgptMeta:/);
assert.match(html,/saveCurrentReading\(\{quiet:true\}\)/);
assert.match(guardSource,/return original\.call\(this,event\)/,'A/B must not short circuit normal chart computation');

const handlers=[];
const nodes={};
function element(){
  const classes=new Set();
  return {
    id:'',textContent:'',dataset:{},children:[],
    classList:{add:s=>classes.add(s),remove:s=>classes.delete(s),contains:s=>classes.has(s),toggle:(s,v)=>v?classes.add(s):classes.delete(s)},
    replaceChildren(...x){this.children=x},
    appendChild(x){this.children.push(x)},
    querySelector(){return null},
    insertAdjacentElement(_pos,x){nodes[x.id]=x},
    addEventListener(){},
  };
}
let runCount=0;
nodes.astroHoraryRun=element();
nodes.astroHoraryRun.onclick=()=>{runCount++};
nodes.astroHoraryQuestion=element();
nodes.astroHoraryResult=element();
nodes.astroHoraryOverlay=element();
const document={
  readyState:'loading',
  head:element(),
  getElementById:id=>nodes[id]||null,
  createElement:()=>element(),
  addEventListener:(name,fn)=>{handlers.push([name,fn]);},
};
const window={fetch:async()=>({ok:false})};
class MutationObserver{observe(){}}
const ctx={document,window,MutationObserver,console,setInterval:()=>1,clearInterval:()=>{},setTimeout:()=>1};
vm.runInNewContext(guardSource,ctx);
for(const [name,fn] of handlers.filter(x=>x[0]==='DOMContentLoaded'))fn();
const guard=window.LUNEA_HORARY_MULTI_GUARD;
assert.ok(guard,'guard exported');
const same='A와 B 두 사람 중 누가 언제 나에게 연락할까?';
assert.equal(guard.isMultiPersonQuestion(same),true);
assert.equal(guard.resolveTargets(same).assignable,false);
assert.equal(guard.isMultiPersonQuestion('A는 내 전남친, B는 내 친구 중 누가 연락할까?'),true);
const roles=guard.resolveTargets('A는 내 전남친, B는 내 친구 중 누가 연락할까?');
assert.equal(roles.assignable,true);
assert.equal(roles.A.house,7);
assert.equal(roles.B.house,11);
assert.equal(guard.resolveTargets('A는 내 전남친, B는 내 연인 중 누가 연락할까?').assignable,false);
nodes.astroHoraryQuestion.value=same;
nodes.astroHoraryRun.onclick();
assert.equal(runCount,1,'A/B must calculate original chart once');
assert.equal(nodes.luneaHoraryMultiGuard?.classList.contains('show'),true);

let modeReady;
document.addEventListener=(name,fn)=>{if(name==='DOMContentLoaded')modeReady=fn};
vm.runInNewContext(modeSource,ctx);
modeReady();
const modes=window.LUNEA_HORARY_QUESTION_MODES_V37;
assert.equal(modes.classifyQuestion(same).key,'timing');
assert.equal(modes.classifyQuestion(same).multiPerson,true);
assert.equal(modes.classifyQuestion('A와 B 중 누가 더 연락할 가능성이 있어?').key,'comparison');
assert.equal(modes.classifyQuestion('언제 연락이 올까?').multiPerson,undefined);
console.log('Horary A/B and ChatGPT dual-lane regression PASS');
