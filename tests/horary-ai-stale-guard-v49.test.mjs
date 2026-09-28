import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const genericSource = fs.readFileSync(new URL('../lunea-ai-response-guard-v1.js', import.meta.url), 'utf8');
const horarySource = fs.readFileSync(new URL('../lunea-horary-ai-guard-v49.js', import.meta.url), 'utf8');
const mobileSource = fs.readFileSync(new URL('../lunea-horary-mobile-actions-v45.js', import.meta.url), 'utf8');
const loaderSource = fs.readFileSync(new URL('../lunea-astro-origin-failover-v57.js', import.meta.url), 'utf8');

assert.match(loaderSource, /lunea-ai-response-guard-v1\.js\?v=100/);
assert.match(loaderSource, /lunea-horary-ai-guard-v49\.js\?v=490/);
assert.match(loaderSource, /lunea-horary-mobile-actions-v45\.js\?v=451/);
assert.match(mobileSource, /LUNEA_HORARY_AI_GUARD_V49\?\.runAI/);

const classes = (...initial) => {
  const set = new Set(initial);
  return {
    contains(value){ return set.has(value); },
    add(value){ set.add(value); },
    remove(value){ set.delete(value); }
  };
};

const nodes = {
  astroHoraryQuestion:{value:'이 일은 성사될까?'},
  astroHoraryMoment:{value:'2026-09-28T20:20'},
  astroHoraryPlace:{value:'Seoul'},
  astroHoraryTopic:{value:'general'},
  astroHoraryResult:{classList:classes('show'),innerText:'RESULT A',textContent:'RESULT A'},
  astroHoraryAIText:{classList:classes(),textContent:''},
  astroHoraryAI:{
    textContent:'🔮 호라리 AI 해석',
    disabled:false,
    dataset:{},
    isConnected:true,
    onclick:null
  },
  luneaPrashnaV1Result:{innerText:'',textContent:''}
};

const alerts = [];
const window = {
  LUNEA_HORARY_POST_ACTIONS_V44:{aiPrompt(){return `PROMPT:${nodes.astroHoraryResult.innerText}`;}},
  addEventListener(){}
};
window.window = window;
const document = {
  readyState:'loading',
  documentElement:{},
  getElementById(id){ return nodes[id] || null; },
  addEventListener(){},
};
const localStorage = {
  getItem(key){
    if(key === 'LUNEA_API_KEY') return 'test-key';
    if(key === 'LUNEA_MODEL') return 'gemini-test';
    return null;
  }
};

const context = {
  window,
  document,
  localStorage,
  AbortController,
  MutationObserver:class { observe(){} },
  setInterval(){ return 0; },
  clearInterval(){},
  setTimeout(){ return 0; },
  clearTimeout(){},
  alert(message){ alerts.push(String(message)); },
  console:{info(){},warn(){},error(){}},
  Map,
  Set,
  Object,
  Array,
  String,
  Number,
  Math,
  Error,
  Promise,
  fetch:null
};

vm.createContext(context);
vm.runInContext(genericSource, context);
vm.runInContext(horarySource, context);

const api = window.LUNEA_HORARY_AI_GUARD_V49;
assert.ok(api, 'Horary AI guard should be exposed');
assert.equal(api.version, '49.0');

let resolveFirst;
context.fetch = () => new Promise(resolve => { resolveFirst = resolve; });
const firstRun = api.runAI(nodes.astroHoraryAI);
assert.equal(nodes.astroHoraryAI.disabled, true);
assert.equal(typeof resolveFirst, 'function');

nodes.astroHoraryResult.innerText = 'RESULT B';
nodes.astroHoraryResult.textContent = 'RESULT B';
resolveFirst({
  ok:true,
  status:200,
  async json(){ return {candidates:[{finishReason:'STOP',content:{parts:[{text:'OLD ANSWER'}]}}]}; }
});
await firstRun;
assert.doesNotMatch(nodes.astroHoraryAIText.textContent, /OLD ANSWER/);
assert.match(nodes.astroHoraryAIText.textContent, /이전 AI 응답은 버렸어/);
assert.equal(nodes.astroHoraryAI.disabled, false);

context.fetch = async () => ({
  ok:true,
  status:200,
  async json(){ return {candidates:[{finishReason:'STOP',content:{parts:[{text:'현재 '},{text:'답변'}]}}]}; }
});
await api.runAI(nodes.astroHoraryAI);
assert.equal(nodes.astroHoraryAIText.textContent, '현재 답변');

context.fetch = async () => ({
  ok:true,
  status:200,
  async json(){ return {candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'TRUNCATED'}]}}]}; }
});
await api.runAI(nodes.astroHoraryAI);
assert.match(nodes.astroHoraryAIText.textContent, /길이 제한에서 잘렸어/);
assert.doesNotMatch(nodes.astroHoraryAIText.textContent, /TRUNCATED$/);
assert.equal(alerts.length, 0);

console.log('Horary AI stale-response guard V49 runtime contract: PASS');
