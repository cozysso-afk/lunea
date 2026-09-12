import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../lunea-runtime-state-v56.js',import.meta.url),'utf8');

test('draft hydration suppresses observers and invalidates pre-restore cleanup timers',()=>{
  const observers=[],timers=[],spreadQuestion={id:'spreadQuestion',textContent:'“기존 질문”'},elements=new Map([['spreadQuestion',spreadQuestion]]);
  const document={readyState:'complete',hidden:false,body:{},documentElement:{dataset:{}},getElementById:id=>elements.get(id)||null,querySelectorAll:()=>[],addEventListener(){}};
  class MutationObserver{constructor(cb){this.callback=cb;observers.push(this)}observe(target){this.target=target}}
  const localStorage={getItem:()=>null,removeItem(){}};const window={window:null,state:{question:'기존 질문'},addEventListener(){}};window.window=window;
  vm.runInNewContext(source,{window,document,localStorage,MutationObserver,requestAnimationFrame:f=>f(),setInterval:()=>1,clearInterval(){},setTimeout:f=>{timers.push(f);return timers.length},console});
  const api=window.LUNEA_RUNTIME_STATE_V56,questionObserver=observers.find(o=>o.target===spreadQuestion);assert.ok(questionObserver);
  api.beginDraftRestore();spreadQuestion.textContent='“복원 질문”';window.state.question='복원 질문';questionObserver.callback();assert.equal(document.documentElement.dataset.luneaAuxBoundary,undefined);
  api.endDraftRestore();spreadQuestion.textContent='“진짜 새 질문”';window.state.question='진짜 새 질문';questionObserver.callback();assert.equal(document.documentElement.dataset.luneaAuxBoundary,'question-change');
  api.beginDraftRestore();const marker={removed:false,remove(){this.removed=true}};elements.set('luneaAstroTransitInline',marker);for(const f of timers.splice(0))f();assert.equal(marker.removed,false);api.endDraftRestore();
});
