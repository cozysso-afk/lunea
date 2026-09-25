import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lunea-horary-mobile-actions-v45.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../lunea-astro-origin-failover-v57.js', import.meta.url), 'utf8');

assert.match(loader, /lunea-horary-post-actions-v44\.js\?v=441/);
assert.match(loader, /lunea-horary-mobile-actions-v45\.js\?v=450/);
assert.match(source, /pointerdown/);
assert.match(source, /pointerup/);
assert.match(source, /getBoundingClientRect/);
assert.match(source, /LUNEA_PRASHNA_V1\?\.run/);
assert.match(source, /repairLatestHoraryArchive/);

const handlers = new Map();
const calls = {prashna:0, save:0};

function button(id,left,top,width=120,height=44) {
  return {
    id,
    disabled:false,
    textContent:id,
    isConnected:true,
    type:'button',
    style:{setProperty(){}},
    classList:{contains(){return true;},add(){}},
    getBoundingClientRect(){return {left,top,right:left+width,bottom:top+height,width,height};},
    closest(selector){return selector.includes(`#${id}`) ? this : null;}
  };
}

const prashna = button('luneaPrashnaRunV1',10,100);
const save = button('astroHorarySave',10,160);
const result = {
  id:'astroHoraryResult',
  innerText:'HORARY RESULT',
  textContent:'HORARY RESULT',
  classList:{contains(name){return name === 'show';}}
};
const actions = {id:'astroHoraryActions',style:{setProperty(){}}};
const prashnaCard = {id:'luneaPrashnaV1Card',style:{setProperty(){}}};
const nodes = new Map([
  [prashna.id,prashna],[save.id,save],[result.id,result],
  [actions.id,actions],[prashnaCard.id,prashnaCard]
]);

const document = {
  readyState:'complete',
  documentElement:{},
  body:{appendChild(){}},
  getElementById(id){return nodes.get(id) || null;},
  addEventListener(type,fn){handlers.set(type,fn);},
  createElement(){return {style:{},setAttribute(){},focus(){},select(){},setSelectionRange(){},remove(){}};},
  execCommand(){return true;}
};

const context = {
  console,
  document,
  navigator:{clipboard:{writeText:async()=>{}}},
  localStorage:{getItem(){return null;}},
  alert(){},
  setInterval(){return 1;},
  clearInterval(){},
  setTimeout(fn){fn(); return 1;},
  clearTimeout(){},
  MutationObserver:undefined,
  fetch:async()=>({ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text:'AI'}]}}]})}),
  performance:{now:()=>Date.now()},
  window:null
};
context.window = context;
context.PointerEvent = function PointerEvent(){};
context.getComputedStyle = () => ({display:'block',visibility:'visible',pointerEvents:'auto'});
context.LUNEA_PRASHNA_V1 = {run:async()=>{calls.prashna += 1;}};
context.LUNEA_HORARY_POST_ACTIONS_V44 = {
  aiPrompt:()=> 'prompt',
  copyPayload:()=> 'copy text',
  repairLatestHoraryArchive:async()=>{calls.save += 1;}
};

vm.createContext(context);
vm.runInContext(source,context);

assert.ok(context.LUNEA_HORARY_MOBILE_ACTIONS_V45, 'V45 API should install');
assert.equal(typeof handlers.get('pointerdown'),'function');
assert.equal(typeof handlers.get('pointerup'),'function');

function tap(node,x,y,pointerId) {
  const eventBase = {
    pointerType:'touch',pointerId,clientX:x,clientY:y,target:node,
    preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}
  };
  handlers.get('pointerdown')(eventBase);
  handlers.get('pointerup')({...eventBase});
}

tap(prashna,20,110,1);
await Promise.resolve();
await Promise.resolve();
assert.equal(calls.prashna,1,'Prashna tap must invoke run directly');

tap(save,20,170,2);
await Promise.resolve();
await Promise.resolve();
assert.equal(calls.save,1,'Horary save tap must invoke Journal/archive repair directly');

// Transparent hit-test layer: target is not the button, but coordinates are.
const blocker = {closest(){return null;}};
tap(blocker,20,110,3);
await Promise.resolve();
await Promise.resolve();
assert.equal(calls.prashna,2,'coordinate hit-test must recover a covered Prashna button');

// Scroll gesture must not accidentally activate.
const down = {pointerType:'touch',pointerId:4,clientX:20,clientY:110,target:prashna,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}};
handlers.get('pointerdown')(down);
handlers.get('pointerup')({...down,clientY:150});
await Promise.resolve();
assert.equal(calls.prashna,2,'movement over threshold must be treated as scroll, not tap');

console.log('LUNEA Horary + Prashna mobile action owner V45 runtime tap regression: PASS');
